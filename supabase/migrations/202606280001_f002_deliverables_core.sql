-- F-002 deliverables core: contracts, packages, deliverables, and package ledger.
-- This migration keeps Data API writes closed and exposes only reviewed reads.
-- Sensitive mutations remain server-command/RPC work for later F-002 tasks.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_id_tenant_id_unique'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_id_tenant_id_unique unique (id, tenant_id);
  end if;
end;
$$;

create table if not exists public.contracts (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  client_id uuid not null,
  name text not null,
  reference text,
  summary text,
  period_start date,
  period_end date,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'cancelled', 'archived')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint contracts_client_same_tenant
    foreign key (client_id, tenant_id) references public.clients(id, tenant_id),
  constraint contracts_period_order
    check (period_start is null or period_end is null or period_start <= period_end)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contracts_id_tenant_client_unique'
      and conrelid = 'public.contracts'::regclass
  ) then
    alter table public.contracts
      add constraint contracts_id_tenant_client_unique unique (id, tenant_id, client_id);
  end if;
end;
$$;

create table if not exists public.contract_amendments (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  contract_id uuid not null,
  version_number integer not null check (version_number > 0),
  change_type text not null,
  effective_at timestamptz not null default now(),
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint contract_amendments_contract_scope
    foreign key (contract_id, tenant_id, client_id)
    references public.contracts(id, tenant_id, client_id),
  unique (tenant_id, contract_id, version_number)
);

create table if not exists public.packages (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  contract_id uuid not null,
  name text not null,
  period_start date,
  period_end date,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'cancelled', 'archived')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packages_contract_scope
    foreign key (contract_id, tenant_id, client_id)
    references public.contracts(id, tenant_id, client_id),
  constraint packages_period_order
    check (period_start is null or period_end is null or period_start <= period_end)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'packages_id_tenant_client_unique'
      and conrelid = 'public.packages'::regclass
  ) then
    alter table public.packages
      add constraint packages_id_tenant_client_unique unique (id, tenant_id, client_id);
  end if;
end;
$$;

create table if not exists public.package_lines (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  package_id uuid not null,
  service_label text not null,
  deliverable_type_hint text,
  unit_label text not null,
  committed_quantity numeric(12, 2) not null check (committed_quantity >= 0),
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled', 'archived')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint package_lines_package_scope
    foreign key (package_id, tenant_id, client_id)
    references public.packages(id, tenant_id, client_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'package_lines_id_tenant_client_unique'
      and conrelid = 'public.package_lines'::regclass
  ) then
    alter table public.package_lines
      add constraint package_lines_id_tenant_client_unique unique (id, tenant_id, client_id);
  end if;
end;
$$;

create table if not exists public.deliverables (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  contract_id uuid,
  package_id uuid,
  package_line_id uuid,
  name text not null,
  description text,
  type text not null,
  status text not null default 'not_started'
    check (
      status in (
        'not_started',
        'in_progress',
        'ready_for_internal_review',
        'internal_changes_requested',
        'internally_approved',
        'waiting_client_approval',
        'client_changes_requested',
        'client_approved',
        'ready_for_delivery',
        'delivered',
        'cancelled',
        'archived'
      )
    ),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  owner_user_id uuid,
  contributor_user_ids uuid[] not null default '{}',
  start_date date,
  internal_due_date date,
  client_due_date date,
  final_due_date date,
  requires_internal_approval boolean not null default true,
  requires_client_approval boolean not null default true,
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  approved_extra boolean not null default false,
  extra_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  revision integer not null default 1 check (revision > 0),
  constraint deliverables_client_scope
    foreign key (client_id, tenant_id) references public.clients(id, tenant_id),
  constraint deliverables_contract_scope
    foreign key (contract_id, tenant_id, client_id)
    references public.contracts(id, tenant_id, client_id),
  constraint deliverables_package_scope
    foreign key (package_id, tenant_id, client_id)
    references public.packages(id, tenant_id, client_id),
  constraint deliverables_package_line_scope
    foreign key (package_line_id, tenant_id, client_id)
    references public.package_lines(id, tenant_id, client_id),
  constraint deliverables_approved_extra_reason
    check (not approved_extra or extra_reason is not null),
  constraint deliverables_initial_progress_status
    check (
      (status = 'not_started' and progress_percentage = 0)
      or status <> 'not_started'
    )
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'deliverables_id_tenant_client_unique'
      and conrelid = 'public.deliverables'::regclass
  ) then
    alter table public.deliverables
      add constraint deliverables_id_tenant_client_unique unique (id, tenant_id, client_id);
  end if;
end;
$$;

create table if not exists public.package_ledger_entries (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  contract_id uuid not null,
  package_id uuid not null,
  package_line_id uuid not null,
  deliverable_id uuid,
  entry_type text not null
    check (
      entry_type in (
        'commitment_added',
        'quantity_reserved',
        'reservation_released',
        'administrative_adjustment',
        'contract_amendment',
        'quantity_consumed'
      )
    ),
  quantity numeric(12, 2) not null,
  reason text,
  actor_user_id uuid,
  idempotency_key text not null,
  occurred_at timestamptz not null default now(),
  constraint package_ledger_contract_scope
    foreign key (contract_id, tenant_id, client_id)
    references public.contracts(id, tenant_id, client_id),
  constraint package_ledger_package_scope
    foreign key (package_id, tenant_id, client_id)
    references public.packages(id, tenant_id, client_id),
  constraint package_ledger_line_scope
    foreign key (package_line_id, tenant_id, client_id)
    references public.package_lines(id, tenant_id, client_id),
  constraint package_ledger_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint package_ledger_quantity_direction
    check (
      (entry_type in ('administrative_adjustment', 'contract_amendment') and quantity <> 0)
      or (entry_type not in ('administrative_adjustment', 'contract_amendment') and quantity > 0)
    ),
  unique (tenant_id, idempotency_key)
);

create table if not exists public.deliverable_allocations (
  id uuid primary key,
  tenant_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  package_line_id uuid not null,
  reserved_quantity numeric(12, 2) not null check (reserved_quantity > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'released', 'consumed_later', 'cancelled')),
  reservation_ledger_entry_id uuid not null references public.package_ledger_entries(id),
  release_ledger_entry_id uuid references public.package_ledger_entries(id),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  constraint deliverable_allocations_deliverable_scope
    foreign key (deliverable_id, tenant_id, client_id)
    references public.deliverables(id, tenant_id, client_id),
  constraint deliverable_allocations_line_scope
    foreign key (package_line_id, tenant_id, client_id)
    references public.package_lines(id, tenant_id, client_id)
);

create unique index if not exists deliverable_allocations_one_active_reservation
on public.deliverable_allocations (tenant_id, client_id, deliverable_id, package_line_id)
where status = 'reserved';

create index if not exists contracts_tenant_client_idx
on public.contracts (tenant_id, client_id);

create index if not exists packages_tenant_client_contract_idx
on public.packages (tenant_id, client_id, contract_id);

create index if not exists package_lines_tenant_client_package_idx
on public.package_lines (tenant_id, client_id, package_id);

create index if not exists deliverables_tenant_client_status_idx
on public.deliverables (tenant_id, client_id, status);

create index if not exists package_ledger_line_idx
on public.package_ledger_entries (tenant_id, client_id, package_line_id, occurred_at);

create or replace function public.f002_prevent_package_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'package_ledger_entries are append-only'
    using errcode = '42501';
end;
$$;

drop trigger if exists f002_package_ledger_append_only on public.package_ledger_entries;
create trigger f002_package_ledger_append_only
before update or delete on public.package_ledger_entries
for each statement
execute function public.f002_prevent_package_ledger_mutation();

alter table public.contracts enable row level security;
alter table public.contract_amendments enable row level security;
alter table public.packages enable row level security;
alter table public.package_lines enable row level security;
alter table public.deliverables enable row level security;
alter table public.package_ledger_entries enable row level security;
alter table public.deliverable_allocations enable row level security;

grant usage on schema public to authenticated;

grant select on public.contracts to authenticated;
grant select on public.contract_amendments to authenticated;
grant select on public.packages to authenticated;
grant select on public.package_lines to authenticated;
grant select on public.deliverables to authenticated;
grant select on public.package_ledger_entries to authenticated;
grant select on public.deliverable_allocations to authenticated;

revoke insert, update, delete on public.contracts from anon, authenticated;
revoke insert, update, delete on public.contract_amendments from anon, authenticated;
revoke insert, update, delete on public.packages from anon, authenticated;
revoke insert, update, delete on public.package_lines from anon, authenticated;
revoke insert, update, delete on public.deliverables from anon, authenticated;
revoke insert, update, delete on public.package_ledger_entries from anon, authenticated;
revoke insert, update, delete on public.deliverable_allocations from anon, authenticated;

drop policy if exists "f002 management select contracts" on public.contracts;
create policy "f002 management select contracts"
on public.contracts
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy if exists "f002 management select contract amendments" on public.contract_amendments;
create policy "f002 management select contract amendments"
on public.contract_amendments
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager'],
    'client',
    client_id
  )
);

drop policy if exists "f002 management select packages" on public.packages;
create policy "f002 management select packages"
on public.packages
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy if exists "f002 management select package lines" on public.package_lines;
create policy "f002 management select package lines"
on public.package_lines
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy if exists "f002 management select deliverables" on public.deliverables;
create policy "f002 management select deliverables"
on public.deliverables
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager', 'content_writer', 'designer'],
    'client',
    client_id
  )
);

drop policy if exists "f002 management select package ledger" on public.package_ledger_entries;
create policy "f002 management select package ledger"
on public.package_ledger_entries
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager'],
    'client',
    client_id
  )
);

drop policy if exists "f002 management select deliverable allocations" on public.deliverable_allocations;
create policy "f002 management select deliverable allocations"
on public.deliverable_allocations
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
  or public.f001_has_active_role(
    tenant_id,
    array['account_manager'],
    'client',
    client_id
  )
);

insert into public.permission_references (id, description, status)
values
  ('PERM.CONTRACT.CREATE', 'Create client contract context', 'active'),
  ('PERM.CONTRACT.VIEW', 'View scoped contract summaries', 'active'),
  ('PERM.PACKAGE.CREATE', 'Create package and package lines', 'active'),
  ('PERM.PACKAGE.ADJUST', 'Adjust package commitments with audit', 'active'),
  ('PERM.DELIVERABLE.CREATE', 'Create agreed deliverables', 'active'),
  ('PERM.DELIVERABLE.EXTRA_CREATE', 'Create approved extra deliverables', 'active'),
  ('PERM.DELIVERABLE.CANCEL_NOT_STARTED', 'Cancel not-started deliverables', 'active'),
  ('PERM.LEDGER.VIEW_SUMMARY', 'View derived package balance summaries', 'active')
on conflict (id) do update
set
  description = excluded.description,
  status = excluded.status;

