-- F-001B read-only hosted UAT seed data.
-- Dummy data only: no production records, no real client contact data, and no
-- stored login passwords. Set UAT passwords out-of-band in Supabase Admin.

begin;

with seed_users (id, email, display_name, role_key) as (
  values
    (
      '30000000-0000-4000-8000-000000000002'::uuid,
      'tenant-admin@preview.example.test',
      'Tenant Administrator UAT',
      'tenant_administrator'
    ),
    (
      '30000000-0000-4000-8000-000000000003'::uuid,
      'account-manager@preview.example.test',
      'Account Manager UAT',
      'account_manager'
    ),
    (
      '30000000-0000-4000-8000-000000000008'::uuid,
      'client-viewer@preview.example.test',
      'Client Viewer UAT',
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
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'display_name', display_name,
    'fixture', 'f001b-uat'
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
      '31000000-0000-4000-8000-000000000002'::uuid,
      '30000000-0000-4000-8000-000000000002'::uuid,
      'tenant-admin@preview.example.test',
      'Tenant Administrator UAT',
      'tenant_administrator'
    ),
    (
      '31000000-0000-4000-8000-000000000003'::uuid,
      '30000000-0000-4000-8000-000000000003'::uuid,
      'account-manager@preview.example.test',
      'Account Manager UAT',
      'account_manager'
    ),
    (
      '31000000-0000-4000-8000-000000000008'::uuid,
      '30000000-0000-4000-8000-000000000008'::uuid,
      'client-viewer@preview.example.test',
      'Client Viewer UAT',
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
values (
  '10000000-0000-4000-8000-000000000001',
  'سماوة',
  'active'
)
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
  updated_at
)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'هدنة',
  'hudna',
  'active',
  null,
  null,
  '30000000-0000-4000-8000-000000000002',
  now()
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status,
  primary_contact_name = excluded.primary_contact_name,
  primary_contact_email = excluded.primary_contact_email,
  updated_at = now();

update public.clients
set
  status = 'archived',
  updated_at = now()
where
  tenant_id = '10000000-0000-4000-8000-000000000001'
  and id <> '20000000-0000-4000-8000-000000000001'
  and slug like 'demo-%';

insert into public.tenant_memberships (
  id,
  tenant_id,
  auth_user_id,
  status,
  disabled_at
)
values
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    'active',
    null
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    'active',
    null
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000008',
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
values (
  '50000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000008',
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
    '60000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    'tenant_administrator',
    'tenant',
    '10000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000003',
    'account_manager',
    'client',
    '20000000-0000-4000-8000-000000000001',
    'active'
  ),
  (
    '60000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000008',
    'client_viewer',
    'client',
    '20000000-0000-4000-8000-000000000001',
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

insert into public.permission_references (id, description, status)
values
  ('PERM.CLIENT.CREATE', 'Create a tenant-scoped client', 'active'),
  ('PERM.CLIENT.VIEW', 'View an authorized client scope', 'active'),
  ('PERM.CLIENT.VIEW_ALL_IN_TENANT', 'View all clients in a tenant management scope', 'active'),
  ('PERM.USR.VIEW', 'View tenant users, memberships, and invitations', 'active'),
  ('PERM.USR.INVITE', 'Invite internal or client users', 'active'),
  ('PERM.USR.INVITE_RESEND', 'Resend an invitation inside the original scope', 'active'),
  ('PERM.USR.ROLE_UPDATE', 'Assign or update role scope', 'active'),
  ('PERM.USR.SUSPEND', 'Disable or suspend membership access', 'active'),
  ('PERM.USR.RESPONSIBILITY_TRANSFER', 'Transfer responsibilities before disabling access', 'active'),
  ('PERM.AUDIT.USER_VIEW', 'Review internal user audit history', 'active'),
  ('PERM.AUDIT.CLIENT_VIEW', 'Review client-scope audit history', 'active')
on conflict (id) do update
set
  description = excluded.description,
  status = excluded.status;

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
values (
  '80000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  null,
  '30000000-0000-4000-8000-000000000002',
  'f001b_uat_seed_loaded',
  'allowed',
  'tenant',
  '10000000-0000-4000-8000-000000000001',
  'F-001B read-only UAT dummy seed data only'
)
on conflict (id) do nothing;

commit;
