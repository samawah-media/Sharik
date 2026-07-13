-- Spec 015 X006: private Supabase Storage authorization and audited metadata.

create or replace function private.s015_storage_scope(object_name text)
returns table (tenant_id uuid, client_id uuid, deliverable_id uuid, version_id uuid)
language plpgsql
immutable
set search_path = public
as $$
begin
  if object_name !~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+$' then
    return;
  end if;
  begin
    tenant_id := split_part(object_name, '/', 1)::uuid;
    client_id := split_part(object_name, '/', 2)::uuid;
    deliverable_id := split_part(object_name, '/', 3)::uuid;
    version_id := split_part(object_name, '/', 4)::uuid;
  exception when invalid_text_representation then
    return;
  end;
  return next;
end;
$$;

create or replace function private.s015_can_upload_storage_object(
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
    from private.s015_storage_scope(target_name) s
    join public.deliverables d
      on d.tenant_id = s.tenant_id
     and d.client_id = s.client_id
     and d.id = s.deliverable_id
     and d.current_version_id = s.version_id
    join public.deliverable_versions v
      on v.tenant_id = d.tenant_id
     and v.client_id = d.client_id
     and v.deliverable_id = d.id
     and v.id = s.version_id
    where private.s015_team_can_execute_deliverable(d)
      or (
        public.f001_active_client_member(d.tenant_id, d.client_id)
        and public.f001_has_active_role(
          d.tenant_id,
          array['client_admin','client_approver','client_viewer'],
          'client', d.client_id
        )
        and public.s015_client_current_version_is_visible(
          d.tenant_id, d.client_id, d.id, v.id
        )
      )
  );
$$;

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
    join public.deliverables d
      on d.tenant_id = f.tenant_id
     and d.client_id = f.client_id
     and d.id = f.deliverable_id
    where f.bucket_id = target_bucket_id
      and f.storage_path = target_name
      and f.upload_state = 'ready'
      and (
        private.s015_team_can_execute_deliverable(d)
        or (
          public.f001_active_client_member(f.tenant_id, f.client_id)
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
      )
  );
$$;

revoke all on function private.s015_storage_scope(text),
  private.s015_can_upload_storage_object(text,text),
  private.s015_can_read_storage_object(text,text)
  from public, anon, authenticated;
grant execute on function private.s015_storage_scope(text),
  private.s015_can_upload_storage_object(text,text),
  private.s015_can_read_storage_object(text,text)
  to authenticated;

drop policy if exists s015_deliverable_assets_insert on storage.objects;
create policy s015_deliverable_assets_insert on storage.objects
  for insert to authenticated
  with check (private.s015_can_upload_storage_object(bucket_id, name));

drop policy if exists s015_deliverable_assets_select on storage.objects;
create policy s015_deliverable_assets_select on storage.objects
  for select to authenticated
  using (private.s015_can_read_storage_object(bucket_id, name));

drop policy if exists s015_deliverable_assets_cleanup on storage.objects;
create policy s015_deliverable_assets_cleanup on storage.objects
  for delete to authenticated
  using (
    owner_id = auth.uid()::text
    and private.s015_can_upload_storage_object(bucket_id, name)
  );

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
set search_path = public, storage
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  existing_file public.file_assets%rowtype;
  is_management boolean;
  is_client boolean;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_bucket_id <> 'deliverable-assets'
    or target_file_size < 1 or target_file_size > 104857600
    or target_file_type not in ('image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf','text/plain')
    or target_visibility not in ('internal_only','client_visible','client_uploaded','final_delivery')
    or length(btrim(coalesce(target_file_name, ''))) < 1
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid file metadata' using errcode = 'P0001';
  end if;

  select * into target_deliverable from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  select * into target_version from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;
  if target_deliverable.id is null or target_version.id is null
    or target_deliverable.current_version_id is distinct from target_version_id
    or target_storage_path <> concat(
      target_deliverable.tenant_id, '/', target_client_id, '/',
      target_deliverable_id, '/', target_version_id, '/',
      split_part(target_storage_path, '/', 5)
    ) then
    raise exception 'file scope denied' using errcode = '42501';
  end if;

  is_management :=
    public.f001_has_active_role(target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', target_deliverable.tenant_id)
    or public.f001_has_active_role(target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', target_client_id);
  is_client := public.f001_active_client_member(
      target_deliverable.tenant_id, target_client_id)
    and public.f001_has_active_role(target_deliverable.tenant_id,
      array['client_admin','client_approver','client_viewer'],
      'client', target_client_id);

  if is_client then
    if target_visibility <> 'client_uploaded'
      or not public.s015_client_current_version_is_visible(
        target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, target_version_id) then
      raise exception 'client upload denied' using errcode = '42501';
    end if;
  elsif not private.s015_team_can_execute_deliverable(target_deliverable) then
    raise exception 'file upload denied' using errcode = '42501';
  elsif target_visibility in ('client_visible','final_delivery') and not is_management then
    raise exception 'file visibility denied' using errcode = '42501';
  elsif target_visibility = 'client_visible'
    and target_version.status not in ('client_visible','client_approved','final') then
    raise exception 'client-visible file requires sent version' using errcode = 'P0001';
  elsif target_visibility = 'final_delivery'
    and (not target_is_final or target_version.status not in ('client_approved','final')) then
    raise exception 'final file requires approved version' using errcode = 'P0001';
  end if;

  select * into existing_file from public.file_assets f
  where f.tenant_id = target_deliverable.tenant_id
    and f.upload_idempotency_key = btrim(request_idempotency_key);
  if existing_file.id is not null then
    if existing_file.client_id <> target_client_id
      or existing_file.deliverable_id <> target_deliverable_id
      or existing_file.version_id <> target_version_id
      or existing_file.storage_path <> target_storage_path then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return existing_file.id;
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = target_bucket_id and o.name = target_storage_path
  ) then
    raise exception 'uploaded object not found' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'FileAssetRegistered', 'allowed', 'file_asset',
    target_file_id::text, target_visibility
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'register_file_asset', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, target_version.status
  );
  insert into public.file_assets (
    id, tenant_id, client_id, deliverable_id, version_id, owner_user_id,
    visibility, bucket_id, storage_path, file_name, file_type, file_size,
    version_number, is_final, upload_idempotency_key, upload_state
  ) values (
    target_file_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, actor_user_id,
    target_visibility, target_bucket_id, target_storage_path,
    left(btrim(target_file_name), 255), target_file_type, target_file_size,
    target_version.version_number, target_is_final,
    btrim(request_idempotency_key), 'ready'
  );
  return target_file_id;
end;
$$;

revoke all on function public.s015_register_file_asset(uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_register_file_asset(uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,boolean,uuid,uuid,text)
  to authenticated;

create or replace function public.s015_authorize_file_download(target_file_id uuid)
returns table (bucket_id text, storage_path text, file_name text, file_type text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_file public.file_assets%rowtype;
begin
  select * into target_file from public.file_assets f
  where f.id = target_file_id and f.upload_state = 'ready';
  if target_file.id is null
    or not private.s015_can_read_storage_object(
      target_file.bucket_id, target_file.storage_path
    ) then
    raise exception 'file download denied' using errcode = '42501';
  end if;
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    gen_random_uuid(), target_file.tenant_id, target_file.client_id,
    auth.uid(), 'FileAccessAuthorized', 'allowed', 'file_asset',
    target_file.id::text, target_file.visibility
  );
  return query select target_file.bucket_id, target_file.storage_path,
    target_file.file_name, target_file.file_type;
end;
$$;

revoke all on function public.s015_authorize_file_download(uuid)
  from public, anon, authenticated;
grant execute on function public.s015_authorize_file_download(uuid)
  to authenticated;

