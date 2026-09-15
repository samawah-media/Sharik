-- Spec 015 X010-B-2: client contact phone/WhatsApp column and onboarding
-- simplification regression. Self-contained: proves the additive column, the
-- recreated audited client write RPCs, phone persistence, tenant RLS isolation
-- on the new column, atomic onboarding with phone, and idempotency.

begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- ---------------------------------------------------------------------------
-- Schema + privilege assertions
-- ---------------------------------------------------------------------------
select has_column('public', 'clients', 'primary_contact_phone', 'clients.primary_contact_phone column exists');
select col_is_null('public', 'clients', 'primary_contact_phone', 'primary_contact_phone is nullable/additive');

select ok(
  (select prosecdef from pg_proc where oid = 'public.f001_create_client_write(uuid, uuid, text, text, text, text, text)'::regprocedure),
  'f001_create_client_write (7-param) is security definer'
);
select ok(
  has_function_privilege('authenticated', 'public.f001_create_client_write(uuid, uuid, text, text, text, text, text)', 'execute'),
  'authenticated can execute the recreated create RPC'
);
select ok(
  not has_function_privilege('anon', 'public.f001_create_client_write(uuid, uuid, text, text, text, text, text)', 'execute'),
  'anon cannot execute the recreated create RPC'
);
select ok(
  (select prosecdef from pg_proc where oid = 'public.f001_update_client_write(uuid, uuid, text, text, text, text, text, integer)'::regprocedure),
  'f001_update_client_write (8-param) is security definer'
);
select ok(
  has_function_privilege('authenticated', 'public.f001_update_client_write(uuid, uuid, text, text, text, text, text, integer)', 'execute'),
  'authenticated can execute the recreated update RPC'
);
select ok(
  not has_function_privilege('anon', 'public.f001_update_client_write(uuid, uuid, text, text, text, text, text, integer)', 'execute'),
  'anon cannot execute the recreated update RPC'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_onboard_first_client(text, uuid, uuid, text, text, text, text, uuid, uuid, text, text, text, date, date, text, uuid, uuid, text, text, date, date, jsonb, uuid, uuid, uuid, uuid, text, text, text, text, uuid, uuid[], date, date, date, date, boolean, boolean, numeric, text)',
    'execute'
  ),
  'authenticated can execute the onboarding RPC with the trailing phone parameter'
);

-- CHECK constraint guards the column at the DB layer.
select col_has_check('public', 'clients', 'primary_contact_phone', 'phone column has a CHECK constraint');

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------
insert into public.tenants (id, name) values
('41000000-0000-4000-8000-000000000001', 'X010B2 Tenant A'),
('42000000-0000-4000-8000-000000000001', 'X010B2 Tenant B');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
('41000000-0000-4000-8000-000000000101', '41000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000201', 'active'),
('42000000-0000-4000-8000-000000000101', '42000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000201', 'active');

insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
('41000000-0000-4000-8000-000000000401', '41000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '41000000-0000-4000-8000-000000000001', 'active'),
('42000000-0000-4000-8000-000000000401', '42000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '42000000-0000-4000-8000-000000000001', 'active');

-- ---------------------------------------------------------------------------
-- f001_create_client_write persists the phone
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000201', true);

select results_eq(
  $$select primary_contact_phone from public.f001_create_client_write(
    '41000000-0000-4000-8000-000000000901',
    '41000000-0000-4000-8000-000000000911',
    'X010B2 Phone Client',
    'x010b2-phone-client',
    'مسؤول التواصل',
    'contact@example.test',
    '+966501234567'
  )$$,
  $$values ('+966501234567'::text)$$,
  'create client write returns the persisted phone'
);

reset role;

set local role service_role;
select is(
  (select primary_contact_phone from public.clients where id = '41000000-0000-4000-8000-000000000901'),
  '+966501234567',
  'phone column is persisted for the created client'
);
reset role;

-- ---------------------------------------------------------------------------
-- f001_update_client_write updates the phone
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000201', true);

select results_eq(
  $$select primary_contact_phone from public.f001_update_client_write(
    '41000000-0000-4000-8000-000000000901',
    '41000000-0000-4000-8000-000000000912',
    'X010B2 Phone Client',
    'x010b2-phone-client',
    'مسؤول التواصل',
    'contact@example.test',
    '+966509998888',
    1
  )$$,
  $$values ('+966509998888'::text)$$,
  'update client write returns the updated phone'
);

reset role;

-- ---------------------------------------------------------------------------
-- Tenant isolation: Tenant B cannot read Tenant A client phone
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '42000000-0000-4000-8000-000000000201', true);

select is(
  (select count(*)::integer from public.clients where id = '41000000-0000-4000-8000-000000000901'),
  0,
  'tenant B cannot see tenant A client (RLS isolation covers the phone column)'
);

select throws_ok(
  $$select * from public.f001_update_client_write(
    '41000000-0000-4000-8000-000000000901',
    '41000000-0000-4000-8000-000000000913',
    'hijack',
    'hijack',
    null,
    null,
    null,
    2
  )$$,
  '42501',
  'not authorized to update this client'
);

reset role;

-- ---------------------------------------------------------------------------
-- Atomic onboarding persists phone and replays idempotently
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000201', true);

select lives_ok(
  $$select * from public.s015_onboard_first_client(
    request_idempotency_key => 'x010b2-onboarding-phone',
    client_id_input => '41000000-0000-4000-8000-000000000902',
    client_audit_event_id => '41000000-0000-4000-8000-000000000921',
    client_name_input => 'X010B2 Onboarded Client',
    client_slug_input => 'x010b2-onboarded-client',
    client_contact_name_input => 'مسؤول التواصل',
    client_contact_email_input => 'onboard@example.test',
    client_contact_phone_input => '+966501234567',
    contract_id_input => '41000000-0000-4000-8000-000000000903',
    contract_audit_event_id => '41000000-0000-4000-8000-000000000922',
    contract_name_input => 'X010B2 Contract',
    contract_reference_input => null,
    contract_summary_input => null,
    contract_period_start_input => null,
    contract_period_end_input => null,
    contract_status_input => 'active',
    package_id_input => '41000000-0000-4000-8000-000000000904',
    package_audit_event_id => '41000000-0000-4000-8000-000000000923',
    package_name_input => 'X010B2 Package',
    package_status_input => 'active',
    package_period_start_input => null,
    package_period_end_input => null,
    package_line_items_input => '[{"id":"41000000-0000-4000-8000-000000000905","ledger_entry_id":"41000000-0000-4000-8000-000000000924","service_label":"منشورات","deliverable_type_hint":"post","unit_label":"منشور","committed_quantity":3}]',
    deliverable_id_input => '41000000-0000-4000-8000-000000000906',
    allocation_id_input => '41000000-0000-4000-8000-000000000907',
    deliverable_ledger_entry_id => '41000000-0000-4000-8000-000000000925',
    deliverable_audit_event_id => '41000000-0000-4000-8000-000000000926',
    deliverable_name_input => 'X010B2 Deliverable',
    deliverable_description_input => null,
    deliverable_type_input => 'post',
    deliverable_priority_input => 'normal',
    owner_user_id_input => null,
    contributor_user_ids_input => array[]::uuid[],
    start_on_input => null,
    internal_due_on_input => null,
    client_due_on_input => null,
    final_due_on_input => null,
    requires_internal_approval_input => true,
    requires_client_approval_input => true,
    reserved_quantity_input => 1
  )$$,
  'atomic onboarding with phone succeeds'
);

reset role;

set local role service_role;
select is(
  (select primary_contact_phone from public.clients where id = '41000000-0000-4000-8000-000000000902'),
  '+966501234567',
  'onboarding persists the client phone'
);
reset role;

-- Idempotent replay with the same phone + payload returns the same client.
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000201', true);

select results_eq(
  $$select result_client_id from public.s015_onboard_first_client(
    request_idempotency_key => 'x010b2-onboarding-phone',
    client_id_input => '41000000-0000-4000-8000-000000000999',
    client_audit_event_id => '41000000-0000-4000-8000-000000000998',
    client_name_input => 'X010B2 Onboarded Client',
    client_slug_input => 'x010b2-onboarded-client',
    client_contact_name_input => 'مسؤول التواصل',
    client_contact_email_input => 'onboard@example.test',
    client_contact_phone_input => '+966501234567',
    contract_id_input => '41000000-0000-4000-8000-000000000997',
    contract_audit_event_id => '41000000-0000-4000-8000-000000000996',
    contract_name_input => 'X010B2 Contract',
    contract_reference_input => null,
    contract_summary_input => null,
    contract_period_start_input => null,
    contract_period_end_input => null,
    contract_status_input => 'active',
    package_id_input => '41000000-0000-4000-8000-000000000995',
    package_audit_event_id => '41000000-0000-4000-8000-000000000994',
    package_name_input => 'X010B2 Package',
    package_status_input => 'active',
    package_period_start_input => null,
    package_period_end_input => null,
    package_line_items_input => '[{"id":"41000000-0000-4000-8000-000000000993","ledger_entry_id":"41000000-0000-4000-8000-000000000992","service_label":"منشورات","deliverable_type_hint":"post","unit_label":"منشور","committed_quantity":3}]',
    deliverable_id_input => '41000000-0000-4000-8000-000000000991',
    allocation_id_input => '41000000-0000-4000-8000-000000000990',
    deliverable_ledger_entry_id => '41000000-0000-4000-8000-000000000989',
    deliverable_audit_event_id => '41000000-0000-4000-8000-000000000988',
    deliverable_name_input => 'X010B2 Deliverable',
    deliverable_description_input => null,
    deliverable_type_input => 'post',
    deliverable_priority_input => 'normal',
    owner_user_id_input => null,
    contributor_user_ids_input => array[]::uuid[],
    start_on_input => null,
    internal_due_on_input => null,
    client_due_on_input => null,
    final_due_on_input => null,
    requires_internal_approval_input => true,
    requires_client_approval_input => true,
    reserved_quantity_input => 1
  )$$,
  $$values ('41000000-0000-4000-8000-000000000902'::uuid)$$,
  'idempotent replay returns the original client id'
);

-- Different phone on the same key is an idempotency conflict.
select throws_ok(
  $$select * from public.s015_onboard_first_client(
    request_idempotency_key => 'x010b2-onboarding-phone',
    client_id_input => '41000000-0000-4000-8000-000000000999',
    client_audit_event_id => '41000000-0000-4000-8000-000000000998',
    client_name_input => 'X010B2 Onboarded Client',
    client_slug_input => 'x010b2-onboarded-client',
    client_contact_name_input => 'مسؤول التواصل',
    client_contact_email_input => 'onboard@example.test',
    client_contact_phone_input => '+966509998888',
    contract_id_input => '41000000-0000-4000-8000-000000000997',
    contract_audit_event_id => '41000000-0000-4000-8000-000000000996',
    contract_name_input => 'X010B2 Contract',
    contract_reference_input => null,
    contract_summary_input => null,
    contract_period_start_input => null,
    contract_period_end_input => null,
    contract_status_input => 'active',
    package_id_input => '41000000-0000-4000-8000-000000000995',
    package_audit_event_id => '41000000-0000-4000-8000-000000000994',
    package_name_input => 'X010B2 Package',
    package_status_input => 'active',
    package_period_start_input => null,
    package_period_end_input => null,
    package_line_items_input => '[{"id":"41000000-0000-4000-8000-000000000981","ledger_entry_id":"41000000-0000-4000-8000-000000000982","service_label":"منشورات","deliverable_type_hint":"post","unit_label":"منشور","committed_quantity":3}]',
    deliverable_id_input => '41000000-0000-4000-8000-000000000983',
    allocation_id_input => '41000000-0000-4000-8000-000000000984',
    deliverable_ledger_entry_id => '41000000-0000-4000-8000-000000000985',
    deliverable_audit_event_id => '41000000-0000-4000-8000-000000000986',
    deliverable_name_input => 'X010B2 Deliverable',
    deliverable_description_input => null,
    deliverable_type_input => 'post',
    deliverable_priority_input => 'normal',
    owner_user_id_input => null,
    contributor_user_ids_input => array[]::uuid[],
    start_on_input => null,
    internal_due_on_input => null,
    client_due_on_input => null,
    final_due_on_input => null,
    requires_internal_approval_input => true,
    requires_client_approval_input => true,
    reserved_quantity_input => 1
  )$$,
  'P0001',
  'onboarding idempotency conflict'
);

reset role;

-- ---------------------------------------------------------------------------
-- DB CHECK constraint: invalid phone formats are rejected at the DB layer
-- ---------------------------------------------------------------------------
set local role service_role;

-- Direct insert with a malformed phone is rejected by the CHECK constraint.
select throws_ok(
  $$insert into public.clients (id, tenant_id, name, slug, primary_contact_phone)
    values ('41000000-0000-4000-8000-000000000990', '41000000-0000-4000-8000-000000000001', 'bad', 'bad', 'not-a-phone')$$,
  '23514',
  'new row for relation "clients" violates check constraint "clients_primary_contact_phone_format"'
);

-- A phone with a "+" in the middle is rejected.
select throws_ok(
  $$insert into public.clients (id, tenant_id, name, slug, primary_contact_phone)
    values ('41000000-0000-4000-8000-000000000991', '41000000-0000-4000-8000-000000000001', 'bad2', 'bad2', '966+501234567')$$,
  '23514',
  'new row for relation "clients" violates check constraint "clients_primary_contact_phone_format"'
);

-- A too-short phone is rejected.
select throws_ok(
  $$insert into public.clients (id, tenant_id, name, slug, primary_contact_phone)
    values ('41000000-0000-4000-8000-000000000992', '41000000-0000-4000-8000-000000000001', 'bad3', 'bad3', '12345')$$,
  '23514',
  'new row for relation "clients" violates check constraint "clients_primary_contact_phone_format"'
);

reset role;

-- Audited RPC rejects an invalid phone too (defense-in-depth; the app already
-- normalizes, but the DB guard must hold regardless of the caller).
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000201', true);

select throws_ok(
  $$select * from public.f001_create_client_write(
    '41000000-0000-4000-8000-000000000993',
    '41000000-0000-4000-8000-000000000994',
    'Bad phone client',
    'bad-phone-client',
    null,
    null,
    '966+501234567'
  )$$,
  '23514',
  'new row for relation "clients" violates check constraint "clients_primary_contact_phone_format"'
);

reset role;

select * from finish();
rollback;
