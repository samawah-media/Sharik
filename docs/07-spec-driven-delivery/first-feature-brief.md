# First Feature Brief: Secure Tenant and Client Onboarding

## Problem

Sharik cannot safely implement deliverables, approvals, files, SLA, or client portal workflows until users, tenants, client scopes, roles, permissions, and audit events are reliable.

## Business Outcome

Samawah can onboard its own tenant, create clients, invite team/client users, assign scoped roles, and prove unauthorized client access is denied.

## Personas

- Tenant administrator.
- Project/account manager.
- Team member.
- Client admin.
- Client approver.
- Client viewer.

## Included Scope

- Authenticated user signs in.
- User joins Samawah tenant.
- Tenant admin creates a client.
- Tenant admin invites a team member.
- Tenant admin/client admin invites a client user according to policy.
- Admin assigns tenant/client scope and role.
- User sees navigation appropriate to role and scope.
- User cannot access unauthorized client.
- Membership/role/client events are audited.

## Excluded Scope

- Contracts, packages, deliverables, files, comments, approvals, SLA, billing, social scheduling, AI, CRM.
- Advanced delegation/offboarding unless required for safe invite lifecycle.

## Core Flows

1. Admin signs in and selects Samawah tenant.
2. Admin creates client with required metadata.
3. Admin invites team user and assigns role/scope.
4. Admin invites client user and assigns `client_admin`, `client_approver`, or `client_viewer`.
5. Invited user accepts and sees role-scoped navigation.
6. Unauthorized client URL/resource returns denied/404 without leaking data.

## Permissions

- MEMBERSHIP.INVITE_TEAM
- MEMBERSHIP.INVITE_CLIENT
- MEMBERSHIP.ASSIGN_ROLE
- CLIENT.CREATE
- CLIENT.READ_SCOPED
- SETTINGS.MANAGE_MEMBERS
- AUDIT.READ_INTERNAL

## Security Invariants

- Tenant context is derived from authenticated membership.
- Client scope is required for client data.
- Deny by default.
- Role changes are audited.
- Client users never gain internal management or other-client visibility.

## UX Surfaces

- Sign-in/select tenant.
- Management console: clients and members.
- Invitation accept flow.
- Role-scoped navigation.
- Denied/empty states.
- Mobile-friendly client invitation acceptance.

## Domain Events and Audit Events

- TenantMembershipCreated
- TenantMembershipActivated
- ClientCreated
- ClientMembershipInvited
- ClientMembershipActivated
- RoleAssigned
- ScopeChanged
- AccessDeniedCrossClient

## NFRs

- Arabic RTL.
- Mobile-safe invite acceptance.
- Idempotent invite accept.
- No secrets in browser.
- Permission denial does not disclose resource existence.

## Acceptance Examples

- Given a client approver for Client A, when they try Client B URL, then access is denied and no Client B data is returned.
- Given a client viewer, when they open navigation, then approval/admin items are absent and direct commands are denied.
- Given an admin assigns a role, then audit records actor, target, scope, old/new role where safe.

## Failure Scenarios

- Expired/revoked invite.
- User has tenant membership but no client scope.
- Duplicate invite acceptance.
- Admin tries to assign role outside their authority.
- Client user attempts management console access.

## Dependencies

- Supabase Auth.
- Membership/permission model.
- Audit event foundation.
- RLS/server authorization design.

## Rabbit Holes

- Full HR/team directory.
- Complex delegation.
- SSO.
- Bulk imports.
- Client self-service org management.

## Recommended Appetite

One focused cycle.

## Why It Is First

It protects all later work from the highest-risk failure: cross-tenant/client data leakage and unauthorized sensitive commands.

## Readiness Gaps

- Decide minimum offboarding/revoke behavior for V1.
- Define invite expiry duration.
- Decide whether client admin can invite other client users in V1 or only Samawah admin can.
