-- F-006 client portal commercial summary read policies.
-- Client portal users can read only their own client-scoped commercial rows
-- when both an active client membership and an active client role exist.

drop policy if exists "f006 client portal select contracts" on public.contracts;
create policy "f006 client portal select contracts"
on public.contracts
for select
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
);

drop policy if exists "f006 client portal select packages" on public.packages;
create policy "f006 client portal select packages"
on public.packages
for select
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
);

drop policy if exists "f006 client portal select package lines" on public.package_lines;
create policy "f006 client portal select package lines"
on public.package_lines
for select
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
);

drop policy if exists "f006 client portal select deliverables" on public.deliverables;
create policy "f006 client portal select deliverables"
on public.deliverables
for select
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
);

drop policy if exists "f006 client portal select package ledger" on public.package_ledger_entries;
create policy "f006 client portal select package ledger"
on public.package_ledger_entries
for select
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
);

drop policy if exists "f006 client portal select deliverable allocations" on public.deliverable_allocations;
create policy "f006 client portal select deliverable allocations"
on public.deliverable_allocations
for select
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
);
