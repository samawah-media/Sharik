-- SIL54: final delivery transfers reserved quantity into consumed usage.
-- Correct the projection only; retain append-only ledger and allocation history.
create or replace function public.f002_package_line_balance(target_package_line_id uuid)
returns table (
  package_line_id uuid,
  committed numeric,
  reserved numeric,
  consumed numeric,
  released numeric,
  adjustments numeric,
  available numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select
      target_package_line_id as package_line_id,
      coalesce(sum(quantity) filter (
        where entry_type in ('commitment_added', 'contract_amendment')
      ), 0)::numeric as committed,
      coalesce(sum(quantity) filter (
        where entry_type = 'quantity_reserved'
      ), 0)::numeric as reserved_total,
      coalesce(sum(quantity) filter (
        where entry_type = 'reservation_released'
      ), 0)::numeric as released,
      coalesce(sum(quantity) filter (
        where entry_type = 'quantity_consumed'
      ), 0)::numeric as consumed,
      coalesce(sum(quantity) filter (
        where entry_type = 'administrative_adjustment'
      ), 0)::numeric as adjustments
    from public.package_ledger_entries
    where package_line_id = target_package_line_id
  ),
  projected as (
    select
      totals.package_line_id,
      totals.committed,
      greatest(0, totals.reserved_total - totals.released - totals.consumed)::numeric as reserved,
      totals.consumed,
      totals.released,
      totals.adjustments
    from totals
  )
  select
    projected.package_line_id,
    projected.committed,
    projected.reserved,
    projected.consumed,
    projected.released,
    projected.adjustments,
    (
      projected.committed
      + projected.adjustments
      - projected.reserved
      - projected.consumed
    )::numeric as available
  from projected;
$$;

revoke all on function public.f002_package_line_balance(uuid) from public, anon, authenticated;
