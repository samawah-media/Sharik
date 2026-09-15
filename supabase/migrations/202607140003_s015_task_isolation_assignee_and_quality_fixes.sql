-- Spec 015 X007: corrective slice for task read isolation, assignee validation,
-- zero-row delete guard, and stale quality-check metadata on revert to pending.

-- 1. Narrow the task SELECT RLS policy to management or an authorized
--    deliverable owner/contributor/task assignee. Any active internal
--    client-scoped role is no longer sufficient on its own.
drop policy if exists s015_deliverable_tasks_select on public.deliverable_tasks;
create policy s015_deliverable_tasks_select on public.deliverable_tasks
  for select to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or (
      public.f001_has_active_role(
        tenant_id,
        array['account_manager','content_writer','designer','performance_specialist'],
        'client', client_id
      )
      and exists (
        select 1 from public.deliverables d
        where d.id = deliverable_tasks.deliverable_id
          and d.tenant_id = deliverable_tasks.tenant_id
          and d.client_id = deliverable_tasks.client_id
          and (
            d.owner_user_id = auth.uid()
            or auth.uid() = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
            or deliverable_tasks.assignee_user_id = auth.uid()
            or deliverable_tasks.created_by = auth.uid()
          )
      )
    )
  );

-- 2. Add a helper to validate that an assignee is an active same-tenant
--    member with an approved internal role inside the target client scope.
create or replace function private.s015_validate_task_assignee(
  target_tenant_id uuid,
  target_client_id uuid,
  target_assignee_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    target_assignee_user_id is null
    or (
      exists (
        select 1 from public.tenant_memberships tm
        where tm.tenant_id = target_tenant_id
          and tm.auth_user_id = target_assignee_user_id
          and tm.status = 'active'
      )
      and exists (
        select 1 from public.role_assignments ra
        join public.tenant_memberships tm2
          on tm2.id = ra.membership_id
        where ra.tenant_id = target_tenant_id
          and tm2.auth_user_id = target_assignee_user_id
          and ra.scope_type = 'client'
          and ra.scope_id = target_client_id
          and ra.status = 'active'
          and ra.role_key in ('account_manager','content_writer','designer','performance_specialist')
      )
    );
$$;

-- 3. Re-create s015_upsert_deliverable_task to validate the assignee.
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

-- 4. Re-create s015_delete_deliverable_task to validate the scoped task
--    BEFORE recording audit/idempotency, and reject zero-row deletions.
drop function if exists public.s015_delete_deliverable_task(uuid,uuid,uuid,uuid,uuid,text);
create function public.s015_delete_deliverable_task(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_task_id uuid,
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
  existing_task public.deliverable_tasks%rowtype;
  is_management boolean;
  normalized_payload jsonb;
  payload_fingerprint text;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_task_id is null
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid delete input' using errcode = 'P0001';
  end if;
  normalized_payload := jsonb_build_object(
    'clientId', target_client_id,
    'deliverableId', target_deliverable_id,
    'taskId', target_task_id
  );
  payload_fingerprint := md5(normalized_payload::text);

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;
  is_management := public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_deliverable.tenant_id
  ) or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  );
  if not is_management then
    raise exception 'task delete denied' using errcode = '42501';
  end if;

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.command_name <> 'delete_deliverable_task'
      or existing_request.request_fingerprint is distinct from payload_fingerprint
      or existing_request.result_resource_id is distinct from target_task_id then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return existing_request.result_resource_id;
  end if;

  -- Validate the scoped task exists BEFORE recording success.
  select * into existing_task from public.deliverable_tasks t
  where t.id = target_task_id
    and t.tenant_id = target_deliverable.tenant_id
    and t.client_id = target_client_id
    and t.deliverable_id = target_deliverable_id
    for update;
  if existing_task.id is null then
    raise exception 'task not found in scope' using errcode = '42501';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'DeliverableTaskDeleted', 'allowed',
    'deliverable', target_deliverable_id::text, 'delete_deliverable_task'
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status, request_fingerprint, result_resource_id
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, null, btrim(request_idempotency_key),
    'delete_deliverable_task', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, null,
    payload_fingerprint, target_task_id
  );

  delete from public.deliverable_tasks
  where id = target_task_id
    and tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id
    and deliverable_id = target_deliverable_id;
  return target_task_id;
end;
$$;

revoke all on function public.s015_delete_deliverable_task(uuid,uuid,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_delete_deliverable_task(uuid,uuid,uuid,uuid,uuid,text)
  to authenticated;

-- 5. Re-create s015_upsert_quality_check to clear checked_by/checked_at
--    when reverting to pending.
create or replace function public.s015_upsert_quality_check(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_check_id uuid,
  target_label text,
  target_status text,
  target_note text,
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
  target_version public.deliverable_versions%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  check_id uuid := coalesce(target_check_id, gen_random_uuid());
  is_new boolean := target_check_id is null;
  is_management boolean;
  normalized_payload jsonb;
  payload_fingerprint text;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(btrim(coalesce(target_label, ''))) < 2
    or length(btrim(target_label)) > 200
    or target_status not in ('pending', 'passed', 'changes_required', 'not_applicable')
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid quality input' using errcode = 'P0001';
  end if;

  normalized_payload := jsonb_build_object(
    'clientId', target_client_id,
    'deliverableId', target_deliverable_id,
    'versionId', target_version_id,
    'checkId', target_check_id,
    'label', btrim(target_label),
    'status', target_status,
    'note', nullif(btrim(coalesce(target_note, '')), ''),
    'sortOrder', coalesce(target_sort_order, 0)
  );
  payload_fingerprint := md5(normalized_payload::text);

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;
  is_management := public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_deliverable.tenant_id
  ) or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  );
  if not is_management then
    raise exception 'quality command denied' using errcode = '42501';
  end if;

  select * into target_version from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;
  if target_version.id is null then
    raise exception 'version not found in scope' using errcode = '42501';
  end if;

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'upsert_quality_check'
      or existing_request.request_fingerprint is distinct from payload_fingerprint
      or existing_request.result_resource_id is null then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return existing_request.result_resource_id;
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id,
    case when is_new then 'QualityCheckCreated' else 'QualityCheckUpdated' end,
    'allowed', 'deliverable_version', target_version_id::text, 'upsert_quality_check'
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status, request_fingerprint, result_resource_id
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'upsert_quality_check', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, target_version.status,
    payload_fingerprint, check_id
  );

  if is_new then
    insert into public.deliverable_quality_checks (
      id, tenant_id, client_id, deliverable_id, version_id,
      label, status, note, checked_by, checked_at, sort_order
    ) values (
      check_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_id,
      btrim(target_label), target_status,
      nullif(btrim(coalesce(target_note, '')), ''),
      case when target_status in ('passed','changes_required','not_applicable')
        then actor_user_id else null end,
      case when target_status in ('passed','changes_required','not_applicable')
        then now() else null end,
      coalesce(target_sort_order, 0)
    );
  else
    update public.deliverable_quality_checks qc set
      label = btrim(target_label),
      status = target_status,
      note = nullif(btrim(coalesce(target_note, '')), ''),
      checked_by = case
        when target_status in ('passed','changes_required','not_applicable')
          then actor_user_id
        else null
      end,
      checked_at = case
        when target_status in ('passed','changes_required','not_applicable')
          then now()
        else null
      end,
      sort_order = coalesce(target_sort_order, qc.sort_order),
      updated_at = now()
    where qc.id = check_id
      and qc.tenant_id = target_deliverable.tenant_id
      and qc.client_id = target_client_id
      and qc.deliverable_id = target_deliverable_id
      and qc.version_id = target_version_id;
  end if;

  return check_id;
end;
$$;

revoke all on function public.s015_upsert_quality_check(uuid,uuid,uuid,uuid,text,text,text,integer,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_upsert_quality_check(uuid,uuid,uuid,uuid,text,text,text,integer,uuid,uuid,text)
  to authenticated;
