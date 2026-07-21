create or replace function private.s015_deliverable_member_is_eligible(
  target_tenant_id uuid,
  target_client_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    join public.role_assignments ra
      on ra.membership_id = tm.id
     and ra.tenant_id = tm.tenant_id
    where tm.tenant_id = target_tenant_id
      and tm.auth_user_id = target_user_id
      and tm.status = 'active'
      and ra.status = 'active'
      and (
        (
          ra.scope_type = 'tenant'
          and ra.scope_id = target_tenant_id
          and ra.role_key in (
            'tenant_owner', 'tenant_administrator',
            'project_manager', 'marketing_manager'
          )
        )
        or (
          ra.scope_type = 'client'
          and ra.scope_id = target_client_id
          and ra.role_key in (
            'project_manager', 'marketing_manager', 'account_manager',
            'content_writer', 'designer', 'performance_specialist'
          )
        )
      )
  );
$$;

revoke all on function private.s015_deliverable_member_is_eligible(uuid, uuid, uuid)
  from public, anon, authenticated;

create or replace function private.s015_validate_deliverable_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  contributor_user_id uuid;
begin
  if new.owner_user_id is not null
     and not private.s015_deliverable_member_is_eligible(
       new.tenant_id, new.client_id, new.owner_user_id
     ) then
    raise exception 'invalid deliverable owner' using errcode = '42501';
  end if;

  foreach contributor_user_id in array coalesce(
    new.contributor_user_ids,
    array[]::uuid[]
  ) loop
    if not private.s015_deliverable_member_is_eligible(
      new.tenant_id, new.client_id, contributor_user_id
    ) then
      raise exception 'invalid deliverable contributor' using errcode = '42501';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists s015_validate_deliverable_assignments on public.deliverables;
create trigger s015_validate_deliverable_assignments
before insert or update of tenant_id, client_id, owner_user_id, contributor_user_ids
on public.deliverables
for each row execute function private.s015_validate_deliverable_assignments();

create or replace function public.s015_list_deliverable_eligible_members(
  target_tenant_id uuid,
  target_client_id uuid
)
returns table(user_id uuid, display_name text, role_label text)
language sql
security definer
set search_path = public
stable
as $$
  select distinct on (tm.auth_user_id)
    tm.auth_user_id,
    mp.display_name,
    mp.role_label
  from public.tenant_memberships tm
  join public.member_profiles mp
    on mp.tenant_id = tm.tenant_id
   and mp.user_id = tm.auth_user_id
  where auth.uid() is not null
    and tm.tenant_id = target_tenant_id
    and tm.status = 'active'
    and private.s015_deliverable_member_is_eligible(
      target_tenant_id, target_client_id, tm.auth_user_id
    )
    and (
      public.f001_has_active_role(
        target_tenant_id,
        array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
        'tenant', target_tenant_id
      )
      or public.f001_has_active_role(
        target_tenant_id,
        array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager'],
        'client', target_client_id
      )
    )
  order by tm.auth_user_id, mp.display_name;
$$;

revoke all on function public.s015_list_deliverable_eligible_members(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.s015_list_deliverable_eligible_members(uuid, uuid)
  to authenticated;
