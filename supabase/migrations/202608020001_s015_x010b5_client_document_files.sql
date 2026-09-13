-- Spec 015 X010-B-5 corrective: let an active client read and download their
-- standalone document files (contract_file / report_file / brand_asset) inside
-- their own tenant/client scope only. These visibilities are not bound to a
-- deliverable version, so the existing version-gated client policy and the
-- deliverable-INNER-JOIN storage helper both excluded them.
--
-- Additive and replayable: it recreates one policy and one SECURITY DEFINER
-- helper with the same existing logic plus a new document branch. It does not
-- touch internal_only secrecy, Client A/B isolation, disabled-membership
-- denial, or the version-gated review/delivery flow. No historical migration
-- is edited.

-- 1. file_assets SELECT: add a client branch for standalone documents. No
--    version_id or deliverable status is required (these are client-scoped
--    documents, not review/delivery assets). internal_only stays excluded by
--    enumeration; tenant/client isolation comes from f001_active_client_member
--    matching the row's tenant_id/client_id.
drop policy if exists s015_files_select on public.file_assets;
create policy s015_files_select on public.file_assets for select using (
  (
    visibility in ('client_visible', 'client_uploaded', 'final_delivery')
    and (
      visibility <> 'final_delivery'
      or exists (
        select 1
        from public.deliverables d
        where d.id = file_assets.deliverable_id
          and d.tenant_id = file_assets.tenant_id
          and d.client_id = file_assets.client_id
          and d.status = 'delivered'
      )
    )
    and version_id is not null
    and public.s015_client_current_version_is_visible(
      file_assets.tenant_id,
      file_assets.client_id,
      file_assets.deliverable_id,
      file_assets.version_id
    )
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
  or (
    visibility in ('contract_file', 'report_file', 'brand_asset')
    and public.f001_active_client_member(tenant_id, client_id)
    and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id)
  )
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);

-- 2. Storage read helper: switch the deliverable join to a LEFT JOIN so files
--    without a deliverable (standalone documents) can still match, guard the
--    deliverable-bound branches on d.id is not null, and add a document branch
--    that authorizes an active client member for the document visibilities.
create or replace function private.s015_can_read_storage_object(
  target_bucket_id text,
  target_name text
)
returns boolean
language sql
security definer
set search_path = public, storage
stable
as $$
  select target_bucket_id = 'deliverable-assets' and exists (
    select 1
    from public.file_assets f
    left join public.deliverables d
      on d.tenant_id = f.tenant_id
     and d.client_id = f.client_id
     and d.id = f.deliverable_id
    where f.bucket_id = target_bucket_id
      and f.storage_path = target_name
      and f.upload_state = 'ready'
      and (
        (
          d.id is not null
          and private.s015_team_can_execute_deliverable(d)
        )
        or (
          d.id is not null
          and public.f001_active_client_member(f.tenant_id, f.client_id)
          and public.f001_has_active_role(
            f.tenant_id,
            array['client_admin','client_approver','client_viewer'],
            'client', f.client_id
          )
          and f.visibility in ('client_visible','client_uploaded','final_delivery')
          and (f.visibility <> 'final_delivery' or d.status = 'delivered')
          and public.s015_client_current_version_is_visible(
            f.tenant_id, f.client_id, f.deliverable_id, f.version_id
          )
        )
        or (
          f.visibility in ('contract_file','report_file','brand_asset')
          and public.f001_active_client_member(f.tenant_id, f.client_id)
          and public.f001_has_active_role(
            f.tenant_id,
            array['client_admin','client_approver','client_viewer'],
            'client', f.client_id
          )
        )
      )
  );
$$;

revoke all on function private.s015_can_read_storage_object(text, text)
  from public, anon, authenticated;
grant execute on function private.s015_can_read_storage_object(text, text)
  to authenticated;
