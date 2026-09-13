-- Spec 015 X010-B3 corrective: allow the client to keep reading a deliverable
-- while it sits in the `client_changes_requested` state, without expanding any
-- other boundary. Additive and replayable; does not touch historical migrations.
--
-- Background: the client requested changes and the deliverable transitioned to
-- `client_changes_requested`. The previous helper + deliverables SELECT policy
-- only allowed `waiting_client_approval`, `client_approved`, `ready_for_delivery`
-- and `delivered`, so the change-requested work vanished from the client portal
-- even though it must stay visible (AGENTS.md section 7.2). This migration adds
-- exactly that one status everywhere the client read boundary is enforced, while
-- keeping internal comments, internal files, previous/non-current versions and
-- other tenants/clients fully hidden.

-- 1) Redefine the exact-current-version helper with the same auth.uid() guard,
--    tenant/client role checks, uniform-false behaviour, security definer,
--    search_path, grants and revokes. Only the visible deliverable-status set
--    grows by one entry: `client_changes_requested`.
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
        'waiting_client_approval', 'client_changes_requested', 'client_approved',
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

-- 2) Recreate the client deliverables SELECT policy with the same active client
--    membership, client role, current_version_id and exact-current-version
--    helper checks, adding only `client_changes_requested` to the inline status
--    gate. Version/comment/file policies already call the helper above and do
--    not need to be touched: they never widen internal comment, internal file,
--    previous-version or cross-client visibility.
drop policy if exists "f006 client portal select deliverables" on public.deliverables;
create policy "f006 client portal select deliverables"
on public.deliverables
for select
to authenticated
using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id,
    array['client_admin', 'client_approver', 'client_viewer'],
    'client',
    client_id
  )
  and status in (
    'waiting_client_approval', 'client_changes_requested', 'client_approved',
    'ready_for_delivery', 'delivered'
  )
  and current_version_id is not null
  and public.s015_client_current_version_is_visible(
    deliverables.tenant_id,
    deliverables.client_id,
    deliverables.id,
    deliverables.current_version_id
  )
);
