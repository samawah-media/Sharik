begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select plan(48);

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

select ok(
  not exists (
    select 1
    from unnest(array[
      'contracts',
      'contract_amendments',
      'packages',
      'package_lines',
      'deliverables',
      'package_ledger_entries',
      'deliverable_allocations'
    ]) as f002_table(table_name)
    cross join unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) as f002_privilege(privilege_name)
    where has_table_privilege(
      'authenticated',
      format('public.%I', f002_table.table_name),
      f002_privilege.privilege_name
    )
  ),
  'authenticated has no direct insert/update/delete/truncate grants on F-002 tables'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'contracts',
        'contract_amendments',
        'packages',
        'package_lines',
        'deliverables',
        'package_ledger_entries',
        'deliverable_allocations'
      )
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ),
  'F-002 tables expose no direct write RLS policies'
);

select ok(
  to_regprocedure(
    'public.f002_create_contract_context(uuid, uuid, uuid, text, text, text, date, date, text, text)'
  ) is not null,
  'F-002A exposes a reviewed contract create RPC'
);

select ok(
  to_regprocedure(
    'public.f002_create_package_commitments(uuid, uuid, uuid, uuid, text, text, date, date, jsonb, text)'
  ) is not null,
  'F-002B exposes a reviewed package create RPC'
);

select ok(
  to_regprocedure(
    'public.f002_adjust_package_commitment(uuid, uuid, uuid, numeric, text, text)'
  ) is not null,
  'F-002B exposes a reviewed package adjustment RPC'
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

select is(
  (
    select id::text
    from public.f002_create_contract_context(
      '02000000-0000-4000-8000-000000000004',
      '09000000-0000-4000-8000-000000000001',
      '01000000-0000-4000-8000-000000000301',
      'Contract Created By RPC',
      'F002A-CTR-A',
      'Safe scoped contract summary',
      '2026-07-01'::date,
      '2026-12-31'::date,
      'draft',
      'f002a-contract-create-client-a'
    )
  ),
  '02000000-0000-4000-8000-000000000004',
  'tenant administrator can create a scoped contract through the audited RPC path'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'ContractCreated'
      and target_id = '02000000-0000-4000-8000-000000000004'
  ),
  1,
  'contract create RPC records ContractCreated audit event'
);

select is(
  (
    select id::text
    from public.f002_create_contract_context(
      '02000000-0000-4000-8000-000000000005',
      '09000000-0000-4000-8000-000000000002',
      '01000000-0000-4000-8000-000000000301',
      'Duplicate Idempotency Contract',
      null,
      null,
      null,
      null,
      'draft',
      'f002a-contract-create-client-a'
    )
  ),
  '02000000-0000-4000-8000-000000000004',
  'contract create RPC returns the existing contract for a repeated idempotency key'
);

select is(
  (
    select count(*)::integer
    from public.contracts
    where idempotency_key = 'f002a-contract-create-client-a'
  ),
  1,
  'contract create RPC does not duplicate contracts for a repeated idempotency key'
);

select is(
  (
    select id::text
    from public.f002_create_package_commitments(
      '03000000-0000-4000-8000-000000000010',
      '09000000-0000-4000-8000-000000000010',
      '01000000-0000-4000-8000-000000000301',
      '02000000-0000-4000-8000-000000000004',
      'Package Created By RPC',
      'draft',
      '2026-07-01'::date,
      '2026-07-31'::date,
      '[
        {
          "id": "04000000-0000-4000-8000-000000000010",
          "ledger_entry_id": "06000000-0000-4000-8000-000000000010",
          "service_label": "Posts",
          "deliverable_type_hint": "post",
          "unit_label": "post",
          "committed_quantity": 4
        },
        {
          "id": "04000000-0000-4000-8000-000000000011",
          "ledger_entry_id": "06000000-0000-4000-8000-000000000011",
          "service_label": "Report",
          "deliverable_type_hint": "report",
          "unit_label": "report",
          "committed_quantity": 1
        }
      ]'::jsonb,
      'f002b-package-create-client-a'
    )
  ),
  '03000000-0000-4000-8000-000000000010',
  'tenant administrator can create a scoped package through the audited RPC path'
);

select is(
  (
    select count(*)::integer
    from public.package_lines
    where package_id = '03000000-0000-4000-8000-000000000010'
  ),
  2,
  'package create RPC creates package lines'
);

select is(
  (
    select count(*)::integer
    from public.package_ledger_entries
    where package_id = '03000000-0000-4000-8000-000000000010'
      and entry_type = 'commitment_added'
  ),
  2,
  'package create RPC records commitment ledger entries for every line'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'PackageCreated'
      and target_id = '03000000-0000-4000-8000-000000000010'
  ),
  1,
  'package create RPC records PackageCreated audit event'
);

select is(
  (
    select id::text
    from public.f002_create_package_commitments(
      '03000000-0000-4000-8000-000000000011',
      '09000000-0000-4000-8000-000000000011',
      '01000000-0000-4000-8000-000000000301',
      '02000000-0000-4000-8000-000000000004',
      'Duplicate Package',
      'draft',
      '2026-07-01'::date,
      '2026-07-31'::date,
      '[
        {
          "id": "04000000-0000-4000-8000-000000000012",
          "ledger_entry_id": "06000000-0000-4000-8000-000000000012",
          "service_label": "Duplicate",
          "unit_label": "unit",
          "committed_quantity": 99
        }
      ]'::jsonb,
      'f002b-package-create-client-a'
    )
  ),
  '03000000-0000-4000-8000-000000000010',
  'package create RPC returns existing package for a repeated idempotency key'
);

select is(
  (
    select available::numeric
    from public.f002_adjust_package_commitment(
      '06000000-0000-4000-8000-000000000012',
      '09000000-0000-4000-8000-000000000012',
      '04000000-0000-4000-8000-000000000010',
      2,
      'Approved commitment increase',
      'f002b-package-adjust-client-a'
    )
  ),
  6::numeric,
  'package adjustment RPC appends an adjustment and returns the derived balance'
);

select throws_ok(
  $$
    select *
    from public.f002_adjust_package_commitment(
      '06000000-0000-4000-8000-000000000013',
      '09000000-0000-4000-8000-000000000013',
      '04000000-0000-4000-8000-000000000010',
      1,
      '',
      'f002b-package-adjust-missing-reason'
    )
  $$,
  'P0001',
  'adjustment reason required',
  'package adjustment RPC requires an explicit reason'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '01000000-0000-4000-8000-000000000202', true);

select is(
  (select count(*)::integer from public.contracts),
  2,
  'account manager can see only assigned Client A contracts'
);

select is(
  (select count(*)::integer from public.package_ledger_entries),
  5,
  'account manager can see assigned Client A package ledger'
);

select is(
  (select count(*)::integer from public.contracts where client_id = '01000000-0000-4000-8000-000000000302'),
  0,
  'account manager cannot read unassigned Client C contract'
);

select throws_ok(
  $$
    select *
    from public.f002_create_contract_context(
      '02000000-0000-4000-8000-000000000006',
      '09000000-0000-4000-8000-000000000003',
      '01000000-0000-4000-8000-000000000301',
      'Account Manager Contract Denied',
      null,
      null,
      null,
      null,
      'draft',
      'f002a-contract-account-manager-denied'
    )
  $$,
  '42501',
  'not authorized',
  'account manager cannot use the contract create RPC'
);

select throws_ok(
  $$
    select *
    from public.f002_create_package_commitments(
      '03000000-0000-4000-8000-000000000012',
      '09000000-0000-4000-8000-000000000014',
      '01000000-0000-4000-8000-000000000301',
      '02000000-0000-4000-8000-000000000001',
      'Account Manager Package Denied',
      'draft',
      null,
      null,
      '[
        {
          "id": "04000000-0000-4000-8000-000000000013",
          "ledger_entry_id": "06000000-0000-4000-8000-000000000014",
          "service_label": "Denied",
          "unit_label": "unit",
          "committed_quantity": 1
        }
      ]'::jsonb,
      'f002b-package-account-manager-denied'
    )
  $$,
  '42501',
  'not authorized',
  'account manager cannot use the package create RPC'
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
select has_column('public', 'contracts', 'idempotency_key', 'contracts.idempotency_key supports command idempotency');
select col_not_null('public', 'packages', 'tenant_id', 'packages.tenant_id is required');
select col_not_null('public', 'package_lines', 'client_id', 'package_lines.client_id is required');
select col_not_null('public', 'deliverables', 'tenant_id', 'deliverables.tenant_id is required');
select col_not_null('public', 'package_ledger_entries', 'client_id', 'package_ledger_entries.client_id is required');
select col_not_null('public', 'deliverable_allocations', 'tenant_id', 'deliverable_allocations.tenant_id is required');

select * from finish();

rollback;

