# Feature Specification: R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution

**Feature Branch**: `[010-r008-controlled-v1-pilot-production-candidate-readiness-execution]`

**Created**: 2026-07-08

**Status**: Draft - planning package only

**Input**: User description: "Owner accepts R-007 readiness review and authorizes starting R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution as a new Spec Kit package, planning first, with no hosted mutation without later explicit approval."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner Controls Pilot Execution Gates (Priority: P1)

The owner and management need a controlled pilot execution plan that converts R-007 readiness evidence into explicit go/no-go gates before any broader V1 pilot, hosted UAT action, or production-candidate claim.

**Why this priority**: R-007 is accepted as readiness review only. R-008 must prevent accidental Production acceptance, hosted mutation, non-Hadna data use, or deployment by making every next step an explicit owner gate.

**Independent Test**: A reviewer can read the R-008 package and identify the allowed planning scope, blocked hosted scope, gate owners, evidence required at each gate, and the exact approval required before proceeding.

**Acceptance Scenarios**:

1. **Given** R-007 has owner readiness acceptance, **When** R-008 is reviewed, **Then** it states that R-007 acceptance is not Production acceptance and does not authorize hosted mutation or non-Hadna data.
2. **Given** a task proposes hosted UAT mutation, hosted deployment, non-Hadna data use, or Production acceptance, **When** the task is evaluated, **Then** it is blocked until a later explicit owner approval names the environment, data boundary, mutation type, and rollback plan.
3. **Given** the owner requests a controlled pilot, **When** the gate plan is inspected, **Then** it defines entry criteria, exit criteria, evidence owners, residual-risk handling, and go/no-go outcomes.

---

### User Story 2 - Reviewer Proves Tenant and Client Isolation (Priority: P2)

The release reviewer needs an evidence-backed proof that tenant and client isolation remain intact across management, team, client portal, approval, file, comment, audit, and SLA reporting paths.

**Why this priority**: Cross-client or cross-tenant leakage is the highest risk for a controlled pilot and must be proven before any production-candidate review.

**Independent Test**: The reviewer can inspect automated or documented evidence showing allowed users see their own scope only, unauthorized users see safe denial states, and sensitive data paths remain tenant/client scoped.

**Acceptance Scenarios**:

1. **Given** two client scopes exist in synthetic or owner-approved pilot evidence, **When** a client user attempts to access the other client scope, **Then** access is denied and no customer data appears.
2. **Given** an assigned internal user has access to one client, **When** they inspect management/team surfaces, **Then** they see only authorized client data and cannot gain management-only powers.
3. **Given** a file, comment, approval, audit, or SLA report is client-scoped, **When** authorization is reviewed, **Then** tenant/client scope is enforced before display, download, decision, or report inclusion.

---

### User Story 3 - Security Reviewer Receives Production-Candidate Checklist (Priority: P3)

The security/release reviewer needs a production-candidate checklist covering permissions, RLS/server-side authorization, secret handling, evidence redaction, audit completeness, file access, approval integrity, rollback, and residual risks.

**Why this priority**: Production-candidate readiness must be a security and operations decision, not just a green test run.

**Independent Test**: A reviewer can open the checklist and determine which security controls are passed, failed, blocked, accepted with risk, or require owner approval before any hosted action.

**Acceptance Scenarios**:

1. **Given** R-008 remains planning-only, **When** the checklist is reviewed, **Then** hosted UAT and Production acceptance items remain blocked until owner approval is recorded.
2. **Given** security evidence is collected, **When** it is committed or summarized, **Then** it excludes credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, and secret values.
3. **Given** a residual risk remains, **When** the go/no-go package is prepared, **Then** the risk includes impact, scope, owner decision needed, and whether the risk blocks production-candidate readiness.

---

### User Story 4 - Pilot Team Hardens Client Approval and Final Delivery (Priority: P4)

Management and the pilot team need the client approval journey, file visibility, final delivery readiness, audit log completeness, and SLA reporting surfaces hardened enough for controlled V1 pilot review.

**Why this priority**: The pilot will exercise the core V1 promise: deliverables move safely from internal work to client approval, final delivery, audit, and SLA reporting without exposing internal content.

**Independent Test**: A pilot reviewer can exercise or inspect the approval-to-delivery journey and see correct version binding, role limits, file visibility, audit events, and SLA pause/resume reporting.

**Acceptance Scenarios**:

1. **Given** a deliverable is waiting for client approval, **When** a client approver acts, **Then** the decision is version-bound and audited.
2. **Given** a client viewer opens the same item, **When** they inspect the action area, **Then** approval actions are unavailable while allowed content remains visible.
3. **Given** a final file is prepared, **When** final delivery readiness is checked, **Then** internal files remain hidden and client-visible/final files require authorized visibility.
4. **Given** a deliverable waits on the client and later returns to the team, **When** SLA reporting is reviewed, **Then** client waiting time is separated from Samawah-owned work time.

---

### User Story 5 - Owner Receives Go/No-Go Evidence Package (Priority: P5)

The owner needs a concise evidence package that supports a decision to continue internal pilot, authorize limited hosted UAT, request fixes, or start a separate production-candidate acceptance package.

**Why this priority**: R-008 should end with a decision-ready package, not an ambiguous state between pilot and Production.

**Independent Test**: The owner can review the final R-008 evidence and choose one of the defined outcomes without needing hidden context or sensitive data.

**Acceptance Scenarios**:

1. **Given** R-008 work is complete, **When** the owner reviews the evidence package, **Then** it lists passed gates, blocked gates, residual risks, rollback plan, out-of-scope items, and exact next decision options.
2. **Given** a hosted UAT step is desired after local evidence, **When** the owner decision is requested, **Then** the request states the environment, data boundary, mutation plan, rollback plan, evidence rules, and duration.
3. **Given** Production acceptance is requested, **When** the owner reviews the R-008 result, **Then** a separate explicit Production acceptance decision remains required.

### Edge Cases

- Owner accepts R-007 readiness but approves only R-008 planning, not implementation.
- Local evidence passes while hosted UAT remains blocked due to missing approval.
- A hosted UAT request is approved for read-only smoke but not mutation.
- A hosted mutation request omits rollback details and must be rejected.
- Synthetic/local isolation proof passes but non-Hadna customer data remains unauthorized.
- Client approval succeeds for a current version but a stale version decision is attempted afterward.
- Final delivery files are prepared before management authorizes client-visible final delivery.
- Audit evidence exists for success paths but a denial path is missing.
- SLA reporting passes for waiting-client pause but does not separate internal-decision pause.
- Docker/local infrastructure instability affects repeat RLS verification and must be recorded without overstating production readiness.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The package MUST record that R-007 is accepted for owner readiness review only and does not grant Production acceptance.
- **FR-002**: The package MUST block hosted database mutation, hosted deployment or promotion, non-Hadna customer data use, and Production acceptance unless a later explicit owner approval is recorded.
- **FR-003**: The package MUST define controlled pilot execution gates with entry criteria, exit criteria, required evidence, owner or reviewer, status, and next decision.
- **FR-004**: The package MUST include tenant/client isolation proof across management, team, client portal, approvals, files, comments, audit logs, and SLA reporting.
- **FR-005**: The package MUST include a production-candidate security checklist covering permissions, RLS/server authorization, deny-by-default behavior, secret handling, evidence redaction, auditability, file access, approval integrity, and rollback readiness.
- **FR-006**: The package MUST define a hosted UAT authorization boundary that names allowed environment, data source, mutation type, duration, rollback plan, and evidence rules before any hosted action.
- **FR-007**: The package MUST harden or verify the client approval journey for role authority, current-version decisions, stale-version denial, client-safe comments, and audit evidence.
- **FR-008**: The package MUST verify file and final-delivery readiness, including internal-only file hiding, client-visible/final file authorization, download scope checks, and final delivery audit evidence.
- **FR-009**: The package MUST verify audit log completeness for approval, rejection, change request, send-to-client, delivery, file visibility change, SLA pause/resume, package-affecting change, and security denial paths.
- **FR-010**: The package MUST verify SLA reporting readiness for running, paused waiting-client, paused internal-decision, resumed, completed, cancelled, at-risk, and overdue states where applicable.
- **FR-011**: The package MUST include a release rollback plan for code, hosted configuration, hosted data mutation, file visibility changes, and UAT communication.
- **FR-012**: The package MUST produce an owner go/no-go evidence package with pass/fail/blocked status, residual risks, out-of-scope items, and exact next decision options.
- **FR-013**: Evidence MUST avoid credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, and secret values.
- **FR-014**: New dependencies, tenancy model changes, RLS model changes, SLA calculation changes, approval workflow changes, or direct production-candidate acceptance semantics MUST require ADR or owner review before execution.

### Key Entities *(include if feature involves data)*

- **Pilot Execution Gate**: A required checkpoint before pilot or production-candidate progression.
- **Isolation Proof**: Evidence that tenant and client scopes cannot cross.
- **Security Checklist Item**: A production-candidate control with result, evidence, risk, and owner decision.
- **Hosted UAT Authorization**: Owner-approved boundary for any hosted UAT action.
- **Approval Journey Probe**: A scenario proving client approval authority, version binding, stale denial, and audit.
- **Final Delivery Probe**: A scenario proving file visibility and final delivery readiness.
- **Audit Completeness Matrix**: Required audit events mapped to sensitive success and denial paths.
- **SLA Reporting Probe**: A scenario proving SLA ownership, pause/resume, and reporting classification.
- **Rollback Plan**: A documented recovery path for code, hosted state, data, files, and communications.
- **Go/No-Go Evidence Package**: The final owner-facing decision artifact.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of R-008 tasks map to one or more required gates: controlled pilot execution, tenant/client isolation, security checklist, hosted UAT boundary, client approval, files/final delivery, audit logs, SLA reporting, rollback, or owner evidence.
- **SC-002**: The owner can identify within 10 minutes whether R-008 authorizes planning only, local implementation, hosted UAT, production-candidate review, or Production acceptance.
- **SC-003**: Evidence covers at least 15 required scenarios across isolation, permissions, approvals, files, comments, audit, SLA, security, rollback, and owner go/no-go.
- **SC-004**: Tenant/client isolation proof includes at least four persona categories: management/project admin, assigned internal user, client approver, and unauthorized/unassigned client user.
- **SC-005**: Client approval and final-delivery readiness evidence covers current version approval, stale version denial, client viewer denial, internal file hiding, and final file authorization.
- **SC-006**: Audit completeness evidence covers 100% of the sensitive event categories named in FR-009 or records an explicit blocker.
- **SC-007**: No committed R-008 evidence contains credentials, emails, screenshots, workbook row content, links, captions, deliverable titles, tokens, or secret values.
- **SC-008**: Hosted mutation, non-Hadna data use, deploy/promote, or Production acceptance remains blocked unless a later explicit owner approval records the exact boundary and rollback plan.
- **SC-009**: The final go/no-go package gives the owner at least four clear outcomes: continue local/internal pilot, authorize limited hosted UAT, request fixes, or start a separate production acceptance package.

## Assumptions

- R-007 owner readiness review is accepted as readiness only, not Production acceptance.
- R-008 starts as planning only. No code, hosted mutation, deployment, dependency addition, or production promotion is authorized by this package creation.
- Hadna remains the only customer data boundary unless a later owner decision authorizes otherwise.
- Existing stack and architectural decisions remain unchanged.
- Any hosted UAT action will require a later explicit owner approval naming environment, data, mutation, duration, rollback, and evidence rules.
- Production acceptance requires a separate explicit owner decision after R-008 evidence, not successful R-008 completion alone.
