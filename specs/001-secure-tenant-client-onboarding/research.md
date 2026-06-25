# Research: Secure Tenant and Client Onboarding

**Date**: 2026-06-23

**Scope**: Technical planning decisions for F-001 only. This document records decisions, rationale, alternatives, security impact, operational impact, testing impact, related ADRs, and official sources where applicable.

## Official Sources Reviewed

- GitHub Spec Kit Releases: https://github.com/github/spec-kit/releases
- Supabase Admin invite user: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- Supabase Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Supabase Auth email templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase Auth redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Auth sessions: https://supabase.com/docs/guides/auth/sessions
- Supabase JS signOut reference: https://supabase.com/docs/reference/javascript/auth-signout
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Next.js mutating data: https://nextjs.org/docs/app/getting-started/mutating-data
- Next.js data security: https://nextjs.org/docs/app/guides/data-security
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

## Decision 1: Spec Kit Version

**Decision**: Use the current project Spec Kit integration (`0.9.5`) for this F-001 planning phase; do not upgrade to `v0.11.5` inside this phase.

**Rationale**: GitHub Releases shows `v0.11.5` as latest on 2026-06-23, but upgrading requires a separate owner-approved commit and template review. Mixing local 0.9.5 scripts with 0.11.5 artifacts would make plan provenance unclear.

**Alternatives Considered**:

- Upgrade now to `v0.11.5`: rejected for this phase because no explicit approval for a separate upgrade commit was provided.
- Use 0.9.5 throughout F-001: accepted for consistency.

**Security Impact**: none directly, but consistent templates reduce process ambiguity.

**Operational Impact**: team must decide later whether to upgrade before `/speckit.tasks`.

**Testing Impact**: no implementation tests in this phase.

**Related ADR**: none; process decision only.

**Source**: GitHub Spec Kit Releases.

## Decision 2: Invitation Mechanism

**Decision**: Use a hybrid invitation model: Supabase Auth handles identity/session and invite email mechanics where useful, while Sharik owns an application `Invitation` domain record for scope, role, expiry, single-use, resend, revocation, supersession, audit, and safe UX.

**Rationale**: Supabase Admin `inviteUserByEmail` can send invite links, but F-001 has product-specific requirements that must not live only in Auth metadata: 7-day validity, one-time use, role/scope, email match, superseded links, acceptance audit, and safe denial states.

**Alternatives Considered**:

- Supabase Admin invitation only: insufficient domain lifecycle and audit detail.
- Fully custom invitation with no Supabase invite: possible, but increases email/token handling and account creation complexity.
- Hybrid approach: accepted.

**Security Impact**: domain invitation record prevents granting access outside recorded scope and supports replay/supersession checks.

**Operational Impact**: email delivery failures must be represented separately from access activation.

**Testing Impact**: integration tests must cover Auth identity plus domain invitation states.

**Related ADR**: ADR-003, ADR-005, ADR-006, ADR-009.

**Source**: Supabase Admin invite docs, Supabase email templates/redirect docs.

## Decision 3: Invitation Validity, Single Use, Revocation, and Resend

**Decision**: Store `expires_at`, terminal lifecycle timestamps, supersession reference, and accepted user reference in the domain invitation. Treat `expired` as derived from authoritative time while the invitation is still pending; optionally materialize an expiry event later for reporting.

**Rationale**: Derived expiry avoids stale stored state while still allowing deterministic acceptance at the boundary. Resend must make the old invitation `superseded` before creating the replacement.

**Alternatives Considered**:

- Store `expired` as a manually updated status only: risks stale pending records.
- Use Supabase token expiry only: does not encode Sharik role/scope lifecycle.
- Derived expiry plus terminal statuses: accepted.

**Security Impact**: prevents invitation replay and stale access paths.

**Operational Impact**: acceptance command needs a single authoritative timestamp.

**Testing Impact**: unit tests for boundary time, replay, superseded, revoked, and email mismatch cases.

**Related ADR**: ADR-006, ADR-009.

**Source**: Supabase Auth invite/email docs, OWASP ASVS session/access-control principles.

## Decision 4: Identity, Membership, Role, and Scope Separation

**Decision**: Keep Supabase Auth user identity separate from tenant membership, client membership, role assignment, and assignment scope. Do not store one global product role on the Auth user or profile.

**Rationale**: A user can have different roles in different scopes. Client users must not gain tenant-wide access. Internal team members can be assigned to multiple clients.

**Alternatives Considered**:

- Global role on user: rejected because it breaks scope-aware authorization.
- Role in JWT metadata only: rejected because claims can become stale and do not replace current membership checks.
- Application-owned scoped role assignments: accepted.

**Security Impact**: reduces privilege escalation and cross-client leakage risk.

**Operational Impact**: every command must resolve active membership and role assignment.

**Testing Impact**: role/scope validation, multiple roles, disabled membership, and client isolation tests.

**Related ADR**: ADR-004, ADR-005.

**Source**: Supabase Auth/RLS docs; local constitution and tenancy model.

## Decision 5: Disabled Membership and Active Sessions

**Decision**: Deny future protected reads and commands by checking current membership state server-side and in RLS helpers. Do not rely on immediate JWT invalidation for access removal. Use shorter JWT/session policies later if needed.

**Rationale**: Supabase documents session controls and sign-out behavior, but access tokens may remain valid until expiry. Membership state must be checked on every protected path.

**Alternatives Considered**:

- Attempt to revoke all sessions as the only access removal: insufficient by itself.
- Force immediate user deletion: rejected because audit and identity history must remain.
- Current membership checks on every protected path: accepted.

**Security Impact**: disables access even with still-valid tokens as long as protected paths check membership state.

**Operational Impact**: offboarding must update membership state and pending invitations.

**Testing Impact**: integration/E2E tests for disabled membership with active session.

**Related ADR**: ADR-005, ADR-006.

**Source**: Supabase sessions and signOut docs.

## Decision 6: Execution Path by Operation Type

**Decision**:

- Server Actions: authenticated form mutations such as create client, update client, invite, resend, revoke, assign role, disable membership.
- Route Handlers: Auth callback/accept invitation flows, webhook-like email callback handling if needed, and explicit endpoints where browser navigation is required.
- Database Functions/RPC: transaction-heavy operations when atomic DB-side changes are required and implementation review approves the function boundary.
- Supabase Admin API: server-only Auth operations such as inviting or provisioning users; never from browser code.

**Rationale**: Next.js states server functions are directly reachable and must verify auth/authorization. Supabase service-role/Admin operations must stay server-side.

**Alternatives Considered**:

- Direct client SDK writes: rejected for sensitive mutations.
- Route handlers for everything: possible, but less ergonomic for forms.
- Server Actions plus route handlers and optional DB RPC: accepted.

**Security Impact**: centralizes command authorization and prevents service-role exposure.

**Operational Impact**: command layer must be thinly orchestrated by Next.js endpoints.

**Testing Impact**: server authorization integration tests and component tests for form states.

**Related ADR**: ADR-002, ADR-006.

**Source**: Next.js mutating data and data security docs; Supabase Admin docs.

## Decision 7: Transaction and Consistency Behavior

**Decision**: Treat client creation, invitation lifecycle changes, role assignment, membership activation/disablement, and audit writes as atomic command boundaries. Email sending is triggered only after a durable invitation record exists.

**Rationale**: Half-created access records are unacceptable. Audit must explain each sensitive outcome. Email dispatch is external and may fail independently.

**Alternatives Considered**:

- Write rows independently from UI flow: rejected due consistency risk.
- DB-only triggers for all behavior: rejected as opaque for business rules.
- Command transaction plus explicit audit/outbox behavior: accepted.

**Security Impact**: prevents membership without audit or roles without valid scope.

**Operational Impact**: implementation may need DB transaction/RPC or server command transaction wrapper.

**Testing Impact**: integration tests for rollback and audit persistence.

**Related ADR**: ADR-006, ADR-009.

**Source**: local logical transaction boundaries; Supabase/Postgres planning docs.

## Decision 8: Threat Controls

**Decision**: Use layered controls: server-side permission evaluation, RLS predicates, scoped unique constraints, safe errors, rate limits, idempotency keys/business uniqueness, input validation, and append-only audit.

**Rationale**: F-001 threats include cross-tenant access, cross-client access, IDOR, privilege escalation, invitation replay, enumeration, and mass assignment.

**Alternatives Considered**:

- RLS only: rejected because sensitive state transitions need command checks.
- UI navigation only: rejected because direct POST/URL access remains possible.
- Layered controls: accepted.

**Security Impact**: defense in depth for all high-risk flows.

**Operational Impact**: requires negative tests and audit review before build acceptance.

**Testing Impact**: unit, integration, RLS, E2E, and security test coverage required.

**Related ADR**: ADR-004, ADR-005, ADR-006.

**Source**: Supabase RLS docs, Next.js data security docs, OWASP ASVS.

## Decision 9: Test Approach

**Decision**: Plan test coverage across unit, integration, RLS/database, component, E2E, accessibility, and security layers. Do not implement tests in this phase.

**Rationale**: Security behavior spans domain rules, DB policies, server commands, UI navigation, and direct URL tampering.

**Alternatives Considered**:

- E2E only: rejected because failures would be hard to diagnose.
- Unit only: rejected because RLS and server boundaries are central.
- Layered test plan: accepted.

**Security Impact**: negative tests become a release gate for F-001.

**Operational Impact**: test data must include Tenant A/B and Client A/B fixtures.

**Testing Impact**: defines future `tasks.md` test categories.

**Related ADR**: ADR-005, ADR-006.

**Source**: local test strategy, OWASP ASVS.

## Decision 10: Minimum Email Provider

**Decision**: Minimum viable F-001 can use Supabase Auth email templates and invite email mechanics in development/pilot, but production readiness should configure a custom SMTP/provider if invitation volume or branding exceeds built-in limits.

**Rationale**: Supabase Auth supports invite-user email templates and redirect URLs, but official rate-limit docs show built-in email sending is constrained and custom SMTP is needed for adjustable limits.

**Alternatives Considered**:

- Built-in email only forever: rejected for operational risk.
- Custom email provider before planning: deferred because this phase does not provision resources.
- Built-in for dev/pilot with documented custom SMTP gate: accepted.

**Security Impact**: email links must use allow-listed redirect URLs and never expose raw scope data.

**Operational Impact**: production checklist must include sender/domain/rate-limit review.

**Testing Impact**: quickstart may use local email capture or placeholder invite link; no real secrets.

**Related ADR**: ADR-003, future deployment/email decision if needed.

**Source**: Supabase Auth rate limits, email templates, redirect URL docs.
