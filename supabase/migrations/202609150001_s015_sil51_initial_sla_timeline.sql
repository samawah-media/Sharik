-- SIL-51: start the SLA when execution starts, not when planned work is created.

create or replace function private.s015_start_initial_sla_on_execution()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.status = 'not_started'
    and new.status in ('in_progress', 'ready_for_internal_review')
    and not exists (
      select 1
      from public.sla_timeline_segments s
      where s.tenant_id = new.tenant_id
        and s.client_id = new.client_id
        and s.deliverable_id = new.id
    ) then
    insert into public.sla_timeline_segments (
      id, tenant_id, client_id, deliverable_id, kind, started_at, reason
    ) values (
      gen_random_uuid(), new.tenant_id, new.client_id, new.id,
      'running', new.updated_at,
      case
        when new.status = 'ready_for_internal_review'
          then 'first_version_submitted'
        else 'execution_started'
      end
    );
  end if;

  return new;
end;
$$;

revoke all on function private.s015_start_initial_sla_on_execution()
  from public, anon, authenticated;

drop trigger if exists s015_start_initial_sla_on_execution on public.deliverables;
create trigger s015_start_initial_sla_on_execution
after update of status on public.deliverables
for each row
execute function private.s015_start_initial_sla_on_execution();

-- Repair only history with persisted evidence of the first successful start.
-- A later segment closes the repaired interval at its exact boundary. Keeping
-- the repair in a private, revoked function lets pgTAP prove upgrade behavior
-- without exposing a runtime application command.
create or replace function private.s015_backfill_initial_sla_timeline()
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  inserted_count integer;
begin
  with first_execution as (
    select
      r.tenant_id,
      r.client_id,
      r.deliverable_id,
      min(r.completed_at) as started_at
    from public.deliverable_status_transition_requests r
    where r.target_status = 'in_progress'
      and r.outcome = 'allowed'
      and r.completed_at is not null
    group by r.tenant_id, r.client_id, r.deliverable_id
  ), first_existing_segment as (
    select
      s.tenant_id,
      s.client_id,
      s.deliverable_id,
      min(s.started_at) as started_at
    from public.sla_timeline_segments s
    group by s.tenant_id, s.client_id, s.deliverable_id
  )
  insert into public.sla_timeline_segments (
    id, tenant_id, client_id, deliverable_id, kind, started_at, ended_at, reason
  )
  select
    gen_random_uuid(),
    d.tenant_id,
    d.client_id,
    d.id,
    'running',
    execution.started_at,
    existing.started_at,
    'execution_started_backfill'
  from public.deliverables d
  join first_execution execution
    on execution.tenant_id = d.tenant_id
   and execution.client_id = d.client_id
   and execution.deliverable_id = d.id
  left join first_existing_segment existing
    on existing.tenant_id = d.tenant_id
   and existing.client_id = d.client_id
   and existing.deliverable_id = d.id
  where not exists (
      select 1
      from public.sla_timeline_segments s
      where s.tenant_id = d.tenant_id
        and s.client_id = d.client_id
        and s.deliverable_id = d.id
        and s.kind = 'running'
    )
    and (
      existing.started_at > execution.started_at
      or (
        existing.started_at is null
        and d.status in (
          'in_progress',
          'ready_for_internal_review',
          'internal_changes_requested',
          'internally_approved',
          'client_changes_requested',
          'client_approved',
          'ready_for_delivery'
        )
      )
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function private.s015_backfill_initial_sla_timeline()
  from public, anon, authenticated;

select private.s015_backfill_initial_sla_timeline();
