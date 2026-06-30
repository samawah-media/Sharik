# R-004 Internal Online MVP UAT

## Status

SUPABASE LINKED - DB PASSWORD BLOCKED - VERCEL PROJECT NOT LINKED - HOSTED OPERATIONS NOT RUN

This release gate prepares an internal online UAT after PR #17. It is not Production acceptance and does not authorize real client data or Production Supabase. Owner decision on 2026-06-30 allows Vercel Hobby/free and allows Vercel Production target for hosting only.

## Baseline

- PR #17: `feat(F-003): implement SLA MVP foundation`
- PR #17 status: merged into `main`
- Merge commit: `6c406049203230c6b7e34eb0708bac0f82c981f8`
- UAT branch: `codex/internal-online-mvp-uat`
- PR #18 status: merged on 2026-06-29; follow-up corrections are on `codex/r004-uat-gate-follow-up`
- PR #19 status: merged on 2026-06-29; merge commit `466b9eddbbcd2465fb2106907b4b38fb0880196c`
- PR #20 status: merged on 2026-06-30; merge commit `a900a6e206b74a9a6e7afc62356400444bbe47f3`
- PR #21 status: merged on 2026-06-30; latest `main` merge commit is `86119ca350811511dfdc81403a5ae6548e0caf7f`
- PR #22 status: open; `quality` and `CodeRabbit` checks are passing.
- Hosted UAT resume branch: `codex/r004-hosted-uat-evidence`
- Hosted UAT access branch: `codex/r004-hosted-uat-run`
- Spec Kit package: `specs/004-internal-online-mvp-uat/`
- R-004B owner decision: Vercel Hobby/free accepted; Vercel Production target accepted as hosting-only; Supabase deferred because no new Sharik Supabase project exists yet.
- R-004C owner supplied Supabase project ref `jnvuccapgsabrwwkxnbh`, but current Supabase CLI account lacks privileges for the target project.
- R-004D owner logged the machine into Supabase; project `sharik-uat` is visible and link succeeds, but DB/auth inspection still requires `SUPABASE_DB_PASSWORD`.
- R-004E Vercel CLI is authenticated as `omarhussien2`, but this worktree has no `.vercel/project.json`, the personal account has no projects, and no Vercel project/env/deploy action was run.

## Goal

Prepare the smallest internal online UAT that can validate accepted MVP surfaces using synthetic data only when Supabase UAT is available:

- deployed access;
- sign-in surface;
- client management;
- contracts;
- packages;
- deliverables;
- commercial summaries;
- SLA MVP summaries;
- tenant/client isolation and role-boundary checks.

## Gates

| Gate | Status | Notes |
|---|---:|---|
| PR #17 merged | PASS | Verified through GitHub CLI. |
| Spec Kit UAT package | PASS | Created under `specs/004-internal-online-mvp-uat/`. |
| PR #18 through PR #21 merged | PASS | `origin/main` is `86119ca350811511dfdc81403a5ae6548e0caf7f`, the PR #21 merge commit. |
| Latest `main` CI/checks | NOT RUN | GitHub check-runs for `86119ca350811511dfdc81403a5ae6548e0caf7f` returned zero checks and no status contexts. |
| PR #22 checks | PASS | PR #22 is open with `quality` and `CodeRabbit` passing. |
| Vercel Hobby/free owner decision | PASS | Owner confirmed paid Team scope is not required for this stage. |
| Vercel Production hosting-only target | PASS | Owner approved Vercel Production target as hosting only, not Production acceptance. |
| Hosted Supabase approval | PASS | Owner supplied project ref `jnvuccapgsabrwwkxnbh` on 2026-06-30. |
| Hosted Supabase target metadata verification | PASS | Project ref `jnvuccapgsabrwwkxnbh` resolves to `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`; `supabase link` succeeds. |
| Hosted Supabase no-real-data verification | BLOCKED | `auth.users` count query could not complete Postgres authentication and requested `SUPABASE_DB_PASSWORD`. |
| Vercel account check | PASS | Vercel CLI `50.11.0` is authenticated as `omarhussien2`. |
| Vercel project link | BLOCKED | No `.vercel/project.json` exists and the personal account currently has no projects; no project was created or linked. |
| Vercel deploy | BLOCKED | Deployment is held until DB password access, no-real-data verification, hosted migration/seed, Vercel project link, env, and exposure/protection evidence are complete. |
| Hosted smoke/security/UAT checks | BLOCKED | Data-backed checks require account access, target verification, hosted migration, and synthetic seed. |
| R-004 synthetic seed preparation | PASS | Guarded seed prepared at `supabase/seeds/r004_internal_online_mvp_uat.sql`; not applied to hosted. |

## Data Policy

- Synthetic data only.
- Reserved fake emails such as `.example.test`.
- No real client names.
- No real client emails.
- No Production Supabase.
- Vercel Production target is hosting-only and not Production acceptance.
- No service role or secret values in docs, logs, browser, or PR text.
- Use only `supabase/seeds/r004_internal_online_mvp_uat.sql` for R-004 hosted UAT seed; do not use the older local `supabase/seed.sql`.

## Rollback

1. Remove the Vercel deployment by id.
2. Remove deployment env vars if the deployment is retired.
3. Do not delete the non-production Supabase project without owner approval.
4. Record rollback evidence in `specs/004-internal-online-mvp-uat/evidence/uat-evidence-checklist.md` and `docs/PROJECT_PROGRESS.md`.

## Current Blockers

- Hosted Supabase migration is blocked because DB/auth no-real-data verification still requires `SUPABASE_DB_PASSWORD`.
- The hosted Supabase target metadata is visible as `sharik-uat`, but the target cannot be confirmed free of real client data/users until database password access is available.
- Hosted data-backed UAT is blocked until migration and synthetic seed are approved and executed.
- `paused_waiting_internal_decision` cannot be represented as hosted persisted seed data in the current MVP because no SLA segment table exists yet; it remains domain/unit evidence only.
- Vercel deployment is not team-ready yet because the worktree is not linked to a Vercel project and required Supabase env/data gates are incomplete.

## Local Verification

- `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`: passed after honoring pinned `.specify/feature.json`.
- `git diff --check`: passed; line-ending warnings only.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:unit`: passed, 23 files / 72 tests.
- `npm run test:integration`: passed, 19 files / 76 tests.
- `npm run test:rls`: passed; simulator 7 files / 21 tests and pgTAP 2 files / 110 tests.
- `npm run test:component`: passed, 12 files / 39 tests.
- `npm run test:e2e`: passed, 61 passed / 2 expected skips.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm audit --audit-level=high`: passed; existing moderate PostCSS advisory through Next remains.
- `npm run build`: passed.
- R-004 seed local validation: passed after `npx supabase@2.107.0 db reset --local --no-seed`; applied twice via `psql` inside `supabase_db_sharik-platform` with 2 clients, 5 auth users, and 7 deliverables.

## Resume Verification - 2026-06-29

- `git diff --check`: passed; line-ending warnings only.
- `npm run secret:scan`: passed; no high-confidence secrets found.
- `npm run lint`: passed.
- `npm run test:unit`: passed, 23 files / 72 tests.
- `npm run test:integration`: passed, 19 files / 76 tests.
- `npm run test:component`: passed, 12 files / 39 tests.
- `npm run test:rls:simulator`: passed, 7 files / 21 tests.
- `npm audit --audit-level=high`: passed high/critical threshold; existing moderate PostCSS advisory through Next remains.
- `npm run typecheck`: failed in current baseline/unmodified source and Next type declarations; this resume changed documentation/evidence only.
- `npm run build`: compiled successfully, then failed TypeScript validation on missing declaration for `next/types.js`; this resume changed documentation/evidence only.

## Out Of Scope

- Production acceptance.
- Real client data.
- New dependencies.
- Product feature expansion.
- Database schema changes in this branch.
- Kanban, files, comments, approvals, social scheduling, AI, background jobs.
- `RoleKey` changes or standalone `project_manager` role.
