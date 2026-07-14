begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into public.tenants (id, name) values
('21000000-0000-4000-8000-000000000001', 'S015 Tenant A'),
('22000000-0000-4000-8000-000000000001', 'S015 Tenant B');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
('21000000-0000-4000-8000-000000000101', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000201', 'active'),
('21000000-0000-4000-8000-000000000102', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000202', 'active'),
('21000000-0000-4000-8000-000000000103', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000203', 'active'),
('21000000-0000-4000-8000-000000000104', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000204', 'active'),
('21000000-0000-4000-8000-000000000105', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000205', 'active'),
('21000000-0000-4000-8000-000000000106', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000206', 'active'),
('21000000-0000-4000-8000-000000000107', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000207', 'active'),
('21000000-0000-4000-8000-000000000108', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000208', 'active'),
('22000000-0000-4000-8000-000000000101', '22000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000201', 'active');
insert into public.clients (id, tenant_id, name, slug) values
('21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000001', 'S015 Client A', 's015-a'),
('21000000-0000-4000-8000-000000000302', '21000000-0000-4000-8000-000000000001', 'S015 Client B', 's015-b'),
('22000000-0000-4000-8000-000000000301', '22000000-0000-4000-8000-000000000001', 'S015 Tenant B Client', 's015-tenant-b');
insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status) values
('21000000-0000-4000-8000-000000000112', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000202', 'active'),
('21000000-0000-4000-8000-000000000116', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000206', 'active'),
('21000000-0000-4000-8000-000000000118', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000302', '21000000-0000-4000-8000-000000000208', 'active');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
('21000000-0000-4000-8000-000000000401', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000101', 'account_manager', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000402', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000102', 'client_viewer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000403', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000103', 'content_writer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000404', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000104', 'designer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000405', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000105', 'content_writer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000406', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000106', 'client_approver', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000407', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000107', 'tenant_administrator', 'tenant', '21000000-0000-4000-8000-000000000001', 'active'),
('21000000-0000-4000-8000-000000000408', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000108', 'client_viewer', 'client', '21000000-0000-4000-8000-000000000302', 'active'),
('22000000-0000-4000-8000-000000000401', '22000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '22000000-0000-4000-8000-000000000001', 'active');
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values
('21000000-0000-4000-8000-000000000501', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Review item', 'post', 'ready_for_internal_review', 50, 's015-review-a', true, true),
('21000000-0000-4000-8000-000000000502', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Other item', 'post', 'in_progress', 30, 's015-other-a', true, true),
('21000000-0000-4000-8000-000000000503', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Delivered item', 'post', 'delivered', 100, 's015-delivered-a', true, true),
('21000000-0000-4000-8000-000000000504', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Writer item', 'post', 'in_progress', 30, 's015-writer-a', true, true),
('21000000-0000-4000-8000-000000000505', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Designer item', 'design', 'in_progress', 30, 's015-designer-a', true, true),
('21000000-0000-4000-8000-000000000506', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Unassigned item', 'post', 'in_progress', 30, 's015-unassigned', true, true),
('21000000-0000-4000-8000-000000000507', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000302', 'Client B item', 'post', 'in_progress', 30, 's015-client-b', true, true),
('22000000-0000-4000-8000-000000000501', '22000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000301', 'Tenant B item', 'post', 'in_progress', 30, 's015-tenant-b', true, true),
('21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Client decision item', 'post', 'waiting_client_approval', 80, 's015-client-decision', true, true),
('21000000-0000-4000-8000-000000000509', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Cancelled item', 'post', 'cancelled', 0, 's015-cancelled', true, true),
('21000000-0000-4000-8000-000000000510', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Archived item', 'post', 'archived', 100, 's015-archived', true, true);
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval,
  owner_user_id
) values (
  '21000000-0000-4000-8000-000000000511', '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301', 'Account manager assigned item',
  'post', 'in_progress', 30, 's015-account-assigned', true, true,
  '21000000-0000-4000-8000-000000000201'
);

update public.deliverables set owner_user_id = '21000000-0000-4000-8000-000000000203'
where id = '21000000-0000-4000-8000-000000000504';
update public.deliverables set contributor_user_ids = array['21000000-0000-4000-8000-000000000204'::uuid]
where id = '21000000-0000-4000-8000-000000000505';
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status
) values
('21000000-0000-4000-8000-000000000601', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501', 1, 'internal_only'),
('21000000-0000-4000-8000-000000000608', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000508', 1, 'client_visible');
update public.deliverables set current_version_id = '21000000-0000-4000-8000-000000000601'
where id = '21000000-0000-4000-8000-000000000501';
update public.deliverables set current_version_id = '21000000-0000-4000-8000-000000000608'
where id = '21000000-0000-4000-8000-000000000508';

set local role anon;
select throws_ok(
  $$select public.s015_client_current_version_is_visible(
    '21000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000301',
    '21000000-0000-4000-8000-000000000508',
    '21000000-0000-4000-8000-000000000608')$$,
  '42501', null, 'anonymous direct exact-version RPC invocation is denied'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-4000-8000-000000000201', true);
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000608'
), false, 'unrelated authenticated Tenant B receives a uniform false result');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000208', true);
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000608'
), false, 'same-tenant Client B receives a uniform false result for Client A');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000608'
), true, 'Client A viewer may resolve only the exact visible current version');
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000601'
), false, 'Client A viewer cannot resolve a stale version');
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', 'ffffffff-ffff-4fff-8fff-ffffffffffff'
), false, 'Client A viewer UUID tampering yields a uniform false result');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000206', true);
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000608'
), true, 'Client A approver may resolve the exact visible current version');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000201', true);
select is(public.s015_client_current_version_is_visible(
  '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000608'
), true, 'authorized internal Client A role may resolve the exact visible version');
reset role;

insert into public.member_profiles (
  tenant_id, user_id, display_name, role_label, sync_run_id
) values
('21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000201', 'Account A', 'Account manager', 'local-scope-test'),
('21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000203', 'Writer A', 'Content writer', 'local-scope-test'),
('21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000204', 'Designer A', 'Designer', 'local-scope-test'),
('21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000205', 'Unassigned A', 'Content writer', 'local-scope-test'),
('21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000207', 'Manager A', 'Tenant administrator', 'local-scope-test'),
('22000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000201', 'Manager B', 'Tenant administrator', 'local-scope-test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select is((select count(*)::integer from public.member_profiles), 5, 'tenant management reads permitted Tenant A display profiles');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000201', true);
select is((select count(*)::integer from public.member_profiles), 3, 'client-scoped internal role resolves only assigned Client A member profiles');
select is((select count(*)::integer from public.member_profiles where user_id = '21000000-0000-4000-8000-000000000205'), 0, 'unassigned member profile is not a raw directory fallback');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is((select count(*)::integer from public.member_profiles), 0, 'client viewer cannot read internal member directory');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000206', true);
select is((select count(*)::integer from public.member_profiles), 0, 'client approver cannot read internal member directory');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000208', true);
select is((select count(*)::integer from public.member_profiles), 0, 'same-tenant Client B cannot read internal member directory');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-4000-8000-000000000201', true);
select is((select count(*)::integer from public.member_profiles where tenant_id = '21000000-0000-4000-8000-000000000001'), 0, 'Tenant B cannot read Tenant A member profiles');
select is((select count(*)::integer from public.member_profiles), 1, 'Tenant B management reads only its permitted tenant profile');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000201', true);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501',
    '21000000-0000-4000-8000-000000000601', 'approve_internal', 1, null,
    gen_random_uuid(), gen_random_uuid(), 's015-account-manager-approve')$$,
  '42501', 'workflow command denied',
  'account manager cannot internally approve'
);
select is((select count(*)::integer from public.f004_update_deliverable_status(
  '21000000-0000-4000-8000-000000000502', gen_random_uuid(),
  '21000000-0000-4000-8000-000000000301', 'internally_approved', 1, null,
  's015-f004-direct-internal')), 0, 'account manager cannot set internally approved through f004');
select is((select count(*)::integer from public.f004_update_deliverable_status(
  '21000000-0000-4000-8000-000000000502', gen_random_uuid(),
  '21000000-0000-4000-8000-000000000301', 'waiting_client_approval', 1, null,
  's015-f004-direct-waiting')), 0, 'account manager cannot send to client through f004');
select is((select count(*)::integer from public.f004_update_deliverable_status(
  '21000000-0000-4000-8000-000000000502', gen_random_uuid(),
  '21000000-0000-4000-8000-000000000301', 'client_approved', 1, null,
  's015-f004-direct-client-approved')), 0, 'account manager cannot forge client approval through f004');
select is((select count(*)::integer from public.f004_update_deliverable_status(
  '21000000-0000-4000-8000-000000000502', gen_random_uuid(),
  '21000000-0000-4000-8000-000000000301', 'delivered', 1, null,
  's015-f004-direct-delivered')), 0, 'account manager cannot deliver through f004');
select is((select count(*)::integer from public.f004_update_deliverable_status(
  '21000000-0000-4000-8000-000000000503', gen_random_uuid(),
  '21000000-0000-4000-8000-000000000301', 'in_progress', 1, null,
  's015-f004-reopen-delivered')), 0, 'account manager cannot reopen a delivered item');
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000511',
    '21000000-0000-4000-8000-000000000611', 'submit_version', 1, null,
    '21000000-0000-4000-8000-000000000711', gen_random_uuid(), 's015-account-submit')$$,
  $$values ('ready_for_internal_review'::text)$$,
  'assigned account manager can submit without approval authority'
);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000503',
    gen_random_uuid(), 'submit_version', 2, null,
    gen_random_uuid(), gen_random_uuid(), 's015-terminal-submit')$$,
  'P0001', 'terminal deliverable state',
  'terminal deliverable cannot accept a new version'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000504',
    '21000000-0000-4000-8000-000000000604', 'submit_version', 1, 'writer note',
    '21000000-0000-4000-8000-000000000704', gen_random_uuid(), 's015-writer-submit')$$,
  $$values ('ready_for_internal_review'::text)$$,
  'assigned content writer can submit an exact version'
);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000506',
    gen_random_uuid(), 'submit_version', 1, null,
    gen_random_uuid(), gen_random_uuid(), 's015-unassigned-submit')$$,
  '42501', 'workflow command denied', 'unassigned writer cannot submit'
);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000302', '21000000-0000-4000-8000-000000000507',
    gen_random_uuid(), 'submit_version', 1, null,
    gen_random_uuid(), gen_random_uuid(), 's015-wrong-client-submit')$$,
  '42501', 'workflow command denied', 'wrong-client writer cannot submit'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000204', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000505',
    '21000000-0000-4000-8000-000000000605', 'submit_version', 1, null,
    '21000000-0000-4000-8000-000000000705', gen_random_uuid(), 's015-designer-submit')$$,
  $$values ('ready_for_internal_review'::text)$$,
  'assigned designer can submit an exact version'
);
reset role;

select throws_ok(
  $$insert into public.approval_decisions (
    id, tenant_id, client_id, deliverable_id, version_id, approval_kind, decision
  ) values (
    gen_random_uuid(), '21000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000502',
    '21000000-0000-4000-8000-000000000601', 'internal', 'approved'
  )$$,
  '23503', null,
  'approval cannot bind a version from another deliverable'
);
select throws_ok(
  $$update public.deliverables
    set current_version_id = '21000000-0000-4000-8000-000000000601'
    where id = '21000000-0000-4000-8000-000000000502'$$,
  '23503', null,
  'current version cannot come from another deliverable'
);

insert into public.comments (
  id, tenant_id, client_id, deliverable_id, version_id,
  comment_type, visibility, body
) values
(gen_random_uuid(), '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501', '21000000-0000-4000-8000-000000000601', 'system_comment', 'internal_only', 'internal system note'),
(gen_random_uuid(), '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000508', '21000000-0000-4000-8000-000000000608', 'system_comment', 'client_visible', 'client system note'),
(gen_random_uuid(), '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000302', '21000000-0000-4000-8000-000000000507', null, 'system_comment', 'client_visible', 'client B system note');

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is((select count(*)::integer from public.comments), 1, 'client sees only explicitly client-visible comments');
select is((select body from public.comments), 'client system note', 'internal system comment remains hidden');
select throws_ok(
  $$select * from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501',
    '21000000-0000-4000-8000-000000000601', 'approved', null,
    gen_random_uuid(), gen_random_uuid(), 's015-viewer-approval')$$,
  '42501', 'client decision denied',
  'client viewer cannot approve'
);
select is((select count(*)::integer from public.comments where client_id = '21000000-0000-4000-8000-000000000302'), 0, 'same-tenant other client remains invisible');
select is((select count(*)::integer from public.deliverables where client_id = '21000000-0000-4000-8000-000000000302'), 0, 'actual Client B deliverable remains invisible to Client A');
select is((select count(*)::integer from public.deliverables where tenant_id = '22000000-0000-4000-8000-000000000001'), 0, 'Tenant B deliverable remains invisible to Tenant A client');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000206', true);
select results_eq(
  $$select deliverable_status from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000508',
    '21000000-0000-4000-8000-000000000608', 'approved', 'approved exact version',
    '21000000-0000-4000-8000-000000000708', '21000000-0000-4000-8000-000000000808',
    's015-client-approve-once')$$,
  $$values ('client_approved'::text)$$,
  'client approver can approve the current exact version'
);
select results_eq(
  $$select deliverable_status from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000508',
    '21000000-0000-4000-8000-000000000608', 'approved', 'replay',
    gen_random_uuid(), gen_random_uuid(), 's015-client-approve-once')$$,
  $$values ('client_approved'::text)$$,
  'idempotent replay returns the original outcome'
);
select is((select count(*)::integer from public.approval_decisions where version_id = '21000000-0000-4000-8000-000000000608'), 1, 'idempotent replay appends one client decision only');
select throws_ok(
  $$select * from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000508',
    '21000000-0000-4000-8000-000000000601', 'approved', null,
    gen_random_uuid(), gen_random_uuid(), 's015-client-approve-once')$$,
  'P0001', 'idempotency conflict', 'idempotency key conflicts across version scope'
);
select throws_ok(
  $$select * from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501',
    '21000000-0000-4000-8000-000000000608', 'approved', null,
    gen_random_uuid(), gen_random_uuid(), 's015-cross-delivery-version')$$,
  'P0001', 'stale or unavailable client version', 'cross-deliverable client version is rejected'
);
reset role;

select throws_ok(
  $$update public.approval_decisions set decision = 'denied'
    where version_id = '21000000-0000-4000-8000-000000000608'$$,
  '42501', 'Spec 015 append-only record cannot be mutated', 'approval decisions are update-protected append-only'
);
select throws_ok(
  $$delete from public.approval_decisions
    where version_id = '21000000-0000-4000-8000-000000000608'$$,
  '42501', 'Spec 015 append-only record cannot be mutated', 'approval decisions are delete-protected append-only'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000509',
    gen_random_uuid(), 'submit_version', 1, null,
    gen_random_uuid(), gen_random_uuid(), 's015-cancelled-terminal')$$,
  'P0001', 'terminal deliverable state', 'cancelled deliverable is terminal'
);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000510',
    gen_random_uuid(), 'submit_version', 1, null,
    gen_random_uuid(), gen_random_uuid(), 's015-archived-terminal')$$,
  'P0001', 'terminal deliverable state', 'archived deliverable is terminal'
);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000502',
    '21000000-0000-4000-8000-000000000601', 'approve_internal', null, 'must rollback',
    gen_random_uuid(), gen_random_uuid(), 's015-atomic-failure')$$,
  'P0001', 'stale or cross-scope version', 'failed exact-version command rolls back atomically'
);
select is((select count(*)::integer from public.mvp_command_requests where idempotency_key = 's015-atomic-failure'), 0, 'failed command leaves no command request');
select is((select count(*)::integer from public.audit_events where reason = 'approve_internal' and target_id = '21000000-0000-4000-8000-000000000601'), 0, 'failed command leaves no workflow audit');
select is((select count(*)::integer from public.comments where body = 'must rollback'), 0, 'failed command leaves no comment');
select is((select count(*)::integer from public.sla_timeline_segments where deliverable_id = '21000000-0000-4000-8000-000000000502'), 0, 'failed command leaves no SLA segment');
select is((select count(*)::integer from public.package_ledger_entries where deliverable_id = '21000000-0000-4000-8000-000000000502'), 0, 'failed command leaves no ledger entry');
select is((select status from public.deliverables where id = '21000000-0000-4000-8000-000000000502'), 'in_progress', 'failed command leaves status unchanged');
reset role;

insert into public.contracts (
  id, tenant_id, client_id, name, reference, status
) values (
  '21000000-0000-4000-8000-000000000901',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  'S015 Journey Contract', 'S015-JOURNEY', 'active'
);
insert into public.packages (
  id, tenant_id, client_id, contract_id, name, status
) values (
  '21000000-0000-4000-8000-000000000902',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000901',
  'S015 Journey Package', 'active'
);
insert into public.package_lines (
  id, tenant_id, client_id, package_id, service_label, deliverable_type_hint,
  unit_label, committed_quantity, status
) values (
  '21000000-0000-4000-8000-000000000903',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000902',
  'Posts', 'post', 'item', 1, 'active'
);
insert into public.deliverables (
  id, tenant_id, client_id, contract_id, package_id, package_line_id,
  name, type, status, progress_percentage, idempotency_key,
  requires_internal_approval, requires_client_approval, owner_user_id
) values (
  '21000000-0000-4000-8000-000000000520',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000901',
  '21000000-0000-4000-8000-000000000902',
  '21000000-0000-4000-8000-000000000903',
  'Full persistent journey item', 'post', 'in_progress', 30,
  's015-full-journey', true, true,
  '21000000-0000-4000-8000-000000000203'
);
insert into public.package_ledger_entries (
  id, tenant_id, client_id, contract_id, package_id, package_line_id,
  deliverable_id, entry_type, quantity, reason, actor_user_id, idempotency_key
) values (
  '21000000-0000-4000-8000-000000000904',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000901',
  '21000000-0000-4000-8000-000000000902',
  '21000000-0000-4000-8000-000000000903',
  '21000000-0000-4000-8000-000000000520',
  'quantity_reserved', 1, 'persistent_journey_reservation',
  '21000000-0000-4000-8000-000000000207',
  's015-full-journey:reserved'
);
insert into public.deliverable_allocations (
  id, tenant_id, client_id, deliverable_id, package_line_id,
  reserved_quantity, status, reservation_ledger_entry_id
) values (
  '21000000-0000-4000-8000-000000000905',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000520',
  '21000000-0000-4000-8000-000000000903',
  1, 'reserved',
  '21000000-0000-4000-8000-000000000904'
);
insert into public.sla_timeline_segments (
  id, tenant_id, client_id, deliverable_id, kind, started_at, reason
) values (
  '21000000-0000-4000-8000-000000000906',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000520',
  'running', now(), 'journey_started'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000620', 'submit_version', 1, 'first draft',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-submit-v1')$$,
  $$values ('ready_for_internal_review'::text)$$,
  'journey assigned writer submits first exact version'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000105', true);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    gen_random_uuid(), 'submit_version', 2, null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-unassigned')$$,
  '42501', 'workflow command denied',
  'journey unassigned same-client writer is denied'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000620', 'request_internal_changes', null, 'revise internally',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-internal-changes')$$,
  $$values ('internal_changes_requested'::text)$$,
  'journey management requests internal changes'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'submit_version', 2, 'replacement draft',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-submit-v2')$$,
  $$values ('ready_for_internal_review'::text)$$,
  'journey writer submits replacement version'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'send_to_client', null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-send-before-approval')$$,
  'P0001', 'internal approval required for same version',
  'journey cannot reach client before internal approval'
);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'approve_internal', null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-approve-v2')$$,
  $$values ('internally_approved'::text)$$,
  'journey management internally approves exact current version'
);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'send_to_client', null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-send-v2')$$,
  $$values ('waiting_client_approval'::text)$$,
  'journey management sends approved version to client'
);
select is(
  (select kind from public.sla_timeline_segments
   where deliverable_id = '21000000-0000-4000-8000-000000000520'
     and ended_at is null),
  'paused_waiting_client',
  'journey SLA pauses while waiting for client'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select throws_ok(
  $$select * from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'approved', null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-viewer-approve')$$,
  '42501', 'client decision denied',
  'journey client viewer cannot approve'
);
select is((select count(*)::integer from public.comments where body in ('first draft', 'replacement draft')), 0, 'journey internal comments remain hidden from client role');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000206', true);
select results_eq(
  $$select deliverable_status from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'changes_requested', 'client requested polish',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-client-change')$$,
  $$values ('client_changes_requested'::text)$$,
  'journey client approver requests changes'
);
reset role;
select is(
  (select kind from public.sla_timeline_segments
   where deliverable_id = '21000000-0000-4000-8000-000000000520'
     and ended_at is null),
  'resumed',
  'journey SLA resumes after client change request'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000622', 'submit_version', 3, 'final replacement',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-submit-v3')$$,
  $$values ('ready_for_internal_review'::text)$$,
  'journey assigned writer submits final replacement'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000622', 'approve_internal', null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-approve-v3')$$,
  $$values ('internally_approved'::text)$$,
  'journey management approves final replacement'
);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000622', 'send_to_client', null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-send-v3')$$,
  $$values ('waiting_client_approval'::text)$$,
  'journey management sends final replacement to client'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000206', true);
select throws_ok(
  $$select * from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000621', 'approved', null,
    gen_random_uuid(), gen_random_uuid(), 's015-journey-stale-v2')$$,
  'P0001', 'stale or unavailable client version',
  'journey old version decisions are rejected'
);
select results_eq(
  $$select deliverable_status from public.s015_client_decide_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000622', 'approved', 'approved final',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-client-approve-final')$$,
  $$values ('client_approved'::text)$$,
  'journey client approver approves final exact version'
);
reset role;

insert into public.file_assets (
  id, tenant_id, client_id, deliverable_id, version_id, owner_user_id,
  visibility, storage_path, file_type, file_size, version_number, is_final
) values
(
  '21000000-0000-4000-8000-000000000907',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000520',
  '21000000-0000-4000-8000-000000000622',
  '21000000-0000-4000-8000-000000000203',
  'internal_only', 'internal/s015/final.psd', 'image/vnd.adobe.photoshop', 10, 1, false
),
(
  '21000000-0000-4000-8000-000000000908',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000520',
  '21000000-0000-4000-8000-000000000622',
  '21000000-0000-4000-8000-000000000203',
  'final_delivery', 'final/s015/final.png', 'image/png', 10, 1, true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is((select count(*)::integer from public.file_assets where deliverable_id = '21000000-0000-4000-8000-000000000520'), 0, 'journey files remain hidden from client before final delivery');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000622', 'deliver', null, 'final delivery',
    '21000000-0000-4000-8000-000000000909', gen_random_uuid(), 's015-journey-deliver-final')$$,
  $$values ('delivered'::text)$$,
  'journey final delivery uses approved exact version'
);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000520',
    '21000000-0000-4000-8000-000000000622', 'deliver', null, 'replay final delivery',
    gen_random_uuid(), gen_random_uuid(), 's015-journey-deliver-final')$$,
  $$values ('delivered'::text)$$,
  'journey final delivery replay is idempotent'
);
select is((select status from public.deliverable_allocations where id = '21000000-0000-4000-8000-000000000905'), 'consumed_later', 'journey package allocation is consumed atomically');
select is((select count(*)::integer from public.package_ledger_entries where deliverable_id = '21000000-0000-4000-8000-000000000520' and entry_type = 'quantity_consumed'), 1, 'journey package consumption ledger is append-once');
select is((select count(*)::integer from public.audit_events where target_id = '21000000-0000-4000-8000-000000000622' and action = 'DeliverableFinalDelivered'), 1, 'journey final delivery audit is append-once');
select is((select count(*)::integer from public.mvp_command_requests where idempotency_key = 's015-journey-deliver-final'), 1, 'journey delivery idempotency is committed once');
select is((select kind from public.sla_timeline_segments where deliverable_id = '21000000-0000-4000-8000-000000000520' and kind = 'completed'), 'completed', 'journey SLA completion segment is recorded');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is((select count(*)::integer from public.file_assets where deliverable_id = '21000000-0000-4000-8000-000000000520'), 1, 'journey client sees only final delivery file after delivery');
select is((select visibility from public.file_assets where deliverable_id = '21000000-0000-4000-8000-000000000520'), 'final_delivery', 'journey internal file remains hidden after delivery');
select is((select count(*)::integer from public.comments where body in ('first draft', 'replacement draft', 'final replacement', 'final delivery')), 0, 'journey internal comments remain hidden after delivery');
reset role;

-- Persistent execution workspace: content drafts, Tiptap comments, and exact scope.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval,
  owner_user_id
) values (
  '21000000-0000-4000-8000-000000000531',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  'Workspace content item', 'post', 'in_progress', 30,
  's015-workspace-content', true, true,
  '21000000-0000-4000-8000-000000000203'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select deliverable_status, version_status from public.s015_save_or_submit_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000531',
    '21000000-0000-4000-8000-000000000631', 1, false,
    'brief', 'body', 'caption', 'instagram', 'post', 'awareness', 'reach', null,
    '21000000-0000-4000-8000-000000000731', '21000000-0000-4000-8000-000000000831',
    's015-workspace-draft')$$,
  $$values ('in_progress'::text, 'draft'::text)$$,
  'assigned writer saves a persistent content draft'
);
select results_eq(
  $$select deliverable_status, version_status from public.s015_save_or_submit_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000531',
    '21000000-0000-4000-8000-000000000631', 1, false,
    'ignored replay', 'ignored replay', null, null, null, null, null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-workspace-draft')$$,
  $$values ('in_progress'::text, 'draft'::text)$$,
  'draft replay returns the first committed result'
);
reset role;
select is(
  (select count(*)::integer from public.audit_events where action = 'DeliverableVersionDraftSaved' and target_id = '21000000-0000-4000-8000-000000000631'),
  1, 'draft audit is append-once'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select deliverable_status, version_status from public.s015_save_or_submit_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000531',
    '21000000-0000-4000-8000-000000000631', 1, true,
    'brief', 'body', 'caption', 'instagram', 'post', 'awareness', 'reach', null,
    '21000000-0000-4000-8000-000000000732', '21000000-0000-4000-8000-000000000832',
    's015-workspace-submit')$$,
  $$values ('ready_for_internal_review'::text, 'internal_only'::text)$$,
  'assigned writer submits the exact draft for internal review'
);
select lives_ok(
  $$select public.s015_add_workspace_comment(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000531',
    '21000000-0000-4000-8000-000000000631', 'internal_only', 'structured note',
    '{"type":"doc","content":[]}'::jsonb,
    '21000000-0000-4000-8000-000000000733', '21000000-0000-4000-8000-000000000833',
    's015-workspace-comment')$$,
  'assigned writer adds an internal Tiptap comment'
);
select is(
  (select body_format from public.comments where deliverable_id = '21000000-0000-4000-8000-000000000531'),
  'tiptap_json', 'structured comment persists as JSON rather than trusted HTML'
);
select throws_ok(
  $$select * from public.s015_save_or_submit_version(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000506',
    gen_random_uuid(), 1, false, null, 'unauthorized', null, null, null, null, null, null,
    gen_random_uuid(), gen_random_uuid(), 's015-denied-draft')$$,
  '42501', 'version command denied', 'unassigned writer cannot save another deliverable draft'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is(
  (select count(*)::integer from public.comments where deliverable_id = '21000000-0000-4000-8000-000000000531'),
  0, 'client viewer cannot read internal workspace comments'
);
select throws_ok(
  $$select public.s015_add_workspace_comment(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000531',
    '21000000-0000-4000-8000-000000000631', 'internal_only', 'forbidden', null,
    gen_random_uuid(), gen_random_uuid(), 's015-client-internal-comment')$$,
  '42501', 'client comment denied', 'client cannot create an internal comment'
);
reset role;

-- Supabase Storage: exact path, client, tenant, visibility, and delivery state.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval,
  owner_user_id
) values (
  '21000000-0000-4000-8000-000000000532',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  'Storage visible item', 'design', 'waiting_client_approval', 80,
  's015-storage-visible', true, true,
  '21000000-0000-4000-8000-000000000203'
);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status
) values (
  '21000000-0000-4000-8000-000000000632',
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301',
  '21000000-0000-4000-8000-000000000532', 1, 'client_visible'
);
update public.deliverables set current_version_id = '21000000-0000-4000-8000-000000000632'
where id = '21000000-0000-4000-8000-000000000532';
insert into storage.objects (id, bucket_id, name, owner_id)
values (
  '21000000-0000-4000-8000-000000000932', 'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/client-note.txt',
  '21000000-0000-4000-8000-000000000202'
), (
  '21000000-0000-4000-8000-000000000934', 'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/internal.txt',
  '21000000-0000-4000-8000-000000000207'
), (
  '21000000-0000-4000-8000-000000000935', 'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/visible.pdf',
  '21000000-0000-4000-8000-000000000207'
), (
  '21000000-0000-4000-8000-000000000936', 'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/final.pdf',
  '21000000-0000-4000-8000-000000000207'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select lives_ok(
  $$select public.s015_add_workspace_comment(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000532',
    '21000000-0000-4000-8000-000000000632', 'client_visible', 'visible team note',
    '{"type":"doc","content":[]}'::jsonb,
    '21000000-0000-4000-8000-000000000735', '21000000-0000-4000-8000-000000000835',
    's015-visible-team-comment')$$,
  'management publishes an explicit client-visible comment'
);
select lives_ok(
  $$select public.s015_register_file_asset(
    '21000000-0000-4000-8000-000000000937',
    '21000000-0000-4000-8000-000000000301',
    '21000000-0000-4000-8000-000000000532',
    '21000000-0000-4000-8000-000000000632', 'deliverable-assets',
    '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/internal.txt',
    'internal.txt', 'text/plain', 12, 'internal_only', false,
    gen_random_uuid(), gen_random_uuid(), 's015-internal-file')$$,
  'management registers an internal-only object'
);
select lives_ok(
  $$select public.s015_register_file_asset(
    '21000000-0000-4000-8000-000000000938',
    '21000000-0000-4000-8000-000000000301',
    '21000000-0000-4000-8000-000000000532',
    '21000000-0000-4000-8000-000000000632', 'deliverable-assets',
    '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/visible.pdf',
    'visible.pdf', 'application/pdf', 12, 'client_visible', false,
    gen_random_uuid(), gen_random_uuid(), 's015-visible-file')$$,
  'management explicitly registers a client-visible object'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select results_eq(
  $$select display_name from public.member_profiles$$,
  $$values ('Manager A'::text)$$,
  'Client A resolves only the author name attached to its visible comment'
);
select lives_ok(
  $$select public.s015_add_workspace_comment(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000532',
    '21000000-0000-4000-8000-000000000632', 'client_visible', 'client reply',
    '{"type":"doc","content":[]}'::jsonb,
    '21000000-0000-4000-8000-000000000736', '21000000-0000-4000-8000-000000000836',
    's015-visible-client-comment')$$,
  'Client A can add a client-visible Tiptap comment to the exact visible version'
);
select ok(private.s015_can_upload_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/client-note.txt'
), 'Client A viewer can upload only to its exact visible version path');
select results_eq(
  $$select public.s015_register_file_asset(
    '21000000-0000-4000-8000-000000000933',
    '21000000-0000-4000-8000-000000000301',
    '21000000-0000-4000-8000-000000000532',
    '21000000-0000-4000-8000-000000000632',
    'deliverable-assets',
    '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/client-note.txt',
    'client-note.txt', 'text/plain', 12, 'client_uploaded', false,
    '21000000-0000-4000-8000-000000000734',
    '21000000-0000-4000-8000-000000000834', 's015-client-file-upload')$$,
  $$values ('21000000-0000-4000-8000-000000000933'::uuid)$$,
  'Client A registers only client-uploaded visibility'
);
select lives_ok(
  $$select * from public.s015_authorize_file_download('21000000-0000-4000-8000-000000000933')$$,
  'Client A can authorize its registered visible file'
);
select is(private.s015_can_read_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/internal.txt'
), false, 'Client A cannot read internal-only storage objects');
select is(private.s015_can_read_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/visible.pdf'
), true, 'Client A can read explicitly client-visible storage objects');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000208', true);
select is((select count(*)::integer from public.member_profiles), 0, 'Client B cannot read Client A visible-comment authors');
select is(private.s015_can_upload_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/client-note.txt'
), false, 'same-tenant Client B cannot upload into Client A path');
select throws_ok(
  $$select * from public.s015_authorize_file_download('21000000-0000-4000-8000-000000000933')$$,
  '42501', 'file download denied', 'same-tenant Client B cannot download Client A file'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22000000-0000-4000-8000-000000000201', true);
select is(private.s015_can_upload_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/client-note.txt'
), false, 'Tenant B cannot upload into Tenant A path');
select throws_ok(
  $$select * from public.s015_authorize_file_download('21000000-0000-4000-8000-000000000933')$$,
  '42501', 'file download denied', 'Tenant B cannot download Tenant A file'
);
reset role;

update public.deliverables set status = 'client_approved', progress_percentage = 90
where id = '21000000-0000-4000-8000-000000000532';
update public.deliverable_versions set status = 'client_approved'
where id = '21000000-0000-4000-8000-000000000632';

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select lives_ok(
  $$select public.s015_register_file_asset(
    '21000000-0000-4000-8000-000000000939',
    '21000000-0000-4000-8000-000000000301',
    '21000000-0000-4000-8000-000000000532',
    '21000000-0000-4000-8000-000000000632', 'deliverable-assets',
    '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/final.pdf',
    'final.pdf', 'application/pdf', 12, 'final_delivery', true,
    gen_random_uuid(), gen_random_uuid(), 's015-final-file')$$,
  'management registers a final file only against an approved exact version'
);
select is(private.s015_can_read_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/internal.txt'
), true, 'authorized management can read internal-only storage objects');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is(private.s015_can_read_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/final.pdf'
), false, 'Client A cannot read final delivery before delivery state');
reset role;

update public.deliverables set status = 'delivered', progress_percentage = 100
where id = '21000000-0000-4000-8000-000000000532';
update public.deliverable_versions set status = 'final'
where id = '21000000-0000-4000-8000-000000000632';

set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select is(private.s015_can_read_storage_object(
  'deliverable-assets',
  '21000000-0000-4000-8000-000000000001/21000000-0000-4000-8000-000000000301/21000000-0000-4000-8000-000000000532/21000000-0000-4000-8000-000000000632/final.pdf'
), true, 'Client A can read final delivery only after delivered state');
reset role;

-- Generic UAT import is service-role only, idempotent, count-only, and rollback scoped.
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select results_eq(
  $$select * from public.s015_import_uat_payload(
    '21000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000301', null, null, 'pgtap-import-001',
    '{"deliverables":[{"id":"21000000-0000-4000-8000-000000000541","versionId":"21000000-0000-4000-8000-000000000641","name":"Imported test item","type":"post","sourceMetadata":{"sheetCategory":"test"}}],"tasks":[]}'::jsonb
  )$$,
  $$values (1, 1, 0)$$,
  'service role imports one bounded run-scoped draft'
);
select results_eq(
  $$select * from public.s015_import_uat_payload(
    '21000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000301', null, null, 'pgtap-import-001',
    '{"deliverables":[{"id":"21000000-0000-4000-8000-000000000541","versionId":"21000000-0000-4000-8000-000000000641","name":"Imported test item","type":"post","sourceMetadata":{"sheetCategory":"test"}}],"tasks":[]}'::jsonb
  )$$,
  $$values (1, 1, 0)$$,
  'same import run replays without duplication'
);
select results_eq(
  $$select deliverable_count, version_count, task_count, would_delete
    from public.s015_rollback_uat_import(
      '21000000-0000-4000-8000-000000000001',
      '21000000-0000-4000-8000-000000000301', 'pgtap-import-001', true
    )$$,
  $$values (1, 1, 0, false)$$,
  'rollback dry-run reports counts without deletion'
);
select results_eq(
  $$select deliverable_count, version_count, task_count, would_delete
    from public.s015_rollback_uat_import(
      '21000000-0000-4000-8000-000000000001',
      '21000000-0000-4000-8000-000000000301', 'pgtap-import-001', false
    )$$,
  $$values (1, 1, 0, true)$$,
  'unused import run rolls back within exact scope'
);
select is((select count(*)::integer from public.deliverables where import_run_id = 'pgtap-import-001'), 0, 'rollback removes only the imported deliverable');
reset role;

-- X007 Checkpoint 1A: team execution task mutation commands.
-- Task creation by assigned writer (positive).
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select lives_ok(
  $$select public.s015_upsert_deliverable_task(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000504',
    null, 'كتابة المقال', 'وصف المهمة', 'todo', 'high', null, null, 0,
    gen_random_uuid(), gen_random_uuid(), 'task-create-writer-1')$$,
  'assigned writer creates a task'
);
select is(
  (select count(*)::integer from public.deliverable_tasks
   where deliverable_id = '21000000-0000-4000-8000-000000000504'
     and title = 'كتابة المقال'),
  1, 'task row exists after creation'
);
reset role;

-- Task creation by unassigned writer (negative).
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000205', true);
select throws_ok(
  $$select public.s015_upsert_deliverable_task(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000506',
    null, 'مهمة غير مصرح بها', '', 'todo', 'normal', null, null, 0,
    gen_random_uuid(), gen_random_uuid(), 'task-create-unassigned-1')$$,
  '42501', 'task command denied',
  'unassigned writer cannot create tasks'
);
reset role;

-- Task creation by client viewer (negative).
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000202', true);
select throws_ok(
  $$select public.s015_upsert_deliverable_task(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000504',
    null, 'مهمة عميل', '', 'todo', 'normal', null, null, 0,
    gen_random_uuid(), gen_random_uuid(), 'task-create-client-1')$$,
  '42501', 'task command denied',
  'client viewer cannot create tasks'
);
reset role;

-- Task status update by assigned writer (positive).
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select lives_ok(
  $$select public.s015_upsert_deliverable_task(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000504',
    (select id from public.deliverable_tasks where deliverable_id = '21000000-0000-4000-8000-000000000504' and title = 'كتابة المقال' limit 1),
    'كتابة المقال', 'وصف المهمة', 'done', 'high', null, null, 0,
    gen_random_uuid(), gen_random_uuid(), 'task-update-writer-1')$$,
  'assigned writer updates task status'
);
select is(
  (select status from public.deliverable_tasks
   where deliverable_id = '21000000-0000-4000-8000-000000000504'
     and title = 'كتابة المقال'),
  'done', 'task status updated to done'
);
reset role;

-- Task idempotent replay returns same task without duplication.
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select lives_ok(
  $$select public.s015_upsert_deliverable_task(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000504',
    null, 'مهمة متكررة', '', 'todo', 'normal', null, null, 0,
    gen_random_uuid(), gen_random_uuid(), 'task-idempotent-1')$$,
  'first task creation succeeds'
);
select throws_ok(
  $$select public.s015_upsert_deliverable_task(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000504',
    null, 'مهمة مختلفة', '', 'todo', 'normal', null, null, 0,
    gen_random_uuid(), gen_random_uuid(), 'task-idempotent-1')$$,
  'P0001', 'idempotency conflict',
  'replay with different payload conflicts'
);
select is(
  (select count(*)::integer from public.deliverable_tasks
   where deliverable_id = '21000000-0000-4000-8000-000000000504'
     and title in ('مهمة متكررة', 'مهمة مختلفة')),
  1, 'idempotent replay did not duplicate'
);
reset role;

-- X007 Checkpoint 1B: quality checklist mutation and gate.
-- Fresh deliverable for quality gate test.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values (
  '21000000-0000-4000-8000-000000000530', '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301', 'Quality gate item', 'post',
  'ready_for_internal_review', 50, 's015-quality-gate', true, true
);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status
) values (
  '21000000-0000-4000-8000-000000000630', '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000530', 1, 'internal_only'
);
update public.deliverables set current_version_id = '21000000-0000-4000-8000-000000000630'
where id = '21000000-0000-4000-8000-000000000530';

-- Quality check creation by management (positive).
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select lives_ok(
  $$select public.s015_upsert_quality_check(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000530',
    '21000000-0000-4000-8000-000000000630', null, 'مراجعة المحتوى', 'pending', '', 0,
    gen_random_uuid(), gen_random_uuid(), 'quality-create-mgmt-1')$$,
  'management creates a quality check'
);
reset role;

-- Quality check creation by writer (negative).
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000203', true);
select throws_ok(
  $$select public.s015_upsert_quality_check(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000530',
    '21000000-0000-4000-8000-000000000630', null, 'فحص غير مصرح', 'pending', '', 0,
    gen_random_uuid(), gen_random_uuid(), 'quality-create-writer-1')$$,
  '42501', 'quality command denied',
  'writer cannot create quality checks'
);
reset role;

-- Quality gate blocks approval when a check is pending.
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000530',
    '21000000-0000-4000-8000-000000000630', 'approve_internal', null, null,
    gen_random_uuid(), gen_random_uuid(), 'quality-gate-block-1')$$,
  'P0001', 'quality checklist not complete',
  'internal approval blocked while quality check is pending'
);
reset role;

-- Quality gate allows approval after all checks pass.
set local role authenticated;
select set_config('request.jwt.claim.sub', '21000000-0000-4000-8000-000000000207', true);
select lives_ok(
  $$select public.s015_upsert_quality_check(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000530',
    '21000000-0000-4000-8000-000000000630',
    (select id from public.deliverable_quality_checks where version_id = '21000000-0000-4000-8000-000000000630' limit 1),
    'مراجعة المحتوى', 'passed', 'مطابق', 0,
    gen_random_uuid(), gen_random_uuid(), 'quality-pass-mgmt-1')$$,
  'management passes the quality check'
);
select results_eq(
  $$select deliverable_status from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000530',
    '21000000-0000-4000-8000-000000000630', 'approve_internal', null, null,
    gen_random_uuid(), gen_random_uuid(), 'quality-gate-pass-1')$$,
  $$values ('internally_approved'::text)$$,
  'internal approval succeeds after quality gate passes'
);
reset role;

select * from finish();
rollback;
