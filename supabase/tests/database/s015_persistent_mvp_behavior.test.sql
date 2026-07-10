begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(8);

insert into public.tenants (id, name) values
('21000000-0000-4000-8000-000000000001', 'S015 Tenant A');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
('21000000-0000-4000-8000-000000000101', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000201', 'active'),
('21000000-0000-4000-8000-000000000102', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000202', 'active');
insert into public.clients (id, tenant_id, name, slug) values
('21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000001', 'S015 Client A', 's015-a'),
('21000000-0000-4000-8000-000000000302', '21000000-0000-4000-8000-000000000001', 'S015 Client B', 's015-b');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
('21000000-0000-4000-8000-000000000401', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000101', 'account_manager', 'client', '21000000-0000-4000-8000-000000000301', 'active'),
('21000000-0000-4000-8000-000000000402', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000102', 'client_viewer', 'client', '21000000-0000-4000-8000-000000000301', 'active');
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values
('21000000-0000-4000-8000-000000000501', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Review item', 'post', 'ready_for_internal_review', 50, 's015-review-a', true, true),
('21000000-0000-4000-8000-000000000502', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Other item', 'post', 'in_progress', 30, 's015-other-a', true, true),
('21000000-0000-4000-8000-000000000503', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', 'Delivered item', 'post', 'delivered', 100, 's015-delivered-a', true, true);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status
) values
('21000000-0000-4000-8000-000000000601', '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501', 1, 'internal_only');
update public.deliverables set current_version_id = '21000000-0000-4000-8000-000000000601'
where id = '21000000-0000-4000-8000-000000000501';

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
select throws_ok(
  $$select * from public.s015_execute_internal_workflow(
    '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000503',
    gen_random_uuid(), 'submit_version', 2, null,
    gen_random_uuid(), gen_random_uuid(), 's015-terminal-submit')$$,
  'P0001', 'terminal deliverable state',
  'terminal deliverable cannot accept a new version'
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
(gen_random_uuid(), '21000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000301', '21000000-0000-4000-8000-000000000501', '21000000-0000-4000-8000-000000000601', 'system_comment', 'client_visible', 'client system note');

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
reset role;

select * from finish();
rollback;
