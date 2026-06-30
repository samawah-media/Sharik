# R-004 Internal Online MVP UAT

## Status

VERCEL GATE UPDATED - SUPABASE DEFERRED

This release gate prepares an internal online UAT after PR #17. It is not Production acceptance and does not authorize real client data or Production Supabase. Owner decision on 2026-06-30 allows Vercel Hobby/free and allows Vercel Production target for hosting only.

## Baseline

- PR #17: `feat(F-003): implement SLA MVP foundation`
- PR #17 status: merged into `main`
- Merge commit: `6c406049203230c6b7e34eb0708bac0f82c981f8`
- UAT branch: `codex/internal-online-mvp-uat`
- PR #18 status: merged on 2026-06-29; follow-up corrections are on `codex/r004-uat-gate-follow-up`
- PR #19 status: merged on 2026-06-29; latest `main` merge commit is `466b9eddbbcd2465fb2106907b4b38fb0880196c`
- Hosted UAT resume branch: `codex/r004-hosted-uat-evidence`
- Spec Kit package: `specs/004-internal-online-mvp-uat/`
- R-004B owner decision: Vercel Hobby/free accepted; Vercel Production target accepted as hosting-only; Supabase deferred because no new Sharik Supabase project exists yet.

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
| PR #18 and PR #19 merged | PASS | `origin/main` contains PR #18 merge `9dac378` and PR #19 merge `466b9ed`. |
| Latest `main` CI/checks | NOT RUN | GitHub check-runs for `466b9ed` returned zero checks and no status contexts. |
| Vercel Hobby/free owner decision | PASS | Owner confirmed paid Team scope is not required for this stage. |
| Vercel Production hosting-only target | PASS | Owner approved Vercel Production target as hosting only, not Production acceptance. |
| Hosted Supabase approval | BLOCKED | Owner clarified no new Sharik Supabase project exists yet. |
| Hosted Supabase target/data verification | BLOCKED | Cannot verify non-production status or absence of real client data/users until a Supabase UAT project exists. |
| Vercel deploy | NOT RUN | Deployment checks can proceed next under the owner-approved Vercel account; no deploy was attempted in this documentation update. |
| Hosted smoke/security/UAT checks | BLOCKED | Vercel smoke can run after deployment; data-backed checks require hosted migration/seed approval after Supabase UAT exists. |
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

- Hosted Supabase migration is blocked until a Supabase UAT project exists and receives explicit approval.
- The hosted Supabase target cannot be confirmed non-production or free of real client data/users until the UAT project is available and inspected through an approved non-secret path.
- Hosted data-backed UAT is blocked until migration and synthetic seed are approved and executed.
- `paused_waiting_internal_decision` cannot be represented as hosted persisted seed data in the current MVP because no SLA segment table exists yet; it remains domain/unit evidence only.
- Vercel deployment can proceed under the owner-approved Hobby/free account after account/project/env/protection or public-exposure checks are recorded.

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
