-- F-002B package commitments and balance projection.
-- Keeps package writes behind scoped, audited RPC functions.

alter table public.packages
add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'packages_idempotency_key_length'
      and conrelid = 'public.packages'::regclass
  ) then
    alter table public.packages
      add constraint packages_idempotency_key_length
      check (idempotency_key is null or length(btrim(idempotency_key)) >= 8);
  end if;
end;
$$;

create unique index if not exists packages_tenant_idempotency_key_unique
on public.packages (tenant_id, idempotency_key)
where idempotency_key is not null;

create or replace function public.f002_actor_tenant_for_package_management()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  active_membership_count integer;
begin
  if actor_user_id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select count(*)::integer, (array_agg(tm.tenant_id order by tm.created_at))[1]
    into active_membership_count, actor_tenant_id
  from public.tenant_memberships tm
  where tm.auth_user_id = actor_user_id
    and tm.status = 'active';

  if active_membership_count <> 1 or actor_tenant_id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  if not public.f001_has_active_role(
    actor_tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    actor_tenant_id
  ) then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  return actor_tenant_id;
end;
$$;

create or replace function public.f002_package_line_balance(target_package_line_id uuid)
returns table (
  package_line_id uuid,
  committed numeric,
  reserved numeric,
  consumed numeric,
  released numeric,
  adjustments numeric,
  available numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      target_package_line_id as package_line_id,
      coalesce(sum(quantity) filter (
        where entry_type in ('commitment_added', 'contract_amendment')
      ), 0)::numeric as committed,
      coalesce(sum(quantity) filter (
        where entry_type = 'quantity_reserved'
      ), 0)::numeric as reserved_total,
      coalesce(sum(quantity) filter (
        where entry_type = 'reservation_released'
      ), 0)::numeric as released,
      coalesce(sum(quantity) filter (
        where entry_type = 'quantity_consumed'
      ), 0)::numeric as consumed,
      coalesce(sum(quantity) filter (
        where entry_type = 'administrative_adjustment'
      ), 0)::numeric as adjustments
    from public.package_ledger_entries
    where package_line_id = target_package_line_id
  ),
  projected as (
    select
      totals.package_line_id,
      totals.committed,
      greatest(0, totals.reserved_total - totals.released)::numeric as reserved,
      totals.consumed,
      totals.released,
      totals.adjustments
    from totals
  )
  select
    projected.package_line_id,
    projected.committed,
    projected.reserved,
    projected.consumed,
    projected.released,
    projected.adjustments,
    (
      projected.committed
      + projected.adjustments
      - projected.reserved
      - projected.consumed
    )::numeric as available
  from projected;
$$;

create or replace function public.f002_create_package_commitments(
  package_id uuid,
  audit_event_id uuid,
  target_client_id uuid,
  target_contract_id uuid,
  package_name text,
  package_status text default 'draft',
  period_start_date date default null,
  period_end_date date default null,
  line_items jsonb default '[]'::jsonb,
  idempotency_key text default null
)
returns table (
  id uuid,
  tenant_id uuid,
  client_id uuid,
  contract_id uuid,
  name text,
  period_start date,
  period_end date,
  status text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_name text := btrim(package_name);
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  requested_status text := coalesce(package_status, 'draft');
  target_contract public.contracts%rowtype;
  existing_package public.packages%rowtype;
  created_package public.packages%rowtype;
  line_item jsonb;
  line_ordinal integer;
  line_id uuid;
  ledger_entry_id uuid;
  service_label text;
  deliverable_type_hint text;
  unit_label text;
  committed_quantity numeric;
begin
  actor_tenant_id := public.f002_actor_tenant_for_package_management();

  if normalized_name is null or length(normalized_name) < 2 then
    raise exception 'invalid package input'
      using errcode = 'P0001';
  end if;

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if requested_status not in ('draft', 'active', 'completed', 'cancelled', 'archived') then
    raise exception 'invalid package status'
      using errcode = 'P0001';
  end if;

  if period_start_date is not null
     and period_end_date is not null
     and period_start_date > period_end_date then
    raise exception 'invalid package period'
      using errcode = 'P0001';
  end if;

  if jsonb_typeof(line_items) <> 'array' or jsonb_array_length(line_items) = 0 then
    raise exception 'package line required'
      using errcode = 'P0001';
  end if;

  select c.*
    into target_contract
  from public.contracts c
  join public.clients cl
    on cl.id = c.client_id
   and cl.tenant_id = c.tenant_id
   and cl.status = 'active'
  where c.id = target_contract_id
    and c.tenant_id = actor_tenant_id
    and c.client_id = target_client_id
    and c.status in ('draft', 'active');

  if target_contract.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into existing_package
  from public.packages p
  where p.tenant_id = actor_tenant_id
    and p.idempotency_key = normalized_idempotency_key;

  if existing_package.id is not null then
    return query
    select
      existing_package.id,
      existing_package.tenant_id,
      existing_package.client_id,
      existing_package.contract_id,
      existing_package.name,
      existing_package.period_start,
      existing_package.period_end,
      existing_package.status,
      existing_package.created_by,
      existing_package.created_at,
      existing_package.updated_at;
    return;
  end if;

  insert into public.packages (
    id,
    tenant_id,
    client_id,
    contract_id,
    name,
    period_start,
    period_end,
    status,
    idempotency_key,
    created_by
  )
  values (
    package_id,
    actor_tenant_id,
    target_contract.client_id,
    target_contract.id,
    normalized_name,
    period_start_date,
    period_end_date,
    requested_status,
    normalized_idempotency_key,
    actor_user_id
  )
  returning * into created_package;

  for line_item, line_ordinal in
    select value, ordinality::integer
    from jsonb_array_elements(line_items) with ordinality
  loop
    line_id := (line_item ->> 'id')::uuid;
    ledger_entry_id := (line_item ->> 'ledger_entry_id')::uuid;
    service_label := btrim(line_item ->> 'service_label');
    deliverable_type_hint := nullif(btrim(line_item ->> 'deliverable_type_hint'), '');
    unit_label := btrim(line_item ->> 'unit_label');
    committed_quantity := (line_item ->> 'committed_quantity')::numeric;

    if line_id is null
       or ledger_entry_id is null
       or service_label is null
       or length(service_label) < 2
       or unit_label is null
       or length(unit_label) < 1
       or committed_quantity is null
       or committed_quantity < 0 then
      raise exception 'invalid package line'
        using errcode = 'P0001';
    end if;

    insert into public.package_lines (
      id,
      tenant_id,
      client_id,
      package_id,
      service_label,
      deliverable_type_hint,
      unit_label,
      committed_quantity,
      created_by
    )
    values (
      line_id,
      actor_tenant_id,
      target_contract.client_id,
      created_package.id,
      service_label,
      deliverable_type_hint,
      unit_label,
      committed_quantity,
      actor_user_id
    );

    insert into public.package_ledger_entries (
      id,
      tenant_id,
      client_id,
      contract_id,
      package_id,
      package_line_id,
      entry_type,
      quantity,
      actor_user_id,
      idempotency_key
    )
    values (
      ledger_entry_id,
      actor_tenant_id,
      target_contract.client_id,
      target_contract.id,
      created_package.id,
      line_id,
      'commitment_added',
      committed_quantity,
      actor_user_id,
      normalized_idempotency_key || ':line:' || line_ordinal::text
    );
  end loop;

  insert into public.audit_events (
    id,
    tenant_id,
    client_id,
    actor_user_id,
    action,
    decision,
    target_type,
    target_id
  )
  values (
    audit_event_id,
    actor_tenant_id,
    created_package.client_id,
    actor_user_id,
    'PackageCreated',
    'allowed',
    'package',
    created_package.id::text
  );

  return query
  select
    created_package.id,
    created_package.tenant_id,
    created_package.client_id,
    created_package.contract_id,
    created_package.name,
    created_package.period_start,
    created_package.period_end,
    created_package.status,
    created_package.created_by,
    created_package.created_at,
    created_package.updated_at;
end;
$$;

create or replace function public.f002_adjust_package_commitment(
  ledger_entry_id uuid,
  audit_event_id uuid,
  target_package_line_id uuid,
  adjustment_quantity numeric,
  adjustment_reason text,
  idempotency_key text
)
returns table (
  package_line_id uuid,
  committed numeric,
  reserved numeric,
  consumed numeric,
  released numeric,
  adjustments numeric,
  available numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_reason text := nullif(btrim(adjustment_reason), '');
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  target_line public.package_lines%rowtype;
  target_package public.packages%rowtype;
  existing_entry public.package_ledger_entries%rowtype;
  projected_available numeric;
begin
  actor_tenant_id := public.f002_actor_tenant_for_package_management();

  if normalized_reason is null or length(normalized_reason) < 3 then
    raise exception 'adjustment reason required'
      using errcode = 'P0001';
  end if;

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if adjustment_quantity is null or adjustment_quantity = 0 then
    raise exception 'invalid adjustment quantity'
      using errcode = 'P0001';
  end if;

  select *
    into target_line
  from public.package_lines pl
  where pl.id = target_package_line_id
    and pl.tenant_id = actor_tenant_id
    and pl.status = 'active';

  if target_line.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into target_package
  from public.packages p
  where p.id = target_line.package_id
    and p.tenant_id = target_line.tenant_id
    and p.client_id = target_line.client_id;

  if target_package.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into existing_entry
  from public.package_ledger_entries ple
  where ple.tenant_id = actor_tenant_id
    and ple.idempotency_key = normalized_idempotency_key;

  if existing_entry.id is not null then
    return query
    select * from public.f002_package_line_balance(target_line.id);
    return;
  end if;

  select (balance.available + adjustment_quantity)
    into projected_available
  from public.f002_package_line_balance(target_line.id) as balance;

  if projected_available < 0 then
    raise exception 'adjustment would overdraw capacity'
      using errcode = '42501';
  end if;

  insert into public.package_ledger_entries (
    id,
    tenant_id,
    client_id,
    contract_id,
    package_id,
    package_line_id,
    entry_type,
    quantity,
    reason,
    actor_user_id,
    idempotency_key
  )
  values (
    ledger_entry_id,
    actor_tenant_id,
    target_line.client_id,
    target_package.contract_id,
    target_package.id,
    target_line.id,
    'administrative_adjustment',
    adjustment_quantity,
    normalized_reason,
    actor_user_id,
    normalized_idempotency_key
  );

  insert into public.audit_events (
    id,
    tenant_id,
    client_id,
    actor_user_id,
    action,
    decision,
    target_type,
    target_id,
    reason
  )
  values (
    audit_event_id,
    actor_tenant_id,
    target_line.client_id,
    actor_user_id,
    'PackageCommitmentAdjusted',
    'allowed',
    'package_line',
    target_line.id::text,
    'adjustment_recorded'
  );

  return query
  select * from public.f002_package_line_balance(target_line.id);
end;
$$;

revoke all on function public.f002_actor_tenant_for_package_management() from public, anon, authenticated;
revoke all on function public.f002_package_line_balance(uuid) from public, anon, authenticated;
revoke all on function public.f002_create_package_commitments(uuid, uuid, uuid, uuid, text, text, date, date, jsonb, text) from public, anon, authenticated;
revoke all on function public.f002_adjust_package_commitment(uuid, uuid, uuid, numeric, text, text) from public, anon, authenticated;

grant execute on function public.f002_create_package_commitments(uuid, uuid, uuid, uuid, text, text, date, date, jsonb, text) to authenticated;
grant execute on function public.f002_adjust_package_commitment(uuid, uuid, uuid, numeric, text, text) to authenticated;
