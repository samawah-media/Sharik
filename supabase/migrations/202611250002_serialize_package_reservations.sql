create or replace function public.enforce_package_reservation_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  available_quantity numeric;
begin
  -- Lock the line until commit, then read the ledger with a fresh snapshot.
  -- NO KEY UPDATE is compatible with the foreign keys on newly created cards.
  perform 1
  from public.package_lines
  where id = new.package_line_id
    and tenant_id = new.tenant_id
    and client_id = new.client_id
  for no key update;

  if not found then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select balance.available into available_quantity
  from public.f002_package_line_balance(new.package_line_id) as balance;

  if not found or available_quantity < new.quantity then
    raise exception 'insufficient package capacity' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_package_reservation_capacity()
from public, anon, authenticated;

create trigger enforce_package_reservation_capacity
before insert on public.package_ledger_entries
for each row
when (new.entry_type = 'quantity_reserved')
execute function public.enforce_package_reservation_capacity();
