-- Spec 015 X006: persistent internal execution workspace primitives.

alter table public.comments
  add column if not exists body_format text not null default 'plain_text'
    check (body_format in ('plain_text', 'tiptap_json')),
  add column if not exists body_json jsonb;

alter table public.file_assets
  add column if not exists bucket_id text not null default 'deliverable-assets',
  add column if not exists file_name text,
  add column if not exists upload_idempotency_key text,
  add column if not exists upload_state text not null default 'ready'
    check (upload_state in ('pending', 'ready', 'failed'));

create unique index if not exists file_assets_bucket_storage_path_key
  on public.file_assets (bucket_id, storage_path);
create unique index if not exists file_assets_upload_idempotency_key
  on public.file_assets (tenant_id, upload_idempotency_key)
  where upload_idempotency_key is not null;

create table if not exists public.deliverable_tasks (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid,
  title text not null check (char_length(btrim(title)) between 2 and 200),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assignee_user_id uuid,
  due_date date,
  sort_order integer not null default 0,
  source_metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deliverable_tasks_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint deliverable_tasks_version_scope
    foreign key (version_id, deliverable_id, tenant_id, client_id)
    references public.deliverable_versions(id, deliverable_id, tenant_id, client_id)
);

create table if not exists public.deliverable_quality_checks (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid not null,
  label text not null check (char_length(btrim(label)) between 2 and 200),
  status text not null default 'pending' check (status in ('pending', 'passed', 'changes_required', 'not_applicable')),
  note text,
  checked_by uuid,
  checked_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deliverable_quality_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint deliverable_quality_version_scope
    foreign key (version_id, deliverable_id, tenant_id, client_id)
    references public.deliverable_versions(id, deliverable_id, tenant_id, client_id)
);

create index if not exists deliverable_tasks_workspace_idx
  on public.deliverable_tasks (tenant_id, client_id, deliverable_id, sort_order);
create index if not exists deliverable_quality_workspace_idx
  on public.deliverable_quality_checks (tenant_id, client_id, deliverable_id, version_id, sort_order);

alter table public.deliverable_tasks enable row level security;
alter table public.deliverable_quality_checks enable row level security;

drop policy if exists s015_deliverable_tasks_select on public.deliverable_tasks;
create policy s015_deliverable_tasks_select on public.deliverable_tasks
  for select to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager','account_manager','content_writer','designer','performance_specialist'],
      'client', client_id
    )
  );

drop policy if exists s015_deliverable_quality_select on public.deliverable_quality_checks;
create policy s015_deliverable_quality_select on public.deliverable_quality_checks
  for select to authenticated using (
    public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'tenant', tenant_id
    )
    or public.f001_has_active_role(
      tenant_id,
      array['tenant_owner','tenant_administrator','project_manager','marketing_manager'],
      'client', client_id
    )
  );

revoke all on public.deliverable_tasks, public.deliverable_quality_checks
  from public, anon, authenticated;
grant select on public.deliverable_tasks, public.deliverable_quality_checks
  to authenticated;

-- Expand the private read helper only after execution tables exist. The caller
-- still needs a client-scoped internal role, and the target profile must be
-- connected to work the caller can already read.
create or replace function private.s015_can_read_member_profile(
  target_tenant_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.f001_has_active_role(
      target_tenant_id,
      array['tenant_owner', 'tenant_administrator', 'project_manager', 'marketing_manager'],
      'tenant', target_tenant_id
    )
    or exists (
      select 1
      from public.deliverables d
      where d.tenant_id = target_tenant_id
        and public.f001_has_active_role(
          d.tenant_id,
          array['account_manager', 'content_writer', 'designer', 'performance_specialist'],
          'client', d.client_id
        )
        and (
          d.owner_user_id = target_user_id
          or target_user_id = any(coalesce(d.contributor_user_ids, array[]::uuid[]))
          or exists (
            select 1 from public.deliverable_tasks t
            where t.tenant_id = d.tenant_id
              and t.client_id = d.client_id
              and t.deliverable_id = d.id
              and t.assignee_user_id = target_user_id
          )
          or exists (
            select 1 from public.comments c
            where c.tenant_id = d.tenant_id
              and c.client_id = d.client_id
              and c.deliverable_id = d.id
              and c.author_user_id = target_user_id
          )
          or exists (
            select 1 from public.approval_decisions a
            where a.tenant_id = d.tenant_id
              and a.client_id = d.client_id
              and a.deliverable_id = d.id
              and a.actor_user_id = target_user_id
          )
        )
    )
    or exists (
      select 1
      from public.comments c
      join public.deliverables d
        on d.tenant_id = c.tenant_id
       and d.client_id = c.client_id
       and d.id = c.deliverable_id
       and d.current_version_id = c.version_id
      where c.tenant_id = target_tenant_id
        and c.author_user_id = target_user_id
        and c.visibility = 'client_visible'
        and public.s015_client_current_version_is_visible(
          d.tenant_id, d.client_id, d.id, c.version_id
        )
    );
$$;

do $$
begin
  -- Supabase CLI's first `db start` applies user migrations before the Storage
  -- service bootstraps its schema. The following `db reset`, and hosted UAT,
  -- both have storage.buckets available and apply this reviewed configuration.
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'deliverable-assets',
      'deliverable-assets',
      false,
      104857600,
      array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf','text/plain']
    )
    on conflict (id) do update set
      public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end;
$$;
