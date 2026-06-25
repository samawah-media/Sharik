-- F-001A identity, membership, permission, and audit foundation.
-- This migration intentionally excludes client management commands and invitation lifecycle.

create table if not exists public.tenants (
  id uuid primary key,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_memberships (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  auth_user_id uuid not null,
  status text not null check (status in ('active', 'disabled', 'removed')),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists public.client_memberships (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  client_id uuid not null,
  auth_user_id uuid not null,
  status text not null check (status in ('active', 'disabled', 'removed')),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists public.clients (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  primary_contact_name text,
  primary_contact_email text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (tenant_id, slug)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_memberships_client_id_fkey'
      and conrelid = 'public.client_memberships'::regclass
  ) then
    alter table public.client_memberships
      add constraint client_memberships_client_id_fkey
      foreign key (client_id) references public.clients(id);
  end if;
end;
$$;

create table if not exists public.role_assignments (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  membership_id uuid not null references public.tenant_memberships(id),
  role_key text not null,
  scope_type text not null check (scope_type in ('tenant', 'client')),
  scope_id uuid not null,
  status text not null check (status in ('active', 'disabled', 'removed')),
  assigned_at timestamptz not null default now()
);

create table if not exists public.permission_references (
  id text primary key,
  description text not null,
  status text not null default 'active'
);

create table if not exists public.audit_events (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  client_id uuid,
  actor_user_id uuid,
  action text not null,
  decision text not null check (decision in ('allowed', 'denied')),
  target_type text not null,
  target_id text not null,
  reason text,
  occurred_at timestamptz not null default now()
);

create or replace function public.f001_prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events are append-only'
    using errcode = '42501';
end;
$$;

drop trigger if exists f001_audit_events_append_only on public.audit_events;
create trigger f001_audit_events_append_only
before update or delete on public.audit_events
for each statement
execute function public.f001_prevent_audit_event_mutation();

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.client_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.role_assignments enable row level security;
alter table public.permission_references enable row level security;
alter table public.audit_events enable row level security;
