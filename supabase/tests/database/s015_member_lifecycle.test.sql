-- X010-B-7C-18 D18-C/D: persistent real-member lifecycle.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select has_function('public', 's015_update_internal_member_assignment', array['uuid','uuid','text','text','uuid','text','uuid','text']);
select has_function('public', 's015_remove_internal_member_client_scope', array['uuid','uuid','text','uuid','text']);
select has_function('public', 's015_disable_internal_team_membership', array['uuid','text','uuid','text']);
select ok(has_function_privilege('authenticated', 'public.s015_list_internal_team_members()', 'execute'), 'authenticated can execute the member directory');
select ok(not has_function_privilege('anon', 'public.s015_list_internal_team_members()', 'execute'), 'anonymous cannot execute the member directory');
select ok(has_function_privilege('authenticated', 'public.s015_update_internal_member_assignment(uuid,uuid,text,text,uuid,text,uuid,text)', 'execute'), 'authenticated can execute assignment updates');
select ok(not has_function_privilege('anon', 'public.s015_update_internal_member_assignment(uuid,uuid,text,text,uuid,text,uuid,text)', 'execute'), 'anonymous cannot execute assignment updates');
select ok(not has_function_privilege('anon', 'public.s015_remove_internal_member_client_scope(uuid,uuid,text,uuid,text)', 'execute'), 'anonymous cannot remove client scope');
select ok(not has_function_privilege('anon', 'public.s015_disable_internal_team_membership(uuid,text,uuid,text)', 'execute'), 'anonymous cannot disable membership');

insert into public.tenants (id, name) values
  ('18000000-0000-4000-8000-000000000001', 'Lifecycle Tenant'),
  ('18000000-0000-4000-8000-000000000002', 'Other Tenant'),
  ('18000000-0000-4000-8000-000000000003', 'Tenant Without Clients');
insert into public.clients (id, tenant_id, name, slug) values
  ('18000000-0000-4000-8000-000000000101', '18000000-0000-4000-8000-000000000001', 'عميل ألف', 'd18-a'),
  ('18000000-0000-4000-8000-000000000102', '18000000-0000-4000-8000-000000000001', 'عميل باء', 'd18-b'),
  ('18000000-0000-4000-8000-000000000103', '18000000-0000-4000-8000-000000000002', 'عميل آخر', 'd18-other');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('18000000-0000-4000-8000-000000000201', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000301', 'active'),
  ('18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000302', 'active'),
  ('18000000-0000-4000-8000-000000000203', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000303', 'active'),
  ('18000000-0000-4000-8000-000000000204', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000304', 'active'),
  ('18000000-0000-4000-8000-000000000205', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000305', 'active'),
  ('18000000-0000-4000-8000-000000000206', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000306', 'active'),
  ('18000000-0000-4000-8000-000000000207', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000307', 'active'),
  ('18000000-0000-4000-8000-000000000208', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000307', 'active');
insert into public.role_assignments (id, tenant_id, membership_id, role_key, scope_type, scope_id, status) values
  ('18000000-0000-4000-8000-000000000401', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000201', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000001', 'active'),
  ('18000000-0000-4000-8000-000000000402', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000202', 'content_writer', 'client', '18000000-0000-4000-8000-000000000101', 'active'),
  ('18000000-0000-4000-8000-000000000403', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000203', 'tenant_owner', 'tenant', '18000000-0000-4000-8000-000000000001', 'active'),
  ('18000000-0000-4000-8000-000000000404', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000204', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000002', 'active'),
  ('18000000-0000-4000-8000-000000000405', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000205', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000003', 'active'),
  ('18000000-0000-4000-8000-000000000406', '18000000-0000-4000-8000-000000000003', '18000000-0000-4000-8000-000000000206', 'project_manager', 'tenant', '18000000-0000-4000-8000-000000000003', 'active'),
  ('18000000-0000-4000-8000-000000000407', '18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000202', 'performance_specialist', 'client', '18000000-0000-4000-8000-000000000102', 'active'),
  ('18000000-0000-4000-8000-000000000409', '18000000-0000-4000-8000-000000000002', '18000000-0000-4000-8000-000000000208', 'tenant_administrator', 'tenant', '18000000-0000-4000-8000-000000000002', 'active');
insert into public.member_profiles (tenant_id, user_id, display_name) values
  ('18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000301', 'مدير الاختبار'),
  ('18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000302', 'كاتبة المحتوى'),
  ('18000000-0000-4000-8000-000000000001', '18000000-0000-4000-8000-000000000303', 'مالك احتياطي');

set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-4000-8000-000000000307', true);
select throws_ok(
  $$select * from public.s015_list_internal_team_members()$$,
  '42501', 'not authorized', 'a user with two active tenant memberships fails closed'
);
select set_config('request.jwt.claim.sub', '18000000-0000-4000-8000-000000000301', true);

select is(
  (select assignments -> 0 ->> 'scopeName' from public.s015_list_internal_team_members() where membership_id = '18000000-0000-4000-8000-000000000202'),
  'عميل ألف',
  'management reads exact assignment scope with a human label'
);
select is(
  (select count(*)::integer from public.s015_list_internal_team_members()),
  3,
  'the real directory remains tenant scoped'
);
select is(
  public.s015_update_internal_member_assignment(
    '18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000402',
    'designer', 'client', '18000000-0000-4000-8000-000000000102', 'تحديث نطاق العمل',
    '18000000-0000-4000-8000-000000000501', 'd18-update-assignment-1'
  ),
  'updated',
  'management updates one exact active role and client scope'
);
select is(
  public.s015_update_internal_member_assignment(
    '18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000402',
    'designer', 'client', '18000000-0000-4000-8000-000000000102', 'تحديث نطاق العمل',
    gen_random_uuid(), 'd18-update-assignment-1'
  ),
  'updated',
  'role update replay is idempotent'
);
select is(
  ((select reason::jsonb from public.audit_events
    where id = '18000000-0000-4000-8000-000000000501') ->> 'oldRole'),
  'content_writer',
  'role audit preserves the previous role'
);
select is(
  ((select reason::jsonb from public.audit_events
    where id = '18000000-0000-4000-8000-000000000501') ->> 'newRole'),
  'designer',
  'role audit preserves the new role'
);
select is(
  public.s015_remove_internal_member_client_scope(
    '18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000407',
    'إزالة نطاق الأداء', gen_random_uuid(), 'd18-remove-scope-1'
  ),
  'removed',
  'management removes one exact client scope'
);
select is(
  public.s015_remove_internal_member_client_scope(
    '18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000407',
    'إزالة نطاق الأداء', gen_random_uuid(), 'd18-remove-scope-1'
  ),
  'removed',
  'successful scope removal replay is idempotent'
);
select throws_ok(
  $$select public.s015_update_internal_member_assignment(
    '18000000-0000-4000-8000-000000000202', '18000000-0000-4000-8000-000000000402',
    'content_writer', 'client', '18000000-0000-4000-8000-000000000102', 'different payload',
    gen_random_uuid(), 'd18-update-assignment-1')$$,
  'P0001', 'idempotency conflict', 'same key with another payload is rejected'
);
select throws_ok(
  $$select public.s015_update_internal_member_assignment(
    '18000000-0000-4000-8000-000000000204', '18000000-0000-4000-8000-000000000404',
    'designer', 'client', '18000000-0000-4000-8000-000000000103', 'cross tenant',
    gen_random_uuid(), 'd18-cross-tenant')$$,
  '42501', 'member lifecycle denied', 'management cannot mutate another tenant'
);

reset role;
insert into public.deliverables (
  id, tenant_id, client_id, name, type, status, progress_percentage, owner_user_id
) values (
  '18000000-0000-4000-8000-000000000601', '18000000-0000-4000-8000-000000000001',
  '18000000-0000-4000-8000-000000000102', 'مخرج نشط', 'post', 'in_progress', 30,
  '18000000-0000-4000-8000-000000000302'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-4000-8000-000000000301', true);
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000202', 'إنهاء التعاون',
    '18000000-0000-4000-8000-000000000502', 'd18-disable-blocked-1'
  ),
  'responsibilities_blocked',
  'server-derived active deliverable responsibility blocks disablement'
);
select is(
  (select count(*)::integer from public.audit_events where action = 'MembershipSuspensionBlocked' and target_id = '18000000-0000-4000-8000-000000000202'),
  1,
  'blocked disablement is audited once'
);
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000202', 'إنهاء التعاون',
    gen_random_uuid(), 'd18-disable-blocked-1'
  ),
  'responsibilities_blocked',
  'blocked disablement replay is idempotent'
);
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000201', 'تعطيل ذاتي',
    gen_random_uuid(), 'd18-self-disable'
  ),
  'self_disable_blocked',
  'management cannot disable its own membership'
);

-- Removing the backup owner would leave only the actor; downgrading that actor afterwards must fail closed.
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000203', 'إنهاء صلاحية احتياطية',
    gen_random_uuid(), 'd18-disable-backup-owner'
  ),
  'disabled',
  'a second administrator can be disabled safely'
);
select is(
  public.s015_update_internal_member_assignment(
    '18000000-0000-4000-8000-000000000201', '18000000-0000-4000-8000-000000000401',
    'designer', 'client', '18000000-0000-4000-8000-000000000101', 'خفض آخر إدارة',
    gen_random_uuid(), 'd18-last-admin-update'
  ),
  'last_administrator_blocked',
  'the last active owner or administrator cannot be removed by role editing'
);

reset role;
update public.deliverables set status = 'cancelled', progress_percentage = 30 where id = '18000000-0000-4000-8000-000000000601';
set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-4000-8000-000000000301', true);
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000202', 'إنهاء التعاون',
    gen_random_uuid(), 'd18-disable-success-1'
  ),
  'disabled',
  'membership disables after responsibilities are resolved'
);
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000202', 'إنهاء التعاون',
    gen_random_uuid(), 'd18-disable-success-1'
  ),
  'disabled',
  'successful membership disable replay is idempotent'
);
reset role;
select is((select status from public.tenant_memberships where id = '18000000-0000-4000-8000-000000000202'), 'disabled', 'disabled history is preserved');
select is((select status from public.role_assignments where id = '18000000-0000-4000-8000-000000000402'), 'removed', 'disablement revokes active assignments atomically');

select is(
  (select is_nullable from information_schema.columns
   where table_schema = 'public' and table_name = 'mvp_command_requests' and column_name = 'client_id'),
  'YES',
  'tenant-scoped commands do not require an arbitrary client'
);
select col_has_check(
  'public',
  'mvp_command_requests',
  array['client_id', 'deliverable_id', 'version_id', 'command_name'],
  'nullable client ids remain constrained to tenant-only member commands'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '18000000-0000-4000-8000-000000000305', true);
select is(
  public.s015_disable_internal_team_membership(
    '18000000-0000-4000-8000-000000000206', 'إنهاء عضوية تجريبية',
    gen_random_uuid(), 'd18-zero-client-disable'
  ),
  'disabled',
  'an administrator can manage membership before the first client exists'
);
select is(
  (select client_id from public.mvp_command_requests
   where tenant_id = '18000000-0000-4000-8000-000000000003'
     and idempotency_key = 'd18-zero-client-disable'),
  null::uuid,
  'tenant lifecycle command remains tenant scoped'
);

select * from finish();
rollback;
