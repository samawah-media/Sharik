-- Spec 015 independent review corrections for task assignment.
-- Keep deliverable/task RLS non-recursive and expose eligible assignees only
-- through an authorized management query.

create or replace function private.s015_current_user_assigned_to_deliverable(
  target_tenant_id uuid,
  target_client_id uuid,
  target_deliverable_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.deliverable_tasks t
    where t.tenant_id = target_tenant_id
      and t.client_id = target_client_id
      and t.deliverable_id = target_deliverable_id
      and t.assignee_user_id = auth.uid()
  );
$$;

revoke all on function private.s015_current_user_assigned_to_deliverable(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.s015_current_user_assigned_to_deliverable(uuid, uuid, uuid)
  to authenticated;

create or replace function private.s015_current_user_owns_or_contributes_to_deliverable(
  target_tenant_id uuid,
  target_client_id uuid,
  target_deliverable_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.deliverables d
    where d.tenant_id = target_tenant_id
      and d.client_id = target_client_id
      and d.id = target_deliverable_id
      and (
        d.owner_user_id = auth.uid()
        or auth.uid() = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
      )
  );
$$;

revoke all on function private.s015_current_user_owns_or_contributes_to_deliverable(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.s015_current_user_owns_or_contributes_to_deliverable(uuid, uuid, uuid)
  to authenticated;

drop policy if exists "f002 management select deliverables" on public.deliverables;
create policy "f002 management select deliverables"
on public.deliverables
for select to authenticated using (
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
    public.f001_has_active_role(
      tenant_id,
      array['account_manager','content_writer','designer','performance_specialist'],
      'client', client_id
    )
    and (
      deliverables.owner_user_id = auth.uid()
      or auth.uid() = any(coalesce(deliverables.contributor_user_ids, array[]::uuid[]))
      or private.s015_current_user_assigned_to_deliverable(
        deliverables.tenant_id,
        deliverables.client_id,
        deliverables.id
      )
    )
  )
);

drop policy if exists s015_deliverable_tasks_select on public.deliverable_tasks;
create policy s015_deliverable_tasks_select on public.deliverable_tasks
for select to authenticated using (
  public.f001_has_active_role(
    deliverable_tasks.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', deliverable_tasks.tenant_id
  )
  or public.f001_has_active_role(
    deliverable_tasks.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', deliverable_tasks.client_id
  )
  or (
    public.f001_has_active_role(
      deliverable_tasks.tenant_id,
      array['account_manager','content_writer','designer','performance_specialist'],
      'client', deliverable_tasks.client_id
    )
    and (
      deliverable_tasks.assignee_user_id = auth.uid()
      or private.s015_current_user_owns_or_contributes_to_deliverable(
        deliverable_tasks.tenant_id,
        deliverable_tasks.client_id,
        deliverable_tasks.deliverable_id
      )
    )
  )
);

-- This helper is an implementation detail of the audited task command. Direct
-- access would disclose whether arbitrary user IDs have an eligible role.
revoke all on function private.s015_validate_task_assignee(uuid, uuid, uuid)
  from public, anon, authenticated;

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
    );
$$;

revoke all on function public.s015_list_task_eligible_assignees(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.s015_list_task_eligible_assignees(uuid, uuid)
  to authenticated;

-- Keep the implementation from migration 202607140005 private, and require an
-- active role before any caller can reach its owner/contributor/assignee
-- authority branches. This prevents a former assignee with a disabled
-- membership from retaining command access through the security-definer RPC.
alter function public.s015_upsert_deliverable_task(
  uuid, uuid, uuid, text, text, text, text, uuid, date, integer, uuid, uuid, text
) rename to s015_upsert_deliverable_task_core;

alter function public.s015_upsert_deliverable_task_core(
  uuid, uuid, uuid, text, text, text, text, uuid, date, integer, uuid, uuid, text
) set schema private;

revoke all on function private.s015_upsert_deliverable_task_core(
  uuid, uuid, uuid, text, text, text, text, uuid, date, integer, uuid, uuid, text
) from public, anon, authenticated;

create function public.s015_upsert_deliverable_task(
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
set search_path = public, private
as $$
declare
  actor_user_id uuid := auth.uid();
  target_tenant_id uuid;
  target_owner_user_id uuid;
  target_contributor_user_ids uuid[];
  existing_assignee_user_id uuid;
  task_exists boolean := false;
  has_active_management_role boolean;
  has_active_team_role boolean;
  owns_or_contributes boolean;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select d.tenant_id, d.owner_user_id, d.contributor_user_ids
  into target_tenant_id, target_owner_user_id, target_contributor_user_ids
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;

  if target_tenant_id is null then
    raise exception 'task command denied' using errcode = '42501';
  end if;

  has_active_management_role := public.f001_has_active_role(
    target_tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_tenant_id
  ) or public.f001_has_active_role(
    target_tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  );
  has_active_team_role := public.f001_has_active_role(
    target_tenant_id,
    array['account_manager','content_writer','designer','performance_specialist'],
    'client', target_client_id
  );
  owns_or_contributes := has_active_team_role and (
    target_owner_user_id = actor_user_id
    or actor_user_id = any(coalesce(target_contributor_user_ids, array[]::uuid[]))
  );

  if not (has_active_management_role or has_active_team_role) then
    raise exception 'task command denied' using errcode = '42501';
  end if;

  if target_task_id is null then
    if not (has_active_management_role or coalesce(owns_or_contributes, false)) then
      raise exception 'task command denied' using errcode = '42501';
    end if;
  else
    select true, t.assignee_user_id
    into task_exists, existing_assignee_user_id
    from public.deliverable_tasks t
    where t.id = target_task_id
      and t.tenant_id = target_tenant_id
      and t.client_id = target_client_id
      and t.deliverable_id = target_deliverable_id
    for update;

    if not coalesce(task_exists, false) or not (
      has_active_management_role
      or coalesce(owns_or_contributes, false)
      or coalesce(existing_assignee_user_id = actor_user_id, false)
    ) then
      raise exception 'task command denied' using errcode = '42501';
    end if;
  end if;

  return private.s015_upsert_deliverable_task_core(
    target_client_id,
    target_deliverable_id,
    target_task_id,
    target_title,
    target_description,
    target_status,
    target_priority,
    target_assignee_user_id,
    target_due_date,
    target_sort_order,
    request_id,
    audit_event_id,
    request_idempotency_key
  );
end;
$$;

revoke all on function public.s015_upsert_deliverable_task(
  uuid, uuid, uuid, text, text, text, text, uuid, date, integer, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_upsert_deliverable_task(
  uuid, uuid, uuid, text, text, text, text, uuid, date, integer, uuid, uuid, text
) to authenticated;

-- member_profiles was created after the local/service-role grants migration.
-- Grant only this table so reviewed seed/sync harnesses can maintain scoped
-- human-readable profiles without broadening authenticated access.
grant select, insert, update, delete on public.member_profiles to service_role;
grant select, insert, update, delete on public.deliverable_tasks to service_role;
grant select, insert, update, delete on public.deliverable_quality_checks to service_role;
