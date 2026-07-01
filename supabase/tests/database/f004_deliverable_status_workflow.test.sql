begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select plan(23);

select ok(
  to_regprocedure(
    'public.f004_update_deliverable_status(uuid, uuid, uuid, text, integer, text, text)'
  ) is not null,
  'F-004 exposes a reviewed deliverable status update RPC'
);

select ok(
  to_regclass('public.deliverable_status_transition_requests') is not null,
  'F-004 stores status transition idempotency requests'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.deliverable_status_transition_requests'::regclass
  ),
  'status transition idempotency requests have RLS enabled'
);

select ok(
  not exists (
    select 1
    from unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) as p(privilege_name)
    where has_table_privilege(
      'authenticated',
      'public.deliverable_status_transition_requests',
      p.privilege_name
    )
  ),
  'authenticated has no direct write grants on status transition idempotency requests'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.f004_update_deliverable_status(uuid, uuid, uuid, text, integer, text, text)'::regprocedure
  ),
  'status update RPC is SECURITY DEFINER'
);

select is(
  (
    select setting
    from pg_proc p
    cross join unnest(p.proconfig) as c(setting)
    where p.oid = 'public.f004_update_deliverable_status(uuid, uuid, uuid, text, integer, text, text)'::regprocedure
      and c.setting like 'search_path=%'
  ),
  'search_path=public',
  'status update RPC pins search_path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.f004_update_deliverable_status(uuid, uuid, uuid, text, integer, text, text)',
    'execute'
  ),
  'authenticated can execute the reviewed status update RPC'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.f004_update_deliverable_status(uuid, uuid, uuid, text, integer, text, text)',
    'execute'
  ),
  'anon cannot execute the status update RPC'
);

insert into public.tenants (id, name)
values ('11000000-0000-4000-8000-000000000001', 'F004 Tenant A');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
values (
  '11000000-0000-4000-8000-000000000101',
  '11000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000201',
  'active'
);

insert into public.clients (id, tenant_id, name, slug, created_by)
values (
  '11000000-0000-4000-8000-000000000301',
  '11000000-0000-4000-8000-000000000001',
  'F004 Client A',
  'f004-client-a',
  '11000000-0000-4000-8000-000000000201'
);

insert into public.role_assignments (
  id,
  tenant_id,
  membership_id,
  role_key,
  scope_type,
  scope_id,
  status
)
values (
  '11000000-0000-4000-8000-000000000501',
  '11000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000101',
  'tenant_administrator',
  'tenant',
  '11000000-0000-4000-8000-000000000001',
  'active'
);

insert into public.deliverables (
  id,
  tenant_id,
  client_id,
  name,
  type,
  status,
  progress_percentage,
  requires_internal_approval,
  requires_client_approval,
  idempotency_key,
  created_by
)
values (
  '15000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000301',
  'F004 Status Deliverable',
  'post',
  'not_started',
  0,
  true,
  true,
  'f004-existing-deliverable',
  '11000000-0000-4000-8000-000000000201'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000201', true);

select throws_ok(
  $$
    update public.deliverables
    set status = 'delivered'
    where id = '15000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  'permission denied for table deliverables',
  'authenticated actors cannot bypass the reviewed status RPC with a direct write'
);

select is(
  (
    select status
    from public.f004_update_deliverable_status(
      '15000000-0000-4000-8000-000000000001',
      '19000000-0000-4000-8000-000000000001',
      '11000000-0000-4000-8000-000000000301',
      'in_progress',
      1,
      'start work',
      'f004-status-first'
    )
  ),
  'in_progress',
  'status RPC updates a scoped deliverable'
);

reset role;

select is(
  (
    select revision
    from public.deliverables
    where id = '15000000-0000-4000-8000-000000000001'
  ),
  2,
  'status RPC increments revision once'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'DeliverableStatusChanged'
      and target_id = '15000000-0000-4000-8000-000000000001'
  ),
  1,
  'status RPC records one allowed audit event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000201', true);

select is(
  (
    select revision
    from public.f004_update_deliverable_status(
      '15000000-0000-4000-8000-000000000001',
      '19000000-0000-4000-8000-000000000002',
      '11000000-0000-4000-8000-000000000301',
      'in_progress',
      1,
      'retry start work',
      'f004-status-first'
    )
  ),
  2,
  'repeated idempotency key returns the existing status result despite stale expected revision'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'DeliverableStatusChanged'
      and target_id = '15000000-0000-4000-8000-000000000001'
  ),
  1,
  'repeated idempotency key does not duplicate allowed audit events'
);

select is(
  (
    select count(*)::integer
    from public.deliverable_status_transition_requests
    where tenant_id = '11000000-0000-4000-8000-000000000001'
      and idempotency_key = 'f004-status-first'
      and outcome = 'allowed'
      and result_revision = 2
  ),
  1,
  'status transition idempotency request records the allowed result once'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000201', true);

select throws_ok(
  $$
    select *
    from public.f004_update_deliverable_status(
      '15000000-0000-4000-8000-000000000001',
      '19000000-0000-4000-8000-000000000003',
      '11000000-0000-4000-8000-000000000301',
      'ready_for_internal_review',
      2,
      'conflicting operation',
      'f004-status-first'
    )
  $$,
  'P0001',
  'idempotency key conflict',
  'reusing an idempotency key for a different operation is rejected'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.audit_events
    where target_id = '15000000-0000-4000-8000-000000000001'
  ),
  1,
  'conflicting idempotency reuse does not append audit events'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000201', true);

select is(
  (
    select count(*)::integer
    from public.f004_update_deliverable_status(
      '15000000-0000-4000-8000-000000000001',
      '19000000-0000-4000-8000-000000000004',
      '11000000-0000-4000-8000-000000000301',
      'waiting_client_approval',
      2,
      'send to client too soon',
      'f004-status-denied'
    )
  ),
  0,
  'invalid transition returns no deliverable row'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'DeliverableStatusChangeDenied'
      and reason = 'internal_approval_required_before_client_waiting'
      and target_id = '15000000-0000-4000-8000-000000000001'
  ),
  1,
  'invalid transition records one denial audit event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000201', true);

select is(
  (
    select count(*)::integer
    from public.f004_update_deliverable_status(
      '15000000-0000-4000-8000-000000000001',
      '19000000-0000-4000-8000-000000000005',
      '11000000-0000-4000-8000-000000000301',
      'waiting_client_approval',
      2,
      'retry denied transition',
      'f004-status-denied'
    )
  ),
  0,
  'repeated denied idempotency key returns no deliverable row'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'DeliverableStatusChangeDenied'
      and reason = 'internal_approval_required_before_client_waiting'
      and target_id = '15000000-0000-4000-8000-000000000001'
  ),
  1,
  'repeated denied idempotency key does not duplicate denial audit events'
);

select is(
  (
    select count(*)::integer
    from public.deliverable_status_transition_requests
    where tenant_id = '11000000-0000-4000-8000-000000000001'
      and idempotency_key = 'f004-status-denied'
      and outcome = 'denied'
      and denial_reason = 'internal_approval_required_before_client_waiting'
  ),
  1,
  'status transition idempotency request records the denial result once'
);

select is(
  (
    select revision
    from public.deliverables
    where id = '15000000-0000-4000-8000-000000000001'
  ),
  2,
  'denied idempotent retries leave the deliverable revision unchanged'
);

select * from finish();

rollback;
