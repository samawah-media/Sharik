begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select plan(9);

grant usage on schema public to authenticated;
grant select on public.tenants to authenticated;
grant select on public.tenant_memberships to authenticated;
grant select on public.client_memberships to authenticated;
grant select on public.clients to authenticated;
grant select on public.role_assignments to authenticated;
grant select on public.contracts to authenticated;
grant select on public.packages to authenticated;
grant select on public.package_lines to authenticated;
grant select on public.deliverables to authenticated;
grant select on public.deliverable_versions to authenticated;
grant select on public.package_ledger_entries to authenticated;
grant select on public.deliverable_allocations to authenticated;

insert into public.tenants (id, name)
values ('0f060000-0000-4000-8000-000000000001', 'F006 Tenant');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
values
  (
    '0f060000-0000-4000-8000-000000000101',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000201',
    'active'
  ),
  (
    '0f060000-0000-4000-8000-000000000102',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000202',
    'active'
  ),
  (
    '0f060000-0000-4000-8000-000000000103',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000203',
    'active'
  );

insert into public.clients (id, tenant_id, name, slug, created_by)
values
  (
    '0f060000-0000-4000-8000-000000000301',
    '0f060000-0000-4000-8000-000000000001',
    'F006 Client A',
    'f006-client-a',
    '0f060000-0000-4000-8000-000000000201'
  ),
  (
    '0f060000-0000-4000-8000-000000000302',
    '0f060000-0000-4000-8000-000000000001',
    'F006 Client B',
    'f006-client-b',
    '0f060000-0000-4000-8000-000000000201'
  );

insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status)
values
  (
    '0f060000-0000-4000-8000-000000000401',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000301',
    '0f060000-0000-4000-8000-000000000201',
    'active'
  ),
  (
    '0f060000-0000-4000-8000-000000000402',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000301',
    '0f060000-0000-4000-8000-000000000202',
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
    '0f060000-0000-4000-8000-000000000501',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000101',
    'client_viewer',
    'client',
    '0f060000-0000-4000-8000-000000000301',
    'active'
  ),
  (
    '0f060000-0000-4000-8000-000000000502',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000103',
    'client_viewer',
    'client',
    '0f060000-0000-4000-8000-000000000301',
    'active'
  );

insert into public.contracts (id, tenant_id, client_id, name, status, created_by)
values
  (
    '0f060000-0000-4000-8000-000000000601',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000301',
    'F006 Client A Contract',
    'active',
    '0f060000-0000-4000-8000-000000000201'
  ),
  (
    '0f060000-0000-4000-8000-000000000602',
    '0f060000-0000-4000-8000-000000000001',
    '0f060000-0000-4000-8000-000000000302',
    'F006 Client B Contract',
    'active',
    '0f060000-0000-4000-8000-000000000201'
  );

insert into public.packages (id, tenant_id, client_id, contract_id, name, status, created_by)
values (
  '0f060000-0000-4000-8000-000000000701',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  '0f060000-0000-4000-8000-000000000601',
  'F006 Client A Package',
  'active',
  '0f060000-0000-4000-8000-000000000201'
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
  '0f060000-0000-4000-8000-000000000801',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  '0f060000-0000-4000-8000-000000000701',
  'F006 Posts',
  'post',
  1,
  '0f060000-0000-4000-8000-000000000201'
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
  '0f060000-0000-4000-8000-000000000901',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  '0f060000-0000-4000-8000-000000000601',
  '0f060000-0000-4000-8000-000000000701',
  '0f060000-0000-4000-8000-000000000801',
  'F006 Deliverable',
  'post',
  'internally_approved',
  70,
  '0f060000-0000-4000-8000-000000000201'
);

insert into public.deliverable_versions (
  id, tenant_id, client_id, deliverable_id, version_number, status, caption
)
values (
  '0f060000-0000-4000-8000-000000001201',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  '0f060000-0000-4000-8000-000000000901',
  1,
  'client_visible',
  'F006 client-visible caption'
);

update public.deliverables
set current_version_id = '0f060000-0000-4000-8000-000000001201',
    status = 'waiting_client_approval',
    progress_percentage = 80
where id = '0f060000-0000-4000-8000-000000000901';

insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage, created_by
)
values (
  '0f060000-0000-4000-8000-000000001301',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  'F006 hidden internal deliverable',
  'post',
  'in_progress',
  30,
  '0f060000-0000-4000-8000-000000000201'
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
  actor_user_id,
  idempotency_key
)
values (
  '0f060000-0000-4000-8000-000000001001',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  '0f060000-0000-4000-8000-000000000601',
  '0f060000-0000-4000-8000-000000000701',
  '0f060000-0000-4000-8000-000000000801',
  '0f060000-0000-4000-8000-000000000901',
  'quantity_reserved',
  1,
  '0f060000-0000-4000-8000-000000000201',
  'f006-client-a-reservation'
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
  '0f060000-0000-4000-8000-000000001101',
  '0f060000-0000-4000-8000-000000000001',
  '0f060000-0000-4000-8000-000000000301',
  '0f060000-0000-4000-8000-000000000901',
  '0f060000-0000-4000-8000-000000000801',
  1,
  'reserved',
  '0f060000-0000-4000-8000-000000001001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '0f060000-0000-4000-8000-000000000201', true);

select is((select count(*)::integer from public.contracts), 1, 'client viewer can read assigned client contracts');
select is((select count(*)::integer from public.packages), 1, 'client viewer can read assigned client packages');
select is((select count(*)::integer from public.package_lines), 1, 'client viewer can read assigned client package lines');
select is((select count(*)::integer from public.deliverables), 1, 'client viewer can read assigned client deliverables');
select is((select count(*)::integer from public.package_ledger_entries), 1, 'client viewer can read assigned client ledger rows for package summary');
select is((select count(*)::integer from public.deliverable_allocations), 1, 'client viewer can read assigned client deliverable allocations');
select is((select count(*)::integer from public.contracts where client_id = '0f060000-0000-4000-8000-000000000302'), 0, 'client viewer cannot read another client contract');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '0f060000-0000-4000-8000-000000000202', true);

select is((select count(*)::integer from public.contracts), 0, 'client membership without client role cannot read commercial rows');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '0f060000-0000-4000-8000-000000000203', true);

select is((select count(*)::integer from public.contracts), 0, 'client role without client membership cannot read commercial rows');

select * from finish();

rollback;
