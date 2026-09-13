-- X010-B-7C-18 D18-C/D: real management member lifecycle.

-- Member lifecycle commands are tenant-scoped and must not be attached to an
-- arbitrary client. Existing deliverable commands continue to provide a client.
alter table public.mvp_command_requests alter column client_id drop not null;

alter table public.mvp_command_requests
  add constraint s015_member_commands_allow_null_client_only
  check (
    client_id is not null
    or (
      deliverable_id is null
      and version_id is null
      and command_name in (
        'update_internal_member_assignment',
        'disable_internal_team_membership'
      )
    )
  );

drop function if exists public.s015_list_internal_team_members();
create function public.s015_list_internal_team_members()
returns table (
  membership_id uuid,
  user_id uuid,
  display_name text,
  membership_status text,
  role_keys text[],
  client_names text[],
  assignments jsonb,
  available_clients jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  with authorized_tenant as (
    select public.f001_actor_tenant_for_client_write() as tenant_id
  )
  select
    tm.id,
    tm.auth_user_id,
    coalesce(nullif(btrim(mp.display_name), ''), 'عضو فريق'),
    tm.status,
    coalesce((
      select array_agg(distinct ra.role_key order by ra.role_key)
      from public.role_assignments ra
      where ra.tenant_id = tm.tenant_id
        and ra.membership_id = tm.id
        and (ra.status = 'active' or tm.status = 'disabled')
        and ra.role_key in (
          'tenant_owner','tenant_administrator','project_manager','marketing_manager',
          'account_manager','content_writer','designer','performance_specialist'
        )
    ), array[]::text[]),
    coalesce((
      select array_agg(distinct c.name order by c.name)
      from public.role_assignments ra
      join public.clients c
        on c.id = ra.scope_id
       and c.tenant_id = ra.tenant_id
      where ra.tenant_id = tm.tenant_id
        and ra.membership_id = tm.id
        and ra.scope_type = 'client'
        and (ra.status = 'active' or tm.status = 'disabled')
    ), array[]::text[]),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'assignmentId', ra.id,
        'roleKey', ra.role_key,
        'scopeType', ra.scope_type,
        'scopeId', ra.scope_id,
        'scopeName', case when ra.scope_type = 'tenant' then 'مساحة سماوة' else c.name end,
        'status', ra.status
      ) order by ra.assigned_at, ra.id)
      from public.role_assignments ra
      left join public.clients c
        on c.id = ra.scope_id
       and c.tenant_id = ra.tenant_id
      where ra.tenant_id = tm.tenant_id
        and ra.membership_id = tm.id
        and (ra.status = 'active' or tm.status = 'disabled')
        and ra.role_key in (
          'tenant_owner','tenant_administrator','project_manager','marketing_manager',
          'account_manager','content_writer','designer','performance_specialist'
        )
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'clientId', c.id,
        'clientName', c.name
      ) order by c.name, c.id)
      from public.clients c
      where c.tenant_id = tm.tenant_id
        and c.status = 'active'
    ), '[]'::jsonb)
  from authorized_tenant scope
  join public.tenant_memberships tm on tm.tenant_id = scope.tenant_id
  left join public.member_profiles mp
    on mp.tenant_id = tm.tenant_id
   and mp.user_id = tm.auth_user_id
  where tm.status in ('active','disabled')
    and exists (
      select 1 from public.role_assignments ra
      where ra.tenant_id = tm.tenant_id
        and ra.membership_id = tm.id
        and ra.role_key in (
          'tenant_owner','tenant_administrator','project_manager','marketing_manager',
          'account_manager','content_writer','designer','performance_specialist'
        )
    )
  order by coalesce(nullif(btrim(mp.display_name), ''), 'عضو فريق'), tm.id;
$$;

revoke all on function public.s015_list_internal_team_members()
  from public, anon, authenticated;
grant execute on function public.s015_list_internal_team_members()
  to authenticated;

create or replace function public.s015_update_internal_member_assignment(
  target_membership_id uuid,
  target_assignment_id uuid,
  new_role_key text,
  new_scope_type text,
  new_scope_id uuid,
  change_reason text,
  audit_event_id uuid,
  request_idempotency_key text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  target_membership public.tenant_memberships%rowtype;
  target_assignment public.role_assignments%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  normalized_reason text := btrim(change_reason);
  payload_fingerprint text;
  result_value text := 'updated';
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  actor_tenant_id := public.f001_actor_tenant_for_client_write();
  if normalized_reason is null or length(normalized_reason) < 3
    or request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid member lifecycle request' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_tenant_id::text, 0));
  payload_fingerprint := md5(jsonb_build_object(
    'membershipId', target_membership_id,
    'assignmentId', target_assignment_id,
    'roleKey', new_role_key,
    'scopeType', new_scope_type,
    'scopeId', new_scope_id,
    'reason', normalized_reason
  )::text);
  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = actor_tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'update_internal_member_assignment'
      or existing_request.result_resource_id is distinct from target_assignment_id
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return coalesce(existing_request.result_deliverable_status, 'updated');
  end if;

  select * into target_membership
  from public.tenant_memberships tm
  where tm.id = target_membership_id
    and tm.tenant_id = actor_tenant_id
    and tm.status = 'active'
  for update;
  select * into target_assignment
  from public.role_assignments ra
  where ra.id = target_assignment_id
    and ra.membership_id = target_membership_id
    and ra.tenant_id = actor_tenant_id
    and ra.status = 'active'
  for update;
  if target_membership.id is null or target_assignment.id is null then
    raise exception 'member lifecycle denied' using errcode = '42501';
  end if;

  if new_scope_type = 'tenant' then
    if new_scope_id <> actor_tenant_id
      or new_role_key not in (
        'tenant_owner','tenant_administrator','project_manager','marketing_manager'
      ) then
      raise exception 'role scope denied' using errcode = '42501';
    end if;
  elsif new_scope_type = 'client' then
    if new_role_key not in (
      'account_manager','content_writer','designer','performance_specialist'
    )
      or not exists (
        select 1 from public.clients c
        where c.id = new_scope_id
          and c.tenant_id = actor_tenant_id
          and c.status = 'active'
      ) then
      raise exception 'role scope denied' using errcode = '42501';
    end if;
  else
    raise exception 'role scope denied' using errcode = '42501';
  end if;
  if target_assignment.scope_type = 'tenant'
    and target_assignment.role_key in ('tenant_owner','tenant_administrator')
    and not (new_scope_type = 'tenant' and new_role_key in ('tenant_owner','tenant_administrator'))
    and not exists (
      select 1
      from public.role_assignments ra
      join public.tenant_memberships tm on tm.id = ra.membership_id
      where ra.tenant_id = actor_tenant_id
        and ra.id <> target_assignment_id
        and ra.status = 'active'
        and ra.scope_type = 'tenant'
        and ra.scope_id = actor_tenant_id
        and ra.role_key in ('tenant_owner','tenant_administrator')
        and tm.status = 'active'
    ) then
    result_value := 'last_administrator_blocked';
  elsif exists (
    select 1 from public.role_assignments ra
    where ra.tenant_id = actor_tenant_id
      and ra.membership_id = target_membership_id
      and ra.id <> target_assignment_id
      and ra.role_key = new_role_key
      and ra.scope_type = new_scope_type
      and ra.scope_id = new_scope_id
      and ra.status = 'active'
  ) then
    raise exception 'active role assignment already exists' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, actor_tenant_id,
    case when new_scope_type = 'client' then new_scope_id else null end,
    actor_user_id,
    case when result_value = 'updated' then 'RoleUpdated' else 'RoleAssignmentDenied' end,
    case when result_value = 'updated' then 'allowed' else 'denied' end,
    'role_assignment', target_assignment_id::text,
    jsonb_build_object(
      'reason', case when result_value = 'updated' then normalized_reason else 'last_active_tenant_administrator' end,
      'oldRole', target_assignment.role_key,
      'oldScopeType', target_assignment.scope_type,
      'oldScopeId', target_assignment.scope_id,
      'newRole', new_role_key,
      'newScopeType', new_scope_type,
      'newScopeId', new_scope_id
    )::text
  );

  if result_value = 'updated' then
    update public.role_assignments
    set role_key = new_role_key,
        scope_type = new_scope_type,
        scope_id = new_scope_id,
        assigned_at = now()
    where id = target_assignment_id;
  end if;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id,
    idempotency_key, command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id, result_deliverable_status
  ) values (
    gen_random_uuid(), actor_tenant_id,
    case when new_scope_type = 'client' then new_scope_id else null end,
    null, null,
    btrim(request_idempotency_key), 'update_internal_member_assignment',
    case when result_value = 'updated' then 'allowed' else 'denied' end,
    audit_event_id, now(), payload_fingerprint, target_assignment_id, result_value
  );
  return result_value;
end;
$$;

create or replace function public.s015_remove_internal_member_client_scope(
  target_membership_id uuid,
  target_assignment_id uuid,
  change_reason text,
  audit_event_id uuid,
  request_idempotency_key text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  target_assignment public.role_assignments%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  normalized_reason text := btrim(change_reason);
  payload_fingerprint text;
begin
  actor_tenant_id := public.f001_actor_tenant_for_client_write();
  if normalized_reason is null or length(normalized_reason) < 3
    or request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid member lifecycle request' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor_tenant_id::text, 0));
  payload_fingerprint := md5(jsonb_build_object(
    'membershipId', target_membership_id,
    'assignmentId', target_assignment_id,
    'reason', normalized_reason
  )::text);
  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = actor_tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'remove_internal_member_client_scope'
      or existing_request.result_resource_id is distinct from target_assignment_id
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return 'removed';
  end if;

  select * into target_assignment
  from public.role_assignments ra
  where ra.id = target_assignment_id
    and ra.membership_id = target_membership_id
    and ra.tenant_id = actor_tenant_id
    and ra.status = 'active'
    and ra.scope_type = 'client'
  for update;
  if target_assignment.id is null or not exists (
    select 1 from public.tenant_memberships tm
    where tm.id = target_membership_id
      and tm.tenant_id = actor_tenant_id
      and tm.status = 'active'
  ) then
    raise exception 'member lifecycle denied' using errcode = '42501';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, actor_tenant_id, target_assignment.scope_id,
    actor_user_id, 'ClientScopeRemoved', 'allowed', 'role_assignment',
    target_assignment_id::text, normalized_reason
  );
  update public.role_assignments set status = 'removed'
  where id = target_assignment_id;
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id,
    idempotency_key, command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    gen_random_uuid(), actor_tenant_id, target_assignment.scope_id, null, null,
    btrim(request_idempotency_key), 'remove_internal_member_client_scope',
    'allowed', audit_event_id, now(), payload_fingerprint, target_assignment_id
  );
  return 'removed';
end;
$$;

create or replace function public.s015_disable_internal_team_membership(
  target_membership_id uuid,
  disable_reason text,
  audit_event_id uuid,
  request_idempotency_key text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  target_membership public.tenant_memberships%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  normalized_reason text := btrim(disable_reason);
  payload_fingerprint text;
  result_value text;
  target_email text;
begin
  actor_tenant_id := public.f001_actor_tenant_for_client_write();
  if normalized_reason is null or length(normalized_reason) < 3
    or request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid member lifecycle request' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor_tenant_id::text, 0));
  payload_fingerprint := md5(jsonb_build_object(
    'membershipId', target_membership_id,
    'reason', normalized_reason
  )::text);
  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = actor_tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'disable_internal_team_membership'
      or existing_request.result_resource_id is distinct from target_membership_id
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return coalesce(existing_request.result_deliverable_status, 'disabled');
  end if;

  select * into target_membership
  from public.tenant_memberships tm
  where tm.id = target_membership_id
    and tm.tenant_id = actor_tenant_id
    and tm.status = 'active'
  for update;
  if target_membership.id is null then
    raise exception 'member lifecycle denied' using errcode = '42501';
  end if;

  if target_membership.auth_user_id = actor_user_id then
    result_value := 'self_disable_blocked';
  elsif exists (
    select 1 from public.deliverables d
    where d.tenant_id = actor_tenant_id
      and d.status not in ('delivered','cancelled','archived')
      and (
        d.owner_user_id = target_membership.auth_user_id
        or target_membership.auth_user_id = any(d.contributor_user_ids)
      )
  ) or exists (
    select 1 from public.deliverable_tasks dt
    where dt.tenant_id = actor_tenant_id
      and dt.assignee_user_id = target_membership.auth_user_id
      and dt.status in ('todo','in_progress')
  ) then
    result_value := 'responsibilities_blocked';
  elsif exists (
    select 1 from public.role_assignments target_ra
    where target_ra.tenant_id = actor_tenant_id
      and target_ra.membership_id = target_membership_id
      and target_ra.status = 'active'
      and target_ra.scope_type = 'tenant'
      and target_ra.scope_id = actor_tenant_id
      and target_ra.role_key in ('tenant_owner','tenant_administrator')
  ) and not exists (
    select 1
    from public.role_assignments ra
    join public.tenant_memberships tm on tm.id = ra.membership_id
    where ra.tenant_id = actor_tenant_id
      and ra.membership_id <> target_membership_id
      and ra.status = 'active'
      and ra.scope_type = 'tenant'
      and ra.scope_id = actor_tenant_id
      and ra.role_key in ('tenant_owner','tenant_administrator')
      and tm.status = 'active'
  ) then
    result_value := 'last_administrator_blocked';
  else
    result_value := 'disabled';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, actor_tenant_id, null, actor_user_id,
    case when result_value = 'disabled' then 'MembershipSuspended' else 'MembershipSuspensionBlocked' end,
    case when result_value = 'disabled' then 'allowed' else 'denied' end,
    'tenant_membership', target_membership_id::text,
    case
      when result_value = 'responsibilities_blocked' then 'active_responsibilities'
      when result_value = 'self_disable_blocked' then 'self_disable'
      when result_value = 'last_administrator_blocked' then 'last_active_tenant_administrator'
      else normalized_reason
    end
  );

  if result_value = 'disabled' then
    insert into public.audit_events (
      id, tenant_id, client_id, actor_user_id, action, decision,
      target_type, target_id, reason
    )
    select gen_random_uuid(), actor_tenant_id,
      case when ra.scope_type = 'client' then ra.scope_id else null end,
      actor_user_id, 'RoleRevoked', 'allowed', 'role_assignment',
      ra.id::text, normalized_reason
    from public.role_assignments ra
    where ra.tenant_id = actor_tenant_id
      and ra.membership_id = target_membership_id
      and ra.status = 'active';

    update public.role_assignments set status = 'removed'
    where tenant_id = actor_tenant_id
      and membership_id = target_membership_id
      and status = 'active';

    select lower(email) into target_email from auth.users
    where id = target_membership.auth_user_id;
    if target_email is not null then
      insert into public.audit_events (
        id, tenant_id, client_id, actor_user_id, action, decision,
        target_type, target_id, reason
      )
      select gen_random_uuid(), actor_tenant_id,
        case when cardinality(i.client_ids) > 0 then i.client_ids[1] else null end,
        actor_user_id, 'InvitationRevoked', 'allowed', 'invitation',
        i.id::text, normalized_reason
      from public.invitations i
      where i.tenant_id = actor_tenant_id
        and i.membership_type = 'internal'
        and i.status = 'pending'
        and lower(i.invited_email) = target_email;

      update public.invitations set status = 'revoked'
      where tenant_id = actor_tenant_id
        and membership_type = 'internal'
        and status = 'pending'
        and lower(invited_email) = target_email;
    end if;

    update public.tenant_memberships
    set status = 'disabled', disabled_at = now()
    where id = target_membership_id;
  end if;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id,
    idempotency_key, command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id, result_deliverable_status
  ) values (
    gen_random_uuid(), actor_tenant_id, null, null, null,
    btrim(request_idempotency_key), 'disable_internal_team_membership',
    case when result_value = 'disabled' then 'allowed' else 'denied' end,
    audit_event_id, now(), payload_fingerprint, target_membership_id, result_value
  );
  return result_value;
end;
$$;

revoke all on function public.s015_update_internal_member_assignment(uuid,uuid,text,text,uuid,text,uuid,text)
  from public, anon, authenticated;
revoke all on function public.s015_remove_internal_member_client_scope(uuid,uuid,text,uuid,text)
  from public, anon, authenticated;
revoke all on function public.s015_disable_internal_team_membership(uuid,text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_update_internal_member_assignment(uuid,uuid,text,text,uuid,text,uuid,text)
  to authenticated;
grant execute on function public.s015_remove_internal_member_client_scope(uuid,uuid,text,uuid,text)
  to authenticated;
grant execute on function public.s015_disable_internal_team_membership(uuid,text,uuid,text)
  to authenticated;
