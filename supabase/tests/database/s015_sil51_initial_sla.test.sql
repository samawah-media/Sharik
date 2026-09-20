-- SIL-51: SLA starts with execution, never with planning-only creation.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into public.tenants (id, name) values
  ('51000000-0000-4000-8000-000000000001', 'SIL-51 Tenant');

insert into public.clients (id, tenant_id, name, slug) values
  (
    '51000000-0000-4000-8000-000000000101',
    '51000000-0000-4000-8000-000000000001',
    'SIL-51 Client',
    'sil-51-client'
  );

insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values (
  '51000000-0000-4000-8000-000000000501',
  '51000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000101',
  'Planned work', 'post', 'not_started', 0,
  'sil-51-planned-work', true, true
);

select is(
  (select count(*)::integer from public.sla_timeline_segments
    where deliverable_id = '51000000-0000-4000-8000-000000000501'),
  0,
  'creating planned work does not start its SLA'
);

update public.deliverables
set status = 'in_progress', progress_percentage = 30, updated_at = '2026-09-20T08:00:00Z'
where id = '51000000-0000-4000-8000-000000000501';

select is(
  (select count(*)::integer from public.sla_timeline_segments
    where deliverable_id = '51000000-0000-4000-8000-000000000501'
      and kind = 'running' and ended_at is null),
  1,
  'the first transition into execution starts one open SLA segment'
);

update public.deliverables
set updated_at = '2026-09-20T08:05:00Z'
where id = '51000000-0000-4000-8000-000000000501';

select is(
  (select count(*)::integer from public.sla_timeline_segments
    where deliverable_id = '51000000-0000-4000-8000-000000000501'
      and kind = 'running'),
  1,
  'later updates do not duplicate the initial running segment'
);

insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage,
  idempotency_key, requires_internal_approval, requires_client_approval
) values
  (
    '51000000-0000-4000-8000-000000000502',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000101',
    'Historical waiting work', 'post', 'waiting_client_approval', 80,
    'sil-51-historical-waiting', true, true
  ),
  (
    '51000000-0000-4000-8000-000000000503',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000101',
    'Historical active work', 'post', 'ready_for_internal_review', 50,
    'sil-51-historical-active', true, true
  ),
  (
    '51000000-0000-4000-8000-000000000504',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000101',
    'Historical delivered work', 'post', 'delivered', 100,
    'sil-51-historical-delivered', true, true
  );

insert into public.deliverable_status_transition_requests (
  tenant_id, client_id, deliverable_id, idempotency_key, target_status,
  audit_event_id, outcome, result_status, completed_at
) values
  (
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000101',
    '51000000-0000-4000-8000-000000000502', 'sil-51-history-waiting',
    'in_progress', '51000000-0000-4000-8000-000000000902', 'allowed',
    'in_progress', '2026-09-10T08:00:00Z'
  ),
  (
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000101',
    '51000000-0000-4000-8000-000000000503', 'sil-51-history-active',
    'in_progress', '51000000-0000-4000-8000-000000000903', 'allowed',
    'in_progress', '2026-09-11T08:00:00Z'
  ),
  (
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000101',
    '51000000-0000-4000-8000-000000000504', 'sil-51-history-delivered',
    'in_progress', '51000000-0000-4000-8000-000000000904', 'allowed',
    'in_progress', '2026-09-12T08:00:00Z'
  );

insert into public.sla_timeline_segments (
  id, tenant_id, client_id, deliverable_id, kind, started_at, reason
) values (
  '51000000-0000-4000-8000-000000000802',
  '51000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000101',
  '51000000-0000-4000-8000-000000000502',
  'paused_waiting_client', '2026-09-10T10:00:00Z', 'waiting_client'
);

select is(
  private.s015_backfill_initial_sla_timeline(),
  2,
  'evidence-backed repair inserts only the closed waiting history and active history'
);

select results_eq(
  $$select started_at, ended_at from public.sla_timeline_segments
    where deliverable_id = '51000000-0000-4000-8000-000000000502'
      and kind = 'running'$$,
  $$values (
    '2026-09-10T08:00:00Z'::timestamptz,
    '2026-09-10T10:00:00Z'::timestamptz
  )$$,
  'historical running segment ends exactly when the first waiting segment starts'
);

select is(
  (select count(*)::integer from public.sla_timeline_segments
   where deliverable_id = '51000000-0000-4000-8000-000000000503'
     and kind = 'running' and ended_at is null),
  1,
  'active historical work receives one open running segment'
);

select is(
  (select count(*)::integer from public.sla_timeline_segments
   where deliverable_id = '51000000-0000-4000-8000-000000000504'),
  0,
  'terminal historical work does not receive an invented open segment'
);

select is(
  private.s015_backfill_initial_sla_timeline(),
  0,
  'historical repair is idempotent'
);

select * from finish();
rollback;
