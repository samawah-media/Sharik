-- X010-B-7C-7: exact multi-client invitation scope and acceptance.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_invite_internal_team_member_v3(text,text,text,uuid[],text,uuid,uuid,text)',
    'execute'
  ),
  'authenticated can call the multi-client invitation RPC'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_list_internal_team_invitations_v3()',
    'execute'
  ),
  'authenticated can call the aggregated invitation reader'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.s015_read_internal_team_invitation_v2(text)',
    'execute'
  ),
  'authenticated invited users can preview the exact client scopes'
);

insert into public.tenants (id, name) values
  ('7c000000-0000-4000-8000-000000000001', 'C7 Team Tenant'),
  ('7c000000-0000-4000-8000-000000000002', 'C7 Other Tenant');
insert into public.clients (id, tenant_id, name, slug) values
  ('7c000000-0000-4000-8000-000000000101', '7c000000-0000-4000-8000-000000000001', 'C7 Client A', 'c7-a'),
  ('7c000000-0000-4000-8000-000000000102', '7c000000-0000-4000-8000-000000000001', 'C7 Client B', 'c7-b'),
  ('7c000000-0000-4000-8000-000000000103', '7c000000-0000-4000-8000-000000000002', 'C7 Other Client', 'c7-other');
insert into public.tenant_memberships (id, tenant_id, auth_user_id, status) values
  ('7c000000-0000-4000-8000-000000000201', '7c000000-0000-4000-8000-000000000001', '7c000000-0000-4000-8000-000000000301', 'active');
insert into public.role_assignments (
  id, tenant_id, membership_id, role_key, scope_type, scope_id, status
) values (
  '7c000000-0000-4000-8000-000000000401',
  '7c000000-0000-4000-8000-000000000001',
  '7c000000-0000-4000-8000-000000000201',
  'tenant_administrator', 'tenant',
  '7c000000-0000-4000-8000-000000000001', 'active'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '7c000000-0000-4000-8000-000000000301', true);
select results_eq(
  $$select role_key, client_ids, status
    from public.s015_invite_internal_team_member_v3(
      'ليان المصممة',
      'multi.member@example.test',
      'designer',
      array[
        '7c000000-0000-4000-8000-000000000102'::uuid,
        '7c000000-0000-4000-8000-000000000101'::uuid,
        '7c000000-0000-4000-8000-000000000101'::uuid
      ],
      repeat('m', 64),
      '7c000000-0000-4000-8000-000000000501',
      '7c000000-0000-4000-8000-000000000502',
      'c7-multi-client-invite'
    )$$,
  $$values (
    'designer'::text,
    array[
      '7c000000-0000-4000-8000-000000000101'::uuid,
      '7c000000-0000-4000-8000-000000000102'::uuid
    ],
    'pending'::text
  )$$,
  'invitation stores a deduplicated deterministic client scope'
);
select results_eq(
  $$select invited_email, client_names
    from public.s015_list_internal_team_invitations_v3()
    where id = '7c000000-0000-4000-8000-000000000501'$$,
  $$values (
    'multi.member@example.test'::text,
    array['C7 Client A','C7 Client B']::text[]
  )$$,
  'management reads one invitation row with all human client names'
);
select is(
  (select count(*)::integer from public.audit_events
   where target_id like '7c000000-0000-4000-8000-000000000501:%'
     and action = 'RoleAssigned'
     and reason like 'intent_pending_acceptance:%'),
  2,
  'invitation records one scoped role intent per client'
);
select throws_ok(
  $$select * from public.s015_invite_internal_team_member_v3(
    'عضو خارج النطاق', 'cross.scope@example.test', 'designer',
    array[
      '7c000000-0000-4000-8000-000000000101'::uuid,
      '7c000000-0000-4000-8000-000000000103'::uuid
    ], repeat('x', 64), gen_random_uuid(), gen_random_uuid(),
    'c7-cross-tenant-denied'
  )$$,
  '42501',
  'team invitation denied',
  'a multi-client invitation cannot cross tenant boundaries'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '7c000000-0000-4000-8000-000000000302', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"7c000000-0000-4000-8000-000000000302","email":"multi.member@example.test"}',
  true
);
select results_eq(
  $$select invited_display_name, role_key, client_names, status
    from public.s015_read_internal_team_invitation_v2(repeat('m', 64))$$,
  $$values (
    'ليان المصممة'::text,
    'designer'::text,
    array['C7 Client A','C7 Client B']::text[],
    'pending'::text
  )$$,
  'the exact invited email sees every and only invited client scope'
);
select is(
  public.s015_accept_internal_team_invitation(
    repeat('m', 64),
    '7c000000-0000-4000-8000-000000000511',
    '7c000000-0000-4000-8000-000000000512',
    'c7-accept-multi-client'
  ),
  'accepted',
  'acceptance activates all exact client-scoped assignments'
);

reset role;
select is(
  (select count(*)::integer
   from public.role_assignments ra
   join public.tenant_memberships tm on tm.id = ra.membership_id
   where tm.tenant_id = '7c000000-0000-4000-8000-000000000001'
     and tm.auth_user_id = '7c000000-0000-4000-8000-000000000302'
     and tm.status = 'active'
     and ra.role_key = 'designer'
     and ra.scope_type = 'client'
     and ra.scope_id = any(array[
       '7c000000-0000-4000-8000-000000000101'::uuid,
       '7c000000-0000-4000-8000-000000000102'::uuid
     ])
     and ra.status = 'active'),
  2,
  'acceptance creates exactly two active scoped roles'
);
select is(
  (select count(*)::integer from public.audit_events
   where actor_user_id = '7c000000-0000-4000-8000-000000000302'
     and action = 'RoleAssigned'
     and reason = 'invitation_acceptance'),
  2,
  'acceptance records one role-assignment audit event per client'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '7c000000-0000-4000-8000-000000000302', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"7c000000-0000-4000-8000-000000000302","email":"multi.member@example.test"}',
  true
);
select is(
  public.s015_accept_internal_team_invitation(
    repeat('m', 64), gen_random_uuid(), gen_random_uuid(),
    'c7-accept-multi-client'
  ),
  'accepted',
  'accepted invitation replay remains an idempotent no-op'
);
reset role;
select is(
  (select count(*)::integer
   from public.role_assignments ra
   join public.tenant_memberships tm on tm.id = ra.membership_id
   where tm.auth_user_id = '7c000000-0000-4000-8000-000000000302'
     and ra.role_key = 'designer'
     and ra.status = 'active'),
  2,
  'acceptance replay does not duplicate assignments'
);

update public.tenant_memberships
set status = 'disabled', disabled_at = now()
where tenant_id = '7c000000-0000-4000-8000-000000000001'
  and auth_user_id = '7c000000-0000-4000-8000-000000000302';

set local role authenticated;
select set_config('request.jwt.claim.sub', '7c000000-0000-4000-8000-000000000302', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"7c000000-0000-4000-8000-000000000302","email":"multi.member@example.test"}',
  true
);
select is(
  (select count(*)::integer
   from public.s015_read_internal_team_invitation_v2(repeat('m', 64))),
  0,
  'an accepted invitation no longer claims activation after membership disablement'
);
select throws_ok(
  $$select public.s015_accept_internal_team_invitation(
    repeat('m', 64), gen_random_uuid(), gen_random_uuid(),
    'c7-disabled-membership-replay'
  )$$,
  '42501',
  'invitation unavailable',
  'an accepted invitation cannot bypass disabled-membership denial'
);
reset role;

select * from finish();
rollback;
