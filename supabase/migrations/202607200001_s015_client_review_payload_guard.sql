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
