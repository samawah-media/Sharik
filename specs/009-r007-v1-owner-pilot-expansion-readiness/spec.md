# Feature Specification: R-007 V1 Owner Pilot Expansion and Acceptance-to-Production Readiness

**Feature Branch**: `[009-r007-v1-owner-pilot-expansion-readiness]`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Start a new Spec Kit package for the next V1 workstream. Recommended direction: R-007 V1 Owner Pilot Expansion / Acceptance-to-Production Readiness. Define the next scope clearly around V1 core: deliverables, SLA, approvals, files, permissions, audit logs, and client portal readiness. Use R-006 as the accepted baseline, not as an open bugfix phase."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner Reviews V1 Pilot Readiness (Priority: P1)

The owner and management need a clear go/no-go readiness package that starts from the accepted R-006 Hadna-only internal UAT baseline and shows what must be true before the platform can expand toward a broader V1 pilot or a production-candidate review.

**Why this priority**: R-006 is accepted for internal UAT only. The next work must not reopen R-006 or accidentally imply production acceptance, non-Hadna data use, or hosted database mutation without a new gate.

**Independent Test**: A reviewer can read the R-007 readiness package and determine the current baseline, allowed scope, blocked scope, required evidence, and exact owner decisions needed before any implementation or hosted change.

**Acceptance Scenarios**:

1. **Given** R-006 is accepted for Hadna-only internal UAT, **When** the owner reviews R-007 readiness, **Then** the package states that R-006 is the baseline and not an open bugfix phase.
2. **Given** a proposed next pilot step, **When** it requires production acceptance, non-Hadna data, hosted database mutation, new dependency, or workflow change, **Then** the package requires a new explicit owner decision and the applicable Spec Kit/ADR evidence before execution.
3. **Given** a reviewer asks what V1 readiness means, **When** they inspect the package, **Then** it maps readiness to deliverables, SLA, approvals, files, permissions, audit logs, and client portal behavior.

---

### User Story 2 - Management Validates the Core Delivery Workflow (Priority: P2)

Management and project leads need the V1 operating loop to be ready for pilot use: agreed deliverables move through internal work, internal approval, client approval, delivery, package usage, SLA states, and audit evidence without exposing internal information to the client.

**Why this priority**: The V1 product promise depends on the deliverable lifecycle, approvals, SLA, permissions, and auditability working as one operating system.

**Independent Test**: A pilot workflow can be reviewed or exercised with scoped UAT data from deliverable creation through delivery, proving the state transitions, visibility rules, SLA pause/resume behavior, and audit trail.

**Acceptance Scenarios**:

1. **Given** a deliverable is not internally approved, **When** a user tries to expose it to the client, **Then** the action is denied and an appropriate audit event or denial evidence is available.
2. **Given** a deliverable is sent to the client for approval, **When** the platform calculates SLA status, **Then** client waiting time is paused for Samawah SLA and the pause reason is visible to management.
3. **Given** a client requests changes, **When** the deliverable returns to the team, **Then** the status, SLA timeline, and audit trail reflect the resumed work state.
4. **Given** a deliverable is approved and delivered, **When** package usage is reviewed, **Then** usage is traceable through ledger or audit evidence rather than an unexplained manual counter.

---

### User Story 3 - Client Portal Is Ready for Controlled Pilot Actions (Priority: P3)

Client approvers and viewers need a simple Arabic RTL portal that shows only their allowed deliverables, package progress, approval actions, client-visible comments, and final files, while hiding internal comments, drafts, management navigation, and other clients.

**Why this priority**: Client trust is a core V1 risk. A pilot can only expand if the client portal is simple, scoped, and safe.

**Independent Test**: A client approver, a client viewer, and an unassigned viewer can each open the client portal and see only the actions and data allowed for their role and scope.

**Acceptance Scenarios**:

1. **Given** a client approver has an assigned deliverable waiting for approval, **When** they open the portal, **Then** they can approve or request changes only for the visible client-approved version.
2. **Given** a client viewer does not have approval authority, **When** they open a waiting approval item, **Then** they can view allowed data but cannot submit an approval decision.
3. **Given** a client user is unassigned from a client, **When** they open the client portal, **Then** they see a safe empty or no-assigned-client state with no hidden customer data.
4. **Given** a deliverable has internal comments or internal files, **When** a client opens the deliverable, **Then** those internal items are not visible or downloadable.

---

### User Story 4 - Release Reviewer Receives Evidence Before Production Candidate (Priority: P4)

Before any production-candidate decision, the release reviewer needs a concise evidence bundle covering tests, security checks, UAT boundaries, known risks, rollback, and unresolved out-of-scope items.

**Why this priority**: R-007 is readiness work, not production acceptance. Evidence must make that distinction visible and auditable.

**Independent Test**: A reviewer can inspect the final R-007 evidence and decide whether to request fixes, approve a broader pilot, or authorize a separate production-candidate package.

**Acceptance Scenarios**:

1. **Given** R-007 implementation is complete, **When** release evidence is reviewed, **Then** it includes tenant isolation, permission, SLA pause/resume, approval, file visibility, audit log, RTL/mobile, and secret-scan outcomes.
2. **Given** any required evidence is missing, **When** the readiness package is evaluated, **Then** the package remains not ready for production-candidate review.
3. **Given** the owner wants to move beyond internal UAT, **When** production acceptance is requested, **Then** a separate explicit owner decision is required.

### Edge Cases

- Owner accepts expanded internal pilot readiness but does not grant production acceptance.
- A team member has client-scoped access to one client but tries to view another client.
- A client user has membership but no active client-scoped role assignment.
- A deliverable approval is attempted on a stale or superseded version.
- A file marked internal-only is linked to a deliverable that later becomes client-visible.
- SLA is paused for the client, then the client requests changes after the due date.
- A hosted smoke cannot run without out-of-band credentials; evidence must record the block without printing credentials.
- Existing R-006 Hadna UAT data must not be mutated unless the new R-007 owner decision explicitly authorizes it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The package MUST treat R-006 owner-accepted Hadna-only internal UAT as the baseline and MUST NOT reopen R-006 as a bugfix phase.
- **FR-002**: The package MUST clearly separate internal pilot acceptance, broader owner pilot expansion, production-candidate readiness, and final production acceptance.
- **FR-003**: The package MUST define readiness gates for deliverables, SLA, approvals, files, permissions, audit logs, and client portal behavior.
- **FR-004**: The system MUST preserve tenant and client isolation for all customer-scoped data paths.
- **FR-005**: The system MUST prevent client users from seeing internal comments, internal files, drafts, management-only navigation, or other-client data.
- **FR-006**: The system MUST require internal approval before exposing a deliverable or deliverable version to a client unless a documented owner-approved policy states otherwise.
- **FR-007**: The system MUST bind internal and client approvals to the specific deliverable version being approved.
- **FR-008**: The system MUST record audit evidence for approval, rejection, change request, delivery, file visibility change, SLA pause/resume, package-affecting change, and security denial events.
- **FR-009**: The system MUST pause Samawah SLA when a deliverable is waiting on the client and resume it when the client requests changes or work returns to the team.
- **FR-010**: The system MUST show management enough readiness information to identify items waiting on the team, management, or client without exposing sensitive workbook-derived content in evidence.
- **FR-011**: The client portal MUST support Arabic RTL display and mobile-safe access to client-visible deliverables, package progress, approval needs, and final files.
- **FR-012**: The package MUST include negative tests or equivalent evidence for tenant isolation, role permissions, internal-comment hiding, file visibility, and stale approval prevention.
- **FR-013**: The package MUST require a new explicit owner approval before using non-Hadna customer data or mutating a hosted database.
- **FR-014**: The package MUST keep credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, and secret values out of committed docs and chat/evidence summaries.
- **FR-015**: The package MUST identify any new technical decision that requires an ADR before implementation begins.

### Key Entities *(include if feature involves data)*

- **Pilot Scope**: The approved boundary for a pilot step, including allowed data source, environment, roles, duration, and explicit exclusions.
- **Readiness Gate**: A verifiable checkpoint that must pass before broader pilot or production-candidate review.
- **Deliverable**: The agreed marketing output moving through internal work, internal approval, client approval, delivery, and closure.
- **Deliverable Version**: The exact client-visible or internal revision that approval decisions attach to.
- **SLA Timeline Segment**: A running, paused, or completed interval that explains SLA status and client waiting time.
- **Approval Decision**: An internal or client decision with actor, time, version, result, reason or comment, and scope.
- **File Asset**: A file attached to client, contract, deliverable, report, or final delivery context with visibility rules.
- **Comment**: Internal, client, system, or approval comment with explicit visibility.
- **Audit Event**: Append-only evidence for sensitive state, permission, approval, SLA, file, or package-affecting changes.
- **Client Portal View**: The role-scoped client experience for visible deliverables, package progress, approval requests, and final delivery files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of R-007 implementation tasks map to one of the V1 readiness gates: deliverables, SLA, approvals, files, permissions, audit logs, or client portal.
- **SC-002**: A reviewer can determine within 10 minutes whether R-007 is internal pilot readiness, broader pilot approval, production-candidate readiness, or production acceptance.
- **SC-003**: Automated or documented evidence covers at least 12 required V1 scenarios across tenant isolation, permissions, SLA, approvals, files, comments, audit logs, and client portal.
- **SC-004**: Client portal smoke evidence covers at least three personas: management/project admin, assigned client user, and unassigned or unauthorized client user.
- **SC-005**: No committed R-007 evidence contains credentials, emails, screenshots, workbook row content, links, captions, deliverable titles, tokens, or secret values.
- **SC-006**: Any hosted mutation, non-Hadna data use, production promotion, or production acceptance request is blocked unless the package records a new explicit owner approval.
- **SC-007**: The release reviewer receives a final readiness summary with pass/fail status, residual risks, out-of-scope items, and next owner decision required.

## Assumptions

- R-006 remains accepted only for Hadna internal UAT and is not treated as production acceptance.
- R-007 starts as a planning package; product code and hosted data changes begin only after this Spec Kit package is reviewed.
- Existing Next.js, TypeScript, Supabase/PostgreSQL, RLS, Supabase Auth, Supabase Storage, Tailwind, shadcn/Radix style, and current test tooling remain the approved stack.
- No new dependency is needed for the planning package. Any strategic dependency addition during implementation needs review and possibly ADR.
- Hadna UAT accounts and credentials remain out-of-band and must not be printed or committed.
- If pilot expansion later requires non-Hadna customer data, that will be a separate explicit owner decision with data handling scope.
- Production acceptance requires a separate owner decision after R-007 evidence, not merely successful implementation.
