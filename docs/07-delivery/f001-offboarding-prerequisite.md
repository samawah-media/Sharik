# F-001 Offboarding Prerequisite

## Status

Accepted for F-001A Phase 6.

## Scope

F-001A can disable a tenant or client membership, revoke active role assignments, cancel pending invitations for the offboarded email, and record audit events.

F-001A does not implement deliverables, assignments, SLA ownership, files, approvals, or delivery-domain responsibility transfer. Those domains remain outside this slice.

## Required Later Gate

Before a later deliverables feature allows disabling a member who owns active work, that feature must provide a responsibility transfer check. The check must either:

- prove no active in-scope responsibilities exist, or
- record that responsibilities were transferred to another authorized active member.

If active responsibilities exist and transfer is not resolved, the disablement command must block and record a denied audit event.

## Audit Expectations

Relevant events:

- `MembershipSuspensionBlocked` when active responsibilities are unresolved.
- `MembershipSuspended` when a membership is disabled.
- `RoleRevoked` or revoked role assignment state when access is removed.
- `InvitationRevoked` when pending invitations for the offboarded target are cancelled.

## Out of Scope

- Deliverable owner transfer implementation.
- SLA reassignment or pause/resume changes.
- File ownership transfer.
- Client approval reassignment.
- Production Supabase data or real client data.
