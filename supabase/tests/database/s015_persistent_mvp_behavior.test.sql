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
('22000000-0000-4000-8000-000000000101', '22000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000201', 'active');
insert into public.clients (id, tenant_id, name, slug) values
('21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000001', 'S015 Client A', 's015-a'),
('21000000-0000-4000-8000-000000000302', '21000000-0000-4000-8000-000000000001', 'S015 Client B', 's015-b'),
('22000000-0000-4000-8000-000000000301', '22000000-0000-4000-8000-000000000001', 'S015 Tenant B Client', 's015-tenant-b');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
('21000000-0000-4000-8000-000000000401', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000101', 'account_manager', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000402', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000102', 'client_viewer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000403', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000103', 'content_writer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000404', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000104', 'designer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000405', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000105', 'content_writer', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000406', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000106', 'client_approver', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000407', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000107', 'tenant_administrator', 'tenant', '21000000-0000-4000-8000-000000000001', 'active'),
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
(gen_random_uuid(), '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501', '21000000-0000-4000-8000-000000000601', 'system_comment', 'client_visible', 'client system note'),
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

select * from finish();
rollback;
