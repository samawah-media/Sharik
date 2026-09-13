-- Spec 015: prevent empty versions from entering or completing client review.
-- Additive and fail-closed; existing records are not rewritten.

create or replace function private.s015_client_review_payload_available(
  target_tenant_id uuid,
  target_client_id uuid,
  target_deliverable_id uuid,
  target_version_id uuid
)
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select
    exists (
      select 1
      from public.deliverable_versions v
      where v.id = target_version_id
        and v.tenant_id = target_tenant_id
        and v.client_id = target_client_id
        and v.deliverable_id = target_deliverable_id
        and (
          nullif(btrim(v.caption), '') is not null
          or nullif(btrim(v.content_body), '') is not null
        )
    )
    or exists (
      select 1
      from public.file_assets f
      where f.tenant_id = target_tenant_id
        and f.client_id = target_client_id
        and f.deliverable_id = target_deliverable_id
        and f.version_id = target_version_id
        and f.visibility = 'client_visible'
        and f.file_size > 0
    );
$$;

revoke all on function private.s015_client_review_payload_available(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;

create or replace function private.s015_enforce_client_review_payload()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  review_boundary_changed boolean := tg_op = 'INSERT';
begin
  if tg_op = 'UPDATE' then
    review_boundary_changed :=
      new.status is distinct from old.status
      or new.current_version_id is distinct from old.current_version_id;
  end if;

  if new.status in ('waiting_client_approval', 'client_approved')
    and review_boundary_changed
    and (
      new.current_version_id is null
      or not private.s015_client_review_payload_available(
        new.tenant_id,
        new.client_id,
        new.id,
        new.current_version_id
      )
    ) then
    raise exception 'client review payload required' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function private.s015_enforce_client_review_payload()
  from public, anon, authenticated;

drop trigger if exists s015_client_review_payload_guard on public.deliverables;
create trigger s015_client_review_payload_guard
before insert or update of status, current_version_id on public.deliverables
for each row
execute function private.s015_enforce_client_review_payload();

create or replace function public.s015_retire_empty_uat_review_items(
  target_tenant_id uuid,
  target_client_id uuid,
  target_run_id text
)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_deliverable public.deliverables%rowtype;
  retired_count integer := 0;
  retired_at timestamptz;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if target_run_id !~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$'
    or not exists (
      select 1
      from public.clients c
      where c.id = target_client_id
        and c.tenant_id = target_tenant_id
    ) then
    raise exception 'UAT repair scope unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.deliverables d
    where d.tenant_id = target_tenant_id
      and d.client_id = target_client_id
      and d.import_run_id = target_run_id
      and d.status = 'waiting_client_approval'
      and not private.s015_client_review_payload_available(
        d.tenant_id,
        d.client_id,
        d.id,
        d.current_version_id
      )
      and (
        exists (
          select 1
          from public.approval_decisions a
          where a.deliverable_id = d.id
            and a.tenant_id = d.tenant_id
            and a.client_id = d.client_id
            and a.approval_kind = 'client'
        )
        or exists (
          select 1
          from public.comments c
          where c.deliverable_id = d.id
            and c.tenant_id = d.tenant_id
            and c.client_id = d.client_id
            and (c.comment_type = 'client_comment' or c.visibility = 'client_visible')
        )
        or exists (
          select 1
          from public.file_assets f
          where f.deliverable_id = d.id
            and f.tenant_id = d.tenant_id
            and f.client_id = d.client_id
            and f.visibility in ('client_uploaded', 'final_delivery')
        )
      )
  ) then
    raise exception 'UAT review item has client activity' using errcode = 'P0001';
  end if;

  for target_deliverable in
    select d.*
    from public.deliverables d
    where d.tenant_id = target_tenant_id
      and d.client_id = target_client_id
      and d.import_run_id = target_run_id
      and d.status = 'waiting_client_approval'
      and not private.s015_client_review_payload_available(
        d.tenant_id,
        d.client_id,
        d.id,
        d.current_version_id
      )
    for update
  loop
    retired_at := clock_timestamp();

    update public.sla_timeline_segments
    set ended_at = retired_at
    where tenant_id = target_deliverable.tenant_id
      and client_id = target_deliverable.client_id
      and deliverable_id = target_deliverable.id
      and ended_at is null;

    update public.deliverables d
    set status = 'cancelled',
        progress_percentage = 0,
        cancelled_at = retired_at,
        updated_at = retired_at,
        revision = d.revision + 1
    where d.id = target_deliverable.id
      and d.tenant_id = target_deliverable.tenant_id
      and d.client_id = target_deliverable.client_id;

    insert into public.sla_timeline_segments (
      id,
      tenant_id,
      client_id,
      deliverable_id,
      kind,
      started_at,
      ended_at,
      reason
    ) values (
      gen_random_uuid(),
      target_deliverable.tenant_id,
      target_deliverable.client_id,
      target_deliverable.id,
      'cancelled',
      retired_at,
      retired_at,
      'missing_client_review_payload'
    );

    insert into public.audit_events (
      id,
      tenant_id,
      client_id,
      actor_user_id,
      action,
      decision,
      target_type,
      target_id,
      reason
    ) values (
      gen_random_uuid(),
      target_deliverable.tenant_id,
      target_deliverable.client_id,
      null,
      'DeliverableUatReviewRetired',
      'allowed',
      'deliverable',
      target_deliverable.id::text,
      'missing_client_review_payload'
    );

    retired_count := retired_count + 1;
  end loop;

  return retired_count;
end;
$$;

revoke all on function public.s015_retire_empty_uat_review_items(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.s015_retire_empty_uat_review_items(uuid, uuid, text)
  to service_role;
