-- Spec 015 X006-A: harden the callable exact-version boundary and member reads.
-- Additive and replayable. No hosted identifiers or profile values live here.

create or replace function public.s015_client_current_version_is_visible(
  target_tenant_id uuid,
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  caller_is_authorized boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  caller_is_authorized :=
    public.f001_has_active_role(
      target_tenant_id,
      array['tenant_owner', 'tenant_administrator', 'project_manager', 'marketing_manager'],
      'tenant',
      target_tenant_id
    )
    or public.f001_has_active_role(
      target_tenant_id,
      array[
        'tenant_owner', 'tenant_administrator', 'project_manager',
        'marketing_manager', 'account_manager', 'content_writer', 'designer',
        'performance_specialist'
      ],
      'client',
      target_client_id
    )
    or (
      public.f001_active_client_member(target_tenant_id, target_client_id)
      and public.f001_has_active_role(
        target_tenant_id,
        array['client_admin', 'client_approver', 'client_viewer'],
        'client',
        target_client_id
      )
    );

  if not caller_is_authorized then
    -- A uniform false result prevents direct RPC callers from using this
    -- policy helper as a cross-tenant/client existence or state oracle.
    return false;
  end if;

  return exists (
    select 1
    from public.deliverables d
    join public.deliverable_versions v
      on v.id = d.current_version_id
     and v.deliverable_id = d.id
     and v.tenant_id = d.tenant_id
     and v.client_id = d.client_id
    where d.tenant_id = target_tenant_id
      and d.client_id = target_client_id
      and d.id = target_deliverable_id
      and v.id = target_version_id
      and d.status in (
        'waiting_client_approval', 'client_approved',
        'ready_for_delivery', 'delivered'
      )
      and v.status in ('client_visible', 'client_approved', 'final')
  );
end;
$$;

revoke all on function public.s015_client_current_version_is_visible(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.s015_client_current_version_is_visible(uuid, uuid, uuid, uuid)
  to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.s015_can_read_member_profile(
  target_tenant_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.f001_has_active_role(
      target_tenant_id,
      array['tenant_owner', 'tenant_administrator', 'project_manager', 'marketing_manager'],
      'tenant',
      target_tenant_id
    )
    or exists (
      select 1
      from public.deliverables d
      where d.tenant_id = target_tenant_id
        and (
          d.owner_user_id = target_user_id
          or target_user_id = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
        )
        and public.f001_has_active_role(
          d.tenant_id,
          array[
            'account_manager', 'content_writer', 'designer',
            'performance_specialist'
          ],
          'client',
          d.client_id
        )
    );
$$;

revoke all on function private.s015_can_read_member_profile(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.s015_can_read_member_profile(uuid, uuid)
  to authenticated;

alter table public.member_profiles
  add column if not exists sync_run_id text;

drop policy if exists s015_member_profiles_select on public.member_profiles;
create policy s015_member_profiles_select on public.member_profiles
  for select to authenticated
  using (private.s015_can_read_member_profile(tenant_id, user_id));

comment on column public.member_profiles.sync_run_id is
  'Opaque run identifier for bounded UAT profile sync and rollback; never an email or hosted credential.';
