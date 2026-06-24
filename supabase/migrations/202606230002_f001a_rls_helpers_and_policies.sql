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

create or replace function public.f001_has_active_role(
  target_tenant_id uuid,
  target_role_keys text[],
  target_scope_type text,
  target_scope_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    join public.role_assignments ra
      on ra.membership_id = tm.id
      and ra.tenant_id = tm.tenant_id
    where tm.tenant_id = target_tenant_id
      and tm.auth_user_id = auth.uid()
      and tm.status = 'active'
      and ra.status = 'active'
      and ra.role_key = any(target_role_keys)
      and ra.scope_type = target_scope_type
      and ra.scope_id = target_scope_id
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

drop policy if exists "f001 client basics select authorized scope" on public.clients;
create policy "f001 client basics select authorized scope"
on public.clients
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager', 'content_writer', 'designer'],
    'client',
    id
  )
  or public.f001_active_client_member(tenant_id, id)
);

drop policy if exists "f001 client insert tenant management" on public.clients;
create policy "f001 client insert tenant management"
on public.clients
for insert
with check (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
);

drop policy if exists "f001 client update tenant management" on public.clients;
create policy "f001 client update tenant management"
on public.clients
for update
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
)
with check (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
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
