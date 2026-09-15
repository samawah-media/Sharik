-- S015 SIL-66: one count unit is one independently managed deliverable.
-- Existing allocations are retained; the invariant applies to new/updated rows.

create or replace function public.s015_enforce_single_count_unit_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_unit_label text;
  normalized_unit_label text;
begin
  select pl.unit_label
    into target_unit_label
  from public.package_lines pl
  where pl.id = new.package_line_id
    and pl.tenant_id = new.tenant_id
    and pl.client_id = new.client_id;

  if target_unit_label is null then
    raise exception 'package line is outside allocation scope'
      using errcode = '23503';
  end if;

  normalized_unit_label := lower(btrim(target_unit_label));

  if normalized_unit_label = any (array[
    'item', 'items', 'post', 'posts', 'reel', 'reels', 'story', 'stories',
    'design', 'designs', 'video', 'videos', 'report', 'reports',
    'منشور', 'منشورات', 'ريل', 'ريلز', 'ستوري', 'قصة', 'قصص',
    'تصميم', 'تصاميم', 'فيديو', 'فيديوهات', 'تقرير', 'تقارير'
  ]) and new.reserved_quantity <> 1 then
    raise exception 'count unit requires one deliverable per reserved unit'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.s015_enforce_single_count_unit_allocation()
  from public, anon, authenticated;

drop trigger if exists s015_single_count_unit_allocation
  on public.deliverable_allocations;
create trigger s015_single_count_unit_allocation
before insert or update of tenant_id, client_id, package_line_id, reserved_quantity
on public.deliverable_allocations
for each row
execute function public.s015_enforce_single_count_unit_allocation();
