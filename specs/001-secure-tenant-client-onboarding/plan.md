# Implementation Plan: Secure Tenant and Client Onboarding

**Branch**: `001-secure-tenant-client-onboarding` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-secure-tenant-client-onboarding/spec.md`

## Summary

F-001 establishes the first secure onboarding slice for Sharik/Samawah: an active Samawah tenant owner or tenant administrator can sign in, create a client, invite internal and client users, assign scoped roles, resolve role-aware navigation, and prove tenant/client isolation through authorization, RLS design, audit events, and denial UX.

The technical approach is a Next.js App Router modular monolith using Supabase Auth for identity, PostgreSQL for application-owned tenant/client/membership/role/invitation/audit records, server-side command authorization for sensitive operations, and RLS as defense in depth. No product code, SQL, migrations, API implementation, Supabase resources, or `tasks.md` are created in this phase.

## Spec Kit Version Decision

- Official latest verified: `github/spec-kit` release `v0.11.5`, published 2026-06-22 on GitHub Releases.
- Current project integration: Spec Kit `0.9.5`, recorded in `spec.md` readiness notes and used by local `.specify/` scripts.
- Decision for F-001 planning: keep this phase on the current project integration (`0.9.5`) and do not mix generated artifacts from `0.11.5`.
- Rationale: upgrading Spec Kit must happen in a separate owner-approved commit with review of generated templates and AGENTS/constitution preservation. No explicit owner approval for that commit was included in this request.
- Follow-up recommendation: after owner review of this plan, decide whether to create a separate upgrade-only commit before `/speckit.tasks`.

Source: https://github.com/github/spec-kit/releases

## Agent OS Standards Loaded

`/inject-standards` is not available as an executable command in this Codex session. The local Agent OS index was loaded manually:

- `agent-os/standards/index.yml`
- `agent-os/standards/project-standards.md`

The loaded standard covers TypeScript, Next.js, React, Supabase, RLS, file security, testing, RTL/accessibility, error handling, audit/logging, git, and documentation expectations.

## Technical Context

**Language/Version**: TypeScript with Next.js App Router. Exact framework versions remain implementation-time choices constrained by accepted ADRs and dependency review.

**Primary Dependencies**: Next.js, React, TypeScript, Supabase Auth, Supabase PostgreSQL, Supabase Storage for later V1 features, Zod, React Hook Form, TanStack Query/Table, shadcn/ui, Radix UI, Tailwind CSS, Lucide Icons. F-001 planning does not install or update dependencies.

**Storage**: PostgreSQL via Supabase using shared database/shared schema. Application tables conceptually include tenants, clients, memberships, role assignments, invitations, and audit events. Supabase Auth owns identity and sessions.

**Testing**: Planned only: Vitest for domain/security rules, integration tests for command and membership flows, DB/RLS tests for access boundaries, Testing Library for components, Playwright for E2E and mobile/RTL/accessibility paths.

**Target Platform**: Web SaaS, Arabic RTL by default, desktop management console with mobile-safe invitation acceptance and first client portal entry.

**Project Type**: Full-stack web application, modular monolith.

**Performance Goals**: Primary onboarding views should show immediate loading feedback and complete ordinary list/detail interactions within a user-perceived responsive threshold under pilot load. Invitation acceptance must be idempotent under refresh/retry.

**Constraints**: No client-trusted `tenant_id` or `client_id`; deny by default; server-side authorization for sensitive commands; RLS as defense in depth; no microservices; no deliverables, files, SLA, approvals, contracts, billing, or social scheduling inside F-001.

**Scale/Scope**: First pilot tenant is Samawah with a small initial client portfolio. F-001 includes 13 conceptual data entities, 15 operation contracts, 5 invitation states, 6 user stories, 20 acceptance scenarios, and high security risk because it establishes all later trust boundaries.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | `spec.md` exists and this phase creates plan artifacts only. |
| Acceptance criteria | PASS | 20 acceptance scenarios and checklist `44/44` are present. |
| Tenant/client isolation | PASS | Spec SR-001 through SR-004 and accepted ADR-004/005 drive the design. |
| Deny by default and least privilege | PASS | Permission coverage and server-side authorization are core constraints. |
| Server-side sensitive commands | PASS | F-001 treats invitation, membership, role, and audit changes as server-only. |
| RLS defense in depth | PASS | RLS is planned as row-level containment, not the sole authorization layer. |
| Append-only auditability | PASS | Sensitive actions and denials require audit events. |
| Idempotent sensitive operations | PASS | Invitation accept, resend, revoke, and role assignment specify retry behavior. |
| RTL, accessibility, mobile | PASS | Arabic RTL, keyboard, focus, error association, and mobile invite acceptance are planned. |
| No new dependency without review | PASS | No dependencies are installed in this phase. |
| No social scheduling/microservices | PASS | Both remain explicitly out of scope. |

No constitution violation requires complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-secure-tenant-client-onboarding/
|-- spec.md
|-- checklists/
|   `-- requirements.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
`-- contracts/
    `-- operations.md
```

`tasks.md` is intentionally not created by this phase.

### Proposed Implementation Structure

The implementation structure below is a planning target only. No product code is created now.

```text
app/
|-- (auth)/
|-- (management)/
|-- (client)/
`-- api/

src/
|-- modules/
|   |-- auth/
|   |-- tenants/
|   |-- clients/
|   |-- memberships/
|   |-- invitations/
|   |-- authorization/
|   |-- audit/
|   `-- navigation/
|-- server/
|   |-- commands/
|   |-- policies/
|   `-- supabase/
`-- ui/
    |-- management/
    |-- client/
    `-- shared/

tests/
|-- unit/
|-- integration/
|-- rls/
|-- component/
`-- e2e/
```

**Structure Decision**: one Next.js modular monolith with domain modules and a server command/policy layer. Logical services are modules inside the monolith, not deployed microservices.

## Existing Demo Impact

The existing `demo/` is not used as an architectural source of truth and is not modified by this phase. It may remain a UX reference only after scope/security review. F-001 implementation must derive boundaries from `spec.md`, accepted ADRs, constitution, and architecture/security docs rather than demo code.

## Modules Affected

- Authentication Adapter: integrates Supabase Auth identity/session with application membership lookup.
- Tenant Context Resolver: derives active tenant from authenticated membership and target resource.
- Membership Service: models tenant/client membership lifecycle.
- Client Management Service: creates and updates clients inside tenant scope.
- Invitation Service: issues, resends, revokes, accepts, and supersedes invitations.
- Role Assignment Service: applies roles to memberships and scopes.
- Authorization Policy Evaluator: evaluates actor, permission, scope, state, and conditions.
- Audit Service: appends sensitive action and sensitive denial events.
- Role-Aware Navigation Resolver: returns navigation surfaces for active membership/scope.

These modules are logical boundaries only.

## Authentication Boundary

Supabase Auth owns:

- global user identity;
- authentication credentials and session issuance;
- invite-user email delivery if using Admin invitation;
- refresh/access token lifecycle.

The application owns:

- profile display fields if needed;
- tenant membership;
- client membership;
- role assignments;
- assignment scopes;
- invitation domain record and lifecycle;
- authorization decisions;
- audit events.

Authorization must not depend on mutable `user_metadata` or a global user role.

## Authorization Boundary

Every sensitive operation evaluates:

1. authenticated user identity;
2. active tenant membership;
3. active client membership or internal client assignment where applicable;
4. requested permission;
5. role assignment state and scope;
6. resource tenant/client ownership;
7. invitation or membership state;
8. idempotency/concurrency conditions;
9. audit requirement.

Navigation is advisory only. Direct URL and command calls must repeat server-side authorization.

## Tenant Context Resolution

Tenant context is derived from the authenticated user plus active tenant membership and target resource ownership. A browser-supplied `tenant_id` may identify intent but never authorizes access by itself. Cross-tenant targets return a generic denial/not-found response and may create a sensitive denial audit event.

## Client Scope Resolution

Client scope is derived from one of:

- active client membership for client users;
- active internal role assignment scoped to that client;
- tenant management role with documented tenant-wide client visibility.

Client users never receive tenant-wide client lists in F-001. Internal users see assigned clients unless their role grants broader documented scope.

## Invitation Lifecycle

States:

- `pending`: invitation can be accepted if not expired and not superseded.
- `accepted`: consumed once and cannot grant duplicate access.
- `revoked`: admin cancelled it.
- `superseded`: a resend created a replacement invitation for the same email/role/scope.
- `expired`: derived from `expires_at < authoritative_now` while pending; may be materialized later for reporting, but the source of truth is time plus non-terminal state.

Rules:

- validity is 7 days;
- single-use;
- accepting email must match invited email;
- resend supersedes previous pending invite for the same email, role, and scope;
- accept handles both existing and new Supabase Auth users;
- accept is idempotent under refresh/retry;
- expired/revoked/superseded/used invitations never activate or expand scope.

## Membership Lifecycle

Tenant membership and client membership are separate records. A client membership cannot exist outside a tenant. Disabling a membership denies future protected requests even if an access token remains valid. Current access tokens may remain cryptographically valid until expiry, so every protected command and resource read must check current membership state.

Responsibility transfer for active deliverables is deferred because deliverables are outside F-001; F-001 records that later delivery-domain features must block unsafe disablement when responsibilities exist.

## Audit Path

Audit is append-only. Sensitive F-001 events include:

- client creation/update;
- invitation creation, resend, revocation, acceptance, expired/superseded/used denial;
- tenant/client membership activation/disablement;
- role assignment/update;
- client scope removal;
- role-aware navigation resolution failures when sensitive;
- cross-tenant/cross-client/admin-action denial.

Audit events include actor, tenant scope, client scope when applicable, target, action, decision, timestamp, correlation/idempotency reference, and reason when destructive or sensitive.

## Error-Handling Strategy

- Denial responses do not reveal whether unauthorized tenant/client/invitation resources exist.
- User-facing copy is Arabic Saudi and non-technical.
- Recoverable form failures preserve entered values where safe.
- Invitation states have specific safe UX: pending, accepted, expired, revoked, superseded, already used, email mismatch, session expired, network failure.
- Technical errors and raw database/Auth messages are not exposed to end users.

## Idempotency Strategy

- Accept invitation: keyed by invitation id/token hash plus accepting auth user; repeated valid acceptance returns safe no-op if already applied.
- Resend invitation: supersedes the prior pending invitation in the same email/role/scope and creates one active pending replacement.
- Revoke invitation: repeated revoke is safe no-op after terminal state.
- Assign/change role: unique active assignment per membership/role/scope where required; repeated same assignment is safe no-op with audit policy-defined behavior.
- Create client: use unique tenant-scoped slug/name policy and idempotency key if form retries are supported.

## Transaction Strategy

Implementation should use a transaction boundary for each sensitive command:

- create client + audit event;
- create invitation + intended role/scope + audit event + email dispatch request record;
- resend invitation + supersede old pending invitation + create replacement + audit event;
- accept invitation + create/activate memberships + create role assignments + mark invitation accepted + audit event;
- revoke invitation + audit event;
- role assignment change + audit event;
- disable membership + revoke pending invitations + audit event.

Email sending may be initiated after durable invitation creation. If email delivery fails, the invitation remains trackable with a delivery failure state or audit detail, not half-created membership access.

## Observability Strategy

Plan implementation-time signals for:

- invitation created/sent/failed/accepted/revoked/superseded/expired counts;
- invitation acceptance denial reasons;
- cross-tenant/cross-client denial attempts;
- membership disabled access attempts;
- role assignment changes;
- rate-limit and email provider failures;
- audit write failures as critical errors.

Do not log secrets, raw tokens, service-role keys, or sensitive client data.

## Test Strategy

Unit:

- invitation state rules;
- expiration calculation;
- permission evaluation;
- navigation resolution;
- role and scope validation.

Integration:

- membership creation;
- invitation acceptance;
- role assignment;
- audit event creation;
- transaction rollback;
- session behavior after membership disablement.

Database/RLS:

- cross-tenant denial;
- cross-client denial;
- assigned client access;
- unassigned client denial;
- client user limitations;
- admin scope.

Component:

- invitation form;
- member list;
- role selector;
- permission denied UI;
- invitation states.

E2E:

- create client;
- invite internal member;
- invite client member;
- accept invitation as existing user;
- accept invitation as new user;
- expired invitation;
- superseded invitation;
- disabled membership;
- manual URL tampering.

Accessibility:

- keyboard navigation;
- form labels;
- error association;
- focus management;
- RTL;
- mobile viewport.

Security:

- IDOR;
- enumeration;
- replay;
- privilege escalation;
- mass assignment;
- rate limiting;
- session misuse.

## Rollback and Recovery Considerations

- Invitation resend/revoke can stop a bad pending invitation without deleting audit history.
- Role or scope changes are reversible by creating a new role assignment event or disabling the old assignment, not by deleting history.
- Membership disablement preserves identity and audit history.
- If email dispatch fails, admin can resend after verifying invitation state.
- If audit write fails for a sensitive command, the command should fail closed or use a durable outbox policy approved during implementation.

## Security Gates

- No query or command without tenant context.
- No client-trusted tenant/client identifiers.
- No service role in browser.
- No global user role for authorization.
- No client user tenant-wide list.
- No `client_admin` invitation self-service in F-001.
- No raw resource-existence leakage in denials.
- RLS policies planned for all exposed membership/client/invitation/audit tables.
- Server-side authorization required before every sensitive mutation.
- Audit event required for every sensitive state change and sensitive denial.

## Accessibility, RTL, and Mobile Considerations

- Arabic RTL default for onboarding, invitations, denial states, empty states, and navigation.
- Mobile invitation acceptance must keep the primary action reachable.
- Forms require labels, visible focus, field-level errors, and keyboard operation.
- Denial pages must provide a safe return path without naming unauthorized resources.
- Navigation direction, icon direction, and focus order must respect RTL.

## Known Risks

- Supabase Admin invite alone does not model Sharik's full domain lifecycle; a domain invitation record is required.
- Email delivery can fail after invitation record creation; outbox/delivery-state handling must be designed in implementation.
- Active JWTs cannot be assumed revoked immediately on membership disablement; server-side membership checks are mandatory.
- RLS policies can become too broad if role/scope helper functions are not carefully tested.
- F-001 is security-heavy for a first slice and may need sub-slicing before implementation.

## Deferred Work

- `client_admin` self-service invitations.
- bulk invitations.
- tenant switching UI.
- platform support and break-glass.
- MFA, SSO, SCIM.
- deliverables, contracts, packages, files, comments, SLA, approvals.
- external integration APIs.
- advanced audit export.
- Spec Kit upgrade commit.

## RLS and Access Design Matrix

| Entity | SELECT | INSERT | UPDATE | DELETE/Archive | Scope | Server-only operations | Deny cases | Audit |
|---|---|---|---|---|---|---|---|---|
| `tenants` | active tenant members; management only | platform setup/deferred | tenant admin limited/deferred | archive deferred | tenant | tenant management outside F-001 | Tenant A sees Tenant B | required for sensitive changes |
| `clients` | tenant admins, assigned internal users, scoped client users | tenant owner/admin with `PERM.CLIENT.CREATE` | tenant owner/admin with permission | archive deferred | tenant + client | create/update | client user lists other clients; unassigned team access | create/update/denial |
| `tenant_memberships` | actor's own active membership; tenant admins | server invitation/acceptance | tenant admins for state changes | disable/remove only | tenant | activate/disable | missing active tenant membership | all changes |
| `client_memberships` | scoped client users; tenant admins; assigned management | server invitation/acceptance | tenant admins | remove/disable only | tenant + client | activate/remove scope | client user opens other client | all changes |
| `role_assignments` | tenant admins; actor-effective roles; scoped management | tenant owner/admin | tenant owner/admin | revoke/disable | membership + scope | assign/change/revoke | role outside actor authority; scope from other tenant | all changes |
| `invitations` | tenant owner/admin; invited user via safe token flow | tenant owner/admin | resend/revoke/accept via server | terminal states, no hard delete | tenant + optional client | all lifecycle changes | expired/revoked/superseded/email mismatch | all changes and sensitive denials |
| `audit_events` | tenant owner/admin by scope; client external history later only | server-only | append-only no update | retention/archive only by ADR | tenant + optional client | append | client reads internal audit; cross-tenant read | audit itself is record |

## Scope Size Assessment

F-001 remains a valid first vertical slice because all later V1 work depends on safe identity, membership, role, scope, and audit foundations. It is larger than a typical CRUD slice due to security risk.

Indicators:

- Entities: 13 conceptual entities.
- Contracts: 15 operation contracts.
- Invitation states: 5 core states plus derived expiry behavior.
- User stories: 6.
- E2E paths: at least 9.
- RLS groups: tenant, client, membership, role, invitation, audit.
- UI size: management client/member/invitation surfaces plus accept/denial/navigation states.
- Security risk: high.

Suggested implementation sub-slices for owner approval before tasks:

1. F-001A: Authenticated tenant admin, tenant context resolver, create client, audit.
2. F-001B: Internal invitation and scoped internal membership.
3. F-001C: Client invitation and client membership.
4. F-001D: Invitation lifecycle hardening: resend, revoke, supersede, expiry, idempotency.
5. F-001E: Role-aware navigation, denial UX, and security/RLS verification.

Hard dependencies: F-001A precedes all other slices; role/permission evaluator precedes F-001B/C; audit foundation is required from F-001A onward.

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Spec and scope control | PASS | Design maps to `spec.md`; no tasks/code/SQL created. |
| Tenant/client isolation | PASS | Data model and contracts keep tenant/client scopes explicit. |
| Server-side sensitive commands | PASS | All sensitive contracts are server-authorized. |
| RLS defense in depth | PASS | RLS matrix complements server checks. |
| Auditability | PASS | Audit path and contracts require append-only audit events. |
| Idempotency | PASS | Invitation, role, and client creation retry behavior documented. |
| RTL/accessibility/mobile | PASS | Plan, contracts, and quickstart include RTL/mobile/accessibility expectations. |
| Accepted ADR alignment | PASS | Modular monolith, Next.js, Supabase, shared schema, RLS+server auth preserved. |

No unresolved `NEEDS CLARIFICATION` remains for planning. Earlier open questions about `client_admin` invitation authority are resolved for F-001 by `spec.md`: client-admin self-service invitation is deferred and denied/absent.

## Completion Constraints

- `tasks.md` not created.
- `/speckit.tasks` not run.
- `/speckit.analyze` not run.
- `/speckit.implement` not run.
- No product code modified.
- No demo code modified.
- No SQL, migrations, RLS policies, Supabase resources, APIs, or Server Actions created.
