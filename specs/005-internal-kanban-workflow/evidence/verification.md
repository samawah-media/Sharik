# Verification Evidence: Internal Kanban Workflow MVP

Date: 2026-07-01

## Baseline

| ID | Check | Status | Evidence |
|---|---|---:|---|
| BASE-001 | PR #25 merge commit present | PASS | Current branch starts from `origin/main`; `git merge-base --is-ancestor 0872780d00799ec42e95d3ea889c686cce8b7bad HEAD` passed before F-004 Spec Kit creation. |
| BASE-002 | R-004 temporary synthetic passwords cleared | PASS | 5 hosted `@r004.example.test` password hashes cleared; 0 remaining password hashes after verification. No secrets printed. |
| BASE-003 | dnd-kit dependency check | PASS | `package.json` has no `@dnd-kit/*`; F-004 uses select/action controls and adds no dependency. |
| BASE-004 | Kanban ADR check | PASS | `docs/05-decisions/ADR-003-kanban-dnd-kit.md` is not present; `docs/06-decisions/ADR-003-supabase-and-postgresql.md` is unrelated. No dnd-kit addition is planned. |

## Implementation Evidence

| ID | Check | Status | Evidence |
|---|---|---:|---|
| IMPL-001 | Spec Kit package created before code | PASS | `specs/005-internal-kanban-workflow/` contains spec, plan, tasks, data model, quickstart, contract, and evidence files. |
| IMPL-002 | Board route implemented | PASS | Route selected and implemented as `/clients/[clientId]/deliverables/board`; documented in plan/research. |
| IMPL-003 | Status command implemented | PASS | `updateDeliverableStatusCommand`, RPC wrapper, server action, and audited SQL RPC added. |
| IMPL-004 | Audit event coverage | PASS | Integration tests assert allowed status changes append `DeliverableStatusChanged`, denied attempts append denial events, and audit failure rolls back. |
| IMPL-005 | Tenant/client isolation tests | PASS | RLS simulator covers Client A/Client B isolation and client-role board denial; E2E verifies client viewer cannot see internal board data. |
| IMPL-006 | ADR decision | PASS | No ADR added: no new dependency was introduced, `dnd-kit` was not installed, and existing stack/patterns were used. |

## Targeted Pre-Final Checks

| ID | Command | Status | Notes |
|---|---|---:|---|
| TARGET-001 | `npm run test:unit -- tests/unit/deliverables/deliverable-rules.test.ts tests/unit/authorization/f002-permissions.test.ts` | PASS | 2 files / 13 tests. |
| TARGET-002 | `npm run test:integration -- tests/integration/deliverables/deliverable-status-workflow.test.ts` | PASS | 1 file / 7 tests. |
| TARGET-003 | `npm run test:rls:simulator -- tests/rls/kanban-workflow-isolation.test.ts` | PASS | 1 file / 3 tests. |
| TARGET-004 | `npm run test:component -- tests/component/deliverables/deliverable-board.test.tsx` | PASS | 1 file / 3 tests. |
| TARGET-005 | `npm run typecheck` | PASS | Passed after completing `node_modules` install. |
| TARGET-006 | `npm run lint` | PASS | Passed. |
| TARGET-007 | `npm run test:e2e -- tests/e2e/management/kanban-board.spec.ts` | PASS | 6 tests across desktop/mobile/RTL. |

## Required Verification Commands

| ID | Command | Status | Notes |
|---|---|---:|---|
| CHECK-001 | `git diff --check` | PASS | Passed; Git emitted CRLF working-copy warnings only. |
| CHECK-002 | `npm run secret:scan` | PASS | No high-confidence secrets found. |
| CHECK-003 | `npm run lint` | PASS | Passed. |
| CHECK-004 | `npm run typecheck` | PASS | Passed. |
| CHECK-005 | `npm run test:unit` | PASS | 23 files / 77 tests. |
| CHECK-006 | `npm run test:integration` | PASS | 20 files / 83 tests. |
| CHECK-007 | `npm run test:rls` | BLOCKED | Simulator passed: 8 files / 24 tests. DB pgTAP failed before tests because local Docker Desktop/Postgres is unavailable: `dockerDesktopLinuxEngine` pipe missing and Supabase CLI could not connect to local Postgres. No hosted or Production Supabase was used. |
| CHECK-008 | `npm run test:component` | PASS | 13 files / 42 tests. |
| CHECK-009 | `npm run test:e2e` | PASS | Final rerun passed: 67 passed / 2 skipped. First run had one desktop cold-start timeout and was rerun successfully. |
| CHECK-010 | `npm run build` | PASS | Passed; `/clients/[clientId]/deliverables/board` is dynamic. |

## Security Notes

- No Production Supabase.
- No real client data.
- Client roles must not see board links or board route data.
- All board reads and writes must include tenant/client scope.
- Status transitions must append audit events for allowed and denied attempts.
- F-004 uses select/action controls instead of drag/drop because `@dnd-kit/*` is not installed and no dependency change/ADR was required.

## PR Evidence

- Branch: `codex/f-004-internal-kanban-workflow`
- Initial implementation commit: `138d175d19e3441424551c5f222cb3a35d23fc9e`
- PR: https://github.com/samawah-media/Sharik/pull/26
- PR status at creation: open, ready for review, unmerged.
