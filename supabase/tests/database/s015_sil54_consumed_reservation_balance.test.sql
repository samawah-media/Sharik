-- SIL54 regression: consumption transfers a reservation; it is not a second charge.
-- Prepared only. Execute through the approved disposable database test runner.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(21);

-- Synthetic fixtures only. No grants, shared helper changes, or historical rewrites.
create temporary table sil54_scopes on commit drop as
select n,
  ('54000000-0000-4000-8000-' || lpad((case when n = 3 then 2 else 1 end)::text, 12, '0'))::uuid as tenant_id,
  ('54000000-0000-4000-8000-' || lpad((300 + n)::text, 12, '0'))::uuid as client_id,
  ('54000000-0000-4000-8000-' || lpad((400 + n)::text, 12, '0'))::uuid as contract_id,
  ('54000000-0000-4000-8000-' || lpad((500 + n)::text, 12, '0'))::uuid as package_id,
  ('54000000-0000-4000-8000-' || lpad((600 + n)::text, 12, '0'))::uuid as line_id,
  (case n when 1 then 2 when 2 then 100 else 200 end)::numeric as committed
from generate_series(1, 3) as fixture(n);

insert into public.tenants (id, name)
select distinct tenant_id, 'SIL54 tenant ' || tenant_id::text from sil54_scopes;
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
values ('54000000-0000-4000-8000-000000000101', '54000000-0000-4000-8000-000000000001',
  '54000000-0000-4000-8000-000000000201', 'active');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status)
values ('54000000-0000-4000-8000-000000000111', '54000000-0000-4000-8000-000000000001',
  '54000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant',
  '54000000-0000-4000-8000-000000000001', 'active');
insert into public.clients (id, tenant_id, name, slug, status, created_by)
select client_id, tenant_id, 'SIL54 client ' || n, 'sil54-client-' || n, 'active',
  '54000000-0000-4000-8000-000000000201'::uuid from sil54_scopes;
insert into public.contracts (id, tenant_id, client_id, name, status, created_by)
select contract_id, tenant_id, client_id, 'SIL54 contract ' || n, 'active',
  '54000000-0000-4000-8000-000000000201'::uuid from sil54_scopes;
insert into public.packages (id, tenant_id, client_id, contract_id, name, status, created_by)
select package_id, tenant_id, client_id, contract_id, 'SIL54 package ' || n, 'active',
  '54000000-0000-4000-8000-000000000201'::uuid from sil54_scopes;
insert into public.package_lines (id, tenant_id, client_id, package_id, service_label, unit_label, committed_quantity, status)
select line_id, tenant_id, client_id, package_id, 'Posts', 'post', committed, 'active' from sil54_scopes;
insert into public.package_lines (id, tenant_id, client_id, package_id, service_label, unit_label, committed_quantity, status)
select '54000000-0000-4000-8000-000000000604', tenant_id, client_id, package_id,
  'Other service', 'report', 7, 'active' from sil54_scopes where n = 1;
insert into public.package_ledger_entries (id, tenant_id, client_id, contract_id, package_id, package_line_id, entry_type, quantity, idempotency_key)
select ('54000000-0000-4000-8000-' || lpad((900 + n)::text, 12, '0'))::uuid,
  tenant_id, client_id, contract_id, package_id, line_id, 'commitment_added', committed, 'sil54-commit-' || n
from sil54_scopes;
insert into public.package_ledger_entries (id, tenant_id, client_id, contract_id, package_id, package_line_id, entry_type, quantity, idempotency_key)
select '54000000-0000-4000-8000-000000000904', tenant_id, client_id, contract_id, package_id,
  '54000000-0000-4000-8000-000000000604', 'commitment_added', 7, 'sil54-other-service'
from sil54_scopes where n = 1;

-- Seed the exact persisted shape emitted by final delivery, without simulating its workflow.
insert into public.deliverables (id, tenant_id, client_id, contract_id, package_id, package_line_id, name, type, status, progress_percentage)
select '54000000-0000-4000-8000-000000000701', tenant_id, client_id, contract_id,
  package_id, line_id, 'SIL54 delivered post', 'post', 'delivered', 100 from sil54_scopes where n = 1;
insert into public.package_ledger_entries (id, tenant_id, client_id, contract_id, package_id, package_line_id, deliverable_id, entry_type, quantity, idempotency_key)
select fixture.id, scope.tenant_id, scope.client_id, scope.contract_id, scope.package_id, scope.line_id,
  '54000000-0000-4000-8000-000000000701', fixture.entry_type, 1, fixture.key
from sil54_scopes scope cross join (values
  ('54000000-0000-4000-8000-000000000801'::uuid, 'quantity_reserved', 'sil54-delivered-reservation'),
  ('54000000-0000-4000-8000-000000000802'::uuid, 'quantity_consumed', 'sil54-delivered-consumption')
) as fixture(id, entry_type, key) where scope.n = 1;
insert into public.deliverable_allocations (id, tenant_id, client_id, deliverable_id, package_line_id, reserved_quantity, status, reservation_ledger_entry_id)
select '54000000-0000-4000-8000-000000001001', tenant_id, client_id,
  '54000000-0000-4000-8000-000000000701', line_id, 1, 'consumed_later',
  '54000000-0000-4000-8000-000000000801' from sil54_scopes where n = 1;

select ok(not has_function_privilege('anon', 'public.f002_package_line_balance(uuid)', 'EXECUTE'),
  'anonymous callers cannot execute the private balance helper');
select ok(not has_function_privilege('authenticated', 'public.f002_package_line_balance(uuid)', 'EXECUTE'),
  'authenticated callers cannot execute the private balance helper');
select ok((select prosecdef and provolatile = 's' and proconfig @> array['search_path=public']
  from pg_proc where oid = 'public.f002_package_line_balance(uuid)'::regprocedure),
  'balance helper retains stable security-definer and fixed search_path contract');
select results_eq(
  $$select committed, reserved, consumed, released, adjustments, available
    from public.f002_package_line_balance('54000000-0000-4000-8000-000000000601')$$,
  $$values (2::numeric, 0::numeric, 1::numeric, 0::numeric, 0::numeric, 1::numeric)$$,
  'SIL54 delivered reservation leaves one available post and no active reservation');
select is((select available from public.f002_package_line_balance('54000000-0000-4000-8000-000000000604')), 7::numeric,
  'consumption does not affect another service line in the same package');
select is((select available from public.f002_package_line_balance('54000000-0000-4000-8000-000000000602')), 100::numeric,
  'projection does not affect another client in the same tenant');
select is((select available from public.f002_package_line_balance('54000000-0000-4000-8000-000000000603')), 200::numeric,
  'projection does not affect another tenant');

set local role authenticated;
select set_config('request.jwt.claim.sub', '54000000-0000-4000-8000-000000000201', true);
select throws_ok($$select * from public.f002_package_line_balance('54000000-0000-4000-8000-000000000601')$$,
  '42501', 'permission denied for function f002_package_line_balance', 'authenticated access must go through authorized commands');
select is((select count(*)::integer from public.package_ledger_entries
  where tenant_id = '54000000-0000-4000-8000-000000000002'), 0, 'ledger RLS excludes the other tenant');
select throws_ok($$select * from public.f002_create_deliverable_reservation(
  deliverable_id => '54000000-0000-4000-8000-000000000710', allocation_id => '54000000-0000-4000-8000-000000001010',
  ledger_entry_id => '54000000-0000-4000-8000-000000000810', audit_event_id => '54000000-0000-4000-8000-000000001110',
  target_client_id => '54000000-0000-4000-8000-000000000301', target_contract_id => '54000000-0000-4000-8000-000000000402',
  target_package_id => '54000000-0000-4000-8000-000000000502', target_package_line_id => '54000000-0000-4000-8000-000000000602',
  deliverable_name => 'SIL54 wrong client', deliverable_type => 'post', reserved_quantity => 1, idempotency_key => 'sil54-wrong-client')$$,
  '42501', 'not authorized', 'reservation rejects a package line from a different client');
select throws_ok($$select * from public.f002_create_deliverable_reservation(
  deliverable_id => '54000000-0000-4000-8000-000000000711', allocation_id => '54000000-0000-4000-8000-000000001011',
  ledger_entry_id => '54000000-0000-4000-8000-000000000811', audit_event_id => '54000000-0000-4000-8000-000000001111',
  target_client_id => '54000000-0000-4000-8000-000000000303', target_contract_id => '54000000-0000-4000-8000-000000000403',
  target_package_id => '54000000-0000-4000-8000-000000000503', target_package_line_id => '54000000-0000-4000-8000-000000000603',
  deliverable_name => 'SIL54 wrong tenant', deliverable_type => 'post', reserved_quantity => 1, idempotency_key => 'sil54-wrong-tenant')$$,
  '42501', 'not authorized', 'reservation rejects another tenant even when its package has capacity');
select lives_ok($$select * from public.f002_create_deliverable_reservation(
  deliverable_id => '54000000-0000-4000-8000-000000000702', allocation_id => '54000000-0000-4000-8000-000000001002',
  ledger_entry_id => '54000000-0000-4000-8000-000000000803', audit_event_id => '54000000-0000-4000-8000-000000001102',
  target_client_id => '54000000-0000-4000-8000-000000000301', target_contract_id => '54000000-0000-4000-8000-000000000401',
  target_package_id => '54000000-0000-4000-8000-000000000501', target_package_line_id => '54000000-0000-4000-8000-000000000601',
  deliverable_name => 'SIL54 remaining post', deliverable_type => 'post', reserved_quantity => 1, idempotency_key => 'sil54-remaining-post')$$,
  'SIL54 authenticated reservation can use the one genuinely remaining post');
select lives_ok($$select * from public.f002_create_deliverable_reservation(
  deliverable_id => '54000000-0000-4000-8000-000000000702', allocation_id => '54000000-0000-4000-8000-000000001002',
  ledger_entry_id => '54000000-0000-4000-8000-000000000803', audit_event_id => '54000000-0000-4000-8000-000000001102',
  target_client_id => '54000000-0000-4000-8000-000000000301', target_contract_id => '54000000-0000-4000-8000-000000000401',
  target_package_id => '54000000-0000-4000-8000-000000000501', target_package_line_id => '54000000-0000-4000-8000-000000000601',
  deliverable_name => 'SIL54 remaining post', deliverable_type => 'post', reserved_quantity => 1, idempotency_key => 'sil54-remaining-post')$$,
  'reservation replay returns the prior result despite now-exhausted capacity');
select throws_ok($$select * from public.f002_create_deliverable_reservation(
  deliverable_id => '54000000-0000-4000-8000-000000000703', allocation_id => '54000000-0000-4000-8000-000000001003',
  ledger_entry_id => '54000000-0000-4000-8000-000000000804', audit_event_id => '54000000-0000-4000-8000-000000001103',
  target_client_id => '54000000-0000-4000-8000-000000000301', target_contract_id => '54000000-0000-4000-8000-000000000401',
  target_package_id => '54000000-0000-4000-8000-000000000501', target_package_line_id => '54000000-0000-4000-8000-000000000601',
  deliverable_name => 'SIL54 excess post', deliverable_type => 'post', reserved_quantity => 1, idempotency_key => 'sil54-excess-post')$$,
  '42501', 'insufficient package capacity', 'a further reservation cannot exceed the commitment');
select throws_ok($$select * from public.f002_adjust_package_commitment(
  '54000000-0000-4000-8000-000000000805', '54000000-0000-4000-8000-000000001105',
  '54000000-0000-4000-8000-000000000601', -1, 'SIL54 overdraw check', 'sil54-overdraw-adjustment')$$,
  '42501', 'adjustment would overdraw capacity', 'adjustments cannot overdraw consumed plus active capacity');

reset role;
select results_eq(
  $$select committed, reserved, consumed, released, adjustments, available
    from public.f002_package_line_balance('54000000-0000-4000-8000-000000000601')$$,
  $$values (2::numeric, 1::numeric, 1::numeric, 0::numeric, 0::numeric, 0::numeric)$$,
  'after reservation exactly one active and one consumed unit exhaust the two-unit commitment');
select is((select count(*)::integer from public.package_ledger_entries
  where tenant_id = '54000000-0000-4000-8000-000000000001' and client_id = '54000000-0000-4000-8000-000000000301'
    and deliverable_id = '54000000-0000-4000-8000-000000000702' and entry_type = 'quantity_reserved'), 1,
  'reservation replay appends no duplicate reservation');
select is((select count(*)::integer from public.audit_events
  where tenant_id = '54000000-0000-4000-8000-000000000001' and client_id = '54000000-0000-4000-8000-000000000301'
    and target_id = '54000000-0000-4000-8000-000000000702' and action = 'DeliverableCreated'), 1,
  'remaining-capacity reservation retains exactly one creation audit');
select results_eq(
  $$select count(*) filter (where entry_type = 'quantity_consumed'), count(*) filter (where entry_type = 'reservation_released')
    from public.package_ledger_entries where tenant_id = '54000000-0000-4000-8000-000000000001'
      and client_id = '54000000-0000-4000-8000-000000000301' and deliverable_id = '54000000-0000-4000-8000-000000000701'$$,
  $$values (1::bigint, 0::bigint)$$, 'projection repair neither repeats consumption nor invents a release');
select is((select status from public.deliverable_allocations
  where id = '54000000-0000-4000-8000-000000001001' and tenant_id = '54000000-0000-4000-8000-000000000001'
    and client_id = '54000000-0000-4000-8000-000000000301'), 'consumed_later', 'delivered allocation history remains unchanged');

-- Match the JS fractional-capacity regression using persisted numeric(12, 2).
insert into public.package_lines (id, tenant_id, client_id, package_id, service_label, unit_label, committed_quantity, status)
select '54000000-0000-4000-8000-000000000605', tenant_id, client_id, package_id,
  'Fractional service', 'hour', 0.30, 'active' from sil54_scopes where n = 1;
insert into public.package_ledger_entries (id, tenant_id, client_id, contract_id, package_id, package_line_id, entry_type, quantity, idempotency_key)
select fixture.id, scope.tenant_id, scope.client_id, scope.contract_id, scope.package_id,
  '54000000-0000-4000-8000-000000000605', fixture.entry_type, fixture.quantity, fixture.key
from sil54_scopes scope cross join (values
  ('54000000-0000-4000-8000-000000000905'::uuid, 'commitment_added', 0.30::numeric, 'sil54-decimal-commit'),
  ('54000000-0000-4000-8000-000000000906'::uuid, 'quantity_reserved', 0.10::numeric, 'sil54-decimal-reserve'),
  ('54000000-0000-4000-8000-000000000907'::uuid, 'quantity_consumed', 0.10::numeric, 'sil54-decimal-consume')
) as fixture(id, entry_type, quantity, key) where scope.n = 1;
select results_eq(
  $$select committed, reserved, consumed, released, adjustments, available,
      available >= 0.20::numeric as can_reserve_remaining,
      available >= 0.21::numeric as can_reserve_excess
    from public.f002_package_line_balance('54000000-0000-4000-8000-000000000605')$$,
  $$values (0.30::numeric, 0::numeric, 0.10::numeric, 0::numeric, 0::numeric, 0.20::numeric, true, false)$$,
  'fractional consumption leaves exactly .20 capacity, permitting .20 but not .21');

select * from finish();
rollback;
