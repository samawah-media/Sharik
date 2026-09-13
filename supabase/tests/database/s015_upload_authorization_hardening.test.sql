-- Spec 015 X010-A corrective hardening: upload authorization matrix and cancel
-- cleanup contract (S015-P1-111, S015-P1-112).
-- Self-contained: each scenario proves real RPC behavior, not shape-only asserts.

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- Tenant A / Tenant B
insert into public.tenants (id, name) values
('31000000-0000-4000-8000-000000000001', 'X010A Tenant A'),
('32000000-0000-4000-8000-000000000001', 'X010A Tenant B');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
('31000000-0000-4000-8000-000000000101', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000201', 'active'),
('31000000-0000-4000-8000-000000000102', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000202', 'active'),
('31000000-0000-4000-8000-000000000103', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000203', 'active'),
('31000000-0000-4000-8000-000000000104', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000204', 'active'),
('31000000-0000-4000-8000-000000000105', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000205', 'active'),
('31000000-0000-4000-8000-000000000106', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000206', 'active'),
('31000000-0000-4000-8000-000000000108', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000208', 'active'),
('32000000-0000-4000-8000-000000000101', '32000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000201', 'active');

insert into public.clients (id, tenant_id, name, slug) values
('31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000001', 'X010A Client A', 'x010a-a'),
('31000000-0000-4000-8000-000000000302', '31000000-0000-4000-8000-000000000001', 'X010A Client B', 'x010a-b'),
('32000000-0000-4000-8000-000000000301', '32000000-0000-4000-8000-000000000001', 'X010A Tenant B Client', 'x010a-tenant-b');

insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status) values
('31000000-0000-4000-8000-000000000112', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000202', 'active'),
('31000000-0000-4000-8000-000000000116', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000206', 'active'),
('31000000-0000-4000-8000-000000000118', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000302', '31000000-0000-4000-8000-000000000208', 'active');

insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
('31000000-0000-4000-8000-000000000401', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '31000000-0000-4000-8000-000000000001', 'active'),
('31000000-0000-4000-8000-000000000402', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000102', 'client_viewer', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
('31000000-0000-4000-8000-000000000403', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000103', 'content_writer', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
('31000000-0000-4000-8000-000000000404', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000104', 'designer', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
('31000000-0000-4000-8000-000000000405', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000105', 'content_writer', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
('31000000-0000-4000-8000-000000000406', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000106', 'client_approver', 'client', '31000000-0000-4000-8000-000000000301', 'active'),
('31000000-0000-4000-8000-000000000408', '31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000108', 'client_viewer', 'client', '31000000-0000-4000-8000-000000000302', 'active'),
('32000000-0000-4000-8000-000000000401', '32000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '32000000-0000-4000-8000-000000000001', 'active');

-- dW: writer-owned, internal working version (internal uploads).
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval, owner_user_id
) values (
  '31000000-0000-4000-8000-000000000510', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', 'Hardening writer item', 'post', 'in_progress', 30,
  'x010a-writer', true, true, '31000000-0000-4000-8000-000000000203'
);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, content_body
) values (
  '31000000-0000-4000-8000-000000000610', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
  1, 'internal_only', 'internal working draft'
);
update public.deliverables set current_version_id = '31000000-0000-4000-8000-000000000610'
where id = '31000000-0000-4000-8000-000000000510';

-- dD: designer-contributor, internal working version.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values (
  '31000000-0000-4000-8000-000000000511', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', 'Hardening designer item', 'design', 'in_progress', 30,
  'x010a-designer', true, true
);
update public.deliverables set contributor_user_ids = array['31000000-0000-4000-8000-000000000204'::uuid]
where id = '31000000-0000-4000-8000-000000000511';
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, content_body
) values (
  '31000000-0000-4000-8000-000000000611', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000511',
  1, 'internal_only', 'internal design draft'
);
update public.deliverables set current_version_id = '31000000-0000-4000-8000-000000000611'
where id = '31000000-0000-4000-8000-000000000511';

-- dS: sent to client (client_visible current version) -> client_visible and
-- client_uploaded are valid here for the correct roles. Inserted at a neutral
-- status first so the client-review-payload guard can validate the meaningful
-- payload once the current version is wired.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values (
  '31000000-0000-4000-8000-000000000512', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', 'Hardening sent item', 'post', 'in_progress', 30,
  'x010a-sent', true, true
);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, content_body
) values (
  '31000000-0000-4000-8000-000000000612', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
  1, 'client_visible', 'sent review payload'
);
update public.deliverables set current_version_id = '31000000-0000-4000-8000-000000000612'
where id = '31000000-0000-4000-8000-000000000512';
update public.deliverables set status = 'waiting_client_approval', progress_percentage = 80
where id = '31000000-0000-4000-8000-000000000512';

-- dA: client-approved current version -> final_delivery is valid for management.
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values (
  '31000000-0000-4000-8000-000000000513', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', 'Hardening approved item', 'post', 'in_progress', 30,
  'x010a-approved', true, true
);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, content_body
) values (
  '31000000-0000-4000-8000-000000000613', '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000513',
  1, 'client_approved', 'approved payload'
);
update public.deliverables set current_version_id = '31000000-0000-4000-8000-000000000613'
where id = '31000000-0000-4000-8000-000000000513';
update public.deliverables set status = 'client_approved', progress_percentage = 90
where id = '31000000-0000-4000-8000-000000000513';

-- ===========================================================================
-- A. client_viewer is denied every upload kind.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000202', true);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000710', '31000000-0000-4000-8000-000000000810',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/viewer-internal.txt',
    'viewer-internal.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-viewer-internal-run', 'x010a-viewer-internal', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'client_viewer cannot begin an internal upload attempt'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000711', '31000000-0000-4000-8000-000000000811',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/viewer-upload.txt',
    'viewer-upload.txt', 'text/plain', 12, 'client_uploaded', false, null,
    'x010a-viewer-upload-run', 'x010a-viewer-upload', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'client_viewer cannot begin a client-uploaded attempt on a visible version'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000204', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000740', '31000000-0000-4000-8000-000000000840',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000511',
    '31000000-0000-4000-8000-000000000611', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000511/31000000-0000-4000-8000-000000000611/designer-internal.txt',
    'designer-internal.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-designer-internal-run', 'x010a-designer-internal', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000740'::uuid)$$,
  'assigned designer can persist an internal_only attempt on its deliverable'
);
reset role;

-- ===========================================================================
-- B. client_approver: only client_uploaded on the exact visible current version.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000206', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000720', '31000000-0000-4000-8000-000000000820',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/approver-upload.txt',
    'approver-upload.txt', 'text/plain', 12, 'client_uploaded', false, null,
    'x010a-approver-upload-run', 'x010a-approver-upload', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000720'::uuid)$$,
  'client_approver can persist a client_uploaded attempt on its exact visible version'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000721', '31000000-0000-4000-8000-000000000821',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/approver-internal.txt',
    'approver-internal.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-approver-internal-run', 'x010a-approver-internal', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'client_approver cannot persist an internal_only attempt'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000722', '31000000-0000-4000-8000-000000000822',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/approver-visible.pdf',
    'approver-visible.pdf', 'application/pdf', 12, 'client_visible', false, null,
    'x010a-approver-visible-run', 'x010a-approver-visible', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'client_approver cannot persist a client_visible attempt'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000723', '31000000-0000-4000-8000-000000000823',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000513',
    '31000000-0000-4000-8000-000000000613', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000513/31000000-0000-4000-8000-000000000613/approver-final.pdf',
    'approver-final.pdf', 'application/pdf', 12, 'final_delivery', true, null,
    'x010a-approver-final-run', 'x010a-approver-final', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'client_approver cannot persist a final_delivery attempt'
);
reset role;

-- ===========================================================================
-- C. assigned writer: internal_only only; no client_visible/final_delivery;
--    a denied begin leaves no attempt, file_asset, or success audit.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000730', '31000000-0000-4000-8000-000000000830',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/writer-internal.txt',
    'writer-internal.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-writer-internal-run', 'x010a-writer-internal', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000730'::uuid)$$,
  'assigned writer can persist an internal_only attempt on its deliverable'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000731', '31000000-0000-4000-8000-000000000831',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/writer-visible.pdf',
    'writer-visible.pdf', 'application/pdf', 12, 'client_visible', false, null,
    'x010a-writer-visible-run', 'x010a-writer-visible', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'assigned writer cannot persist a client_visible attempt'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000732', '31000000-0000-4000-8000-000000000832',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000513',
    '31000000-0000-4000-8000-000000000613', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000513/31000000-0000-4000-8000-000000000613/writer-final.pdf',
    'writer-final.pdf', 'application/pdf', 12, 'final_delivery', true, null,
    'x010a-writer-final-run', 'x010a-writer-final', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'assigned writer cannot persist a final_delivery attempt'
);
select is(
  (select count(*)::integer from public.file_upload_attempts
   where id in ('31000000-0000-4000-8000-000000000731','31000000-0000-4000-8000-000000000732')),
  0,
  'denied writer begins leave no attempt rows'
);
select is(
  (select count(*)::integer from public.file_assets
   where id in ('31000000-0000-4000-8000-000000000831','31000000-0000-4000-8000-000000000832')),
  0,
  'denied writer begins leave no file_asset rows'
);
select is(
  (select count(*)::integer from public.audit_events
   where target_id in ('31000000-0000-4000-8000-000000000731','31000000-0000-4000-8000-000000000732')),
  0,
  'denied writer begins leave no audit rows'
);
reset role;

-- ===========================================================================
-- D. assigned designer: denied client_visible and final_delivery.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000204', true);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000741', '31000000-0000-4000-8000-000000000841',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/designer-visible.pdf',
    'designer-visible.pdf', 'application/pdf', 12, 'client_visible', false, null,
    'x010a-designer-visible-run', 'x010a-designer-visible', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'assigned designer cannot persist a client_visible attempt'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000742', '31000000-0000-4000-8000-000000000842',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000513',
    '31000000-0000-4000-8000-000000000613', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000513/31000000-0000-4000-8000-000000000613/designer-final.pdf',
    'designer-final.pdf', 'application/pdf', 12, 'final_delivery', true, null,
    'x010a-designer-final-run', 'x010a-designer-final', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'assigned designer cannot persist a final_delivery attempt'
);
reset role;

-- ===========================================================================
-- E. unassigned same-client execution member is denied.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000205', true);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000750', '31000000-0000-4000-8000-000000000850',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/unassigned-internal.txt',
    'unassigned-internal.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-unassigned-run', 'x010a-unassigned', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'unassigned same-client execution member cannot begin an upload attempt'
);
reset role;

-- ===========================================================================
-- F. management matrix: client_visible on a sent version; final_delivery on an
--    approved version; final_delivery denied before approval; is_final=false
--    rejected for final_delivery.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000760', '31000000-0000-4000-8000-000000000860',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/mgmt-visible.pdf',
    'mgmt-visible.pdf', 'application/pdf', 12, 'client_visible', false, null,
    'x010a-mgmt-visible-run', 'x010a-mgmt-visible', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000760'::uuid)$$,
  'management can persist a client_visible attempt on a sent version'
);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000761', '31000000-0000-4000-8000-000000000861',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000513',
    '31000000-0000-4000-8000-000000000613', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000513/31000000-0000-4000-8000-000000000613/mgmt-final.pdf',
    'mgmt-final.pdf', 'application/pdf', 12, 'final_delivery', true, null,
    'x010a-mgmt-final-run', 'x010a-mgmt-final', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000761'::uuid)$$,
  'management can persist a final_delivery attempt on an approved version'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000762', '31000000-0000-4000-8000-000000000862',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/mgmt-final-early.pdf',
    'mgmt-final-early.pdf', 'application/pdf', 12, 'final_delivery', true, null,
    'x010a-mgmt-final-early-run', 'x010a-mgmt-final-early', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'management cannot persist final_delivery before the version is client_approved'
);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000763', '31000000-0000-4000-8000-000000000863',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000513',
    '31000000-0000-4000-8000-000000000613', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000513/31000000-0000-4000-8000-000000000613/mgmt-final-notfinal.pdf',
    'mgmt-final-notfinal.pdf', 'application/pdf', 12, 'final_delivery', false, null,
    'x010a-mgmt-final-notfinal-run', 'x010a-mgmt-final-notfinal', gen_random_uuid())$$,
  '42501', 'file upload denied',
  'final_delivery with is_final=false is rejected'
);
reset role;

-- ===========================================================================
-- H. cross-tenant, cross-client, and stale-version attempts remain denied.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '32000000-0000-4000-8000-000000000201', true);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000770', '31000000-0000-4000-8000-000000000870',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/cross-tenant.txt',
    'cross-tenant.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-cross-tenant-run', 'x010a-cross-tenant', gen_random_uuid())$$,
  '42501', null,
  'Tenant B management cannot begin an attempt on Tenant A'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000208', true);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000771', '31000000-0000-4000-8000-000000000871',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/cross-client.txt',
    'cross-client.txt', 'text/plain', 12, 'client_uploaded', false, null,
    'x010a-cross-client-run', 'x010a-cross-client', gen_random_uuid())$$,
  '42501', null,
  'same-tenant Client B persona cannot begin an attempt on Client A'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select throws_ok(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000772', '31000000-0000-4000-8000-000000000872',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000612/stale-version.txt',
    'stale-version.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-stale-version-run', 'x010a-stale-version', gen_random_uuid())$$,
  '42501', null,
  'stale/cross-deliverable version attempt is denied'
);
reset role;

-- ===========================================================================
-- I. cancel returns the attempt true Storage coordinates only; is audited
--    exactly once; an unrelated actor cannot cancel; the contract carries no
--    browser-supplied path so the server action can only delete this object.
-- ===========================================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000780', '31000000-0000-4000-8000-000000000880',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/cancel-target.txt',
    'cancel-target.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-cancel-begin-run', 'x010a-cancel-begin', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000780'::uuid)$$,
  'management persists the cancel-target attempt'
);
select results_eq(
  $$select bucket_id, storage_path from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000780', 'authorized_hardened_cancel', gen_random_uuid())$$,
  $$values (
    'deliverable-assets'::text,
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/cancel-target.txt'::text
  )$$,
  'cancel returns the exact Storage coordinates of the cancelled attempt, never a browser path'
);
reset role;

select is(
  (select status from public.file_upload_attempts
   where id = '31000000-0000-4000-8000-000000000780'),
  'cancelled',
  'cancel marks the attempt cancelled'
);
select is(
  (select count(*)::integer from public.audit_events
   where action = 'FileUploadAttemptCancelled'
     and target_id = '31000000-0000-4000-8000-000000000780'),
  1,
  'cancel is audited exactly once'
);

-- An already-cancelled attempt cannot be cancelled again (no double audit).
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select throws_ok(
  $$select * from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000780', 'duplicate_cancel_blocked', gen_random_uuid())$$,
  '42501', null,
  'an already-cancelled attempt cannot be cancelled again'
);
reset role;
select is(
  (select count(*)::integer from public.audit_events
   where action = 'FileUploadAttemptCancelled'
     and target_id = '31000000-0000-4000-8000-000000000780'),
  1,
  'duplicate cancel attempt did not add a second audit row'
);

-- An unrelated tenant cannot cancel Tenant A's attempt.
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000781', '31000000-0000-4000-8000-000000000881',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/tenant-a-only.txt',
    'tenant-a-only.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-tenant-a-run', 'x010a-tenant-a', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000781'::uuid)$$,
  'Tenant A management persists its own attempt before the cross-tenant cancel check'
);
reset role;
-- Tenant B admin has no active role in Tenant A, so it is not an authorized
-- actor for this deliverable and cannot cancel the attempt.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32000000-0000-4000-8000-000000000201', true);
select throws_ok(
  $$select * from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000781', 'cross_tenant_cancel_blocked', gen_random_uuid())$$,
  '42501', null,
  'Tenant B cannot cancel a Tenant A attempt'
);
reset role;
select is(
  (select status from public.file_upload_attempts
   where id = '31000000-0000-4000-8000-000000000781'),
  'pending',
  'denied cross-tenant cancel did not mutate the attempt'
);
select is(
  (select count(*)::integer from public.audit_events
   where action = 'FileUploadAttemptCancelled'
     and target_id = '31000000-0000-4000-8000-000000000781'),
  0,
  'denied cross-tenant cancel left no audit row'
);

-- A client approver cannot cancel management-owned client_visible/final_delivery
-- attempts even on a version visible to that client.
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000206', true);
select throws_ok(
  $$select * from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000760', 'client_cancel_mgmt_visible_blocked', gen_random_uuid())$$,
  '42501', 'upload cancellation denied',
  'client actor cannot cancel a management-owned client_visible attempt'
);
select throws_ok(
  $$select * from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000761', 'client_cancel_mgmt_final_blocked', gen_random_uuid())$$,
  '42501', 'upload cancellation denied',
  'client actor cannot cancel a management-owned final_delivery attempt'
);
reset role;
select is(
  (select status from public.file_upload_attempts
   where id = '31000000-0000-4000-8000-000000000760'),
  'pending',
  'denied client cancel of management client_visible attempt did not mutate status'
);
select is(
  (select count(*)::integer from public.audit_events
   where action = 'FileUploadAttemptCancelled'
     and target_id in ('31000000-0000-4000-8000-000000000760','31000000-0000-4000-8000-000000000761')),
  0,
  'denied client cancellation of management attempts left no audit rows'
);

-- Non-management actors may cancel only attempts they originally created.
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000204', true);
select throws_ok(
  $$select * from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000730', 'designer_cancel_writer_blocked', gen_random_uuid())$$,
  '42501', 'upload cancellation denied',
  'designer cannot cancel a writer-owned attempt'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select throws_ok(
  $$select * from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000740', 'writer_cancel_designer_blocked', gen_random_uuid())$$,
  '42501', 'upload cancellation denied',
  'writer cannot cancel a designer-owned attempt'
);
reset role;
select is(
  (select count(*)::integer from public.audit_events
   where action = 'FileUploadAttemptCancelled'
     and target_id in ('31000000-0000-4000-8000-000000000730','31000000-0000-4000-8000-000000000740')),
  0,
  'denied cross-actor cancellations left no audit rows'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000206', true);
select results_eq(
  $$select bucket_id, storage_path from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000720', 'client_actor_own_cancel', gen_random_uuid())$$,
  $$values (
    'deliverable-assets'::text,
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/approver-upload.txt'::text
  )$$,
  'client actor can cancel its own client_uploaded attempt'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select bucket_id, storage_path from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000730', 'writer_actor_own_cancel', gen_random_uuid())$$,
  $$values (
    'deliverable-assets'::text,
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/writer-internal.txt'::text
  )$$,
  'assigned team actor can cancel its own internal_only attempt'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select results_eq(
  $$select bucket_id, storage_path from public.s015_cancel_file_upload_attempt(
    '31000000-0000-4000-8000-000000000740', 'management_cancel_in_scope', gen_random_uuid())$$,
  $$values (
    'deliverable-assets'::text,
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000511/31000000-0000-4000-8000-000000000611/designer-internal.txt'::text
  )$$,
  'management can cancel an in-scope attempt regardless of original actor'
);
reset role;

-- ===========================================================================
-- G. complete re-validates authorization after a role or version-state change
--    during transfer; a denied completion leaves no file_asset or success audit.
-- ===========================================================================
-- G1: management began client_visible on the sent version; the version is then
--     retracted to internal_only; completion must be denied.
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000790', '31000000-0000-4000-8000-000000000890',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000512',
    '31000000-0000-4000-8000-000000000612', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000512/31000000-0000-4000-8000-000000000612/revalidate-visible.pdf',
    'revalidate-visible.pdf', 'application/pdf', 12, 'client_visible', false, null,
    'x010a-revalidate-visible-run', 'x010a-revalidate-visible', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000790'::uuid)$$,
  'management begins a client_visible attempt before the version-state change'
);
reset role;

update public.deliverable_versions
set status = 'internal_only'
where id = '31000000-0000-4000-8000-000000000612';

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000201', true);
select throws_ok(
  $$select public.s015_complete_file_upload_attempt(
    '31000000-0000-4000-8000-000000000790', gen_random_uuid(), gen_random_uuid())$$,
  '42501', 'file upload denied',
  'complete re-denies client_visible after the version reverted to internal_only'
);
reset role;
select is(
  (select count(*)::integer from public.file_assets
   where id = '31000000-0000-4000-8000-000000000890'),
  0,
  'denied completion left no file_asset'
);
select is(
  (select count(*)::integer from public.audit_events
   where action = 'FileUploadAttemptReady'
     and target_id = '31000000-0000-4000-8000-000000000790'),
  0,
  'denied completion left no ready audit'
);
select is(
  (select status from public.file_upload_attempts
   where id = '31000000-0000-4000-8000-000000000790'),
  'pending',
  'denied completion left the attempt pending (not silently completed)'
);

-- G2: writer began internal_only; the writer role is then deactivated;
--     completion must be denied.
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select public.s015_begin_file_upload_attempt(
    '31000000-0000-4000-8000-000000000791', '31000000-0000-4000-8000-000000000891',
    '31000000-0000-4000-8000-000000000301', '31000000-0000-4000-8000-000000000510',
    '31000000-0000-4000-8000-000000000610', 'deliverable-assets',
    '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/revalidate-role.txt',
    'revalidate-role.txt', 'text/plain', 12, 'internal_only', false, null,
    'x010a-revalidate-role-run', 'x010a-revalidate-role', gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000791'::uuid)$$,
  'writer begins an internal_only attempt before the role is deactivated'
);
reset role;

update public.role_assignments
set status = 'disabled'
where id = '31000000-0000-4000-8000-000000000403';

set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select throws_ok(
  $$select public.s015_complete_file_upload_attempt(
    '31000000-0000-4000-8000-000000000791', gen_random_uuid(), gen_random_uuid())$$,
  '42501', 'file upload denied',
  'complete re-denies after the actor role was deactivated during transfer'
);
reset role;
select is(
  (select count(*)::integer from public.file_assets
   where id = '31000000-0000-4000-8000-000000000891'),
  0,
  'role-deactivated denied completion left no file_asset'
);

-- G3: a fully valid completion still succeeds and registers exactly one file
--     (positive control proving the matrix does not over-restrict). The Storage
--     object is created at the attempt's own registered path.
insert into storage.objects (id, bucket_id, name, owner_id)
values (
  '31000000-0000-4000-8000-000000000993', 'deliverable-assets',
  '31000000-0000-4000-8000-000000000001/31000000-0000-4000-8000-000000000301/31000000-0000-4000-8000-000000000510/31000000-0000-4000-8000-000000000610/revalidate-role.txt',
  '31000000-0000-4000-8000-000000000203'
);
-- Reactivate the writer role for the positive control.
update public.role_assignments
set status = 'active'
where id = '31000000-0000-4000-8000-000000000403';
set local role authenticated;
select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000203', true);
select results_eq(
  $$select public.s015_complete_file_upload_attempt(
    '31000000-0000-4000-8000-000000000791', gen_random_uuid(), gen_random_uuid())$$,
  $$values ('31000000-0000-4000-8000-000000000891'::uuid)$$,
  'a valid internal_only completion registers the planned file after role reactivation'
);
select is(
  (select upload_state from public.file_assets
   where id = '31000000-0000-4000-8000-000000000891'),
  'ready',
  'valid completion produces exactly one ready file_asset'
);
reset role;

select * from finish();
rollback;
