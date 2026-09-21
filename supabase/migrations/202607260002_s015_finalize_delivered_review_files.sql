-- Spec 015 X009-D: a current-version file staged for client review becomes a
-- final delivery atomically when its deliverable reaches delivered.

create or replace function public.s015_finalize_delivered_review_files()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  promoted_file record;
begin
  if new.status <> 'delivered' or old.status = 'delivered' then
    return new;
  end if;

  for promoted_file in
    update public.file_assets f
    set visibility = 'final_delivery',
        is_final = true
    where f.tenant_id = new.tenant_id
      and f.client_id = new.client_id
      and f.deliverable_id = new.id
      and f.version_id = new.current_version_id
      and f.upload_state = 'ready'
      and f.visibility = 'client_visible'
      and not f.is_final
    returning f.id
  loop
    insert into public.audit_events (
      id, tenant_id, client_id, actor_user_id, action, decision,
      target_type, target_id, reason
    ) values (
      gen_random_uuid(), new.tenant_id, new.client_id, auth.uid(),
      'FileAssetPromotedToFinalDelivery', 'allowed',
      'file_asset', promoted_file.id::text, 'deliverable_final_delivery'
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists s015_finalize_delivered_review_files
  on public.deliverables;
create trigger s015_finalize_delivered_review_files
after update of status on public.deliverables
for each row
execute function public.s015_finalize_delivered_review_files();

revoke all on function public.s015_finalize_delivered_review_files()
  from public, anon, authenticated;

-- Repair only the exact current-version review files that were already
-- delivered before this trigger existed.
with promoted as (
  update public.file_assets f
  set visibility = 'final_delivery',
      is_final = true
  from public.deliverables d
  where d.id = f.deliverable_id
    and d.tenant_id = f.tenant_id
    and d.client_id = f.client_id
    and d.current_version_id = f.version_id
    and d.status = 'delivered'
    and f.upload_state = 'ready'
    and f.visibility = 'client_visible'
    and not f.is_final
  returning f.id, f.tenant_id, f.client_id
)
insert into public.audit_events (
  id, tenant_id, client_id, actor_user_id, action, decision,
  target_type, target_id, reason
)
select
  gen_random_uuid(), tenant_id, client_id, null,
  'FileAssetPromotedToFinalDelivery', 'allowed',
  'file_asset', id::text, 'x009d_delivered_file_backfill'
from promoted;
