-- Spec 015 persistent MVP foundation. No hosted or customer data is touched.

create table if not exists public.deliverable_versions (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_number integer not null check (version_number > 0),
  status text not null default 'internal_only'
    check (status in ('internal_only', 'internally_approved', 'client_visible', 'client_approved', 'final', 'superseded')),
  submitted_by uuid,
  submitted_at timestamptz not null default now(),
  superseded_at timestamptz,
  constraint deliverable_versions_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint deliverable_versions_unique_number
    unique (tenant_id, client_id, deliverable_id, version_number),
  constraint deliverable_versions_unique_scope_id
    unique (id, deliverable_id, tenant_id, client_id)
);

create table if not exists public.approval_decisions (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid not null,
  approval_kind text not null check (approval_kind in ('internal', 'client')),
  decision text not null check (decision in ('approved', 'changes_requested', 'denied')),
  actor_user_id uuid,
  comment_id uuid,
  decided_at timestamptz not null default now(),
  constraint approval_decisions_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint approval_decisions_version_scope
    foreign key (version_id, deliverable_id, tenant_id, client_id)
    references public.deliverable_versions(id, deliverable_id, tenant_id, client_id)
);

create table if not exists public.comments (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid,
  author_user_id uuid,
  comment_type text not null check (comment_type in ('internal_comment', 'client_comment', 'system_comment', 'approval_comment')),
  visibility text not null check (visibility in ('internal_only', 'client_visible')),
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now(),
  constraint comments_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint comments_version_scope
    foreign key (version_id, deliverable_id, tenant_id, client_id)
    references public.deliverable_versions(id, deliverable_id, tenant_id, client_id)
);

create table if not exists public.file_assets (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid,
  version_id uuid,
  owner_user_id uuid,
  visibility text not null check (visibility in ('internal_only', 'client_visible', 'client_uploaded', 'final_delivery', 'contract_file', 'report_file', 'brand_asset')),
  storage_path text not null,
  file_type text not null,
  file_size bigint not null check (file_size >= 0),
  version_number integer not null default 1 check (version_number > 0),
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  constraint file_assets_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint file_assets_version_scope
    foreign key (version_id, deliverable_id, tenant_id, client_id)
    references public.deliverable_versions(id, deliverable_id, tenant_id, client_id),
  constraint file_assets_version_requires_deliverable
    check (version_id is null or deliverable_id is not null)
);

create table if not exists public.sla_timeline_segments (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  kind text not null check (kind in ('running', 'paused_waiting_client', 'paused_waiting_internal_decision', 'resumed', 'completed', 'cancelled')),
  started_at timestamptz not null,
  ended_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  constraint sla_segments_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint sla_segments_time_order check (ended_at is null or ended_at >= started_at)
);

create table if not exists public.mvp_command_requests (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid,
  idempotency_key text not null check (length(btrim(idempotency_key)) >= 8),
  command_name text not null,
  outcome text not null default 'pending' check (outcome in ('pending', 'allowed', 'denied', 'conflict')),
  audit_event_id uuid not null references public.audit_events(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (tenant_id, idempotency_key),
  constraint mvp_commands_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id)
);

alter table public.deliverables
  add column if not exists current_version_id uuid;
alter table public.deliverables
  add column if not exists closed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'deliverables_current_version_scope'
      and conrelid = 'public.deliverables'::regclass
  ) then
    alter table public.deliverables
      add constraint deliverables_current_version_scope
      foreign key (current_version_id, id, tenant_id, client_id)
      references public.deliverable_versions(id, deliverable_id, tenant_id, client_id);
  end if;
end;
$$;

create or replace function public.s015_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'Spec 015 append-only record cannot be mutated' using errcode = '42501';
end;
$$;

drop trigger if exists s015_approval_decisions_append_only on public.approval_decisions;
create trigger s015_approval_decisions_append_only before update or delete on public.approval_decisions for each statement execute function public.s015_append_only();

alter table public.deliverable_versions enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.comments enable row level security;
alter table public.file_assets enable row level security;
alter table public.sla_timeline_segments enable row level security;
alter table public.mvp_command_requests enable row level security;

drop policy if exists s015_versions_select on public.deliverable_versions;
create policy s015_versions_select on public.deliverable_versions for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
  or (status in ('client_visible','client_approved','final') and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id))
);

drop policy if exists s015_approvals_select on public.approval_decisions;
create policy s015_approvals_select on public.approval_decisions for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
  or (approval_kind = 'client' and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id))
);

drop policy if exists s015_comments_select on public.comments;
create policy s015_comments_select on public.comments for select using (
  (visibility = 'client_visible' and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id))
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);

drop policy if exists s015_files_select on public.file_assets;
create policy s015_files_select on public.file_assets for select using (
  ((
    visibility in ('client_visible','client_uploaded','contract_file','report_file','brand_asset')
    or (
      visibility = 'final_delivery' and is_final
      and exists (
        select 1 from public.deliverables d
        where d.id = file_assets.deliverable_id
          and d.tenant_id = file_assets.tenant_id
          and d.client_id = file_assets.client_id
          and d.status = 'delivered'
      )
    )
  ) and public.f001_has_active_role(tenant_id, array['client_admin','client_approver','client_viewer'], 'client', client_id))
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);

drop policy if exists s015_sla_select on public.sla_timeline_segments;
create policy s015_sla_select on public.sla_timeline_segments for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer'], 'client', client_id)
  or public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);

drop policy if exists s015_commands_select on public.mvp_command_requests;
create policy s015_commands_select on public.mvp_command_requests for select using (
  public.f001_has_active_role(tenant_id, array['tenant_owner','tenant_administrator','project_manager','marketing_manager'], 'tenant', tenant_id)
);

revoke all on public.deliverable_versions, public.approval_decisions, public.comments, public.file_assets, public.sla_timeline_segments, public.mvp_command_requests from public, anon, authenticated;
grant select on public.deliverable_versions, public.approval_decisions, public.comments, public.file_assets, public.sla_timeline_segments, public.mvp_command_requests to authenticated;

create or replace function public.s015_client_decide_version(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_decision text,
  decision_comment text,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (deliverable_status text, deliverable_revision integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid := auth.uid();
  target_deliverable public.deliverables%rowtype;
  target_version public.deliverable_versions%rowtype;
  existing_request public.mvp_command_requests%rowtype;
  next_status text;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_decision not in ('approved', 'changes_requested') then
    raise exception 'invalid client decision' using errcode = 'P0001';
  end if;
  if request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;

  if target_deliverable.id is null or not public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['client_admin','client_approver'],
    'client',
    target_client_id
  ) then
    raise exception 'client decision denied' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = request_idempotency_key;
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.command_name <> ('client_' || target_decision) then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return query select target_deliverable.status, target_deliverable.revision;
    return;
  end if;

  select * into target_version
  from public.deliverable_versions v
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;

  if target_version.id is null
    or target_version.status <> 'client_visible'
    or target_deliverable.current_version_id is distinct from target_version_id
    or target_deliverable.status <> 'waiting_client_approval' then
    raise exception 'stale or unavailable client version' using errcode = 'P0001';
  end if;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'ClientVersionDecision', 'allowed', 'deliverable_version',
    target_version_id::text, target_decision
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, btrim(request_idempotency_key),
    'client_' || target_decision, 'allowed', audit_event_id, now()
  );
  insert into public.approval_decisions (
    id, tenant_id, client_id, deliverable_id, version_id,
    approval_kind, decision, actor_user_id
  ) values (
    gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, 'client', target_decision,
    actor_user_id
  );
  if nullif(btrim(decision_comment), '') is not null then
    insert into public.comments (
      id, tenant_id, client_id, deliverable_id, version_id,
      author_user_id, comment_type, visibility, body
    ) values (
      gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_id, actor_user_id,
      'approval_comment', 'client_visible', btrim(decision_comment)
    );
  end if;

  update public.sla_timeline_segments
  set ended_at = now()
  where tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id
    and deliverable_id = target_deliverable_id
    and kind = 'paused_waiting_client'
    and ended_at is null;

  if target_decision = 'approved' then
    next_status := 'client_approved';
    update public.deliverable_versions
    set status = 'client_approved'
    where id = target_version_id
      and tenant_id = target_deliverable.tenant_id
      and client_id = target_client_id;
  else
    next_status := 'client_changes_requested';
    insert into public.sla_timeline_segments (
      id, tenant_id, client_id, deliverable_id, kind, started_at, reason
    ) values (
      gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, 'resumed', now(), 'client_changes_requested'
    );
  end if;

  update public.deliverables d
  set status = next_status,
      progress_percentage = public.f004_deliverable_progress_for_status(next_status),
      revision = d.revision + 1,
      updated_at = now()
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id
    and d.client_id = target_client_id
  returning d.status, d.revision
  into deliverable_status, deliverable_revision;
  return next;
end;
$$;

revoke all on function public.s015_client_decide_version(uuid, uuid, uuid, text, text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.s015_client_decide_version(uuid, uuid, uuid, text, text, uuid, uuid, text) to authenticated;

create or replace function public.s015_execute_internal_workflow(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  target_command text,
  target_version_number integer,
  command_comment text,
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
  management_allowed boolean;
  team_allowed boolean;
  audit_action text;
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if target_command not in ('submit_version', 'approve_internal', 'request_internal_changes', 'send_to_client', 'deliver') then
    raise exception 'invalid workflow command' using errcode = 'P0001';
  end if;
  if request_idempotency_key is null or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
  end if;
  if target_deliverable.status in ('delivered', 'cancelled', 'archived') then
    raise exception 'terminal deliverable state' using errcode = 'P0001';
  end if;

  management_allowed := public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'client', target_client_id
  ) or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
    'tenant', target_deliverable.tenant_id
  );
  team_allowed := management_allowed or public.f001_has_active_role(
    target_deliverable.tenant_id,
    array['account_manager','content_writer','designer','performance_specialist'],
    'client', target_client_id
  );
  if (target_command = 'submit_version' and not team_allowed)
    or (target_command <> 'submit_version' and not management_allowed) then
    raise exception 'workflow command denied' using errcode = '42501';
  end if;

  select * into existing_request from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = request_idempotency_key;
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.command_name <> target_command then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    select * into target_version from public.deliverable_versions v
    where v.id = target_deliverable.current_version_id
      and v.tenant_id = target_deliverable.tenant_id
      and v.client_id = target_client_id;
    return query select target_deliverable.status, target_deliverable.revision, target_version.status;
    return;
  end if;

  if target_command = 'submit_version' then
    if target_version_number is null or target_version_number < 1 then
      raise exception 'invalid version number' using errcode = 'P0001';
    end if;
    if target_deliverable.status not in (
      'not_started', 'in_progress', 'internal_changes_requested', 'client_changes_requested'
    ) then
      raise exception 'deliverable not ready for version submission' using errcode = 'P0001';
    end if;
    insert into public.deliverable_versions (
      id, tenant_id, client_id, deliverable_id, version_number, status, submitted_by
    ) values (
      target_version_id, target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_number, 'internal_only', actor_user_id
    ) returning * into target_version;
    update public.deliverables d
    set current_version_id = target_version_id,
        status = 'ready_for_internal_review', progress_percentage = 50,
        revision = d.revision + 1, updated_at = now()
    where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
    audit_action := 'DeliverableVersionSubmitted';
  else
    select * into target_version from public.deliverable_versions v
    where v.id = target_version_id
      and v.tenant_id = target_deliverable.tenant_id
      and v.client_id = target_client_id
      and v.deliverable_id = target_deliverable_id;
    if target_version.id is null
      or target_deliverable.current_version_id is distinct from target_version_id then
      raise exception 'stale or cross-scope version' using errcode = 'P0001';
    end if;

    if target_command = 'approve_internal' then
      if target_version.status <> 'internal_only'
        or target_deliverable.status <> 'ready_for_internal_review' then
        raise exception 'version not ready for internal approval' using errcode = 'P0001';
      end if;
      insert into public.approval_decisions (
        id, tenant_id, client_id, deliverable_id, version_id, approval_kind, decision, actor_user_id
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, target_version_id, 'internal', 'approved', actor_user_id
      );
      update public.deliverable_versions set status = 'internally_approved'
      where id = target_version_id and tenant_id = target_deliverable.tenant_id;
      update public.deliverables d set status = 'internally_approved', progress_percentage = 70,
        revision = d.revision + 1, updated_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      audit_action := 'DeliverableVersionInternallyApproved';
    elsif target_command = 'request_internal_changes' then
      if target_version.status <> 'internal_only'
        or target_deliverable.status <> 'ready_for_internal_review' then
        raise exception 'version not ready for internal change request' using errcode = 'P0001';
      end if;
      insert into public.approval_decisions (
        id, tenant_id, client_id, deliverable_id, version_id, approval_kind, decision, actor_user_id
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, target_version_id, 'internal', 'changes_requested', actor_user_id
      );
      update public.deliverables d
      set status = 'internal_changes_requested', progress_percentage = 45,
        revision = d.revision + 1, updated_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      audit_action := 'DeliverableInternalChangesRequested';
    elsif target_command = 'send_to_client' then
      if target_version.status <> 'internally_approved'
        or target_deliverable.status <> 'internally_approved' then
        raise exception 'internal approval required for same version' using errcode = 'P0001';
      end if;
      update public.deliverable_versions set status = 'client_visible'
      where id = target_version_id and tenant_id = target_deliverable.tenant_id;
      update public.deliverables d set status = 'waiting_client_approval', progress_percentage = 80,
        revision = d.revision + 1, updated_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      update public.sla_timeline_segments set ended_at = now()
      where tenant_id = target_deliverable.tenant_id and client_id = target_client_id
        and deliverable_id = target_deliverable_id and ended_at is null;
      insert into public.sla_timeline_segments (
        id, tenant_id, client_id, deliverable_id, kind, started_at, reason
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, 'paused_waiting_client', now(), 'sent_to_client'
      );
      audit_action := 'DeliverableVersionSentToClient';
    else
      if target_deliverable.requires_client_approval
        and (target_version.status <> 'client_approved' or target_deliverable.status <> 'client_approved') then
        raise exception 'client approval required for same version' using errcode = 'P0001';
      end if;
      if not target_deliverable.requires_client_approval
        and target_deliverable.status not in ('internally_approved', 'ready_for_delivery') then
        raise exception 'deliverable not ready for delivery' using errcode = 'P0001';
      end if;
      update public.deliverable_versions set status = 'final'
      where id = target_version_id and tenant_id = target_deliverable.tenant_id;
      update public.deliverables d set status = 'delivered', progress_percentage = 100,
        revision = d.revision + 1, updated_at = now(), closed_at = now()
      where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
      if target_deliverable.contract_id is not null
        and target_deliverable.package_id is not null
        and target_deliverable.package_line_id is not null then
        insert into public.package_ledger_entries (
          id, tenant_id, client_id, contract_id, package_id, package_line_id,
          deliverable_id, entry_type, quantity, reason, actor_user_id, idempotency_key
        )
        select
          gen_random_uuid(), a.tenant_id, a.client_id,
          target_deliverable.contract_id, target_deliverable.package_id,
          a.package_line_id, a.deliverable_id, 'quantity_consumed',
          a.reserved_quantity, 'final_delivery', actor_user_id,
          btrim(request_idempotency_key) || ':consume:' || a.id::text
        from public.deliverable_allocations a
        where a.tenant_id = target_deliverable.tenant_id
          and a.client_id = target_client_id
          and a.deliverable_id = target_deliverable_id
          and a.status = 'reserved';
        update public.deliverable_allocations a
        set status = 'consumed_later'
        where a.tenant_id = target_deliverable.tenant_id
          and a.client_id = target_client_id
          and a.deliverable_id = target_deliverable_id
          and a.status = 'reserved';
      end if;
      update public.sla_timeline_segments set ended_at = now()
      where tenant_id = target_deliverable.tenant_id and client_id = target_client_id
        and deliverable_id = target_deliverable_id and ended_at is null;
      insert into public.sla_timeline_segments (
        id, tenant_id, client_id, deliverable_id, kind, started_at, ended_at, reason
      ) values (
        gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
        target_deliverable_id, 'completed', now(), now(), 'final_delivery'
      );
      audit_action := 'DeliverableFinalDelivered';
    end if;
  end if;

  if nullif(btrim(command_comment), '') is not null then
    insert into public.comments (
      id, tenant_id, client_id, deliverable_id, version_id,
      author_user_id, comment_type, visibility, body
    ) values (
      gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
      target_deliverable_id, target_version_id, actor_user_id,
      'internal_comment', 'internal_only', btrim(command_comment)
    );
  end if;
  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision, target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id, actor_user_id,
    audit_action, 'allowed', 'deliverable_version', target_version_id::text, target_command
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id, target_deliverable_id,
    btrim(request_idempotency_key), target_command, 'allowed', audit_event_id, now()
  );

  select * into target_deliverable from public.deliverables d
  where d.id = target_deliverable_id and d.tenant_id = target_deliverable.tenant_id;
  select * into target_version from public.deliverable_versions v
  where v.id = target_version_id and v.tenant_id = target_deliverable.tenant_id;
  return query select target_deliverable.status, target_deliverable.revision, target_version.status;
end;
$$;

revoke all on function public.s015_execute_internal_workflow(uuid, uuid, uuid, text, integer, text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.s015_execute_internal_workflow(uuid, uuid, uuid, text, integer, text, uuid, uuid, text) to authenticated;
