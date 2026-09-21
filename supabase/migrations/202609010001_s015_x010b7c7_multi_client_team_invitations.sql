-- X010-B-7C-7: explicit, multi-client internal team invitations.
-- The invitation table already stores client_ids[]. This migration removes the
-- single-client runtime restriction while preserving exact tenant scope,
-- exact-email acceptance, append-only audit evidence, and idempotency.

create or replace function public.s015_list_internal_team_invitations_v3()
returns table (
  id uuid,
  tenant_id uuid,
  invited_display_name text,
  invited_email text,
  role_key text,
  client_ids uuid[],
  client_names text[],
  status text,
  delivery_state text,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    i.id,
    i.tenant_id,
    coalesce(nullif(btrim(i.invited_display_name), ''), 'عضو فريق'),
    i.invited_email,
    i.role_key,
    i.client_ids,
    array(
      select c.name
      from unnest(i.client_ids) as scoped(client_id)
      join public.clients c
        on c.id = scoped.client_id
       and c.tenant_id = i.tenant_id
       and c.status = 'active'
      order by c.name, c.id
    ),
    i.status,
    i.delivery_state,
    i.expires_at,
    i.created_at
  from public.invitations i
  where i.membership_type = 'internal'
    and public.f001_has_active_role(
      i.tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      i.tenant_id
    )
  order by i.created_at desc;
$$;

revoke all on function public.s015_list_internal_team_invitations_v3()
  from public, anon, authenticated;
grant execute on function public.s015_list_internal_team_invitations_v3()
  to authenticated;

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
  if role_key_input not in ('account_manager','content_writer','designer') then
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

revoke all on function public.s015_invite_internal_team_member_v3(
  text, text, text, uuid[], text, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_invite_internal_team_member_v3(
  text, text, text, uuid[], text, uuid, uuid, text
) to authenticated;

create or replace function public.s015_read_internal_team_invitation_v2(
  invitation_token_input text
)
returns table (
  invited_display_name text,
  role_key text,
  client_names text[],
  expires_at timestamptz,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(nullif(btrim(i.invited_display_name), ''), 'عضو فريق'),
    i.role_key,
    array(
      select c.name
      from unnest(i.client_ids) as scoped(client_id)
      join public.clients c
        on c.id = scoped.client_id
       and c.tenant_id = i.tenant_id
       and c.status = 'active'
      order by c.name, c.id
    ),
    i.expires_at,
    i.status
  from public.invitations i
  where i.membership_type = 'internal'
    and i.token_hash = private.s015_invitation_token_fingerprint(btrim(invitation_token_input))
    and lower(i.invited_email) = lower(coalesce(
      auth.jwt() ->> 'email',
      current_setting('request.jwt.claim.email', true),
      ''
    ))
    and (
      (i.status = 'pending' and i.expires_at > now())
      or (
        i.status = 'accepted'
        and i.accepted_by = auth.uid()
        and exists (
          select 1
          from public.tenant_memberships tm
          where tm.tenant_id = i.tenant_id
            and tm.auth_user_id = auth.uid()
            and tm.status = 'active'
            and cardinality(i.client_ids) = (
              select count(distinct ra.scope_id)
              from public.role_assignments ra
              where ra.tenant_id = i.tenant_id
                and ra.membership_id = tm.id
                and ra.role_key = i.role_key
                and ra.scope_type = 'client'
                and ra.scope_id = any(i.client_ids)
                and ra.status = 'active'
            )
        )
      )
    )
    and cardinality(i.client_ids) > 0
    and cardinality(i.client_ids) = (
      select count(*)
      from unnest(i.client_ids) as scoped(client_id)
      join public.clients c
        on c.id = scoped.client_id
       and c.tenant_id = i.tenant_id
       and c.status = 'active'
    )
  limit 1;
$$;

revoke all on function public.s015_read_internal_team_invitation_v2(text)
  from public, anon, authenticated;
grant execute on function public.s015_read_internal_team_invitation_v2(text)
  to authenticated;

create or replace function public.s015_accept_internal_team_invitation(
  invitation_token_input text,
  request_id uuid,
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
  actor_email text := lower(coalesce(
    auth.jwt() ->> 'email',
    current_setting('request.jwt.claim.email', true),
    ''
  ));
  normalized_token text := btrim(invitation_token_input);
  target_invitation public.invitations%rowtype;
  target_client_ids uuid[];
  target_client_id uuid;
  target_membership public.tenant_memberships%rowtype;
  target_role public.role_assignments%rowtype;
  payload_fingerprint text;
  existing_request public.mvp_command_requests%rowtype;
begin
  if actor_user_id is null or actor_email = '' then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if normalized_token !~ '^[A-Za-z0-9_-]{40,200}$'
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid invitation request' using errcode = 'P0001';
  end if;

  select * into target_invitation
  from public.invitations i
  where i.membership_type = 'internal'
    and i.token_hash = private.s015_invitation_token_fingerprint(normalized_token)
  for update;

  if target_invitation.id is null
    or lower(target_invitation.invited_email) <> actor_email
    or coalesce(cardinality(target_invitation.client_ids), 0) = 0 then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  if target_invitation.status not in ('pending','accepted')
    or (target_invitation.status = 'pending' and target_invitation.expires_at <= now()) then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  select array_agg(distinct c.id order by c.id)
  into target_client_ids
  from public.clients c
  where c.id = any(target_invitation.client_ids)
    and c.tenant_id = target_invitation.tenant_id
    and c.status = 'active';
  if cardinality(target_client_ids) <> cardinality(target_invitation.client_ids) then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  if target_invitation.status = 'accepted' then
    if target_invitation.accepted_by is distinct from actor_user_id
      or not exists (
        select 1
        from public.tenant_memberships tm
        where tm.tenant_id = target_invitation.tenant_id
          and tm.auth_user_id = actor_user_id
          and tm.status = 'active'
          and cardinality(target_client_ids) = (
            select count(distinct ra.scope_id)
            from public.role_assignments ra
            where ra.tenant_id = target_invitation.tenant_id
              and ra.membership_id = tm.id
              and ra.role_key = target_invitation.role_key
              and ra.scope_type = 'client'
              and ra.scope_id = any(target_client_ids)
              and ra.status = 'active'
          )
      ) then
      raise exception 'invitation unavailable' using errcode = '42501';
    end if;
    return 'accepted';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_user_id::text, 0));
  if exists (
    select 1 from public.tenant_memberships tm
    where tm.auth_user_id = actor_user_id
      and tm.status = 'active'
      and tm.tenant_id <> target_invitation.tenant_id
  ) then
    raise exception 'active membership conflict' using errcode = '42501';
  end if;

  payload_fingerprint := md5(jsonb_build_object(
    'invitationId', target_invitation.id,
    'actorUserId', actor_user_id,
    'clientIds', target_client_ids,
    'tokenHash', private.s015_invitation_token_fingerprint(normalized_token)
  )::text);
  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_invitation.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'accept_internal_team_invitation'
      or existing_request.result_resource_id is distinct from target_invitation.id
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return 'accepted';
  end if;

  select * into target_membership
  from public.tenant_memberships tm
  where tm.tenant_id = target_invitation.tenant_id
    and tm.auth_user_id = actor_user_id
  order by (tm.status = 'active') desc, tm.created_at desc
  limit 1
  for update;
  if target_membership.id is null then
    insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
    values (gen_random_uuid(), target_invitation.tenant_id, actor_user_id, 'active')
    returning * into target_membership;
  elsif target_membership.status <> 'active' then
    raise exception 'inactive membership requires management review'
      using errcode = '42501';
  end if;

  insert into public.member_profiles (tenant_id, user_id, display_name)
  values (
    target_invitation.tenant_id,
    actor_user_id,
    coalesce(nullif(btrim(target_invitation.invited_display_name), ''), 'عضو فريق')
  )
  on conflict (tenant_id, user_id) do update
  set display_name = excluded.display_name,
      updated_at = timezone('utc', now());

  foreach target_client_id in array target_client_ids loop
    select * into target_role
    from public.role_assignments ra
    where ra.tenant_id = target_invitation.tenant_id
      and ra.membership_id = target_membership.id
      and ra.role_key = target_invitation.role_key
      and ra.scope_type = 'client'
      and ra.scope_id = target_client_id
    limit 1
    for update;
    if target_role.id is null then
      insert into public.role_assignments (
        id, tenant_id, membership_id, role_key, scope_type, scope_id, status
      ) values (
        gen_random_uuid(), target_invitation.tenant_id, target_membership.id,
        target_invitation.role_key, 'client', target_client_id, 'active'
      ) returning * into target_role;
    elsif target_role.status <> 'active' then
      update public.role_assignments
      set status = 'active', assigned_at = now()
      where id = target_role.id
      returning * into target_role;
    end if;

    insert into public.audit_events (
      id, tenant_id, client_id, actor_user_id, action, decision,
      target_type, target_id, reason
    ) values (
      gen_random_uuid(), target_invitation.tenant_id, target_client_id,
      actor_user_id, 'RoleAssigned', 'allowed', 'role_assignment',
      target_role.id::text, 'invitation_acceptance'
    );
  end loop;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values
    (audit_event_id, target_invitation.tenant_id, target_client_ids[1],
     actor_user_id, 'InvitationAccepted', 'allowed', 'invitation',
     target_invitation.id::text, target_invitation.role_key),
    (gen_random_uuid(), target_invitation.tenant_id, target_client_ids[1],
     actor_user_id, 'TenantMembershipActivated', 'allowed',
     'tenant_membership', target_membership.id::text, 'invitation_acceptance');

  update public.invitations
  set status = 'accepted', accepted_by = actor_user_id, accepted_at = now()
  where id = target_invitation.id;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    request_id, target_invitation.tenant_id, target_client_ids[1], null, null,
    btrim(request_idempotency_key), 'accept_internal_team_invitation',
    'allowed', audit_event_id, now(), payload_fingerprint,
    target_invitation.id
  );
  return 'accepted';
end;
$$;

revoke all on function public.s015_accept_internal_team_invitation(text, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.s015_accept_internal_team_invitation(text, uuid, uuid, text)
  to authenticated;
