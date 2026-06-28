# Research: Deliverables Core

Date: 2026-06-28

## Decision 1: Scope F-002 As VS-002 + VS-003

**Decision**: F-002 covers client contract/package setup plus deliverable creation with package reservation.

**Rationale**: The roadmap groups contracts, packages, and deliverables into Cycle 2, while the vertical slice map separates them into VS-002 and VS-003. Combining them in one feature spec keeps the commercial context and first deliverable reservation coherent while still allowing tasks to split implementation into sub-slices.

**Alternatives considered**:

- Only contract/package setup: safer and smaller, but would not produce the first operational deliverable object.
- Full deliverable workflow: rejected because Kanban, files, approvals, SLA timeline, and delivery belong to later cycles.

## Decision 2: Ledger Is The Source Of Package Balance

**Decision**: Package balances are derived from append-only ledger entries. F-002 includes commitment, reservation, release, and adjustment entries. Consumption is deferred to delivery.

**Rationale**: The constitution requires ledger-based package accounting. A mutable remaining counter would make reopen, cancellation, and audit explanations unsafe.

**Alternatives considered**:

- Mutable package counters: rejected due audit and correction risk.
- Full financial ledger: rejected as billing/accounting scope.

## Decision 3: Deliverable Creation Reserves But Does Not Consume

**Decision**: Creating a normal package-linked deliverable reserves quantity from a package line. Final consumption happens only after a later delivery workflow.

**Rationale**: Reservation prevents overcommitment while preserving the business rule that a package is consumed only after final delivery.

**Alternatives considered**:

- Consume on creation: rejected because cancelled or never-delivered work would incorrectly reduce client package usage.
- No reservation until delivery: rejected because teams could overcommit capacity before delivery.

## Decision 4: Approved Extras Are Explicit And Do Not Affect Package Balance By Default

**Decision**: Extra deliverables outside package capacity require explicit management approval and audit. They do not reserve or consume package quantity unless later formally linked through amendment/adjustment.

**Rationale**: This avoids silent overage while allowing real-world exceptions.

**Alternatives considered**:

- Allow negative balance: rejected for V1 except through explicit approved overage semantics.
- Block all extras: rejected because Samawah may need management-approved out-of-package work.

## Decision 5: Client Summaries Are Filtered Read Models

**Decision**: Client-visible summaries show safe contract/package/deliverable status and quantities only. Internal ledger reasons, audit entries, tasks, comments, files, and approval details remain hidden.

**Rationale**: AGENTS.md and the constitution prohibit leaking internal content to clients. Summaries must be useful but not expose internal operations.

**Alternatives considered**:

- Show full ledger: rejected due complexity and internal detail leakage.
- Hide all package data from clients: rejected because the roadmap expects client contract/package follow-up.

## Decision 6: Supabase Access Must Use Explicit Grants, RLS, And Server Commands

**Decision**: F-002 implementation must design explicit grants for any exposed tables, enable RLS on exposed tables, and keep sensitive writes behind server-side commands or tightly constrained database functions.

**Rationale**: Supabase announced explicit grants becoming the default for Data API/GraphQL exposure, and the existing F-001B hardening showed the risk of direct Data API writes bypassing audit/revision protections.

**Alternatives considered**:

- Rely on implicit public schema grants: rejected due Supabase platform changes and reviewability.
- Rely on RLS alone for writes: rejected because command-level audit, idempotency, and ledger invariants must be enforced.

## Decision 7: SLA Timeline Is Deferred

**Decision**: F-002 may capture due date fields required for later work, but full SLA timeline segments, pause/resume, at-risk/overdue jobs, and client waiting calculations are deferred.

**Rationale**: Cycle 3/C4 covers SLA behavior. F-002 should not blur the boundary, but deliverables still need dates for later SLA planning.

**Alternatives considered**:

- Start SLA engine during deliverable creation: rejected as scope expansion.
- Omit due dates completely: rejected because deliverable creation needs scheduling context.
