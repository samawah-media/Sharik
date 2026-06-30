# Evidence Checklist: Internal Online MVP UAT

Date: 2026-06-30

This checklist separates local evidence from hosted evidence. Do not mark hosted checks as passed unless they were run against the approved hosted environment.

## Hosted UAT Results - 2026-06-30

Current result:

- Supabase project ref `jnvuccapgsabrwwkxnbh` resolves to `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`; this was treated as the approved non-production UAT target.
- Pre-migration checks found 0 auth users, 0 non-R-004 auth users, and 0 public base tables.
- `db push --linked --dry-run` listed 11 local migrations and `db push --linked` applied them to the hosted UAT target.
- `migration list --linked` now shows all 11 local migrations matched on remote.
- Only `supabase/seeds/r004_internal_online_mvp_uat.sql` was used for hosted UAT; `supabase/seed.sql` was not used.
- The hosted seed was applied through the Supabase pooler after direct database-host DNS resolution failed inside Docker.
- Post-seed counts: 5 synthetic auth users, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, 0 non-R-004 auth users, and 0 non-R-004 clients.
- Vercel project `sharik-platform` is linked and deployed to Vercel Production as hosting-only, not Production acceptance.
- Deployment id `dpl_D3QBhGPnecEcoHtf223NvGNBVosL` is Ready with alias `https://sharik-platform.vercel.app`.
- Vercel production env key names are `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; no service role env was set or printed.
- Smoke checks for `/`, `/sign-in`, `/clients?actor=tenant_admin_a`, and `/client/commercial?actor=client_viewer_a` returned HTTP 200 and did not expose fixture client names or service-role/secret markers in HTML.
- Hosted RLS count simulation passed for scoped access: account-manager Alpha sees 1 client and 6 deliverables; Alpha/Beta client viewers each see 1 client and 0 management deliverables.
- Full interactive browser UAT is still blocked because the synthetic hosted users currently have no approved temporary password/sign-in path.
- Supabase CLI temp login briefly hit a pooler authentication circuit breaker after parallel RLS checks; this affected one tenant-admin simulation retry only and did not change migration/seed results.
- `SUPABASE_DB_PASSWORD` and `PGPASSWORD` were confirmed not set in the shell environment after hosted operations.

## Baseline

| ID | Check | Status | Evidence |
|---|---|---:|---|
| BASE-001 | PR #17 merged to `main` | PASS | `gh pr view 17` reported `MERGED` at `2026-06-29T12:30:38Z`, merge commit `6c406049203230c6b7e34eb0708bac0f82c981f8`. |
| BASE-002 | UAT branch isolated after PR #17 | PASS | Branch/worktree `codex/internal-online-mvp-uat` at PR #17 merge commit. |
| BASE-003 | `AGENTS.md` and project progress reviewed | PASS | Reviewed before edits. |
| BASE-004 | Hosted Supabase approval | PASS | Owner supplied project ref `jnvuccapgsabrwwkxnbh` on 2026-06-30 after the earlier placeholder blocker. |
| BASE-005 | Owner-approved Vercel deployment | PASS | Vercel project `sharik-platform` is linked under the owner-approved Hobby/free path; deployment `dpl_D3QBhGPnecEcoHtf223NvGNBVosL` is Ready with alias `https://sharik-platform.vercel.app`. |
| BASE-006 | Spec Kit prerequisite check on `codex/*` branch | PASS | `check-prerequisites.ps1` now honors `.specify/feature.json` when it pins the active feature directory. |
| BASE-007 | PR #18 through PR #21 merged on `main` | PASS | `origin/main` is `86119ca350811511dfdc81403a5ae6548e0caf7f`; log shows PR #18, PR #19, PR #20, and PR #21 merged. |
| BASE-008 | CI/checks for latest `main` merge commit | NOT RUN | PR #22 merge commit `20b84984913e8f707fcf5dabad54eea5b03eff64` has zero GitHub check-runs and no combined status contexts. |
| BASE-009 | Owner decision: Vercel Hobby/free | PASS | Owner confirmed on 2026-06-30 that Vercel may be used without a paid Team scope. |
| BASE-010 | Owner decision: Vercel Production hosting target | PASS | Owner confirmed on 2026-06-30 that Vercel Production target may be used; evidence labels this as hosting-only, not Production acceptance. |
| BASE-011 | Supabase UAT availability | PASS | Project ref `jnvuccapgsabrwwkxnbh` is visible to the local Supabase CLI account; project metadata says `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`. |
| BASE-012 | PR #22 review checks | PASS | PR #22 had `quality` and `CodeRabbit` passing before merge, then merged on 2026-06-30 with merge commit `20b84984913e8f707fcf5dabad54eea5b03eff64`. |

## Supabase Access Attempt - 2026-06-30

| ID | Command | Status | Notes |
|---|---|---:|---|
| SUPA-001 | `npx supabase@2.107.0 --version` with telemetry disabled | PASS | CLI reported `2.107.0`. |
| SUPA-002 | `npx supabase@2.107.0 orgs list` | PASS | Current CLI account can list organizations, confirming the CLI is authenticated to an account. |
| SUPA-003 | `npx supabase@2.107.0 projects list` | PASS | Target ref `jnvuccapgsabrwwkxnbh` is visible under the current CLI account as `sharik-uat`, `eu-west-1`, `ACTIVE_HEALTHY`. |
| SUPA-004 | `npx supabase@2.107.0 link --project-ref jnvuccapgsabrwwkxnbh` | PASS | Link returned the target project ref without printing secrets. |
| SUPA-005 | Target non-production metadata verification | PASS | Metadata supports UAT intent: project name is `sharik-uat`; no Production project was selected. |
| SUPA-006 | Hosted schema metadata inspection | PASS | `db query --linked` listed Supabase-managed auth base tables only before hosted migration; no Sharik public client tables were present. |
| SUPA-007 | Hosted auth/user count inspection | PASS | Pre-migration count check found 0 auth users and 0 non-R-004 auth users; post-seed count check found 5 synthetic auth users and 0 non-R-004 auth users. |
| SUPA-008 | Local DB password cleanup | PASS | `SUPABASE_DB_PASSWORD` and `PGPASSWORD` were confirmed not set after hosted operations; no DB password was printed or stored. |

## Hosted Supabase Migration And Seed - 2026-06-30

| ID | Command | Status | Notes |
|---|---|---:|---|
| SUPA-HOST-001 | No-real-data precheck | PASS | Counts only: 0 auth users, 0 non-R-004 auth users, and 0 public base tables before migration. |
| SUPA-HOST-002 | `npx supabase@2.107.0 migration list --linked` before migration | PASS | All 11 migrations were local-only before `db push`. |
| SUPA-HOST-003 | `npx supabase@2.107.0 db push --linked --dry-run` | PASS | Dry-run listed exactly the 11 expected F-001/F-002 migrations. |
| SUPA-HOST-004 | `npx supabase@2.107.0 db push --linked` | PASS | Hosted non-production migration completed. A non-blocking pg-delta catalog cache certificate warning appeared after migration. |
| SUPA-HOST-005 | `npx supabase@2.107.0 migration list --linked` after migration | PASS | Local and remote migration lists match for all 11 migrations. |
| SUPA-HOST-006 | Apply `supabase/seeds/r004_internal_online_mvp_uat.sql` only | PASS | Direct database-host seed attempt failed on Docker DNS; pooler seed succeeded with `SEED_POOLER_EXIT=0`. `supabase/seed.sql` was not used. |
| SUPA-HOST-007 | Post-seed counts | PASS | 5 auth users, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, 0 non-R-004 auth users, and 0 non-R-004 clients. |
| SUPA-HOST-008 | RLS scoped access count simulation | PASS | Account-manager Alpha sees 1 client and 6 deliverables; Alpha/Beta client viewers each see 1 client and 0 management deliverables. Tenant-admin simulation retry was blocked by a temporary pooler auth circuit breaker. |

## Vercel Readiness - 2026-06-30

| ID | Command | Status | Notes |
|---|---|---:|---|
| VERCEL-001 | `vercel --version` | PASS | Vercel CLI reported `50.11.0`. |
| VERCEL-002 | `vercel whoami` | PASS | CLI is authenticated as `omarhussien2`. |
| VERCEL-003 | `.vercel/project.json` link check | PASS | Project `sharik-platform` is linked; project/org ids were recorded without secrets. |
| VERCEL-004 | `vercel env list production --format json` | PASS | Production env key names only: `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; values remain encrypted and were not printed. |
| VERCEL-005 | Vercel env readiness | PASS | Hosted runtime uses UAT Supabase public URL/publishable key only; no service role key was set. |
| VERCEL-006 | Vercel deploy | PASS | `vercel deploy --prod --yes` produced Ready deployment `dpl_D3QBhGPnecEcoHtf223NvGNBVosL`; alias `https://sharik-platform.vercel.app`. |

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
| HOST-001 | Vercel account approved | PASS | `vercel whoami` reports `omarhussien2` under the owner-approved Hobby/free path. |
| HOST-002 | Protection/public exposure status recorded | PASS | Free Vercel deployment is publicly reachable; evidence records public exposure limitation before team sharing. |
| HOST-003 | Vercel env vars avoid Production Supabase/real data | PASS | Env key names reviewed; values are encrypted. No service role env exists and hosted data is R-004 synthetic-only. |
| HOST-004 | Vercel Production target hosting-only evidence | PASS | Deployment target is production, explicitly recorded as hosting-only and not Production acceptance. |
| HOST-005 | Hosted Supabase project non-production | PASS | Ref `jnvuccapgsabrwwkxnbh` resolves to project `sharik-uat`; link succeeds under the current CLI account. |
| HOST-006 | Hosted migration applied | PASS | Hosted non-production migration applied after no-real-data verification; local/remote migration lists match. |
| HOST-007 | Synthetic seed prepared | PASS | Dedicated guarded seed added at `supabase/seeds/r004_internal_online_mvp_uat.sql`; it is separate from `supabase/seed.sql`. |
| HOST-008 | Synthetic seed applied | PASS | Only `supabase/seeds/r004_internal_online_mvp_uat.sql` was applied to hosted UAT through the pooler; `supabase/seed.sql` was not used. |
| HOST-009 | Hosted target has no real client data/users | PASS | Counts show 0 non-R-004 auth users and 0 non-R-004 clients after seed. |

## Smoke Checks

| ID | Check | Status | Notes |
|---|---|---:|---|
| SM-001 | Vercel URL responds | PASS | `https://sharik-platform.vercel.app/` returned HTTP 200. |
| SM-002 | Sign-in surface loads | PASS | `/sign-in` returned HTTP 200. |
| SM-003 | Hosted fixture actors disabled | PASS | Fixture query routes returned sign-in/session surface and did not expose fixture client names. |
| SM-004 | Runtime health on accepted surfaces | PASS | Root/sign-in/guarded routes returned HTTP 200; authenticated full-surface UAT remains blocked pending synthetic sign-in credentials. |
| SM-005 | Browser response does not expose secrets | PASS | HTML checks found no `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, or `sb_secret` markers. |

## Security Checks

| ID | Check | Status | Notes |
|---|---|---:|---|
| SEC-001 | Client Alpha user cannot access Client Beta data | PASS | Hosted RLS count simulation: account-manager Alpha sees 1 client and 6 Alpha deliverables only; client viewers see one scoped client and zero management deliverables. |
| SEC-002 | Client user cannot access management-only surfaces | PASS | Client viewer Alpha and Beta each see 0 management deliverables through hosted RLS simulation; hosted browser routes redirect unauthenticated requests to sign-in/session. |
| SEC-003 | Unauthorized deliverable/SLA access denies safely | PASS | Client viewer hosted RLS simulation returns 0 deliverables without enumerating other client resources. |
| SEC-004 | Service role not exposed in browser | PASS | HTML scans on hosted routes found no service-role or secret markers. |
| SEC-005 | No real client data in seed/screenshots | PASS | Hosted seed/count evidence remains synthetic-only with 0 non-R-004 users/clients; no screenshots with real data were used. |
| SEC-006 | Seed refuses non-R-004 client/auth data | PASS | Seed guards abort when existing client/auth data is outside the approved synthetic R-004 fixture set. |

## UAT Checks

| ID | Surface | Status | Notes |
|---|---|---:|---|
| UAT-001 | Client management | BLOCKED | Hosted migration/seed complete, but full browser UAT requires approved synthetic sign-in credentials; unauthenticated hosted route redirects safely. |
| UAT-002 | Contracts | BLOCKED | Hosted migration/seed complete, but authenticated browser UAT remains blocked until synthetic sign-in credentials are approved. |
| UAT-003 | Packages | BLOCKED | Hosted migration/seed complete, but authenticated browser UAT remains blocked until synthetic sign-in credentials are approved. |
| UAT-004 | Deliverables | BLOCKED | Hosted migration/seed complete and RLS count simulation passed; full browser UAT remains blocked until synthetic sign-in credentials are approved. |
| UAT-005 | Commercial summaries | BLOCKED | Hosted migration/seed complete, but authenticated browser UAT remains blocked until synthetic sign-in credentials are approved. |
| UAT-006 | SLA MVP summaries | BLOCKED | Hosted migration/seed complete, but authenticated browser UAT remains blocked until synthetic sign-in credentials are approved. |
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
