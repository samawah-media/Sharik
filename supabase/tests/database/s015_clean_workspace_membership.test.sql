begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- X009-B clean owner-entry workspace membership model.
-- Proves that disabling the legacy membership and creating a clean tenant
-- membership (1) makes the clean workspace the natural entry, (2) hides legacy
-- client data behind tenant RLS, (3) is idempotent under replay, and (4) rolls
-- back without touching append-only audit/ledger history.

insert into public.tenants (id, name) values
  ('23000000-0000-4000-8000-000000000001', 'X009B Legacy Tenant'),
  ('23000000-0000-4000-8000-000000000002', 'سماوة — مساحة المالك');

insert into public.clients (id, tenant_id, name, slug) values
  ('23000000-0000-4000-8000-000000000301', '23000000-0000-4000-8000-000000000001', 'Glass Legacy', 'x009b-legacy-glass');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('23000000-0000-4000-8000-000000000101', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000201', 'active'),
  ('23000000-0000-4000-8000-000000000111', '23000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000201', 'active');

insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('23000000-0000-4000-8000-000000000401', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '23000000-0000-4000-8000-000000000001', 'active'),
  ('23000000-0000-4000-8000-000000000411', '23000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000111', 'tenant_administrator', 'tenant', '23000000-0000-4000-8000-000000000002', 'active');

insert into public.member_profiles (tenant_id, user_id, display_name, role_label) values
  ('23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000201', 'مدير سماوة القديم', 'إدارة'),
  ('23000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000201', 'مدير سماوة', 'إدارة');

insert into public.contracts (id, tenant_id, client_id, name, reference, status) values
  ('23000000-0000-4000-8000-000000000901', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000301', 'عقد جلاس التاريخي', 'X009B-LEGACY', 'active');
insert into public.packages (id, tenant_id, client_id, contract_id, name, status) values
  ('23000000-0000-4000-8000-000000000902', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000301', '23000000-0000-4000-8000-000000000901', 'باقة جلاس', 'active');
insert into public.package_lines (id, tenant_id, client_id, package_id, service_label, deliverable_type_hint, unit_label, committed_quantity, status) values
  ('23000000-0000-4000-8000-000000000903', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000301', '23000000-0000-4000-8000-000000000902', 'منشورات', 'post', 'item', 1, 'active');
insert into public.deliverables (id, tenant_id, client_id, contract_id, package_id, package_line_id, name, type, status, progress_percentage, idempotency_key, requires_internal_approval, requires_client_approval) values
  ('23000000-0000-4000-8000-000000000520', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000301', '23000000-0000-4000-8000-000000000901', '23000000-0000-4000-8000-000000000902', '23000000-0000-4000-8000-000000000903', 'مخرج جلاس التاريخي', 'post', 'in_progress', 30, 'x009b-pgtap-legacy', true, true);
insert into public.package_ledger_entries (id, tenant_id, client_id, contract_id, package_id, package_line_id, deliverable_id, entry_type, quantity, reason, idempotency_key) values
  ('23000000-0000-4000-8000-000000000904', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000301', '23000000-0000-4000-8000-000000000901', '23000000-0000-4000-8000-000000000902', '23000000-0000-4000-8000-000000000903', '23000000-0000-4000-8000-000000000520', 'quantity_reserved', 1, 'x009b legacy ledger', 'x009b-pgtap-ledger');
insert into public.audit_events (id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason) values
  ('23000000-0000-4000-8000-000000000800', '23000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000301', '23000000-0000-4000-8000-000000000201', 'x009b_legacy_baseline', 'allowed', 'tenant', '23000000-0000-4000-8000-000000000001', 'baseline');

-- Initial state: the admin signs in to the legacy tenant only.
set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-4000-8000-000000000201', true);
select is(public.f001_active_tenant_member('23000000-0000-4000-8000-000000000001'), true, 'legacy membership starts active');
select is(public.f001_active_tenant_member('23000000-0000-4000-8000-000000000002'), true, 'clean membership already exists from a prior apply replay');
reset role;

-- APPLY: disable legacy membership; clean membership remains the single active entry.
update public.tenant_memberships
  set status = 'disabled', disabled_at = now()
  where id = '23000000-0000-4000-8000-000000000101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-4000-8000-000000000201', true);
select is(public.f001_active_tenant_member('23000000-0000-4000-8000-000000000001'), false, 'legacy membership is inactive after apply');
select is(public.f001_active_tenant_member('23000000-0000-4000-8000-000000000002'), true, 'clean membership is the active entry');

-- Legacy client rows are invisible across the tenant boundary.
select is(
  (select count(*) from public.clients where tenant_id = '23000000-0000-4000-8000-000000000001'),
  0::bigint, 'migrated admin cannot read legacy clients through tenant RLS'
);
select is(
  (select count(*) from public.deliverables where tenant_id = '23000000-0000-4000-8000-000000000001'),
  0::bigint, 'migrated admin cannot read legacy deliverables through tenant RLS'
);
select is(
  (select count(*) from public.member_profiles where tenant_id = '23000000-0000-4000-8000-000000000001'),
  0::bigint, 'migrated admin cannot read legacy member profiles through tenant RLS'
);

-- The clean workspace exposes its own profile and zero operational data.
select is(
  (select count(*) from public.member_profiles where tenant_id = '23000000-0000-4000-8000-000000000002'),
  1::bigint, 'clean workspace member profile is reachable'
);
select is(
  (select count(*) from public.clients where tenant_id = '23000000-0000-4000-8000-000000000002'),
  0::bigint, 'clean workspace starts with zero clients'
);
reset role;

-- REPLAY is idempotent: re-upserting the same deterministic rows changes nothing.
insert into public.tenants (id, name, status) values
  ('23000000-0000-4000-8000-000000000002', 'سماوة — مساحة المالك', 'active')
  on conflict (id) do update set name = excluded.name, status = excluded.status;
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('23000000-0000-4000-8000-000000000111', '23000000-0000-4000-8000-000000000002', '23000000-0000-4000-8000-000000000201', 'active')
  on conflict (id) do update set status = excluded.status, disabled_at = excluded.disabled_at;
select is(
  (select count(*) from public.tenants where id = '23000000-0000-4000-8000-000000000002'),
  1::bigint, 'replay does not duplicate the clean tenant'
);
select is(
  (select count(*) from public.tenant_memberships where tenant_id = '23000000-0000-4000-8000-000000000002' and auth_user_id = '23000000-0000-4000-8000-000000000201'),
  1::bigint, 'replay does not duplicate the clean membership'
);

-- ROLLBACK: restore the legacy entry without deleting anything.
update public.tenant_memberships
  set status = 'disabled', disabled_at = now()
  where id = '23000000-0000-4000-8000-000000000111';
update public.tenant_memberships
  set status = 'active', disabled_at = null
  where id = '23000000-0000-4000-8000-000000000101';

set local role authenticated;
select set_config('request.jwt.claim.sub', '23000000-0000-4000-8000-000000000201', true);
select is(public.f001_active_tenant_member('23000000-0000-4000-8000-000000000001'), true, 'rollback restores the legacy entry');
select is(public.f001_active_tenant_member('23000000-0000-4000-8000-000000000002'), false, 'rollback inactivates the clean entry');
select is(
  (select count(*) from public.deliverables where tenant_id = '23000000-0000-4000-8000-000000000001'),
  1::bigint, 'legacy deliverable is readable again after rollback'
);
reset role;

-- Append-only history survives the full apply/replay/rollback cycle.
select is(
  (select count(*) from public.audit_events where tenant_id = '23000000-0000-4000-8000-000000000001'),
  1::bigint, 'legacy audit history is preserved'
);
select is(
  (select count(*) from public.package_ledger_entries where tenant_id = '23000000-0000-4000-8000-000000000001'),
  1::bigint, 'legacy package ledger history is preserved'
);
select is(
  (select count(*) from public.clients where tenant_id = '23000000-0000-4000-8000-000000000002'),
  0::bigint, 'clean workspace remains empty after rollback (no destructive deletion)'
);

select * from finish();
rollback;
