-- Spec 015 X009-D: explicitly stage one reviewed current-version file for
-- client review without making the version readable before send-to-client.

create or replace function public.s015_stage_file_for_client_review(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_file_id uuid,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  target_file public.file_assets%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  existing_audit public.audit_events%rowtype;
  management_allowed boolean;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_file_id is null
    or target_version_id is null
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid client-review file input' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;

  select * into target_version
  from public.deliverable_versions v
  where v.id = target_version_id
    and v.deliverable_id = target_deliverable_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
  for update;
  select * into target_file
  from public.file_assets f
  where f.id = target_file_id
    and f.version_id = target_version_id
    and f.deliverable_id = target_deliverable_id
    and f.tenant_id = target_deliverable.tenant_id
    and f.client_id = target_client_id
  for update;
  if target_version.id is null
    or target_file.id is null
    or target_deliverable.current_version_id is distinct from target_version_id then
    raise exception 'stale or cross-scope client-review file' using errcode = '42501';
  end if;

  management_allowed :=
    public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant',
      target_deliverable.tenant_id
    )
    or public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client',
      target_client_id
    );
  if not coalesce(management_allowed, false) then
    raise exception 'client-review file staging denied' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    select * into existing_audit
    from public.audit_events a
    where a.id = existing_request.audit_event_id;
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'stage_file_for_client_review'
      or existing_audit.action <> 'FileAssetStagedForClientReview'
      or existing_audit.target_type <> 'file_asset'
      or existing_audit.target_id <> target_file_id::text then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return target_file_id;
  end if;

  if target_deliverable.status <> 'internally_approved'
    or target_version.status <> 'internally_approved'
    or not target_deliverable.requires_client_approval then
    raise exception 'internally approved current version required' using errcode = 'P0001';
  end if;
  if target_file.upload_state <> 'ready'
    or target_file.file_size < 1
    or target_file.visibility not in ('internal_only', 'client_visible')
    or target_file.is_final then
    raise exception 'file is not eligible for client review' using errcode = 'P0001';
  end if;

  update public.file_assets
  set visibility = 'client_visible'
  where id = target_file_id
    and tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id
    and deliverable_id = target_deliverable_id
    and version_id = target_version_id;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'FileAssetStagedForClientReview', 'allowed',
    'file_asset', target_file_id::text, 'stage_file_for_client_review'
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'stage_file_for_client_review', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, target_version.status
  );

  return target_file_id;
end;
$$;

revoke all on function public.s015_stage_file_for_client_review(
  uuid, uuid, uuid, uuid, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_stage_file_for_client_review(
  uuid, uuid, uuid, uuid, uuid, uuid, text
) to authenticated;
