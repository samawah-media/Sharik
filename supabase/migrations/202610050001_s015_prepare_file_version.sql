-- Prepare attachment context without submitting content or changing workflow.
create or replace function public.s015_prepare_file_version(
  target_client_id uuid, target_deliverable_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deliverable public.deliverables%rowtype;
  prepared_version_id uuid;
  next_number integer;
begin
  select * into target_deliverable from public.deliverables
  where id = target_deliverable_id and client_id = target_client_id
  for update;
  if auth.uid() is null or target_deliverable.id is null
    or private.s015_upload_actor_kind(target_deliverable) is null
    or private.s015_upload_actor_kind(target_deliverable) not in ('management', 'team_execution') then
    raise exception 'file preparation denied' using errcode = '42501';
  end if;
  if target_deliverable.current_version_id is not null then
    return target_deliverable.current_version_id;
  end if;
  select coalesce(max(version_number), 0) + 1 into next_number
  from public.deliverable_versions
  where tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id and deliverable_id = target_deliverable_id;
  prepared_version_id := gen_random_uuid();
  insert into public.deliverable_versions
    (id, tenant_id, client_id, deliverable_id, version_number, status, submitted_by)
  values (prepared_version_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, next_number, 'draft', auth.uid());
  update public.deliverables set current_version_id = prepared_version_id,
    revision = revision + 1, updated_at = now()
  where id = target_deliverable_id and tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id;
  insert into public.audit_events
    (id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason)
  values (gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
    auth.uid(), 'DeliverableVersionDraftSaved', 'allowed', 'deliverable_version',
    prepared_version_id::text, 'prepare_internal_file_upload');
  return prepared_version_id;
end;
$$;
revoke all on function public.s015_prepare_file_version(uuid,uuid) from public, anon, authenticated;
grant execute on function public.s015_prepare_file_version(uuid,uuid) to authenticated;
