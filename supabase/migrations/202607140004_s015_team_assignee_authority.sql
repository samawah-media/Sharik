-- Spec 015 X007: enforce team-member assignment authority.
-- Team members (non-management) may only create/update tasks with assignee
-- set to null or to themselves. Only management can assign to other users.

create or replace function public.s015_upsert_deliverable_task(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_task_id uuid,
  target_title text,
  target_description text,
  target_status text,
  target_priority text,
  target_assignee_user_id uuid,
  target_due_date date,
  target_sort_order integer,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  task_id uuid := coalesce(target_task_id, gen_random_uuid());
  is_new boolean := target_task_id is null;
  existing_task public.deliverable_tasks%rowtype;
  is_management boolean;
  normalized_payload jsonb;
  payload_fingerprint text;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(btrim(coalesce(target_title, ''))) < 2
    or length(btrim(target_title)) > 200
    or target_status not in ('todo', 'in_progress', 'done', 'cancelled')
    or target_priority not in ('low', 'normal', 'high', 'urgent')
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid task input' using errcode = 'P0001';
  end if;

  normalized_payload := jsonb_build_object(
    'clientId', target_client_id,
    'deliverableId', target_deliverable_id,
    'taskId', target_task_id,
    'title', btrim(target_title),
    'description', nullif(btrim(coalesce(target_description, '')), ''),
    'status', target_status,
    'priority', target_priority,
    'assigneeUserId', target_assignee_user_id,
    'dueDate', target_due_date,
    'sortOrder', coalesce(target_sort_order, 0)
  );
  payload_fingerprint := md5(normalized_payload::text);

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null
    or not private.s015_team_can_execute_deliverable(target_deliverable) then
    raise exception 'task command denied' using errcode = '42501';
  end if;
  if target_deliverable.status in ('delivered', 'cancelled', 'archived') then
    raise exception 'terminal deliverable state' using errcode = 'P0001';
  end if;

  if not private.s015_validate_task_assignee(
    target_deliverable.tenant_id, target_client_id, target_assignee_user_id
  ) then
    raise exception 'invalid assignee' using errcode = '42501';
  end if;

  -- Team members (non-management) may only assign to themselves or leave unassigned.
  is_management := public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_deliverable.tenant_id
  ) or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  );
  if not is_management
    and target_assignee_user_id is not null
    and target_assignee_user_id <> actor_user_id then
    raise exception 'assignee authority denied' using errcode = '42501';
  end if;

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.command_name <> 'upsert_deliverable_task'
      or existing_request.request_fingerprint is distinct from payload_fingerprint
      or existing_request.result_resource_id is null then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return existing_request.result_resource_id;
  end if;

  if not is_new then
    select * into existing_task from public.deliverable_tasks t
    where t.id = target_task_id
      and t.tenant_id = target_deliverable.tenant_id
      and t.client_id = target_client_id
      and t.deliverable_id = target_deliverable_id;
    if existing_task.id is null then
      raise exception 'task not found in scope' using errcode = '42501';
    end if;
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id,
    case when is_new then 'DeliverableTaskCreated' else 'DeliverableTaskUpdated' end,
    'allowed', 'deliverable', target_deliverable_id::text, 'upsert_deliverable_task'
  );

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status, request_fingerprint, result_resource_id
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_deliverable.current_version_id,
    btrim(request_idempotency_key), 'upsert_deliverable_task',
    'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, null,
    payload_fingerprint, task_id
  );

  if is_new then
    insert into public.deliverable_tasks (
      id, tenant_id, client_id, deliverable_id, version_id,
      title, description, status, priority,
      assignee_user_id, due_date, sort_order, created_by
    ) values (
      task_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_deliverable.current_version_id,
      btrim(target_title), nullif(btrim(coalesce(target_description, '')), ''),
      target_status, target_priority,
      target_assignee_user_id, target_due_date,
      coalesce(target_sort_order, 0), actor_user_id
    );
  else
    update public.deliverable_tasks t set
      title = btrim(target_title),
      description = nullif(btrim(coalesce(target_description, '')), ''),
      status = target_status,
      priority = target_priority,
      assignee_user_id = target_assignee_user_id,
      due_date = target_due_date,
      sort_order = coalesce(target_sort_order, t.sort_order),
      updated_at = now()
    where t.id = task_id
      and t.tenant_id = target_deliverable.tenant_id
      and t.client_id = target_client_id
      and t.deliverable_id = target_deliverable_id;
  end if;

  return task_id;
end;
$$;

revoke all on function public.s015_upsert_deliverable_task(uuid,uuid,uuid,text,text,text,text,uuid,date,integer,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_upsert_deliverable_task(uuid,uuid,uuid,text,text,text,text,uuid,date,integer,uuid,uuid,text)
  to authenticated;
