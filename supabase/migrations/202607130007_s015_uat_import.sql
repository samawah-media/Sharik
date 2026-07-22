-- Spec 015 X007: generic run-scoped UAT import and guarded rollback.

alter table public.deliverables
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists import_run_id text;
alter table public.deliverable_versions
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists import_run_id text;
alter table public.deliverable_tasks
  add column if not exists import_run_id text;

create index if not exists deliverables_import_run_idx
  on public.deliverables (tenant_id, client_id, import_run_id)
  where import_run_id is not null;
create index if not exists deliverable_versions_import_run_idx
  on public.deliverable_versions (tenant_id, client_id, import_run_id)
  where import_run_id is not null;
create index if not exists deliverable_tasks_import_run_idx
  on public.deliverable_tasks (tenant_id, client_id, import_run_id)
  where import_run_id is not null;

create or replace function public.s015_import_uat_payload(
  target_tenant_id uuid,
  target_client_id uuid,
  target_contract_id uuid,
  target_package_id uuid,
  target_run_id text,
  payload jsonb
)
returns table (deliverable_count integer, version_count integer, task_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if target_run_id !~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,80}$'
    or jsonb_typeof(payload->'deliverables') <> 'array'
    or jsonb_typeof(payload->'tasks') <> 'array' then
    raise exception 'invalid import payload' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.clients c
    where c.id = target_client_id and c.tenant_id = target_tenant_id
  ) then
    raise exception 'import scope unavailable' using errcode = '42501';
  end if;
  if exists (
    select 1 from jsonb_array_elements(payload->'deliverables') x
    join public.deliverables d on d.id = (x->>'id')::uuid
    where d.tenant_id <> target_tenant_id
       or d.client_id <> target_client_id
       or d.import_run_id is distinct from target_run_id
  ) then
    raise exception 'import id conflict' using errcode = 'P0001';
  end if;

  for item in select * from jsonb_array_elements(payload->'deliverables') loop
    insert into public.deliverables (
      id, tenant_id, client_id, contract_id, package_id,
      name, description, type, status, priority, progress_percentage,
      requires_internal_approval, requires_client_approval,
      idempotency_key, source_metadata, import_run_id
    ) values (
      (item->>'id')::uuid, target_tenant_id, target_client_id,
      target_contract_id, target_package_id,
      item->>'name', nullif(item->>'description',''), item->>'type',
      'not_started', coalesce(nullif(item->>'priority',''),'normal'), 0,
      true, true, concat('s015-import-', target_run_id, '-', item->>'id'),
      coalesce(item->'sourceMetadata','{}'::jsonb), target_run_id
    ) on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      type = excluded.type,
      source_metadata = excluded.source_metadata,
      updated_at = now()
    where public.deliverables.import_run_id = target_run_id
      and public.deliverables.status = 'not_started';

    insert into public.deliverable_versions (
      id, tenant_id, client_id, deliverable_id, version_number, status,
      brief, content_body, caption, channel, format, objective, kpi,
      source_reference, source_metadata, import_run_id
    ) values (
      (item->>'versionId')::uuid, target_tenant_id, target_client_id,
      (item->>'id')::uuid, 1, 'draft', nullif(item->>'brief',''),
      nullif(item->>'contentBody',''), nullif(item->>'caption',''),
      nullif(item->>'channel',''), nullif(item->>'format',''),
      nullif(item->>'objective',''), nullif(item->>'kpi',''),
      nullif(item->>'sourceReference',''),
      coalesce(item->'sourceMetadata','{}'::jsonb), target_run_id
    ) on conflict (id) do update set
      brief = excluded.brief,
      content_body = excluded.content_body,
      caption = excluded.caption,
      channel = excluded.channel,
      format = excluded.format,
      objective = excluded.objective,
      kpi = excluded.kpi,
      source_reference = excluded.source_reference,
      source_metadata = excluded.source_metadata
    where public.deliverable_versions.import_run_id = target_run_id
      and public.deliverable_versions.status = 'draft';

    update public.deliverables set current_version_id = (item->>'versionId')::uuid
    where id = (item->>'id')::uuid and import_run_id = target_run_id
      and status = 'not_started';
  end loop;

  for item in select * from jsonb_array_elements(payload->'tasks') loop
    insert into public.deliverable_tasks (
      id, tenant_id, client_id, deliverable_id, version_id, title,
      description, status, priority, due_date, sort_order,
      source_metadata, import_run_id
    ) values (
      (item->>'id')::uuid, target_tenant_id, target_client_id,
      (item->>'deliverableId')::uuid, (item->>'versionId')::uuid,
      item->>'title', nullif(item->>'description',''),
      coalesce(nullif(item->>'status',''),'todo'),
      coalesce(nullif(item->>'priority',''),'normal'),
      nullif(item->>'dueDate','')::date,
      coalesce((item->>'sortOrder')::integer, 0),
      coalesce(item->'sourceMetadata','{}'::jsonb), target_run_id
    ) on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      due_date = excluded.due_date,
      sort_order = excluded.sort_order,
      source_metadata = excluded.source_metadata,
      updated_at = now()
    where public.deliverable_tasks.import_run_id = target_run_id;
  end loop;

  return query select
    (select count(*)::integer from public.deliverables where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id),
    (select count(*)::integer from public.deliverable_versions where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id),
    (select count(*)::integer from public.deliverable_tasks where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id);
end;
$$;

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
as $$
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
    delete from public.deliverables where tenant_id = target_tenant_id and client_id = target_client_id and import_run_id = target_run_id;
  end if;
  return query select d_count, v_count, t_count, not dry_run;
end;
$$;

revoke all on function public.s015_import_uat_payload(uuid,uuid,uuid,uuid,text,jsonb),
  public.s015_rollback_uat_import(uuid,uuid,text,boolean)
  from public, anon, authenticated;
grant execute on function public.s015_import_uat_payload(uuid,uuid,uuid,uuid,text,jsonb),
  public.s015_rollback_uat_import(uuid,uuid,text,boolean)
  to service_role;
