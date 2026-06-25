# Feature Specification: Secure Tenant and Client Onboarding

**Feature Branch**: `001-secure-tenant-client-onboarding`

**Created**: 2026-06-23

**Status**: Draft for owner review before technical planning

**Input**: First Feature Specification for Secure Tenant and Client Onboarding. This phase creates one feature specification only and stops before plan, tasks, analyze, implement, product code, SQL, migrations, APIs, or dependency installation.

## Overview

This feature establishes the first safe operating slice for Sharik/Samawah: a Samawah tenant administrator can sign in, create a client, invite internal and client users, assign scoped roles, and prove that unauthorized tenant or client access is denied without leaking resource existence. It is the foundation for later deliverables, approvals, files, SLA, comments, and client portal work.

The feature is intentionally limited to onboarding, membership, roles, scope, navigation visibility, denial behavior, and auditability. It does not implement deliverables, contracts, packages, Kanban, files, SLA, approvals, social scheduling, billing, platform support, break-glass, or client self-service invitations.

## Clarifications

### Session 2026-06-23

- Q: What is the invitation validity policy for this first feature? -> A: Invitations expire after 7 days, are single-use, require the accepting account email to match the invited email, and resend revokes the previous invitation.
- Q: Who can invite client users in this first vertical slice? -> A: Only `tenant_owner` and `tenant_administrator` can invite client users and set their scope; `client_admin` invitation self-service is deferred to a future feature.
- Q: Is Samawah tenant management part of this feature? -> A: No. Samawah is assumed to exist as the first tenant; this feature does not create a full tenant management UI.

## Confirmed Decisions For This Specification

- Tenant represents the agency or operating organization.
- Samawah is the first tenant and exists before this feature begins.
- Client represents a client company inside a tenant, not a separate tenant.
- User identity is separate from tenant membership, client membership, and role assignment.
- Roles are assigned to a membership and scope; no role is stored as a permanent global attribute on the user identity.
- Default access decision is deny by default.
- Client users never receive tenant-wide access.
- Every invitation has a clear tenant scope; every client user invitation also has a clear client scope.
- Membership and role changes create audit events.
- Platform support, break-glass access, bulk invitations, tenant switching, MFA implementation, white label, social scheduling, and billing are outside this feature.

## User Scenarios & Testing

### User Story 1 - Tenant admin creates a scoped client foundation (Priority: P1)

As a `tenant_administrator`, I want to sign in to the Samawah tenant and create a new client record so that later work can be scoped to the correct client before any deliverables or files exist.

**Why this priority**: Client scope is the boundary that protects all later V1 workflows from cross-client leakage.

**Independent Test**: Can be tested by signing in as a tenant administrator, creating Client A, and verifying that Client A appears only inside Samawah tenant management surfaces with an audit event.

**Acceptance Scenarios**:

1. **Given** an active `tenant_administrator` in Samawah tenant, **When** they create Client A with required client identity fields, **Then** Client A is created under Samawah tenant scope and an audit event records actor, tenant scope, target client, action, and timestamp.
2. **Given** a user without `PERM.CLIENT.CREATE`, **When** they attempt to create a client, **Then** the action is denied, no client is created, and the user receives a generic Arabic permission message.
3. **Given** an active tenant administrator in Samawah tenant, **When** the client list is empty, **Then** the management console presents a clear empty state and a permitted create-client action.

---

### User Story 2 - Tenant admin invites internal team members with client scope (Priority: P1)

As a `tenant_administrator`, I want to invite an internal Samawah team member and assign only the client scope they need so that team access starts least-privilege.

**Why this priority**: Internal team members may work across clients, but only explicit assignment should grant visibility.

**Independent Test**: Can be tested by inviting an internal user to Client A, accepting the invitation, and verifying the user cannot access Client B until another scope is assigned.

**Acceptance Scenarios**:

1. **Given** Client A exists in Samawah tenant, **When** a tenant administrator invites an internal team member with an `account_manager` or execution role scoped to Client A, **Then** the invitation is pending with tenant and client scope recorded.
2. **Given** the invited internal user accepts within 7 days using the invited email, **When** their membership activates, **Then** they see only role-appropriate navigation and Client A resources.
3. **Given** the internal user is assigned to Client A only, **When** they open a valid Client B URL, **Then** access is denied without returning Client B data or revealing whether Client B exists.
4. **Given** the same internal user is later assigned to Client B, **When** the assignment is active, **Then** they can see both Client A and Client B according to their role and each scope is auditable.

---

### User Story 3 - Tenant admin invites client users safely (Priority: P1)

As a `tenant_owner` or `tenant_administrator`, I want to invite a user from a client company with a client role so that the client can access only their own portal surfaces.

**Why this priority**: Client user onboarding is the first external trust boundary; mistakes here would leak other clients or internal management data.

**Independent Test**: Can be tested by inviting a Client A user as `client_viewer`, `client_reviewer`, `client_approver`, or `client_administrator`, accepting the invite, and verifying access stays inside Client A.

**Acceptance Scenarios**:

1. **Given** Client A exists, **When** a tenant administrator invites a client user with `client_viewer`, **Then** the invitation has Samawah tenant scope, Client A scope, the invited email, role assignment, 7-day expiry, single-use status, and audit event.
2. **Given** a `client_admin` is active in Client A, **When** they attempt to invite another user in this feature, **Then** the action is denied or absent because client-admin self-service invitations are out of scope.
3. **Given** a client user accepts a valid invitation with the same invited email, **When** they enter the platform, **Then** they see only Client A role-scoped client navigation and no tenant-wide client list.
4. **Given** a client user has Client A scope, **When** they open a valid Client B URL or resource identifier, **Then** the response is denied/not found without revealing Client B existence and a sensitive denial audit event is recorded.

---

### User Story 4 - Invitation lifecycle protects access (Priority: P1)

As a tenant administrator, I want invitation expiry, resend, revocation, and single-use behavior to be explicit so that invitations cannot become lingering access paths.

**Why this priority**: Invitation abuse is an early security risk and affects acceptance criteria for account creation and existing-account acceptance.

**Independent Test**: Can be tested by using valid, expired, revoked, superseded, and already-used invitations and verifying decisions, UX, and audit outcomes.

**Acceptance Scenarios**:

1. **Given** a valid pending invitation, **When** the invited email accepts it within 7 days, **Then** the invitation becomes used and cannot be used again.
2. **Given** an invitation is older than 7 days, **When** the invited email attempts acceptance, **Then** acceptance is denied with an Arabic expired-invitation message and no membership is activated.
3. **Given** an invitation was revoked, **When** the invited email attempts acceptance, **Then** acceptance is denied with a safe message and no membership is activated.
4. **Given** a pending invitation is resent, **When** the old invitation link is used, **Then** it is treated as superseded/revoked and cannot activate access.
5. **Given** an invitation was accepted once, **When** the same link is used again, **Then** the result is an idempotent no-op or safe denial and no duplicate membership or role assignment is created.
6. **Given** a user accepts using an email different from the invited email, **When** acceptance is attempted, **Then** the invitation is not accepted and no scope is granted.

---

### User Story 5 - Role and membership changes remain auditable (Priority: P2)

As a tenant administrator, I want to update roles, revoke invitations, and disable memberships with audit coverage so that access changes are accountable and reversible by process.

**Why this priority**: V1 must support safe correction and offboarding basics before later work starts.

**Independent Test**: Can be tested by changing a user's role, revoking an invitation, and disabling a membership, then verifying access changes and audit events.

**Acceptance Scenarios**:

1. **Given** an active scoped member, **When** a tenant administrator changes their role, **Then** the new role applies only within the chosen scope and an audit event records actor, target, scope, old role where safe, new role, reason if required, and timestamp.
2. **Given** an active membership is disabled, **When** the user attempts to access a scoped resource, **Then** access is denied and the membership-disabled state is visible in management.
3. **Given** the member owns active responsibilities that cannot be left unassigned, **When** a tenant administrator attempts disabling the membership, **Then** the system requires responsibility transfer or records it as a blocking condition for later delivery-domain planning.
4. **Given** a pending invitation belongs to a user being disabled, **When** the membership or invited target is disabled according to policy, **Then** all pending invitations for that disabled membership target are cancelled.

---

### User Story 6 - Role-aware navigation and denial UX match the user's scope (Priority: P3)

As any onboarded user, I want navigation and messages to match my role and scope so that I understand what I can do without seeing internal or unauthorized surfaces.

**Why this priority**: Navigation is not the authorization boundary, but it is the user's first signal of least privilege and reduces accidental denial.

**Independent Test**: Can be tested by logging in as each role and comparing visible navigation, empty states, denial states, and direct URL behavior.

**Acceptance Scenarios**:

1. **Given** a client viewer is active in Client A, **When** they open navigation, **Then** they see client-facing surfaces only and no admin invitation or approval decision actions.
2. **Given** a client approver is active in Client A, **When** they open navigation, **Then** approval-related surfaces can appear but only for Client A resources when later approval features exist.
3. **Given** an assigned internal account manager has Client A and Client B scopes, **When** they open management or team navigation, **Then** they see only permitted client portfolio surfaces and no platform support or tenant-switching surface.
4. **Given** any user has no assigned clients, **When** they enter the app, **Then** they see a clear Arabic empty state and no leaked client names.

## Acceptance Scenario Matrix

| ID | Scenario | Actor | Role | Scope | Expected Decision | Expected UX | Audit Event | Security Requirement | Future Verification |
|---|---|---|---|---|---|---|---|---|---|
| AC-001 | Create Client A inside Samawah | Tenant admin | `tenant_administrator` | Samawah tenant | Allow | Client created; management list updates | `ClientCreated` | SEC-001, SEC-009 | E2E + integration |
| AC-002 | Invite team member to Client A | Tenant admin | `tenant_administrator` | Tenant + Client A | Allow | Invitation pending state | `TenantMembershipInvited`, `RoleAssigned` | SEC-001, SEC-009 | E2E + permission |
| AC-003 | Accept valid team invite | Invited user | scoped team role | Tenant + Client A | Allow | Account enters scoped workspace | `TenantMembershipActivated` | SEC-001 | E2E |
| AC-004 | Invite client user to Client A | Tenant admin | `tenant_administrator` | Tenant + Client A | Allow | Invitation pending state | `ClientMemberInvited`, `RoleAssigned` | SEC-001, SEC-009 | E2E + permission |
| AC-005 | Existing account accepts invite | Invited user | client role | Client A | Allow | Joins scoped portal | `ClientMembershipActivated` | SEC-001, SEC-002 | E2E |
| AC-006 | New user accepts invite | Invited user | client role | Client A | Allow | Account creation then portal access | `PlatformUserCreated`, `ClientMembershipActivated` | SEC-001, SEC-002 | E2E |
| AC-007 | Expired invite acceptance | Invited user | pending | invitation scope | Deny | Expired invitation message | `InvitationExpired` or denial event | SEC-020 | Integration + E2E |
| AC-008 | Revoked invite acceptance | Invited user | pending | invitation scope | Deny | Revoked/unavailable message | `InvitationRevoked` or denial event | SEC-020 | Integration + E2E |
| AC-009 | Invite used twice | Invited user | active | invitation scope | Safe no-op/deny | Already used/unavailable message | duplicate attempt audit if sensitive | SEC-020 | Idempotency |
| AC-010 | Resend invitation invalidates previous | Tenant admin + invited user | admin / pending | same scope | New link allow; old link deny | Superseded message for old link | `InvitationRevoked`, new invite event | SEC-020 | Integration |
| AC-011 | Client A user opens Client B | Client user | any client role | Client A only | Deny | Permission denied/not found | `AccessDeniedCrossClient` | SEC-002, SEC-020 | E2E/RLS |
| AC-012 | Tenant A user opens Tenant B | Any user | scoped role | Tenant A only | Deny | Permission denied/not found | `AccessDeniedCrossTenant` | SEC-001, SEC-020 | E2E/RLS |
| AC-013 | Unassigned team member opens Client | Team user | execution/account role | no Client B scope | Deny | Outside current scope message | `access_denied_unassigned_client` | SEC-002, SEC-020 | Permission + E2E |
| AC-014 | Role assignment update | Tenant admin | `tenant_administrator` | target scope | Allow if authorized | Role changed state | `RoleAssigned` or `role_updated` | SEC-009 | Integration |
| AC-015 | Disable membership | Tenant admin | `tenant_administrator` | target scope | Allow/blocked by responsibility rule | Disabled or transfer required | `membership_suspended` | SEC-009, SEC-020 | Integration |
| AC-016 | Multiple roles in same client | Tenant admin + user | multiple scoped roles | Client A | Allow if non-conflicting | Combined permitted nav; no extra scope | `RoleAssigned` | SEC-009 | Permission |
| AC-017 | Internal user works on Client A and B | Internal user | assigned role | Client A + Client B | Allow both scoped clients | Portfolio shows both only | role/scope events | SEC-002 | E2E |
| AC-018 | Client viewer attempts admin action | Client user | `client_viewer` | Client A | Deny | Viewer-only message | sensitive denial event | SEC-020 | Permission + E2E |
| AC-019 | Valid resource ID but unauthorized user | Any scoped user | insufficient scope | other client/tenant | Deny | Does not reveal existence | access denied event | SEC-001, SEC-002, SEC-020 | E2E/RLS |
| AC-020 | Audit event for sensitive action | Authorized actor | any sensitive role | target scope | Required | Activity available to authorized internal viewers | matching audit event | SEC-009, SEC-020 | Integration |

## Edge Cases

- Invitation is accepted at exactly the expiry boundary; the acceptance decision must use a single authoritative timestamp and produce one deterministic result.
- Invitation is accepted twice due to refresh, back button, or retry; acceptance remains idempotent and does not duplicate membership, roles, or audit side effects.
- Invitation is resent while the old link is open in another tab; the old link must be treated as superseded before granting access.
- Invited user signs in with an account whose email does not match the invitation; no tenant or client scope is granted.
- A role assignment references a client outside the actor's tenant; the operation is denied.
- A user has tenant membership but no client scope; client navigation and resources remain empty or denied.
- A client user has multiple roles inside the same client; permissions combine only inside that client and do not create tenant-wide access.
- A disabled member has an active session; protected resources and sensitive actions must be denied according to membership state.
- Unauthorized access to a valid identifier must not disclose whether the tenant, client, invitation, or resource exists.
- Network or save failure during invitation or role assignment must preserve entered form data and show a recoverable Arabic message.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow an active `tenant_owner` or `tenant_administrator` in Samawah tenant to create a client inside Samawah tenant scope.
- **FR-002**: The system MUST deny client creation when the actor lacks `PERM.CLIENT.CREATE` or an active Samawah tenant membership.
- **FR-003**: The system MUST allow `tenant_owner` and `tenant_administrator` to invite internal team users with tenant membership and optional client assignment scope.
- **FR-004**: The system MUST allow only `tenant_owner` and `tenant_administrator` to invite client users in this feature.
- **FR-005**: The system MUST prevent `client_admin` from inviting users in this feature; client-admin self-service invitations are explicitly deferred.
- **FR-006**: Each invitation MUST include invited email, tenant scope, intended membership type, role assignment, status, creation time, expiry time, and actor.
- **FR-007**: Each client user invitation MUST include exactly one client scope for this feature unless a future owner decision explicitly allows multi-client client users.
- **FR-008**: Invitations MUST expire after 7 days.
- **FR-009**: Invitations MUST be single-use.
- **FR-010**: Resending an invitation MUST revoke or supersede the previous pending invitation for the same invited email, role, and scope.
- **FR-011**: Accepting an invitation MUST require the accepting account email to match the invited email.
- **FR-012**: Accepting a valid invitation MUST activate the appropriate tenant membership, client membership where applicable, and scoped role assignment.
- **FR-013**: Accepting an expired, revoked, superseded, or already-used invitation MUST NOT activate or expand any membership or role.
- **FR-014**: User identity MUST remain separate from membership and role assignment; role assignment MUST be evaluated by membership, scope, and conditions.
- **FR-015**: The system MUST support a user having more than one role assignment inside the same tenant or client when assignments are non-conflicting.
- **FR-016**: The system MUST allow an internal user to be assigned to more than one client in Samawah tenant.
- **FR-017**: The system MUST deny client users tenant-wide client listings or access to clients outside their client scope.
- **FR-018**: The system MUST deny team members access to unassigned clients unless they hold a management role with broader documented scope.
- **FR-019**: Role-aware navigation MUST show only surfaces appropriate to the user's active membership, role, and scope.
- **FR-020**: Direct URL access MUST be authorized independently of navigation visibility.
- **FR-021**: Permission-denied and not-found states MUST avoid leaking names or existence of unauthorized tenants, clients, invitations, or resources.
- **FR-022**: The system MUST provide Arabic Saudi user-facing messages for loading, empty, pending invitation, accepted invitation, expired invitation, revoked invitation, superseded invitation, email mismatch, permission denied, session expired, save failure, network failure, membership disabled, and no assigned clients.
- **FR-023**: Membership disabling MUST remove or deny active access according to membership state while preserving historical audit records.
- **FR-024**: Disabling a user with active responsibilities MUST require responsibility transfer when those responsibilities are in scope; if not yet implemented, the onboarding spec must mark that transfer as a prerequisite for later delivery features.
- **FR-025**: Every sensitive action in this feature MUST create an audit event, including client creation, invitation creation, invitation resend, invitation revocation, invitation acceptance, role assignment, role update, scope change, membership disablement, and sensitive access denial.
- **FR-026**: Audit events MUST include actor, target, tenant scope, client scope when applicable, action, decision, timestamp, and reason when the action is sensitive or destructive.
- **FR-027**: The system MUST apply deny by default when membership, role, scope, state, or invitation validity is missing or ambiguous.
- **FR-028**: Client user onboarding MUST work on mobile for invitation acceptance and first entry into the client portal.
- **FR-029**: Critical membership and invitation flows MUST be understandable in Arabic RTL layouts and keyboard-accessible in planning acceptance criteria.
- **FR-030**: This feature MUST NOT include deliverables, contracts, packages, Kanban, files, comments, SLA, approvals, billing, social scheduling, white label, tenant switching, platform support, break-glass, bulk invitations, MFA implementation, SSO, SCIM, or external integration APIs.

### Permission Coverage

| Permission ID | Required in this feature | Roles allowed in this feature | Scope rule |
|---|---|---|---|
| `PERM.CLIENT.CREATE` | Create client | `tenant_owner`, `tenant_administrator` | Samawah tenant only |
| `PERM.CLIENT.VIEW` | View scoped client basics | Tenant admins, assigned internal users, scoped client users | Assigned tenant/client scope only |
| `PERM.CLIENT.VIEW_ALL_IN_TENANT` | View client list | `tenant_owner`, `tenant_administrator` | Samawah tenant management only |
| `PERM.USR.VIEW` | View members/invitations | `tenant_owner`, `tenant_administrator` | Tenant and scoped client membership views |
| `PERM.USR.INVITE` | Invite users | `tenant_owner`, `tenant_administrator` only in this feature | Tenant scope; client invitation requires client scope |
| `PERM.USR.INVITE_RESEND` | Resend invitation | `tenant_owner`, `tenant_administrator` only in this feature | Same original scope; previous invitation revoked |
| `PERM.USR.ROLE_UPDATE` | Assign/update roles | `tenant_owner`, `tenant_administrator` | Cannot assign outside actor authority or scope |
| `PERM.USR.SUSPEND` | Disable membership | `tenant_owner`, `tenant_administrator` | Scope-specific disablement with audit |
| `PERM.USR.RESPONSIBILITY_TRANSFER` | Transfer responsibility before disablement | Tenant admin roles when responsibility exists | Required where active ownership exists |
| `PERM.AUDIT.USER_VIEW` | Review user membership audit internally | `tenant_owner`, `tenant_administrator` | Internal-only |
| `PERM.AUDIT.CLIENT_VIEW` | Review client membership audit internally | `tenant_owner`, `tenant_administrator` | Internal-only |

### Security Requirements

- **SR-001**: Tenant context MUST be derived from authenticated active membership and target resource scope, not from a browser-supplied tenant identifier alone.
- **SR-002**: Client context MUST be derived from active client membership or authorized internal assignment, not from a browser-supplied client identifier alone.
- **SR-003**: Cross-tenant access attempts MUST be denied without data leakage.
- **SR-004**: Cross-client access attempts MUST be denied without data leakage.
- **SR-005**: Client roles MUST NOT read internal management, internal audit, platform support, or tenant-wide client lists.
- **SR-006**: Invitation acceptance MUST NOT grant permissions outside the invitation's recorded scope.
- **SR-007**: Expired, revoked, superseded, and used invitations MUST NOT be accepted.
- **SR-008**: Role changes MUST require explicit permission and scope authority.
- **SR-009**: Sensitive denial attempts MUST be audit eligible, especially cross-tenant, cross-client, admin-action denial, and client-viewer administrative attempts.
- **SR-010**: User-facing errors MUST not expose raw technical details, stack traces, SQL/API errors, tenant identifiers, or client names outside scope.

### UX Requirements

- **UX-001**: All user-facing copy for this feature MUST be Arabic Saudi, practical, and non-technical.
- **UX-002**: The invitation acceptance flow MUST include states for pending, accepted, expired, revoked, superseded, email mismatch, existing user, new user, session expired, and network failure.
- **UX-003**: Empty states MUST exist for no clients, no invitations, no assigned clients, and no visible client resources.
- **UX-004**: Permission denied states MUST provide a safe path back without naming unauthorized resources.
- **UX-005**: Role-aware navigation MUST avoid showing actions the user cannot perform, except when a disabled action with a short reason helps understanding.
- **UX-006**: Mobile invitation acceptance MUST keep the primary action visible and avoid requiring desktop-only management surfaces for client users.
- **UX-007**: RTL layout requirements MUST cover form labels, validation messages, focus order, and navigation direction.

### Non-Functional Requirements

- **NFR-001 Security**: 100% of sensitive onboarding actions in this feature must have an explicit allow/deny rule and audit expectation.
- **NFR-002 Tenant Isolation**: Cross-tenant reads and commands must be denied in all acceptance scenarios and future tests.
- **NFR-003 Client Isolation**: Cross-client reads and commands must be denied in all acceptance scenarios and future tests.
- **NFR-004 Auditability**: Sensitive state changes must be explainable from audit records without relying on UI history.
- **NFR-005 Accessibility**: Critical flows must be planned for keyboard access, visible focus, meaningful error association, and WCAG 2.2 AA intent.
- **NFR-006 RTL**: Arabic RTL is the default presentation direction for all onboarding, invitation, denial, and empty states.
- **NFR-007 Mobile**: Client invitation acceptance and first portal entry must be usable on common mobile viewport sizes.
- **NFR-008 Performance**: Primary onboarding views should give a visible loading or skeleton state immediately and complete ordinary list/detail interactions within a user-perceived responsive threshold under pilot load.
- **NFR-009 Reliability**: Retry of invitation acceptance, resend, and role assignment must not create duplicate memberships, roles, or invitations.
- **NFR-010 Error Recovery**: Recoverable failures must preserve user-entered form data where safe.
- **NFR-011 Session Security**: Session expiry must redirect to sign-in without granting partial access or losing safe recovery context.
- **NFR-012 Rate Limiting**: Invitation creation, resend, and acceptance requirements must include abuse-prevention expectations before implementation planning.
- **NFR-013 Privacy**: Denial and not-found UX must not reveal other tenant/client names or existence.
- **NFR-014 Observability**: Future planning must define operational visibility for invitation failures, denied access patterns, and membership state changes.
- **NFR-015 Idempotency**: Invitation acceptance, resend, revocation, and role assignment must define idempotent outcomes before implementation.

## Key Entities

- **User Identity**: The global account identity for a person. It does not carry permanent global product roles for authorization decisions.
- **Tenant**: The agency or operating organization. In this feature, Samawah is the existing tenant.
- **Client**: A client company inside a tenant. Client is not a tenant in V1.
- **Tenant Membership**: A user's active, invited, suspended, removed, or offboarded relationship to a tenant.
- **Client Membership**: A user's active or invited relationship to one client inside a tenant.
- **Role Assignment**: A role, permission set, scope, conditions, and state attached to a membership.
- **Assignment Scope**: The boundary for a role or permission, such as tenant or client.
- **Invitation**: A pending access invitation with invited email, scope, role, expiry, status, and single-use lifecycle.
- **Audit Event**: An append-only accountability record for sensitive actions, decisions, and sensitive denials.

## Included Scope

- Basic sign-in expectation for known users.
- Samawah tenant membership recognition.
- Client creation inside Samawah tenant.
- Tenant membership and client membership onboarding.
- Internal team user invitation.
- Client user invitation by tenant owner/admin only.
- Invitation expiration, acceptance, revocation, resend, superseded link behavior, and single-use enforcement.
- Existing-user and new-user invitation acceptance.
- Role assignment and role-aware navigation requirements.
- Tenant and client isolation requirements.
- Permission denied, empty, loading, and recovery UX states.
- Audit events for sensitive onboarding actions.
- Arabic RTL, mobile acceptance, and accessibility requirements.

## Excluded Scope

- Full multi-tenant administration UI.
- Tenant switching for end users.
- Platform support sessions.
- Break-glass access.
- Client admin self-service invitations.
- Bulk invitations.
- Multiple client approvers workflow.
- Deliverables.
- Contracts.
- Packages.
- Kanban.
- Files.
- Comments.
- SLA.
- Internal approvals.
- Client approvals.
- Social scheduling.
- Billing.
- Advanced audit export.
- MFA implementation.
- SSO.
- SCIM.
- API for external integrations.
- Product code, SQL, migrations, RLS policies, API endpoints, or dependency installation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A tenant administrator can complete sign-in, client creation, internal team invitation, client user invitation, and scoped acceptance demo without leaving this feature's scope.
- **SC-002**: 100% of the 20 acceptance scenarios in this specification have a stated actor, role, scope, expected decision, expected UX, audit expectation, security requirement, and future verification method.
- **SC-003**: No P1 acceptance scenario depends on deliverables, contracts, packages, Kanban, files, comments, SLA, approvals, billing, or social scheduling.
- **SC-004**: All sensitive membership, invitation, role, scope, and client creation actions have audit event coverage in the specification.
- **SC-005**: Cross-tenant and cross-client denial behavior is specified for both navigation and direct URL/resource access.
- **SC-006**: Invitation lifecycle requirements cover valid, expired, revoked, superseded, email mismatch, and already-used invitation states.
- **SC-007**: Client user requirements never grant tenant-wide access or client-admin invitation authority in this feature.
- **SC-008**: Role-aware navigation and denial UX requirements include Arabic RTL, mobile invitation acceptance, and accessibility planning notes.

## Traceability

| Story | Requirement IDs | Permission IDs | Domain invariant | UX / Screen IDs | Security IDs | ADR / Source | Acceptance IDs | Future test type |
|---|---|---|---|---|---|---|---|---|
| US-1 Client foundation | FR-001, FR-002, FR-025, FR-026 | `PERM.CLIENT.CREATE`, `PERM.CLIENT.VIEW_ALL_IN_TENANT` | Tenant scope required for client creation | MC-02, MC-17 | SR-001, SR-010 | ADR-004, ADR-005, first-feature-brief | AC-001, AC-020 | E2E, integration |
| US-2 Internal team invite | FR-003, FR-006, FR-012, FR-016, FR-018 | `PERM.USR.INVITE`, `PERM.USR.ROLE_UPDATE`, `PERM.CLIENT.VIEW` | Internal users see assigned clients only | MC-17, TW-01, NAV | SR-001, SR-002, SR-004 | membership lifecycle, permission matrix | AC-002, AC-003, AC-013, AC-017 | E2E, permission |
| US-3 Client invite | FR-004, FR-005, FR-007, FR-011, FR-017 | `PERM.USR.INVITE`, client roles | Client user has no tenant-wide access | CP-01, CP-02, CP-11 | SR-002, SR-005, SR-006 | tenancy model, security requirements | AC-004, AC-005, AC-006, AC-011, AC-018 | E2E, RLS |
| US-4 Invitation lifecycle | FR-008, FR-009, FR-010, FR-013, FR-027 | `PERM.USR.INVITE_RESEND` | Invitation status gates access | Invitation accept flow | SR-006, SR-007, SR-009 | domain events, states/recovery | AC-007, AC-008, AC-009, AC-010 | Integration, idempotency |
| US-5 Role/membership audit | FR-014, FR-015, FR-023, FR-024, FR-025, FR-026 | `PERM.USR.ROLE_UPDATE`, `PERM.USR.SUSPEND`, `PERM.AUDIT.USER_VIEW` | Role belongs to membership and scope | MC-13, MC-16, MC-17 | SR-008, SR-009 | audit model, constitution | AC-014, AC-015, AC-016, AC-020 | Integration, audit |
| US-6 Navigation and denial UX | FR-019, FR-020, FR-021, FR-022, FR-028, FR-029 | `PERM.CLIENT.VIEW`, role-derived nav | Navigation is not authorization | NAV-01, CP-02, CP-11, states catalog | SR-003, SR-004, SR-010 | role nav model, responsive RTL | AC-011, AC-012, AC-018, AC-019 | Component, E2E, a11y |

## Assumptions

- Samawah tenant already exists before this feature starts.
- Tenant owner and tenant administrator roles are already recognized conceptually for specification purposes.
- A user may have an existing account before accepting an invitation, or may need to create one during acceptance.
- Email delivery mechanics are not specified here; the business requirement is invitation issuance, link lifecycle, and acceptance decision.
- Future implementation planning will define exact storage, database, RLS, command paths, rate limits, and observability details without changing this specification's business rules.
- Client users are limited to one client scope in this first feature unless owner approval later changes that decision.
- Audit viewing in this feature is internal management visibility only; advanced audit export is excluded.

## Readiness Notes

- No blocking clarification questions remain for writing acceptance criteria.
- Spec Kit CLI is not installed on PATH, but `uvx` successfully ran Spec Kit 0.9.5 commands temporarily.
- Current project Spec Kit integration is 0.9.5; latest official release observed on 2026-06-23 is v0.11.5.
- Recommendation: evaluate upgrading Spec Kit in a separate owner-approved commit before technical planning, because no feature plan/tasks/build artifacts exist yet.
