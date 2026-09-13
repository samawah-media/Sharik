-- Spec 015 X010-A corrective follow-up: narrow cancel authorization.
-- Replaces only the cancel RPC body, preserving the signature and return shape.

create or replace function public.s015_cancel_file_upload_attempt(
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
  target_version public.deliverable_versions%rowtype;
  actor_kind text;
begin
  if current_actor is null or length(btrim(coalesce(target_reason, ''))) < 3 then
    raise exception 'upload cancellation denied' using errcode = '42501';
  end if;

  select * into attempt
  from public.file_upload_attempts
  where id = target_attempt_id
  for update;

  select * into target_deliverable
  from public.deliverables
  where id = attempt.deliverable_id
    and tenant_id = attempt.tenant_id
    and client_id = attempt.client_id;

  select * into target_version
  from public.deliverable_versions
  where id = attempt.version_id
    and deliverable_id = attempt.deliverable_id
    and tenant_id = attempt.tenant_id
    and client_id = attempt.client_id;

  if attempt.id is null
    or attempt.status not in ('pending','failed')
    or target_deliverable.id is null
    or target_version.id is null
    or target_deliverable.current_version_id is distinct from attempt.version_id then
    raise exception 'upload cancellation denied' using errcode = '42501';
  end if;

  actor_kind := private.s015_upload_actor_kind(target_deliverable);
  if actor_kind = 'management' then
    null;
  elsif current_actor = attempt.actor_user_id then
    perform private.s015_assert_upload_authorized(
      target_deliverable, target_version, attempt.visibility, attempt.is_final);
  else
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
