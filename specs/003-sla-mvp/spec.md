# Feature Specification: SLA MVP

**Feature Branch**: `003-sla-mvp`

**Created**: 2026-06-29

**Status**: Implementation approved for F-003 SLA MVP only after PR #16 merge

**Input**: Start F-003 SLA MVP implementation after PR #16 merge, without production/staging migration, dependencies, hosted migration, production usage, real client data, or scope outside SLA MVP.

## Overview

F-003 defines the first SLA foundation for deliverables created in F-002. The feature specifies SLA status values, due-date boundaries, client-waiting pause behavior, pause/resume audit expectations, and management-visible SLA status. It preserves the AGENTS.md rule that client waiting time must not count against Samawah.

This implementation remains limited to SLA MVP foundations. It does not add background jobs, production/staging migrations, new dependencies, Kanban, files, comments, approvals workflow, hosted migration, production usage, or real client data.

## Confirmed Decisions For This Specification

- PR #16 is merged into `main`; this branch starts from the PR #16 merge commit.
- F-002 remains not production accepted unless explicit written owner approval exists.
- F-003 implementation is approved for SLA MVP only.
- SLA must be based on timeline/state boundaries, not a mutable manual counter.
- Owner-approved F-003 MVP `at_risk` policy: active Samawah-owned work is `at_risk` when an applicable due boundary exists, `now` is before that boundary, and the remaining calendar time is less than or equal to 24 hours. Date-only due dates are treated as the end of that UTC calendar day for deterministic local tests. Tenant/type/business-calendar thresholds remain out of scope for this MVP.
- `paused_waiting_client` is mandatory for any client-waiting period.
- `paused_waiting_internal_decision` remains a distinct SLA pause status, must not be conflated with `paused_waiting_client`, and must not be attributed as client delay.
- Client waiting time must be excluded from Samawah delay calculations.
- Pause/resume decisions require audit expectations.
- Management must be able to see SLA status for scoped deliverables.
- No `RoleKey` change and no standalone `project_manager` role is introduced by this specification.

## User Scenarios & Testing

### User Story 1 - Define SLA Status Foundation (Priority: P1)

As a management user, I want every scoped deliverable to have a clear SLA status foundation so I can tell whether Samawah-owned work is on track, at risk, overdue, paused, completed, or cancelled.

**Why this priority**: SLA is part of V1 and must exist before workflow phases rely on it.

**Independent Test**: Can be tested in a future implementation by creating synthetic deliverables with known due-date boundaries and confirming each expected SLA status is derived without using production data.

**Acceptance Scenarios**:

1. **Given** a deliverable is active and before its risk boundary, **When** management views its SLA state, **Then** the status is `on_track`.
2. **Given** a deliverable is active and inside the owner-approved at-risk threshold, **When** management views its SLA state, **Then** the status is `at_risk`.
3. **Given** a deliverable is active and past the applicable due boundary, **When** management views its SLA state, **Then** the status is `overdue`.
4. **Given** a deliverable is completed or cancelled, **When** management views its SLA state, **Then** the status is `completed` or `cancelled` and no active Samawah delay continues to accrue.
5. **Given** a deliverable is explicitly paused for an internal management decision in a future approved workflow, **When** management views its SLA state, **Then** the status is `paused_waiting_internal_decision` and it remains separate from client waiting time.

---

### User Story 2 - Pause And Resume For Client Waiting (Priority: P1)

As a project or marketing manager, I want SLA to pause while a deliverable waits for the client so that client delay is not counted against Samawah.

**Why this priority**: This is a mandatory AGENTS.md rule and the main SLA trust boundary for V1.

**Independent Test**: Can be tested in a future implementation by moving a synthetic deliverable into and out of a client-waiting state and verifying paused time is attributed to client waiting rather than Samawah delay.

**Acceptance Scenarios**:

1. **Given** a deliverable enters a client-waiting state, **When** SLA status is evaluated, **Then** the status becomes `paused_waiting_client`.
2. **Given** a deliverable remains client-waiting for multiple days, **When** Samawah delay is calculated, **Then** that waiting time is excluded from Samawah delay.
3. **Given** the client requests changes or the deliverable returns to a Samawah-owned work state, **When** SLA resumes, **Then** future running time counts against Samawah from the resume boundary only.
4. **Given** SLA pauses or resumes, **When** the decision is recorded, **Then** audit expectations include actor or system source, tenant/client scope, deliverable, previous state, new state, reason, and timestamp.

---

### User Story 3 - Show SLA Status To Management (Priority: P2)

As a management user, I want to see SLA status on scoped deliverables so that I can prioritize at-risk and overdue work without exposing internal reasoning to clients.

**Why this priority**: Management visibility makes the SLA foundation operational without adding dashboard complexity.

**Independent Test**: Can be tested in a future implementation by viewing management-safe deliverable summaries for Client A and verifying Client B data and internal audit details are not exposed.

**Acceptance Scenarios**:

1. **Given** management has access to Client A, **When** they view Client A deliverables, **Then** each SLA-tracked deliverable shows a management-visible SLA status.
2. **Given** management lacks access to Client B, **When** they attempt to view Client B SLA status, **Then** access is denied without revealing Client B details.
3. **Given** a client-facing view exists outside this MVP, **When** client users view deliverables, **Then** internal SLA audit reasoning and management-only delay details are not exposed by this feature.

## Acceptance Scenario Matrix

| ID | Scenario | Actor | Expected Decision | Audit Expectation | Scope Requirement |
|---|---|---|---|---|---|
| AC-001 | Active deliverable before risk boundary | Management | `on_track` | No manual override required | Tenant/client scoped |
| AC-002 | Active deliverable inside owner-approved at-risk threshold | Management | `at_risk` | Evaluation basis is explainable | Tenant/client scoped |
| AC-003 | Active deliverable past due boundary | Management | `overdue` | Evaluation basis is explainable | Tenant/client scoped |
| AC-004 | Client-waiting deliverable | Management | `paused_waiting_client` | Pause expectation recorded | Tenant/client scoped |
| AC-005 | Client waiting period in delay summary | Management | Client time excluded from Samawah delay | Pause segment explains exclusion | Tenant/client scoped |
| AC-006 | Client change request or return to Samawah work | Management | SLA resumes from resume boundary | Resume expectation recorded | Tenant/client scoped |
| AC-007 | Management scoped list | Management | SLA status visible | Internal audit remains protected | Allowed client scope only |
| AC-008 | Unauthorized SLA access | Unauthorized actor | Deny/not found | Sensitive denial eligible | No resource enumeration |
| AC-009 | Internal decision pause | Management | `paused_waiting_internal_decision` | Pause expectation recorded | Tenant/client scoped |

## Edge Cases

- A deliverable has no due dates because it was created before SLA MVP.
- A deliverable has an internal due date after its client/final due date.
- A deliverable enters client waiting when it was already overdue.
- A deliverable returns from client waiting after the original due date.
- A deliverable is paused for an internal decision while not waiting on client action.
- A deliverable is cancelled while paused.
- A deliverable is completed while paused.
- Multiple pause/resume cycles occur on the same deliverable.
- Two actors attempt to change SLA-affecting state at nearly the same time in a future implementation.
- A scoped user tries to view another client's SLA status.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST define SLA statuses at minimum: `on_track`, `at_risk`, `overdue`, `paused_waiting_client`, `paused_waiting_internal_decision`, `completed`, and `cancelled`.
- **FR-002**: SLA-tracked deliverables MUST define due-date boundaries sufficient to evaluate active work, including internal, client-facing, and final due-date meaning where available.
- **FR-003**: SLA status MUST be derived from deliverable state, due-date boundaries, and pause/resume boundaries, not from a manually edited status alone.
- **FR-004**: When a deliverable is waiting for the client, SLA status MUST become `paused_waiting_client`.
- **FR-005**: Time in `paused_waiting_client` MUST NOT be counted against Samawah delay.
- **FR-006**: SLA MUST resume when the client requests changes or the deliverable otherwise returns to a Samawah-owned work state.
- **FR-007**: SLA pause and resume decisions MUST have audit expectations that capture source, actor when applicable, tenant/client scope, deliverable, previous state, new state, reason, and timestamp.
- **FR-008**: Management users MUST be able to see SLA status for deliverables within their allowed tenant/client scope.
- **FR-009**: Unauthorized users MUST NOT be able to view or infer another client's SLA status or deliverable existence.
- **FR-010**: Client-facing surfaces are not expanded by this MVP; if any later client view reuses SLA data, it MUST hide internal audit reasoning and management-only delay details.
- **FR-011**: This feature MUST NOT implement background jobs, production/staging migrations, dependencies, Kanban, files, comments, approvals workflow, hosted migration, production usage, real client data, `RoleKey` changes, or a standalone `project_manager` role.
- **FR-012**: If a future approved workflow uses `paused_waiting_internal_decision`, it MUST remain distinct from `paused_waiting_client`, MUST NOT be attributed as client waiting or client delay, be tenant/client scoped, and carry pause/resume audit expectations.
- **FR-013**: The `at_risk` threshold policy MUST be deterministic, documented, and owner-approved before the threshold is implemented.

### Security And Audit Requirements

- **SR-001**: Every SLA read or future mutation must remain tenant/client scoped.
- **SR-002**: Cross-client SLA access must deny without resource enumeration.
- **SR-003**: Pause/resume audit expectations must be append-only.
- **SR-004**: Client waiting time attribution must be explainable from recorded pause/resume boundaries in a future implementation.
- **SR-005**: Client-facing users must not receive internal SLA reasoning, internal audit details, or management-only delay attribution.

### Key Entities

- **SLA Status**: Business-facing classification for the current SLA state of a deliverable.
- **Due-Date Boundary**: Internal, client-facing, or final due date used to evaluate whether active work is on track, at risk, or overdue.
- **SLA Pause Segment**: Period where SLA is not counted against Samawah, especially `paused_waiting_client`.
- **SLA Resume Boundary**: Point where paused SLA returns to a running Samawah-owned work state.
- **SLA Audit Event Expectation**: Required accountability record for future pause/resume/completion/cancellation decisions.
- **Management SLA Summary**: Scoped management-visible presentation of SLA status without exposing unauthorized client data.

## Included Scope

- SLA status foundation.
- Due-date field meaning and status calculation boundaries.
- `paused_waiting_client`.
- `paused_waiting_internal_decision` as a distinct status expectation only.
- Pause/resume audit expectations.
- Excluding client waiting time from Samawah delay.
- Management-visible SLA status.
- Tenant/client isolation expectations for SLA reads.

## Excluded Scope

- Full persisted SLA engine beyond this MVP foundation.
- Background jobs.
- Production/staging migrations.
- Dependency changes.
- Kanban.
- Files.
- Comments.
- Internal approvals.
- Client approvals.
- Hosted/staging migration.
- Production usage.
- Real client data.
- `RoleKey` changes.
- Adding `project_manager` as a standalone role.
- Social scheduling, billing, advanced analytics, or AI features.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Future reviewers can identify the required SLA status set and due-date boundaries from this Spec Kit package without reading product code.
- **SC-002**: 100% of SLA pause/resume scenarios in this spec state whether time counts against Samawah.
- **SC-003**: `paused_waiting_client` is explicitly required wherever a deliverable waits on client action.
- **SC-004**: Management-visible SLA status is specified without adding client-facing workflow scope.
- **SC-005**: The out-of-scope list blocks background jobs, production/staging migrations, dependencies, hosted migration, production usage, real client data, and non-SLA MVP scope for this PR.
- **SC-006**: Internal decision pause is distinguished from client waiting so future implementation cannot attribute internal waiting to the client.
- **SC-007**: The `at_risk` threshold is implemented only with a deterministic, documented, owner-approved F-003 MVP policy.

## Traceability

| Story | Requirement IDs | Security IDs | Evidence target |
|---|---|---|---|
| US-1 SLA status foundation | FR-001, FR-002, FR-003, FR-012, FR-013 | SR-001, SR-003 | Unit/domain and management summary tests |
| US-2 Client waiting pause/resume | FR-004, FR-005, FR-006, FR-007 | SR-003, SR-004 | Pause/resume timeline and audit expectation tests |
| US-3 Management-visible status | FR-008, FR-009, FR-010 | SR-001, SR-002, SR-005 | Scoped read and visibility tests |
| Scope guard | FR-011 | SR-001 through SR-005 | This SLA MVP implementation PR |

## Assumptions

- F-002 deliverable records and due-date fields are the immediate context for F-003 planning.
- F-002 remains review-ready only until explicit written owner approval changes that gate.
- Any expansion beyond this MVP foundation will require a later owner-approved branch and task breakdown.
- Synthetic local or non-production data will be used for any future validation.
- No hosted/staging migration, production usage, or real client data is allowed by this specification.
