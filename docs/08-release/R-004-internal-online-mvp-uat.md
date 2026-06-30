# R-004 Internal Online MVP UAT

## Status

HOSTED UAT EVIDENCE READY - PRODUCTION HOSTING ONLY - INTERACTIVE SIGN-IN UAT LIMITED

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
- PR #22 status: merged on 2026-06-30; merge commit `20b84984913e8f707fcf5dabad54eea5b03eff64`; `quality` and `CodeRabbit` were passing before merge.
- Hosted UAT results branch: `codex/r004-hosted-uat-results`
- Hosted UAT resume branch: `codex/r004-hosted-uat-evidence`
- Hosted UAT access branch: `codex/r004-hosted-uat-run`
- Spec Kit package: `specs/004-internal-online-mvp-uat/`
- R-004B owner decision: Vercel Hobby/free accepted; Vercel Production target accepted as hosting-only; Supabase deferred because no new Sharik Supabase project exists yet.
- R-004C owner supplied Supabase project ref `jnvuccapgsabrwwkxnbh`, but current Supabase CLI account lacks privileges for the target project.
- R-004D owner logged the machine into Supabase; project `sharik-uat` is visible and link succeeds.
- R-004E confirmed Vercel CLI was authenticated as `omarhussien2` and recorded the pre-deploy blocker.
- R-004F completed hosted Supabase no-real-data checks, hosted migration, guarded R-004 seed, Vercel Production hosting-only deploy, smoke checks, and limited hosted security checks.

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
| Latest `main` CI/checks | NOT RUN | GitHub check-runs for PR #22 merge commit `20b84984913e8f707fcf5dabad54eea5b03eff64` returned zero checks and no status contexts. |
| PR #22 checks | PASS | PR #22 had `quality` and `CodeRabbit` passing before merge. |
| PR #22 merged | PASS | PR #22 merged into `main` with merge commit `20b84984913e8f707fcf5dabad54eea5b03eff64`. |
| Vercel Hobby/free owner decision | PASS | Owner confirmed paid Team scope is not required for this stage. |
| Vercel Production hosting-only target | PASS | Owner approved Vercel Production target as hosting only, not Production acceptance. |
| Hosted Supabase approval | PASS | Owner supplied project ref `jnvuccapgsabrwwkxnbh` on 2026-06-30. |
| Hosted Supabase target metadata verification | PASS | Project ref `jnvuccapgsabrwwkxnbh` resolves to `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`; `supabase link` succeeds. |
| Hosted Supabase no-real-data verification | PASS | Pre-migration counts showed 0 auth users, 0 non-R-004 auth users, and 0 public base tables. |
| Hosted Supabase migration | PASS | `db push --linked` applied 11 migrations; local/remote migration lists now match. |
| Hosted R-004 seed | PASS | Only `supabase/seeds/r004_internal_online_mvp_uat.sql` was applied; post-seed counts show expected synthetic data and 0 non-R-004 users/clients. |
| Vercel account check | PASS | Vercel CLI `50.11.0` is authenticated as `omarhussien2`. |
| Vercel project link | PASS | `.vercel/project.json` links project `sharik-platform`. |
| Vercel deploy | PASS | Deployment `dpl_D3QBhGPnecEcoHtf223NvGNBVosL` is Ready with alias `https://sharik-platform.vercel.app`; target is production hosting-only. |
| Hosted smoke/security checks | PASS | Root/sign-in/guarded routes return HTTP 200, fixture routes do not expose fixture data, HTML exposes no service-role/secret markers, and RLS count simulation passed for scoped users. |
| Hosted authenticated UAT checks | BLOCKED | Synthetic users have no approved temporary password/sign-in path yet, so full browser UAT for accepted MVP surfaces remains blocked. |
| R-004 synthetic seed preparation | PASS | Guarded seed prepared and applied at `supabase/seeds/r004_internal_online_mvp_uat.sql`; `supabase/seed.sql` was not used. |

## Hosted Execution - 2026-06-30

- Supabase target: project ref `jnvuccapgsabrwwkxnbh`, project name `sharik-uat`, region `eu-west-1`, status `ACTIVE_HEALTHY`.
- Pre-migration verification: 0 auth users, 0 non-R-004 auth users, and 0 public base tables.
- Migration dry-run: 11 expected local migrations.
- Migration apply: completed against the hosted non-production UAT target; a pg-delta catalog cache certificate warning appeared after migration and did not stop `db push`.
- Post-migration verification: local and remote migration lists match.
- Seed: applied only `supabase/seeds/r004_internal_online_mvp_uat.sql` through the Supabase pooler after Docker DNS could not resolve the direct database host.
- Post-seed counts: 5 synthetic auth users, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, 0 non-R-004 auth users, and 0 non-R-004 clients.
- Vercel env: production key names only are `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; no service role env was set or printed.
- Vercel deployment: `dpl_D3QBhGPnecEcoHtf223NvGNBVosL`, Ready, production hosting-only, alias `https://sharik-platform.vercel.app`.
- Smoke/security: `/`, `/sign-in`, `/clients?actor=tenant_admin_a`, and `/client/commercial?actor=client_viewer_a` returned HTTP 200 and did not expose fixture client names or service-role/secret markers.
- Hosted RLS count simulation: account-manager Alpha sees 1 client and 6 deliverables; Alpha/Beta client viewers each see 1 client and 0 management deliverables.

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

- Full authenticated browser UAT is blocked until an approved temporary password/sign-in path exists for the synthetic hosted users.
- `paused_waiting_internal_decision` cannot be represented as hosted persisted seed data in the current MVP because no SLA segment table exists yet; it remains domain/unit evidence only.
- Free Vercel deployment is publicly reachable; use it for internal UAT only and avoid real data.
- Supabase CLI temp login hit a temporary pooler auth circuit breaker after parallel RLS checks; one tenant-admin simulation retry was not completed, but migration/seed/count evidence remains complete.
- Synthetic hosted users were seeded without passwords by design; do not treat hosted browser UAT as complete until credentials are created through an approved secure process.

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
