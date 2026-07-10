# Data Model: R-007 V1 Owner Pilot Expansion and Acceptance-to-Production Readiness

This file describes the business entities and state relationships R-007 must preserve or introduce during implementation. Exact database columns and migration details must be confirmed during task execution and reviewed against existing schema before code.

## Pilot Scope

Represents the approved boundary for a pilot or readiness step.

**Key attributes**:

- Scope identifier
- Approved customer/data boundary
- Approved environment boundary
- Allowed roles/personas
- Allowed workflow surfaces
- Explicit exclusions
- Owner decision reference
- Start/end or review dates
- Status: `draft`, `owner_review`, `approved_internal_pilot`, `blocked`, `completed`

**Rules**:

- R-006 Hadna-only internal UAT is the baseline.
- Non-Hadna customer data requires a new owner decision.
- Hosted database mutation requires a new owner decision and task-level scope.
- Production acceptance is never inferred from pilot readiness.

## Readiness Gate

Represents a checkpoint that must pass before broader pilot or production-candidate review.

**Key attributes**:

- Gate area: deliverables, SLA, approvals, files, permissions, audit logs, client portal, release evidence
- Required scenarios
- Evidence owner
- Evidence path
- Status: `not_started`, `in_progress`, `passed`, `failed`, `blocked`, `accepted_with_risk`
- Residual risk
- Required next decision

**Rules**:

- A failed security, isolation, permission, approval, file visibility, or audit gate blocks production-candidate readiness.
- A gate may be accepted with risk only when the owner explicitly accepts the risk and the scope remains internal pilot.

## Deliverable

Represents the agreed marketing output managed through V1.

**Key attributes**:

- Tenant/client scope
- Contract/package scope
- Name and type
- Status
- Priority
- Owner and contributors
- Internal due date, client due date, final due date
- SLA status
- Progress percentage
- Approval requirements
- Current version reference
- Closed date

**State expectations**:

- `not_started`
- `in_progress`
- `ready_for_internal_review`
- `internal_changes_requested`
- `internally_approved`
- `waiting_client_approval`
- `client_changes_requested`
- `client_approved`
- `ready_for_delivery`
- `delivered`
- `cancelled`
- `archived`

## Deliverable Version

Represents the exact draft or final version attached to review and approval.

**Key attributes**:

- Tenant/client scope
- Deliverable reference
- Version number
- Visibility status
- Submitted by
- Submitted at
- Internal approval state
- Client approval state
- Superseded state

**Rules**:

- Client approval must bind to a specific version.
- Superseded versions cannot receive new approval decisions.
- Client-visible versions require internal approval unless a documented owner-approved exception exists.

## SLA Timeline Segment

Represents one interval in the SLA timeline.

**Key attributes**:

- Tenant/client scope
- Deliverable reference
- Segment type: `running`, `paused_waiting_client`, `paused_waiting_internal_decision`, `completed`, `cancelled`
- Start time
- End time
- Actor or system source
- Reason

**Rules**:

- Waiting for client pauses Samawah SLA.
- Client change request resumes team-owned SLA.
- Pause/resume must have audit evidence.

## Approval Decision

Represents internal or client review outcome.

**Key attributes**:

- Tenant/client scope
- Deliverable reference
- Deliverable version reference
- Approval type: `internal` or `client`
- Decision: `approved`, `changes_requested`, `rejected`, `cancelled`
- Actor
- Decision time
- Comment reference
- Audit event reference

**Rules**:

- Internal approval is required before client exposure by default.
- Client viewers cannot approve.
- Client approvers can only approve assigned visible deliverables.

## File Asset

Represents files attached to a client, contract, deliverable, report, or final delivery.

**Key attributes**:

- Tenant/client scope
- Owner user
- Related deliverable or contract
- Visibility: `internal_only`, `client_visible`, `client_uploaded`, `final_delivery`, `contract_file`, `report_file`, `brand_asset`
- File type and size
- Storage path
- Version number
- Final flag
- Created date

**Rules**:

- Internal files never appear to clients.
- Final delivery files require management-approved visibility.
- Download/view authorization must respect tenant/client scope.

## Comment

Represents discussion or system notes attached to deliverables, files, approvals, or workflow states.

**Key attributes**:

- Tenant/client scope
- Related entity
- Comment type: `internal_comment`, `client_comment`, `system_comment`, `approval_comment`
- Author
- Visibility
- Created date

**Rules**:

- Internal comments are hidden from client users.
- Client comments are visible only to authorized Samawah team and authorized client users.
- Approval comments appear only according to approval visibility.

## Audit Event

Represents append-only evidence for sensitive workflow actions.

**Key attributes**:

- Tenant/client scope
- Actor
- Event type
- Entity type and identifier
- Before/after summary where safe
- Reason
- Created date

**Rules**:

- Audit is append-only.
- Approval, rejection, change request, delivery, file visibility change, SLA pause/resume, package-affecting change, and security denial require audit evidence.
- Evidence summaries must not print sensitive row content, credentials, captions, links, or deliverable titles.

## Client Portal View

Represents what the client can see and do.

**Key attributes**:

- Client scope
- Viewer role
- Visible deliverables
- Waiting approval items
- Package progress
- Client-visible files
- Allowed actions
- Safe denial or no-assigned-client state

**Rules**:

- Client users see only their allowed client scope.
- Management navigation and internal workflow details are hidden.
- Critical client actions must work on mobile and RTL.
