-- X010-B6A corrective: atomic and idempotent default quality checklist save.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select ok(
  (select prosecdef from pg_proc where oid =
    'public.s015_save_quality_checklist(uuid,uuid,uuid,jsonb,text)'::regprocedure),
  'quality checklist batch command is security definer'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_save_quality_checklist(uuid,uuid,uuid,jsonb,text)',
    'execute'
  ),
  'authenticated can execute the scoped checklist command'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.s015_save_quality_checklist(uuid,uuid,uuid,jsonb,text)',
    'execute'
  ),
  'anonymous users cannot execute the checklist command'
);

insert into public.tenants (id, name) values
  ('6a000000-0000-4000-8000-000000000001', 'B6A Tenant');
insert into public.clients (id, tenant_id, name, slug) values
  ('6a000000-0000-4000-8000-000000000101', '6a000000-0000-4000-8000-000000000001', 'B6A Client A', 'b6a-a'),
  ('6a000000-0000-4000-8000-000000000102', '6a000000-0000-4000-8000-000000000001', 'B6A Client B', 'b6a-b');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('6a000000-0000-4000-8000-000000000201', '6a000000-0000-4000-8000-000000000001', '6a000000-0000-4000-8000-000000000301', 'active'),
  ('6a000000-0000-4000-8000-000000000202', '6a000000-0000-4000-8000-000000000001', '6a000000-0000-4000-8000-000000000302', 'active');
insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status) values
  ('6a000000-0000-4000-8000-000000000211', '6a000000-0000-4000-8000-000000000001', '6a000000-0000-4000-8000-000000000101', '6a000000-0000-4000-8000-000000000302', 'active');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('6a000000-0000-4000-8000-000000000401', '6a000000-0000-4000-8000-000000000001', '6a000000-0000-4000-8000-000000000201', 'tenant_administrator', 'tenant', '6a000000-0000-4000-8000-000000000001', 'active'),
  ('6a000000-0000-4000-8000-000000000402', '6a000000-0000-4000-8000-000000000001', '6a000000-0000-4000-8000-000000000202', 'client_viewer', 'client', '6a000000-0000-4000-8000-000000000101', 'active');
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values (
  '6a000000-0000-4000-8000-000000000501', '6a000000-0000-4000-8000-000000000001',
  '6a000000-0000-4000-8000-000000000101', 'B6A deliverable', 'post',
  'in_progress', 30, 'b6a-deliverable', true, true
);
insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status
) values (
  '6a000000-0000-4000-8000-000000000601', '6a000000-0000-4000-8000-000000000001',
  '6a000000-0000-4000-8000-000000000101', '6a000000-0000-4000-8000-000000000501',
  1, 'draft'
);
update public.deliverables
set current_version_id = '6a000000-0000-4000-8000-000000000601'
where id = '6a000000-0000-4000-8000-000000000501';

set local role authenticated;
select set_config('request.jwt.claim.sub', '6a000000-0000-4000-8000-000000000301', true);
select is(
  public.s015_save_quality_checklist(
    '6a000000-0000-4000-8000-000000000101',
    '6a000000-0000-4000-8000-000000000501',
    '6a000000-0000-4000-8000-000000000601',
    '[{"label":"سلامة اللغة"},{"label":"مطابقة الهوية"},{"label":"جاهزية الملف","note":"راجع المقاس"}]'::jsonb,
    'b6a-atomic-success'
  ),
  3,
  'management saves the complete checklist in one command'
);
select is(
  (select count(*)::integer from public.deliverable_quality_checks
    where deliverable_id = '6a000000-0000-4000-8000-000000000501'),
  3,
  'all checklist items were persisted'
);
select is(
  public.s015_save_quality_checklist(
    '6a000000-0000-4000-8000-000000000101',
    '6a000000-0000-4000-8000-000000000501',
    '6a000000-0000-4000-8000-000000000601',
    '[{"label":"سلامة اللغة"},{"label":"مطابقة الهوية"},{"label":"جاهزية الملف","note":"راجع المقاس"}]'::jsonb,
    'b6a-atomic-success'
  ),
  3,
  'replaying the same request is a no-op success'
);
select is(
  (select count(*)::integer from public.deliverable_quality_checks
    where deliverable_id = '6a000000-0000-4000-8000-000000000501'),
  3,
  'idempotent replay creates no duplicate checks'
);
select throws_ok(
  $$select public.s015_save_quality_checklist(
    '6a000000-0000-4000-8000-000000000101',
    '6a000000-0000-4000-8000-000000000501',
    '6a000000-0000-4000-8000-000000000601',
    '[{"label":"حمولة مختلفة"}]'::jsonb,
    'b6a-atomic-success'
  )$$,
  'P0001',
  'idempotency conflict'
);
reset role;

-- Seed a conflicting second child command. The first child and the parent
-- are attempted before the conflict; PostgreSQL must roll both back.
insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision,
  target_type, target_id, reason
) values (
  '6a000000-0000-4000-8000-000000000701', '6a000000-0000-4000-8000-000000000001',
  '6a000000-0000-4000-8000-000000000101', '6a000000-0000-4000-8000-000000000301',
  'TestConflict', 'allowed', 'deliverable_version',
  '6a000000-0000-4000-8000-000000000601', 'atomic rollback test'
);
insert into public.mvp_command_requests (
  id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
  command_name, outcome, audit_event_id, completed_at
) values (
  '6a000000-0000-4000-8000-000000000702', '6a000000-0000-4000-8000-000000000001',
  '6a000000-0000-4000-8000-000000000101', '6a000000-0000-4000-8000-000000000501',
  '6a000000-0000-4000-8000-000000000601', 'b6a-atomic-rollback:02',
  'conflicting_test_command', 'allowed', '6a000000-0000-4000-8000-000000000701', now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '6a000000-0000-4000-8000-000000000301', true);
select throws_ok(
  $$select public.s015_save_quality_checklist(
    '6a000000-0000-4000-8000-000000000101',
    '6a000000-0000-4000-8000-000000000501',
    '6a000000-0000-4000-8000-000000000601',
    '[{"label":"يجب أن يتراجع 1"},{"label":"يجب أن يتراجع 2"}]'::jsonb,
    'b6a-atomic-rollback'
  )$$,
  'P0001',
  'idempotency conflict'
);
reset role;
select is(
  (select count(*)::integer from public.deliverable_quality_checks
    where deliverable_id = '6a000000-0000-4000-8000-000000000501'),
  3,
  'a middle-item failure rolls back the whole checklist'
);
select is(
  (select count(*)::integer from public.mvp_command_requests
    where idempotency_key in ('b6a-atomic-rollback', 'b6a-atomic-rollback:01')),
  0,
  'failed batch leaves no parent or first-child command record'
);
select is(
  (select count(*)::integer from public.audit_events
    where action = 'QualityChecklistCreated'
      and target_id = '6a000000-0000-4000-8000-000000000601'),
  1,
  'failed batch leaves no additional parent audit event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '6a000000-0000-4000-8000-000000000302', true);
select throws_ok(
  $$select public.s015_save_quality_checklist(
    '6a000000-0000-4000-8000-000000000101',
    '6a000000-0000-4000-8000-000000000501',
    '6a000000-0000-4000-8000-000000000601',
    '[{"label":"عميل ممنوع"}]'::jsonb,
    'b6a-client-denied'
  )$$,
  '42501',
  'quality checklist command denied'
);
reset role;

select * from finish();
rollback;
