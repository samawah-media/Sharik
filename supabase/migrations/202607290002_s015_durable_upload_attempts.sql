-- Spec 015 X010-A-1/2: durable, exact-version upload attempts.
-- An attempt is persisted before Storage transfer and remains a workflow blocker
-- until it is completed successfully or explicitly cancelled.

create table public.file_upload_attempts (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid not null,
  actor_user_id uuid not null,
  planned_file_id uuid not null,
  bucket_id text not null check (bucket_id = 'deliverable-assets'),
  storage_path text not null,
  file_name text not null check (length(btrim(file_name)) > 0),
  file_type text not null check (
    file_type in (
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/webm','application/pdf','text/plain'
    )
  ),
  file_size bigint not null check (file_size between 1 and 104857600),
  visibility text not null check (
    visibility in ('internal_only','client_visible','client_uploaded','final_delivery')
  ),
  is_final boolean not null default false,
  status text not null check (status in ('pending','ready','failed','cancelled')),
  progress_percentage integer not null default 0
    check (progress_percentage between 0 and 100),
  run_id text not null check (length(btrim(run_id)) >= 8),
  idempotency_key text not null check (length(btrim(idempotency_key)) >= 8),
  retry_of_id uuid references public.file_upload_attempts(id),
  replaces_file_id uuid references public.file_assets(id),
  file_asset_id uuid references public.file_assets(id),
  failure_code text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ready_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  constraint file_upload_attempts_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint file_upload_attempts_version_scope
    foreign key (version_id, deliverable_id, tenant_id, client_id)
    references public.deliverable_versions(id, deliverable_id, tenant_id, client_id),
  constraint file_upload_attempts_unique_run unique (tenant_id, idempotency_key),
  constraint file_upload_attempts_unique_storage unique (bucket_id, storage_path),
  constraint file_upload_attempts_terminal_shape check (
    (status = 'ready' and file_asset_id is not null and ready_at is not null)
    or (status = 'failed' and failure_code is not null and failed_at is not null)
    or (status = 'cancelled' and cancellation_reason is not null and cancelled_at is not null)
    or status = 'pending'
  )
);

create index file_upload_attempts_blocking_scope
  on public.file_upload_attempts (tenant_id, client_id, deliverable_id, version_id, status)
  where status in ('pending','failed');

alter table public.file_upload_attempts enable row level security;

create policy s015_upload_attempts_select
  on public.file_upload_attempts
  for select
  using (
    public.f001_has_active_role(
      tenant_id,
      array[
        'tenant_owner','tenant_administrator','project_manager',
        'marketing_manager','account_manager','content_writer','designer'
      ],
      'client',
      client_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array[
        'tenant_owner','tenant_administrator','project_manager','marketing_manager'
      ],
      'tenant',
      tenant_id
    )
  );

revoke all on public.file_upload_attempts from public, anon, authenticated;
grant select on public.file_upload_attempts to authenticated;
grant select, insert, update, delete on public.file_upload_attempts to service_role;

create or replace function private.s015_upload_attempt_actor_allowed(
  target_deliverable public.deliverables
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select private.s015_team_can_execute_deliverable(target_deliverable)
    or (
      public.f001_active_client_member(
        target_deliverable.tenant_id,
        target_deliverable.client_id
      )
      and public.f001_has_active_role(
        target_deliverable.tenant_id,
        array['client_admin','client_approver'],
        'client',
        target_deliverable.client_id
      )
      and public.s015_client_current_version_is_visible(
        target_deliverable.tenant_id,
        target_deliverable.client_id,
        target_deliverable.id,
        target_deliverable.current_version_id
      )
    );
$$;

revoke all on function private.s015_upload_attempt_actor_allowed(public.deliverables)
  from public, anon, authenticated;
grant execute on function private.s015_upload_attempt_actor_allowed(public.deliverables)
  to authenticated;

create or replace function public.s015_list_unsettled_file_upload_attempts(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid
)
returns setof public.file_upload_attempts
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  target_deliverable public.deliverables%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id;
  if target_deliverable.id is null
    or target_deliverable.current_version_id is distinct from target_version_id
    or not private.s015_upload_attempt_actor_allowed(target_deliverable) then
    raise exception 'upload attempt recovery denied' using errcode = '42501';
  end if;
  return query
    select a.*
    from public.file_upload_attempts a
    where a.tenant_id = target_deliverable.tenant_id
      and a.client_id = target_client_id
      and a.deliverable_id = target_deliverable_id
      and a.version_id = target_version_id
      and a.status in ('pending', 'failed')
    order by a.created_at desc;
end;
$$;

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
  if not private.s015_upload_attempt_actor_allowed(target_deliverable) then
    raise exception 'file upload denied' using errcode = '42501';
  end if;

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

create or replace function public.s015_update_file_upload_attempt_progress(
  target_attempt_id uuid,
  target_progress_percentage integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor uuid := auth.uid();
begin
  if current_actor is null or target_progress_percentage not between 0 and 99 then
    raise exception 'upload progress denied' using errcode = '42501';
  end if;
  update public.file_upload_attempts
  set progress_percentage = greatest(progress_percentage, target_progress_percentage),
      updated_at = now()
  where id = target_attempt_id
    and actor_user_id = current_actor
    and status = 'pending';
  if not found then
    raise exception 'upload progress denied' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.s015_fail_file_upload_attempt(
  target_attempt_id uuid,
  target_failure_code text,
  target_progress_percentage integer,
  audit_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor uuid := auth.uid();
  attempt public.file_upload_attempts%rowtype;
begin
  if current_actor is null or length(btrim(coalesce(target_failure_code, ''))) < 1
    or target_progress_percentage not between 0 and 99 then
    raise exception 'upload failure denied' using errcode = '42501';
  end if;
  select * into attempt from public.file_upload_attempts
  where id = target_attempt_id for update;
  if attempt.id is null or attempt.actor_user_id <> current_actor
    or attempt.status <> 'pending' then
    raise exception 'upload failure denied' using errcode = '42501';
  end if;
  update public.file_upload_attempts
  set status = 'failed',
      progress_percentage = greatest(progress_percentage, target_progress_percentage),
      failure_code = left(btrim(target_failure_code), 120),
      failed_at = now(),
      updated_at = now()
  where id = attempt.id;
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, attempt.tenant_id, attempt.client_id, current_actor,
    'FileUploadAttemptFailed', 'allowed', 'file_upload_attempt',
    attempt.id::text, left(btrim(target_failure_code), 120)
  );
end;
$$;

create or replace function public.s015_cancel_file_upload_attempt(
  target_attempt_id uuid,
  target_reason text,
  audit_event_id uuid
)
returns void
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
end;
$$;

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
  if target_deliverable.current_version_id is distinct from failed_attempt.version_id
    or not private.s015_upload_attempt_actor_allowed(target_deliverable)
    or target_storage_path <> concat(
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
    or target_version.id is null
    or not private.s015_upload_attempt_actor_allowed(target_deliverable) then
    raise exception 'stale or unsettled upload attempt' using errcode = '42501';
  end if;
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

-- The historical registration entry point now requires a matching durable
-- pre-transfer attempt and delegates atomic completion to that attempt.
create or replace function public.s015_register_file_asset(
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
  attempt public.file_upload_attempts%rowtype;
begin
  select * into attempt
  from public.file_upload_attempts a
  where a.idempotency_key = btrim(request_idempotency_key)
    and a.client_id = target_client_id
    and a.deliverable_id = target_deliverable_id
    and a.version_id = target_version_id;
  if attempt.id is null
    or attempt.planned_file_id <> target_file_id
    or attempt.bucket_id <> target_bucket_id
    or attempt.storage_path <> target_storage_path
    or attempt.file_name <> left(btrim(target_file_name), 255)
    or attempt.file_type <> target_file_type
    or attempt.file_size <> target_file_size
    or attempt.visibility <> target_visibility
    or attempt.is_final <> target_is_final then
    raise exception 'durable upload attempt required' using errcode = 'P0001';
  end if;
  return public.s015_complete_file_upload_attempt(
    attempt.id, request_id, audit_event_id
  );
end;
$$;

create or replace function private.s015_block_unsettled_upload_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('waiting_client_approval','ready_for_delivery','delivered')
    and new.current_version_id is not null
    and exists (
      select 1
      from public.file_upload_attempts a
      where a.tenant_id = new.tenant_id
        and a.client_id = new.client_id
        and a.deliverable_id = new.id
        and a.version_id = new.current_version_id
        and a.status in ('pending','failed')
    ) then
    raise exception 'unsettled exact-version upload attempt' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists s015_block_unsettled_upload_transition on public.deliverables;
create trigger s015_block_unsettled_upload_transition
before update of status on public.deliverables
for each row
when (old.status is distinct from new.status)
execute function private.s015_block_unsettled_upload_transition();

revoke all on function public.s015_begin_file_upload_attempt(
  uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,text,text,uuid
), public.s015_list_unsettled_file_upload_attempts(uuid,uuid,uuid),
public.s015_update_file_upload_attempt_progress(uuid,integer),
public.s015_fail_file_upload_attempt(uuid,text,integer,uuid),
public.s015_cancel_file_upload_attempt(uuid,text,uuid),
public.s015_retry_file_upload_attempt(uuid,uuid,uuid,text,text,text,uuid,uuid),
public.s015_complete_file_upload_attempt(uuid,uuid,uuid)
from public, anon, authenticated;

grant execute on function public.s015_begin_file_upload_attempt(
  uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,text,text,uuid
), public.s015_list_unsettled_file_upload_attempts(uuid,uuid,uuid),
public.s015_update_file_upload_attempt_progress(uuid,integer),
public.s015_fail_file_upload_attempt(uuid,text,integer,uuid),
public.s015_cancel_file_upload_attempt(uuid,text,uuid),
public.s015_retry_file_upload_attempt(uuid,uuid,uuid,text,text,text,uuid,uuid),
public.s015_complete_file_upload_attempt(uuid,uuid,uuid)
to authenticated;
