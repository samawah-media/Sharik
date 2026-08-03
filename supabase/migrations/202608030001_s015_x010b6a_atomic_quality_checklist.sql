-- Spec 015 X010-B6A corrective: save the editable default quality checklist
-- as one atomic, idempotent command. A failure in any item rolls back the
-- parent command, every item, and every audit row in the same transaction.

create or replace function public.s015_save_quality_checklist(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_items jsonb,
  request_idempotency_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  item jsonb;
  item_index integer := 0;
  item_label text;
  item_note text;
  item_count integer;
  normalized_items jsonb := '[]'::jsonb;
  payload_fingerprint text;
  parent_audit_event_id uuid := gen_random_uuid();
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_items is null
    or jsonb_typeof(target_items) <> 'array'
    or jsonb_array_length(target_items) not between 1 and 20
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) not between 8 and 180 then
    raise exception 'invalid quality checklist input' using errcode = 'P0001';
  end if;

  for item in select value from jsonb_array_elements(target_items)
  loop
    item_index := item_index + 1;
    if jsonb_typeof(item) <> 'object' then
      raise exception 'invalid quality checklist item' using errcode = 'P0001';
    end if;
    item_label := btrim(coalesce(item ->> 'label', ''));
    item_note := nullif(btrim(coalesce(item ->> 'note', '')), '');
    if length(item_label) not between 2 and 200
      or length(coalesce(item_note, '')) > 2000 then
      raise exception 'invalid quality checklist item' using errcode = 'P0001';
    end if;
    normalized_items := normalized_items || jsonb_build_array(
      jsonb_build_object('label', item_label, 'note', item_note)
    );
  end loop;
  item_count := item_index;
  payload_fingerprint := md5(normalized_items::text);

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;
  if not (
    public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', target_deliverable.tenant_id
    )
    or public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', target_client_id
    )
  ) then
    raise exception 'quality checklist command denied' using errcode = '42501';
  end if;

  select * into target_version
  from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;
  if target_version.id is null then
    raise exception 'version not found in scope' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'save_quality_checklist'
      or existing_request.request_fingerprint is distinct from payload_fingerprint then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return item_count;
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    parent_audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'QualityChecklistCreated', 'allowed',
    'deliverable_version', target_version_id::text, 'save_quality_checklist'
  );

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status, request_fingerprint
  ) values (
    gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'save_quality_checklist', 'allowed', parent_audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision,
    target_version.status, payload_fingerprint
  );

  item_index := 0;
  for item in select value from jsonb_array_elements(normalized_items)
  loop
    item_index := item_index + 1;
    perform public.s015_upsert_quality_check(
      target_client_id,
      target_deliverable_id,
      target_version_id,
      null,
      item ->> 'label',
      'pending',
      coalesce(item ->> 'note', ''),
      item_index - 1,
      gen_random_uuid(),
      gen_random_uuid(),
      btrim(request_idempotency_key) || ':' || lpad(item_index::text, 2, '0')
    );
  end loop;

  return item_count;
end;
$$;

revoke all on function public.s015_save_quality_checklist(uuid,uuid,uuid,jsonb,text)
  from public, anon, authenticated;
grant execute on function public.s015_save_quality_checklist(uuid,uuid,uuid,jsonb,text)
  to authenticated;
