# Feature Specification: Deliverables Core

**Feature Branch**: `002-deliverables-core`

**Created**: 2026-06-28

**Status**: Implementation started for F-002A/F-002 database foundation

**Input**: User request to start the next phase after F-001B merge. Interpreted from the accepted roadmap and Shape Up pitch as Cycle 2: contracts, packages, deliverables, package reservation, and deliverable start.

## Overview

This feature establishes the first operational core after secure onboarding. A Samawah management user can create contract and package context for an existing scoped client, define package lines, create agreed deliverables, and reserve package capacity through an auditable ledger so work can begin without overcommitting a client package.

The feature intentionally stops before execution workflow. It does not implement Kanban, internal comments, files, internal approval, client approval, final delivery, package consumption, full SLA timeline processing, billing, invoicing, or social scheduling.

## Confirmed Decisions For This Specification

- F-001 secure tenant/client onboarding is a prerequisite.
- Every contract, package, package line, deliverable, and ledger entry belongs to one tenant and one client.
- A contract is commercial context and is not an invoice, payment, or accounting record.
- A package records service commitments and quantities; balances are derived from ledger entries, not mutable counters.
- Creating a deliverable linked to a package line reserves capacity; it does not consume capacity.
- Package consumption happens only in a later delivery feature.
- A deliverable starts at `not_started` with progress derived from status.
- SLA date fields may be captured for later SLA work, but SLA pause/resume and overdue processing are outside this feature.
- Client users may see only safe contract, package, and deliverable summaries for their own client scope.
- Internal notes, team tasks, files, approval details, and internal quality information are outside this feature and must not leak to clients.

## User Scenarios & Testing

### User Story 1 - Create Client Contract Context (Priority: P1)

As a tenant administrator or project manager, I want to create a contract record for an existing scoped client so that packages and deliverables have an auditable commercial context before work starts.

**Why this priority**: Deliverables cannot be safely created or counted without a tenant/client-scoped agreement context.

**Independent Test**: Can be tested by signing in as an authorized management user, creating a contract for Client A, verifying it appears only within Client A/Samawah scope, and verifying a creation audit event.

**Acceptance Scenarios**:

1. **Given** an active authorized management user in Samawah tenant and Client A exists, **When** they create a contract for Client A with required identity, period, and status fields, **Then** the contract is created under Client A and an audit event records actor, tenant, client, target contract, action, decision, and timestamp.
2. **Given** a user assigned only to Client A, **When** they attempt to create a contract for Client B, **Then** the action is denied without revealing Client B details and no contract is created.
3. **Given** a client user for Client A, **When** they view contract context, **Then** they see only safe Client A contract summary fields and no internal management metadata.

---

### User Story 2 - Define Package Commitments (Priority: P1)

As a tenant administrator or project manager, I want to define package lines under a client contract so that agreed quantities such as posts, reels, reports, and plans can be tracked before deliverables are created.

**Why this priority**: Package lines are the source of available capacity and prevent silent overcommitment.

**Independent Test**: Can be tested by creating package lines for Client A, viewing a derived balance summary, and verifying Client B users cannot see or alter them.

**Acceptance Scenarios**:

1. **Given** a Client A contract exists, **When** an authorized management user adds package lines with unit labels and committed quantities, **Then** the package records each commitment and creates auditable commitment ledger entries.
2. **Given** a package line quantity is changed after creation, **When** the change is allowed by management policy, **Then** the system records an explicit adjustment or amendment event and does not rewrite historical ledger entries.
3. **Given** a client user for Client A, **When** they view package progress, **Then** they see committed, reserved, delivered/consumed, and remaining summaries only for Client A, with no internal adjustment notes.

---

### User Story 3 - Create Agreed Deliverables (Priority: P1)

As a project manager or account manager, I want to create agreed deliverables linked to a client package line so that Samawah can start work from a scoped, counted commitment.

**Why this priority**: The deliverable is the central V1 work object; creating it safely unlocks later Kanban, files, approvals, SLA, and dashboards.

**Independent Test**: Can be tested by creating a deliverable for Client A from an available package line, verifying status/progress, verifying the reservation ledger entry, and verifying Client B cannot see it.

**Acceptance Scenarios**:

1. **Given** Client A has an active contract and package line with available capacity, **When** an authorized user creates one deliverable linked to that package line, **Then** the deliverable is created with Client A scope, initial status `not_started`, progress `0%`, required due dates/ownership fields, and an auditable package reservation.
2. **Given** no package capacity remains for the selected line, **When** an authorized user attempts to create a normal in-package deliverable, **Then** creation is denied with a safe message unless an approved extra-deliverable path is used.
3. **Given** a deliverable is created outside the package with explicit management approval, **When** it is saved, **Then** it is marked as an approved extra deliverable and does not consume or reserve package quantity unless later formally linked.
4. **Given** a client user for Client A, **When** they view deliverable summaries, **Then** they see only safe Client A deliverable summary fields and no internal tasks, comments, files, or approval notes.

---

### User Story 4 - Release Reservations Before Work Progresses (Priority: P2)

As a project manager, I want to cancel or replace a not-started deliverable before execution so that reserved package capacity returns through an auditable ledger entry instead of manual balance edits.

**Why this priority**: Reservation release is required to keep package balances trustworthy before later delivery and consumption features exist.

**Independent Test**: Can be tested by creating a reserved deliverable, cancelling it while it is still eligible for cancellation, and verifying the reservation release and audit trail.

**Acceptance Scenarios**:

1. **Given** a reserved deliverable is still `not_started`, **When** an authorized user cancels it with a reason, **Then** the deliverable becomes cancelled and a reservation release ledger entry restores available capacity.
2. **Given** a deliverable has progressed beyond the allowed cancellation state, **When** a user attempts to release its reservation through this feature, **Then** the action is denied and the user is directed to a later change-control workflow.
3. **Given** the same cancellation request is retried, **When** the original cancellation already succeeded, **Then** the retry does not create duplicate release or audit entries.

---

### User Story 5 - Maintain Scope-Safe Summaries (Priority: P3)

As management and client users, I want safe summaries of contracts, packages, balances, and deliverables so each role understands status without seeing unauthorized or internal information.

**Why this priority**: Summaries make the feature usable while protecting the trust boundary established in F-001.

**Independent Test**: Can be tested by comparing management and client views for Client A and verifying cross-client and internal-field denial.

**Acceptance Scenarios**:

1. **Given** an authorized management user has access to Client A and Client B, **When** they view commercial and deliverable summaries, **Then** each client summary is separated by client scope.
2. **Given** a client user for Client A, **When** they view summaries, **Then** they never see Client B, internal notes, ledger reasons marked internal, team assignments beyond safe owner labels, or management-only actions.
3. **Given** any scoped user opens a valid unauthorized contract, package, ledger, or deliverable identifier, **When** access is denied, **Then** the response does not reveal whether the resource exists.

## Acceptance Scenario Matrix

| ID | Scenario | Actor | Scope | Expected Decision | Audit / Ledger Expectation | Security Requirement |
|---|---|---|---|---|---|---|
| AC-001 | Create Client A contract | Tenant admin / PM | Tenant + Client A | Allow | `ContractCreated` audit | Tenant/client scope required |
| AC-002 | Create Client B contract from Client A-only scope | Assigned user | Client A only | Deny | Sensitive denial audit eligible | No Client B leakage |
| AC-003 | Add package commitments | Tenant admin / PM | Client A contract | Allow | Commitment ledger entries | Append-only ledger |
| AC-004 | Adjust package commitment | Tenant admin / PM | Client A package | Allow with reason | Adjustment/amendment ledger entry | No historical rewrite |
| AC-005 | Create in-package deliverable | PM / AM | Client A package line | Allow | Reservation ledger entry + audit | Capacity and scope checks |
| AC-006 | Create deliverable with no capacity | PM / AM | Client A package line | Deny unless approved extra | Denial or approved-extra audit | No silent overcommit |
| AC-007 | Client views summary | Client user | Client A | Allow safe read | No internal audit visible | No internal field leakage |
| AC-008 | Cross-client summary access | Client/Internal scoped user | Unauthorized client | Deny/not found | Sensitive denial audit eligible | No resource enumeration |
| AC-009 | Cancel not-started reserved deliverable | PM / AM | Client A deliverable | Allow with reason | Reservation release + cancellation audit | Idempotent correction |
| AC-010 | Cancel progressed deliverable through this feature | PM / AM | Client A deliverable | Deny | Denial audit eligible | Later workflow required |

## Edge Cases

- A client has no active contract yet.
- A client has more than one active contract for clearly separate service streams.
- A package line has zero remaining capacity.
- Two users attempt to reserve the final available unit at the same time.
- A package line unit label differs from a deliverable type label.
- A deliverable is created as an approved extra outside the package.
- A package adjustment would reduce committed capacity below existing reservations.
- A cancellation request is retried after a successful reservation release.
- A client user opens a valid deliverable identifier from another client.
- A management user loses client scope after creating a contract or deliverable.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow authorized tenant management roles to create contracts for clients within their active tenant/client scope.
- **FR-002**: The system MUST deny contract creation when the actor lacks scope or permission, without revealing unauthorized client details.
- **FR-003**: The system MUST support contract states at minimum: draft, active, completed, cancelled, archived.
- **FR-004**: The system MUST allow authorized users to define packages and package lines under a client contract.
- **FR-005**: Each package line MUST define a service label, unit, committed quantity, and period or applicability context.
- **FR-006**: Package balance MUST be derived from append-only ledger entries rather than a manually edited remaining counter.
- **FR-007**: Creating or adjusting package commitments MUST create auditable ledger entries with actor, scope, target, reason when required, and timestamp.
- **FR-008**: The system MUST allow authorized users to create deliverables for a scoped client and active contract/package context.
- **FR-009**: Each deliverable MUST include at minimum client scope, name, description, type, status, priority, owner, contributors when available, due dates, approval flags, current package allocation, created actor, and timestamps.
- **FR-010**: A newly created deliverable MUST start as `not_started` and derive progress as `0%`.
- **FR-011**: Creating a normal in-package deliverable MUST reserve exactly the required quantity from the selected package line when capacity is available.
- **FR-012**: The system MUST deny normal in-package deliverable creation when available capacity is insufficient.
- **FR-013**: The system MUST support an approved extra-deliverable path that records management approval and does not silently consume package capacity.
- **FR-014**: Cancelling an eligible not-started deliverable MUST release its reservation through a ledger entry and record an audit event.
- **FR-015**: The system MUST prevent duplicate reservation, release, adjustment, and deliverable creation side effects when a sensitive command is retried.
- **FR-016**: Client users MUST only see safe contract, package, balance, and deliverable summaries for their own client scope.
- **FR-017**: Internal-only fields, ledger reasons marked internal, team task details, files, comments, approval decisions, and draft notes MUST NOT appear in client summaries.
- **FR-018**: Direct access to unauthorized contract, package, ledger, or deliverable identifiers MUST be denied without disclosing resource existence.
- **FR-019**: Every sensitive state change in this feature MUST create an audit event, including contract creation, package creation, commitment adjustment, deliverable creation, reservation, release, cancellation, approved extra creation, and sensitive denial.
- **FR-020**: This feature MUST NOT implement final delivery, package consumption on delivery, Kanban, task execution, file uploads, comments, internal approval, client approval, full SLA pause/resume, billing, invoicing, social scheduling, or production data migration.

### Permission Coverage

| Permission ID | Required in this feature | Roles allowed in this feature | Scope rule |
|---|---|---|---|
| `PERM.CONTRACT.CREATE` | Create client contract context | `tenant_owner`, `tenant_administrator`, `project_manager` | Tenant + client scope |
| `PERM.CONTRACT.VIEW` | View contract summaries | management roles, assigned internal roles, scoped client roles | Own allowed client scope only |
| `PERM.PACKAGE.CREATE` | Create package and package lines | `tenant_owner`, `tenant_administrator`, `project_manager` | Contract client scope |
| `PERM.PACKAGE.ADJUST` | Add amendment/adjustment entries | `tenant_owner`, `tenant_administrator`, `project_manager` | Reason required |
| `PERM.DELIVERABLE.CREATE` | Create agreed deliverable | `tenant_owner`, `tenant_administrator`, `project_manager`, `account_manager` | Client/package scope |
| `PERM.DELIVERABLE.EXTRA_CREATE` | Create approved extra deliverable | `tenant_owner`, `tenant_administrator`, `project_manager` | Explicit reason/approval required |
| `PERM.DELIVERABLE.CANCEL_NOT_STARTED` | Cancel eligible not-started deliverable | `tenant_owner`, `tenant_administrator`, `project_manager`, `account_manager` | Client scope + eligible status |
| `PERM.LEDGER.VIEW_SUMMARY` | View balance summaries | management roles, assigned internal roles, scoped client roles | Filtered by client visibility |

### Security Requirements

- **SR-001**: Tenant and client scope MUST be derived from active membership, assigned scope, and target ownership, not trusted from browser-supplied identifiers alone.
- **SR-002**: Cross-client contract, package, ledger, and deliverable reads and commands MUST be denied without data leakage.
- **SR-003**: Ledger entries MUST be append-only; corrections must be explicit reversal, release, amendment, or adjustment events.
- **SR-004**: Client users MUST NOT read internal audit events, internal ledger reasons, internal notes, or management-only actions.
- **SR-005**: Over-capacity deliverable creation MUST fail closed unless an explicitly authorized extra-deliverable path is used.
- **SR-006**: Sensitive commands MUST be idempotent and safe under retry.
- **SR-007**: User-facing errors MUST not expose raw technical details, stack traces, tenant identifiers, client names outside scope, or package internals outside scope.

### UX Requirements

- **UX-001**: Management users need Arabic RTL forms for contract, package, package line, and deliverable creation.
- **UX-002**: Package balance summaries must distinguish committed, reserved, consumed/delivered, released, adjusted, and available values in plain language.
- **UX-003**: Deliverable creation must make the selected client, contract, package line, due dates, owner, approval requirements, and reservation impact understandable before save.
- **UX-004**: Insufficient capacity must explain the safe next actions: choose another package line, create approved extra, adjust package, or cancel.
- **UX-005**: Client summaries must be simple and avoid internal terms, internal ledger details, team workflow details, and management-only actions.
- **UX-006**: Forms, summaries, validation messages, and denial states must support keyboard use, visible focus, mobile-safe layout, and Arabic RTL.

### Non-Functional Requirements

- **NFR-001 Security**: 100% of contract/package/deliverable commands must have explicit allow/deny rules and audit expectations.
- **NFR-002 Tenant and Client Isolation**: Cross-client and cross-tenant reads/commands must be denied in automated tests.
- **NFR-003 Auditability**: A management reviewer must be able to explain package balance and deliverable reservation history from audit/ledger evidence.
- **NFR-004 Reliability**: Retried reservation, release, adjustment, and approved-extra commands must not duplicate side effects.
- **NFR-005 Performance**: Management users should see ordinary contract/package/deliverable lists and summaries within a responsive interaction threshold under pilot-scale data.
- **NFR-006 Accessibility and RTL**: Critical management and client summary flows must meet Arabic RTL, keyboard, focus, and mobile planning expectations.
- **NFR-007 Privacy**: Client-facing summaries must not expose internal comments, files, approval state details beyond safe progress, audit internals, or other-client existence.

### Key Entities

- **Contract**: Agreement context for one client in one tenant. Tracks identity, period, status, and safe summary fields.
- **Contract Version / Amendment**: Historical record of contract changes or quantity adjustments. Does not rewrite prior commitments.
- **Package**: Group of service commitments under a contract or period.
- **Package Line**: Quantified service commitment such as posts, reels, reports, plans, designs, or videos.
- **Package Ledger Entry**: Append-only event representing commitment added, quantity reserved, reservation released, adjustment, amendment, or later consumption.
- **Deliverable**: Agreed output for a client, linked to contract/package context or marked as approved extra.
- **Deliverable Allocation**: Link between a deliverable and package line, including reserved quantity and state.
- **Audit Event**: Accountability record for sensitive commands and sensitive denials.

## Included Scope

- Contract creation and safe summaries.
- Package and package line creation.
- Commitment, reservation, release, amendment, and adjustment ledger concepts needed for this feature.
- Deliverable creation with initial status/progress and package reservation.
- Approved extra-deliverable creation path.
- Not-started deliverable cancellation and reservation release.
- Management and client-safe read summaries.
- Tenant/client isolation, audit expectations, idempotency, Arabic RTL, and mobile-safe summary requirements.

## Excluded Scope

- Billing, invoices, payment collection, accounting exports, tax/VAT workflows.
- Final delivery and package consumption on delivery.
- Full SLA timeline, pause/resume, overdue jobs, escalation jobs, and client-waiting calculations.
- Internal tasks, Kanban board, drag/drop, workflow transitions beyond initial/cancelled states.
- Files, versions, comments, internal review, internal approval, client submission, client approval.
- Deliverable template marketplace or advanced automation.
- Social scheduling, publishing, AI generation, WhatsApp automation, advanced analytics.
- Production Supabase usage or real client data.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authorized management user can create a Client A contract, package, package line, and one reserved deliverable without leaving the Cycle 2 scope.
- **SC-002**: 100% of package balance changes in this feature are explainable from ledger entries rather than mutable remaining counters.
- **SC-003**: Cross-client attempts for contracts, packages, ledger summaries, and deliverables are denied in automated verification without leaking resource names or existence.
- **SC-004**: Client-facing summaries show only safe Client A contract/package/deliverable information and hide all internal-only details.
- **SC-005**: Insufficient-capacity attempts are denied safely unless the approved extra-deliverable path is explicitly used.
- **SC-006**: Retrying create/reserve/release operations does not create duplicate deliverables or duplicate ledger entries.
- **SC-007**: No acceptance scenario requires Kanban, files, comments, SLA timeline processing, internal approval, client approval, delivery, billing, or social scheduling.

## Traceability

| Story | Requirement IDs | Permission IDs | Domain invariant | Security IDs | Evidence target |
|---|---|---|---|---|---|
| US-1 Contract context | FR-001, FR-002, FR-003, FR-016, FR-019 | `PERM.CONTRACT.CREATE`, `PERM.CONTRACT.VIEW` | Contract belongs to one tenant/client | SR-001, SR-002, SR-007 | Integration + E2E |
| US-2 Package commitments | FR-004, FR-005, FR-006, FR-007, FR-016 | `PERM.PACKAGE.CREATE`, `PERM.PACKAGE.ADJUST`, `PERM.LEDGER.VIEW_SUMMARY` | Balance from ledger only | SR-003, SR-004 | Domain + RLS |
| US-3 Deliverable creation | FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-019 | `PERM.DELIVERABLE.CREATE`, `PERM.DELIVERABLE.EXTRA_CREATE` | Reservation before work; no overcommit | SR-001, SR-005, SR-006 | Domain + integration + E2E |
| US-4 Reservation release | FR-014, FR-015, FR-019 | `PERM.DELIVERABLE.CANCEL_NOT_STARTED` | Release through ledger, not counter edit | SR-003, SR-006 | Domain + integration |
| US-5 Safe summaries | FR-016, FR-017, FR-018 | `PERM.CONTRACT.VIEW`, `PERM.LEDGER.VIEW_SUMMARY` | Client sees own safe summaries only | SR-002, SR-004, SR-007 | E2E/mobile |

## Assumptions

- F-001 onboarding, role/scope resolution, audit foundation, and client management are available.
- Samawah remains the initial tenant.
- A client may have more than one active contract only when service streams are clearly separated; otherwise users should choose a primary active contract.
- Services that are not naturally quantity-based may be represented as package lines with quantity `1` or as non-quantity commitments in planning, but advanced milestone tracking is deferred.
- Client users see simplified status and quantity summaries, not commercial pricing, invoices, internal ledger reasons, or management audit details.
- Package consumption on final delivery is intentionally deferred to a later delivery feature.
