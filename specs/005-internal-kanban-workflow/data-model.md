# Data Model: Internal Kanban Workflow MVP

Date: 2026-07-01

F-004 introduces no new customer-facing entity. It adds a board projection and a status transition operation over existing deliverables.

## Kanban Board

Represents one management board for one client.

Fields:

- `tenant_id`: actor tenant scope.
- `client_id`: requested client scope.
- `columns`: ordered list of active workflow statuses.
- `cards`: deliverable card summaries grouped by status.

Validation:

- `tenant_id` and `client_id` are required for every board query.
- Client roles cannot read this projection.
- Cancelled and archived statuses are existing lifecycle statuses but are outside the active board columns for F-004.

## Kanban Column

Represents one active workflow status.

Statuses:

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

Validation:

- No new status values are introduced.
- Column order is fixed for F-004.

## Kanban Card

Represents a safe deliverable summary on the board.

Fields:

- `id`
- `tenant_id`
- `client_id`
- `name`
- `type`
- `status`
- `priority`
- `owner_user_id`
- `contributor_user_ids`
- `internal_due_date`
- `client_due_date`
- `final_due_date`
- `sla_status` derived from current SLA logic.
- `progress_percentage`
- `requires_internal_approval`
- `requires_client_approval`
- `revision`

Validation:

- Card data must be scoped to the requested tenant/client.
- Card data must not include internal comments, files, approval records, or data from other clients.
- Progress is derived from status, not a manual user-entered percentage.

## Status Transition

Represents one requested lifecycle status change.

Fields:

- `tenant_id`
- `client_id`
- `deliverable_id`
- `from_status`
- `to_status`
- `expected_revision`
- `reason`
- `actor_user_id`
- `idempotency_key`

Validation:

- Actor must be an authorized internal role for the scoped client.
- Deliverable must match `tenant_id`, `client_id`, and `deliverable_id`.
- `expected_revision` must match when supplied.
- `to_status` must be one of the active board statuses.
- Moving to `waiting_client_approval` requires current status `internally_approved`.
- Moving to `delivered` requires current status `client_approved` or `requires_client_approval = false`.
- `progress_percentage` is set from the approved status map.
- Allowed and denied attempts append audit events.

## Audit Event

Existing append-only audit entry for the status transition.

Allowed transition action:

- `DeliverableStatusChanged`

Denied transition action:

- `DeliverableStatusChangeDenied`

Optional SLA action when the derived SLA boundary changes:

- `SLAPaused`
- `SLAResumed`

Validation:

- Audit event includes tenant, client, actor, target deliverable, decision, reason, previous status, and new status where safe.
- Audit append failure rolls back the status change.
