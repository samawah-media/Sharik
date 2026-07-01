# Research: Internal Kanban Workflow MVP

Date: 2026-07-01

## Decision: Use select/action status controls for F-004

**Rationale**: The approved AGENTS stack includes dnd-kit, but the current app does not install `@dnd-kit/*`, and there is no kanban-specific ADR at `docs/05-decisions/ADR-003-kanban-dnd-kit.md`. The user explicitly allowed select/action buttons when dnd-kit is not installed. This avoids a new dependency and keeps the MVP focused on secure workflow state changes.

**Alternatives considered**:

- Add dnd-kit now: rejected because F-004 can deliver value without a dependency change and because drag/drop needs additional ADR/dependency/test review.
- Build custom drag/drop: rejected because it would add risky custom interaction logic outside the MVP.

## Decision: Route board under deliverables

**Rationale**: Existing management pages use `/clients/[clientId]/deliverables` for deliverable work. The board is another view over the same resource, so `/clients/[clientId]/deliverables/board` is clearer and easier to link from the existing pages.

**Alternatives considered**:

- `/clients/[clientId]/kanban`: shorter, but less discoverable from the current deliverables route tree.

## Decision: Keep status transitions narrow and server-side

**Rationale**: Deliverable status changes affect progress, client exposure, SLA, and audit. Direct table updates are not appropriate. The implementation should follow existing command/RPC patterns so authorization, tenant/client scope, transition rules, and audit are enforced together.

**Alternatives considered**:

- Client-only status update: rejected because UI checks are not security.
- Direct Supabase table update from server action: rejected because existing write flows use audited RPC/command boundaries and direct authenticated updates are revoked.

## Decision: Derive SLA status on cards

**Rationale**: The current MVP derives SLA status from deliverable dates and lifecycle status. F-004 can display that derived value and emit pause/resume-related audit events for status transitions without adding a persisted SLA segment model.

**Alternatives considered**:

- Add persisted SLA timeline segments now: rejected because it is larger than the board MVP and belongs to a separate SLA evolution.

## Decision: No ADR is required for F-004 dependency handling

**Rationale**: No new dependency or stack change is introduced. The absence of the expected kanban ADR is documented here and in the plan. A future drag/drop implementation should add or update an ADR before adding dnd-kit.

**Alternatives considered**:

- Add an ADR for select controls: rejected because the decision does not add or change technology; it scopes the MVP to existing primitives.
