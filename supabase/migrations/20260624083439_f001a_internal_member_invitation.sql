-- F-001A A3 internal member invitation foundation.
-- This migration intentionally excludes client member invitations, resend,
-- revoke, supersede, and broad invitation lifecycle hardening.

create table if not exists public.invitations (
  id uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  invited_email text not null,
  membership_type text not null check (membership_type in ('internal')),
  role_key text not null,
  client_ids uuid[] not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'superseded')),
  token_hash text not null,
  expires_at timestamptz not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  accepted_by uuid,
  accepted_at timestamptz,
  delivery_state text not null default 'queued' check (delivery_state in ('queued', 'sent', 'failed')),
  idempotency_key text
);

create unique index if not exists invitations_pending_internal_scope_key
on public.invitations (
  tenant_id,
  lower(invited_email),
  role_key,
  client_ids
)
where status = 'pending' and membership_type = 'internal';

alter table public.invitations enable row level security;

drop policy if exists "f001 invitation insert tenant management" on public.invitations;
create policy "f001 invitation insert tenant management"
on public.invitations
for insert
with check (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
);

drop policy if exists "f001 invitation select tenant management" on public.invitations;
create policy "f001 invitation select tenant management"
on public.invitations
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
);

drop policy if exists "f001 invitation update tenant management" on public.invitations;
create policy "f001 invitation update tenant management"
on public.invitations
for update
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
)
with check (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
);

drop policy if exists "f001 audit select tenant management" on public.audit_events;
create policy "f001 audit select tenant management"
on public.audit_events
for select
using (
  public.f001_has_active_role(
    tenant_id,
    array['tenant_owner', 'tenant_administrator'],
    'tenant',
    tenant_id
  )
);
