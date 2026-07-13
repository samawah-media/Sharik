-- Spec 015: client visibility boundary and version-specific execution content.
-- This migration is additive, replayable, and does not touch Production.

alter table public.deliverable_versions
  add column if not exists brief text,
  add column if not exists content_body text,
  add column if not exists caption text,
  add column if not exists channel text,
  add column if not exists format text,
  add column if not exists objective text,
  add column if not exists kpi text,
  add column if not exists source_reference text;

create index if not exists deliverable_versions_client_visible_idx
  on public.deliverable_versions (tenant_id, client_id, status, deliverable_id);

create or replace function public.s015_client_current_version_is_visible(
  target_tenant_id uuid,
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
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
      and d.status in ('waiting_client_approval', 'client_approved', 'ready_for_delivery', 'delivered')
      and v.status in ('client_visible', 'client_approved', 'final')
  );
$$;

revoke all on function public.s015_client_current_version_is_visible(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.s015_client_current_version_is_visible(uuid, uuid, uuid, uuid) to authenticated;

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
  and status in ('waiting_client_approval', 'client_approved', 'ready_for_delivery', 'delivered')
  and current_version_id is not null
  and public.s015_client_current_version_is_visible(
    deliverables.tenant_id,
    deliverables.client_id,
    deliverables.id,
    deliverables.current_version_id
  )
);

-- Keep direct version reads aligned with the same exact current-version rule.
drop policy if exists s015_versions_select on public.deliverable_versions;
create policy s015_versions_select on public.deliverable_versions for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
  or (
    status in ('client_visible','client_approved','final')
    and public.s015_client_current_version_is_visible(
      deliverable_versions.tenant_id,
      deliverable_versions.client_id,
      deliverable_versions.deliverable_id,
      deliverable_versions.id
    )
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
);

drop policy if exists s015_comments_select on public.comments;
create policy s015_comments_select on public.comments for select using (
  (
    visibility = 'client_visible'
    and version_id is not null
    and public.s015_client_current_version_is_visible(
      comments.tenant_id,
      comments.client_id,
      comments.deliverable_id,
      comments.version_id
    )
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);

drop policy if exists s015_files_select on public.file_assets;
create policy s015_files_select on public.file_assets for select using (
  (
    visibility in ('client_visible', 'client_uploaded', 'final_delivery')
    and version_id is not null
    and public.s015_client_current_version_is_visible(
      file_assets.tenant_id,
      file_assets.client_id,
      file_assets.deliverable_id,
      file_assets.version_id
    )
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);
