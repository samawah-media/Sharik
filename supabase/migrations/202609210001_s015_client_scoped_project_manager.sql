-- TP21-2 / ADR-014: complete client-scoped project manager support.
-- Existing workflow, audit/idempotency logic and function ACLs are preserved.
begin;

alter table public.invitations
drop constraint if exists invitations_f001_membership_role_scope_check;

alter table public.invitations
add constraint invitations_f001_membership_role_scope_check
check (
  (
    membership_type = 'internal'
    and role_key in ('project_manager', 'account_manager', 'content_writer', 'designer')
    and array_length(client_ids, 1) >= 1
  )
  or (
    membership_type = 'client'
    and role_key in ('client_admin', 'client_approver', 'client_viewer')
    and array_length(client_ids, 1) = 1
  )
);



drop policy "f001 client basics select authorized scope" on public.clients;
create policy "f001 client basics select authorized scope"
on public.clients
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager', 'content_writer', 'designer'],
    'client',
    id
  )
  or public.f001_active_client_member(tenant_id, id)
);

drop policy "f002 management select contracts" on public.contracts;
create policy "f002 management select contracts"
on public.contracts
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy "f002 management select contract amendments" on public.contract_amendments;
create policy "f002 management select contract amendments"
on public.contract_amendments
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager'],
    'client',
    client_id
  )
);

drop policy "f002 management select packages" on public.packages;
create policy "f002 management select packages"
on public.packages
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy "f002 management select package lines" on public.package_lines;
create policy "f002 management select package lines"
on public.package_lines
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy "f002 management select package ledger" on public.package_ledger_entries;
create policy "f002 management select package ledger"
on public.package_ledger_entries
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager'],
    'client',
    client_id
  )
);

drop policy "f002 management select deliverable allocations" on public.deliverable_allocations;
create policy "f002 management select deliverable allocations"
on public.deliverable_allocations
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['project_manager', 'account_manager'],
    'client',
    client_id
  )
);

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
        array['project_manager', 'account_manager'],
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

create or replace function public.s015_invite_internal_team_member(
  invited_email_input text,
  role_key_input text,
  target_client_id uuid,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (
  id uuid,
  tenant_id uuid,
  invited_email text,
  role_key text,
  client_id uuid,
  status text,
  delivery_state text,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_tenant_id uuid;
  normalized_email text := lower(btrim(invited_email_input));
  target_client public.clients%rowtype;
  existing public.invitations%rowtype;
  conflicting public.invitations%rowtype;
  existing_request public.mvp_command_requests%rowtype;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select tm.tenant_id into actor_tenant_id
  from public.tenant_memberships tm
  where tm.auth_user_id = actor_user_id
    and tm.status = 'active'
  limit 1;
  if actor_tenant_id is null
    or not public.f001_has_active_role(
      actor_tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      actor_tenant_id
    ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;
  if role_key_input not in ('project_manager','account_manager','content_writer','designer') then
    raise exception 'role assignment denied' using errcode = '42501';
  end if;
  if normalized_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid email required' using errcode = 'P0001';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_client
  from public.clients c
  where c.id = target_client_id
    and c.tenant_id = actor_tenant_id
    and c.status = 'active';
  if target_client.id is null then
    raise exception 'client scope denied' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = actor_tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.command_name <> 'invite_internal_team_member' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    select * into existing
    from public.invitations i
    where i.tenant_id = actor_tenant_id
      and i.idempotency_key = btrim(request_idempotency_key)
      and i.membership_type = 'internal'
    limit 1;
    if existing.id is null then
      raise exception 'idempotency replay missing invitation' using errcode = 'P0001';
    end if;
    return query select
      i.id, i.tenant_id, i.invited_email, i.role_key, target_client_id,
      i.status, i.delivery_state, i.expires_at, i.created_at
    from public.invitations i
    where i.id = existing.id;
    return;
  end if;

  select * into conflicting
  from public.invitations i
  where i.tenant_id = actor_tenant_id
    and i.membership_type = 'internal'
    and i.status = 'pending'
    and lower(i.invited_email) = normalized_email
  limit 1;
  if conflicting.id is not null then
    if conflicting.role_key = role_key_input
      and conflicting.client_ids = array[target_client_id]::uuid[] then
      return query select
        conflicting.id, conflicting.tenant_id, conflicting.invited_email,
        conflicting.role_key, target_client_id, conflicting.status,
        conflicting.delivery_state, conflicting.expires_at, conflicting.created_at;
      return;
    end if;
    raise exception 'pending invitation prevents permission expansion' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, actor_tenant_id, target_client_id, actor_user_id,
    'TenantMembershipInvited', 'allowed', 'invitation',
    request_id::text, role_key_input
  );

  insert into public.invitations (
    id, tenant_id, invited_email, membership_type, role_key, client_ids,
    token_hash, expires_at, created_by, delivery_state, idempotency_key
  ) values (
    request_id, actor_tenant_id, normalized_email, 'internal', role_key_input,
    array[target_client_id]::uuid[], md5(gen_random_uuid()::text || clock_timestamp()::text),
    now() + interval '7 days', actor_user_id, 'queued', btrim(request_idempotency_key)
  ) returning * into existing;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at
  ) values (
    gen_random_uuid(), actor_tenant_id, target_client_id, null, null,
    btrim(request_idempotency_key), 'invite_internal_team_member',
    'allowed', audit_event_id, now()
  );

  return query select
    existing.id, existing.tenant_id, existing.invited_email,
    existing.role_key, target_client_id, existing.status,
    existing.delivery_state, existing.expires_at, existing.created_at;
end;
$$;

create or replace function public.s015_invite_internal_team_member_v2(
  invited_display_name_input text,
  invited_email_input text,
  role_key_input text,
  target_client_id uuid,
  invitation_token_input text,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (
  id uuid,
  tenant_id uuid,
  invited_display_name text,
  invited_email text,
  role_key text,
  client_id uuid,
  status text,
  delivery_state text,
  expires_at timestamptz,
  created_at timestamptz,
  invitation_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  normalized_name text := btrim(invited_display_name_input);
  normalized_email text := lower(btrim(invited_email_input));
  normalized_token text := btrim(invitation_token_input);
  token_fingerprint text := private.s015_invitation_token_fingerprint(normalized_token);
  payload_fingerprint text;
  target_client public.clients%rowtype;
  existing public.invitations%rowtype;
  existing_request public.mvp_command_requests%rowtype;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'valid display name required' using errcode = 'P0001';
  end if;
  if role_key_input not in ('project_manager','account_manager','content_writer','designer') then
    raise exception 'role assignment denied' using errcode = '42501';
  end if;
  if normalized_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid email required' using errcode = 'P0001';
  end if;
  if normalized_token !~ '^[A-Za-z0-9_-]{40,200}$' then
    raise exception 'invalid invitation token' using errcode = 'P0001';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_client
  from public.clients c
  where c.id = target_client_id
    and c.status = 'active';
  if target_client.id is null
    or not public.f001_has_active_role(
      target_client.tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      target_client.tenant_id
    ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;

  payload_fingerprint := md5(jsonb_build_object(
    'name', normalized_name,
    'email', normalized_email,
    'role', role_key_input,
    'clientId', target_client_id,
    'tokenHash', token_fingerprint
  )::text);

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_client.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.command_name <> 'invite_internal_team_member_v2'
      or existing_request.request_fingerprint is distinct from payload_fingerprint
      or existing_request.result_resource_id is null then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    select * into existing
    from public.invitations i
    where i.id = existing_request.result_resource_id
      and i.tenant_id = target_client.tenant_id
      and i.token_hash = token_fingerprint;
    if existing.id is null then
      raise exception 'idempotency replay missing invitation' using errcode = 'P0001';
    end if;
    return query select
      existing.id, existing.tenant_id,
      coalesce(existing.invited_display_name, normalized_name),
      existing.invited_email, existing.role_key, target_client_id,
      existing.status, existing.delivery_state, existing.expires_at,
      existing.created_at, normalized_token;
    return;
  end if;

  if exists (
    select 1 from public.invitations i
    where i.tenant_id = target_client.tenant_id
      and i.membership_type = 'internal'
      and i.status = 'pending'
      and lower(i.invited_email) = normalized_email
  ) then
    raise exception 'pending invitation already exists' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_client.tenant_id, target_client_id, actor_user_id,
    'TenantMembershipInvited', 'allowed', 'invitation', request_id::text,
    role_key_input
  );

  insert into public.invitations (
    id, tenant_id, invited_display_name, invited_email, membership_type,
    role_key, client_ids, token_hash, expires_at, created_by,
    delivery_state, idempotency_key
  ) values (
    request_id, target_client.tenant_id, normalized_name, normalized_email,
    'internal', role_key_input, array[target_client_id]::uuid[],
    token_fingerprint, now() + interval '7 days', actor_user_id,
    'queued', btrim(request_idempotency_key)
  ) returning * into existing;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    gen_random_uuid(), target_client.tenant_id, target_client_id, null, null,
    btrim(request_idempotency_key), 'invite_internal_team_member_v2',
    'allowed', audit_event_id, now(), payload_fingerprint, existing.id
  );

  return query select
    existing.id, existing.tenant_id, existing.invited_display_name,
    existing.invited_email, existing.role_key, target_client_id,
    existing.status, existing.delivery_state, existing.expires_at,
    existing.created_at, normalized_token;
end;
$$;

create or replace function public.s015_invite_internal_team_member_v3(
  invited_display_name_input text,
  invited_email_input text,
  role_key_input text,
  target_client_ids uuid[],
  invitation_token_input text,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (
  id uuid,
  tenant_id uuid,
  invited_display_name text,
  invited_email text,
  role_key text,
  client_ids uuid[],
  status text,
  delivery_state text,
  expires_at timestamptz,
  created_at timestamptz,
  invitation_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  normalized_name text := btrim(invited_display_name_input);
  normalized_email text := lower(btrim(invited_email_input));
  normalized_token text := btrim(invitation_token_input);
  token_fingerprint text := private.s015_invitation_token_fingerprint(normalized_token);
  normalized_client_ids uuid[];
  target_tenant_id uuid;
  target_client_id uuid;
  payload_fingerprint text;
  existing public.invitations%rowtype;
  existing_request public.mvp_command_requests%rowtype;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(normalized_name) < 2 or length(normalized_name) > 120 then
    raise exception 'valid display name required' using errcode = 'P0001';
  end if;
  if role_key_input not in ('project_manager','account_manager','content_writer','designer') then
    raise exception 'role assignment denied' using errcode = '42501';
  end if;
  if normalized_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid email required' using errcode = 'P0001';
  end if;
  if normalized_token !~ '^[A-Za-z0-9_-]{40,200}$' then
    raise exception 'invalid invitation token' using errcode = 'P0001';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select array_agg(distinct client_id order by client_id)
  into normalized_client_ids
  from unnest(coalesce(target_client_ids, array[]::uuid[])) as scoped(client_id)
  where client_id is not null;

  if coalesce(cardinality(normalized_client_ids), 0) = 0
    or cardinality(normalized_client_ids) > 100 then
    raise exception 'at least one client scope required' using errcode = 'P0001';
  end if;

  select c.tenant_id, c.id
  into target_tenant_id, target_client_id
  from public.clients c
  where c.id = normalized_client_ids[1]
    and c.status = 'active';

  if target_tenant_id is null
    or (
      select count(*)
      from public.clients c
      where c.id = any(normalized_client_ids)
        and c.tenant_id = target_tenant_id
        and c.status = 'active'
    ) <> cardinality(normalized_client_ids)
    or not public.f001_has_active_role(
      target_tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      target_tenant_id
    ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;

  payload_fingerprint := md5(jsonb_build_object(
    'name', normalized_name,
    'email', normalized_email,
    'role', role_key_input,
    'clientIds', normalized_client_ids,
    'tokenHash', token_fingerprint
  )::text);

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'invite_internal_team_member_v3'
      or existing_request.request_fingerprint is distinct from payload_fingerprint
      or existing_request.result_resource_id is null then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    select * into existing
    from public.invitations i
    where i.id = existing_request.result_resource_id
      and i.tenant_id = target_tenant_id
      and i.token_hash = token_fingerprint;
    if existing.id is null then
      raise exception 'idempotency replay missing invitation' using errcode = 'P0001';
    end if;
    return query select
      existing.id, existing.tenant_id,
      coalesce(existing.invited_display_name, normalized_name),
      existing.invited_email, existing.role_key, existing.client_ids,
      existing.status, existing.delivery_state, existing.expires_at,
      existing.created_at, normalized_token;
    return;
  end if;

  if exists (
    select 1 from public.invitations i
    where i.tenant_id = target_tenant_id
      and i.membership_type = 'internal'
      and i.status = 'pending'
      and lower(i.invited_email) = normalized_email
  ) then
    raise exception 'pending invitation already exists' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_tenant_id, target_client_id, actor_user_id,
    'TenantMembershipInvited', 'allowed', 'invitation', request_id::text,
    role_key_input
  );

  foreach target_client_id in array normalized_client_ids loop
    insert into public.audit_events (
      id, tenant_id, client_id, actor_user_id, action, decision,
      target_type, target_id, reason
    ) values (
      gen_random_uuid(), target_tenant_id, target_client_id, actor_user_id,
      'RoleAssigned', 'allowed', 'role_assignment_intent',
      request_id::text || ':' || target_client_id::text,
      'intent_pending_acceptance:' || role_key_input
    );
  end loop;

  insert into public.invitations (
    id, tenant_id, invited_display_name, invited_email, membership_type,
    role_key, client_ids, token_hash, expires_at, created_by,
    delivery_state, idempotency_key
  ) values (
    request_id, target_tenant_id, normalized_name, normalized_email,
    'internal', role_key_input, normalized_client_ids,
    token_fingerprint, now() + interval '7 days', actor_user_id,
    'queued', btrim(request_idempotency_key)
  ) returning * into existing;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    gen_random_uuid(), target_tenant_id, normalized_client_ids[1], null, null,
    btrim(request_idempotency_key), 'invite_internal_team_member_v3',
    'allowed', audit_event_id, now(), payload_fingerprint, existing.id
  );

  return query select
    existing.id, existing.tenant_id, existing.invited_display_name,
    existing.invited_email, existing.role_key, existing.client_ids,
    existing.status, existing.delivery_state, existing.expires_at,
    existing.created_at, normalized_token;
end;
$$;

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
        'tenant_owner','tenant_administrator','marketing_manager'
      ) then
      raise exception 'role scope denied' using errcode = '42501';
    end if;
  elsif new_scope_type = 'client' then
    if new_role_key not in (
      'project_manager','account_manager','content_writer','designer','performance_specialist'
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

create or replace function private.s015_can_read_member_profile(
  target_tenant_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.f001_has_active_role(
      target_tenant_id,
      array['tenant_owner', 'tenant_administrator', 'project_manager', 'marketing_manager'],
      'tenant', target_tenant_id
    )
    or exists (
      select 1
      from public.deliverables d
      where d.tenant_id = target_tenant_id
        and public.f001_has_active_role(
          d.tenant_id,
          array['project_manager', 'account_manager', 'content_writer', 'designer', 'performance_specialist'],
          'client', d.client_id
        )
        and (
          d.owner_user_id = target_user_id
          or target_user_id = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
          or exists (
            select 1 from public.deliverable_tasks t
            where t.tenant_id = d.tenant_id
              and t.client_id = d.client_id
              and t.deliverable_id = d.id
              and t.assignee_user_id = target_user_id
          )
          or exists (
            select 1 from public.comments c
            where c.tenant_id = d.tenant_id
              and c.client_id = d.client_id
              and c.deliverable_id = d.id
              and c.author_user_id = target_user_id
          )
          or exists (
            select 1 from public.approval_decisions a
            where a.tenant_id = d.tenant_id
              and a.client_id = d.client_id
              and a.deliverable_id = d.id
              and a.actor_user_id = target_user_id
          )
        )
    )
    or exists (
      select 1
      from public.comments c
      join public.deliverables d
        on d.tenant_id = c.tenant_id
       and d.client_id = c.client_id
       and d.id = c.deliverable_id
      where c.tenant_id = target_tenant_id
        and c.author_user_id = target_user_id
        and c.visibility = 'client_visible'
        and public.s015_client_readable_version_is_visible(
          d.tenant_id, d.client_id, d.id, c.version_id
        )
    );
$$;

commit;
