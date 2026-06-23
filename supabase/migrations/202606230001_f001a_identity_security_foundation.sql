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

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.client_memberships enable row level security;
alter table public.role_assignments enable row level security;
alter table public.permission_references enable row level security;
alter table public.audit_events enable row level security;
