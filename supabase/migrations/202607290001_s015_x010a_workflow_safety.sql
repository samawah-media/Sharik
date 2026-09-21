-- Spec 015 X010-A: require an explicit, audited delivery preparation step and
-- finalize only the exact approved current version with ready scoped files.

create or replace function public.s015_require_ready_before_delivery()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'delivered'
    and old.status is distinct from 'ready_for_delivery' then
    raise exception 'ready_for_delivery required before delivered'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists s015_require_ready_before_delivery
  on public.deliverables;
create trigger s015_require_ready_before_delivery
before update of status on public.deliverables
for each row
execute function public.s015_require_ready_before_delivery();

revoke all on function public.s015_require_ready_before_delivery()
  from public, anon, authenticated;

create or replace function public.s015_prepare_delivery(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (
  deliverable_status text,
  deliverable_revision integer,
  version_status text
)
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
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
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
    raise exception 'prepare delivery denied' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'prepare_delivery' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return query select
      existing_request.result_deliverable_status,
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
  if target_version.id is null
    or target_deliverable.current_version_id is distinct from target_version_id then
    raise exception 'stale or cross-scope version' using errcode = 'P0001';
  end if;

  if target_deliverable.requires_client_approval then
    if target_deliverable.status <> 'client_approved'
      or target_version.status <> 'client_approved'
      or not exists (
        select 1
        from public.approval_decisions a
        where a.tenant_id = target_deliverable.tenant_id
          and a.client_id = target_client_id
          and a.deliverable_id = target_deliverable_id
          and a.version_id = target_version_id
          and a.approval_kind = 'client'
          and a.decision = 'approved'
      ) then
      raise exception 'exact client approval required' using errcode = 'P0001';
    end if;
  elsif target_deliverable.status <> 'internally_approved'
    or target_version.status <> 'internally_approved' then
    raise exception 'exact internal approval required' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.file_assets f
    where f.tenant_id = target_deliverable.tenant_id
      and f.client_id = target_client_id
      and f.deliverable_id = target_deliverable_id
      and f.version_id = target_version_id
      and (f.upload_state <> 'ready' or f.file_size < 1)
  ) then
    raise exception 'unsettled exact-version file' using errcode = 'P0001';
  end if;

  update public.deliverables d
  set status = 'ready_for_delivery',
      progress_percentage = 95,
      revision = d.revision + 1,
      updated_at = now()
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id;

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'DeliverablePreparedForDelivery', 'allowed',
    'deliverable_version', target_version_id::text, 'prepare_delivery'
  );

  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'prepare_delivery', 'allowed', audit_event_id, now(),
    'ready_for_delivery',
    (select revision from public.deliverables where id = target_deliverable_id),
    target_version.status
  );

  return query
  select d.status, d.revision, v.status
  from public.deliverables d
  join public.deliverable_versions v
    on v.id = target_version_id
   and v.tenant_id = d.tenant_id
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id;
end;
$$;

revoke all on function public.s015_prepare_delivery(
  uuid, uuid, uuid, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_prepare_delivery(
  uuid, uuid, uuid, uuid, uuid, text
) to authenticated;

create or replace function public.s015_deliver_ready_version(
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid,
  request_id uuid,
  audit_event_id uuid,
  request_idempotency_key text
)
returns table (
  deliverable_status text,
  deliverable_revision integer,
  version_status text
)
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
begin
  if actor_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if request_idempotency_key is null
    or length(btrim(request_idempotency_key)) < 8 then
    raise exception 'invalid idempotency key' using errcode = 'P0001';
  end if;

  select * into target_deliverable
  from public.deliverables d
  where d.id = target_deliverable_id
    and d.client_id = target_client_id
  for update;
  if target_deliverable.id is null then
    raise exception 'deliverable unavailable' using errcode = '42501';
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
    raise exception 'final delivery denied' using errcode = '42501';
  end if;

  select * into existing_request
  from public.mvp_command_requests r
  where r.tenant_id = target_deliverable.tenant_id
    and r.idempotency_key = btrim(request_idempotency_key);
  if existing_request.id is not null then
    if existing_request.client_id <> target_client_id
      or existing_request.deliverable_id <> target_deliverable_id
      or existing_request.version_id is distinct from target_version_id
      or existing_request.command_name <> 'deliver_ready_version' then
      raise exception 'idempotency conflict' using errcode = 'P0001';
    end if;
    return query select
      existing_request.result_deliverable_status,
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
  if target_version.id is null
    or target_deliverable.current_version_id is distinct from target_version_id then
    raise exception 'stale or cross-scope version' using errcode = 'P0001';
  end if;
  if target_deliverable.status <> 'ready_for_delivery' then
    raise exception 'ready_for_delivery required' using errcode = 'P0001';
  end if;
  if target_deliverable.requires_client_approval then
    if target_version.status <> 'client_approved'
      or not exists (
        select 1
        from public.approval_decisions a
        where a.tenant_id = target_deliverable.tenant_id
          and a.client_id = target_client_id
          and a.deliverable_id = target_deliverable_id
          and a.version_id = target_version_id
          and a.approval_kind = 'client'
          and a.decision = 'approved'
      ) then
      raise exception 'exact approved version required' using errcode = 'P0001';
    end if;
  elsif target_version.status <> 'internally_approved' then
    raise exception 'exact internally approved version required' using errcode = 'P0001';
  end if;
  if exists (
    select 1
    from public.file_assets f
    where f.tenant_id = target_deliverable.tenant_id
      and f.client_id = target_client_id
      and f.deliverable_id = target_deliverable_id
      and f.version_id = target_version_id
      and (f.upload_state <> 'ready' or f.file_size < 1)
  ) then
    raise exception 'unsettled exact-version file' using errcode = 'P0001';
  end if;

  update public.deliverable_versions v
  set status = 'final'
  where v.id = target_version_id
    and v.tenant_id = target_deliverable.tenant_id
    and v.client_id = target_client_id
    and v.deliverable_id = target_deliverable_id;

  update public.deliverables d
  set status = 'delivered',
      progress_percentage = 100,
      revision = d.revision + 1,
      updated_at = now(),
      closed_at = now()
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id;

  if target_deliverable.contract_id is not null
    and target_deliverable.package_id is not null
    and target_deliverable.package_line_id is not null then
    insert into public.package_ledger_entries (
      id, tenant_id, client_id, contract_id, package_id, package_line_id,
      deliverable_id, entry_type, quantity, reason, actor_user_id,
      idempotency_key
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

  update public.sla_timeline_segments
  set ended_at = now()
  where tenant_id = target_deliverable.tenant_id
    and client_id = target_client_id
    and deliverable_id = target_deliverable_id
    and ended_at is null;
  insert into public.sla_timeline_segments (
    id, tenant_id, client_id, deliverable_id, kind,
    started_at, ended_at, reason
  ) values (
    gen_random_uuid(), target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, 'completed', now(), now(), 'final_delivery'
  );

  insert into public.audit_events (
    id, tenant_id, client_id, actor_user_id, action, decision,
    target_type, target_id, reason
  ) values (
    audit_event_id, target_deliverable.tenant_id, target_client_id,
    actor_user_id, 'DeliverableFinalDelivered', 'allowed',
    'deliverable_version', target_version_id::text, 'deliver_ready_version'
  );
  insert into public.mvp_command_requests (
    id, tenant_id, client_id, deliverable_id, version_id, idempotency_key,
    command_name, outcome, audit_event_id, completed_at,
    result_deliverable_status, result_deliverable_revision,
    result_version_status
  ) values (
    request_id, target_deliverable.tenant_id, target_client_id,
    target_deliverable_id, target_version_id, btrim(request_idempotency_key),
    'deliver_ready_version', 'allowed', audit_event_id, now(),
    'delivered',
    (select revision from public.deliverables where id = target_deliverable_id),
    'final'
  );

  return query
  select d.status, d.revision, v.status
  from public.deliverables d
  join public.deliverable_versions v
    on v.id = target_version_id
   and v.tenant_id = d.tenant_id
  where d.id = target_deliverable_id
    and d.tenant_id = target_deliverable.tenant_id;
end;
$$;

revoke all on function public.s015_deliver_ready_version(
  uuid, uuid, uuid, uuid, uuid, text
) from public, anon, authenticated;
grant execute on function public.s015_deliver_ready_version(
  uuid, uuid, uuid, uuid, uuid, text
) to authenticated;
