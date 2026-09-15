-- Spec 015 X010-A corrective: harden durable upload authorization and cancel cleanup.
-- Additive correction for S015-P1-111 and S015-P1-112.
--
-- The durable upload path introduced by 202607290002 relied only on
-- private.s015_upload_attempt_actor_allowed, which never re-checked the
-- role -> visibility, is_final <-> final_delivery, version-state, and
-- client_viewer/execution-member boundaries that 202607130006 enforced at
-- registration. This migration restores those boundaries as a single
-- centralized helper applied at begin, retry, and complete (re-checked at
-- completion), and makes cancel return the attempt's true Storage coordinates
-- so the server action never trusts a browser-supplied deletion path.

-- ---------------------------------------------------------------------------
-- Centralized upload-authorization helpers.
-- ---------------------------------------------------------------------------

-- Classify the authenticated actor against an upload target. Returns
-- 'management', 'team_execution', 'client', or NULL (denied).
-- Management = the approved administrative roles only (tenant or client scope).
-- team_execution = assigned owner/contributor with an active execution role.
-- client = active client member with client_admin/client_approver (client_viewer
-- alone is intentionally excluded so it can never upload).
create or replace function private.s015_upload_actor_kind(
  target_deliverable public.deliverables
)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.f001_has_active_role(
           target_deliverable.tenant_id,
           array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
           'tenant', target_deliverable.tenant_id)
      or public.f001_has_active_role(
           target_deliverable.tenant_id,
           array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
           'client', target_deliverable.client_id)
      then 'management'
    when (
           target_deliverable.owner_user_id = auth.uid()
           or auth.uid() = any(coalesce(target_deliverable.contributor_user_ids, array[]::uuid[]))
         )
      and public.f001_has_active_role(
           target_deliverable.tenant_id,
           array['account_manager','content_writer','designer','performance_specialist'],
           'client', target_deliverable.client_id)
      then 'team_execution'
    when public.f001_active_client_member(
           target_deliverable.tenant_id, target_deliverable.client_id)
      and public.f001_has_active_role(
           target_deliverable.tenant_id,
           array['client_admin','client_approver'],
           'client', target_deliverable.client_id)
      then 'client'
    else null
  end;
$$;

revoke all on function private.s015_upload_actor_kind(public.deliverables)
  from public, anon, authenticated;

-- Enforce the visibility / is_final / version-state matrix for a classified
-- actor. Any visibility other than final_delivery requires is_final = false.
create or replace function private.s015_upload_visibility_allowed(
  actor_kind text,
  target_deliverable public.deliverables,
  target_version public.deliverable_versions,
  target_visibility text,
  target_is_final boolean
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case
    when actor_kind = 'client' then
      target_visibility = 'client_uploaded'
      and target_is_final = false
      and public.s015_client_current_version_is_visible(
            target_deliverable.tenant_id, target_deliverable.client_id,
            target_deliverable.id, target_version.id)
    when actor_kind = 'team_execution' then
      target_visibility = 'internal_only'
      and target_is_final = false
    when actor_kind = 'management' then
      (
        target_visibility = 'internal_only'
        and target_is_final = false
      )
      or (
        target_visibility = 'client_visible'
        and target_is_final = false
        and target_version.status in ('client_visible','client_approved','final')
      )
      or (
        target_visibility = 'final_delivery'
        and target_is_final = true
        and target_version.status in ('client_approved','final')
      )
    else false
  end;
$$;

revoke all on function private.s015_upload_visibility_allowed(text, public.deliverables, public.deliverable_versions, text, boolean)
  from public, anon, authenticated;

-- Combined assertion used by begin/retry/complete. Raises 42501 on denial and
-- returns the resolved actor kind otherwise.
create or replace function private.s015_assert_upload_authorized(
  target_deliverable public.deliverables,
  target_version public.deliverable_versions,
  target_visibility text,
  target_is_final boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_kind text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  actor_kind := private.s015_upload_actor_kind(target_deliverable);
  if actor_kind is null
    or not private.s015_upload_visibility_allowed(
           actor_kind, target_deliverable, target_version,
           target_visibility, target_is_final) then
    raise exception 'file upload denied' using errcode = '42501';
  end if;
  return actor_kind;
end;
$$;

revoke all on function private.s015_assert_upload_authorized(public.deliverables, public.deliverable_versions, text, boolean)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- begin: enforce the full matrix before persisting the attempt.
-- ---------------------------------------------------------------------------
create or replace function public.s015_begin_file_upload_attempt(
  target_attempt_id uuid,
  target_file_id uuid,
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_bucket_id text,
  target_storage_path text,
  target_file_name text,
  target_file_type text,
  target_file_size bigint,
  target_visibility text,
  target_is_final boolean,
  target_replaces_file_id uuid,
  target_run_id text,
  request_idempotency_key text,
  audit_event_id uuid
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
  existing_attempt public.file_upload_attempts%rowtype;
  replacement public.file_assets%rowtype;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_bucket_id <> 'deliverable-assets'
    or target_file_size < 1 or target_file_size > 104857600
    or target_file_type not in (
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/webm','application/pdf','text/plain'
    )
    or target_visibility not in (
      'internal_only','client_visible','client_uploaded','final_delivery'
    )
    or length(btrim(coalesce(target_file_name, ''))) < 1
    or length(btrim(coalesce(target_run_id, ''))) < 8
    or length(btrim(coalesce(request_idempotency_key, ''))) < 8 then
    raise exception 'invalid upload attempt metadata' using errcode = 'P0001';
  end if;

  select * into existing_attempt
  from public.file_upload_attempts a
  where a.tenant_id = (
      select d.tenant_id from public.deliverables d
      where d.id = target_deliverable_id and d.client_id = target_client_id
    )
    and a.idempotency_key = btrim(request_idempotency_key);
  if existing_attempt.id is not null then
    if existing_attempt.id <> target_attempt_id
      or existing_attempt.client_id <> target_client_id
      or existing_attempt.deliverable_id <> target_deliverable_id
      or existing_attempt.version_id <> target_version_id
      or existing_attempt.planned_file_id <> target_file_id
      or existing_attempt.storage_path <> target_storage_path
      or existing_attempt.file_name <> left(btrim(target_file_name), 255)
      or existing_attempt.file_type <> target_file_type
      or existing_attempt.file_size <> target_file_size
      or existing_attempt.run_id <> btrim(target_run_id) then
      raise exception 'upload attempt idempotency conflict' using errcode = 'P0001';
    end if;
    return existing_attempt.id;
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;
  select * into target_version
  from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;
  if target_deliverable.id is null
    or target_version.id is null
    or target_deliverable.current_version_id is distinct from target_version_id
    or target_storage_path <> concat(
      target_deliverable.tenant_id, '/', target_client_id, '/',
      target_deliverable_id, '/', target_version_id, '/',
      split_part(target_storage_path, '/', 5)
    ) then
    raise exception 'stale or cross-scope upload attempt' using errcode = '42501';
  end if;

  perform private.s015_assert_upload_authorized(
    target_deliverable, target_version, target_visibility, target_is_final);

  if target_replaces_file_id is not null then
    select * into replacement
    from public.file_assets f
    where f.id = target_replaces_file_id
      and f.tenant_id = target_deliverable.tenant_id
      and f.client_id = target_client_id
      and f.deliverable_id = target_deliverable_id
      and f.version_id = target_version_id
      and f.upload_state = 'ready';
    if replacement.id is null then
      raise exception 'replacement file scope denied' using errcode = '42501';
    end if;
  end if;

  insert into public.file_upload_attempts (
    id, tenant_id, client_id, deliverable_id, version_id, actor_user_id,
    planned_file_id, bucket_id, storage_path, file_name, file_type, file_size,
    visibility, is_final, status, progress_percentage, run_id,
    idempotency_key, replaces_file_id
  ) values (
    target_attempt_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, actor_user_id, target_file_id,
    target_bucket_id, target_storage_path, left(btrim(target_file_name), 255),
    target_file_type, target_file_size, target_visibility, target_is_final,
    'pending', 0, btrim(target_run_id), btrim(request_idempotency_key),
    target_replaces_file_id
  );
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'FileUploadAttemptStarted', 'allowed',
    'file_upload_attempt', target_attempt_id::text, btrim(target_run_id)
  );
  return target_attempt_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- retry: re-enforce the full matrix for the failed attempt's visibility.
-- ---------------------------------------------------------------------------
create or replace function public.s015_retry_file_upload_attempt(
  target_failed_attempt_id uuid,
  target_attempt_id uuid,
  target_file_id uuid,
  target_storage_path text,
  target_run_id text,
  request_idempotency_key text,
  cancel_audit_event_id uuid,
  retry_audit_event_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor uuid := auth.uid();
  failed_attempt public.file_upload_attempts%rowtype;
  existing_attempt public.file_upload_attempts%rowtype;
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
begin
  if current_actor is null
    or length(btrim(coalesce(target_run_id, ''))) < 8
    or length(btrim(coalesce(request_idempotency_key, ''))) < 8 then
    raise exception 'upload retry denied' using errcode = '42501';
  end if;
  select * into failed_attempt from public.file_upload_attempts
  where id = target_failed_attempt_id for update;
  if failed_attempt.id is null or failed_attempt.status <> 'failed' then
    raise exception 'upload retry denied' using errcode = '42501';
  end if;
  select * into target_deliverable from public.deliverables
  where id = failed_attempt.deliverable_id
    and tenant_id = failed_attempt.tenant_id
    and client_id = failed_attempt.client_id
  for update;
  select * into target_version from public.deliverable_versions
  where id = failed_attempt.version_id
    and deliverable_id = failed_attempt.deliverable_id
    and tenant_id = failed_attempt.tenant_id
    and client_id = failed_attempt.client_id;
  if target_deliverable.current_version_id is distinct from failed_attempt.version_id
    or target_version.id is null then
    raise exception 'stale or cross-scope upload retry' using errcode = '42501';
  end if;

  perform private.s015_assert_upload_authorized(
    target_deliverable, target_version,
    failed_attempt.visibility, failed_attempt.is_final);

  if target_storage_path <> concat(
      failed_attempt.tenant_id, '/', failed_attempt.client_id, '/',
      failed_attempt.deliverable_id, '/', failed_attempt.version_id, '/',
      split_part(target_storage_path, '/', 5)
    ) then
    raise exception 'stale or cross-scope upload retry' using errcode = '42501';
  end if;

  select * into existing_attempt from public.file_upload_attempts
  where tenant_id = failed_attempt.tenant_id
    and idempotency_key = btrim(request_idempotency_key);
  if existing_attempt.id is not null then
    if existing_attempt.retry_of_id <> failed_attempt.id
      or existing_attempt.id <> target_attempt_id
      or existing_attempt.planned_file_id <> target_file_id
      or existing_attempt.storage_path <> target_storage_path then
      raise exception 'upload retry idempotency conflict' using errcode = 'P0001';
    end if;
    return existing_attempt.id;
  end if;

  update public.file_upload_attempts
  set status = 'cancelled',
      cancellation_reason = 'retried',
      cancelled_at = now(),
      updated_at = now()
  where id = failed_attempt.id;
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    cancel_audit_event_id, failed_attempt.tenant_id, failed_attempt.client_id,
    current_actor, 'FileUploadAttemptCancelled', 'allowed',
    'file_upload_attempt', failed_attempt.id::text, 'retried'
  );
  insert into public.file_upload_attempts (
    id, tenant_id, client_id, deliverable_id, version_id, actor_user_id,
    planned_file_id, bucket_id, storage_path, file_name, file_type, file_size,
    visibility, is_final, status, progress_percentage, run_id,
    idempotency_key, retry_of_id, replaces_file_id
  ) values (
    target_attempt_id, failed_attempt.tenant_id, failed_attempt.client_id,
    failed_attempt.deliverable_id, failed_attempt.version_id, current_actor,
    target_file_id, failed_attempt.bucket_id, target_storage_path,
    failed_attempt.file_name, failed_attempt.file_type, failed_attempt.file_size,
    failed_attempt.visibility, failed_attempt.is_final, 'pending', 0,
    btrim(target_run_id), btrim(request_idempotency_key),
    failed_attempt.id, failed_attempt.replaces_file_id
  );
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    retry_audit_event_id, failed_attempt.tenant_id, failed_attempt.client_id,
    current_actor, 'FileUploadAttemptRetried', 'allowed',
    'file_upload_attempt', target_attempt_id::text, failed_attempt.id::text
  );
  return target_attempt_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete: re-check the matrix at completion so a role or version-state
-- change during transfer cannot let an unauthorized file register.
-- ---------------------------------------------------------------------------
create or replace function public.s015_complete_file_upload_attempt(
  target_attempt_id uuid,
  request_id uuid,
  audit_event_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  current_actor uuid := auth.uid();
  attempt public.file_upload_attempts%rowtype;
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  existing_file public.file_assets%rowtype;
begin
  if current_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into attempt from public.file_upload_attempts
  where id = target_attempt_id for update;
  if attempt.id is null then
    raise exception 'upload attempt not found' using errcode = 'P0001';
  end if;
  if attempt.status = 'ready' then
    return attempt.file_asset_id;
  end if;
  select * into target_deliverable from public.deliverables
  where id = attempt.deliverable_id
    and tenant_id = attempt.tenant_id
    and client_id = attempt.client_id
  for update;
  select * into target_version from public.deliverable_versions
  where id = attempt.version_id
    and deliverable_id = attempt.deliverable_id
    and tenant_id = attempt.tenant_id
    and client_id = attempt.client_id;
  if attempt.status <> 'pending'
    or target_deliverable.current_version_id is distinct from attempt.version_id
    or target_version.id is null then
    raise exception 'stale or unsettled upload attempt' using errcode = '42501';
  end if;
  perform private.s015_assert_upload_authorized(
    target_deliverable, target_version, attempt.visibility, attempt.is_final);
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = attempt.bucket_id and o.name = attempt.storage_path
  ) then
    raise exception 'uploaded object not found' using errcode = 'P0001';
  end if;

  select * into existing_file from public.file_assets
  where tenant_id = attempt.tenant_id
    and upload_idempotency_key = attempt.idempotency_key;
  if existing_file.id is not null then
    if existing_file.id <> attempt.planned_file_id
      or existing_file.storage_path <> attempt.storage_path
      or existing_file.version_id <> attempt.version_id then
      raise exception 'upload completion idempotency conflict' using errcode = 'P0001';
    end if;
  else
    insert into public.file_assets (
      id, tenant_id, client_id, deliverable_id, version_id, owner_user_id,
      visibility, bucket_id, storage_path, file_name, file_type, file_size,
      version_number, is_final, upload_idempotency_key, upload_state
    ) values (
      attempt.planned_file_id, attempt.tenant_id, attempt.client_id,
      attempt.deliverable_id, attempt.version_id, current_actor,
      attempt.visibility, attempt.bucket_id, attempt.storage_path,
      attempt.file_name, attempt.file_type, attempt.file_size,
      target_version.version_number, attempt.is_final,
      attempt.idempotency_key, 'ready'
    ) returning * into existing_file;
  end if;

  if attempt.replaces_file_id is not null then
    update public.file_assets
    set visibility = 'internal_only',
        is_final = false
    where id = attempt.replaces_file_id
      and tenant_id = attempt.tenant_id
      and client_id = attempt.client_id
      and deliverable_id = attempt.deliverable_id
      and version_id = attempt.version_id
      and upload_state = 'ready';
    if not found then
      raise exception 'replacement file scope denied' using errcode = '42501';
    end if;
    insert into public.audit_events (
      id, tenant_id, client_id, actor_user_id, action, decision,
      target_type, target_id, reason
    ) values (
      gen_random_uuid(), attempt.tenant_id, attempt.client_id, current_actor,
      'FileAssetSupersededByUploadAttempt', 'allowed', 'file_asset',
      attempt.replaces_file_id::text, attempt.id::text
    );
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, attempt.tenant_id, attempt.client_id, current_actor,
    'FileUploadAttemptReady', 'allowed', 'file_upload_attempt',
    attempt.id::text, attempt.file_name
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, attempt.tenant_id, attempt.client_id, attempt.deliverable_id,
    attempt.version_id, attempt.idempotency_key, 'complete_file_upload_attempt',
    'allowed', audit_event_id, now(), target_deliverable.status,
    target_deliverable.revision, target_version.status
  );
  update public.file_upload_attempts
  set status = 'ready',
      progress_percentage = 100,
      file_asset_id = existing_file.id,
      ready_at = now(),
      updated_at = now()
  where id = attempt.id;
  return existing_file.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel: return the attempt's true Storage coordinates so the server action
-- deletes only the object that belongs to the cancelled attempt and never a
-- browser-supplied path. The return type changes from void to a typed row;
-- the parameter list (the grant identity) is unchanged.
-- ---------------------------------------------------------------------------
drop function if exists public.s015_cancel_file_upload_attempt(uuid, text, uuid);

create function public.s015_cancel_file_upload_attempt(
  target_attempt_id uuid,
  target_reason text,
  audit_event_id uuid
)
returns table(bucket_id text, storage_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor uuid := auth.uid();
  attempt public.file_upload_attempts%rowtype;
  target_deliverable public.deliverables%rowtype;
begin
  if current_actor is null or length(btrim(coalesce(target_reason, ''))) < 3 then
    raise exception 'upload cancellation denied' using errcode = '42501';
  end if;
  select * into attempt from public.file_upload_attempts
  where id = target_attempt_id for update;
  select * into target_deliverable from public.deliverables
  where id = attempt.deliverable_id
    and tenant_id = attempt.tenant_id
    and client_id = attempt.client_id;
  if attempt.id is null or attempt.status not in ('pending','failed')
    or not private.s015_upload_attempt_actor_allowed(target_deliverable) then
    raise exception 'upload cancellation denied' using errcode = '42501';
  end if;
  update public.file_upload_attempts
  set status = 'cancelled',
      cancellation_reason = left(btrim(target_reason), 200),
      cancelled_at = now(),
      updated_at = now()
  where id = attempt.id;
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, attempt.tenant_id, attempt.client_id, current_actor,
    'FileUploadAttemptCancelled', 'allowed', 'file_upload_attempt',
    attempt.id::text, left(btrim(target_reason), 200)
  );
  return query select attempt.bucket_id, attempt.storage_path;
end;
$$;

revoke all on function public.s015_cancel_file_upload_attempt(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.s015_cancel_file_upload_attempt(uuid, text, uuid)
  to authenticated;

-- Keep the public-function privilege surface aligned with 202607290002 for the
-- replaced begin/retry/complete bodies (same signatures).
revoke all on function public.s015_begin_file_upload_attempt(
  uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,text,text,uuid
), public.s015_retry_file_upload_attempt(uuid,uuid,uuid,text,text,text,uuid,uuid),
public.s015_complete_file_upload_attempt(uuid,uuid,uuid)
from public, anon, authenticated;

grant execute on function public.s015_begin_file_upload_attempt(
  uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,text,text,uuid
), public.s015_retry_file_upload_attempt(uuid,uuid,uuid,text,text,text,uuid,uuid),
public.s015_complete_file_upload_attempt(uuid,uuid,uuid)
to authenticated;
