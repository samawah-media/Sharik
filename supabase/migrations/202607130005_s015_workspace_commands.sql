-- Spec 015 X006: audited, scoped, idempotent workspace commands.

alter table public.deliverable_versions
  drop constraint if exists deliverable_versions_status_check;
alter table public.deliverable_versions
  add constraint deliverable_versions_status_check
  check (status in ('draft', 'internal_only', 'internally_approved', 'client_visible', 'client_approved', 'final', 'superseded'));

create or replace function private.s015_team_can_execute_deliverable(
  target_deliverable public.deliverables
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', target_deliverable.tenant_id
    )
    or public.f001_has_active_role(
      target_deliverable.tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', target_deliverable.client_id
    )
    or (
      (
        target_deliverable.owner_user_id = auth.uid()
        or auth.uid() = any(coalesce(target_deliverable.contributor_user_ids, array[]::uuid[]))
      )
      and public.f001_has_active_role(
        target_deliverable.tenant_id,
        array['account_manager','content_writer','designer','performance_specialist'],
        'client', target_deliverable.client_id
      )
    ), false);
$$;

revoke all on function private.s015_team_can_execute_deliverable(public.deliverables)
  from public, anon, authenticated;
grant execute on function private.s015_team_can_execute_deliverable(public.deliverables)
  to authenticated;
create or replace function public.s015_save_or_submit_version(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_version_number integer,
  target_submit boolean,
  target_brief text,
  target_content_body text,
  target_caption text,
  target_channel text,
  target_format text,
  target_objective text,
  target_kpi text,
  target_source_reference text,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (deliverable_status text, deliverable_revision integer, version_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  command_name text := case when target_submit then 'submit_version_content' else 'save_version_draft' end;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_version_number is null or target_version_number < 1
    or request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid version input' using errcode = 'P0001';
  end if;
  if greatest(
    length(coalesce(target_brief, '')),
    length(coalesce(target_content_body, '')),
    length(coalesce(target_caption, ''))
  ) > 20000 then
    raise exception 'version content too long' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null
    or not private.s015_team_can_execute_deliverable(target_deliverable) then
    raise exception 'version command denied' using errcode = '42501';
  end if;
  if target_deliverable.status not in (
    'not_started', 'in_progress', 'internal_changes_requested', 'client_changes_requested'
  ) then
    raise exception 'deliverable not editable' using errcode = 'P0001';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> command_name then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return query select existing_request.result_deliverable_status,
      existing_request.result_deliverable_revision,
      existing_request.result_version_status;
    return;
  end if;

  select * into target_version
  from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id
  for update;

  if target_version.id is null then
    if target_deliverable.current_version_id is not null and exists (
      select 1 from public.deliverable_versions current_v
      where current_v.id = target_deliverable.current_version_id
        and current_v.status = 'draft'
    ) then
      raise exception 'another draft is current' using errcode = 'P0001';
    end if;
    insert into public.deliverable_versions (
      id, tenant_id, client_id, deliverable_id, version_number, status,
      submitted_by, brief, content_body, caption, channel, format, objective,
      kpi, source_reference
    ) values (
      target_version_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_number,
      case when target_submit then 'internal_only' else 'draft' end,
      actor_user_id, nullif(btrim(target_brief), ''),
      nullif(btrim(target_content_body), ''), nullif(btrim(target_caption), ''),
      nullif(btrim(target_channel), ''), nullif(btrim(target_format), ''),
      nullif(btrim(target_objective), ''), nullif(btrim(target_kpi), ''),
      nullif(btrim(target_source_reference), '')
    ) returning * into target_version;
  else
    if target_deliverable.current_version_id is distinct from target_version_id
      or target_version.status <> 'draft'
      or target_version.version_number <> target_version_number then
      raise exception 'stale or immutable version' using errcode = 'P0001';
    end if;
    update public.deliverable_versions v set
      status = case when target_submit then 'internal_only' else 'draft' end,
      submitted_by = actor_user_id,
      submitted_at = case when target_submit then now() else v.submitted_at end,
      brief = nullif(btrim(target_brief), ''),
      content_body = nullif(btrim(target_content_body), ''),
      caption = nullif(btrim(target_caption), ''),
      channel = nullif(btrim(target_channel), ''),
      format = nullif(btrim(target_format), ''),
      objective = nullif(btrim(target_objective), ''),
      kpi = nullif(btrim(target_kpi), ''),
      source_reference = nullif(btrim(target_source_reference), '')
    where v.id = target_version_id
    returning * into target_version;
  end if;

  update public.deliverables d set
    current_version_id = target_version_id,
    status = case when target_submit then 'ready_for_internal_review' else d.status end,
    progress_percentage = case when target_submit then 50 else d.progress_percentage end,
    revision = d.revision + 1,
    updated_at = now()
  where d.id = target_deliverable_id
  returning d.status, d.revision into deliverable_status, deliverable_revision;
  version_status := target_version.status;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id,
    case when target_submit then 'DeliverableVersionSubmitted' else 'DeliverableVersionDraftSaved' end,
    'allowed', 'deliverable_version', target_version_id::text, command_name
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    command_name, 'allowed', audit_event_id, now(), deliverable_status,
    deliverable_revision, version_status
  );
  return next;
end;
$$;

revoke all on function public.s015_save_or_submit_version(uuid,uuid,uuid,integer,boolean,text,text,text,text,text,text,text,text,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_save_or_submit_version(uuid,uuid,uuid,integer,boolean,text,text,text,text,text,text,text,text,uuid,uuid,text)
  to authenticated;

create or replace function public.s015_add_workspace_comment(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_visibility text,
  target_body text,
  target_body_json jsonb,
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
  existing_request public.mvp_command_requests%rowtype;
  comment_id uuid := gen_random_uuid();
  is_management boolean;
  is_client boolean;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_visibility not in ('internal_only', 'client_visible')
    or length(btrim(coalesce(target_body, ''))) < 1
    or length(target_body) > 10000
    or request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid comment input' using errcode = 'P0001';
  end if;

  select * into target_deliverable from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null
    or target_deliverable.current_version_id is distinct from target_version_id then
    raise exception 'comment target unavailable' using errcode = '42501';
  end if;
  select * into target_version from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;
  if target_version.id is null then
    raise exception 'comment target unavailable' using errcode = '42501';
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
    if target_visibility <> 'client_visible'
      or not public.s015_client_current_version_is_visible(
        target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, target_version_id) then
      raise exception 'client comment denied' using errcode = '42501';
    end if;
  elsif not private.s015_team_can_execute_deliverable(target_deliverable) then
    raise exception 'internal comment denied' using errcode = '42501';
  elsif target_visibility = 'client_visible' and (
    not is_management
    or target_version.status not in ('client_visible','client_approved','final')
  ) then
    raise exception 'client-visible comment denied' using errcode = '42501';
  end if;

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'add_workspace_comment' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return (
      select c.id from public.comments c
      where c.tenant_id = target_deliverable.tenant_id
        and c.deliverable_id = target_deliverable_id
        and c.version_id = target_version_id
        and c.author_user_id = actor_user_id
        and c.body = btrim(target_body)
      order by c.created_at desc limit 1
    );
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'DeliverableCommentAdded', 'allowed',
    'deliverable_version', target_version_id::text, target_visibility
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'add_workspace_comment', 'allowed', audit_event_id, now(),
    target_deliverable.status, target_deliverable.revision, target_version.status
  );
  insert into public.comments (
    id, tenant_id, client_id, deliverable_id, version_id, author_user_id,
    comment_type, visibility, body, body_format, body_json
  ) values (
    comment_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, actor_user_id,
    case when is_client then 'client_comment' else 'internal_comment' end,
    target_visibility, btrim(target_body),
    case when target_body_json is null then 'plain_text' else 'tiptap_json' end,
    target_body_json
  );
  return comment_id;
end;
$$;

revoke all on function public.s015_add_workspace_comment(uuid,uuid,uuid,text,text,jsonb,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.s015_add_workspace_comment(uuid,uuid,uuid,text,text,jsonb,uuid,uuid,text)
  to authenticated;
