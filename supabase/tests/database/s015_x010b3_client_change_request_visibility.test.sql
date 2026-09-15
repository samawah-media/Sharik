-- X010-B3 corrective pgTAP: client_changes_requested visibility and isolation.
-- Proves the new migration 202608010001 keeps a change-requested deliverable
-- readable by the client while preserving every secrecy boundary.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- Tenant + clients
insert into public.tenants (id, name) values
  ('31000000-0000-4000-8000-000000000001', 'X010B3 Tenant A');
insert into public.clients (id, tenant_id, name, slug) values
  ('31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000001', 'X010B3 Client A', 'x010b3-a'),
  ('31000000-0000-4000-8000-000000000302', '31000000-0000-4000-8000-000000000001', 'X010B3 Client B', 'x010b3-b');

-- Tenant memberships
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('31000000-0000-4000-8000-000000000101', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000201', 'active'),
  ('31000000-0000-4000-8000-000000000102', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000202', 'active'),
  ('31000000-0000-4000-8000-000000000103', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000203', 'active'),
  ('31000000-0000-4000-8000-000000000104', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000204', 'active');

-- Client memberships
insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status) values
  ('31000000-0000-4000-8000-000000000111', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000202', 'active'),
  ('31000000-0000-4000-8000-000000000112', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000203', 'active'),
  ('31000000-0000-4000-8000-000000000113', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000302', '31000000-0000-4000-8000-000000000204', 'active');

-- Role assignments: client_approver A, client_viewer A, client_approver B
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('31000000-0000-4000-8000-000000000401', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '31000000-0000-4000-8000-000000000001', 'active'),
  ('31000000-0000-4000-8000-000000000402', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000102', 'client_approver', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
  ('31000000-0000-4000-8000-000000000403', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000103', 'client_viewer', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
  ('31000000-0000-4000-8000-000000000404', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000104', 'client_approver', 'client', '31000000-0000-4000-8000-000000000302', 'active');

-- Deliverable A in client_changes_requested, Client B deliverable in_progress
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values
  ('31000000-0000-4000-8000-000000000501', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', 'X010B3 change-requested item', 'post', 'client_changes_requested', 65, 'x010b3-change-a', true, true),
  ('31000000-0000-4000-8000-000000000502', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000302', 'X010B3 Client B item', 'post', 'in_progress', 30, 'x010b3-client-b', true, true);

-- Versions: previous internal_only (v1) + current client_visible (v2) for deliverable A
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, content_body
) values
  ('31000000-0000-4000-8000-000000000601', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000501', 1, 'internal_only', 'X010B3 internal draft should not leak'),
  ('31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000501', 2, 'client_visible', 'X010B3 client review content');
update public.deliverables set current_version_id = '31000000-0000-4000-8000-000000000602'
where id = '31000000-0000-4000-8000-000000000501';

-- Comments: one internal + one client_visible on the current version
insert into public.comments (id, tenant_id, client_id, deliverable_id, version_id, author_user_id, comment_type, visibility, body) values
  ('31000000-0000-4000-8000-000000000701', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000501', '31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000201', 'internal_comment', 'internal_only', 'X010B3_INTERNAL_NOTE_MUST_NOT_LEAK'),
  ('31000000-0000-4000-8000-000000000702', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000501', '31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000202', 'client_comment', 'client_visible', 'X010B3 client visible comment');

-- Files: one internal + one client_visible on the current version
insert into public.file_assets (id, tenant_id, client_id, deliverable_id, version_id, owner_user_id, visibility, storage_path, file_type, file_size, version_number, is_final) values
  ('31000000-0000-4000-8000-000000000801', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000501', '31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000201', 'internal_only', 'x010b3/internal.txt', 'text/plain', 100, 2, false),
  ('31000000-0000-4000-8000-000000000802', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000501', '31000000-0000-4000-8000-000000000602', '31000000-0000-4000-8000-000000000201', 'client_visible', 'x010b3/client.pdf', 'application/pdf', 1200, 2, false);

-- ---------------------------------------------------------------------------
-- 1. Client approver and viewer CAN read the client_changes_requested deliverable
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000202', true);
select is(
  (select count(*)::integer from public.deliverables where id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client approver reads the client_changes_requested deliverable within scope'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select is(
  (select count(*)::integer from public.deliverables where id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client viewer reads the client_changes_requested deliverable within scope'
);
reset role;

-- ---------------------------------------------------------------------------
-- 2. Client can read only the current client_visible version
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000202', true);
select is(
  (select count(*)::integer from public.deliverable_versions where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client approver sees only the current client_visible version, not the previous internal_only'
);
select is(
  (select status from public.deliverable_versions where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  'client_visible',
  'the visible version is exactly the current client_visible one'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select is(
  (select count(*)::integer from public.deliverable_versions where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client viewer sees only the current client_visible version'
);
reset role;

-- ---------------------------------------------------------------------------
-- 3. Only client-visible comments appear; internal comments are hidden
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000202', true);
select is(
  (select count(*)::integer from public.comments where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client approver sees only the client-visible comment'
);
select is(
  (select count(*)::integer from public.comments where deliverable_id = '31000000-0000-4000-8000-000000000501' and body like 'X010B3_INTERNAL_NOTE_MUST_NOT_LEAK'),
  0,
  'internal comment body never leaks to the client approver'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select is(
  (select count(*)::integer from public.comments where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client viewer sees only the client-visible comment'
);
reset role;

-- ---------------------------------------------------------------------------
-- 4. Only client-visible files appear; internal files are hidden
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000202', true);
select is(
  (select count(*)::integer from public.file_assets where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client approver sees only the client-visible file'
);
select is(
  (select visibility from public.file_assets where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  'client_visible',
  'the visible file is exactly the client-visible one'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select is(
  (select count(*)::integer from public.file_assets where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  1,
  'client viewer sees only the client-visible file'
);
reset role;

-- ---------------------------------------------------------------------------
-- 5. Client B cannot read Client A deliverable, version, comments or files
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000204', true);
select is(
  (select count(*)::integer from public.deliverables where id = '31000000-0000-4000-8000-000000000501'),
  0,
  'Client B approver cannot read Client A deliverable'
);
select is(
  (select count(*)::integer from public.deliverable_versions where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  0,
  'Client B approver cannot read Client A version'
);
select is(
  (select count(*)::integer from public.comments where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  0,
  'Client B approver cannot read Client A comments'
);
select is(
  (select count(*)::integer from public.file_assets where deliverable_id = '31000000-0000-4000-8000-000000000501'),
  0,
  'Client B approver cannot read Client A files'
);
reset role;

-- ---------------------------------------------------------------------------
-- 6. Direct helper call outside scope returns uniform false (no existence leak)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000204', true);
select is(
  public.s015_client_current_version_is_visible(
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000301',
    '31000000-0000-4000-8000-000000000501',
    '31000000-0000-4000-8000-000000000602'
  ),
  false,
  'Client B direct helper call for Client A returns uniform false'
);
-- The same false must apply for a non-existent deliverable so no oracle exists
select is(
  public.s015_client_current_version_is_visible(
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000301',
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  false,
  'Client B direct helper call for a non-existent Client A row returns the same uniform false'
);
reset role;

-- ---------------------------------------------------------------------------
-- 7. Authorized Client A approver resolves the change-requested current version
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000202', true);
select is(
  public.s015_client_current_version_is_visible(
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000301',
    '31000000-0000-4000-8000-000000000501',
    '31000000-0000-4000-8000-000000000602'
  ),
  true,
  'Client A approver resolves the exact current version of the change-requested deliverable'
);
-- Previous version is not visible through the helper
select is(
  public.s015_client_current_version_is_visible(
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000301',
    '31000000-0000-4000-8000-000000000501',
    '31000000-0000-4000-8000-000000000601'
  ),
  false,
  'Client A approver cannot resolve a previous non-current version through the helper'
);
reset role;

-- ---------------------------------------------------------------------------
-- 8. Anonymous direct RPC is still denied
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$select public.s015_client_current_version_is_visible(
    '31000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000301',
    '31000000-0000-4000-8000-000000000501',
    '31000000-0000-4000-8000-000000000602')$$,
  '42501', null, 'anonymous direct exact-version RPC invocation is denied'
);
reset role;

select * from finish();
rollback;
