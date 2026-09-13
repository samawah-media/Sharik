begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- X009-C guided first-client onboarding RPC sequence.
-- Proves the four audited RPCs (client → contract → package → deliverable)
-- create a complete operational scope from zero, that replaying the same
-- idempotency keys is safe, and that a role without CLIENT_CREATE cannot
-- start the sequence.

insert into public.tenants (id, name) values
  ('24000000-0000-4000-8000-000000000001', 'X009C Onboarding Tenant'),
  ('24000000-0000-4000-8000-000000000002', 'X009C Other Tenant');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('24000000-0000-4000-8000-000000000101', '24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000201', 'active'),
  ('24000000-0000-4000-8000-000000000102', '24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000202', 'active');

insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('24000000-0000-4000-8000-000000000401', '24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000101', 'tenant_administrator', 'tenant', '24000000-0000-4000-8000-000000000001', 'active'),
  ('24000000-0000-4000-8000-000000000402', '24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000102', 'account_manager', 'client', '24000000-0000-4000-8000-000000000301', 'active');

insert into public.member_profiles (tenant_id, user_id, display_name, role_label) values
  ('24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000201', 'مدير سماوة', 'إدارة'),
  ('24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000202', 'مدير الحساب', 'مدير حساب');

-- STEP 1: tenant_administrator creates the client via f001_create_client_write.
set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-4000-8000-000000000201', true);

select is(
  (
    select count(*)::integer
    from public.f001_create_client_write(
      '24000000-0000-4000-8000-000000000301',
      '24000000-0000-4000-8000-000000000801',
      'عميل X009C',
      'x009c-onboarding-client',
      'جهة التواصل',
      'contact@x009c.test'
    )
  ),
  1,
  'onboarding step 1: tenant_administrator creates a client via RPC'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'ClientCreated'
      and target_id = '24000000-0000-4000-8000-000000000301'
  ),
  1,
  'onboarding step 1: ClientCreated audit event recorded'
);

-- STEP 2: create contract via f002_create_contract_context.
select is(
  (
    select id::text
    from public.f002_create_contract_context(
      '24000000-0000-4000-8000-000000000901',
      '24000000-0000-4000-8000-000000000802',
      '24000000-0000-4000-8000-000000000301',
      'عقد X009C',
      'X009C-CTR',
      'ملخص آمن',
      '2026-01-01'::date,
      '2026-12-31'::date,
      'active',
      'x009c-onboarding-contract'
    )
  ),
  '24000000-0000-4000-8000-000000000901',
  'onboarding step 2: contract created via RPC'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'ContractCreated'
      and target_id = '24000000-0000-4000-8000-000000000901'
  ),
  1,
  'onboarding step 2: ContractCreated audit event recorded'
);

-- STEP 3: create package + lines via f002_create_package_commitments.
select is(
  (
    select id::text
    from public.f002_create_package_commitments(
      '24000000-0000-4000-8000-000000000902',
      '24000000-0000-4000-8000-000000000803',
      '24000000-0000-4000-8000-000000000301',
      '24000000-0000-4000-8000-000000000901',
      'باقة X009C',
      'active',
      '2026-01-01'::date,
      '2026-12-31'::date,
      '[
        {
          "id": "24000000-0000-4000-8000-000000000903",
          "ledger_entry_id": "24000000-0000-4000-8000-000000000904",
          "service_label": "منشورات",
          "deliverable_type_hint": "post",
          "unit_label": "منشور",
          "committed_quantity": 10
        }
      ]'::jsonb,
      'x009c-onboarding-package'
    )
  ),
  '24000000-0000-4000-8000-000000000902',
  'onboarding step 3: package created via RPC'
);

select is(
  (
    select count(*)::integer
    from public.package_lines
    where package_id = '24000000-0000-4000-8000-000000000902'
  ),
  1,
  'onboarding step 3: package line created'
);

select is(
  (
    select count(*)::integer
    from public.package_ledger_entries
    where package_id = '24000000-0000-4000-8000-000000000902'
      and entry_type = 'commitment_added'
  ),
  1,
  'onboarding step 3: commitment ledger entry recorded'
);

-- STEP 4: create first deliverable + reservation via f002_create_deliverable_reservation.
select is(
  (
    select id::text
    from public.f002_create_deliverable_reservation(
      '24000000-0000-4000-8000-000000000520',
      '24000000-0000-4000-8000-000000000521',
      '24000000-0000-4000-8000-000000000905',
      '24000000-0000-4000-8000-000000000804',
      '24000000-0000-4000-8000-000000000301',
      '24000000-0000-4000-8000-000000000901',
      '24000000-0000-4000-8000-000000000902',
      '24000000-0000-4000-8000-000000000903',
      'أول مخرج X009C',
      null,
      'post',
      'normal',
      null,
      '{}'::uuid[],
      null,
      null,
      null,
      null,
      true,
      true,
      1,
      'x009c-onboarding-deliverable'
    )
  ),
  '24000000-0000-4000-8000-000000000520',
  'onboarding step 4: deliverable reservation created via RPC'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'DeliverableCreated'
      and target_id = '24000000-0000-4000-8000-000000000520'
  ),
  1,
  'onboarding step 4: DeliverableCreated audit event recorded'
);

select is(
  (
    select count(*)::integer
    from public.deliverable_allocations
    where deliverable_id = '24000000-0000-4000-8000-000000000520'
      and status = 'reserved'
  ),
  1,
  'onboarding step 4: allocation reserved'
);

-- IDEMPOTENT REPLAY: same idempotency keys return existing rows without duplicates.
select is(
  (
    select id::text
    from public.f002_create_contract_context(
      '24000000-0000-4000-8000-000000000999',
      '24000000-0000-4000-8000-000000000999',
      '24000000-0000-4000-8000-000000000301',
      'عقد مكرر',
      null,
      null,
      null,
      null,
      'active',
      'x009c-onboarding-contract'
    )
  ),
  '24000000-0000-4000-8000-000000000901',
  'onboarding replay: contract RPC returns original contract for same idempotency key'
);

select is(
  (
    select count(*)::integer
    from public.contracts
    where idempotency_key = 'x009c-onboarding-contract'
  ),
  1,
  'onboarding replay: no duplicate contracts'
);

select is(
  (
    select count(*)::integer
    from public.deliverables
    where idempotency_key = 'x009c-onboarding-deliverable'
  ),
  1,
  'onboarding replay: no duplicate deliverables'
);

select is(
  (
    select count(*)::integer
    from public.package_ledger_entries
    where deliverable_id = '24000000-0000-4000-8000-000000000520'
      and entry_type = 'quantity_reserved'
  ),
  1,
  'onboarding replay: no duplicate reservation ledger entries'
);

-- UNAUTHORIZED ROLE: account_manager cannot create a client (no CLIENT_CREATE permission).
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '24000000-0000-4000-8000-000000000202', true);

select throws_ok(
  $$
    select *
    from public.f001_create_client_write(
      '24000000-0000-4000-8000-000000000399',
      '24000000-0000-4000-8000-000000000899',
      'عميل مرفوض',
      'x009c-denied-client',
      null,
      null
    )
  $$,
  '42501',
  'not authorized',
  'account_manager cannot create a client through the onboarding RPC path'
);

reset role;

select * from finish();
rollback;
