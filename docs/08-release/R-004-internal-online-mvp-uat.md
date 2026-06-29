# R-004 Internal Online MVP UAT

## Status

PLANNED AND GATED - HOSTED OPERATIONS NOT YET RUN

This release gate prepares a protected internal online UAT after PR #17. It is not Production readiness and does not authorize real client data.

## Baseline

- PR #17: `feat(F-003): implement SLA MVP foundation`
- PR #17 status: merged into `main`
- Merge commit: `6c406049203230c6b7e34eb0708bac0f82c981f8`
- UAT branch: `codex/internal-online-mvp-uat`
- Spec Kit package: `specs/004-internal-online-mvp-uat/`

## Goal

Prepare the smallest protected internal online UAT that can validate accepted MVP surfaces using synthetic data only:

- protected access;
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
| Hosted Supabase approval | BLOCKED | Requires explicit owner approval before hosted non-production migration. |
| Protected Preview deploy | BLOCKED | Vercel CLI currently shows `omarhussien2` only, not the approved Samawah scope. No deploy was attempted. |
| Hosted smoke/security/UAT checks | BLOCKED | Requires protected Preview and, for data-backed checks, hosted migration/seed approval. |

## Data Policy

- Synthetic data only.
- Reserved fake emails such as `.example.test`.
- No real client names.
- No real client emails.
- No Production Supabase.
- No Production Vercel target.
- No service role or secret values in docs, logs, browser, or PR text.

## Rollback

1. Remove the Preview deployment by id.
2. Remove Preview-only env vars if the preview is retired.
3. Do not delete the non-production Supabase project without owner approval.
4. Record rollback evidence in `specs/004-internal-online-mvp-uat/evidence/uat-evidence-checklist.md` and `docs/PROJECT_PROGRESS.md`.

## Current Blockers

- Hosted Supabase migration is blocked until explicit owner approval.
- Hosted data-backed UAT is blocked until migration and synthetic seed are approved and executed.
- Vercel deployment must not proceed until the approved Sharik/Samawah account/scope and protection are confirmed. Current CLI context is `omarhussien2`, and `vercel teams ls` does not show `samawahs-projects`.

## Local Verification

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

## Out Of Scope

- Production deployment.
- Real client data.
- New dependencies.
- Product feature expansion.
- Database schema changes in this branch.
- Kanban, files, comments, approvals, social scheduling, AI, background jobs.
- `RoleKey` changes or standalone `project_manager` role.
