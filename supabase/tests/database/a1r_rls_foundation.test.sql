begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select plan(37);

-- These grants are test-local and rolled back at the end. They isolate RLS
-- behavior from the separate Data API grant decision documented for A1R.
grant usage on schema public to authenticated;
grant select on public.tenants to authenticated;
grant select on public.tenant_memberships to authenticated;
grant select on public.client_memberships to authenticated;
grant select on public.clients to authenticated;
revoke insert, update on public.clients from authenticated;
grant select on public.role_assignments to authenticated;
grant select, insert, update, delete on public.audit_events to authenticated;
grant select, insert, update on public.invitations to authenticated;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.tenants'::regclass),
  'tenants has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.tenant_memberships'::regclass),
  'tenant_memberships has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.client_memberships'::regclass),
  'client_memberships has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.clients'::regclass),
  'clients has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.role_assignments'::regclass),
  'role_assignments has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  'audit_events has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.invitations'::regclass),
  'invitations has RLS enabled'
);

insert into public.tenants (id, name)
values
  ('00000000-0000-4000-8000-000000000001', 'Tenant A'),
  ('00000000-0000-4000-8000-000000000002', 'Tenant B');

insert into public.tenant_memberships (id, tenant_id, auth_user_id, status)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000201',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000202',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000203',
    'disabled'
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000204',
    'active'
  );

insert into public.clients (id, tenant_id, name, slug, created_by)
values
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000001',
    'Client A',
    'client-a',
    '00000000-0000-4000-8000-000000000201'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000001',
    'Client C',
    'client-c',
    '00000000-0000-4000-8000-000000000201'
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    '00000000-0000-4000-8000-000000000002',
    'Client B',
    'client-b',
    '00000000-0000-4000-8000-000000000202'
  );

insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000201',
  'active'
);

insert into public.client_memberships (id, tenant_id, client_id, auth_user_id, status)
values (
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000205',
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
values (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'tenant_administrator',
  'tenant',
  '00000000-0000-4000-8000-000000000001',
  'active'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);

select is(
  (select count(*)::integer from public.tenants),
  1,
  'active Tenant A member can see only Tenant A'
);

select is(
  (select id from public.tenants),
  '00000000-0000-4000-8000-000000000001'::uuid,
  'active Tenant A member cannot see Tenant B'
);

select is(
  (select count(*)::integer from public.tenant_memberships),
  1,
  'active member can see own active tenant membership only'
);

select is(
  (select count(*)::integer from public.client_memberships),
  1,
  'active member can see own active client membership only'
);

select is(
  (select count(*)::integer from public.clients),
  2,
  'tenant administrator can see all clients in own tenant'
);

select throws_ok(
  $$
    insert into public.clients (id, tenant_id, name, slug, created_by)
    values (
      '00000000-0000-4000-8000-000000000404',
      '00000000-0000-4000-8000-000000000001',
      'Client Direct Insert Denied',
      'client-direct-insert-denied',
      '00000000-0000-4000-8000-000000000201'
    )
  $$,
  '42501',
  'permission denied for table clients',
  'tenant administrator cannot directly insert clients outside the RPC audit path'
);

select is(
  (
    select count(*)::integer
    from public.f001_create_client_write(
      '00000000-0000-4000-8000-000000000406',
      '00000000-0000-4000-8000-000000000603',
      'Client Created By RPC',
      'client-created-by-rpc',
      'Primary Contact',
      'rpc@example.test'
    )
  ),
  1,
  'client write RPC creates a tenant-scoped client'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'ClientCreated'
      and target_id = '00000000-0000-4000-8000-000000000406'
  ),
  1,
  'client write RPC records ClientCreated audit event'
);

select throws_ok(
  $$
    update public.clients
    set name = 'Client Direct Update Denied',
        slug = 'client-direct-update-denied',
        revision = revision + 1
    where id = '00000000-0000-4000-8000-000000000406'
  $$,
  '42501',
  'permission denied for table clients',
  'tenant administrator cannot directly update clients outside the RPC revision guard'
);

select is(
  (
    select revision
    from public.f001_update_client_write(
      '00000000-0000-4000-8000-000000000406',
      '00000000-0000-4000-8000-000000000604',
      'Client Updated By RPC',
      'client-updated-by-rpc',
      'Updated Contact',
      'updated-rpc@example.test',
      null,
      1
    )
  ),
  2,
  'client write RPC updates only the expected revision'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'ClientUpdated'
      and target_id = '00000000-0000-4000-8000-000000000406'
  ),
  1,
  'client write RPC records ClientUpdated audit event'
);

select throws_ok(
  $$
    select *
    from public.f001_update_client_write(
      '00000000-0000-4000-8000-000000000406',
      '00000000-0000-4000-8000-000000000604',
      'Client Stale Revision Denied',
      'client-stale-revision-denied',
      null,
      null,
      null,
      1
    )
  $$,
  'P0002',
  'client write conflict',
  'client write RPC rejects stale expected revision'
);

select is(
  (select count(*)::integer from public.role_assignments),
  1,
  'active tenant member can see Tenant A role assignments'
);

insert into public.audit_events (
  id,
  tenant_id,
  actor_user_id,
  action,
  decision,
  target_type,
  target_id
)
values (
  '00000000-0000-4000-8000-000000000601',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000201',
  'A1RTestAllowedAuditInsert',
  'allowed',
  'tenant',
  '00000000-0000-4000-8000-000000000001'
);

select is(
  (
    select count(*)::integer
    from public.audit_events
    where action = 'A1RTestAllowedAuditInsert'
  ),
  1,
  'tenant administrator can insert and read Tenant A audit event'
);

insert into public.invitations (
  id,
  tenant_id,
  invited_email,
  membership_type,
  role_key,
  client_ids,
  token_hash,
  expires_at,
  created_by,
  delivery_state
)
values (
  '00000000-0000-4000-8000-000000000701',
  '00000000-0000-4000-8000-000000000001',
  'internal-a@example.test',
  'internal',
  'account_manager',
  array['00000000-0000-4000-8000-000000000401'::uuid],
  'hashed-token-a',
  now() + interval '7 days',
  '00000000-0000-4000-8000-000000000201',
  'sent'
);

select is(
  (select count(*)::integer from public.invitations),
  1,
  'tenant administrator can insert and read internal invitations'
);

insert into public.invitations (
  id,
  tenant_id,
  invited_email,
  membership_type,
  role_key,
  client_ids,
  token_hash,
  expires_at,
  created_by,
  delivery_state
)
values (
  '00000000-0000-4000-8000-000000000703',
  '00000000-0000-4000-8000-000000000001',
  'client-viewer-a@example.test',
  'client',
  'client_viewer',
  array['00000000-0000-4000-8000-000000000401'::uuid],
  'hashed-token-client-a',
  now() + interval '7 days',
  '00000000-0000-4000-8000-000000000201',
  'sent'
);

select is(
  (select count(*)::integer from public.invitations where membership_type = 'client'),
  1,
  'tenant administrator can insert and read one-client client invitations'
);

select throws_ok(
  $$
    insert into public.audit_events (
      id,
      tenant_id,
      actor_user_id,
      action,
      decision,
      target_type,
      target_id
    )
    values (
      '00000000-0000-4000-8000-000000000602',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000201',
      'A1RTestDeniedAuditInsert',
      'denied',
      'tenant',
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "audit_events"',
  'cross-tenant audit insert is denied by RLS'
);

select throws_ok(
  $$ update public.audit_events set reason = 'mutated' $$,
  '42501',
  'audit_events are append-only',
  'authenticated users cannot update append-only audit events'
);

select throws_ok(
  $$ delete from public.audit_events $$,
  '42501',
  'audit_events are append-only',
  'authenticated users cannot delete append-only audit events'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000204', true);

select is(
  (select count(*)::integer from public.audit_events),
  0,
  'active tenant member without management role cannot read internal audit events'
);

select is(
  (select count(*)::integer from public.invitations),
  0,
  'active tenant member without management role cannot read internal invitations'
);

select throws_ok(
  $$
    insert into public.invitations (
      id,
      tenant_id,
      invited_email,
      membership_type,
      role_key,
      client_ids,
      token_hash,
      expires_at,
      created_by
    )
    values (
      '00000000-0000-4000-8000-000000000702',
      '00000000-0000-4000-8000-000000000001',
      'denied-internal@example.test',
      'internal',
      'account_manager',
      array['00000000-0000-4000-8000-000000000401'::uuid],
      'hashed-token-denied',
      now() + interval '7 days',
      '00000000-0000-4000-8000-000000000204'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "invitations"',
  'active tenant member without management role cannot insert invitations'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000203', true);

select is(
  (select count(*)::integer from public.tenants),
  0,
  'disabled tenant membership cannot read tenant rows'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000205', true);

select is(
  (select count(*)::integer from public.clients),
  1,
  'client member can read only their own client basics'
);

select is(
  (select count(*)::integer from public.audit_events),
  0,
  'client member cannot read internal audit events'
);

select is(
  (select count(*)::integer from public.invitations),
  0,
  'client member cannot read tenant invitation records'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);

select throws_ok(
  $$
    insert into public.clients (id, tenant_id, name, slug, created_by)
    values (
      '00000000-0000-4000-8000-000000000405',
      '00000000-0000-4000-8000-000000000002',
      'Client Created By Non Admin',
      'client-created-by-non-admin',
      '00000000-0000-4000-8000-000000000202'
    )
  $$,
  '42501',
  'permission denied for table clients',
  'active tenant member without management role cannot directly insert clients'
);

select throws_ok(
  $$
    select *
    from public.f001_create_client_write(
      '00000000-0000-4000-8000-000000000407',
      '00000000-0000-4000-8000-000000000605',
      'Client Denied By RPC',
      'client-denied-by-rpc',
      null,
      null
    )
  $$,
  '42501',
  'not authorized',
  'active tenant member without management role cannot use client write RPC'
);

select throws_ok(
  $$
    select *
    from public.f001_update_client_write(
      '00000000-0000-4000-8000-000000000406',
      '00000000-0000-4000-8000-000000000607',
      'Client Update Denied By RPC',
      'client-update-denied-by-rpc',
      null,
      null,
      null,
      2
    )
  $$,
  '42501',
  'not authorized',
  'active tenant member without management role cannot use client update RPC'
);

select is(
  (select count(*)::integer from public.clients),
  0,
  'tenant member without management role cannot infer tenant clients'
);

select * from finish();

rollback;
