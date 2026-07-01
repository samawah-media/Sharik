# Quickstart Validation Guide: Internal Kanban Workflow MVP

Date: 2026-07-01

This guide validates F-004 locally and with synthetic data only. Do not use Production Supabase, real client data, files, comments, approvals workflow, social scheduling, or AI.

## Preconditions

- Branch is `codex/f-004-internal-kanban-workflow`.
- `origin/main` contains PR #25 merge commit `0872780d00799ec42e95d3ea889c686cce8b7bad`.
- R-004 temporary `@r004.example.test` password hashes are cleared.
- Spec Kit package `specs/005-internal-kanban-workflow/` exists before code.
- No `@dnd-kit` dependency is added for F-004.

## Manual Route Checks

Run the app locally:

```powershell
npm run dev
```

Expected:

- `/clients` shows a board link for each accessible client to authorized internal users.
- `/clients/[clientId]` shows a board link to authorized internal users.
- `/clients/[clientId]/deliverables` shows a board link to authorized internal users.
- `/clients/[clientId]/deliverables/board` shows the ten active workflow columns.
- A client viewer cannot see management board links and cannot open the board route.

## Status Transition Checks

Use synthetic deliverables only.

Expected:

- `not_started -> in_progress` succeeds for an authorized internal actor.
- Progress updates to 30%.
- Audit contains `DeliverableStatusChanged`.
- `not_started -> waiting_client_approval` is denied and audited.
- `in_progress -> delivered` is denied when client approval is required.
- `client_approved -> delivered` succeeds and progress updates to 100%.
- Client viewer direct command attempt is denied and does not expose deliverable details.

## Required Commands

Run from repository root:

```powershell
git diff --check
npm run secret:scan
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:rls
npm run test:component
npm run test:e2e
npm run build
```

Expected:

- All commands pass before PR creation.
- Any failure is recorded in `specs/005-internal-kanban-workflow/evidence/verification.md`.

## Evidence Recording

Update:

- `specs/005-internal-kanban-workflow/evidence/verification.md`
- `docs/PROJECT_PROGRESS.md`

Use statuses:

- `PASS`
- `FAIL`
- `BLOCKED`
- `SKIPPED`
- `NOT RUN`

## Out Of Scope

- Drag/drop.
- dnd-kit dependency installation.
- Files.
- Comments.
- Full internal/client approvals workflow.
- Production Supabase.
- Real client data.
- RoleKey changes.
- Standalone `project_manager`.
- Social scheduling.
- AI.
