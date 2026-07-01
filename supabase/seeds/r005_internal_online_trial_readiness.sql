-- R-005 Internal Online Trial Readiness synthetic seed.
-- Hosted staging only: sharik-internal-trial-staging.
-- Non-production only. No real client data. No Production Supabase.
-- This seed creates no temporary password values or password hashes.

begin;

do $$
declare
  r005_tenant_id constant uuid := 'a0000000-0000-4000-8000-000000000001';
begin
  if exists (
    select 1
    from public.clients c
    where c.tenant_id <> r005_tenant_id
       or c.slug not in ('r005-client-alpha', 'r005-client-beta')
  ) then
    raise exception 'R-005 seed refused: target contains client data outside the approved synthetic R-005 fixture set'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from auth.users u
    where u.email is not null
      and u.email not like '%@r005.example.test'
  ) then
    raise exception 'R-005 seed refused: target contains auth users outside the approved synthetic R-005 fixture set'
      using errcode = '42501';
  end if;
end;
$$;

with seed_users (id, email, display_name, role_key) as (
  values
    (
      'a1000000-0000-4000-8000-000000000101'::uuid,
      'tenant-admin@r005.example.test',
      'R-005 Tenant Admin',
      'tenant_administrator'
    ),
    (
      'a1000000-0000-4000-8000-000000000102'::uuid,
      'account-manager@r005.example.test',
      'R-005 Account Manager',
      'account_manager'
    ),
    (
      'a1000000-0000-4000-8000-000000000103'::uuid,
      'client-viewer@r005.example.test',
      'R-005 Client Viewer',
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
    'fixture', 'r005-internal-online-trial-readiness'
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
  encrypted_password = null,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  updated_at = now();

with seed_identities (id, user_id, email, display_name, role_key) as (
  values
    (
      'a1100000-0000-4000-8000-000000000101'::uuid,
      'a1000000-0000-4000-8000-000000000101'::uuid,
      'tenant-admin@r005.example.test',
      'R-005 Tenant Admin',
      'tenant_administrator'
    ),
    (
      'a1100000-0000-4000-8000-000000000102'::uuid,
      'a1000000-0000-4000-8000-000000000102'::uuid,
      'account-manager@r005.example.test',
      'R-005 Account Manager',
      'account_manager'
    ),
    (
      'a1100000-0000-4000-8000-000000000103'::uuid,
      'a1000000-0000-4000-8000-000000000103'::uuid,
      'client-viewer@r005.example.test',
      'R-005 Client Viewer',
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
values ('a0000000-0000-4000-8000-000000000001', 'Samawah Demo', 'active')
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
    'a2000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'R-005 Client Alpha',
    'r005-client-alpha',
    'active',
    'R-005 Alpha Contact',
    'alpha-contact@r005.example.test',
    'a1000000-0000-4000-8000-000000000101',
    now(),
    1
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'R-005 Client Beta',
    'r005-client-beta',
    'active',
    'R-005 Beta Contact',
    'beta-contact@r005.example.test',
    'a1000000-0000-4000-8000-000000000101',
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
    'a1200000-0000-4000-8000-000000000101',
    'a0000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000101',
    'active',
    null
  ),
  (
    'a1200000-0000-4000-8000-000000000102',
    'a0000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000102',
    'active',
    null
  ),
  (
    'a1200000-0000-4000-8000-000000000103',
    'a0000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000103',
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
    'a1300000-0000-4000-8000-000000000103',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000103',
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
    'a1400000-0000-4000-8000-000000000101',
    'a0000000-0000-4000-8000-000000000001',
    'a1200000-0000-4000-8000-000000000101',
    'tenant_administrator',
    'tenant',
    'a0000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    'a1400000-0000-4000-8000-000000000102',
    'a0000000-0000-4000-8000-000000000001',
    'a1200000-0000-4000-8000-000000000102',
    'account_manager',
    'client',
    'a2000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    'a1400000-0000-4000-8000-000000000103',
    'a0000000-0000-4000-8000-000000000001',
    'a1200000-0000-4000-8000-000000000103',
    'client_viewer',
    'client',
    'a2000000-0000-4000-8000-000000000001',
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
    'a3000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000001',
    'R-005 Alpha Contract',
    'R005-ALPHA-CONTRACT',
    'Synthetic R-005 internal online trial contract for Client Alpha.',
    current_date - 10,
    current_date + 50,
    'active',
    'r005-alpha-contract',
    'a1000000-0000-4000-8000-000000000101',
    now()
  ),
  (
    'a3000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'R-005 Beta Contract',
    'R005-BETA-CONTRACT',
    'Synthetic R-005 internal online trial contract for Client Beta.',
    current_date - 10,
    current_date + 50,
    'active',
    'r005-beta-contract',
    'a1000000-0000-4000-8000-000000000101',
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
    'a4000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'R-005 Alpha Package',
    current_date - 10,
    current_date + 50,
    'active',
    'r005-alpha-package',
    'a1000000-0000-4000-8000-000000000101',
    now()
  ),
  (
    'a4000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'a3000000-0000-4000-8000-000000000002',
    'R-005 Beta Package',
    current_date - 10,
    current_date + 50,
    'active',
    'r005-beta-package',
    'a1000000-0000-4000-8000-000000000101',
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
    'a4100000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000001',
    'R-005 synthetic deliverables',
    'post',
    'deliverable',
    12,
    'active',
    'a1000000-0000-4000-8000-000000000101',
    now()
  ),
  (
    'a4100000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'a4000000-0000-4000-8000-000000000002',
    'R-005 synthetic negative-control deliverables',
    'post',
    'deliverable',
    6,
    'active',
    'a1000000-0000-4000-8000-000000000101',
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
    'a5000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'a4000000-0000-4000-8000-000000000001',
    'a4100000-0000-4000-8000-000000000001',
    'commitment_added',
    12,
    'a1000000-0000-4000-8000-000000000101',
    'r005-alpha-commitment'
  ),
  (
    'a5000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'a3000000-0000-4000-8000-000000000002',
    'a4000000-0000-4000-8000-000000000002',
    'a4100000-0000-4000-8000-000000000002',
    'commitment_added',
    6,
    'a1000000-0000-4000-8000-000000000101',
    'r005-beta-commitment'
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
  idempotency_key
) as (
  values
    (
      'a6000000-0000-4000-8000-000000000001'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha Not Started',
      'Synthetic not-started item used for an allowed move to in_progress and denied move to waiting_client_approval.',
      'post',
      'not_started',
      'normal',
      current_date,
      current_date + 6,
      current_date + 8,
      current_date + 10,
      0,
      'r005-alpha-not-started'
    ),
    (
      'a6000000-0000-4000-8000-000000000002'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha In Progress',
      'Synthetic on-track active item for the board and SLA display.',
      'post',
      'in_progress',
      'normal',
      current_date - 1,
      current_date + 7,
      current_date + 9,
      current_date + 12,
      30,
      'r005-alpha-in-progress'
    ),
    (
      'a6000000-0000-4000-8000-000000000003'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha Ready For Internal Review',
      'Synthetic review item with near due date for at-risk SLA display.',
      'post',
      'ready_for_internal_review',
      'high',
      current_date - 3,
      current_date,
      current_date + 2,
      current_date + 5,
      50,
      'r005-alpha-ready-internal-review'
    ),
    (
      'a6000000-0000-4000-8000-000000000004'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha Internally Approved',
      'Synthetic item ready for allowed transition to waiting_client_approval.',
      'design',
      'internally_approved',
      'high',
      current_date - 4,
      current_date - 1,
      current_date + 2,
      current_date + 5,
      70,
      'r005-alpha-internally-approved'
    ),
    (
      'a6000000-0000-4000-8000-000000000005'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha Waiting Client Approval',
      'Synthetic paused-waiting-client SLA display case.',
      'post',
      'waiting_client_approval',
      'urgent',
      current_date - 6,
      current_date - 2,
      current_date + 2,
      current_date + 4,
      80,
      'r005-alpha-waiting-client'
    ),
    (
      'a6000000-0000-4000-8000-000000000006'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha Client Approved',
      'Synthetic item ready for allowed delivery transition.',
      'story',
      'client_approved',
      'normal',
      current_date - 8,
      current_date - 5,
      current_date - 2,
      current_date + 1,
      90,
      'r005-alpha-client-approved'
    ),
    (
      'a6000000-0000-4000-8000-000000000007'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'R-005 Alpha Delivered',
      'Synthetic completed SLA display case.',
      'report',
      'delivered',
      'normal',
      current_date - 14,
      current_date - 10,
      current_date - 8,
      current_date - 6,
      100,
      'r005-alpha-delivered'
    ),
    (
      'a6000000-0000-4000-8000-000000000101'::uuid,
      'a2000000-0000-4000-8000-000000000002'::uuid,
      'a3000000-0000-4000-8000-000000000002'::uuid,
      'a4000000-0000-4000-8000-000000000002'::uuid,
      'a4100000-0000-4000-8000-000000000002'::uuid,
      'R-005 Beta Negative Control',
      'Synthetic Client Beta record used for cross-client and tenant-admin visibility checks.',
      'post',
      'in_progress',
      'low',
      current_date - 1,
      current_date + 6,
      current_date + 8,
      current_date + 10,
      30,
      'r005-beta-negative-control'
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
  updated_at
)
select
  id,
  'a0000000-0000-4000-8000-000000000001'::uuid,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  name,
  description,
  type,
  status,
  priority,
  'a1000000-0000-4000-8000-000000000102'::uuid,
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
  'a1000000-0000-4000-8000-000000000101'::uuid,
  now()
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
  updated_at = now();

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
      'a5100000-0000-4000-8000-000000000001'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000001'::uuid,
      'r005-alpha-not-started-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000002'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000002'::uuid,
      'r005-alpha-in-progress-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000003'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000003'::uuid,
      'r005-alpha-ready-internal-review-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000004'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000004'::uuid,
      'r005-alpha-internally-approved-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000005'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000005'::uuid,
      'r005-alpha-waiting-client-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000006'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000006'::uuid,
      'r005-alpha-client-approved-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000007'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a3000000-0000-4000-8000-000000000001'::uuid,
      'a4000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000007'::uuid,
      'r005-alpha-delivered-reservation'
    ),
    (
      'a5100000-0000-4000-8000-000000000101'::uuid,
      'a2000000-0000-4000-8000-000000000002'::uuid,
      'a3000000-0000-4000-8000-000000000002'::uuid,
      'a4000000-0000-4000-8000-000000000002'::uuid,
      'a4100000-0000-4000-8000-000000000002'::uuid,
      'a6000000-0000-4000-8000-000000000101'::uuid,
      'r005-beta-negative-control-reservation'
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
  'a0000000-0000-4000-8000-000000000001'::uuid,
  client_id,
  contract_id,
  package_id,
  package_line_id,
  deliverable_id,
  'quantity_reserved',
  1,
  'a1000000-0000-4000-8000-000000000101'::uuid,
  idempotency_key
from reservation_entries
on conflict do nothing;

with allocations (id, client_id, deliverable_id, package_line_id, ledger_entry_id) as (
  values
    (
      'a7000000-0000-4000-8000-000000000001'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000001'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000001'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000002'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000002'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000002'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000003'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000003'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000003'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000004'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000004'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000004'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000005'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000005'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000005'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000006'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000006'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000006'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000007'::uuid,
      'a2000000-0000-4000-8000-000000000001'::uuid,
      'a6000000-0000-4000-8000-000000000007'::uuid,
      'a4100000-0000-4000-8000-000000000001'::uuid,
      'a5100000-0000-4000-8000-000000000007'::uuid
    ),
    (
      'a7000000-0000-4000-8000-000000000101'::uuid,
      'a2000000-0000-4000-8000-000000000002'::uuid,
      'a6000000-0000-4000-8000-000000000101'::uuid,
      'a4100000-0000-4000-8000-000000000002'::uuid,
      'a5100000-0000-4000-8000-000000000101'::uuid
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
  'a0000000-0000-4000-8000-000000000001'::uuid,
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
    'a8000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    null,
    'a1000000-0000-4000-8000-000000000101',
    'R005SyntheticSeedLoaded',
    'allowed',
    'uat_seed',
    'r005-internal-online-trial-readiness',
    'Synthetic data only for hosted staging sharik-internal-trial-staging'
  )
on conflict (id) do nothing;

do $$
declare
  r005_client_count integer;
  r005_contract_count integer;
  r005_package_count integer;
  r005_deliverable_count integer;
  non_synthetic_email_count integer;
begin
  select count(*) into r005_client_count
  from public.clients
  where tenant_id = 'a0000000-0000-4000-8000-000000000001';

  select count(*) into r005_contract_count
  from public.contracts
  where tenant_id = 'a0000000-0000-4000-8000-000000000001';

  select count(*) into r005_package_count
  from public.packages
  where tenant_id = 'a0000000-0000-4000-8000-000000000001';

  select count(*) into r005_deliverable_count
  from public.deliverables
  where tenant_id = 'a0000000-0000-4000-8000-000000000001';

  select count(*) into non_synthetic_email_count
  from auth.users
  where email is not null
    and email not like '%@r005.example.test';

  if r005_client_count <> 2
      or r005_contract_count <> 2
      or r005_package_count <> 2
      or r005_deliverable_count <> 8
      or non_synthetic_email_count > 0 then
    raise exception 'R-005 seed validation failed'
      using errcode = 'P0001';
  end if;
end;
$$;

commit;
