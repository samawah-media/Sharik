-- X010-B6B: safe internal rework plus team invitation RPCs.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_return_deliverable_to_internal_rework(uuid,uuid,uuid,integer,text,uuid,uuid,text)',
    'execute'
  ),
  'authenticated can execute the scoped internal rework RPC'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_invite_internal_team_member_v2(text,text,text,uuid,text,uuid,uuid,text)',
    'execute'
  ),
  'authenticated can execute the scoped internal team invitation RPC'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.s015_invite_internal_team_member(text,text,uuid,uuid,uuid,text)',
    'execute'
  ),
  'the superseded invitation mutation RPC is not executable'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.s015_list_internal_team_invitations()',
    'execute'
  ),
  'the superseded invitation reader is not executable'
);

insert into public.tenants (id, name) values
  ('6b000000-0000-4000-8000-000000000001', 'B6B Tenant'),
  ('6b000000-0000-4000-8000-000000000002', 'B6B Other Tenant');
insert into public.clients (id, tenant_id, name, slug) values
  ('6b000000-0000-4000-8000-000000000101', '6b000000-0000-4000-8000-000000000001', 'B6B Client A', 'b6b-a'),
  ('6b000000-0000-4000-8000-000000000102', '6b000000-0000-4000-8000-000000000001', 'B6B Client B', 'b6b-b'),
  ('6b000000-0000-4000-8000-000000000103', '6b000000-0000-4000-8000-000000000002', 'B6B Other Client', 'b6b-other');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('6b000000-0000-4000-8000-000000000201', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000301', 'active'),
  ('6b000000-0000-4000-8000-000000000202', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000302', 'active'),
  ('6b000000-0000-4000-8000-000000000203', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000304', 'disabled');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('6b000000-0000-4000-8000-000000000401', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000201', 'tenant_administrator', 'tenant', '6b000000-0000-4000-8000-000000000001', 'active'),
  ('6b000000-0000-4000-8000-000000000402', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000202', 'content_writer', 'client', '6b000000-0000-4000-8000-000000000101', 'active'),
  ('6b000000-0000-4000-8000-000000000403', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000203', 'account_manager', 'client', '6b000000-0000-4000-8000-000000000102', 'active');

insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  current_version_id, idempotency_key, requires_internal_approval,
  requires_client_approval, revision
) values
  ('6b000000-0000-4000-8000-000000000501', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', 'Internal approved work', 'post', 'not_started', 0, null, 'b6b-deliverable-1', true, true, 3),
  ('6b000000-0000-4000-8000-000000000502', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', 'Waiting client work', 'post', 'not_started', 0, null, 'b6b-deliverable-2', true, true, 2),
  ('6b000000-0000-4000-8000-000000000503', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', 'Client approved work', 'post', 'not_started', 0, null, 'b6b-deliverable-3', true, true, 2),
  ('6b000000-0000-4000-8000-000000000504', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', 'Delivered work', 'post', 'not_started', 0, null, 'b6b-deliverable-4', true, true, 2);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, caption
) values
  ('6b000000-0000-4000-8000-000000000601', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', '6b000000-0000-4000-8000-000000000501', 1, 'internally_approved', 'Internal approved payload'),
  ('6b000000-0000-4000-8000-000000000602', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', '6b000000-0000-4000-8000-000000000502', 1, 'client_visible', 'Waiting client payload'),
  ('6b000000-0000-4000-8000-000000000603', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', '6b000000-0000-4000-8000-000000000503', 1, 'client_approved', 'Client approved payload'),
  ('6b000000-0000-4000-8000-000000000604', '6b000000-0000-4000-8000-000000000001', '6b000000-0000-4000-8000-000000000101', '6b000000-0000-4000-8000-000000000504', 1, 'final', 'Delivered payload');

update public.deliverables
set current_version_id = case id
      when '6b000000-0000-4000-8000-000000000501'::uuid then '6b000000-0000-4000-8000-000000000601'::uuid
      when '6b000000-0000-4000-8000-000000000502'::uuid then '6b000000-0000-4000-8000-000000000602'::uuid
      when '6b000000-0000-4000-8000-000000000503'::uuid then '6b000000-0000-4000-8000-000000000603'::uuid
      else '6b000000-0000-4000-8000-000000000604'::uuid
    end,
    status = case id
      when '6b000000-0000-4000-8000-000000000501'::uuid then 'internally_approved'
      when '6b000000-0000-4000-8000-000000000502'::uuid then 'waiting_client_approval'
      when '6b000000-0000-4000-8000-000000000503'::uuid then 'client_approved'
      else 'ready_for_delivery'
    end,
    progress_percentage = case id
      when '6b000000-0000-4000-8000-000000000501'::uuid then 70
      when '6b000000-0000-4000-8000-000000000502'::uuid then 80
      when '6b000000-0000-4000-8000-000000000503'::uuid then 90
      else 100
    end
where id in (
  '6b000000-0000-4000-8000-000000000501',
  '6b000000-0000-4000-8000-000000000502',
  '6b000000-0000-4000-8000-000000000503',
  '6b000000-0000-4000-8000-000000000504'
);

update public.deliverables
set status = 'delivered', progress_percentage = 100
where id = '6b000000-0000-4000-8000-000000000504';

set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000301', true);
select results_eq(
  $$select * from public.s015_return_deliverable_to_internal_rework(
    '6b000000-0000-4000-8000-000000000101',
    '6b000000-0000-4000-8000-000000000501',
    '6b000000-0000-4000-8000-000000000601',
    3,
    'سبب واضح للتعديل الداخلي',
    '6b000000-0000-4000-8000-000000000701',
    '6b000000-0000-4000-8000-000000000702',
    'b6b-return-safe'
  )$$,
  $$values ('internal_changes_requested'::text, 4::integer, 'internal_only'::text)$$,
  'management can return internally approved current version to internal rework'
);
select results_eq(
  $$select * from public.s015_return_deliverable_to_internal_rework(
    '6b000000-0000-4000-8000-000000000101',
    '6b000000-0000-4000-8000-000000000501',
    '6b000000-0000-4000-8000-000000000601',
    3,
    'سبب واضح للتعديل الداخلي',
    '6b000000-0000-4000-8000-000000000711',
    '6b000000-0000-4000-8000-000000000712',
    'b6b-return-safe'
  )$$,
  $$values ('internal_changes_requested'::text, 4::integer, 'internal_only'::text)$$,
  'same rework idempotency key replays without duplicate mutation'
);
select is(
  (select count(*)::integer from public.audit_events
    where action = 'DeliverableReturnedToInternalRework'
      and target_id = '6b000000-0000-4000-8000-000000000601'),
  1,
  'internal rework creates one audit event'
);
select is(
  (select count(*)::integer from public.comments
    where deliverable_id = '6b000000-0000-4000-8000-000000000501'
      and visibility = 'internal_only'
      and body = 'سبب واضح للتعديل الداخلي'),
  1,
  'required rework reason is captured as an internal-only comment'
);
select is(
  (select count(*)::integer from public.sla_timeline_segments
    where deliverable_id = '6b000000-0000-4000-8000-000000000501'
      and kind = 'resumed'
      and reason = 'return_internal_rework'),
  1,
  'internal rework resumes Samawah SLA ownership'
);

select throws_ok(
  $$select * from public.s015_return_deliverable_to_internal_rework(
    '6b000000-0000-4000-8000-000000000101',
    '6b000000-0000-4000-8000-000000000502',
    '6b000000-0000-4000-8000-000000000602',
    2,
    'لا نسحب ما وصل للعميل بصمت',
    gen_random_uuid(), gen_random_uuid(), 'b6b-waiting-denied'
  )$$,
  'P0001',
  'client-sent internal recall requires owner decision'
);
select throws_ok(
  $$select * from public.s015_return_deliverable_to_internal_rework(
    '6b000000-0000-4000-8000-000000000101',
    '6b000000-0000-4000-8000-000000000503',
    '6b000000-0000-4000-8000-000000000603',
    2,
    'بعد اعتماد العميل غير محدد',
    gen_random_uuid(), gen_random_uuid(), 'b6b-client-approved-denied'
  )$$,
  'P0001',
  'safe post-internal-approval state required',
  'client-approved work is not silently recalled in B6B'
);
select throws_ok(
  $$select * from public.s015_return_deliverable_to_internal_rework(
    '6b000000-0000-4000-8000-000000000101',
    '6b000000-0000-4000-8000-000000000504',
    '6b000000-0000-4000-8000-000000000604',
    2,
    'لا تفتح النهائي',
    gen_random_uuid(), gen_random_uuid(), 'b6b-terminal-denied'
  )$$,
  'P0001',
  'terminal deliverable state',
  'terminal states remain closed'
);

select results_eq(
  $$select role_key, status, delivery_state from public.s015_invite_internal_team_member_v2(
    'سارة المصممة',
    'new.member@example.test',
    'designer',
    '6b000000-0000-4000-8000-000000000101',
    repeat('a', 64),
    '6b000000-0000-4000-8000-000000000801',
    '6b000000-0000-4000-8000-000000000802',
    'b6b-invite-designer'
  )$$,
  $$values ('designer'::text, 'pending'::text, 'queued'::text)$$,
  'tenant admin creates one pending internal team invitation'
);
select is(
  (select count(*)::integer from public.s015_list_internal_team_invitations_v2()
    where invited_email = 'new.member@example.test'
      and client_name = 'B6B Client A'),
  1,
  'invitation list is scoped to same tenant active clients'
);
select results_eq(
  $$select role_key, status, delivery_state from public.s015_invite_internal_team_member_v2(
    'سارة المصممة',
    'new.member@example.test',
    'designer',
    '6b000000-0000-4000-8000-000000000101',
    repeat('a', 64),
    '6b000000-0000-4000-8000-000000000811',
    '6b000000-0000-4000-8000-000000000812',
    'b6b-invite-designer'
  )$$,
  $$values ('designer'::text, 'pending'::text, 'queued'::text)$$,
  'same invitation command replays without duplicate'
);
select is(
  (select count(*)::integer from public.invitations
    where lower(invited_email) = 'new.member@example.test'
      and status = 'pending'),
  1,
  'duplicate invite does not create another active invitation'
);
select throws_ok(
  $$select * from public.s015_invite_internal_team_member_v2(
    'سارة المصممة',
    'new.member@example.test',
    'account_manager',
    '6b000000-0000-4000-8000-000000000101',
    repeat('b', 64),
    gen_random_uuid(), gen_random_uuid(), 'b6b-invite-expand-denied'
  )$$,
  'P0001',
  'pending invitation already exists',
  'pending invite cannot expand role permissions'
);
select throws_ok(
  $$select * from public.s015_invite_internal_team_member_v2(
    'عضو خارج النطاق',
    'other@example.test',
    'designer',
    '6b000000-0000-4000-8000-000000000103',
    repeat('c', 64),
    gen_random_uuid(), gen_random_uuid(), 'b6b-invite-cross-tenant-denied'
  )$$,
  '42501',
  'team invitation denied',
  'tenant admin cannot invite into another tenant client scope'
);

select is(public.s015_resend_internal_team_invitation_v2(
  '6b000000-0000-4000-8000-000000000801',
  repeat('d', 64),
  '6b000000-0000-4000-8000-000000000821',
  'b6b-resend-invite'
), repeat('d', 64), 'resend returns the one-time replacement link token');
select is(
  (select delivery_state from public.invitations
    where id = '6b000000-0000-4000-8000-000000000801'),
  'queued',
  'resend keeps the same pending invitation and queues delivery without duplicate'
);
select public.s015_revoke_internal_team_invitation_v2(
  '6b000000-0000-4000-8000-000000000801',
  'لم تعد مطلوبة',
  '6b000000-0000-4000-8000-000000000822',
  'b6b-revoke-invite'
);
select is(
  (select status from public.invitations
    where id = '6b000000-0000-4000-8000-000000000801'),
  'revoked',
  'revoke closes the pending invitation without activating membership'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000301', true);
select results_eq(
  $$select role_key, status from public.s015_invite_internal_team_member_v2(
    'أحمد الكاتب',
    'accepted.member@example.test',
    'content_writer',
    '6b000000-0000-4000-8000-000000000101',
    repeat('f', 64),
    '6b000000-0000-4000-8000-000000000831',
    '6b000000-0000-4000-8000-000000000832',
    'b6b-invite-accepted-member'
  )$$,
  $$values ('content_writer'::text, 'pending'::text)$$,
  'admin creates an invitation that can be accepted with its one-time link'
);
select results_eq(
  $$select role_key, status from public.s015_invite_internal_team_member_v2(
    'عضو معطل سابقًا',
    'disabled.member@example.test',
    'designer',
    '6b000000-0000-4000-8000-000000000101',
    repeat('g', 64),
    '6b000000-0000-4000-8000-000000000833',
    '6b000000-0000-4000-8000-000000000834',
    'b6b-invite-disabled-member'
  )$$,
  $$values ('designer'::text, 'pending'::text)$$,
  'management can record a pending invite without implicitly reactivating a disabled member'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000303', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"6b000000-0000-4000-8000-000000000303","email":"accepted.member@example.test"}',
  true
);
select results_eq(
  $$select invited_display_name, role_key, client_name, status
    from public.s015_read_internal_team_invitation(repeat('f', 64))$$,
  $$values ('أحمد الكاتب'::text, 'content_writer'::text, 'B6B Client A'::text, 'pending'::text)$$,
  'the signed-in invited email can preview only its valid invitation'
);
select is(
  public.s015_accept_internal_team_invitation(
    repeat('f', 64),
    '6b000000-0000-4000-8000-000000000841',
    '6b000000-0000-4000-8000-000000000842',
    'b6b-accept-member-link'
  ),
  'accepted',
  'the matching invited user activates the bounded membership and role'
);

reset role;
select is(
  (select count(*)::integer from public.role_assignments ra
    join public.tenant_memberships tm on tm.id = ra.membership_id
    where tm.auth_user_id = '6b000000-0000-4000-8000-000000000303'
      and tm.tenant_id = '6b000000-0000-4000-8000-000000000001'
      and tm.status = 'active'
      and ra.role_key = 'content_writer'
      and ra.scope_type = 'client'
      and ra.scope_id = '6b000000-0000-4000-8000-000000000101'
      and ra.status = 'active'),
  1,
  'acceptance grants only the invited client-scoped role'
);
select is(
  (select display_name from public.member_profiles
    where tenant_id = '6b000000-0000-4000-8000-000000000001'
      and user_id = '6b000000-0000-4000-8000-000000000303'),
  'أحمد الكاتب',
  'acceptance stores the human display name'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000303', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"6b000000-0000-4000-8000-000000000303","email":"accepted.member@example.test"}',
  true
);
select is(
  public.s015_accept_internal_team_invitation(
    repeat('f', 64),
    gen_random_uuid(), gen_random_uuid(), 'b6b-accept-member-link'
  ),
  'accepted',
  'acceptance replay is idempotent'
);

reset role;
select is(
  (select count(*)::integer from public.audit_events
    where action = 'InvitationAccepted'
      and target_id = '6b000000-0000-4000-8000-000000000831'),
  1,
  'acceptance appends one audit decision'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000304', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"6b000000-0000-4000-8000-000000000304","email":"disabled.member@example.test"}',
  true
);
select throws_ok(
  $$select public.s015_accept_internal_team_invitation(
    repeat('g', 64),
    '6b000000-0000-4000-8000-000000000851',
    '6b000000-0000-4000-8000-000000000852',
    'b6b-disabled-member-accept-denied'
  )$$,
  '42501',
  'inactive membership requires management review',
  'accepting a new invite cannot silently reactivate a disabled membership and its old roles'
);
reset role;
select is(
  (select status from public.tenant_memberships
    where id = '6b000000-0000-4000-8000-000000000203'),
  'disabled',
  'the disabled membership remains disabled after the denied acceptance'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000301', true);
select is(
  (select count(*)::integer
    from public.s015_list_internal_team_members()
    where user_id = '6b000000-0000-4000-8000-000000000303'
      and display_name = 'أحمد الكاتب'
      and 'content_writer' = any(role_keys)
      and 'B6B Client A' = any(client_names)),
  1,
  'management directory shows the accepted member with the exact human role and client scope'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000302', true);
select is(
  (select count(*)::integer from public.s015_list_internal_team_members()),
  0,
  'non-management members cannot enumerate the team directory'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '6b000000-0000-4000-8000-000000000302', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"6b000000-0000-4000-8000-000000000302","email":"writer.try@example.test"}',
  true
);
select throws_ok(
  $$select * from public.s015_invite_internal_team_member_v2(
    'محاولة غير مصرح بها',
    'writer.try@example.test',
    'designer',
    '6b000000-0000-4000-8000-000000000101',
    repeat('e', 64),
    gen_random_uuid(), gen_random_uuid(), 'b6b-writer-invite-denied'
  )$$,
  '42501',
  'team invitation denied',
  'non-management team roles cannot invite members'
);
reset role;

select * from finish();
rollback;
