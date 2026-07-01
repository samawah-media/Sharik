# Implementation Plan: Internal Kanban Workflow MVP

**Branch**: `codex/f-004-internal-kanban-workflow` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-internal-kanban-workflow/spec.md`

## Summary

Build a client-scoped internal board for existing deliverables at `/clients/[clientId]/deliverables/board`, using the existing Next.js/Supabase modular monolith. The MVP groups active deliverable statuses into columns, shows safe card metadata and derived SLA state, and changes status through a server-side command with tenant/client authorization, transition rules, progress derivation, and audit logging.

The current repository does not include `@dnd-kit`, and there is no kanban-specific ADR at `docs/05-decisions/ADR-003-kanban-dnd-kit.md`. F-004 therefore uses select/action controls instead of drag/drop and does not add a dependency.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React, Supabase/PostgreSQL.

**Primary Dependencies**: Existing dependencies only: Next.js, TypeScript, Supabase client, Zod, React, Lucide, Vitest, Testing Library, Playwright.

**Storage**: Existing Supabase/PostgreSQL deliverables, audit_events, and RLS model. A narrow migration/RPC may be added for audited status transition if needed because direct authenticated updates are revoked.

**Testing**: Vitest unit/integration/RLS/component projects, Playwright E2E, local pgTAP through `npm run test:rls`, lint, typecheck, build, and secret scan.

**Target Platform**: Existing Sharik web app. No Production Supabase and no real client data.

**Project Type**: Full-stack modular monolith.

**Performance Goals**: Client-scoped board should render the seeded UAT deliverables without noticeable delay and should avoid cross-client fetches.

**Constraints**:

- Spec before code.
- Existing deliverable statuses only.
- No `RoleKey` changes or standalone `project_manager`.
- No files, comments, full approval workflow, AI, social scheduling, Production Supabase, or real client data.
- No new dependency in F-004.
- Status transitions must be server-side, tenant/client scoped, audited, and safe on retry/stale revision.
- Client roles must not see internal board links or board data.

**Scale/Scope**: One client board at a time, using existing deliverables and the ten active workflow columns.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | This Spec Kit package exists before implementation. |
| Tenant/client isolation | PASS | Board route and transition command require tenant/client scope. |
| Deny by default | PASS | Missing role, scope, revision, or invalid transition denies. |
| Server-side sensitive commands | PASS | Status changes are server commands/RPC, not client-only UI. |
| RLS defense in depth | PASS | Existing RLS is retained and local RLS tests are required. |
| Append-only auditability | PASS | Allowed and denied transitions append audit events. |
| SLA timeline principles | PASS | Waiting-client and resumed states derive SLA behavior without counting client wait against Samawah. |
| No unreviewed dependency | PASS | dnd-kit is not installed and no dependency is added. |
| No internal content to client | PASS | Client roles are denied board route and links. |
| No Production Supabase/real data | PASS | Only local/synthetic verification is allowed. |

No constitution violation is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation

```text
specs/005-internal-kanban-workflow/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- kanban-workflow.md
`-- evidence/
    `-- verification.md
```

### Source Code

```text
src/modules/deliverables/
  deliverable-rules.ts
  deliverable-repository.ts

src/server/commands/deliverables/
  update-deliverable-status.ts
  deliverable-schemas.ts

src/server/actions/
  deliverable-status.ts
  deliverable-write-rpc.ts

src/app/(management)/clients/
  page.tsx
  [clientId]/page.tsx
  [clientId]/deliverables/page.tsx
  [clientId]/deliverables/board/page.tsx

src/ui/management/
  deliverable-board.tsx
  deliverable-form.tsx

supabase/migrations/
  <timestamp>_f004_deliverable_status_workflow.sql

tests/unit/deliverables/
tests/integration/deliverables/
tests/rls/
tests/component/deliverables/
tests/e2e/management/
```

**Structure Decision**: The route is nested under existing deliverables as `/clients/[clientId]/deliverables/board` because the board is a management view over deliverables, not a separate client workspace. This also keeps links from `/clients`, `/clients/[clientId]`, and `/clients/[clientId]/deliverables` predictable.

## Design Decisions

| Decision | Rationale | Alternatives |
|---|---|---|
| Use `/clients/[clientId]/deliverables/board` | Matches current route tree and keeps board attached to deliverables. | `/clients/[clientId]/kanban` was shorter but less aligned with current deliverables pages. |
| Use select/action controls for F-004 | `@dnd-kit` is absent and no new dependency is allowed for this MVP. | Add dnd-kit now; rejected because it requires dependency/ADR review and extra component/E2E complexity. |
| Derive SLA status for display | Current schema has no persisted SLA segment table. | Add persisted SLA status/segments; rejected as outside F-004. |
| Add narrow audited status update RPC if needed | Direct authenticated updates are revoked and sensitive writes must be server-side. | Direct table update from client/server action; rejected because it bypasses the established audited RPC pattern. |

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | Files/comments/approvals/AI/social scheduling remain excluded. |
| Tenant/client isolation | PASS | Contracts and tasks require Client A/B negative tests. |
| Audit required | PASS | Transition command and RPC include allowed/denied audit events. |
| SLA pause/resume | PASS | Waiting-client transition derives paused state; client changes resume active SLA evaluation. |
| No new dependency | PASS | No package changes planned. |
| Review before merge | PASS | PR creation only; no merge by agent. |
