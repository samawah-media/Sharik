-- F-002A contract context create path.
-- Keeps direct Data API writes closed and exposes one audited, scoped RPC.

alter table public.contracts
add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contracts_idempotency_key_length'
      and conrelid = 'public.contracts'::regclass
  ) then
    alter table public.contracts
      add constraint contracts_idempotency_key_length
      check (idempotency_key is null or length(btrim(idempotency_key)) >= 8);
  end if;
end;
$$;

create unique index if not exists contracts_tenant_idempotency_key_unique
on public.contracts (tenant_id, idempotency_key)
where idempotency_key is not null;

create or replace function public.f002_actor_tenant_for_contract_create()
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

create or replace function public.f002_create_contract_context(
  contract_id uuid,
  audit_event_id uuid,
  target_client_id uuid,
  contract_name text,
  contract_reference text default null,
  contract_summary text default null,
  period_start_date date default null,
  period_end_date date default null,
  contract_status text default 'draft',
  idempotency_key text default null
)
returns table (
  id uuid,
  tenant_id uuid,
  client_id uuid,
  name text,
  reference text,
  summary text,
  period_start date,
  period_end date,
  status text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_name text := btrim(contract_name);
  normalized_reference text := nullif(btrim(contract_reference), '');
  normalized_summary text := nullif(btrim(contract_summary), '');
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  requested_status text := coalesce(contract_status, 'draft');
  target_client public.clients%rowtype;
  existing_contract public.contracts%rowtype;
  created_contract public.contracts%rowtype;
begin
  actor_tenant_id := public.f002_actor_tenant_for_contract_create();

  if normalized_name is null or length(normalized_name) < 2 then
    raise exception 'invalid contract input'
      using errcode = 'P0001';
  end if;

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if requested_status not in ('draft', 'active', 'completed', 'cancelled', 'archived') then
    raise exception 'invalid contract status'
      using errcode = 'P0001';
  end if;

  if period_start_date is not null
     and period_end_date is not null
     and period_start_date > period_end_date then
    raise exception 'invalid contract period'
      using errcode = 'P0001';
  end if;

  select *
    into target_client
  from public.clients
  where public.clients.id = target_client_id
    and public.clients.tenant_id = actor_tenant_id
    and public.clients.status = 'active';

  if target_client.id is null then
    raise exception 'not authorized'
      using errcode = '42501';
  end if;

  select *
    into existing_contract
  from public.contracts
  where public.contracts.tenant_id = actor_tenant_id
    and public.contracts.idempotency_key = normalized_idempotency_key;

  if existing_contract.id is not null then
    return query
    select
      existing_contract.id,
      existing_contract.tenant_id,
      existing_contract.client_id,
      existing_contract.name,
      existing_contract.reference,
      existing_contract.summary,
      existing_contract.period_start,
      existing_contract.period_end,
      existing_contract.status,
      existing_contract.created_by,
      existing_contract.created_at,
      existing_contract.updated_at,
      existing_contract.archived_at;
    return;
  end if;

  insert into public.contracts (
    id,
    tenant_id,
    client_id,
    name,
    reference,
    summary,
    period_start,
    period_end,
    status,
    idempotency_key,
    created_by
  )
  values (
    contract_id,
    actor_tenant_id,
    target_client.id,
    normalized_name,
    normalized_reference,
    normalized_summary,
    period_start_date,
    period_end_date,
    requested_status,
    normalized_idempotency_key,
    actor_user_id
  )
  returning * into created_contract;

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
    created_contract.client_id,
    actor_user_id,
    'ContractCreated',
    'allowed',
    'contract',
    created_contract.id::text
  );

  return query
  select
    created_contract.id,
    created_contract.tenant_id,
    created_contract.client_id,
    created_contract.name,
    created_contract.reference,
    created_contract.summary,
    created_contract.period_start,
    created_contract.period_end,
    created_contract.status,
    created_contract.created_by,
    created_contract.created_at,
    created_contract.updated_at,
    created_contract.archived_at;
end;
$$;

revoke all on function public.f002_actor_tenant_for_contract_create() from public, anon, authenticated;
revoke all on function public.f002_create_contract_context(uuid, uuid, uuid, text, text, text, date, date, text, text) from public, anon, authenticated;

grant execute on function public.f002_create_contract_context(uuid, uuid, uuid, text, text, text, date, date, text, text) to authenticated;
