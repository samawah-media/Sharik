-- Spec 015: reject placeholder-only client reviews and make client_viewer read-only.
-- Additive correction; existing client activity is never rewritten.

create or replace function private.s015_meaningful_client_review_text(
  target_text text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select case
    when target_text is null then false
    else
      lower(regexp_replace(btrim(target_text), '[[:space:]]+', ' ', 'g'))
        not in (
          '-', '--', '–', '—', '_', '.', '...',
          'n/a', 'na', 'none', 'null', 'tbd',
          'لا يوجد', 'لا يوجد محتوى', 'غير متاح', 'غير متاحة',
          'غير متوفر', 'غير محدد', 'لاحقا', 'لاحقًا'
        )
      and btrim(target_text) ~ '[[:alpha:]]'
  end;
$$;

revoke all on function private.s015_meaningful_client_review_text(text)
  from public, anon, authenticated;

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
          private.s015_meaningful_client_review_text(v.caption)
          or private.s015_meaningful_client_review_text(v.content_body)
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

create or replace function private.s015_can_upload_storage_object(
  target_bucket_id text,
  target_name text
)
returns boolean
language sql
security definer
set search_path = public, storage
stable
as $$
  select target_bucket_id = 'deliverable-assets' and exists (
    select 1
    from private.s015_storage_scope(target_name) s
    join public.deliverables d
      on d.tenant_id = s.tenant_id
     and d.client_id = s.client_id
     and d.id = s.deliverable_id
     and d.current_version_id = s.version_id
    join public.deliverable_versions v
      on v.tenant_id = d.tenant_id
     and v.client_id = d.client_id
     and v.deliverable_id = d.id
     and v.id = s.version_id
    where private.s015_team_can_execute_deliverable(d)
      or (
        public.f001_active_client_member(d.tenant_id, d.client_id)
        and public.f001_has_active_role(
          d.tenant_id,
          array['client_admin','client_approver'],
          'client', d.client_id
        )
        and public.s015_client_current_version_is_visible(
          d.tenant_id, d.client_id, d.id, v.id
        )
      )
  );
$$;

revoke all on function private.s015_can_upload_storage_object(text, text)
  from public, anon, authenticated;
grant execute on function private.s015_can_upload_storage_object(text, text)
  to authenticated;

create or replace function private.s015_enforce_client_viewer_comment_read_only()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is not null
    and new.comment_type = 'client_comment'
    and public.f001_active_client_member(new.tenant_id, new.client_id)
    and public.f001_has_active_role(
      new.tenant_id, array['client_viewer'], 'client', new.client_id
    )
    and not public.f001_has_active_role(
      new.tenant_id,
      array['client_admin','client_approver'],
      'client', new.client_id
    ) then
    raise exception 'client comment denied' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.s015_enforce_client_viewer_comment_read_only()
  from public, anon, authenticated;

drop trigger if exists s015_client_viewer_comment_read_only on public.comments;
create trigger s015_client_viewer_comment_read_only
before insert on public.comments
for each row
execute function private.s015_enforce_client_viewer_comment_read_only();

create or replace function private.s015_enforce_client_viewer_upload_read_only()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is not null
    and new.visibility = 'client_uploaded'
    and public.f001_active_client_member(new.tenant_id, new.client_id)
    and public.f001_has_active_role(
      new.tenant_id, array['client_viewer'], 'client', new.client_id
    )
    and not public.f001_has_active_role(
      new.tenant_id,
      array['client_admin','client_approver'],
      'client', new.client_id
    ) then
    raise exception 'client upload denied' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.s015_enforce_client_viewer_upload_read_only()
  from public, anon, authenticated;

drop trigger if exists s015_client_viewer_upload_read_only on public.file_assets;
create trigger s015_client_viewer_upload_read_only
before insert on public.file_assets
for each row
execute function private.s015_enforce_client_viewer_upload_read_only();
