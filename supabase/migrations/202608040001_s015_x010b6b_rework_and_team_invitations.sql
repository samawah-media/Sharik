-- Spec 015 X010-B-6B: bounded post-approval internal rework and audited
-- team invitations. This migration is additive and deliberately keeps
-- client-exposed recall closed: after client exposure, change requests remain
-- the only supported V1 path back to internal work.

alter table public.invitations
  add column if not exists invited_display_name text,
  add column if not exists revoked_by uuid,
  add column if not exists revoked_at timestamptz,
  add column if not exists superseded_by uuid,
  add column if not exists superseded_at timestamptz;

create or replace function public.s015_return_deliverable_to_internal_rework(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  expected_revision integer,
  rework_reason text,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (
  deliverable_status text,
  deliverable_revision integer,
  version_status text
)
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
  trimmed_reason text := nullif(btrim(rework_reason), '');
  payload_fingerprint text;
  v_recipient uuid;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;
  if trimmed_reason is null or length(trimmed_reason) < 3 then
    raise exception 'rework reason required' using errcode = 'P0001';
  end if;
  payload_fingerprint := md5(jsonb_build_object(
    'clientId', target_client_id,
    'deliverableId', target_deliverable_id,
    'versionId', target_version_id,
    'expectedRevision', expected_revision,
    'reason', trimmed_reason
  )::text);

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;

  management_allowed :=
    public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant',
      target_deliverable.tenant_id
    )
    or public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client',
      target_client_id
    );
  if not coalesce(management_allowed, false) then
    raise exception 'internal rework denied' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'return_internal_rework'
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
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
  if target_deliverable.status = 'waiting_client_approval' then
    raise exception 'client-sent internal recall requires owner decision' using errcode = 'P0001';
  end if;
  if expected_revision is null or target_deliverable.revision <> expected_revision then
    raise exception 'stale deliverable revision' using errcode = 'P0001';
  end if;

  select * into target_version
  from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id
  for update;
  if target_version.id is null
    or target_deliverable.current_version_id is distinct from target_version_id then
    raise exception 'stale or cross-scope version' using errcode = 'P0001';
  end if;
  if target_deliverable.status <> 'internally_approved'
    and not (
      target_deliverable.status = 'ready_for_delivery'
      and not target_deliverable.requires_client_approval
    ) then
    raise exception 'safe post-internal-approval state required' using errcode = 'P0001';
  end if;
  if target_version.status <> 'internally_approved' then
    raise exception 'internally approved current version required' using errcode = 'P0001';
  end if;

  update public.deliverable_versions v
  set status = 'internal_only'
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;

  update public.deliverables d
  set status = 'internal_changes_requested',
      progress_percentage = 45,
      revision = d.revision + 1,
      updated_at = now()
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id;

  update public.sla_timeline_segments
  set ended_at = now()
  where tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id
    and deliverable_id = target_deliverable_id
    and ended_at is null;

  insert into public.sla_timeline_segments (
    id, tenant_id, client_id, deliverable_id, kind, started_at, reason
  ) values (
    gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, 'resumed', now(), 'return_internal_rework'
  );

  insert into public.comments (
    id, tenant_id, client_id, deliverable_id, version_id,
    author_user_id, comment_type, visibility, body
  ) values (
    gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, actor_user_id,
    'internal_comment', 'internal_only', trimmed_reason
  );

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'DeliverableReturnedToInternalRework', 'allowed',
    'deliverable_version', target_version_id::text, trimmed_reason
  );

  for v_recipient in
    select * from public.s015_notification_deliverable_execution_recipients(
      target_deliverable.tenant_id,
      target_client_id,
      target_deliverable_id
    )
  loop
    if v_recipient is distinct from actor_user_id then
      perform public.s015_enqueue_notification(
        target_deliverable.tenant_id,
        target_client_id,
        v_recipient,
        'internal_rework_returned',
        'أعيد العمل للتعديل الداخلي',
        'أعادت الإدارة «' || coalesce(nullif(btrim(target_deliverable.name), ''), 'العمل') || '» للتعديل الداخلي قبل أي متابعة خارجية.',
        '/work',
        audit_event_id,
        null,
        'internal_rework_returned:' || audit_event_id::text || ':' || v_recipient::text
      );
    end if;
  end loop;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status, request_fingerprint
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'return_internal_rework', 'allowed', audit_event_id, now(),
    'internal_changes_requested',
    (select revision from public.deliverables where id = target_deliverable_id),
    'internal_only', payload_fingerprint
  );

  return query
  select d.status, d.revision, v.status
  from public.deliverables d
  join public.deliverable_versions v
    on v.id = target_version_id
   and v.tenant_id = d.tenant_id
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id;
end;
$$;

revoke all on function public.s015_return_deliverable_to_internal_rework(
  uuid, uuid, uuid, integer, text, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_return_deliverable_to_internal_rework(
  uuid, uuid, uuid, integer, text, uuid, uuid, text
) to authenticated;

create or replace function public.s015_list_internal_team_invitations()
returns table (
  id uuid,
  tenant_id uuid,
  invited_email text,
  role_key text,
  client_id uuid,
  client_name text,
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
    i.invited_email,
    i.role_key,
    c.id as client_id,
    c.name as client_name,
    i.status,
    i.delivery_state,
    i.expires_at,
    i.created_at
  from public.invitations i
  join lateral unnest(i.client_ids) as scoped_client_id(client_id) on true
  join public.clients c
    on c.id = scoped_client_id.client_id
   and c.tenant_id = i.tenant_id
   and c.status = 'active'
  where i.membership_type = 'internal'
    and cardinality(i.client_ids) = 1
    and public.f001_has_active_role(
      i.tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      i.tenant_id
    )
  order by i.created_at desc;
$$;

revoke all on function public.s015_list_internal_team_invitations()
  from public, anon, authenticated;
grant execute on function public.s015_list_internal_team_invitations()
  to authenticated;

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
  if role_key_input not in ('account_manager','content_writer','designer') then
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

revoke all on function public.s015_invite_internal_team_member(
  text, text, uuid, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_invite_internal_team_member(
  text, text, uuid, uuid, uuid, text
) to authenticated;

create or replace function public.s015_resend_internal_team_invitation(
  target_invitation_id uuid,
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
  target_invitation public.invitations%rowtype;
  target_client_id uuid;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into target_invitation
  from public.invitations i
  where i.id = target_invitation_id
  for update;
  if target_invitation.id is null or target_invitation.status <> 'pending' then
    raise exception 'pending invitation required' using errcode = 'P0001';
  end if;
  target_client_id := target_invitation.client_ids[1];
  if not public.f001_has_active_role(
    target_invitation.tenant_id,
    array['tenant_owner','tenant_administrator'],
    'tenant',
    target_invitation.tenant_id
  ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.mvp_command_requests r
    where r.tenant_id = target_invitation.tenant_id
      and r.idempotency_key = btrim(request_idempotency_key)
      and r.command_name = 'resend_internal_team_invitation'
  ) then
    return;
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_invitation.tenant_id, target_client_id,
    actor_user_id, 'InvitationResent', 'allowed',
    'invitation', target_invitation.id::text, 'resend_without_email'
  );

  update public.invitations
  set token_hash = md5(gen_random_uuid()::text || clock_timestamp()::text),
      expires_at = now() + interval '7 days',
      delivery_state = 'queued'
  where id = target_invitation.id;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at
  ) values (
    gen_random_uuid(), target_invitation.tenant_id, target_client_id,
    null, null, btrim(request_idempotency_key),
    'resend_internal_team_invitation', 'allowed', audit_event_id, now()
  );
end;
$$;

revoke all on function public.s015_resend_internal_team_invitation(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.s015_resend_internal_team_invitation(uuid, uuid, text)
  to authenticated;

create or replace function public.s015_revoke_internal_team_invitation(
  target_invitation_id uuid,
  revoke_reason text,
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
  target_invitation public.invitations%rowtype;
  target_client_id uuid;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into target_invitation
  from public.invitations i
  where i.id = target_invitation_id
  for update;
  if target_invitation.id is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  target_client_id := target_invitation.client_ids[1];
  if not public.f001_has_active_role(
    target_invitation.tenant_id,
    array['tenant_owner','tenant_administrator'],
    'tenant',
    target_invitation.tenant_id
  ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.mvp_command_requests r
    where r.tenant_id = target_invitation.tenant_id
      and r.idempotency_key = btrim(request_idempotency_key)
      and r.command_name = 'revoke_internal_team_invitation'
  ) then
    return;
  end if;

  if target_invitation.status <> 'pending' then
    raise exception 'pending invitation required' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_invitation.tenant_id, target_client_id,
    actor_user_id, 'InvitationRevoked', 'allowed',
    'invitation', target_invitation.id::text, nullif(btrim(revoke_reason), '')
  );

  update public.invitations
  set status = 'revoked',
      revoked_by = actor_user_id,
      revoked_at = now()
  where id = target_invitation.id;

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at
  ) values (
    gen_random_uuid(), target_invitation.tenant_id, target_client_id,
    null, null, btrim(request_idempotency_key),
    'revoke_internal_team_invitation', 'allowed', audit_event_id, now()
  );
end;
$$;

revoke all on function public.s015_revoke_internal_team_invitation(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.s015_revoke_internal_team_invitation(uuid, text, uuid, text)
  to authenticated;

-- The first bounded draft above recorded pending rows only. Keep it unavailable
-- to runtime callers and expose the complete link + acceptance lifecycle below.
revoke execute on function public.s015_list_internal_team_invitations()
  from authenticated;
revoke execute on function public.s015_invite_internal_team_member(
  text, text, uuid, uuid, uuid, text
) from authenticated;
revoke execute on function public.s015_resend_internal_team_invitation(uuid, uuid, text)
  from authenticated;
revoke execute on function public.s015_revoke_internal_team_invitation(uuid, text, uuid, text)
  from authenticated;

create extension if not exists pgcrypto with schema extensions;

create or replace function private.s015_invitation_token_fingerprint(
  invitation_token text
)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select encode(
    extensions.digest(convert_to(invitation_token, 'UTF8'), 'sha256'),
    'hex'
  );
$$;

revoke all on function private.s015_invitation_token_fingerprint(text)
  from public, anon, authenticated;

create or replace function public.s015_list_internal_team_invitations_v2()
returns table (
  id uuid,
  tenant_id uuid,
  invited_display_name text,
  invited_email text,
  role_key text,
  client_id uuid,
  client_name text,
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
    coalesce(nullif(btrim(i.invited_display_name), ''), 'عضو فريق') as invited_display_name,
    i.invited_email,
    i.role_key,
    c.id as client_id,
    c.name as client_name,
    i.status,
    i.delivery_state,
    i.expires_at,
    i.created_at
  from public.invitations i
  join lateral unnest(i.client_ids) as scoped_client_id(client_id) on true
  join public.clients c
    on c.id = scoped_client_id.client_id
   and c.tenant_id = i.tenant_id
   and c.status = 'active'
  where i.membership_type = 'internal'
    and public.f001_has_active_role(
      i.tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      i.tenant_id
    )
  order by i.created_at desc;
$$;

revoke all on function public.s015_list_internal_team_invitations_v2()
  from public, anon, authenticated;
grant execute on function public.s015_list_internal_team_invitations_v2()
  to authenticated;

create or replace function public.s015_list_internal_team_members()
returns table (
  membership_id uuid,
  user_id uuid,
  display_name text,
  membership_status text,
  role_keys text[],
  client_names text[]
)
language sql
security definer
set search_path = public
as $$
  with authorized_tenant as (
    select tm.tenant_id
    from public.tenant_memberships tm
    where tm.auth_user_id = auth.uid()
      and tm.status = 'active'
      and public.f001_has_active_role(
        tm.tenant_id,
        array['tenant_owner','tenant_administrator'],
        'tenant',
        tm.tenant_id
      )
    limit 1
  ), member_scope as (
    select
      tm.id as membership_id,
      tm.auth_user_id as user_id,
      coalesce(nullif(btrim(mp.display_name), ''), 'عضو فريق') as display_name,
      tm.status as membership_status,
      array_agg(distinct ra.role_key order by ra.role_key) as role_keys,
      coalesce(
        array_remove(array_agg(distinct c.name order by c.name), null),
        array[]::text[]
      ) as client_names
    from authorized_tenant scope
    join public.tenant_memberships tm on tm.tenant_id = scope.tenant_id
    join public.role_assignments ra
      on ra.membership_id = tm.id
     and ra.tenant_id = tm.tenant_id
     and ra.status = 'active'
     and ra.role_key in (
       'tenant_owner','tenant_administrator','project_manager',
       'marketing_manager','account_manager','content_writer',
       'designer','performance_specialist'
     )
    left join public.clients c
      on ra.scope_type = 'client'
     and c.id = ra.scope_id
     and c.tenant_id = tm.tenant_id
    left join public.member_profiles mp
      on mp.tenant_id = tm.tenant_id
     and mp.user_id = tm.auth_user_id
    where tm.status in ('active','disabled')
    group by tm.id, tm.auth_user_id, tm.status, mp.display_name
  )
  select *
  from member_scope
  order by display_name, membership_id;
$$;

revoke all on function public.s015_list_internal_team_members()
  from public, anon, authenticated;
grant execute on function public.s015_list_internal_team_members()
  to authenticated;

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

revoke all on function public.s015_invite_internal_team_member_v2(
  text, text, text, uuid, text, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_invite_internal_team_member_v2(
  text, text, text, uuid, text, uuid, uuid, text
) to authenticated;

create or replace function public.s015_resend_internal_team_invitation_v2(
  target_invitation_id uuid,
  invitation_token_input text,
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
  normalized_token text := btrim(invitation_token_input);
  payload_fingerprint text;
  target_invitation public.invitations%rowtype;
  target_client_id uuid;
  existing_request public.mvp_command_requests%rowtype;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if normalized_token !~ '^[A-Za-z0-9_-]{40,200}$'
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid invitation request' using errcode = 'P0001';
  end if;
  select * into target_invitation
  from public.invitations i
  where i.id = target_invitation_id
    and i.membership_type = 'internal'
  for update;
  if target_invitation.id is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  target_client_id := target_invitation.client_ids[1];
  if cardinality(target_invitation.client_ids) <> 1
    or not public.f001_has_active_role(
      target_invitation.tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      target_invitation.tenant_id
    ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;

  payload_fingerprint := md5(jsonb_build_object(
    'invitationId', target_invitation_id,
    'tokenHash', private.s015_invitation_token_fingerprint(normalized_token)
  )::text);
  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_invitation.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'resend_internal_team_invitation_v2'
      or existing_request.result_resource_id is distinct from target_invitation_id
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return normalized_token;
  end if;
  if target_invitation.status <> 'pending' then
    raise exception 'pending invitation required' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_invitation.tenant_id, target_client_id,
    actor_user_id, 'InvitationResent', 'allowed', 'invitation',
    target_invitation.id::text, 'manual_link_regenerated'
  );
  update public.invitations
  set token_hash = private.s015_invitation_token_fingerprint(normalized_token),
      expires_at = now() + interval '7 days',
      delivery_state = 'queued'
  where id = target_invitation.id;
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    gen_random_uuid(), target_invitation.tenant_id, target_client_id,
    null, null, btrim(request_idempotency_key),
    'resend_internal_team_invitation_v2', 'allowed', audit_event_id, now(),
    payload_fingerprint, target_invitation.id
  );
  return normalized_token;
end;
$$;

revoke all on function public.s015_resend_internal_team_invitation_v2(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.s015_resend_internal_team_invitation_v2(uuid, text, uuid, text)
  to authenticated;

create or replace function public.s015_revoke_internal_team_invitation_v2(
  target_invitation_id uuid,
  revoke_reason text,
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
  target_invitation public.invitations%rowtype;
  target_client_id uuid;
  trimmed_reason text := nullif(btrim(revoke_reason), '');
  payload_fingerprint text;
  existing_request public.mvp_command_requests%rowtype;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8
    or trimmed_reason is null then
    raise exception 'invalid invitation request' using errcode = 'P0001';
  end if;
  select * into target_invitation
  from public.invitations i
  where i.id = target_invitation_id
    and i.membership_type = 'internal'
  for update;
  if target_invitation.id is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  target_client_id := target_invitation.client_ids[1];
  if cardinality(target_invitation.client_ids) <> 1
    or not public.f001_has_active_role(
      target_invitation.tenant_id,
      array['tenant_owner','tenant_administrator'],
      'tenant',
      target_invitation.tenant_id
    ) then
    raise exception 'team invitation denied' using errcode = '42501';
  end if;
  payload_fingerprint := md5(jsonb_build_object(
    'invitationId', target_invitation_id,
    'reason', trimmed_reason
  )::text);
  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_invitation.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.command_name <> 'revoke_internal_team_invitation_v2'
      or existing_request.result_resource_id is distinct from target_invitation_id
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return;
  end if;
  if target_invitation.status <> 'pending' then
    raise exception 'pending invitation required' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_invitation.tenant_id, target_client_id,
    actor_user_id, 'InvitationRevoked', 'allowed', 'invitation',
    target_invitation.id::text, trimmed_reason
  );
  update public.invitations
  set status = 'revoked', revoked_by = actor_user_id, revoked_at = now()
  where id = target_invitation.id;
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    gen_random_uuid(), target_invitation.tenant_id, target_client_id,
    null, null, btrim(request_idempotency_key),
    'revoke_internal_team_invitation_v2', 'allowed', audit_event_id, now(),
    payload_fingerprint, target_invitation.id
  );
end;
$$;

revoke all on function public.s015_revoke_internal_team_invitation_v2(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.s015_revoke_internal_team_invitation_v2(uuid, text, uuid, text)
  to authenticated;

create or replace function public.s015_read_internal_team_invitation(
  invitation_token_input text
)
returns table (
  invited_display_name text,
  role_key text,
  client_name text,
  expires_at timestamptz,
  status text
)
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
begin
  if actor_user_id is null or actor_email = ''
    or normalized_token !~ '^[A-Za-z0-9_-]{40,200}$' then
    return;
  end if;
  return query
  select
    coalesce(nullif(btrim(i.invited_display_name), ''), 'عضو فريق'),
    i.role_key,
    c.name,
    i.expires_at,
    i.status
  from public.invitations i
  join public.clients c
    on c.id = i.client_ids[1]
   and c.tenant_id = i.tenant_id
   and c.status = 'active'
  where i.membership_type = 'internal'
    and cardinality(i.client_ids) = 1
    and i.token_hash = private.s015_invitation_token_fingerprint(normalized_token)
    and lower(i.invited_email) = actor_email
    and (
      (i.status = 'pending' and i.expires_at > now())
      or (i.status = 'accepted' and i.accepted_by = actor_user_id)
    )
  limit 1;
end;
$$;

revoke all on function public.s015_read_internal_team_invitation(text)
  from public, anon, authenticated;
grant execute on function public.s015_read_internal_team_invitation(text)
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
    or cardinality(target_invitation.client_ids) <> 1 then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  if target_invitation.status = 'accepted'
    and target_invitation.accepted_by = actor_user_id then
    return 'accepted';
  end if;
  if target_invitation.status <> 'pending' or target_invitation.expires_at <= now() then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;
  target_client_id := target_invitation.client_ids[1];
  if not exists (
    select 1 from public.clients c
    where c.id = target_client_id
      and c.tenant_id = target_invitation.tenant_id
      and c.status = 'active'
  ) then
    raise exception 'invitation unavailable' using errcode = '42501';
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
    insert into public.tenant_memberships (
      id, tenant_id, auth_user_id, status
    ) values (
      gen_random_uuid(), target_invitation.tenant_id, actor_user_id, 'active'
    ) returning * into target_membership;
  elsif target_membership.status <> 'active' then
    raise exception 'inactive membership requires management review'
      using errcode = '42501';
  end if;

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

  insert into public.member_profiles (tenant_id, user_id, display_name)
  values (
    target_invitation.tenant_id,
    actor_user_id,
    coalesce(nullif(btrim(target_invitation.invited_display_name), ''), 'عضو فريق')
  )
  on conflict (tenant_id, user_id) do update
  set display_name = excluded.display_name,
      updated_at = timezone('utc', now());

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values
    (audit_event_id, target_invitation.tenant_id, target_client_id,
     actor_user_id, 'InvitationAccepted', 'allowed', 'invitation',
     target_invitation.id::text, target_invitation.role_key),
    (gen_random_uuid(), target_invitation.tenant_id, target_client_id,
     actor_user_id, 'TenantMembershipActivated', 'allowed',
     'tenant_membership', target_membership.id::text, 'invitation_acceptance'),
    (gen_random_uuid(), target_invitation.tenant_id, target_client_id,
     actor_user_id, 'RoleAssigned', 'allowed', 'role_assignment',
     target_role.id::text, 'invitation_acceptance');

  update public.invitations
  set status = 'accepted', accepted_by = actor_user_id, accepted_at = now()
  where id = target_invitation.id;
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    request_fingerprint, result_resource_id
  ) values (
    request_id, target_invitation.tenant_id, target_client_id, null, null,
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
