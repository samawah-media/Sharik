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
  and exists (
    select 1
    from public.deliverable_versions v
    where v.id = deliverables.current_version_id
      and v.tenant_id = deliverables.tenant_id
      and v.client_id = deliverables.client_id
      and v.deliverable_id = deliverables.id
      and v.status in ('client_visible', 'client_approved', 'final')
  )
);

-- Keep direct version reads aligned with the same exact current-version rule.
drop policy if exists s015_versions_select on public.deliverable_versions;
create policy s015_versions_select on public.deliverable_versions for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
  or (
    status in ('client_visible','client_approved','final')
    and exists (
      select 1
      from public.deliverables d
      where d.id = deliverable_versions.deliverable_id
        and d.tenant_id = deliverable_versions.tenant_id
        and d.client_id = deliverable_versions.client_id
        and d.current_version_id = deliverable_versions.id
        and d.status in ('waiting_client_approval', 'client_approved', 'ready_for_delivery', 'delivered')
    )
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
);

drop policy if exists s015_comments_select on public.comments;
create policy s015_comments_select on public.comments for select using (
  (
    visibility = 'client_visible'
    and version_id is not null
    and exists (
      select 1
      from public.deliverables d
      join public.deliverable_versions v on v.id = d.current_version_id
      where d.id = comments.deliverable_id
        and d.tenant_id = comments.tenant_id
        and d.client_id = comments.client_id
        and v.id = comments.version_id
        and v.status in ('client_visible', 'client_approved', 'final')
        and d.status in ('waiting_client_approval', 'client_approved', 'ready_for_delivery', 'delivered')
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
    and exists (
      select 1
      from public.deliverables d
      join public.deliverable_versions v on v.id = d.current_version_id
      where d.id = file_assets.deliverable_id
        and d.tenant_id = file_assets.tenant_id
        and d.client_id = file_assets.client_id
        and v.id = file_assets.version_id
        and v.status in ('client_visible', 'client_approved', 'final')
        and d.status in ('waiting_client_approval', 'client_approved', 'ready_for_delivery', 'delivered')
    )
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);
