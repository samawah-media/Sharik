-- F-002C deliverable creation and package reservation.
-- Keeps deliverable writes behind scoped, audited RPC functions.

alter table public.deliverables
add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'deliverables_idempotency_key_length'
      and conrelid = 'public.deliverables'::regclass
  ) then
    alter table public.deliverables
      add constraint deliverables_idempotency_key_length
      check (idempotency_key is null or length(btrim(idempotency_key)) >= 8);
  end if;
end;
$$;

create unique index if not exists deliverables_tenant_idempotency_key_unique
on public.deliverables (tenant_id, idempotency_key)
where idempotency_key is not null;

create or replace function public.f002_actor_tenant_for_deliverable_create(
  target_client_id uuid,
  approved_extra boolean default false
)
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

  if approved_extra then
    if not public.f001_has_active_role(
      actor_tenant_id,
      array['tenant_owner', 'tenant_administrator'],
      'tenant',
      actor_tenant_id
    ) then
      raise exception 'not authorized'
        using errcode = '42501';
    end if;
  else
    if not (
      public.f001_has_active_role(
        actor_tenant_id,
        array['tenant_owner', 'tenant_administrator'],
        'tenant',
        actor_tenant_id
      )
      or public.f001_has_active_role(
        actor_tenant_id,
        array['account_manager'],
        'client',
        target_client_id
      )
    ) then
      raise exception 'not authorized'
        using errcode = '42501';
    end if;
  end if;

  return actor_tenant_id;
end;
$$;

create or replace function public.f002_create_deliverable_reservation(
  deliverable_id uuid,
  allocation_id uuid,
  ledger_entry_id uuid,
  audit_event_id uuid,
  target_client_id uuid,
  target_contract_id uuid,
  target_package_id uuid,
  target_package_line_id uuid,
  deliverable_name text,
  deliverable_description text default null,
  deliverable_type text default null,
  deliverable_priority text default 'normal',
  owner_user_id_input uuid default null,
  contributor_user_ids_input uuid[] default '{}'::uuid[],
  start_on date default null,
  internal_due_on date default null,
  client_due_on date default null,
  final_due_on date default null,
  requires_internal_approval_input boolean default true,
  requires_client_approval_input boolean default true,
  reserved_quantity numeric default 1,
  idempotency_key text default null
)
returns table (
  id uuid,
  tenant_id uuid,
  client_id uuid,
  contract_id uuid,
  package_id uuid,
  package_line_id uuid,
  name text,
  description text,
  type text,
  status text,
  priority text,
  owner_user_id uuid,
  contributor_user_ids uuid[],
  start_date date,
  internal_due_date date,
  client_due_date date,
  final_due_date date,
  requires_internal_approval boolean,
  requires_client_approval boolean,
  progress_percentage integer,
  approved_extra boolean,
  extra_reason text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  cancelled_at timestamptz,
  revision integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_name text := btrim(deliverable_name);
  normalized_type text := btrim(deliverable_type);
  normalized_description text := nullif(btrim(deliverable_description), '');
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  requested_priority text := coalesce(deliverable_priority, 'normal');
  target_line public.package_lines%rowtype;
  target_package public.packages%rowtype;
  existing_deliverable public.deliverables%rowtype;
  created_deliverable public.deliverables%rowtype;
  line_balance record;
begin
  actor_tenant_id := public.f002_actor_tenant_for_deliverable_create(
    target_client_id,
    false
  );

  if normalized_name is null or length(normalized_name) < 2 then
    raise exception 'invalid deliverable name'
      using errcode = 'P0001';
  end if;

  if normalized_type is null or length(normalized_type) < 1 then
    raise exception 'invalid deliverable type'
      using errcode = 'P0001';
  end if;

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if requested_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'invalid deliverable priority'
      using errcode = 'P0001';
  end if;

  if reserved_quantity is null or reserved_quantity <= 0 then
    raise exception 'invalid reservation quantity'
      using errcode = 'P0001';
  end if;

  if start_on is not null
     and internal_due_on is not null
     and start_on > internal_due_on then
    raise exception 'invalid deliverable dates'
      using errcode = 'P0001';
  end if;

  if internal_due_on is not null
     and client_due_on is not null
     and internal_due_on > client_due_on then
    raise exception 'invalid deliverable dates'
      using errcode = 'P0001';
  end if;

  if client_due_on is not null
     and final_due_on is not null
     and client_due_on > final_due_on then
    raise exception 'invalid deliverable dates'
      using errcode = 'P0001';
  end if;

  select *
    into existing_deliverable
  from public.deliverables d
  where d.tenant_id = actor_tenant_id
    and d.idempotency_key = normalized_idempotency_key;

  if existing_deliverable.id is not null then
    return query
    select
      existing_deliverable.id,
      existing_deliverable.tenant_id,
      existing_deliverable.client_id,
      existing_deliverable.contract_id,
      existing_deliverable.package_id,
      existing_deliverable.package_line_id,
      existing_deliverable.name,
      existing_deliverable.description,
      existing_deliverable.type,
      existing_deliverable.status,
      existing_deliverable.priority,
      existing_deliverable.owner_user_id,
      existing_deliverable.contributor_user_ids,
      existing_deliverable.start_date,
      existing_deliverable.internal_due_date,
      existing_deliverable.client_due_date,
      existing_deliverable.final_due_date,
      existing_deliverable.requires_internal_approval,
      existing_deliverable.requires_client_approval,
      existing_deliverable.progress_percentage,
      existing_deliverable.approved_extra,
      existing_deliverable.extra_reason,
      existing_deliverable.created_by,
      existing_deliverable.created_at,
      existing_deliverable.updated_at,
      existing_deliverable.cancelled_at,
      existing_deliverable.revision;
    return;
  end if;

  select pl.*
    into target_line
  from public.package_lines pl
  join public.packages p
    on p.id = pl.package_id
   and p.tenant_id = pl.tenant_id
   and p.client_id = pl.client_id
   and p.status = 'active'
  join public.contracts c
    on c.id = p.contract_id
   and c.tenant_id = p.tenant_id
   and c.client_id = p.client_id
   and c.status = 'active'
  join public.clients cl
    on cl.id = pl.client_id
   and cl.tenant_id = pl.tenant_id
   and cl.status = 'active'
  where pl.id = target_package_line_id
    and pl.tenant_id = actor_tenant_id
    and pl.client_id = target_client_id
    and pl.package_id = target_package_id
    and p.contract_id = target_contract_id
    and pl.status = 'active';

  if target_line.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into target_package
  from public.packages p
  where p.id = target_package_id
    and p.tenant_id = actor_tenant_id
    and p.client_id = target_client_id
    and p.status = 'active';

  if target_package.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into line_balance
  from public.f002_package_line_balance(target_line.id);

  if line_balance.available < reserved_quantity then
    raise exception 'insufficient package capacity'
      using errcode = '42501';
  end if;

  insert into public.deliverables (
    id,
    tenant_id,
    client_id,
    contract_id,
    package_id,
    package_line_id,
    name,
    description,
    type,
    status,
    priority,
    owner_user_id,
    contributor_user_ids,
    start_date,
    internal_due_date,
    client_due_date,
    final_due_date,
    requires_internal_approval,
    requires_client_approval,
    progress_percentage,
    approved_extra,
    idempotency_key,
    created_by
  )
  values (
    deliverable_id,
    actor_tenant_id,
    target_line.client_id,
    target_package.contract_id,
    target_package.id,
    target_line.id,
    normalized_name,
    normalized_description,
    normalized_type,
    'not_started',
    requested_priority,
    owner_user_id_input,
    coalesce(contributor_user_ids_input, '{}'::uuid[]),
    start_on,
    internal_due_on,
    client_due_on,
    final_due_on,
    coalesce(requires_internal_approval_input, true),
    coalesce(requires_client_approval_input, true),
    0,
    false,
    normalized_idempotency_key,
    actor_user_id
  )
  returning * into created_deliverable;

  insert into public.package_ledger_entries (
    id,
    tenant_id,
    client_id,
    contract_id,
    package_id,
    package_line_id,
    deliverable_id,
    entry_type,
    quantity,
    actor_user_id,
    idempotency_key
  )
  values (
    ledger_entry_id,
    actor_tenant_id,
    created_deliverable.client_id,
    target_package.contract_id,
    target_package.id,
    target_line.id,
    created_deliverable.id,
    'quantity_reserved',
    reserved_quantity,
    actor_user_id,
    normalized_idempotency_key || ':reservation'
  );

  insert into public.deliverable_allocations (
    id,
    tenant_id,
    client_id,
    deliverable_id,
    package_line_id,
    reserved_quantity,
    status,
    reservation_ledger_entry_id
  )
  values (
    allocation_id,
    actor_tenant_id,
    created_deliverable.client_id,
    created_deliverable.id,
    target_line.id,
    reserved_quantity,
    'reserved',
    ledger_entry_id
  );

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
    created_deliverable.client_id,
    actor_user_id,
    'DeliverableCreated',
    'allowed',
    'deliverable',
    created_deliverable.id::text
  );

  return query
  select
    created_deliverable.id,
    created_deliverable.tenant_id,
    created_deliverable.client_id,
    created_deliverable.contract_id,
    created_deliverable.package_id,
    created_deliverable.package_line_id,
    created_deliverable.name,
    created_deliverable.description,
    created_deliverable.type,
    created_deliverable.status,
    created_deliverable.priority,
    created_deliverable.owner_user_id,
    created_deliverable.contributor_user_ids,
    created_deliverable.start_date,
    created_deliverable.internal_due_date,
    created_deliverable.client_due_date,
    created_deliverable.final_due_date,
    created_deliverable.requires_internal_approval,
    created_deliverable.requires_client_approval,
    created_deliverable.progress_percentage,
    created_deliverable.approved_extra,
    created_deliverable.extra_reason,
    created_deliverable.created_by,
    created_deliverable.created_at,
    created_deliverable.updated_at,
    created_deliverable.cancelled_at,
    created_deliverable.revision;
end;
$$;

create or replace function public.f002_create_approved_extra_deliverable(
  deliverable_id uuid,
  audit_event_id uuid,
  target_client_id uuid,
  deliverable_name text,
  deliverable_description text default null,
  deliverable_type text default null,
  deliverable_priority text default 'normal',
  owner_user_id_input uuid default null,
  contributor_user_ids_input uuid[] default '{}'::uuid[],
  start_on date default null,
  internal_due_on date default null,
  client_due_on date default null,
  final_due_on date default null,
  requires_internal_approval_input boolean default true,
  requires_client_approval_input boolean default true,
  extra_reason_input text default null,
  idempotency_key text default null
)
returns table (
  id uuid,
  tenant_id uuid,
  client_id uuid,
  contract_id uuid,
  package_id uuid,
  package_line_id uuid,
  name text,
  description text,
  type text,
  status text,
  priority text,
  owner_user_id uuid,
  contributor_user_ids uuid[],
  start_date date,
  internal_due_date date,
  client_due_date date,
  final_due_date date,
  requires_internal_approval boolean,
  requires_client_approval boolean,
  progress_percentage integer,
  approved_extra boolean,
  extra_reason text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  cancelled_at timestamptz,
  revision integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_name text := btrim(deliverable_name);
  normalized_type text := btrim(deliverable_type);
  normalized_description text := nullif(btrim(deliverable_description), '');
  normalized_reason text := nullif(btrim(extra_reason_input), '');
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  requested_priority text := coalesce(deliverable_priority, 'normal');
  target_client public.clients%rowtype;
  existing_deliverable public.deliverables%rowtype;
  created_deliverable public.deliverables%rowtype;
begin
  actor_tenant_id := public.f002_actor_tenant_for_deliverable_create(
    target_client_id,
    true
  );

  if normalized_name is null or length(normalized_name) < 2 then
    raise exception 'invalid deliverable name'
      using errcode = 'P0001';
  end if;

  if normalized_type is null or length(normalized_type) < 1 then
    raise exception 'invalid deliverable type'
      using errcode = 'P0001';
  end if;

  if normalized_reason is null or length(normalized_reason) < 3 then
    raise exception 'approved extra reason required'
      using errcode = 'P0001';
  end if;

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if requested_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'invalid deliverable priority'
      using errcode = 'P0001';
  end if;

  select *
    into target_client
  from public.clients c
  where c.id = target_client_id
    and c.tenant_id = actor_tenant_id
    and c.status = 'active';

  if target_client.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into existing_deliverable
  from public.deliverables d
  where d.tenant_id = actor_tenant_id
    and d.idempotency_key = normalized_idempotency_key;

  if existing_deliverable.id is not null then
    return query
    select
      existing_deliverable.id,
      existing_deliverable.tenant_id,
      existing_deliverable.client_id,
      existing_deliverable.contract_id,
      existing_deliverable.package_id,
      existing_deliverable.package_line_id,
      existing_deliverable.name,
      existing_deliverable.description,
      existing_deliverable.type,
      existing_deliverable.status,
      existing_deliverable.priority,
      existing_deliverable.owner_user_id,
      existing_deliverable.contributor_user_ids,
      existing_deliverable.start_date,
      existing_deliverable.internal_due_date,
      existing_deliverable.client_due_date,
      existing_deliverable.final_due_date,
      existing_deliverable.requires_internal_approval,
      existing_deliverable.requires_client_approval,
      existing_deliverable.progress_percentage,
      existing_deliverable.approved_extra,
      existing_deliverable.extra_reason,
      existing_deliverable.created_by,
      existing_deliverable.created_at,
      existing_deliverable.updated_at,
      existing_deliverable.cancelled_at,
      existing_deliverable.revision;
    return;
  end if;

  insert into public.deliverables (
    id,
    tenant_id,
    client_id,
    name,
    description,
    type,
    status,
    priority,
    owner_user_id,
    contributor_user_ids,
    start_date,
    internal_due_date,
    client_due_date,
    final_due_date,
    requires_internal_approval,
    requires_client_approval,
    progress_percentage,
    approved_extra,
    extra_reason,
    idempotency_key,
    created_by
  )
  values (
    deliverable_id,
    actor_tenant_id,
    target_client.id,
    normalized_name,
    normalized_description,
    normalized_type,
    'not_started',
    requested_priority,
    owner_user_id_input,
    coalesce(contributor_user_ids_input, '{}'::uuid[]),
    start_on,
    internal_due_on,
    client_due_on,
    final_due_on,
    coalesce(requires_internal_approval_input, true),
    coalesce(requires_client_approval_input, true),
    0,
    true,
    normalized_reason,
    normalized_idempotency_key,
    actor_user_id
  )
  returning * into created_deliverable;

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
    target_client.id,
    actor_user_id,
    'ApprovedExtraDeliverableCreated',
    'allowed',
    'deliverable',
    created_deliverable.id::text,
    'approved_extra_recorded'
  );

  return query
  select
    created_deliverable.id,
    created_deliverable.tenant_id,
    created_deliverable.client_id,
    created_deliverable.contract_id,
    created_deliverable.package_id,
    created_deliverable.package_line_id,
    created_deliverable.name,
    created_deliverable.description,
    created_deliverable.type,
    created_deliverable.status,
    created_deliverable.priority,
    created_deliverable.owner_user_id,
    created_deliverable.contributor_user_ids,
    created_deliverable.start_date,
    created_deliverable.internal_due_date,
    created_deliverable.client_due_date,
    created_deliverable.final_due_date,
    created_deliverable.requires_internal_approval,
    created_deliverable.requires_client_approval,
    created_deliverable.progress_percentage,
    created_deliverable.approved_extra,
    created_deliverable.extra_reason,
    created_deliverable.created_by,
    created_deliverable.created_at,
    created_deliverable.updated_at,
    created_deliverable.cancelled_at,
    created_deliverable.revision;
end;
$$;

revoke all on function public.f002_actor_tenant_for_deliverable_create(uuid, boolean) from public, anon, authenticated;
revoke all on function public.f002_create_deliverable_reservation(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, text, uuid, uuid[],
  date, date, date, date, boolean, boolean, numeric, text
) from public, anon, authenticated;
revoke all on function public.f002_create_approved_extra_deliverable(
  uuid, uuid, uuid, text, text, text, text, uuid, uuid[],
  date, date, date, date, boolean, boolean, text, text
) from public, anon, authenticated;

grant execute on function public.f002_create_deliverable_reservation(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, text, uuid, uuid[],
  date, date, date, date, boolean, boolean, numeric, text
) to authenticated;
grant execute on function public.f002_create_approved_extra_deliverable(
  uuid, uuid, uuid, text, text, text, text, uuid, uuid[],
  date, date, date, date, boolean, boolean, text, text
) to authenticated;
