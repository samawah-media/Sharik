-- F-002D reservation release and scope-safe summary support.
-- Adds a reviewed, audited RPC for cancelling not-started reserved deliverables.

create or replace function public.f002_cancel_not_started_deliverable(
  target_deliverable_id uuid,
  release_ledger_entry_id uuid,
  audit_event_id uuid,
  target_client_id uuid,
  cancellation_reason text,
  expected_status text default 'not_started',
  expected_revision integer default null,
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
  normalized_reason text := nullif(btrim(cancellation_reason), '');
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  release_idempotency_key text;
  target_deliverable public.deliverables%rowtype;
  updated_deliverable public.deliverables%rowtype;
  target_allocation public.deliverable_allocations%rowtype;
  existing_release public.package_ledger_entries%rowtype;
  new_release_ledger_entry_id uuid := release_ledger_entry_id;
  denial_reason text;
begin
  actor_tenant_id := public.f002_actor_tenant_for_deliverable_create(
    target_client_id,
    false
  );

  if normalized_reason is null or length(normalized_reason) < 3 then
    raise exception 'invalid cancellation reason'
      using errcode = 'P0001';
  end if;

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if expected_status is not null and expected_status <> 'not_started' then
    raise exception 'invalid expected status'
      using errcode = 'P0001';
  end if;

  release_idempotency_key := normalized_idempotency_key || ':reservation_release';

  select *
    into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.tenant_id = actor_tenant_id
    and d.client_id = target_client_id
  for update;

  if target_deliverable.id is null then
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
      target_client_id,
      actor_user_id,
      'DeliverableCancellationDenied',
      'denied',
      'deliverable',
      target_deliverable_id::text,
      'reservation_not_available'
    );
    return;
  end if;

  select *
    into existing_release
  from public.package_ledger_entries ple
  where ple.tenant_id = actor_tenant_id
    and ple.idempotency_key = release_idempotency_key;

  if existing_release.id is not null
     and existing_release.deliverable_id = target_deliverable.id then
    return query
    select
      target_deliverable.id,
      target_deliverable.tenant_id,
      target_deliverable.client_id,
      target_deliverable.contract_id,
      target_deliverable.package_id,
      target_deliverable.package_line_id,
      target_deliverable.name,
      target_deliverable.description,
      target_deliverable.type,
      target_deliverable.status,
      target_deliverable.priority,
      target_deliverable.owner_user_id,
      target_deliverable.contributor_user_ids,
      target_deliverable.start_date,
      target_deliverable.internal_due_date,
      target_deliverable.client_due_date,
      target_deliverable.final_due_date,
      target_deliverable.requires_internal_approval,
      target_deliverable.requires_client_approval,
      target_deliverable.progress_percentage,
      target_deliverable.approved_extra,
      target_deliverable.extra_reason,
      target_deliverable.created_by,
      target_deliverable.created_at,
      target_deliverable.updated_at,
      target_deliverable.cancelled_at,
      target_deliverable.revision;
    return;
  end if;

  if existing_release.id is not null then
    denial_reason := 'reservation_not_available';
  elsif target_deliverable.status = 'cancelled' then
    denial_reason := 'deliverable_already_cancelled';
  elsif target_deliverable.status <> 'not_started' then
    denial_reason := 'deliverable_already_progressed';
  elsif expected_revision is not null
        and target_deliverable.revision <> expected_revision then
    denial_reason := 'expected_state_mismatch';
  elsif target_deliverable.contract_id is null
        or target_deliverable.package_id is null
        or target_deliverable.package_line_id is null then
    denial_reason := 'reservation_not_available';
  end if;

  if denial_reason is null then
    select *
      into target_allocation
    from public.deliverable_allocations da
    where da.tenant_id = actor_tenant_id
      and da.client_id = target_client_id
      and da.deliverable_id = target_deliverable.id
      and da.status = 'reserved'
    for update;

    if target_allocation.id is null then
      denial_reason := 'reservation_not_available';
    end if;
  end if;

  if denial_reason is not null then
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
      target_client_id,
      actor_user_id,
      'DeliverableCancellationDenied',
      'denied',
      'deliverable',
      target_deliverable.id::text,
      denial_reason
    );
    return;
  end if;

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
    reason,
    actor_user_id,
    idempotency_key
  )
  values (
    new_release_ledger_entry_id,
    actor_tenant_id,
    target_deliverable.client_id,
    target_deliverable.contract_id,
    target_deliverable.package_id,
    target_allocation.package_line_id,
    target_deliverable.id,
    'reservation_released',
    target_allocation.reserved_quantity,
    normalized_reason,
    actor_user_id,
    release_idempotency_key
  );

  update public.deliverable_allocations da
  set
    status = 'released',
    release_ledger_entry_id = new_release_ledger_entry_id,
    released_at = now()
  where da.id = target_allocation.id
    and da.tenant_id = actor_tenant_id
    and da.client_id = target_client_id;

  update public.deliverables d
  set
    status = 'cancelled',
    progress_percentage = 0,
    cancelled_at = now(),
    updated_at = now(),
    revision = d.revision + 1
  where d.id = target_deliverable.id
    and d.tenant_id = actor_tenant_id
    and d.client_id = target_client_id
  returning * into updated_deliverable;

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
    target_deliverable.client_id,
    actor_user_id,
    'DeliverableCancelled',
    'allowed',
    'deliverable',
    target_deliverable.id::text,
    'reservation_released'
  );

  return query
  select
    updated_deliverable.id,
    updated_deliverable.tenant_id,
    updated_deliverable.client_id,
    updated_deliverable.contract_id,
    updated_deliverable.package_id,
    updated_deliverable.package_line_id,
    updated_deliverable.name,
    updated_deliverable.description,
    updated_deliverable.type,
    updated_deliverable.status,
    updated_deliverable.priority,
    updated_deliverable.owner_user_id,
    updated_deliverable.contributor_user_ids,
    updated_deliverable.start_date,
    updated_deliverable.internal_due_date,
    updated_deliverable.client_due_date,
    updated_deliverable.final_due_date,
    updated_deliverable.requires_internal_approval,
    updated_deliverable.requires_client_approval,
    updated_deliverable.progress_percentage,
    updated_deliverable.approved_extra,
    updated_deliverable.extra_reason,
    updated_deliverable.created_by,
    updated_deliverable.created_at,
    updated_deliverable.updated_at,
    updated_deliverable.cancelled_at,
    updated_deliverable.revision;
end;
$$;

revoke all on function public.f002_cancel_not_started_deliverable(
  uuid, uuid, uuid, uuid, text, text, integer, text
) from public, anon, authenticated;

grant execute on function public.f002_cancel_not_started_deliverable(
  uuid, uuid, uuid, uuid, text, text, integer, text
) to authenticated;
