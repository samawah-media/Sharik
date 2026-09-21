-- SIL-52 / ADR-013: retain one explicitly sent snapshot during internal rework.
-- Exact-current workflow helpers stay unchanged. Only direct publication-audit
-- insertion is restricted: publication authority must come from trusted RPCs.
drop policy if exists "f001 audit insert own tenant" on public.audit_events;
create policy "f001 audit insert own tenant"
on public.audit_events for insert
with check (
  public.f001_active_tenant_member(tenant_id)
  and action <> 'DeliverableVersionSentToClient'
);

create or replace function public.s015_client_readable_version_is_visible(
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
begin
  if auth.uid() is null
    or not public.f001_active_client_member(target_tenant_id, target_client_id)
    or not public.f001_has_active_role(
      target_tenant_id, array['client_admin','client_approver','client_viewer'],
      'client', target_client_id
    ) then
    return false;
  end if;
  -- Preserve legacy client current-visible/final records without audit backfill.
  if public.s015_client_current_version_is_visible(
    target_tenant_id, target_client_id, target_deliverable_id, target_version_id
  ) then
    return true;
  end if;
  return exists (
    select 1
    from public.deliverables d
    join public.deliverable_versions working
      on working.id = d.current_version_id
     and working.tenant_id = d.tenant_id
     and working.client_id = d.client_id
     and working.deliverable_id = d.id
    cross join lateral (
      select sent.id, sent.status, sent.version_number
      from public.audit_events a
      join public.deliverable_versions sent
        on a.target_id = sent.id::text
       and sent.tenant_id = a.tenant_id
       and sent.client_id = a.client_id
      where a.tenant_id = d.tenant_id
        and a.client_id = d.client_id
        and sent.deliverable_id = d.id
        and a.target_type = 'deliverable_version'
        and a.action = 'DeliverableVersionSentToClient'
        and a.decision = 'allowed'
      -- Rank all valid sends before testing visibility; never skip a latest
      -- publication that is no longer readable to resurrect an older version.
      order by a.occurred_at desc, sent.version_number desc, a.id desc
      limit 1
    ) published
    where d.tenant_id = target_tenant_id
      and d.client_id = target_client_id
      and d.id = target_deliverable_id
      and d.status in (
        'client_changes_requested', 'in_progress', 'ready_for_internal_review',
        'internal_changes_requested', 'internally_approved'
      )
      and working.status in ('draft', 'internal_only', 'internally_approved')
      and working.version_number > published.version_number
      and published.id = target_version_id
      and published.status in ('client_visible', 'client_approved', 'final')
  );
end;
$$;

revoke all on function public.s015_client_readable_version_is_visible(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.s015_client_readable_version_is_visible(uuid, uuid, uuid, uuid)
  to authenticated;

-- Permissive team RLS may expose several versions to mixed-role users. The
-- client projection must explicitly select its designated review snapshot.
create or replace function public.s015_client_readable_versions(
  target_tenant_id uuid,
  target_client_id uuid,
  target_deliverable_ids uuid[]
)
returns table (deliverable_id uuid, version_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select v.deliverable_id, v.id
  from public.deliverable_versions v
  where v.tenant_id = target_tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = any(target_deliverable_ids)
    and public.s015_client_readable_version_is_visible(
      v.tenant_id, v.client_id, v.deliverable_id, v.id
    );
$$;

revoke all on function public.s015_client_readable_versions(uuid, uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.s015_client_readable_versions(uuid, uuid, uuid[])
  to authenticated;

-- The working pointer is not the read candidate. Version RLS delegates to
-- the nonrecursive SECURITY DEFINER predicate above.
drop policy if exists "f006 client portal select deliverables" on public.deliverables;
create policy "f006 client portal select deliverables"
on public.deliverables for select to authenticated using (
  public.f001_active_client_member(tenant_id, client_id)
  and public.f001_has_active_role(
    tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id
  )
  and exists (
    select 1 from public.deliverable_versions v
    where v.tenant_id = deliverables.tenant_id
      and v.client_id = deliverables.client_id
      and v.deliverable_id = deliverables.id
      and public.s015_client_readable_version_is_visible(
        v.tenant_id, v.client_id, v.deliverable_id, v.id
      )
  )
);

drop policy if exists s015_versions_select on public.deliverable_versions;
create policy s015_versions_select on public.deliverable_versions for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
  or (
    status in ('client_visible','client_approved','final')
    and public.s015_client_readable_version_is_visible(
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
    and public.s015_client_readable_version_is_visible(
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
    and public.s015_client_readable_version_is_visible(
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
          and public.s015_client_readable_version_is_visible(
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


-- Author display follows readable comments, not the internal working pointer.
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
      'tenant', target_tenant_id
    )
    or exists (
      select 1
      from public.deliverables d
      where d.tenant_id = target_tenant_id
        and public.f001_has_active_role(
          d.tenant_id,
          array['account_manager', 'content_writer', 'designer', 'performance_specialist'],
          'client', d.client_id
        )
        and (
          d.owner_user_id = target_user_id
          or target_user_id = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
          or exists (
            select 1 from public.deliverable_tasks t
            where t.tenant_id = d.tenant_id
              and t.client_id = d.client_id
              and t.deliverable_id = d.id
              and t.assignee_user_id = target_user_id
          )
          or exists (
            select 1 from public.comments c
            where c.tenant_id = d.tenant_id
              and c.client_id = d.client_id
              and c.deliverable_id = d.id
              and c.author_user_id = target_user_id
          )
          or exists (
            select 1 from public.approval_decisions a
            where a.tenant_id = d.tenant_id
              and a.client_id = d.client_id
              and a.deliverable_id = d.id
              and a.actor_user_id = target_user_id
          )
        )
    )
    or exists (
      select 1
      from public.comments c
      join public.deliverables d
        on d.tenant_id = c.tenant_id
       and d.client_id = c.client_id
       and d.id = c.deliverable_id
      where c.tenant_id = target_tenant_id
        and c.author_user_id = target_user_id
        and c.visibility = 'client_visible'
        and public.s015_client_readable_version_is_visible(
          d.tenant_id, d.client_id, d.id, c.version_id
        )
    );
$$;

revoke all on function private.s015_can_read_member_profile(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.s015_can_read_member_profile(uuid, uuid)
  to authenticated;
