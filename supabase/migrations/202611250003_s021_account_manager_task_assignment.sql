create or replace function private.s015_upsert_deliverable_task_core(
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
  can_assign_others boolean;
  is_owner_or_contributor boolean;
  is_current_assignee boolean;
  eff_title text := btrim(target_title);
  eff_description text := nullif(btrim(coalesce(target_description, '')), '');
  eff_status text := target_status;
  eff_priority text := target_priority;
  eff_assignee_user_id uuid := target_assignee_user_id;
  eff_due_date date := target_due_date;
  eff_sort_order integer := coalesce(target_sort_order, 0);
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

  -- Load deliverable within exact scope.
  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'task command denied' using errcode = '42501';
  end if;
  if target_deliverable.status in ('delivered', 'cancelled', 'archived') then
    raise exception 'terminal deliverable state' using errcode = 'P0001';
  end if;

  -- Compute authority flags.
  is_management := public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_deliverable.tenant_id
  ) or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  );

  is_owner_or_contributor := (
    target_deliverable.owner_user_id = actor_user_id
    or actor_user_id = any(coalesce(target_deliverable.contributor_user_ids, array[]::uuid[]))
  ) and public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['account_manager','content_writer','designer','performance_specialist'],
    'client', target_client_id
  );

  can_assign_others := is_management or (
    coalesce(target_deliverable.owner_user_id = actor_user_id, false)
    and public.f001_has_active_role(
      target_deliverable.tenant_id, array['account_manager'],
      'client', target_deliverable.client_id
    )
  );

  if is_new then
    -- CREATE authority: management or owner/contributor only.
    if not (is_management or is_owner_or_contributor) then
      raise exception 'task command denied' using errcode = '42501';
    end if;
    -- Validate assignee is an active same-tenant same-client team member.
    if not private.s015_validate_task_assignee(
      target_deliverable.tenant_id, target_client_id, target_assignee_user_id
    ) then
      raise exception 'invalid assignee' using errcode = '42501';
    end if;
    -- Other team members may only self-assign or leave the task unassigned.
    if not can_assign_others
      and target_assignee_user_id is not null
      and target_assignee_user_id <> actor_user_id then
      raise exception 'assignee authority denied' using errcode = '42501';
    end if;
  else
    -- UPDATE: load existing task within exact scope BEFORE authority decision.
    select * into existing_task from public.deliverable_tasks t
    where t.id = target_task_id
      and t.tenant_id = target_deliverable.tenant_id
      and t.client_id = target_client_id
      and t.deliverable_id = target_deliverable_id
    for update;
    if existing_task.id is null then
      raise exception 'task not found in scope' using errcode = '42501';
    end if;

    is_current_assignee := (existing_task.assignee_user_id = actor_user_id);

    if not (is_management or is_owner_or_contributor or is_current_assignee) then
      raise exception 'task command denied' using errcode = '42501';
    end if;

    -- Apply authority-based field restrictions.
    if can_assign_others then
      if (
        is_management or target_assignee_user_id is distinct from existing_task.assignee_user_id
      ) and not private.s015_validate_task_assignee(
        target_deliverable.tenant_id, target_client_id, target_assignee_user_id
      ) then
        raise exception 'invalid assignee' using errcode = '42501';
      end if;
    elsif is_owner_or_contributor then
      -- Owner/contributor: all fields EXCEPT assignee.
      if target_assignee_user_id is distinct from existing_task.assignee_user_id then
        raise exception 'assignee change denied' using errcode = '42501';
      end if;
      eff_assignee_user_id := existing_task.assignee_user_id;
    else
      -- Task assignee: status ONLY; preserve all protected fields.
      eff_title := existing_task.title;
      eff_description := existing_task.description;
      eff_priority := existing_task.priority;
      eff_due_date := existing_task.due_date;
      eff_assignee_user_id := existing_task.assignee_user_id;
      eff_sort_order := existing_task.sort_order;
    end if;
  end if;

  -- Compute fingerprint from EFFECTIVE payload after authority normalization.
  normalized_payload := jsonb_build_object(
    'clientId', target_client_id,
    'deliverableId', target_deliverable_id,
    'taskId', target_task_id,
    'title', eff_title,
    'description', eff_description,
    'status', eff_status,
    'priority', eff_priority,
    'assigneeUserId', eff_assignee_user_id,
    'dueDate', eff_due_date,
    'sortOrder', eff_sort_order
  );
  payload_fingerprint := md5(normalized_payload::text);

  -- Idempotency check.
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

  -- Write audit event.
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id,
    case when is_new then 'DeliverableTaskCreated' else 'DeliverableTaskUpdated' end,
    'allowed', 'deliverable', target_deliverable_id::text, 'upsert_deliverable_task'
  );

  -- Write idempotency record.
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

  -- Write task row.
  if is_new then
    insert into public.deliverable_tasks (
      id, tenant_id, client_id, deliverable_id, version_id,
      title, description, status, priority,
      assignee_user_id, due_date, sort_order, created_by
    ) values (
      task_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_deliverable.current_version_id,
      eff_title, eff_description, eff_status, eff_priority,
      eff_assignee_user_id, eff_due_date, eff_sort_order, actor_user_id
    );
  else
    update public.deliverable_tasks t set
      title = eff_title,
      description = eff_description,
      status = eff_status,
      priority = eff_priority,
      assignee_user_id = eff_assignee_user_id,
      due_date = eff_due_date,
      sort_order = eff_sort_order,
      updated_at = now()
    where t.id = task_id
      and t.tenant_id = target_deliverable.tenant_id
      and t.client_id = target_client_id
      and t.deliverable_id = target_deliverable_id;
  end if;

  return task_id;
end;
$$;

create or replace function public.s015_list_task_eligible_assignees(
  target_tenant_id uuid,
  target_client_id uuid
)
returns table(user_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select distinct tm.auth_user_id
  from public.tenant_memberships tm
  join public.role_assignments ra
    on ra.membership_id = tm.id
   and ra.tenant_id = tm.tenant_id
  where auth.uid() is not null
    and tm.tenant_id = target_tenant_id
    and tm.status = 'active'
    and ra.status = 'active'
    and ra.scope_type = 'client'
    and ra.scope_id = target_client_id
    and ra.role_key in (
      'account_manager','content_writer','designer','performance_specialist'
    )
    and (
      public.f001_has_active_role(
        target_tenant_id,
        array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
        'tenant', target_tenant_id
      )
      or public.f001_has_active_role(
        target_tenant_id,
        array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
        'client', target_client_id
      )
      or (
        public.f001_has_active_role(
          target_tenant_id, array['account_manager'], 'client', target_client_id
        )
        and exists (
          select 1 from public.deliverables d
          where d.tenant_id = target_tenant_id and d.client_id = target_client_id
            and d.owner_user_id = auth.uid()
            and d.status not in ('delivered', 'cancelled', 'archived')
        )
      )
    );
$$;

-- The scoped roster can include members who are not yet on any card.
create function public.s021_list_task_assignee_profiles(
  target_tenant_id uuid,
  target_client_id uuid
)
returns table(user_id uuid, display_name text, role_label text, avatar_url text)
language sql
security definer
stable
set search_path = ''
as $$
  select p.user_id, p.display_name, p.role_label, p.avatar_url
  from public.s015_list_task_eligible_assignees(target_tenant_id, target_client_id) eligible
  join public.member_profiles p
    on p.tenant_id = target_tenant_id and p.user_id = eligible.user_id
  order by p.display_name, p.user_id;
$$;

revoke all on function public.s021_list_task_assignee_profiles(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.s021_list_task_assignee_profiles(uuid, uuid)
  to authenticated;
