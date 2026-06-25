-- F-001A A4 client member invitation foundation.
-- This migration is limited to client invitations and preserves the
-- management-only invitation/audit RLS policies introduced in A3.

alter table public.invitations
drop constraint if exists invitations_membership_type_check;

alter table public.invitations
add constraint invitations_membership_type_check
check (membership_type in ('internal', 'client'));

alter table public.invitations
drop constraint if exists invitations_f001_membership_role_scope_check;

alter table public.invitations
add constraint invitations_f001_membership_role_scope_check
check (
  (
    membership_type = 'internal'
    and role_key in ('account_manager', 'content_writer', 'designer')
    and array_length(client_ids, 1) >= 1
  )
  or (
    membership_type = 'client'
    and role_key in ('client_admin', 'client_approver', 'client_viewer')
    and array_length(client_ids, 1) = 1
  )
);

create unique index if not exists invitations_pending_client_scope_key
on public.invitations (
  tenant_id,
  lower(invited_email),
  role_key,
  client_ids
)
where status = 'pending' and membership_type = 'client';
