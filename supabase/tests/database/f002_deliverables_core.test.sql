begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select plan(31);

grant usage on schema public to authenticated;
grant select on public.tenants to authenticated;
grant select on public.tenant_memberships to authenticated;
grant select on public.client_memberships to authenticated;
grant select on public.clients to authenticated;
grant select on public.role_assignments to authenticated;
grant select on public.contracts to authenticated;
grant select on public.contract_amendments to authenticated;
grant select on public.packages to authenticated;
grant select on public.package_lines to authenticated;
grant select on public.deliverables to authenticated;
grant select on public.package_ledger_entries to authenticated;
grant select on public.deliverable_allocations to authenticated;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.contracts'::regclass),
  'contracts has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.contract_amendments'::regclass),
  'contract_amendments has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.packages'::regclass),
  'packages has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.package_lines'::regclass),
  'package_lines has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.deliverables'::regclass),
  'deliverables has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.package_ledger_entries'::regclass),
  'package_ledger_entries has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.deliverable_allocations'::regclass),
  'deliverable_allocations has RLS enabled'
);

insert into public.tenants (id, name)
values
  ('01000000-0000-4000-8000-000000000001', 'Tenant A'),
  ('01000000-0000-4000-8000-000000000002', 'Tenant B');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
values
  (
    '01000000-0000-4000-8000-000000000101',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000201',
    'active'
  ),
  (
    '01000000-0000-4000-8000-000000000102',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000202',
    'active'
  ),
  (
    '01000000-0000-4000-8000-000000000103',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000203',
    'active'
  ),
  (
    '01000000-0000-4000-8000-000000000104',
    '01000000-0000-4000-8000-000000000002',
    '01000000-0000-4000-8000-000000000204',
    'active'
  );

insert into public.clients (id, tenant_id, name, slug, created_by)
values
  (
    '01000000-0000-4000-8000-000000000301',
    '01000000-0000-4000-8000-000000000001',
    'Client A',
    'f002-client-a',
    '01000000-0000-4000-8000-000000000201'
  ),
  (
    '01000000-0000-4000-8000-000000000302',
    '01000000-0000-4000-8000-000000000001',
    'Client C',
    'f002-client-c',
    '01000000-0000-4000-8000-000000000201'
  ),
  (
    '01000000-0000-4000-8000-000000000303',
    '01000000-0000-4000-8000-000000000002',
    'Client B',
    'f002-client-b',
    '01000000-0000-4000-8000-000000000204'
  );

insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status)
values (
  '01000000-0000-4000-8000-000000000401',
  '01000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000301',
  '01000000-0000-4000-8000-000000000203',
  'active'
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
values
  (
    '01000000-0000-4000-8000-000000000501',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000101',
    'tenant_administrator',
    'tenant',
    '01000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    '01000000-0000-4000-8000-000000000502',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000102',
    'account_manager',
    'client',
    '01000000-0000-4000-8000-000000000301',
    'active'
  ),
  (
    '01000000-0000-4000-8000-000000000503',
    '01000000-0000-4000-8000-000000000002',
    '01000000-0000-4000-8000-000000000104',
    'tenant_administrator',
    'tenant',
    '01000000-0000-4000-8000-000000000002',
    'active'
  );

insert into public.contracts (
  id,
  tenant_id,
  client_id,
  name,
  status,
  created_by
)
values
  (
    '02000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000301',
    'Client A Contract',
    'active',
    '01000000-0000-4000-8000-000000000201'
  ),
  (
    '02000000-0000-4000-8000-000000000002',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000302',
    'Client C Contract',
    'active',
    '01000000-0000-4000-8000-000000000201'
  ),
  (
    '02000000-0000-4000-8000-000000000003',
    '01000000-0000-4000-8000-000000000002',
    '01000000-0000-4000-8000-000000000303',
    'Client B Contract',
    'active',
    '01000000-0000-4000-8000-000000000204'
  );

insert into public.packages (
  id,
  tenant_id,
  client_id,
  contract_id,
  name,
  status,
  created_by
)
values (
  '03000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000301',
  '02000000-0000-4000-8000-000000000001',
  'Client A Package',
  'active',
  '01000000-0000-4000-8000-000000000201'
);

insert into public.package_lines (
  id,
  tenant_id,
  client_id,
  package_id,
  service_label,
  unit_label,
  committed_quantity,
  created_by
)
values (
  '04000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000301',
  '03000000-0000-4000-8000-000000000001',
  'Posts',
  'post',
  4,
  '01000000-0000-4000-8000-000000000201'
);

insert into public.deliverables (
  id,
  tenant_id,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  name,
  type,
  status,
  progress_percentage,
  created_by
)
values (
  '05000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000301',
  '02000000-0000-4000-8000-000000000001',
  '03000000-0000-4000-8000-000000000001',
  '04000000-0000-4000-8000-000000000001',
  'Launch Post',
  'post',
  'not_started',
  0,
  '01000000-0000-4000-8000-000000000201'
);

insert into public.package_ledger_entries (
  id,
  tenant_id,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  deliverable_id,
  entry_type,
  quantity,
  reason,
  actor_user_id,
  idempotency_key
)
values
  (
    '06000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000301',
    '02000000-0000-4000-8000-000000000001',
    '03000000-0000-4000-8000-000000000001',
    '04000000-0000-4000-8000-000000000001',
    null,
    'commitment_added',
    4,
    'internal package setup reason',
    '01000000-0000-4000-8000-000000000201',
    'f002-commitment-client-a'
  ),
  (
    '06000000-0000-4000-8000-000000000002',
    '01000000-0000-4000-8000-000000000001',
    '01000000-0000-4000-8000-000000000301',
    '02000000-0000-4000-8000-000000000001',
    '03000000-0000-4000-8000-000000000001',
    '04000000-0000-4000-8000-000000000001',
    '05000000-0000-4000-8000-000000000001',
    'quantity_reserved',
    1,
    'internal reservation reason',
    '01000000-0000-4000-8000-000000000201',
    'f002-reservation-client-a'
  );

insert into public.deliverable_allocations (
  id,
  tenant_id,
  client_id,
  deliverable_id,
  package_line_id,
  reserved_quantity,
  status,
  reservation_ledger_entry_id
)
values (
  '07000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000001',
  '01000000-0000-4000-8000-000000000301',
  '05000000-0000-4000-8000-000000000001',
  '04000000-0000-4000-8000-000000000001',
  1,
  'reserved',
  '06000000-0000-4000-8000-000000000002'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '01000000-0000-4000-8000-000000000201', true);

select is(
  (select count(*)::integer from public.contracts),
  2,
  'tenant administrator can see Tenant A contracts only'
);

select is(
  (select count(*)::integer from public.packages),
  1,
  'tenant administrator can see Tenant A packages'
);

select is(
  (select count(*)::integer from public.package_lines),
  1,
  'tenant administrator can see Tenant A package lines'
);

select is(
  (select count(*)::integer from public.deliverables),
  1,
  'tenant administrator can see Tenant A deliverables'
);

select is(
  (select count(*)::integer from public.package_ledger_entries),
  2,
  'tenant administrator can see Tenant A package ledger entries'
);

select is(
  (select count(*)::integer from public.deliverable_allocations),
  1,
  'tenant administrator can see Tenant A deliverable allocations'
);

select throws_ok(
  $$
    insert into public.contracts (
      id,
      tenant_id,
      client_id,
      name,
      status
    )
    values (
      '02000000-0000-4000-8000-000000000004',
      '01000000-0000-4000-8000-000000000001',
      '01000000-0000-4000-8000-000000000301',
      'Direct Insert Denied',
      'active'
    )
  $$,
  '42501',
  'permission denied for table contracts',
  'authenticated actors cannot directly insert contracts outside audited command path'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '01000000-0000-4000-8000-000000000202', true);

select is(
  (select count(*)::integer from public.contracts),
  1,
  'account manager can see only assigned Client A contract'
);

select is(
  (select count(*)::integer from public.package_ledger_entries),
  2,
  'account manager can see assigned Client A package ledger'
);

select is(
  (select count(*)::integer from public.contracts where client_id = '01000000-0000-4000-8000-000000000302'),
  0,
  'account manager cannot read unassigned Client C contract'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '01000000-0000-4000-8000-000000000203', true);

select is(
  (select count(*)::integer from public.contracts),
  0,
  'client member cannot read raw contract rows before safe summary surface'
);

select is(
  (select count(*)::integer from public.package_ledger_entries),
  0,
  'client member cannot read raw ledger rows or internal ledger reasons'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '01000000-0000-4000-8000-000000000204', true);

select is(
  (select count(*)::integer from public.contracts),
  1,
  'Tenant B administrator cannot see Tenant A contracts'
);

reset role;

grant update, delete on public.package_ledger_entries to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '01000000-0000-4000-8000-000000000201', true);

select throws_ok(
  $$ update public.package_ledger_entries set reason = 'mutated' $$,
  '42501',
  'package_ledger_entries are append-only',
  'package ledger entries cannot be updated'
);

select throws_ok(
  $$ delete from public.package_ledger_entries $$,
  '42501',
  'package_ledger_entries are append-only',
  'package ledger entries cannot be deleted'
);

reset role;

select col_not_null('public', 'contracts', 'tenant_id', 'contracts.tenant_id is required');
select col_not_null('public', 'contracts', 'client_id', 'contracts.client_id is required');
select col_not_null('public', 'packages', 'tenant_id', 'packages.tenant_id is required');
select col_not_null('public', 'package_lines', 'client_id', 'package_lines.client_id is required');
select col_not_null('public', 'deliverables', 'tenant_id', 'deliverables.tenant_id is required');
select col_not_null('public', 'package_ledger_entries', 'client_id', 'package_ledger_entries.client_id is required');
select col_not_null('public', 'deliverable_allocations', 'tenant_id', 'deliverable_allocations.tenant_id is required');

select * from finish();

rollback;

