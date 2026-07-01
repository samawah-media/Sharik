# Feature Specification: Internal Kanban Workflow MVP

**Feature Branch**: `codex/f-004-internal-kanban-workflow`

**Created**: 2026-07-01

**Status**: Draft - Spec Kit before implementation

**Input**: Build the first internal Kanban workflow MVP for existing deliverables. Scope is status-driven operations only: no files, comments, approvals workflow, social scheduling, AI, Production Supabase, real client data, RoleKey changes, or new dependencies unless separately approved.

## User Scenarios & Testing

### User Story 1 - View Client Deliverables Board (Priority: P1)

As an authorized internal management user, I want to open a client-scoped board for existing deliverables so that I can understand work distribution by lifecycle status without seeing another client's data.

**Why this priority**: The board has no value until it safely displays the existing deliverables by status while preserving tenant/client isolation.

**Independent Test**: With synthetic Client Alpha and Client Beta deliverables, an authorized internal user opens Client Alpha's board and sees only Client Alpha cards grouped into the approved active workflow columns.

**Acceptance Scenarios**:

1. **Given** an authorized internal user has access to Client Alpha, **When** they open `/clients/client_alpha/deliverables/board`, **Then** the page shows the ten active workflow columns and only Client Alpha deliverables.
2. **Given** a deliverable has owner, contributor, due date, SLA, and progress fields, **When** it appears as a board card, **Then** the card shows name, type, priority, owner/contributors when available, internal/client/final due dates, derived SLA status, and progress percentage.
3. **Given** a client viewer or unauthorized user opens the board route, **When** authorization is evaluated, **Then** the board is not shown and no internal statuses or other client data are exposed.

---

### User Story 2 - Change Deliverable Status Safely (Priority: P1)

As an authorized internal operator, I want to move a deliverable to another allowed lifecycle status from the board so that work progress can be updated with audit and SLA behavior.

**Why this priority**: The board must do real operational work, but status changes are sensitive and must be server-side, scoped, audited, and rule-bound.

**Independent Test**: An authorized account manager changes a Client Alpha deliverable from `not_started` to `in_progress`; the system updates progress to 30%, records an audit event, and keeps Client Beta data inaccessible.

**Acceptance Scenarios**:

1. **Given** an authorized internal user selects a new allowed status, **When** the server command succeeds, **Then** the deliverable status, progress percentage, revision, updated timestamp, derived SLA status, and audit log are updated consistently.
2. **Given** a user attempts to move a deliverable to `waiting_client_approval` before `internally_approved`, **When** the server command validates the transition, **Then** the command is denied and an audit denial event is recorded.
3. **Given** a user attempts to move a deliverable to `delivered`, **When** the deliverable is not `client_approved` and still requires client approval, **Then** the command is denied and no deliverable data is changed.

---

### User Story 3 - Discover Board From Existing Client Pages (Priority: P2)

As an authorized internal user, I want clear links to the board from client and deliverable pages so that the workflow view is easy to reach during daily operations.

**Why this priority**: The board must fit the existing management navigation without creating a separate app surface or exposing it to client roles.

**Independent Test**: From `/clients`, `/clients/[clientId]`, and `/clients/[clientId]/deliverables`, an authorized internal user sees a board link for the scoped client; a client viewer does not see a management board link.

**Acceptance Scenarios**:

1. **Given** an authorized internal user opens `/clients`, **When** client cards render, **Then** each accessible client card includes a clear link to the board.
2. **Given** an authorized internal user opens `/clients/[clientId]`, **When** the client workspace links render, **Then** the board is available alongside deliverables, contracts, and commercial summary.
3. **Given** an authorized internal user opens `/clients/[clientId]/deliverables`, **When** the page header renders, **Then** a board link is available without removing existing deliverable creation/list workflows.

## Edge Cases

- A client has no active board deliverables.
- A deliverable is `cancelled` or `archived`, which are existing statuses but not active board columns in this MVP.
- A deliverable is moved with a stale expected revision.
- A deliverable requires internal approval but the target status would expose it to the client.
- A deliverable requires client approval but the target status is `delivered` before client approval.
- A user has tenant access but not the requested client scope.
- A client role attempts direct route access to the board or status command.
- A status change would pause or resume SLA waiting-client behavior.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST use a new Spec Kit package at `specs/005-internal-kanban-workflow/` before code changes.
- **FR-002**: The board route MUST be `/clients/[clientId]/deliverables/board` because it extends the existing client deliverables surface.
- **FR-003**: The board MUST display these active workflow columns only: `not_started`, `in_progress`, `ready_for_internal_review`, `internal_changes_requested`, `internally_approved`, `waiting_client_approval`, `client_changes_requested`, `client_approved`, `ready_for_delivery`, `delivered`.
- **FR-004**: The board MUST use existing deliverable statuses and MUST NOT introduce a new lifecycle status.
- **FR-005**: Each card MUST show name, type, priority, owner/contributors when available, internal due date, client due date, final due date, derived SLA status, and progress percentage.
- **FR-006**: F-004 MUST use a simple status select/action control for the MVP because `@dnd-kit` is not installed; drag/drop remains deferred unless a future ADR/dependency update approves it.
- **FR-007**: Any status change MUST run server-side and validate actor permission, tenant scope, client scope, deliverable identity, expected current status/revision, and transition rules.
- **FR-008**: Any status change MUST derive `progress_percentage` from the target status using the approved status map.
- **FR-009**: Any status change MUST append an audit event for allowed transitions and denial attempts.
- **FR-010**: The system MUST deny moving to `waiting_client_approval` unless the deliverable is already `internally_approved`.
- **FR-011**: The system MUST deny moving to `delivered` unless the deliverable is `client_approved` or does not require client approval.
- **FR-012**: SLA behavior MUST remain consistent: `waiting_client_approval` derives `paused_waiting_client`, client change requests resume Samawah-owned time, and delivered derives completed.
- **FR-013**: Client roles MUST NOT see the internal board route, board links, or management-only deliverable cards.
- **FR-014**: The feature MUST add clear board links from `/clients`, `/clients/[clientId]`, and `/clients/[clientId]/deliverables` for authorized internal users.
- **FR-015**: The feature MUST NOT add files, comments, approval workflow, AI, social scheduling, Production Supabase, real client data, `RoleKey` changes, or standalone `project_manager`.

### Key Entities

- **Kanban Board**: A client-scoped management view grouping existing deliverables by active lifecycle status.
- **Kanban Column**: One active workflow status shown on the board.
- **Kanban Card**: A safe, scoped summary of an existing deliverable plus derived SLA display.
- **Status Transition**: A server-side operation changing one deliverable from one lifecycle status to another.
- **Audit Event**: Append-only record for allowed or denied status transition attempts.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of board queries include tenant and client scope.
- **SC-002**: 100% of successful status changes produce the expected progress percentage for the target status.
- **SC-003**: 100% of denied status changes leave the deliverable unchanged and record an audit denial.
- **SC-004**: Client viewer tests confirm the board route and links are absent or denied without exposing internal board data.
- **SC-005**: The full requested verification suite passes before PR creation or any failure is documented as a blocker.

## Assumptions

- Existing auth, runtime context, RLS, deliverable list, audit, and SLA modules are reused.
- F-004 may add a narrow migration/RPC for audited status updates if the existing database write surface cannot support the command safely.
- `sla_status` is derived for display from existing SLA logic; F-004 does not add a persisted SLA segment table.
- Cancelled and archived deliverables remain existing lifecycle states but are not active board columns in this MVP.
- Client-facing approval UX remains out of scope; status changes are internal management operations only.
