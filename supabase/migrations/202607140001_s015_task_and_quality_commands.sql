-- Spec 015 X007 Checkpoint 1A/1B: team execution task and quality-checklist
-- mutation commands with audited, scoped, idempotent RPCs, plus a quality-gate
-- enforcement on internal approval.

-- Helper: check if the caller is the deliverable owner. These helpers must
-- exist before the RLS policies that reference them during clean replay.
create or replace function public.owner_user_id_is_actor(
  target_tenant_id uuid,
  target_deliverable_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.deliverables d
    where d.id = target_deliverable_id
      and d.tenant_id = target_tenant_id
      and d.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.owner_user_id_is_actor(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.owner_user_id_is_actor(uuid, uuid)
  to authenticated;

-- Helper: check if the caller is a contributor.
create or replace function public.contributor_user_ids_contains_actor(
  target_tenant_id uuid,
  target_deliverable_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.deliverables d
    where d.id = target_deliverable_id
      and d.tenant_id = target_tenant_id
      and auth.uid() = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
  );
$$;

revoke all on function public.contributor_user_ids_contains_actor(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.contributor_user_ids_contains_actor(uuid, uuid)
  to authenticated;

-- 1. RLS INSERT/UPDATE/DELETE policies for deliverable_tasks.
--    Management and assigned team (owner/contributor with client-scoped role)
--    can create/update tasks. Management can delete. Client roles are excluded.

drop policy if exists s015_deliverable_tasks_insert on public.deliverable_tasks;
create policy s015_deliverable_tasks_insert on public.deliverable_tasks
  for insert to authenticated with check (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
    or (
      (
        public.owner_user_id_is_actor(tenant_id, deliverable_id)
        or public.contributor_user_ids_contains_actor(tenant_id, deliverable_id)
      )
      and public.f001_has_active_role(
        tenant_id,
        array['account_manager','content_writer','designer','performance_specialist'],
        'client', client_id
      )
    )
  );

drop policy if exists s015_deliverable_tasks_update on public.deliverable_tasks;
create policy s015_deliverable_tasks_update on public.deliverable_tasks
  for update to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
    or (
      (
        public.owner_user_id_is_actor(tenant_id, deliverable_id)
        or public.contributor_user_ids_contains_actor(tenant_id, deliverable_id)
      )
      and public.f001_has_active_role(
        tenant_id,
        array['account_manager','content_writer','designer','performance_specialist'],
        'client', client_id
      )
    )
  ) with check (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
    or (
      (
        public.owner_user_id_is_actor(tenant_id, deliverable_id)
        or public.contributor_user_ids_contains_actor(tenant_id, deliverable_id)
      )
      and public.f001_has_active_role(
        tenant_id,
        array['account_manager','content_writer','designer','performance_specialist'],
        'client', client_id
      )
    )
  );

drop policy if exists s015_deliverable_tasks_delete on public.deliverable_tasks;
create policy s015_deliverable_tasks_delete on public.deliverable_tasks
  for delete to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
  );

-- 2. RLS INSERT/UPDATE policies for deliverable_quality_checks.
--    Management only. Team and client roles are excluded.

drop policy if exists s015_deliverable_quality_insert on public.deliverable_quality_checks;
create policy s015_deliverable_quality_insert on public.deliverable_quality_checks
  for insert to authenticated with check (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
  );

drop policy if exists s015_deliverable_quality_update on public.deliverable_quality_checks;
create policy s015_deliverable_quality_update on public.deliverable_quality_checks
  for update to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
  ) with check (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
  );

-- 3. Direct table write grants remain revoked. Mutations must use audited RPCs.
revoke insert, update, delete on public.deliverable_tasks from public, anon, authenticated;

revoke insert, update on public.deliverable_quality_checks from public, anon, authenticated;

-- 4. Helper: quality gate passed for a version.
create or replace function private.s015_quality_gate_passed(
  target_tenant_id uuid,
  target_client_id uuid,
  target_version_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.deliverable_quality_checks qc
    where qc.tenant_id = target_tenant_id
      and qc.client_id = target_client_id
      and qc.version_id = target_version_id
      and qc.status not in ('passed', 'not_applicable')
  );
$$;

revoke all on function private.s015_quality_gate_passed(uuid, uuid, uuid)
  from public, anon, authenticated;

-- 7. RPC: upsert a deliverable execution task.
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

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.command_name <> 'upsert_deliverable_task' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return task_id;
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
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_deliverable.current_version_id,
    btrim(request_idempotency_key), 'upsert_deliverable_task',
    'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, null
  );

  if is_new then
    insert into public.deliverable_tasks (
      id, tenant_id, client_id, deliverable_id, version_id,
      title, description, status, priority,
      assignee_user_id, due_date, sort_order, created_by
    ) values (
      task_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_deliverable.current_version_id,
      btrim(target_title), nullif(btrim(target_description), ''),
      target_status, target_priority,
      target_assignee_user_id, target_due_date,
      coalesce(target_sort_order, 0), actor_user_id
    );
  else
    update public.deliverable_tasks t set
      title = btrim(target_title),
      description = nullif(btrim(target_description), ''),
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

-- 8. RPC: delete a deliverable execution task (management only).
create or replace function public.s015_delete_deliverable_task(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_task_id uuid,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  is_management boolean;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_task_id is null
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid delete input' using errcode = 'P0001';
  end if;

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
      or existing_request.command_name <> 'delete_deliverable_task' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return;
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
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, null, btrim(request_idempotency_key),
    'delete_deliverable_task', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, null
  );

  delete from public.deliverable_tasks
  where id = target_task_id
    and tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id
    and deliverable_id = target_deliverable_id;
end;
$$;

revoke all on function public.s015_delete_deliverable_task(uuid,uuid,uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_delete_deliverable_task(uuid,uuid,uuid,uuid,uuid,text)
  to authenticated;

-- 9. RPC: upsert a quality checklist item (management only).
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
      or existing_request.command_name <> 'upsert_quality_check' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return check_id;
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
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'upsert_quality_check', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, target_version.status
  );

  if is_new then
    insert into public.deliverable_quality_checks (
      id, tenant_id, client_id, deliverable_id, version_id,
      label, status, note, checked_by, checked_at, sort_order
    ) values (
      check_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_id,
      btrim(target_label), target_status,
      nullif(btrim(target_note), ''),
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
      note = nullif(btrim(target_note), ''),
      checked_by = case when target_status in ('passed','changes_required','not_applicable')
        then actor_user_id else qc.checked_by end,
      checked_at = case when target_status in ('passed','changes_required','not_applicable')
        then now() else qc.checked_at end,
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

-- 10. Enforce quality gate on internal approval.
--     Replace the internal workflow function to check that all quality checks
--     for the target version are 'passed' or 'not_applicable' before allowing
--     'approve_internal'. If no quality checks exist, approval proceeds.

create or replace function public.s015_execute_internal_workflow(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_command text,
  target_version_number integer,
  command_comment text,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (deliverable_status text, deliverable_revision integer, version_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  management_allowed boolean;
  team_allowed boolean;
  audit_action text;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_command not in ('submit_version', 'approve_internal', 'request_internal_changes', 'send_to_client', 'deliver') then
    raise exception 'invalid workflow command' using errcode = 'P0001';
  end if;
  if request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = request_idempotency_key;
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.command_name <> target_command
      or existing_request.version_id is distinct from target_version_id then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return query select
      existing_request.result_deliverable_status,
      existing_request.result_deliverable_revision,
      existing_request.result_version_status;
    return;
  end if;

  if target_deliverable.status in ('delivered', 'cancelled', 'archived') then
    raise exception 'terminal deliverable state' using errcode = 'P0001';
  end if;
  management_allowed := public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  ) or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_deliverable.tenant_id
  );
  team_allowed := coalesce(management_allowed, false) or (
    (
      coalesce(target_deliverable.owner_user_id = actor_user_id, false)
      or coalesce(actor_user_id = any(coalesce(target_deliverable.contributor_user_ids, array[]::uuid[])), false)
    ) and coalesce(public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['account_manager','content_writer','designer'],
    'client', target_client_id
    ), false)
  );
  if (target_command = 'submit_version' and not team_allowed)
    or (target_command <> 'submit_version' and not management_allowed) then
    raise exception 'workflow command denied' using errcode = '42501';
  end if;

  if target_command = 'submit_version' then
    if target_version_number is null or target_version_number < 1 then
      raise exception 'invalid version number' using errcode = 'P0001';
    end if;
    if target_deliverable.status not in (
      'not_started', 'in_progress', 'internal_changes_requested', 'client_changes_requested'
    ) then
      raise exception 'deliverable not ready for version submission' using errcode = 'P0001';
    end if;
    insert into public.deliverable_versions (
      id, tenant_id, client_id, deliverable_id, version_number, status, submitted_by
    ) values (
      target_version_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_number, 'internal_only', actor_user_id
    ) returning * into target_version;
    update public.deliverables d
    set current_version_id = target_version_id,
        status = 'ready_for_internal_review', progress_percentage = 50,
        revision = d.revision + 1, updated_at = now()
    where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
    audit_action := 'DeliverableVersionSubmitted';
  else
    select * into target_version from public.deliverable_versions v
    where v.id = target_version_id
      and v.tenant_id = target_deliverable.tenant_id
      and v.client_id = target_client_id
      and v.deliverable_id = target_deliverable_id;
    if target_version.id is null
      or target_deliverable.current_version_id is distinct from target_version_id then
      raise exception 'stale or cross-scope version' using errcode = 'P0001';
    end if;

    if target_command = 'approve_internal' then
      if target_version.status <> 'internal_only'
        or target_deliverable.status <> 'ready_for_internal_review' then
        raise exception 'version not ready for internal approval' using errcode = 'P0001';
      end if;
      if not private.s015_quality_gate_passed(
        target_deliverable.tenant_id, target_client_id, target_version_id
      ) then
        raise exception 'quality checklist not complete' using errcode = 'P0001';
      end if;
      insert into public.approval_decisions (
        id, tenant_id, client_id, deliverable_id, version_id, approval_kind, decision, actor_user_id
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, target_version_id, 'internal', 'approved', actor_user_id
      );
      update public.deliverable_versions set status = 'internally_approved'
      where id = target_version_id and tenant_id = target_deliverable.tenant_id;
      update public.deliverables d set status = 'internally_approved', progress_percentage = 70,
        revision = d.revision + 1, updated_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      audit_action := 'DeliverableVersionInternallyApproved';
    elsif target_command = 'request_internal_changes' then
      if target_version.status <> 'internal_only'
        or target_deliverable.status <> 'ready_for_internal_review' then
        raise exception 'version not ready for internal change request' using errcode = 'P0001';
      end if;
      insert into public.approval_decisions (
        id, tenant_id, client_id, deliverable_id, version_id, approval_kind, decision, actor_user_id
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, target_version_id, 'internal', 'changes_requested', actor_user_id
      );
      update public.deliverables d
      set status = 'internal_changes_requested', progress_percentage = 45,
        revision = d.revision + 1, updated_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      audit_action := 'DeliverableInternalChangesRequested';
    elsif target_command = 'send_to_client' then
      if target_version.status <> 'internally_approved'
        or target_deliverable.status <> 'internally_approved' then
        raise exception 'internal approval required for same version' using errcode = 'P0001';
      end if;
      update public.deliverable_versions set status = 'client_visible'
      where id = target_version_id and tenant_id = target_deliverable.tenant_id;
      update public.deliverables d set status = 'waiting_client_approval', progress_percentage = 80,
        revision = d.revision + 1, updated_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      update public.sla_timeline_segments set ended_at = now()
      where tenant_id = target_deliverable.tenant_id and client_id = target_client_id
        and deliverable_id = target_deliverable_id and ended_at is null;
      insert into public.sla_timeline_segments (
        id, tenant_id, client_id, deliverable_id, kind, started_at, reason
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, 'paused_waiting_client', now(), 'sent_to_client'
      );
      audit_action := 'DeliverableVersionSentToClient';
    else
      if target_deliverable.requires_client_approval
        and (target_version.status <> 'client_approved' or target_deliverable.status <> 'client_approved') then
        raise exception 'client approval required for same version' using errcode = 'P0001';
      end if;
      if not target_deliverable.requires_client_approval
        and target_deliverable.status not in ('internally_approved', 'ready_for_delivery') then
        raise exception 'deliverable not ready for delivery' using errcode = 'P0001';
      end if;
      update public.deliverable_versions set status = 'final'
      where id = target_version_id and tenant_id = target_deliverable.tenant_id;
      update public.deliverables d set status = 'delivered', progress_percentage = 100,
        revision = d.revision + 1, updated_at = now(), closed_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      if target_deliverable.contract_id is not null
        and target_deliverable.package_id is not null
        and target_deliverable.package_line_id is not null then
        insert into public.package_ledger_entries (
          id, tenant_id, client_id, contract_id, package_id, package_line_id,
          deliverable_id, entry_type, quantity, reason, actor_user_id, idempotency_key
        )
        select
          gen_random_uuid(), a.tenant_id, a.client_id,
          target_deliverable.contract_id, target_deliverable.package_id,
          a.package_line_id, a.deliverable_id, 'quantity_consumed',
          a.reserved_quantity, 'final_delivery', actor_user_id,
          btrim(request_idempotency_key) || ':consume:' || a.id::text
        from public.deliverable_allocations a
        where a.tenant_id = target_deliverable.tenant_id
          and a.client_id = target_client_id
          and a.deliverable_id = target_deliverable_id
          and a.status = 'reserved';
        update public.deliverable_allocations a
        set status = 'consumed_later'
        where a.tenant_id = target_deliverable.tenant_id
          and a.client_id = target_client_id
          and a.deliverable_id = target_deliverable_id
          and a.status = 'reserved';
      end if;
      update public.sla_timeline_segments set ended_at = now()
      where tenant_id = target_deliverable.tenant_id and client_id = target_client_id
        and deliverable_id = target_deliverable_id and ended_at is null;
      insert into public.sla_timeline_segments (
        id, tenant_id, client_id, deliverable_id, kind, started_at, ended_at, reason
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, 'completed', now(), now(), 'final_delivery'
      );
      audit_action := 'DeliverableFinalDelivered';
    end if;
  end if;

  if nullif(btrim(command_comment), '') is not null then
    insert into public.comments (
      id, tenant_id, client_id, deliverable_id, version_id,
      author_user_id, comment_type, visibility, body
    ) values (
      gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_id, actor_user_id,
      'internal_comment', 'internal_only', btrim(command_comment)
    );
  end if;
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id, actor_user_id,
    audit_action, 'allowed', 'deliverable_version', target_version_id::text, target_command
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision, result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id, target_deliverable_id, target_version_id,
    btrim(request_idempotency_key), target_command, 'allowed', audit_event_id, now(),
    (select status from public.deliverables where id = target_deliverable_id),
    (select revision from public.deliverables where id = target_deliverable_id),
    (select status from public.deliverable_versions where id = target_version_id)
  );

  select * into target_deliverable from public.deliverables d
  where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
  select * into target_version from public.deliverable_versions v
  where v.id = target_version_id and v.tenant_id = target_deliverable.tenant_id;
  return query select target_deliverable.status, target_deliverable.revision, target_version.status;
end;
$$;

revoke all on function public.s015_execute_internal_workflow(uuid, uuid, uuid, text, integer, text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.s015_execute_internal_workflow(uuid, uuid, uuid, text, integer, text, uuid, uuid, text) to authenticated;
