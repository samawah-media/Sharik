# Data Model: Secure Tenant and Client Onboarding

This is a conceptual technical data model for planning only. It does not define SQL, migrations, concrete column types, or executable RLS policies.

## Model Principles

- Supabase Auth owns authentication identity and sessions.
- Application data owns memberships, client scopes, roles, invitations, and audit records.
- Tenant is the operating organization; Client exists inside Tenant and is not a separate tenant.
- Role assignment is attached to membership and scope, never stored as one global user role.
- All customer data is tenant-scoped, and client data is client-scoped directly or through a mandatory relationship.
- Audit events are append-only and survive membership disablement/removal.

## Entity: Auth User Reference

- Purpose: stable reference to Supabase Auth identity.
- Fields conceptually: auth user id, email, email confirmed state, created timestamp.
- Required fields: auth user id, email.
- Optional fields: last sign-in metadata via Auth only.
- Relationships: referenced by profile, memberships, invitations accepted by user, audit actor/target.
- Uniqueness rules: one Auth user id globally; email uniqueness follows Supabase Auth policy.
- Validation: application must match accepted invitation email to Auth email.
- Tenant ownership: none directly.
- Client ownership: none directly.
- Lifecycle: created by Supabase Auth; not hard-deleted for audit-driven application state without a retention decision.
- Archival policy: application records preserve historical reference even if Auth account is disabled/deleted.
- Sensitive fields: email and identifiers.
- Audit requirements: platform user creation may create audit if caused by invitation acceptance.
- Index requirements conceptually: auth user id lookup; normalized email lookup when matching invitation.
- Concurrency concerns: user may accept invitation while account creation completes.
- RLS policy groups conceptually: not an app table; access mediated through Supabase Auth and server code.

## Entity: User Profile

- Purpose: optional application display profile without authorization truth.
- Fields conceptually: auth user id, display name, locale, timezone, avatar reference, created/updated timestamps.
- Required fields: auth user id.
- Optional fields: display name, avatar, locale preferences.
- Relationships: one profile per Auth user.
- Uniqueness rules: one profile per auth user.
- Validation: no role, tenant, or client authorization data stored here.
- Tenant ownership: none; profile can be global.
- Client ownership: none.
- Lifecycle: created on first sign-in/invitation acceptance if needed.
- Archival policy: disabled users keep historical profile reference where lawful.
- Sensitive fields: display name and email if denormalized; avoid extra PII.
- Audit requirements: profile changes are low-risk unless security-relevant.
- Index requirements conceptually: auth user id.
- Concurrency concerns: duplicate creation on first login; use idempotent create.
- RLS policy groups conceptually: user can read/update own non-security profile; server can read for management displays.

## Entity: Tenant

- Purpose: operating organization such as Samawah.
- Fields conceptually: id, name, status, primary locale, created_by, created_at, updated_at.
- Required fields: id, name, status.
- Optional fields: display settings, domain metadata.
- Relationships: owns clients, tenant memberships, invitations, role assignments, audit events.
- Uniqueness rules: tenant name/slug unique by platform policy.
- Validation: tenant must be active for F-001 commands.
- Tenant ownership: self.
- Client ownership: none.
- Lifecycle: Samawah tenant exists before F-001; tenant management UI is out of scope.
- Archival policy: tenant suspension/archive deferred.
- Sensitive fields: tenant identifiers and settings.
- Audit requirements: tenant changes audited, but tenant creation is outside F-001.
- Index requirements conceptually: tenant id, status.
- Concurrency concerns: none in F-001.
- RLS policy groups conceptually: active tenant members can read limited tenant record; platform support restricted.

## Entity: Tenant Membership

- Purpose: user relationship to a tenant.
- Fields conceptually: id, tenant_id, auth_user_id, status, invited_email, joined_at, disabled_at, removed_at, created_at, updated_at.
- Required fields: tenant_id, auth_user_id or invited_email, status.
- Optional fields: disable reason, source invitation id.
- Relationships: belongs to tenant and user; owns tenant-scoped role assignments; may relate to client memberships.
- Uniqueness rules: one active tenant membership per auth user per tenant.
- Validation: active membership required for tenant-scoped commands.
- Tenant ownership: tenant_id required.
- Client ownership: none directly.
- Lifecycle: invited -> active -> suspended/removed/offboarded.
- Archival policy: no hard delete when audit history exists.
- Sensitive fields: user identity, status, disable reason.
- Audit requirements: invite, activate, suspend, remove/offboard.
- Index requirements conceptually: tenant_id + auth_user_id; tenant_id + status.
- Concurrency concerns: duplicate acceptance and disable while accepting.
- RLS policy groups conceptually: own membership read; tenant owner/admin management read; server-only state changes.

## Entity: Client

- Purpose: client company inside a tenant.
- Fields conceptually: id, tenant_id, name, slug/reference, status, primary contact summary, created_by, created_at, updated_at, archived_at.
- Required fields: id, tenant_id, name, status.
- Optional fields: contact metadata, notes visible to management.
- Relationships: belongs to tenant; owns client memberships, client-scoped role assignments, invitations, later deliverables/files/contracts.
- Uniqueness rules: tenant-scoped slug/name policy.
- Validation: client must belong to actor tenant; active status required for new invitations.
- Tenant ownership: tenant_id required.
- Client ownership: self.
- Lifecycle: draft/active/archived conceptually; archive deferred.
- Archival policy: archive instead of hard delete once memberships/audit exist.
- Sensitive fields: client identity and contact data.
- Audit requirements: create/update/archive, sensitive denial attempts.
- Index requirements conceptually: tenant_id + id; tenant_id + slug/status.
- Concurrency concerns: duplicate create retry and name collision.
- RLS policy groups conceptually: tenant admins all; assigned internal users scoped; client users only own client basics.

## Entity: Client Membership

- Purpose: user relationship to exactly one client inside a tenant for F-001 client users and scoped internal access where appropriate.
- Fields conceptually: id, tenant_id, client_id, auth_user_id, status, source_invitation_id, joined_at, disabled_at, removed_at.
- Required fields: tenant_id, client_id, auth_user_id, status.
- Optional fields: disable reason.
- Relationships: belongs to tenant, client, user; supports client-scoped role assignments.
- Uniqueness rules: one active client membership per auth user per client.
- Validation: client must belong to tenant; client user invitation has exactly one client scope in F-001.
- Tenant ownership: tenant_id required and must match client.
- Client ownership: client_id required.
- Lifecycle: invited/pending via invitation -> active -> suspended/removed.
- Archival policy: preserve for audit.
- Sensitive fields: membership status and user reference.
- Audit requirements: invited, activated, disabled, scope removed.
- Index requirements conceptually: tenant_id + client_id + auth_user_id; auth_user_id + status.
- Concurrency concerns: repeated invitation acceptance and scope removal while active session exists.
- RLS policy groups conceptually: own client membership; tenant admins; server-only writes.

## Entity: Role

- Purpose: stable catalog role such as tenant_owner, tenant_administrator, account_manager, client_viewer.
- Fields conceptually: id/key, display name, category, status, description.
- Required fields: key, category, status.
- Optional fields: Arabic label.
- Relationships: referenced by role assignments; maps to permissions.
- Uniqueness rules: role key unique.
- Validation: role must be allowed for membership type and scope.
- Tenant ownership: catalog may be global; tenant-specific custom roles deferred.
- Client ownership: none.
- Lifecycle: active/deprecated.
- Archival policy: deprecate instead of delete.
- Sensitive fields: none high, but role changes are security-relevant.
- Audit requirements: role catalog changes require ADR/approval; out of F-001.
- Index requirements conceptually: key.
- Concurrency concerns: catalog drift during assignment.
- RLS policy groups conceptually: readable by authenticated users as needed; writes server/admin only.

## Entity: Permission Reference

- Purpose: stable permission identifiers used by authorization evaluator.
- Fields conceptually: permission id, description, domain, status.
- Required fields: permission id, domain, status.
- Optional fields: Arabic label.
- Relationships: role-permission mapping; policy evaluator.
- Uniqueness rules: permission id unique.
- Validation: permission must be recognized.
- Tenant ownership: global catalog in F-001.
- Client ownership: none.
- Lifecycle: active/deprecated.
- Archival policy: deprecate instead of delete.
- Sensitive fields: none high.
- Audit requirements: permission catalog changes require review.
- Index requirements conceptually: permission id.
- Concurrency concerns: catalog versioning later.
- RLS policy groups conceptually: readable as needed; write restricted.

## Entity: Role Assignment

- Purpose: grants a role/permission set to a membership within a scope.
- Fields conceptually: id, tenant_id, membership_id, membership_type, role_key, scope_type, scope_id, status, starts_at, ends_at, assigned_by, assigned_at, revoked_at, reason.
- Required fields: tenant_id, membership_id, role_key, scope_type, scope_id, status, assigned_by.
- Optional fields: ends_at, conditions, reason.
- Relationships: belongs to tenant/client membership; references role and assignment scope.
- Uniqueness rules: no duplicate active assignment for same membership/role/scope unless explicitly allowed.
- Validation: actor cannot assign outside own authority; scope tenant must match membership tenant.
- Tenant ownership: tenant_id required.
- Client ownership: required when scope_type is client.
- Lifecycle: active -> revoked/expired/disabled.
- Archival policy: preserve old assignments for history.
- Sensitive fields: role, scope, reason.
- Audit requirements: assign, change, revoke, deny.
- Index requirements conceptually: tenant_id + membership_id; role_key + scope; status.
- Concurrency concerns: role update races, duplicate retries, membership disablement.
- RLS policy groups conceptually: tenant admins read/manage; actor may read effective roles; server-only writes.

## Entity: Assignment Scope

- Purpose: conceptual boundary for role assignment.
- Fields conceptually: scope_type, scope_id, tenant_id, optional client_id.
- Required fields: scope_type, scope_id.
- Optional fields: conditions.
- Relationships: validates role assignment against tenant/client/resource.
- Uniqueness rules: not a required physical table in F-001; may be modeled by role assignment fields.
- Validation: client scope must belong to same tenant; client users cannot receive tenant-wide scope in F-001.
- Tenant ownership: required.
- Client ownership: required for client scope.
- Lifecycle: follows target resource lifecycle.
- Archival policy: assignments become inactive if scope is archived/removed.
- Sensitive fields: scope identifiers.
- Audit requirements: scope added/removed/changed.
- Index requirements conceptually: tenant_id + scope_type + scope_id.
- Concurrency concerns: scope removed while assignment active.
- RLS policy groups conceptually: enforced through role assignment and target resource policies.

## Entity: Invitation

- Purpose: pending access path with invited email, tenant/client scope, intended membership, role assignment, expiry, and lifecycle.
- Fields conceptually: id, tenant_id, client_id optional, invited_email, membership_type, role_key, scope_type, scope_id, status, token_hash/reference, expires_at, created_by, created_at, accepted_by, accepted_at, revoked_by, revoked_at, superseded_by, superseded_at, idempotency_key.
- Required fields: tenant_id, invited_email, membership_type, role_key, scope_type, scope_id, status, expires_at, created_by.
- Optional fields: client_id, accepted/revoked/superseded fields, delivery state.
- Relationships: belongs to tenant, optional client, actor, accepted user, resulting memberships and role assignments.
- Uniqueness rules: one active pending invitation for same invited email + role + scope; resend supersedes previous pending invitation.
- Validation: 7-day expiry; email match; status must be pending and not derived-expired to accept; client invitation has exactly one client scope in F-001.
- Tenant ownership: tenant_id required.
- Client ownership: client_id required for client user invitations.
- Lifecycle: pending -> accepted/revoked/superseded; expired is derived while pending.
- Archival policy: no hard delete; terminal records retained for audit.
- Sensitive fields: email, token hash/reference, scope.
- Audit requirements: create, resend, revoke, accept, expired/revoked/superseded/used/email-mismatch denial.
- Index requirements conceptually: token hash; tenant_id + invited_email + role + scope + pending; expires_at.
- Concurrency concerns: accept twice, resend while open, revoke during accept.
- RLS policy groups conceptually: tenant owner/admin manage; invited user only through safe token acceptance path; server-only lifecycle writes.

## Entity: Invitation Lifecycle Event

- Purpose: optional append-only domain trail for invitation delivery and state transitions if audit separation is needed.
- Fields conceptually: id, invitation_id, event_type, actor_id/system, occurred_at, safe metadata.
- Required fields: invitation_id, event_type, occurred_at.
- Optional fields: delivery provider status, reason code.
- Relationships: belongs to invitation.
- Uniqueness rules: idempotency key for repeated events where needed.
- Validation: no raw tokens or secrets.
- Tenant ownership: inherited from invitation.
- Client ownership: inherited from invitation.
- Lifecycle: append-only.
- Archival policy: retained with invitation/audit retention.
- Sensitive fields: email/provider metadata.
- Audit requirements: may complement audit but not replace required audit event.
- Index requirements conceptually: invitation_id + occurred_at.
- Concurrency concerns: duplicate delivery callbacks.
- RLS policy groups conceptually: tenant admin read; server-only insert.

## Entity: Audit Event

- Purpose: append-only accountability record for sensitive actions and sensitive denials.
- Fields conceptually: id, tenant_id, client_id optional, actor_user_id, actor_membership_id, action, decision, target_type, target_id, previous_state safe summary, new_state safe summary, reason, correlation_id, idempotency_key, occurred_at.
- Required fields: tenant_id, action, decision, target_type, target_id, occurred_at.
- Optional fields: client_id, actor references for system events, reason, safe state summaries.
- Relationships: references actors, targets, tenant/client scopes.
- Uniqueness rules: idempotency/correlation keys prevent duplicate side-effect audit where required.
- Validation: no secrets, raw tokens, or unnecessary personal data.
- Tenant ownership: tenant_id required.
- Client ownership: client_id when event targets a client-scoped resource.
- Lifecycle: append-only; no update/delete in normal operation.
- Archival policy: retention/archive requires ADR or policy.
- Sensitive fields: actor, target, denial reason, state summaries.
- Audit requirements: this is the audit record.
- Index requirements conceptually: tenant_id + occurred_at; target_type + target_id; actor; action.
- Concurrency concerns: audit write must be part of sensitive command transaction or fail closed.
- RLS policy groups conceptually: management-only internal audit; client-visible external history deferred and filtered.

## Invitation Status Storage

Stored terminal statuses: `pending`, `accepted`, `revoked`, `superseded`.

Derived status: `expired` when status is `pending` and authoritative current time is after `expires_at`.

Reason: expiry is time-dependent and should not depend on a background job to deny access. A later job may materialize `InvitationExpired` events for reporting, but acceptance must compute expiry at decision time.

## Conceptual RLS and Access Matrix

| Entity | SELECT | INSERT | UPDATE | DELETE/Archive | Platform Scope | Tenant Scope | Client Scope | Assignment Requirement | Role Requirement | Server-only Operations | Expected Deny Cases | Audit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tenant | active members see own tenant basics | out of F-001 | deferred | deferred | restricted governance | active tenant membership | N/A | none | tenant owner/admin for management | tenant changes | Tenant A reads Tenant B | tenant changes |
| Client | tenant admins, assigned internal, scoped client basics | tenant owner/admin | tenant owner/admin | archive deferred | no content by default | tenant_id match | client_id match | internal assignment or client membership | `PERM.CLIENT.*` | create/update/archive | client user sees Client B; unassigned internal user | create/update/denial |
| Tenant Membership | own membership, tenant admins | invitation/accept only | tenant admins | disable/remove only | restricted | tenant_id match | N/A | none | `PERM.USR.*` | activate/disable/remove | inactive membership grants access | all changes |
| Client Membership | own client membership, tenant admins | invitation/accept only | tenant admins | remove/disable only | restricted | tenant_id match | client_id match | membership itself | `PERM.USR.*` | activate/remove scope | client user sees other client membership | all changes |
| Role Assignment | effective own roles, tenant admins | tenant admins | tenant admins | revoke/disable | restricted | tenant_id match | scope-dependent | membership required | `PERM.USR.ROLE_UPDATE` | assign/change/revoke | assigning role outside authority/scope | all changes |
| Invitation | tenant admins; token flow safe view | tenant owner/admin | server lifecycle only | no hard delete | restricted | tenant_id match | client_id for client invite | actor scope required | `PERM.USR.INVITE*` | create/resend/revoke/accept | expired/revoked/superseded/email mismatch | all changes/denials |
| Audit Event | tenant owner/admin by scope | server-only | never | retention only | restricted | tenant_id match | client_id filtered where applicable | management scope | `PERM.AUDIT.*` | append | client reads internal audit; cross-tenant read | append-only |

## Cross-Model Invariants

- No client scope can reference a client in another tenant.
- No role assignment is active without active membership.
- Client user invitations require exactly one client scope in F-001.
- Client admin cannot invite users in F-001.
- Resend invalidates previous pending invitation for same email/role/scope.
- Audit events are retained even when membership is disabled or removed.
- Navigation visibility never grants authorization.
