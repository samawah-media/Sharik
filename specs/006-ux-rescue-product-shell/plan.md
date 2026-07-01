# Implementation Plan: F-005 UX Rescue Product Shell

**Branch**: `codex/f-005-ux-rescue-product-shell` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-ux-rescue-product-shell/spec.md`

## Summary

Rescue the current Sharik internal trial UX without adding product features. The work adds a shared RTL management product shell, a small local UI system, and a redesigned existing Kanban board layout. It applies the shell and primitives to the current clients list, client detail, contracts, packages, deliverables list, and deliverables board pages. The Kanban board remains status-select/action based; no drag/drop, files, comments, approvals, AI, social scheduling, new dependencies, Production behavior, or real client data are added.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React.

**Primary Dependencies**: Existing dependencies only: Next.js, TypeScript, React, Tailwind CSS, Lucide React, Supabase client, Zod, Vitest, Testing Library, Playwright.

**Storage**: Existing Supabase/PostgreSQL read/write paths only. No schema migration is planned for F-005.

**Testing**: Existing scripts: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:component`, `npm run test:e2e`, `npm run secret:scan`, and `npm run build`.

**Target Platform**: Existing Sharik web app, local/staging internal trial surfaces only.

**Project Type**: Full-stack modular monolith with Next.js App Router.

**Performance Goals**: Reviewed pages should render with stable layout, no avoidable layout shift from shell controls, and readable Kanban columns with up to the current ten active statuses.

**Constraints**:

- Spec before code.
- No product feature expansion.
- No files, comments, approvals, drag/drop, AI, social scheduling, Production Supabase, or real client data.
- No dependencies unless an ADR and owner approval are added first.
- Keep existing route guards, tenant/client scoping, status transitions, audit behavior, and SLA derivation.
- Arabic RTL, responsive layout, and keyboard-focusable controls are required.
- Screenshot/evidence must be captured before and after implementation.

**Scale/Scope**: Six reviewed management surfaces plus shared UI primitives and tests.

## Constitution Check

### Pre-Design Gate

| Principle                        | Result | Evidence                                                                         |
| -------------------------------- | -----: | -------------------------------------------------------------------------------- |
| Spec before code                 |   PASS | This Spec Kit package precedes production code edits.                            |
| Tenant/client isolation          |   PASS | No data access expansion; existing scoped routes remain.                         |
| Deny by default                  |   PASS | Existing denied/error states are preserved and restyled only.                    |
| Server-side sensitive commands   |   PASS | Existing status action path is reused; no client-only sensitive operation added. |
| RLS defense in depth             |   PASS | No RLS policy or query broadening is planned.                                    |
| No internal content to client    |   PASS | Client roles still cannot access management board links/routes.                  |
| Accessibility and RTL by default |   PASS | This is the primary goal of F-005.                                               |
| Verification evidence required   |   PASS | Evidence docs and screenshots are explicit tasks.                                |
| No secrets in repo/browser       |   PASS | No real client data or secrets are introduced.                                   |
| No unreviewed dependency         |   PASS | No dependency change is planned.                                                 |
| No social scheduling in V1       |   PASS | Explicitly out of scope.                                                         |

No constitution violation is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation

```text
specs/006-ux-rescue-product-shell/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- ui-contract.md
`-- evidence/
    |-- verification.md
    `-- screenshots/

docs/08-release/
`-- F-005-ux-rescue-product-shell.md
```

### Source Code

```text
src/app/
  layout.tsx
  globals.css
  (management)/layout.tsx
  (management)/clients/page.tsx
  (management)/clients/[clientId]/page.tsx
  (management)/clients/[clientId]/contracts/page.tsx
  (management)/clients/[clientId]/contracts/[contractId]/packages/page.tsx
  (management)/clients/[clientId]/deliverables/page.tsx
  (management)/clients/[clientId]/deliverables/board/page.tsx

src/ui/core/
  badge.tsx
  button.tsx
  card.tsx
  states.tsx

src/ui/layout/
  breadcrumbs.tsx
  page-header.tsx
  product-shell.tsx

src/ui/management/
  client-form.tsx
  contract-form.tsx
  package-form.tsx
  deliverable-form.tsx
  deliverable-board.tsx

tests/component/
  product-shell.test.tsx
  deliverables/deliverable-board.test.tsx

tests/e2e/management/
  kanban-board.spec.ts
```

**Structure Decision**: F-005 adds local UI primitives under `src/ui/core/` and shell primitives under `src/ui/layout/` to avoid dependency changes. Reviewed pages remain in the existing App Router tree and use the shared shell instead of introducing a new route group or business module.

## Design Decisions

| Decision                                                             | Rationale                                                                                                                                     | Alternatives                                                                       |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Use local primitives instead of shadcn generation                    | `shadcn/ui` is a planning stack choice, but it is not installed in this repo and adding it would violate the no-dependency/no-ADR constraint. | Add shadcn now; rejected for F-005 because it changes dependencies and scope.      |
| Keep Kanban status select/action flow                                | The owner forbids drag/drop and new dependencies. Existing transition validation remains intact.                                              | Add dnd-kit or custom drag/drop; rejected.                                         |
| Apply one management shell through `src/app/(management)/layout.tsx` | Centralizes RTL shell, sidebar, header, and container without touching business logic on every route.                                         | Rebuild each page independently; rejected because it keeps inconsistency.          |
| Use CSS/layout containment for board readability                     | Fixes the observed visual failure without changing domain behavior.                                                                           | Add new board features or filters; rejected as feature expansion.                  |
| Store visual evidence under Spec Kit and summarize in docs           | Keeps PR evidence traceable to F-005 while satisfying the owner request for docs evidence.                                                    | Put screenshots only in Playwright report; rejected because reports are transient. |

## Post-Design Constitution Check

| Principle               | Result | Evidence                                                                         |
| ----------------------- | -----: | -------------------------------------------------------------------------------- |
| Scope control           |   PASS | The plan touches UX structure only and keeps forbidden product areas excluded.   |
| Tenant/client isolation |   PASS | No new query, RLS, or API path is planned.                                       |
| Audit required          |   PASS | Existing status action remains audited; no new approval/rejection path is added. |
| SLA pause/resume        |   PASS | SLA badge uses existing derivation only.                                         |
| No new dependency       |   PASS | Package manifests are expected to remain unchanged.                              |
| Review before merge     |   PASS | PR creation only; no merge by agent.                                             |
