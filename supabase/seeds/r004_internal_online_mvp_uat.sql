-- R-004 Internal Online MVP UAT synthetic seed.
-- Non-production only. No real client data. No Production project.
-- Execute only after the hosted non-production target is explicitly approved
-- and verified as empty of real client/user data.

begin;

do $$
declare
  r004_tenant_id constant uuid := '90000000-0000-4000-8000-000000000001';
begin
  if exists (
    select 1
    from public.clients c
    where c.tenant_id <> r004_tenant_id
       or c.slug not in ('r004-client-alpha', 'r004-client-beta')
  ) then
    raise exception 'R-004 seed refused: target contains client data outside the approved synthetic R-004 fixture set'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from auth.users u
    where u.email is not null
      and u.email not like '%@r004.example.test'
  ) then
    raise exception 'R-004 seed refused: target contains auth users outside the approved synthetic R-004 fixture set'
      using errcode = '42501';
  end if;
end;
$$;

with seed_users (id, email, display_name, role_key) as (
  values
    (
      '90000000-0000-4000-8000-000000000101'::uuid,
      'tenant-admin@r004.example.test',
      'R-004 Tenant Administrator UAT',
      'tenant_administrator'
    ),
    (
      '90000000-0000-4000-8000-000000000102'::uuid,
      'account-manager-alpha@r004.example.test',
      'R-004 Account Manager Alpha UAT',
      'account_manager'
    ),
    (
      '90000000-0000-4000-8000-000000000103'::uuid,
      'client-approver-alpha@r004.example.test',
      'R-004 Client Approver Alpha UAT',
      'client_approver'
    ),
    (
      '90000000-0000-4000-8000-000000000104'::uuid,
      'client-viewer-beta@r004.example.test',
      'R-004 Client Viewer Beta UAT',
      'client_viewer'
    ),
    (
      '90000000-0000-4000-8000-000000000105'::uuid,
      'client-viewer-alpha@r004.example.test',
      'R-004 Client Viewer Alpha UAT',
      'client_viewer'
    )
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  reauthentication_token,
  phone_change,
  phone_change_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  null,
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'display_name', display_name,
    'role_key', role_key,
    'fixture', 'r004-internal-online-mvp-uat'
  ),
  false,
  false,
  false,
  now(),
  now()
from seed_users
on conflict (id) do update
set
  email = excluded.email,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  updated_at = now();

with seed_identities (id, user_id, email, display_name, role_key) as (
  values
    (
      '90100000-0000-4000-8000-000000000101'::uuid,
      '90000000-0000-4000-8000-000000000101'::uuid,
      'tenant-admin@r004.example.test',
      'R-004 Tenant Administrator UAT',
      'tenant_administrator'
    ),
    (
      '90100000-0000-4000-8000-000000000102'::uuid,
      '90000000-0000-4000-8000-000000000102'::uuid,
      'account-manager-alpha@r004.example.test',
      'R-004 Account Manager Alpha UAT',
      'account_manager'
    ),
    (
      '90100000-0000-4000-8000-000000000103'::uuid,
      '90000000-0000-4000-8000-000000000103'::uuid,
      'client-approver-alpha@r004.example.test',
      'R-004 Client Approver Alpha UAT',
      'client_approver'
    ),
    (
      '90100000-0000-4000-8000-000000000104'::uuid,
      '90000000-0000-4000-8000-000000000104'::uuid,
      'client-viewer-beta@r004.example.test',
      'R-004 Client Viewer Beta UAT',
      'client_viewer'
    ),
    (
      '90100000-0000-4000-8000-000000000105'::uuid,
      '90000000-0000-4000-8000-000000000105'::uuid,
      'client-viewer-alpha@r004.example.test',
      'R-004 Client Viewer Alpha UAT',
      'client_viewer'
    )
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
select
  id,
  user_id::text,
  user_id,
  jsonb_build_object(
    'sub', user_id::text,
    'email', email,
    'email_verified', true,
    'display_name', display_name,
    'role_key', role_key
  ),
  'email',
  now(),
  now()
from seed_identities
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.tenants (id, name, status)
values ('90000000-0000-4000-8000-000000000001', 'Samawah UAT', 'active')
on conflict (id) do update
set
  name = excluded.name,
  status = excluded.status;

insert into public.clients (
  id,
  tenant_id,
  name,
  slug,
  status,
  primary_contact_name,
  primary_contact_email,
  created_by,
  updated_at,
  revision
)
values
  (
    '91000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    'Client Alpha UAT',
    'r004-client-alpha',
    'active',
    'Alpha Synthetic Contact',
    'alpha-contact@r004.example.test',
    '90000000-0000-4000-8000-000000000101',
    now(),
    1
  ),
  (
    '91000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001',
    'Client Beta UAT',
    'r004-client-beta',
    'active',
    'Beta Synthetic Contact',
    'beta-contact@r004.example.test',
    '90000000-0000-4000-8000-000000000101',
    now(),
    1
  )
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  primary_contact_name = excluded.primary_contact_name,
  primary_contact_email = excluded.primary_contact_email,
  updated_at = now();

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status, disabled_at)
values
  (
    '90200000-0000-4000-8000-000000000101',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000101',
    'active',
    null
  ),
  (
    '90200000-0000-4000-8000-000000000102',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000102',
    'active',
    null
  ),
  (
    '90200000-0000-4000-8000-000000000103',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000103',
    'active',
    null
  ),
  (
    '90200000-0000-4000-8000-000000000104',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000104',
    'active',
    null
  ),
  (
    '90200000-0000-4000-8000-000000000105',
    '90000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000105',
    'active',
    null
  )
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  auth_user_id = excluded.auth_user_id,
  status = excluded.status,
  disabled_at = excluded.disabled_at;

insert into public.client_memberships (
  id,
  tenant_id,
  client_id,
  auth_user_id,
  status,
  disabled_at
)
values
  (
    '90300000-0000-4000-8000-000000000103',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000103',
    'active',
    null
  ),
  (
    '90300000-0000-4000-8000-000000000104',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000104',
    'active',
    null
  ),
  (
    '90300000-0000-4000-8000-000000000105',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000105',
    'active',
    null
  )
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  client_id = excluded.client_id,
  auth_user_id = excluded.auth_user_id,
  status = excluded.status,
  disabled_at = excluded.disabled_at;

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
    '90400000-0000-4000-8000-000000000101',
    '90000000-0000-4000-8000-000000000001',
    '90200000-0000-4000-8000-000000000101',
    'tenant_administrator',
    'tenant',
    '90000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    '90400000-0000-4000-8000-000000000102',
    '90000000-0000-4000-8000-000000000001',
    '90200000-0000-4000-8000-000000000102',
    'account_manager',
    'client',
    '91000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    '90400000-0000-4000-8000-000000000103',
    '90000000-0000-4000-8000-000000000001',
    '90200000-0000-4000-8000-000000000103',
    'client_approver',
    'client',
    '91000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    '90400000-0000-4000-8000-000000000104',
    '90000000-0000-4000-8000-000000000001',
    '90200000-0000-4000-8000-000000000104',
    'client_viewer',
    'client',
    '91000000-0000-4000-8000-000000000002',
    'active'
  ),
  (
    '90400000-0000-4000-8000-000000000105',
    '90000000-0000-4000-8000-000000000001',
    '90200000-0000-4000-8000-000000000105',
    'client_viewer',
    'client',
    '91000000-0000-4000-8000-000000000001',
    'active'
  )
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  membership_id = excluded.membership_id,
  role_key = excluded.role_key,
  scope_type = excluded.scope_type,
  scope_id = excluded.scope_id,
  status = excluded.status;

insert into public.contracts (
  id,
  tenant_id,
  client_id,
  name,
  reference,
  summary,
  period_start,
  period_end,
  status,
  idempotency_key,
  created_by,
  updated_at
)
values
  (
    '92000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    'Client Alpha UAT Contract',
    'R004-ALPHA-CONTRACT',
    'Synthetic R-004 contract for internal online MVP UAT.',
    current_date - 15,
    current_date + 45,
    'active',
    'r004-alpha-contract',
    '90000000-0000-4000-8000-000000000101',
    now()
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    'Client Beta UAT Contract',
    'R004-BETA-CONTRACT',
    'Synthetic negative-control R-004 contract for isolation checks.',
    current_date - 15,
    current_date + 45,
    'active',
    'r004-beta-contract',
    '90000000-0000-4000-8000-000000000101',
    now()
  )
on conflict (id) do update
set
  name = excluded.name,
  reference = excluded.reference,
  summary = excluded.summary,
  period_start = excluded.period_start,
  period_end = excluded.period_end,
  status = excluded.status,
  idempotency_key = excluded.idempotency_key,
  updated_at = now();

insert into public.packages (
  id,
  tenant_id,
  client_id,
  contract_id,
  name,
  period_start,
  period_end,
  status,
  idempotency_key,
  created_by,
  updated_at
)
values
  (
    '93000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000001',
    'Client Alpha UAT Package',
    current_date - 15,
    current_date + 45,
    'active',
    'r004-alpha-package',
    '90000000-0000-4000-8000-000000000101',
    now()
  ),
  (
    '93000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    '92000000-0000-4000-8000-000000000002',
    'Client Beta UAT Package',
    current_date - 15,
    current_date + 45,
    'active',
    'r004-beta-package',
    '90000000-0000-4000-8000-000000000101',
    now()
  )
on conflict (id) do update
set
  name = excluded.name,
  period_start = excluded.period_start,
  period_end = excluded.period_end,
  status = excluded.status,
  idempotency_key = excluded.idempotency_key,
  updated_at = now();

insert into public.package_lines (
  id,
  tenant_id,
  client_id,
  package_id,
  service_label,
  deliverable_type_hint,
  unit_label,
  committed_quantity,
  status,
  created_by,
  updated_at
)
values
  (
    '94000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '93000000-0000-4000-8000-000000000001',
    'Synthetic social deliverables',
    'post',
    'deliverable',
    12,
    'active',
    '90000000-0000-4000-8000-000000000101',
    now()
  ),
  (
    '94000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    '93000000-0000-4000-8000-000000000002',
    'Synthetic negative-control deliverables',
    'post',
    'deliverable',
    4,
    'active',
    '90000000-0000-4000-8000-000000000101',
    now()
  )
on conflict (id) do update
set
  service_label = excluded.service_label,
  deliverable_type_hint = excluded.deliverable_type_hint,
  unit_label = excluded.unit_label,
  committed_quantity = excluded.committed_quantity,
  status = excluded.status,
  updated_at = now();

insert into public.package_ledger_entries (
  id,
  tenant_id,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  entry_type,
  quantity,
  actor_user_id,
  idempotency_key
)
values
  (
    '95000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '92000000-0000-4000-8000-000000000001',
    '93000000-0000-4000-8000-000000000001',
    '94000000-0000-4000-8000-000000000001',
    'commitment_added',
    12,
    '90000000-0000-4000-8000-000000000101',
    'r004-alpha-commitment'
  ),
  (
    '95000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000002',
    '92000000-0000-4000-8000-000000000002',
    '93000000-0000-4000-8000-000000000002',
    '94000000-0000-4000-8000-000000000002',
    'commitment_added',
    4,
    '90000000-0000-4000-8000-000000000101',
    'r004-beta-commitment'
  )
on conflict do nothing;

with seed_deliverables (
  id,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  name,
  description,
  type,
  status,
  priority,
  start_date,
  internal_due_date,
  client_due_date,
  final_due_date,
  progress_percentage,
  cancelled_at,
  idempotency_key
) as (
  values
    (
      '96000000-0000-4000-8000-000000000001'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      'Alpha UAT On Track Deliverable',
      'Synthetic on-track deliverable with internal due date outside the 24h risk window.',
      'post',
      'in_progress',
      'normal',
      current_date - 1,
      current_date + 7,
      current_date + 9,
      current_date + 12,
      30,
      null::timestamptz,
      'r004-alpha-on-track'
    ),
    (
      '96000000-0000-4000-8000-000000000002'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      'Alpha UAT At Risk Deliverable',
      'Synthetic at-risk deliverable with date-only due date ending today UTC.',
      'post',
      'in_progress',
      'high',
      current_date - 2,
      current_date,
      current_date + 2,
      current_date + 5,
      30,
      null::timestamptz,
      'r004-alpha-at-risk'
    ),
    (
      '96000000-0000-4000-8000-000000000003'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      'Alpha UAT Overdue Deliverable',
      'Synthetic overdue deliverable with internal due date already past.',
      'post',
      'in_progress',
      'urgent',
      current_date - 5,
      current_date - 2,
      current_date + 1,
      current_date + 3,
      30,
      null::timestamptz,
      'r004-alpha-overdue'
    ),
    (
      '96000000-0000-4000-8000-000000000004'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      'Alpha UAT Waiting Client Approval Deliverable',
      'Synthetic paused-waiting-client case; current F-003 derives paused_waiting_client from waiting_client_approval.',
      'post',
      'waiting_client_approval',
      'high',
      current_date - 6,
      current_date - 1,
      current_date + 2,
      current_date + 4,
      80,
      null::timestamptz,
      'r004-alpha-waiting-client'
    ),
    (
      '96000000-0000-4000-8000-000000000005'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      'Alpha UAT Delivered Deliverable',
      'Synthetic completed SLA case.',
      'report',
      'delivered',
      'normal',
      current_date - 12,
      current_date - 8,
      current_date - 5,
      current_date - 2,
      100,
      null::timestamptz,
      'r004-alpha-delivered'
    ),
    (
      '96000000-0000-4000-8000-000000000006'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      'Alpha UAT Cancelled Deliverable',
      'Synthetic cancelled SLA case.',
      'story',
      'cancelled',
      'low',
      current_date - 10,
      current_date - 7,
      current_date - 5,
      current_date - 3,
      0,
      now(),
      'r004-alpha-cancelled'
    ),
    (
      '96000000-0000-4000-8000-000000000101'::uuid,
      '91000000-0000-4000-8000-000000000002'::uuid,
      '92000000-0000-4000-8000-000000000002'::uuid,
      '93000000-0000-4000-8000-000000000002'::uuid,
      '94000000-0000-4000-8000-000000000002'::uuid,
      'Beta UAT Negative Control Deliverable',
      'Synthetic Client Beta record used only for cross-client denial checks.',
      'post',
      'in_progress',
      'normal',
      current_date - 1,
      current_date + 6,
      current_date + 8,
      current_date + 10,
      30,
      null::timestamptz,
      'r004-beta-negative-control'
    )
)
insert into public.deliverables (
  id,
  tenant_id,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  name,
  description,
  type,
  status,
  priority,
  owner_user_id,
  contributor_user_ids,
  start_date,
  internal_due_date,
  client_due_date,
  final_due_date,
  requires_internal_approval,
  requires_client_approval,
  progress_percentage,
  approved_extra,
  extra_reason,
  idempotency_key,
  created_by,
  updated_at,
  cancelled_at
)
select
  id,
  '90000000-0000-4000-8000-000000000001'::uuid,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  name,
  description,
  type,
  status,
  priority,
  '90000000-0000-4000-8000-000000000102'::uuid,
  '{}'::uuid[],
  start_date,
  internal_due_date,
  client_due_date,
  final_due_date,
  true,
  true,
  progress_percentage,
  false,
  null,
  idempotency_key,
  '90000000-0000-4000-8000-000000000101'::uuid,
  now(),
  cancelled_at
from seed_deliverables
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  type = excluded.type,
  status = excluded.status,
  priority = excluded.priority,
  owner_user_id = excluded.owner_user_id,
  start_date = excluded.start_date,
  internal_due_date = excluded.internal_due_date,
  client_due_date = excluded.client_due_date,
  final_due_date = excluded.final_due_date,
  progress_percentage = excluded.progress_percentage,
  idempotency_key = excluded.idempotency_key,
  updated_at = now(),
  cancelled_at = excluded.cancelled_at;

with reservation_entries (
  id,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  deliverable_id,
  idempotency_key
) as (
  values
    (
      '95100000-0000-4000-8000-000000000001'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000001'::uuid,
      'r004-alpha-on-track-reservation'
    ),
    (
      '95100000-0000-4000-8000-000000000002'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000002'::uuid,
      'r004-alpha-at-risk-reservation'
    ),
    (
      '95100000-0000-4000-8000-000000000003'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000003'::uuid,
      'r004-alpha-overdue-reservation'
    ),
    (
      '95100000-0000-4000-8000-000000000004'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000004'::uuid,
      'r004-alpha-waiting-client-reservation'
    ),
    (
      '95100000-0000-4000-8000-000000000005'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000005'::uuid,
      'r004-alpha-delivered-reservation'
    ),
    (
      '95100000-0000-4000-8000-000000000006'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '92000000-0000-4000-8000-000000000001'::uuid,
      '93000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000006'::uuid,
      'r004-alpha-cancelled-reservation'
    ),
    (
      '95100000-0000-4000-8000-000000000101'::uuid,
      '91000000-0000-4000-8000-000000000002'::uuid,
      '92000000-0000-4000-8000-000000000002'::uuid,
      '93000000-0000-4000-8000-000000000002'::uuid,
      '94000000-0000-4000-8000-000000000002'::uuid,
      '96000000-0000-4000-8000-000000000101'::uuid,
      'r004-beta-negative-control-reservation'
    )
)
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
select
  id,
  '90000000-0000-4000-8000-000000000001'::uuid,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  deliverable_id,
  'quantity_reserved',
  1,
  '90000000-0000-4000-8000-000000000101'::uuid,
  idempotency_key
from reservation_entries
on conflict do nothing;

with allocations (id, client_id, deliverable_id, package_line_id, ledger_entry_id) as (
  values
    (
      '97000000-0000-4000-8000-000000000001'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000001'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '95100000-0000-4000-8000-000000000001'::uuid
    ),
    (
      '97000000-0000-4000-8000-000000000002'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000002'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '95100000-0000-4000-8000-000000000002'::uuid
    ),
    (
      '97000000-0000-4000-8000-000000000003'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000003'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '95100000-0000-4000-8000-000000000003'::uuid
    ),
    (
      '97000000-0000-4000-8000-000000000004'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000004'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '95100000-0000-4000-8000-000000000004'::uuid
    ),
    (
      '97000000-0000-4000-8000-000000000005'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000005'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '95100000-0000-4000-8000-000000000005'::uuid
    ),
    (
      '97000000-0000-4000-8000-000000000006'::uuid,
      '91000000-0000-4000-8000-000000000001'::uuid,
      '96000000-0000-4000-8000-000000000006'::uuid,
      '94000000-0000-4000-8000-000000000001'::uuid,
      '95100000-0000-4000-8000-000000000006'::uuid
    ),
    (
      '97000000-0000-4000-8000-000000000101'::uuid,
      '91000000-0000-4000-8000-000000000002'::uuid,
      '96000000-0000-4000-8000-000000000101'::uuid,
      '94000000-0000-4000-8000-000000000002'::uuid,
      '95100000-0000-4000-8000-000000000101'::uuid
    )
)
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
select
  id,
  '90000000-0000-4000-8000-000000000001'::uuid,
  client_id,
  deliverable_id,
  package_line_id,
  1,
  'reserved',
  ledger_entry_id
from allocations
on conflict (id) do update
set
  client_id = excluded.client_id,
  deliverable_id = excluded.deliverable_id,
  package_line_id = excluded.package_line_id,
  reserved_quantity = excluded.reserved_quantity,
  status = excluded.status,
  reservation_ledger_entry_id = excluded.reservation_ledger_entry_id;

insert into public.audit_events (
  id,
  tenant_id,
  client_id,
  actor_user_id,
  action,
  decision,
  target_type,
  target_id,
  reason
)
values
  (
    '98000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000001',
    null,
    '90000000-0000-4000-8000-000000000101',
    'R004SyntheticSeedLoaded',
    'allowed',
    'uat_seed',
    'r004-internal-online-mvp-uat',
    'Synthetic data only for protected non-production R-004 Internal Online MVP UAT'
  ),
  (
    '98000000-0000-4000-8000-000000000002',
    '90000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000101',
    'R004SeedLimitationRecorded',
    'allowed',
    'sla_case',
    'paused_waiting_internal_decision',
    'Current persisted MVP has no SLA segment table; internal-decision pause remains domain-test evidence only until a future approved schema change'
  )
on conflict (id) do nothing;

do $$
declare
  alpha_deliverables integer;
  beta_deliverables integer;
  non_synthetic_email_count integer;
begin
  select count(*) into alpha_deliverables
  from public.deliverables
  where tenant_id = '90000000-0000-4000-8000-000000000001'
    and client_id = '91000000-0000-4000-8000-000000000001';

  select count(*) into beta_deliverables
  from public.deliverables
  where tenant_id = '90000000-0000-4000-8000-000000000001'
    and client_id = '91000000-0000-4000-8000-000000000002';

  select count(*) into non_synthetic_email_count
  from auth.users
  where email is not null
    and email not like '%@r004.example.test';

  if alpha_deliverables < 6 or beta_deliverables < 1 or non_synthetic_email_count > 0 then
    raise exception 'R-004 seed validation failed'
      using errcode = 'P0001';
  end if;
end;
$$;

commit;
