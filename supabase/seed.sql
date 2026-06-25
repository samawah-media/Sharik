-- F-001 preview/staging seed data.
-- Dummy data only: no real customers, no production identifiers, and no stored
-- login passwords. Set preview passwords out-of-band before hosted smoke tests.

begin;

with seed_users (id, email, display_name, role_key) as (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, 'tenant-owner@preview.example.test', 'Tenant Owner Preview', 'tenant_owner'),
    ('30000000-0000-4000-8000-000000000002'::uuid, 'tenant-admin@preview.example.test', 'Tenant Administrator Preview', 'tenant_administrator'),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'account-manager@preview.example.test', 'Account Manager Preview', 'account_manager'),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'content-writer@preview.example.test', 'Content Writer Preview', 'content_writer'),
    ('30000000-0000-4000-8000-000000000005'::uuid, 'designer@preview.example.test', 'Designer Preview', 'designer'),
    ('30000000-0000-4000-8000-000000000006'::uuid, 'client-admin@preview.example.test', 'Client Admin Preview', 'client_admin'),
    ('30000000-0000-4000-8000-000000000007'::uuid, 'client-approver@preview.example.test', 'Client Approver Preview', 'client_approver'),
    ('30000000-0000-4000-8000-000000000008'::uuid, 'client-viewer@preview.example.test', 'Client Viewer Preview', 'client_viewer')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmed_at,
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
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'display_name', display_name,
    'role_key', role_key,
    'fixture', 'f001-preview'
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
  confirmed_at = coalesce(auth.users.confirmed_at, excluded.confirmed_at),
  updated_at = now();

with seed_identities (id, user_id, email, display_name, role_key) as (
  values
    ('31000000-0000-4000-8000-000000000001'::uuid, '30000000-0000-4000-8000-000000000001'::uuid, 'tenant-owner@preview.example.test', 'Tenant Owner Preview', 'tenant_owner'),
    ('31000000-0000-4000-8000-000000000002'::uuid, '30000000-0000-4000-8000-000000000002'::uuid, 'tenant-admin@preview.example.test', 'Tenant Administrator Preview', 'tenant_administrator'),
    ('31000000-0000-4000-8000-000000000003'::uuid, '30000000-0000-4000-8000-000000000003'::uuid, 'account-manager@preview.example.test', 'Account Manager Preview', 'account_manager'),
    ('31000000-0000-4000-8000-000000000004'::uuid, '30000000-0000-4000-8000-000000000004'::uuid, 'content-writer@preview.example.test', 'Content Writer Preview', 'content_writer'),
    ('31000000-0000-4000-8000-000000000005'::uuid, '30000000-0000-4000-8000-000000000005'::uuid, 'designer@preview.example.test', 'Designer Preview', 'designer'),
    ('31000000-0000-4000-8000-000000000006'::uuid, '30000000-0000-4000-8000-000000000006'::uuid, 'client-admin@preview.example.test', 'Client Admin Preview', 'client_admin'),
    ('31000000-0000-4000-8000-000000000007'::uuid, '30000000-0000-4000-8000-000000000007'::uuid, 'client-approver@preview.example.test', 'Client Approver Preview', 'client_approver'),
    ('31000000-0000-4000-8000-000000000008'::uuid, '30000000-0000-4000-8000-000000000008'::uuid, 'client-viewer@preview.example.test', 'Client Viewer Preview', 'client_viewer')
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  email,
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
  email,
  now(),
  now()
from seed_identities
on conflict (provider_id, provider) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  email = excluded.email,
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
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'عميل تجريبي ألف',
    'demo-alpha',
    'active',
    'Preview Contact Alpha',
    'contact-alpha@preview.example.test',
    '30000000-0000-4000-8000-000000000001',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'عميل تجريبي باء',
    'demo-beta',
    'active',
    'Preview Contact Beta',
    'contact-beta@preview.example.test',
    '30000000-0000-4000-8000-000000000001',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'عميل تجريبي جيم',
    'demo-gamma',
    'active',
    'Preview Contact Gamma',
    'contact-gamma@preview.example.test',
    '30000000-0000-4000-8000-000000000001',
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

insert into public.tenant_memberships (
  id,
  tenant_id,
  auth_user_id,
  status
)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'active'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'active'),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'active'),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', 'active'),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 'active'),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000006', 'active'),
  ('40000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000007', 'active'),
  ('40000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008', 'active')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  auth_user_id = excluded.auth_user_id,
  status = excluded.status,
  disabled_at = null;

insert into public.client_memberships (
  id,
  tenant_id,
  client_id,
  auth_user_id,
  status
)
values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000006', 'active'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000007', 'active'),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008', 'active')
on conflict (id) do update
set
  tenant_id = excluded.tenant_id,
  client_id = excluded.client_id,
  auth_user_id = excluded.auth_user_id,
  status = excluded.status,
  disabled_at = null;

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
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'tenant_owner', 'tenant', '10000000-0000-4000-8000-000000000001', 'active'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 'tenant_administrator', 'tenant', '10000000-0000-4000-8000-000000000001', 'active'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'account_manager', 'client', '20000000-0000-4000-8000-000000000001', 'active'),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', 'content_writer', 'client', '20000000-0000-4000-8000-000000000001', 'active'),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000005', 'designer', 'client', '20000000-0000-4000-8000-000000000002', 'active'),
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000006', 'client_admin', 'client', '20000000-0000-4000-8000-000000000001', 'active'),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000007', 'client_approver', 'client', '20000000-0000-4000-8000-000000000001', 'active'),
  ('60000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000008', 'client_viewer', 'client', '20000000-0000-4000-8000-000000000001', 'active')
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

insert into public.invitations (
  id,
  tenant_id,
  invited_email,
  membership_type,
  role_key,
  client_ids,
  status,
  token_hash,
  expires_at,
  created_by,
  delivery_state,
  idempotency_key
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'pending-account-manager@preview.example.test',
    'internal',
    'account_manager',
    array['20000000-0000-4000-8000-000000000002'::uuid],
    'pending',
    'preview-only-token-hash-internal',
    now() + interval '7 days',
    '30000000-0000-4000-8000-000000000002',
    'queued',
    'preview-internal-account-manager'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'pending-client-viewer@preview.example.test',
    'client',
    'client_viewer',
    array['20000000-0000-4000-8000-000000000003'::uuid],
    'pending',
    'preview-only-token-hash-client',
    now() + interval '7 days',
    '30000000-0000-4000-8000-000000000002',
    'queued',
    'preview-client-viewer'
  )
on conflict (id) do update
set
  invited_email = excluded.invited_email,
  membership_type = excluded.membership_type,
  role_key = excluded.role_key,
  client_ids = excluded.client_ids,
  status = excluded.status,
  token_hash = excluded.token_hash,
  expires_at = excluded.expires_at,
  created_by = excluded.created_by,
  delivery_state = excluded.delivery_state,
  idempotency_key = excluded.idempotency_key;

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
  '30000000-0000-4000-8000-000000000001',
  'staging_seed_loaded',
  'allowed',
  'tenant',
  '10000000-0000-4000-8000-000000000001',
  'F-001 preview dummy seed data only'
)
on conflict (id) do nothing;

commit;
