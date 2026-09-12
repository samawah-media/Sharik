begin;

select plan(3);

insert into public.tenants (id, name, status)
values ('66000000-0000-4000-8000-000000000001', 'SIL66 tenant', 'active');

insert into public.clients (id, tenant_id, name, slug, status)
values (
  '66000000-0000-4000-8000-000000000002',
  '66000000-0000-4000-8000-000000000001',
  'SIL66 client',
  'sil66-client',
  'active'
);

insert into public.contracts (id, tenant_id, client_id, name, status)
values (
  '66000000-0000-4000-8000-000000000003',
  '66000000-0000-4000-8000-000000000001',
  '66000000-0000-4000-8000-000000000002',
  'SIL66 contract',
  'active'
);

insert into public.packages (id, tenant_id, client_id, contract_id, name, status)
values (
  '66000000-0000-4000-8000-000000000004',
  '66000000-0000-4000-8000-000000000001',
  '66000000-0000-4000-8000-000000000002',
  '66000000-0000-4000-8000-000000000003',
  'SIL66 package',
  'active'
);

insert into public.package_lines (
  id, tenant_id, client_id, package_id, service_label, unit_label,
  committed_quantity, status
) values (
  '66000000-0000-4000-8000-000000000005',
  '66000000-0000-4000-8000-000000000001',
  '66000000-0000-4000-8000-000000000002',
  '66000000-0000-4000-8000-000000000004',
  'منشورات',
  'منشور',
  4,
  'active'
);

insert into public.package_lines (
  id, tenant_id, client_id, package_id, service_label, unit_label,
  committed_quantity, status
) values (
  '66000000-0000-4000-8000-000000000012',
  '66000000-0000-4000-8000-000000000001',
  '66000000-0000-4000-8000-000000000002',
  '66000000-0000-4000-8000-000000000004',
  'استشارات',
  'ساعة',
  8,
  'active'
);

insert into public.deliverables (
  id, tenant_id, client_id, contract_id, package_id, package_line_id,
  name, type
) values
  (
    '66000000-0000-4000-8000-000000000006',
    '66000000-0000-4000-8000-000000000001',
    '66000000-0000-4000-8000-000000000002',
    '66000000-0000-4000-8000-000000000003',
    '66000000-0000-4000-8000-000000000004',
    '66000000-0000-4000-8000-000000000005',
    'منشور 1',
    'post'
  ),
  (
    '66000000-0000-4000-8000-000000000007',
    '66000000-0000-4000-8000-000000000001',
    '66000000-0000-4000-8000-000000000002',
    '66000000-0000-4000-8000-000000000003',
    '66000000-0000-4000-8000-000000000004',
    '66000000-0000-4000-8000-000000000005',
    'منشور 2',
    'post'
  ),
  (
    '66000000-0000-4000-8000-000000000013',
    '66000000-0000-4000-8000-000000000001',
    '66000000-0000-4000-8000-000000000002',
    '66000000-0000-4000-8000-000000000003',
    '66000000-0000-4000-8000-000000000004',
    '66000000-0000-4000-8000-000000000012',
    'جلسة استشارية',
    'consultation'
  );

insert into public.package_ledger_entries (
  id, tenant_id, client_id, contract_id, package_id, package_line_id,
  deliverable_id, entry_type, quantity, idempotency_key
) values
  (
    '66000000-0000-4000-8000-000000000008',
    '66000000-0000-4000-8000-000000000001',
    '66000000-0000-4000-8000-000000000002',
    '66000000-0000-4000-8000-000000000003',
    '66000000-0000-4000-8000-000000000004',
    '66000000-0000-4000-8000-000000000005',
    '66000000-0000-4000-8000-000000000006',
    'quantity_reserved',
    1,
    'sil66-reserve-one'
  ),
  (
    '66000000-0000-4000-8000-000000000009',
    '66000000-0000-4000-8000-000000000001',
    '66000000-0000-4000-8000-000000000002',
    '66000000-0000-4000-8000-000000000003',
    '66000000-0000-4000-8000-000000000004',
    '66000000-0000-4000-8000-000000000005',
    '66000000-0000-4000-8000-000000000007',
    'quantity_reserved',
    2,
    'sil66-reserve-two'
  ),
  (
    '66000000-0000-4000-8000-000000000014',
    '66000000-0000-4000-8000-000000000001',
    '66000000-0000-4000-8000-000000000002',
    '66000000-0000-4000-8000-000000000003',
    '66000000-0000-4000-8000-000000000004',
    '66000000-0000-4000-8000-000000000012',
    '66000000-0000-4000-8000-000000000013',
    'quantity_reserved',
    1.5,
    'sil66-reserve-divisible'
  );

select lives_ok(
  $$insert into public.deliverable_allocations (
      id, tenant_id, client_id, deliverable_id, package_line_id,
      reserved_quantity, reservation_ledger_entry_id
    ) values (
      '66000000-0000-4000-8000-000000000010',
      '66000000-0000-4000-8000-000000000001',
      '66000000-0000-4000-8000-000000000002',
      '66000000-0000-4000-8000-000000000006',
      '66000000-0000-4000-8000-000000000005',
      1,
      '66000000-0000-4000-8000-000000000008'
    )$$,
  'one count unit can be reserved by one deliverable'
);

select throws_ok(
  $$insert into public.deliverable_allocations (
      id, tenant_id, client_id, deliverable_id, package_line_id,
      reserved_quantity, reservation_ledger_entry_id
    ) values (
      '66000000-0000-4000-8000-000000000011',
      '66000000-0000-4000-8000-000000000001',
      '66000000-0000-4000-8000-000000000002',
      '66000000-0000-4000-8000-000000000007',
      '66000000-0000-4000-8000-000000000005',
      2,
      '66000000-0000-4000-8000-000000000009'
    )$$,
  '22023',
  'count unit requires one deliverable per reserved unit',
  'one deliverable cannot reserve multiple count units'
);

select lives_ok(
  $$insert into public.deliverable_allocations (
      id, tenant_id, client_id, deliverable_id, package_line_id,
      reserved_quantity, reservation_ledger_entry_id
    ) values (
      '66000000-0000-4000-8000-000000000015',
      '66000000-0000-4000-8000-000000000001',
      '66000000-0000-4000-8000-000000000002',
      '66000000-0000-4000-8000-000000000013',
      '66000000-0000-4000-8000-000000000012',
      1.5,
      '66000000-0000-4000-8000-000000000014'
    )$$,
  'divisible units can reserve fractional quantities'
);

select * from finish();
rollback;
