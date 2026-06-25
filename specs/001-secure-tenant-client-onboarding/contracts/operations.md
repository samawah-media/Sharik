# Operation Contracts: Secure Tenant and Client Onboarding

These contracts describe server-side behavior for a full-stack web application. They are not public REST API specifications and do not define implementation code.

## Shared Contract Rules

- All sensitive operations run server-side.
- Actor identity comes from the authenticated Supabase session.
- Tenant/client scope is resolved from active membership and target resource ownership, not trusted from browser input.
- All inputs are validated before mutation.
- Errors avoid resource enumeration.
- All sensitive allow/deny outcomes are audit eligible.
- Error codes are stable and can map to Arabic user-facing copy.

## Shared Error Codes

- `AUTH_REQUIRED`
- `SESSION_EXPIRED`
- `TENANT_ACCESS_DENIED`
- `CLIENT_ACCESS_DENIED`
- `PERMISSION_DENIED`
- `ROLE_ASSIGNMENT_DENIED`
- `MEMBERSHIP_DISABLED`
- `INVITATION_EXPIRED`
- `INVITATION_REVOKED`
- `INVITATION_SUPERSEDED`
- `INVITATION_ALREADY_USED`
- `INVITATION_NOT_FOUND`
- `EMAIL_MISMATCH`
- `VALIDATION_FAILED`
- `RATE_LIMITED`
- `CONFLICT_RETRY`
- `AUDIT_REQUIRED_FAILED`

## C-001 Authenticate User

- Operation ID: `auth.authenticate_user`
- Actor: anonymous or returning user.
- Required Permission: none before authentication.
- Scope: none until membership resolution.
- Input: credentials or Supabase Auth callback/session.
- Validation: valid Auth session; no authorization from metadata-only role.
- Server-side authorization: resolve active tenant/client memberships after authentication.
- Expected output: authenticated identity plus allowed entry context or safe empty/no-scope state.
- Error cases: `AUTH_REQUIRED`, `SESSION_EXPIRED`, `MEMBERSHIP_DISABLED`.
- Idempotency: repeated session resolution is read-only.
- Audit event: optional sign-in security event; membership-disabled denial is audit eligible.
- Rate-limit consideration: defer to Supabase Auth and application login throttling.
- Privacy consideration: do not reveal tenant/client names before membership resolution.
- Expected test coverage: integration, E2E session expiry, disabled membership.

## C-002 Create Client

- Operation ID: `client.create`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.CLIENT.CREATE`.
- Scope: active Samawah tenant membership.
- Input: client name, optional reference/contact fields, idempotency key.
- Validation: required fields, tenant-scoped uniqueness, no trusted tenant id.
- Server-side authorization: actor has active tenant membership and create permission.
- Expected output: client summary scoped to tenant.
- Error cases: `TENANT_ACCESS_DENIED`, `PERMISSION_DENIED`, `VALIDATION_FAILED`, `CONFLICT_RETRY`.
- Idempotency: duplicate form retry with same idempotency key returns same result or safe conflict.
- Audit event: `ClientCreated`.
- Rate-limit consideration: basic mutation throttling to prevent abuse.
- Privacy consideration: validation errors do not expose other tenant clients.
- Expected test coverage: integration, E2E, audit, tenant isolation.

## C-003 Update Client

- Operation ID: `client.update`
- Actor: tenant owner or tenant administrator.
- Required Permission: future `PERM.CLIENT.UPDATE` if enabled; otherwise management-only.
- Scope: active tenant and target client in same tenant.
- Input: client id/reference, editable client fields, revision.
- Validation: fields allowed for F-001 only; revision freshness.
- Server-side authorization: actor has management scope; target client belongs to actor tenant.
- Expected output: updated client summary.
- Error cases: `CLIENT_ACCESS_DENIED`, `PERMISSION_DENIED`, `VALIDATION_FAILED`, `CONFLICT_RETRY`.
- Idempotency: repeated same revision update is safe conflict/no-op per implementation policy.
- Audit event: `ClientUpdated`.
- Rate-limit consideration: ordinary authenticated mutation throttling.
- Privacy consideration: unauthorized client id returns generic denied/not found.
- Expected test coverage: integration, permission, audit.

## C-004 Invite Internal Member

- Operation ID: `invitation.invite_internal_member`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.INVITE` and role assignment authority.
- Scope: tenant scope plus optional client scope for assigned internal roles.
- Input: invited email, role, client scopes, message optional, idempotency key.
- Validation: email format, allowed internal role, scopes belong to tenant, no empty role/scope ambiguity.
- Server-side authorization: actor can invite and assign requested role/scope.
- Expected output: pending invitation summary, delivery state.
- Error cases: `TENANT_ACCESS_DENIED`, `CLIENT_ACCESS_DENIED`, `ROLE_ASSIGNMENT_DENIED`, `VALIDATION_FAILED`, `RATE_LIMITED`.
- Idempotency: same email/role/scope retry returns existing pending invite or safe duplicate result.
- Audit event: `TenantMembershipInvited`, `RoleAssigned` intent.
- Rate-limit consideration: invitation creation/email send throttled.
- Privacy consideration: do not reveal whether email already belongs to another tenant.
- Expected test coverage: integration, E2E, permission, audit.

## C-005 Invite Client Member

- Operation ID: `invitation.invite_client_member`
- Actor: tenant owner or tenant administrator only in F-001.
- Required Permission: `PERM.USR.INVITE` and role assignment authority.
- Scope: tenant + exactly one client.
- Input: invited email, client id, client role, idempotency key.
- Validation: client belongs to tenant; role is client role; exactly one client scope.
- Server-side authorization: actor can invite client member for target client.
- Expected output: pending invitation summary.
- Error cases: `CLIENT_ACCESS_DENIED`, `ROLE_ASSIGNMENT_DENIED`, `VALIDATION_FAILED`, `RATE_LIMITED`.
- Idempotency: same email/role/client retry returns existing pending invite or safe duplicate result.
- Audit event: `ClientMemberInvited`, `RoleAssigned` intent.
- Rate-limit consideration: invitation/email throttling.
- Privacy consideration: no client name leakage for unauthorized target.
- Expected test coverage: integration, E2E, cross-client denial, audit.

## C-006 Resend Invitation

- Operation ID: `invitation.resend`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.INVITE_RESEND`.
- Scope: original invitation tenant/client scope.
- Input: invitation id/reference, idempotency key.
- Validation: invitation belongs to actor scope and can be resent.
- Server-side authorization: actor can manage original invitation scope.
- Expected output: new pending invitation summary; old one superseded.
- Error cases: `INVITATION_NOT_FOUND`, `INVITATION_ALREADY_USED`, `CLIENT_ACCESS_DENIED`, `PERMISSION_DENIED`.
- Idempotency: repeat resend with same key returns same replacement where possible.
- Audit event: `InvitationSuperseded`, `InvitationResent`.
- Rate-limit consideration: email resend throttling.
- Privacy consideration: generic response for unauthorized invitation id.
- Expected test coverage: integration, superseded old link E2E, audit.

## C-007 Revoke Invitation

- Operation ID: `invitation.revoke`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.INVITE`.
- Scope: invitation tenant/client scope.
- Input: invitation id/reference, reason optional/required by policy.
- Validation: pending invitation; actor scope.
- Server-side authorization: actor can manage invitation scope.
- Expected output: revoked invitation state.
- Error cases: `INVITATION_NOT_FOUND`, `INVITATION_ALREADY_USED`, `PERMISSION_DENIED`.
- Idempotency: repeated revoke of revoked invitation is safe no-op.
- Audit event: `InvitationRevoked`.
- Rate-limit consideration: normal sensitive mutation throttling.
- Privacy consideration: no invitation existence leakage.
- Expected test coverage: integration, E2E revoked link, audit.

## C-008 Accept Invitation

- Operation ID: `invitation.accept`
- Actor: invited user, existing or new.
- Required Permission: valid invitation; no prior role permission.
- Scope: invitation-recorded tenant/client scope.
- Input: invitation token/reference, authenticated or newly created Auth identity.
- Validation: token valid, status pending, not expired, not revoked/superseded/used, accepting email matches invited email.
- Server-side authorization: invitation itself authorizes only recorded membership/role/scope after validation.
- Expected output: activated membership(s), role assignment(s), entry context.
- Error cases: `INVITATION_EXPIRED`, `INVITATION_REVOKED`, `INVITATION_SUPERSEDED`, `INVITATION_ALREADY_USED`, `EMAIL_MISMATCH`, `INVITATION_NOT_FOUND`.
- Idempotency: repeated successful accept is safe no-op and creates no duplicate membership/role/audit side effects.
- Audit event: `TenantMembershipActivated` and/or `ClientMembershipActivated`, `InvitationAccepted`; sensitive denial events for invalid attempts.
- Rate-limit consideration: token acceptance throttled to reduce brute force/replay.
- Privacy consideration: invalid token states use safe copy and no scope leakage.
- Expected test coverage: unit, integration, E2E existing/new user, replay, email mismatch.

## C-009 Assign Role

- Operation ID: `role.assign`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.ROLE_UPDATE`.
- Scope: target membership and assignment scope.
- Input: membership id, role key, scope type/id, reason, idempotency key.
- Validation: active target membership; role allowed for membership type; scope belongs to tenant.
- Server-side authorization: actor can assign requested role within scope.
- Expected output: active role assignment.
- Error cases: `ROLE_ASSIGNMENT_DENIED`, `CLIENT_ACCESS_DENIED`, `MEMBERSHIP_DISABLED`, `VALIDATION_FAILED`.
- Idempotency: duplicate active same assignment is no-op or returns existing assignment.
- Audit event: `RoleAssigned`.
- Rate-limit consideration: sensitive mutation throttling.
- Privacy consideration: no target membership/client existence leakage outside scope.
- Expected test coverage: unit permission, integration, audit.

## C-010 Change Role Assignment

- Operation ID: `role.change_assignment`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.ROLE_UPDATE`.
- Scope: existing assignment scope and new scope if changed.
- Input: role assignment id, new role/scope/status, reason, revision.
- Validation: no privilege escalation; no cross-tenant scope; reason for sensitive changes.
- Server-side authorization: actor authority covers old and new scope.
- Expected output: updated/replaced role assignment.
- Error cases: `ROLE_ASSIGNMENT_DENIED`, `CONFLICT_RETRY`, `VALIDATION_FAILED`.
- Idempotency: same requested state with same key is safe.
- Audit event: `RoleUpdated` or `RoleRevoked` + `RoleAssigned`.
- Rate-limit consideration: sensitive mutation throttling.
- Privacy consideration: safe denial for unauthorized assignment id.
- Expected test coverage: integration, permission, audit.

## C-011 Remove Client Scope

- Operation ID: `membership.remove_client_scope`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.ROLE_UPDATE` or suspend/remove permission according to implementation policy.
- Scope: target client membership/assignment.
- Input: user/membership id, client id, reason.
- Validation: client belongs to tenant; target has scope; responsibility transfer policy checked if later responsibilities exist.
- Server-side authorization: actor has authority over target client scope.
- Expected output: disabled/removed client membership or revoked assignment.
- Error cases: `CLIENT_ACCESS_DENIED`, `MEMBERSHIP_DISABLED`, `VALIDATION_FAILED`.
- Idempotency: repeated removal is safe no-op.
- Audit event: `ClientScopeRemoved` or `RoleRevoked`.
- Rate-limit consideration: sensitive mutation throttling.
- Privacy consideration: no cross-client membership leakage.
- Expected test coverage: integration, cross-client denial, audit.

## C-012 Disable Membership

- Operation ID: `membership.disable`
- Actor: tenant owner or tenant administrator.
- Required Permission: `PERM.USR.SUSPEND`.
- Scope: tenant membership or client membership.
- Input: membership id, scope, reason, responsibility transfer status.
- Validation: active membership; no in-scope active responsibilities left unresolved when such responsibilities exist.
- Server-side authorization: actor can disable target membership.
- Expected output: disabled membership; pending invitations for target cancelled according to policy.
- Error cases: `PERMISSION_DENIED`, `VALIDATION_FAILED`, `MEMBERSHIP_DISABLED`.
- Idempotency: repeated disable is safe no-op.
- Audit event: `MembershipSuspended`, invitation cancellation events as needed.
- Rate-limit consideration: sensitive mutation throttling.
- Privacy consideration: no target user/client leakage outside scope.
- Expected test coverage: integration, active-session denial, audit.

## C-013 List Assigned Clients

- Operation ID: `client.list_assigned`
- Actor: authenticated user.
- Required Permission: `PERM.CLIENT.VIEW` or management equivalent.
- Scope: actor tenant/client assignments.
- Input: filters, pagination.
- Validation: filters constrained to actor scope.
- Server-side authorization: resolve effective client list from membership/role assignments.
- Expected output: only authorized client summaries.
- Error cases: `TENANT_ACCESS_DENIED`, `MEMBERSHIP_DISABLED`.
- Idempotency: read-only.
- Audit event: no routine audit; sensitive denial eligible.
- Rate-limit consideration: standard read throttling.
- Privacy consideration: no hints for unassigned clients.
- Expected test coverage: RLS, E2E assigned/unassigned, client user limitations.

## C-014 Resolve Role-Aware Navigation

- Operation ID: `navigation.resolve`
- Actor: authenticated user.
- Required Permission: none directly; derived from effective roles.
- Scope: active tenant and client memberships/assignments.
- Input: current route/context optional.
- Validation: ignore untrusted navigation scope unless membership confirms it.
- Server-side authorization: derive visible surfaces from current effective permissions.
- Expected output: navigation model and empty/denied states.
- Error cases: `MEMBERSHIP_DISABLED`, `TENANT_ACCESS_DENIED`.
- Idempotency: read-only.
- Audit event: sensitive denial/navigation abuse optional; routine resolution not audited.
- Rate-limit consideration: cacheable per session with membership freshness constraints.
- Privacy consideration: absent nav must not reveal hidden resources.
- Expected test coverage: unit, component, E2E, accessibility/RTL.

## C-015 Read Authorized Audit Events

- Operation ID: `audit.read_authorized`
- Actor: tenant owner or tenant administrator in F-001.
- Required Permission: `PERM.AUDIT.USER_VIEW` or `PERM.AUDIT.CLIENT_VIEW`.
- Scope: tenant and optional client.
- Input: target type/id, date range, action filters, pagination.
- Validation: scope belongs to actor tenant; safe filter bounds.
- Server-side authorization: actor can read audit for requested scope; client users cannot read internal audit in F-001.
- Expected output: audit event summaries with sensitive fields filtered.
- Error cases: `TENANT_ACCESS_DENIED`, `CLIENT_ACCESS_DENIED`, `PERMISSION_DENIED`.
- Idempotency: read-only.
- Audit event: optional audit-read event for sensitive audit access.
- Rate-limit consideration: throttled/paginated due sensitivity.
- Privacy consideration: no internal audit to client roles; no cross-tenant event leakage.
- Expected test coverage: integration, RLS, permission, privacy.
