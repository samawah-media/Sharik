# Data Model: Deliverables Core

Date: 2026-06-28

## Scope Rules

- Every entity in this feature is tenant-scoped.
- Every business entity in this feature is client-scoped.
- Client users see only safe summaries for their own client.
- Management/internal users see records only through active membership, role, and client scope.
- Ledger and audit records are append-only.

## Entity: Contract

- Purpose: agreement context for one client inside one tenant.
- Fields conceptually: id, tenant_id, client_id, name/reference, period_start, period_end, status, summary, created_by, created_at, updated_at, archived_at.
- Required fields: tenant_id, client_id, name/reference, status, created_by.
- States: draft, active, completed, cancelled, archived.
- Relationships: belongs to client; owns contract versions/amendments and packages.
- Validation: contract client must belong to actor tenant; archived/cancelled contracts cannot receive new normal deliverables.
- Audit: create, status change, archive/cancel.

## Entity: Contract Version / Amendment

- Purpose: preserves historical changes to commercial context or quantities.
- Fields conceptually: id, tenant_id, client_id, contract_id, version_number, change_type, effective_at, reason, created_by, created_at.
- Relationships: belongs to contract; may reference package/line adjustment.
- Validation: no silent rewrite of historical commitments.
- Audit: amendment/adjustment creation.

## Entity: Package

- Purpose: group of service commitments under a contract or period.
- Fields conceptually: id, tenant_id, client_id, contract_id, name, period_start, period_end, status, created_by, created_at, updated_at.
- States: draft, active, completed, cancelled, archived.
- Relationships: belongs to contract; owns package lines.
- Validation: package contract must belong to same tenant/client.
- Audit: create, status change.

## Entity: Package Line

- Purpose: quantified commitment such as posts, reels, designs, reports, or plans.
- Fields conceptually: id, tenant_id, client_id, package_id, service_label, deliverable_type_hint, unit_label, committed_quantity, status, created_by, created_at, updated_at.
- Required fields: package_id, service_label, unit_label, committed_quantity.
- Relationships: belongs to package; referenced by deliverable allocations and ledger entries.
- Validation: committed_quantity cannot be negative; unit conversions are not implicit in V1.
- Audit/Ledger: creates commitment ledger entry.

## Entity: Package Ledger Entry

- Purpose: append-only source of package balance.
- Fields conceptually: id, tenant_id, client_id, contract_id, package_id, package_line_id, deliverable_id optional, entry_type, quantity, reason, actor_user_id, idempotency_key, occurred_at.
- Entry types in F-002: commitment_added, quantity_reserved, reservation_released, administrative_adjustment, contract_amendment.
- Future entry types: quantity_consumed, consumption_reversed, carry_forward, expiration.
- Validation: entries are append-only; correction requires a new reversing or adjustment entry.
- Balance projection: available = committed - reserved - consumed + released +/- adjustments.
- Client visibility: summarized quantities only; internal reasons hidden.

## Entity: Deliverable

- Purpose: agreed output that can later move through execution, review, approval, SLA, files, and delivery workflows.
- Fields conceptually: id, tenant_id, client_id, contract_id optional, package_id optional, package_line_id optional, name, description, type, status, priority, owner_user_id, contributor_user_ids, start_date, internal_due_date, client_due_date, final_due_date, requires_internal_approval, requires_client_approval, progress_percentage, approved_extra, extra_reason, created_by, created_at, updated_at, cancelled_at.
- Initial status: not_started.
- Initial progress: 0%.
- Relationships: belongs to client; may allocate to package line; may later own versions, tasks, files, comments, approvals, SLA timeline.
- Validation: normal deliverable requires available package capacity; approved extra requires management approval/reason.
- Audit: create, approved extra create, cancel.

## Entity: Deliverable Allocation

- Purpose: links a deliverable to a package line and reservation.
- Fields conceptually: id, tenant_id, client_id, deliverable_id, package_line_id, reserved_quantity, status, reservation_ledger_entry_id, release_ledger_entry_id optional, created_at, released_at.
- States: reserved, released, consumed_later, cancelled.
- Validation: one active reservation allocation per normal deliverable/package line pair unless future policy allows multiple lines.
- Audit/Ledger: reservation on create; release on eligible cancellation.

## Entity: Audit Event

- Purpose: records actor, decision, scope, and target for sensitive actions and denials.
- Fields conceptually: existing F-001 audit fields plus target types for contract, package, package_line, deliverable, ledger_entry, allocation.
- Requirements: append-only; safe summaries only; client users do not read internal audit in F-002.

## State Transitions

### Contract

```text
draft -> active -> completed
draft -> cancelled
active -> cancelled
active/completed/cancelled -> archived
```

### Package

```text
draft -> active -> completed
draft -> cancelled
active -> cancelled
active/completed/cancelled -> archived
```

### Deliverable In F-002

```text
not_started -> cancelled
not_started -> in_progress (reserved for later execution feature; not implemented here)
```

F-002 creates deliverables as `not_started`. It may cancel eligible not-started deliverables. Later features own execution transitions.

## Derived Balance Rules

| Projection | Rule |
|---|---|
| committed | Sum commitment_added + contract_amendment quantities |
| reserved | Sum active quantity_reserved minus reservation_released |
| consumed | Future delivery feature only |
| available | committed - active reserved - consumed + released +/- adjustments |

## Invariants

- No contract/package/deliverable can reference a client in another tenant.
- No deliverable can reserve from a package line belonging to another client.
- No normal deliverable reservation may make available capacity negative.
- Approved extras do not reserve package capacity by default.
- Ledger entries are never updated or deleted.
- Audit events are never updated or deleted.
- Client summaries never include internal ledger reasons, internal audit, files, comments, or approval internals.
