-- F-001B read-only hosted UAT runtime access.
-- Explicit grants keep Data API exposure reviewable, and RLS remains the
-- authorization boundary for every tenant/client-scoped row.

grant usage on schema public to authenticated;

grant select on public.tenants to authenticated;
grant select on public.tenant_memberships to authenticated;
grant select on public.client_memberships to authenticated;
grant select on public.clients to authenticated;
grant select on public.role_assignments to authenticated;
grant select on public.permission_references to authenticated;
grant select on public.audit_events to authenticated;

do $$
begin
  if to_regclass('public.invitations') is not null then
    grant select on public.invitations to authenticated;
  end if;
end;
$$;

drop policy if exists "f001 own tenant membership select" on public.tenant_memberships;
create policy "f001 own tenant membership select"
on public.tenant_memberships
for select
using (
  auth_user_id = auth.uid()
  and status in ('active', 'disabled')
);
