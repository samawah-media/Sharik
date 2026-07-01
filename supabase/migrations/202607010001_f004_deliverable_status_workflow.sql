-- F-004 internal Kanban workflow MVP.
-- Adds a scoped, audited RPC for deliverable lifecycle status changes.

insert into public.permission_references (id, description, status)
values
  (
    'PERM.DELIVERABLE.STATUS_UPDATE',
    'Update scoped deliverable workflow status with audit',
    'active'
  )
on conflict (id) do update
set
  description = excluded.description,
  status = excluded.status;

create or replace function public.f004_deliverable_progress_for_status(
  target_status text
)
returns integer
language sql
immutable
as $$
  select case target_status
    when 'not_started' then 0
    when 'in_progress' then 30
    when 'ready_for_internal_review' then 50
    when 'internal_changes_requested' then 45
    when 'internally_approved' then 70
    when 'waiting_client_approval' then 80
    when 'client_changes_requested' then 65
    when 'client_approved' then 90
    when 'ready_for_delivery' then 95
    when 'delivered' then 100
    when 'cancelled' then 0
    when 'archived' then 100
    else null
  end;
$$;

create or replace function public.f004_update_deliverable_status(
  target_deliverable_id uuid,
  audit_event_id uuid,
  target_client_id uuid,
  target_status text,
  expected_revision integer default null,
  transition_reason text default null,
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
  normalized_target_status text := nullif(btrim(target_status), '');
  normalized_reason text := nullif(btrim(transition_reason), '');
  normalized_idempotency_key text := nullif(btrim(idempotency_key), '');
  target_deliverable public.deliverables%rowtype;
  updated_deliverable public.deliverables%rowtype;
  next_progress integer;
  denial_reason text;
begin
  actor_tenant_id := public.f002_actor_tenant_for_deliverable_create(
    target_client_id,
    false
  );

  if normalized_idempotency_key is null or length(normalized_idempotency_key) < 8 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  if normalized_target_status is null or normalized_target_status not in (
    'not_started',
    'in_progress',
    'ready_for_internal_review',
    'internal_changes_requested',
    'internally_approved',
    'waiting_client_approval',
    'client_changes_requested',
    'client_approved',
    'ready_for_delivery',
    'delivered'
  ) then
    raise exception 'invalid deliverable target status'
      using errcode = 'P0001';
  end if;

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
      'DeliverableStatusChangeDenied',
      'denied',
      'deliverable',
      target_deliverable_id::text,
      'deliverable_not_found'
    );
    return;
  end if;

  if expected_revision is not null
        and target_deliverable.revision <> expected_revision then
    denial_reason := 'expected_state_mismatch';
  elsif target_deliverable.status in ('cancelled', 'archived') then
    denial_reason := 'terminal_status_locked';
  elsif normalized_target_status = 'waiting_client_approval'
        and target_deliverable.status <> 'internally_approved' then
    denial_reason := 'internal_approval_required_before_client_waiting';
  elsif normalized_target_status = 'delivered'
        and target_deliverable.requires_client_approval
        and target_deliverable.status <> 'client_approved' then
    denial_reason := 'client_approval_required_before_delivery';
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
      'DeliverableStatusChangeDenied',
      'denied',
      'deliverable',
      target_deliverable.id::text,
      denial_reason
    );
    return;
  end if;

  if target_deliverable.status = normalized_target_status then
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

  next_progress := public.f004_deliverable_progress_for_status(normalized_target_status);

  if next_progress is null then
    raise exception 'invalid deliverable target status'
      using errcode = 'P0001';
  end if;

  update public.deliverables d
  set
    status = normalized_target_status,
    progress_percentage = next_progress,
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
    'DeliverableStatusChanged',
    'allowed',
    'deliverable',
    target_deliverable.id::text,
    coalesce(normalized_reason, 'status_transition')
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

revoke all on function public.f004_deliverable_progress_for_status(text)
from public, anon, authenticated;

revoke all on function public.f004_update_deliverable_status(
  uuid, uuid, uuid, text, integer, text, text
) from public, anon, authenticated;

grant execute on function public.f004_update_deliverable_status(
  uuid, uuid, uuid, text, integer, text, text
) to authenticated;
