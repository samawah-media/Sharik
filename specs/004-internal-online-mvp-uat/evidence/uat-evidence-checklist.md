# Evidence Checklist: Internal Online MVP UAT

Date: 2026-06-30

This checklist separates local evidence from hosted evidence. Do not mark hosted checks as passed unless they were run against the approved hosted environment. Data-backed hosted checks remain blocked until a Supabase UAT project exists.

## Baseline

| ID | Check | Status | Evidence |
|---|---|---:|---|
| BASE-001 | PR #17 merged to `main` | PASS | `gh pr view 17` reported `MERGED` at `2026-06-29T12:30:38Z`, merge commit `6c406049203230c6b7e34eb0708bac0f82c981f8`. |
| BASE-002 | UAT branch isolated after PR #17 | PASS | Branch/worktree `codex/internal-online-mvp-uat` at PR #17 merge commit. |
| BASE-003 | `AGENTS.md` and project progress reviewed | PASS | Reviewed before edits. |
| BASE-004 | Hosted Supabase approval | PASS | Owner supplied project ref `jnvuccapgsabrwwkxnbh` on 2026-06-30 after the earlier placeholder blocker. |
| BASE-005 | Owner-approved Vercel deployment | NOT RUN | Owner now allows Vercel Hobby/free and a Production hosting target; deployment still needs account/project/target evidence before URL sharing. |
| BASE-006 | Spec Kit prerequisite check on `codex/*` branch | PASS | `check-prerequisites.ps1` now honors `.specify/feature.json` when it pins the active feature directory. |
| BASE-007 | PR #18 and PR #19 merged on `main` | PASS | `origin/main` is `466b9eddbbcd2465fb2106907b4b38fb0880196c`; log shows PR #18 merge `9dac378` followed by PR #19 merge `466b9ed`. |
| BASE-008 | CI/checks for latest `main` merge commit | NOT RUN | GitHub check-runs for `466b9eddbbcd2465fb2106907b4b38fb0880196c` returned zero checks; combined commit status has no contexts. Latest visible `main` Actions run is older than PR #18/#19. |
| BASE-009 | Owner decision: Vercel Hobby/free | PASS | Owner confirmed on 2026-06-30 that Vercel may be used without a paid Team scope. |
| BASE-010 | Owner decision: Vercel Production hosting target | PASS | Owner confirmed on 2026-06-30 that Vercel Production target may be used; evidence labels this as hosting-only, not Production acceptance. |
| BASE-011 | Supabase UAT availability | PASS | Project ref `jnvuccapgsabrwwkxnbh` is visible to the local Supabase CLI account; project metadata says `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`. |

## Supabase Access Attempt - 2026-06-30

| ID | Command | Status | Notes |
|---|---|---:|---|
| SUPA-001 | `npx supabase@2.107.0 --version` with telemetry disabled | PASS | CLI reported `2.107.0`. |
| SUPA-002 | `npx supabase@2.107.0 orgs list` | PASS | Current CLI account can list organizations, confirming the CLI is authenticated to an account. |
| SUPA-003 | `npx supabase@2.107.0 projects list` | PASS | Target ref `jnvuccapgsabrwwkxnbh` is visible under the current CLI account as `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`. |
| SUPA-004 | `npx supabase@2.107.0 link --project-ref jnvuccapgsabrwwkxnbh` | PASS | Link returned the target project ref without printing secrets. |
| SUPA-005 | Target non-production metadata verification | PASS | Metadata supports UAT intent: project name is `sharik-uat`; no Production project was selected. |
| SUPA-006 | Hosted schema metadata inspection | PASS | `db query --linked` listed Supabase-managed auth base tables only before hosted migration; no Sharik public client tables were present. |
| SUPA-007 | Hosted auth/user count inspection | BLOCKED | `auth.users` count query could not complete Postgres authentication and requested `SUPABASE_DB_PASSWORD`. |

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
| LOCAL-012 | `npx supabase@2.107.0 db reset --local --no-seed` | PASS | Local migrations replayed successfully before seed validation. |
| LOCAL-013 | R-004 seed local apply via `psql` | PASS | `supabase/seeds/r004_internal_online_mvp_uat.sql` applied twice locally with `ON_ERROR_STOP=1`; second run stayed idempotent and did not mutate append-only package ledger rows. |
| LOCAL-014 | R-004 seed row-count validation | PASS | Local DB shows 2 clients, 5 auth users, 2 contracts, 2 packages, 2 package lines, 7 deliverables, 6 Alpha deliverables, and 1 Beta deliverable. |

## Resume Verification - 2026-06-29

| ID | Command | Status | Notes |
|---|---|---:|---|
| RESUME-001 | `git diff --check` | PASS | No whitespace errors; Git reported line-ending warnings only. |
| RESUME-002 | `npm run secret:scan` | PASS | No high-confidence secrets found. |
| RESUME-003 | `npm run lint` | PASS | ESLint completed successfully after installing lockfile dependencies in the resume worktree. |
| RESUME-004 | `npm run test:unit` | PASS | 23 files / 72 tests passed. |
| RESUME-005 | `npm run test:integration` | PASS | 19 files / 76 tests passed. |
| RESUME-006 | `npm run test:component` | PASS | 12 files / 39 tests passed. |
| RESUME-007 | `npm run test:rls:simulator` | PASS | 7 files / 21 tests passed. |
| RESUME-008 | `npm audit --audit-level=high` | PASS | No high/critical findings; existing moderate PostCSS advisory through Next remains. |
| RESUME-009 | `npm run typecheck` | FAIL | Current baseline fails in unmodified source files and Next type declarations; this docs-only resume changed only `docs/PROJECT_PROGRESS.md`, `docs/08-release/R-004-internal-online-mvp-uat.md`, and this evidence file. |
| RESUME-010 | `npm run build` | FAIL | Next compiled successfully, then failed TypeScript validation on missing declaration for `next/types.js`; no product source code was changed in this resume branch. |

## Hosted Environment Gates

| ID | Check | Status | Notes |
|---|---|---:|---|
| HOST-001 | Vercel account approved | NOT RUN | Owner now allows Vercel Hobby/free; next check is `vercel whoami` and project link under the approved personal account. |
| HOST-002 | Protection/public exposure status recorded | NOT RUN | Free-account protection availability must be checked and documented before URL sharing. |
| HOST-003 | Vercel env vars avoid Production Supabase/real data | NOT RUN | Requires Vercel project link. |
| HOST-004 | Vercel Production target hosting-only evidence | NOT RUN | Owner allows Production target for hosting only; deployment URL/id/target and rollback path still need to be recorded. |
| HOST-005 | Hosted Supabase project non-production | PASS | Ref `jnvuccapgsabrwwkxnbh` resolves to project `sharik-uat`; link succeeds under the current CLI account. |
| HOST-006 | Hosted migration applied | BLOCKED | Not run because DB/auth no-real-data verification did not pass; CLI requested `SUPABASE_DB_PASSWORD`. |
| HOST-007 | Synthetic seed prepared | PASS | Dedicated guarded seed added at `supabase/seeds/r004_internal_online_mvp_uat.sql`; it is separate from `supabase/seed.sql`. |
| HOST-008 | Synthetic seed applied | BLOCKED | Not run; only `supabase/seeds/r004_internal_online_mvp_uat.sql` remains approved after account access and target verification pass. |
| HOST-009 | Hosted target has no real client data/users | BLOCKED | Project metadata is available, but `auth.users` count and data inspection are blocked until `SUPABASE_DB_PASSWORD` is available. The guarded R-004 seed was not applied to any hosted target. |

## Smoke Checks

| ID | Check | Status | Notes |
|---|---|---:|---|
| SM-001 | Vercel URL responds | NOT RUN | Requires owner-approved Vercel deployment URL. |
| SM-002 | Sign-in surface loads | NOT RUN | Requires owner-approved Vercel deployment URL. |
| SM-003 | Hosted fixture actors disabled | NOT RUN | Requires owner-approved Vercel deployment URL. |
| SM-004 | Runtime health on accepted surfaces | NOT RUN | Requires owner-approved Vercel deployment URL; data-backed checks remain blocked without Supabase UAT. |
| SM-005 | Browser response does not expose secrets | NOT RUN | Requires owner-approved Vercel deployment URL. |

## Security Checks

| ID | Check | Status | Notes |
|---|---|---:|---|
| SEC-001 | Client Alpha user cannot access Client Beta data | BLOCKED | Requires hosted synthetic data; no hosted seed was run. |
| SEC-002 | Client user cannot access management-only surfaces | BLOCKED | Requires hosted synthetic users; no hosted seed was run. |
| SEC-003 | Unauthorized deliverable/SLA access denies safely | BLOCKED | Requires hosted synthetic data; no hosted seed was run. |
| SEC-004 | Service role not exposed in browser | NOT RUN | Requires owner-approved Vercel deployment URL. |
| SEC-005 | No real client data in seed/screenshots | BLOCKED | Seed file remains synthetic-only, but hosted Supabase target inspection and data screenshots cannot run until a Supabase UAT project exists. |
| SEC-006 | Seed refuses non-R-004 client/auth data | PASS | Seed guards abort when existing client/auth data is outside the approved synthetic R-004 fixture set. |

## UAT Checks

| ID | Surface | Status | Notes |
|---|---|---:|---|
| UAT-001 | Client management | BLOCKED | Requires hosted migration/seed. |
| UAT-002 | Contracts | BLOCKED | Requires hosted migration/seed. |
| UAT-003 | Packages | BLOCKED | Requires hosted migration/seed. |
| UAT-004 | Deliverables | BLOCKED | Requires hosted migration/seed. |
| UAT-005 | Commercial summaries | BLOCKED | Requires hosted migration/seed. |
| UAT-006 | SLA MVP summaries | BLOCKED | Requires hosted migration/seed. |
| UAT-007 | `paused_waiting_internal_decision` hosted persisted case | BLOCKED | Current accepted MVP has no persisted SLA segment table; covered by F-003 domain/unit evidence only until a future approved schema change. |

## Out Of Scope Confirmed

- Production acceptance.
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
