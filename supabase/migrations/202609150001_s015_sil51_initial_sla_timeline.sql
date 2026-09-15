-- Fix for SIL-51: No initial SLA timeline before first send
-- This migration ensures that an initial 'running' segment is created when a deliverable is created.

create or replace function public.s015_on_deliverable_created_sla()
returns trigger as $$
begin
  insert into public.sla_timeline_segments (
    id, tenant_id, client_id, deliverable_id, kind, started_at, reason
  ) values (
    gen_random_uuid(), new.tenant_id, new.client_id, new.id,
    'running', new.created_at, 'deliverable_created'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists s015_deliverable_created_sla_trigger on public.deliverables;
create trigger s015_deliverable_created_sla_trigger
  after insert on public.deliverables
  for each row
  execute function public.s015_on_deliverable_created_sla();

-- Backfill existing deliverables that don't have an initial running segment
insert into public.sla_timeline_segments (
  id, tenant_id, client_id, deliverable_id, kind, started_at, reason
)
select
  gen_random_uuid(), d.tenant_id, d.client_id, d.id,
  'running', d.created_at, 'deliverable_created_backfill'
from public.deliverables d
where not exists (
  select 1 from public.sla_timeline_segments s
  where s.deliverable_id = d.id and s.kind = 'running' and s.reason in ('deliverable_created', 'deliverable_created_backfill')
);

-- Fix for SIL-51: Ensure UAT rollback deletes SLA segments to prevent FK constraint violations
create or replace function public.s015_rollback_uat_import(
  target_tenant_id uuid,
  target_client_id uuid,
  target_run_id text,
  dry_run boolean default true
)
returns table (deliverable_count integer, version_count integer, task_count integer, would_delete boolean)
language plpgsql
security definer
set search_path = public
as $BODY
declare
  d_count integer;
  v_count integer;
  t_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select count(*)::integer into d_count from public.deliverables
    where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;
  select count(*)::integer into v_count from public.deliverable_versions
    where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;
  select count(*)::integer into t_count from public.deliverable_tasks
    where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;

  if not dry_run and exists (
    select 1 from public.deliverables d
    where d.tenant_id = target_tenant_id and d.client_id = target_client_id
      and d.import_run_id = target_run_id
      and (
        d.status <> 'not_started'
        or exists (select 1 from public.approval_decisions a where a.deliverable_id = d.id)
        or exists (select 1 from public.comments c where c.deliverable_id = d.id)
        or exists (select 1 from public.file_assets f where f.deliverable_id = d.id)
      )
  ) then
    raise exception 'used import requires forward cleanup' using errcode = 'P0001';
  end if;
  if not dry_run then
    delete from public.deliverable_tasks where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;
    update public.deliverables set current_version_id = null where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;
    delete from public.deliverable_versions where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;

    -- Fix: delete SLA segments that reference these deliverables
    delete from public.sla_timeline_segments where tenant_id = target_tenant_id and client_id = target_client_id and deliverable_id in (
      select id from public.deliverables where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id
    );

    delete from public.deliverables where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;
  end if;
  return query select d_count, v_count, t_count, not dry_run;
end;
$BODY;
