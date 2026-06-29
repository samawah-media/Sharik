# Evidence Checklist: Internal Online MVP UAT

Date: 2026-06-29

This checklist separates local evidence from hosted evidence. Do not mark hosted checks as passed unless they were run against the approved protected non-production online environment.

## Baseline

| ID | Check | Status | Evidence |
|---|---|---:|---|
| BASE-001 | PR #17 merged to `main` | PASS | `gh pr view 17` reported `MERGED` at `2026-06-29T12:30:38Z`, merge commit `6c406049203230c6b7e34eb0708bac0f82c981f8`. |
| BASE-002 | UAT branch isolated after PR #17 | PASS | Branch/worktree `codex/internal-online-mvp-uat` at PR #17 merge commit. |
| BASE-003 | `AGENTS.md` and project progress reviewed | PASS | Reviewed before edits. |
| BASE-004 | Hosted Supabase approval | BLOCKED | Explicit owner approval not recorded in this branch. |
| BASE-005 | Hosted Preview deployment | BLOCKED | Vercel CLI is authenticated as `omarhussien2`; approved Samawah scope is not available in `vercel teams ls`. |

## Local Verification

| ID | Command | Status | Notes |
|---|---|---:|---|
| LOCAL-001 | `git diff --check` | PASS | No whitespace errors; Git reported line-ending warnings only. |
| LOCAL-002 | `npm run typecheck` | PASS | TypeScript completed successfully. |
| LOCAL-003 | `npm run lint` | PASS | ESLint completed successfully. |
| LOCAL-004 | `npm run test:unit` | PASS | 23 files / 72 tests passed. |
| LOCAL-005 | `npm run test:integration` | PASS | 19 files / 76 tests passed. |
| LOCAL-006 | `npm run test:rls` | PASS | RLS simulator 7 files / 21 tests and pgTAP 2 files / 110 tests passed. |
| LOCAL-007 | `npm run test:component` | PASS | 12 files / 39 tests passed. |
| LOCAL-008 | `npm run test:e2e` | PASS | 61 passed / 2 expected skips. |
| LOCAL-009 | `npm run secret:scan` | PASS | No high-confidence secrets found. |
| LOCAL-010 | `npm audit --audit-level=high` | PASS | No high/critical findings; existing moderate PostCSS advisory through Next remains. |
| LOCAL-011 | `npm run build` | PASS | Next.js production build completed successfully. |

## Hosted Environment Gates

| ID | Check | Status | Notes |
|---|---|---:|---|
| HOST-001 | Vercel account/scope approved | BLOCKED | `vercel whoami` returned `omarhussien2`; `vercel teams ls` showed only `omarhussien2s-projects`, not the approved Samawah scope. |
| HOST-002 | Preview protection enabled | BLOCKED | Requires approved Vercel project/scope access. |
| HOST-003 | Preview env vars are non-production only | BLOCKED | Requires approved Vercel project/scope access. |
| HOST-004 | Production env vars untouched | NOT RUN | No deployment/env mutation was attempted from the wrong account. |
| HOST-005 | Hosted Supabase project non-production | BLOCKED | Requires H1 approval. |
| HOST-006 | Hosted migration applied | BLOCKED | Requires H1 approval. |
| HOST-007 | Synthetic seed applied | BLOCKED | Requires migration approval and target verification. |

## Smoke Checks

| ID | Check | Status | Notes |
|---|---|---:|---|
| SM-001 | Protected Preview blocks unauthenticated access | NOT RUN | Requires Preview URL. |
| SM-002 | Sign-in surface loads | NOT RUN | Requires Preview URL. |
| SM-003 | Hosted fixture actors disabled | NOT RUN | Requires Preview URL. |
| SM-004 | Runtime health on accepted surfaces | NOT RUN | Requires Preview URL and data where applicable. |
| SM-005 | Browser response does not expose secrets | NOT RUN | Requires Preview URL. |

## Security Checks

| ID | Check | Status | Notes |
|---|---|---:|---|
| SEC-001 | Client Alpha user cannot access Client Beta data | BLOCKED | Requires hosted synthetic data. |
| SEC-002 | Client user cannot access management-only surfaces | BLOCKED | Requires hosted synthetic users. |
| SEC-003 | Unauthorized deliverable/SLA access denies safely | BLOCKED | Requires hosted synthetic data. |
| SEC-004 | Service role not exposed in browser | NOT RUN | Requires Preview URL. |
| SEC-005 | No real client data in seed/screenshots | BLOCKED | Requires hosted synthetic data plan execution. |

## UAT Checks

| ID | Surface | Status | Notes |
|---|---|---:|---|
| UAT-001 | Client management | BLOCKED | Requires hosted migration/seed. |
| UAT-002 | Contracts | BLOCKED | Requires hosted migration/seed. |
| UAT-003 | Packages | BLOCKED | Requires hosted migration/seed. |
| UAT-004 | Deliverables | BLOCKED | Requires hosted migration/seed. |
| UAT-005 | Commercial summaries | BLOCKED | Requires hosted migration/seed. |
| UAT-006 | SLA MVP summaries | BLOCKED | Requires hosted migration/seed. |

## Out Of Scope Confirmed

- Production deployment.
- Production Supabase.
- Real client data.
- New dependencies.
- New product features.
- Database schema changes in this branch.
- Kanban.
- Files.
- Comments.
- Approvals.
- Social scheduling.
- AI.
- Background jobs.
- `RoleKey` changes.
- Standalone `project_manager` role.
- Merging PR without review.
