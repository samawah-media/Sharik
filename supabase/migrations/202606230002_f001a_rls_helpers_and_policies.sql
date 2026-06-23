-- F-001A RLS helper and policies for tenant isolation defense in depth.
-- Server-side authorization remains mandatory before sensitive commands.

create or replace function public.f001_active_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = target_tenant_id
      and tm.auth_user_id = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function public.f001_active_client_member(
  target_tenant_id uuid,
  target_client_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_memberships cm
    where cm.tenant_id = target_tenant_id
      and cm.client_id = target_client_id
      and cm.auth_user_id = auth.uid()
      and cm.status = 'active'
  );
$$;

drop policy if exists "f001 tenant member select tenants" on public.tenants;
create policy "f001 tenant member select tenants"
on public.tenants
for select
using (public.f001_active_tenant_member(id));

drop policy if exists "f001 own tenant membership select" on public.tenant_memberships;
create policy "f001 own tenant membership select"
on public.tenant_memberships
for select
using (
  auth_user_id = auth.uid()
  and public.f001_active_tenant_member(tenant_id)
);

drop policy if exists "f001 own client membership select" on public.client_memberships;
create policy "f001 own client membership select"
on public.client_memberships
for select
using (
  auth_user_id = auth.uid()
  and public.f001_active_tenant_member(tenant_id)
);

drop policy if exists "f001 role assignment select by tenant member" on public.role_assignments;
create policy "f001 role assignment select by tenant member"
on public.role_assignments
for select
using (public.f001_active_tenant_member(tenant_id));

drop policy if exists "f001 audit insert own tenant" on public.audit_events;
create policy "f001 audit insert own tenant"
on public.audit_events
for insert
with check (public.f001_active_tenant_member(tenant_id));

drop policy if exists "f001 audit select tenant management" on public.audit_events;
create policy "f001 audit select tenant management"
on public.audit_events
for select
using (public.f001_active_tenant_member(tenant_id));
