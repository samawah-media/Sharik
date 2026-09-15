-- Owner-approved UAT-only additive grant. Run only on sharik-uat
-- (jnvuccapgsabrwwkxnbh). No account creation, scope removal, or policy change.
-- Single DO statement makes membership, role, and audit insertion atomic.
do $$
declare
  tenant uuid := '5dc5849c-8465-4226-a2ca-53f7a9307ebc';
  client uuid := 'c546ec7e-f65d-488f-a656-fca612f8d8c1';
  person uuid := '5fcfe808-a35e-4557-b4c9-a75488d1195e';
  membership uuid := 'b41de8d1-e3e2-4c4b-9237-a3659fdbf1ef';
  client_membership uuid;
  role_id uuid;
  run_reason text := 'owner_approved_madar_client_approver_20260910;additive_only;preserve_existing_scopes';
begin
  perform pg_advisory_xact_lock(hashtext(run_reason));
  if not exists (select 1 from public.clients where id=client and tenant_id=tenant
    and name='محمصة مدار — تجربة الفريق 0909' and status='active') then
    raise exception 'MADAR_TARGET_MISMATCH';
  end if;
  if not exists (select 1 from public.tenant_memberships where id=membership
    and tenant_id=tenant and auth_user_id=person and status='active') then
    raise exception 'MADAR_TEST_ACTOR_MISMATCH';
  end if;
  if not exists (select 1 from public.role_assignments where tenant_id=tenant
    and membership_id=membership and role_key='client_approver'
    and scope_type='client' and scope_id='708a132f-53e2-43d2-a233-8784e52acc6f'
    and status='active') then raise exception 'EXISTING_SCOPE_NOT_ACTIVE'; end if;

  select id into client_membership from public.client_memberships
    where tenant_id=tenant and client_id=client and auth_user_id=person and status='active';
  if client_membership is null then
    client_membership := gen_random_uuid();
    insert into public.client_memberships(id,tenant_id,client_id,auth_user_id,status)
      values(client_membership,tenant,client,person,'active');
  end if;
  select id into role_id from public.role_assignments where tenant_id=tenant
    and membership_id=membership and role_key='client_approver'
    and scope_type='client' and scope_id=client and status='active';
  if role_id is null then
    role_id := gen_random_uuid();
    insert into public.role_assignments(id,tenant_id,membership_id,role_key,scope_type,scope_id,status)
      values(role_id,tenant,membership,'client_approver','client',client,'active');
  end if;
  if not exists (select 1 from public.audit_events where tenant_id=tenant
    and client_id=client and action='uat_madar_client_access_granted' and reason=run_reason) then
    insert into public.audit_events(id,tenant_id,client_id,actor_user_id,action,decision,target_type,target_id,reason)
      values(gen_random_uuid(),tenant,client,null,'uat_madar_client_access_granted','allowed',
        'role_assignment',role_id::text,run_reason);
  end if;
end;
$$;
