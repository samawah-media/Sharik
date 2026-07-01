# Contract: Internal Kanban Workflow MVP

Date: 2026-07-01

This contract defines the board view and status transition behavior. It is intentionally internal-management only.

## Route Contract

### `GET /clients/[clientId]/deliverables/board`

Actor:

- Allowed: authorized internal management users with scoped access to the client.
- Denied: client roles, inactive memberships, users without client scope, unauthenticated users.

Response:

- Renders ten active workflow columns.
- Renders existing deliverables scoped to the requested tenant/client.
- Shows safe card fields only.
- Does not render comments, files, approval workflow, or other client data.

Errors:

- Auth required or expired session: safe sign-in/session state.
- Unauthorized client scope: access denied or not found without resource enumeration.
- Data read failure: safe denied/unavailable state.

## Command Contract

### `updateDeliverableStatusCommand`

Input:

```ts
{
  clientId: string;
  deliverableId: string;
  toStatus:
    | "not_started"
    | "in_progress"
    | "ready_for_internal_review"
    | "internal_changes_requested"
    | "internally_approved"
    | "waiting_client_approval"
    | "client_changes_requested"
    | "client_approved"
    | "ready_for_delivery"
    | "delivered";
  expectedRevision?: number;
  reason?: string;
  idempotencyKey: string;
}
```

Output:

```ts
type Result =
  | { ok: true; value: DeliverableSafeSummary }
  | {
      ok: false;
      error:
        | "VALIDATION_FAILED"
        | "ACCESS_DENIED"
        | "DELIVERABLE_NOT_FOUND"
        | "INVALID_TRANSITION"
        | "EXPECTED_STATE_MISMATCH"
        | "AUDIT_APPEND_FAILED";
    };
```

Rules:

- Server must resolve actor from runtime session, not from form input.
- Server must validate tenant/client scope before update.
- Server must derive progress from `toStatus`.
- Server must deny `waiting_client_approval` unless current status is `internally_approved`.
- Server must deny `delivered` unless current status is `client_approved` or the deliverable does not require client approval.
- Server must append audit for allowed and denied attempts.
- Server must roll back if audit append fails.

## UI Control Contract

F-004 uses status select/action controls:

- A card renders a select with the active board statuses.
- The current status is selected.
- The submit action includes deliverable id, client id, target status, expected revision, and idempotency key.
- On success, the board revalidates and returns to the board URL with a success state.
- On denial, the board returns to the board URL with a safe denied state.

Drag/drop is out of scope for F-004.
