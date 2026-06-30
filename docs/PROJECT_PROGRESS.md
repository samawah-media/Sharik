# Project Progress

Last updated: 2026-06-30

## Current Execution Gate

| Item | Value |
|---|---|
| Product name | `Sharik` |
| Package slug | `sharik-platform` |
| Feature | R-004 Internal Online MVP UAT |
| Worktree | `D:\code - projects\sharik-worktrees\r004-hosted-uat` |
| Branch | `codex/r004-hosted-uat-evidence` from PR #19 merge commit on `origin/main` |
| Current allowed stage | Update R-004 gates for owner-approved Vercel Hobby/free and Production hosting target; Supabase remains deferred |
| Status | PR #18 and PR #19 are merged on `main`; owner clarified no Sharik Supabase project exists yet, approved Vercel Hobby/free, and approved Vercel Production target for hosting only |
| Next gate | Run/record Vercel account/project/deployment checks when ready; Supabase migration/seed remains blocked until a Supabase UAT project exists |
| Owner decision required | Required before hosted Supabase migration or synthetic hosted seed; Vercel Hobby/free and Production hosting-only target are already owner-approved |

## R-004B Free Vercel And Supabase Deferral Decision - 2026-06-30

Owner clarification:

- There is no new Sharik Supabase project yet, so no Supabase project ref can be provided now.
- Vercel Team/paid scope is not required for this stage.
- Vercel Hobby/free is approved for Sharik UAT.
- Vercel Production target is approved as a hosting target only.

Scope impact:

- R-004 docs now distinguish Vercel Production hosting from Production acceptance.
- Vercel Production hosting does not authorize Production Supabase, real client data, production data, or marking Sharik production-accepted.
- Hosted Supabase migration, R-004 hosted synthetic seed, and data-backed smoke/security/UAT checks remain blocked until a Supabase UAT project exists and receives explicit approval.
- Vercel checks can proceed without a paid team scope by verifying the owner-approved account with `vercel whoami`, linking a project, recording env/protection/public-exposure status, deployment URL/id/target, and rollback path.
- If Vercel free protection is unavailable, the public exposure limitation must be recorded before sharing the URL.

## R-004 Hosted UAT Resume Attempt - 2026-06-29

Scope reviewed:

- PR #18, `chore(R-004): prepare internal online MVP UAT gate`, is merged on `main` with merge commit `9dac378d7d97d9ee3edcd5b6d9f551f7bf78300e`.
- PR #19, `chore(R-004): fix UAT gate follow-up blockers`, is merged on `main` with merge commit `466b9eddbbcd2465fb2106907b4b38fb0880196c`.
- Local R-004 resume branch `codex/r004-hosted-uat-evidence` starts from `origin/main` at `466b9ed`.
- GitHub check-runs for `466b9ed` returned zero checks and the combined commit status has no contexts; the latest visible `main` Actions run is older than PR #18/#19.

Hosted Supabase result:

- H1 did not pass: the supplied project ref was `REAL_PROJECT_REF_HERE`, which is not a valid Supabase project ref format.
- Because the target could not be verified, no hosted Supabase link, migration, SQL execution, hosted seed, or real-data inspection was attempted.
- The target cannot be recorded as non-production or free of real client data/users until a valid non-production project ref and approved connection path are provided.
- R-004 hosted UAT remains restricted to `supabase/seeds/r004_internal_online_mvp_uat.sql` only after a future valid target is approved and verified; `supabase/seed.sql` remains prohibited for R-004 hosted UAT.

Earlier Vercel deployment blocker, superseded by R-004B:

- Vercel CLI `whoami` returns `omarhussien2`.
- The earlier run treated missing paid/team scope as a blocker.
- No `.vercel/project.json` link exists in the R-004 resume worktree.
- The 2026-06-30 owner decision now allows Vercel Hobby/free and a Production hosting-only target; deployment still needs fresh account/project/target evidence.

Hosted smoke/security/UAT evidence:

- Smoke checks remain `NOT RUN` because no owner-approved Vercel deployment URL exists.
- Hosted security and UAT checks remain `BLOCKED` because no valid hosted Supabase target was verified and no synthetic hosted seed was applied.
- No Production Supabase project, real client data, Production acceptance, new dependency, RoleKey change, standalone `project_manager` role, Kanban/files/comments/approvals/social scheduling/AI scope, or PR merge was introduced.

Resume validation:

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

## R-004A UAT Gate Follow-up Corrections - 2026-06-29

Scope corrected:

- PR #18, `chore(R-004): prepare internal online MVP UAT gate`, is now merged into `main`.
- Follow-up branch `codex/r004-uat-gate-follow-up` starts from the PR #18 merge commit.
- `.specify/scripts/powershell/check-prerequisites.ps1` now honors `.specify/feature.json` when it pins the active feature directory, matching existing `setup-plan.ps1` and `setup-tasks.ps1` behavior.
- Dedicated guarded R-004 hosted UAT seed prepared at `supabase/seeds/r004_internal_online_mvp_uat.sql`.
- R-004 hosted UAT must use the dedicated seed, not the older local `supabase/seed.sql`.
- The seed includes Client Alpha/Beta synthetic data, approved existing roles only, contracts, packages, deliverables, commercial-summary data, and currently persistable SLA cases.
- `paused_waiting_internal_decision` is not represented as hosted persisted seed data because the accepted current MVP has no persisted SLA segment table; it remains covered by F-003 domain/unit evidence until a future approved schema change.

Current blocker:

- The approval text received still contains the literal `<PROJECT_REF>` placeholder. H1 remains `BLOCKED`; no hosted Supabase link, migration, seed, or deployment was run.

Verification:

- `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`: passed and resolved `specs/004-internal-online-mvp-uat`.
- `git diff --check`: passed; line-ending warnings only.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed.
- Local R-004 seed apply via `psql` inside `supabase_db_sharik-platform`: passed with `ON_ERROR_STOP=1`.
- Local R-004 seed idempotency re-run: passed; append-only ledger conflicts were skipped with `ON CONFLICT DO NOTHING`.
- Local R-004 seed row counts: 2 clients, 5 auth users, 2 contracts, 2 packages, 2 package lines, 7 deliverables, 6 Client Alpha deliverables, and 1 Client Beta deliverable.

Out of scope confirmed:

- Production acceptance.
- Production Supabase usage.
- Real client data.
- New dependencies.
- Product feature expansion.
- Database schema changes or migrations.
- Kanban, files, comments, approvals, social scheduling, AI, background jobs.
- `RoleKey` changes or adding standalone `project_manager`.

## R-004 Internal Online MVP UAT Prep - 2026-06-29

Scope prepared:

- PR #17, `feat(F-003): implement SLA MVP foundation`, was merged into `main` before this branch started.
- PR #17 merge commit verified: `6c406049203230c6b7e34eb0708bac0f82c981f8`.
- Branch `codex/internal-online-mvp-uat` starts from `origin/main` after PR #17.
- Spec Kit package created at `specs/004-internal-online-mvp-uat/`.
- Release gate record created at `docs/08-release/R-004-internal-online-mvp-uat.md`.
- Least internal online MVP UAT initially defined as Vercel deployment plus synthetic non-production data for accepted existing surfaces only.

Gates and blockers:

- Hosted non-production Supabase migration is `BLOCKED` until explicit owner approval names or confirms the non-production target and synthetic-only data policy.
- Data-backed hosted UAT checks are `BLOCKED` until hosted migration and synthetic seed are approved and completed.
- Earlier Vercel deployment was `BLOCKED` under the then-required paid/team scope assumption; this is superseded by the 2026-06-30 owner decision allowing Vercel Hobby/free.
- Local evidence remains separate from hosted UAT evidence.

Local verification:

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

Out of scope confirmed:

- Production acceptance.
- Production Supabase usage.
- Real client data.
- New dependencies.
- Product feature expansion.
- Database schema changes in this branch.
- Kanban, files, comments, approvals, social scheduling, AI, background jobs.
- `RoleKey` changes or adding standalone `project_manager`.
- Merging the UAT PR without review.

## F-003 SLA MVP Implementation PR Prep - 2026-06-29

Scope implemented:

- Branch `codex/f003-sla-mvp-implementation` starts from PR #16 merge commit `05290b737a2d28af59dcb6b77677c37ebe4ccb9d` on `origin/main`.
- Deterministic SLA status foundation for deliverables: `on_track`, `at_risk`, `overdue`, `paused_waiting_client`, `paused_waiting_internal_decision`, `completed`, and `cancelled`.
- Owner-approved F-003 MVP `at_risk` policy: active Samawah-owned work is `at_risk` when the applicable due boundary is 24 hours or less away and not overdue; date-only due dates normalize to the end of the UTC day.
- Client-waiting timeline attribution is separated from Samawah running time, and internal-decision waiting is tracked separately from client waiting.
- Management SLA summaries use tenant/client scoped deliverable reads, existing role/permission primitives, and deny unauthorized or client-facing users without resource enumeration.
- Pause/resume audit expectations are represented through scoped audit event builders and metadata.

Verification:

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:unit`: passed, 23 files / 72 tests.
- `npm run test:integration`: passed, 19 files / 76 tests.
- `npm run build`: passed.
- `npm run test:rls`: not run because this branch does not touch DB/RLS/migrations or the permission catalog.

Out of scope confirmed:

- Production/staging migration.
- Hosted/staging migration.
- Production usage.
- Real client data.
- New dependencies.
- `RoleKey` changes or standalone `project_manager` role.
- Kanban, files, comments, approvals workflow, background jobs, persisted SLA engine, social scheduling, or AI generation.

## PR #15 Merge And F-003 SLA MVP Spec Gate Prep - 2026-06-29

Scope recorded:

- PR #15, `chore(F-002): update project progress after verification evidence`, was merged into `main` before this F-003 preparation branch started.
- This update changes `docs/PROJECT_PROGRESS.md` and adds documentation-only Spec Kit starter files under `specs/003-sla-mvp/`.
- The F-003 work in this branch is Spec Kit preparation only. It does not add implementation, migrations, dependencies, runtime behavior, or hosted changes.

F-002 gate status:

- F-002 remains review-ready for owner review only.
- F-002 is not production accepted unless an explicit written owner approval exists.
- Hosted/non-production staging migration has not been run.
- Production usage and real client data remain out of scope.
- Local F-002 evidence must not be reused as hosted staging evidence or production acceptance.

Next proposed phase:

- The next proposed step is F-003 SLA MVP Spec only.
- F-003 implementation must not start from this PR.
- A separate owner-approved gate is required before any F-003 code, SLA engine, migration, hosted/staging migration, production usage, or real client data.

Out of scope confirmed:

- F-003 implementation.
- SLA engine.
- Background jobs.
- Migrations.
- Dependency changes.
- Kanban.
- Files.
- Comments.
- Approvals.
- Hosted/staging migration.
- Production usage.
- Real client data.
- `RoleKey` changes or adding `project_manager` as a standalone role.

## F-002E Verification Evidence Merge and Review-Ready Status - 2026-06-29

Scope recorded:

- PR #13 / F-002E Verification Evidence and Traceability was merged into `main` before this progress update.
- F-002E evidence documents local review-readiness verification and traceability for F-002.
- This progress update changes `docs/PROJECT_PROGRESS.md` only and does not add features, migrations, dependencies, or product behavior.

F-002 status:

- F-002 is review-ready for owner review based on the merged F-002E local evidence.
- F-002 is not production accepted and must not be treated as final production acceptance.
- Hosted/non-production staging migration has not been run.
- Production Supabase usage and real client data remain out of scope.
- Staging, production, and real client data use require a separate owner-approved gate and a separate evidence update.

Evidence basis:

- F-002E recorded passing local `npm run test:unit`, `npm run test:integration`, `npm run test:rls`, `npm run test:component`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, `npm run secret:scan`, `npm audit --audit-level=high`, and `npm run build`.
- F-002E recorded no CRITICAL or HIGH known blockers in the local security review evidence.
- The evidence remains local review-readiness evidence only; it is not hosted staging evidence and is not production acceptance.

Next proposed phase:

- This section is superseded by the PR #15 merge note above for the immediate next step.
- The next proposed step is F-003 SLA MVP Spec only.
- F-003 implementation must not start until the owner explicitly approves crossing the F-002 review gate and separately approves the F-003 implementation gate.

Out of scope confirmed:

- Production acceptance.
- Hosted staging migration.
- Production usage.
- Real client data.
- Kanban.
- Files.
- Comments.
- Approvals.
- SLA engine or F-003 implementation.
- Dependency changes.
- Migrations.
- `RoleKey` changes or adding `project_manager` as a standalone role.

## F-002D Reservation Release and Scope-Safe Summaries - 2026-06-29

Scope implemented:

- PR #11 / F-002C Deliverable Creation and Package Reservation was merged into `main` before starting F-002D.
- Not-started deliverable cancellation eligibility, safe cancellation command, server action, and Arabic RTL cancellation control rendered only for eligible reserved `not_started` deliverables.
- Reservation release through the reviewed command/RPC path with actor authorization, tenant/client/contract/package/package-line validation, expected status/revision checks, idempotency key handling, append-only `reservation_released` package ledger entry, released allocation status, and audit events.
- Safe denial handling for progressed, invalid, stale, unreserved, and cross-scope cancellation attempts without leaking internal implementation details.
- Management and client commercial summary read models and Arabic RTL summary cards/pages.
- Deliverable safe summary read model for management/client-safe presentation.
- RLS simulator and pgTAP coverage for safe summary access and direct raw-row denial expectations.

Owner decision applied:

- For F-002D only, `project_manager` authority continues to be represented by existing `tenant_administrator` authority where management authority is needed.
- `project_manager` was not added to `RoleKey`.
- No new dependency, ADR, hosted migration, production migration, real client data, Kanban, files, comments, approvals, or SLA engine was introduced.

Verification:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 22 files / 65 tests.
- `npm run test:integration`: passed, 18 files / 73 tests.
- `npm run test:rls`: passed; simulator 7 files / 21 tests and pgTAP 2 files / 110 tests.
- `npm run test:component`: passed, 12 files / 39 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; routes include `/clients/[clientId]/commercial` and `/client/commercial`.
- Targeted `npm run test:e2e -- tests/e2e/commercial/commercial-summary.spec.ts`: passed, 9 tests across desktop, mobile, and RTL projects.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed after applying the F-002D migration locally.

Out of scope confirmed:

- F-002 full acceptance.
- Kanban.
- Files.
- Comments.
- Approvals.
- SLA engine.
- Hosted migration.
- Production usage.
- Real client data.
- Dependency changes.
- `RoleKey` changes or adding `project_manager` as a standalone role.

## F-002C Deliverable Creation and Package Reservation - 2026-06-28

Scope implemented:

- PR #10 / F-002B Package Commitments and Balance Projection was merged into `main` before starting F-002C.
- Deliverable repository and safe deliverable summary mapper for tenant/client-scoped deliverable records and allocations.
- Server-side in-package deliverable command with Zod validation, actor authorization, tenant/client/contract/package/package-line scope validation, package capacity validation, idempotency key handling, deliverable allocation, append-only `quantity_reserved` package ledger entry, audit event, and audit-failure rollback.
- Server-side approved extra deliverable command with administrative authority, required explicit reason, no package reservation by default, idempotency key handling, and audit event.
- Supabase migration `20260628135816_f002c_deliverable_reservation.sql` for `deliverables.idempotency_key`, reviewed deliverable reservation RPC, reviewed approved-extra RPC, and F-002C pgTAP coverage.
- Arabic RTL deliverable create/list UI under `/clients/[clientId]/deliverables` and `/clients/[clientId]/deliverables/new` with reservation impact preview, over-capacity recovery copy, denied/empty states, and no Kanban/workflow actions.
- Client detail page links to scoped deliverables only when the actor has the existing scoped view permission.

Owner decision applied:

- For F-002C only, `project_manager` authority continues to be represented by existing `tenant_administrator` authority.
- `project_manager` was not added to `RoleKey`.
- No new role, dependency, ADR, production migration, hosted migration, or real client data was introduced.

Verification:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 22 files / 65 tests.
- `npm run test:integration`: passed, 16 files / 65 tests.
- `npm run test:rls`: passed; simulator 6 files / 19 tests and pgTAP 2 files / 100 tests.
- `npm run test:component`: passed, 10 files / 34 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; routes include `/clients/[clientId]/deliverables` and `/clients/[clientId]/deliverables/new`.
- Targeted `npm run test:integration -- tests/integration/deliverables/deliverable-creation.test.ts`: passed, 1 file / 7 tests.
- Targeted `npm run test:component -- tests/component/deliverables/deliverable-form.test.tsx`: passed, 1 file / 5 tests.
- `npx supabase@2.107.0 db reset --local`: passed after applying the F-002C migration locally.

Out of scope confirmed:

- F-002 full acceptance.
- Cancellation or reservation release; this remains F-002D.
- Kanban.
- Files.
- Comments.
- Approvals.
- SLA engine.
- Hosted migration.
- Production usage.
- Real client data.
- Dependency changes.
- `RoleKey` changes or adding `project_manager` as a standalone role.

## F-002B Package Commitments and Balance Projection - 2026-06-28

Scope implemented:

- PR #9 / F-002A Contract Context was merged into `main` before starting F-002B.
- Package repository for packages, package lines, append-only package ledger entries, and safe balance summaries.
- Server-side create package command with Zod validation, actor authorization, tenant/client/contract scope validation, idempotency key handling, commitment ledger entries, audit event, and audit-failure rollback.
- Server-side package adjustment command with required reason, capacity guard, idempotency key handling, administrative adjustment ledger entry, and audit event.
- Supabase migration `20260628125542_f002b_package_commitments.sql` for `packages.idempotency_key`, reviewed package create/adjust RPC paths, and package line balance projection.
- Arabic RTL package create/list UI under `/clients/[clientId]/contracts/[contractId]/packages` and `/clients/[clientId]/contracts/[contractId]/packages/new`.

Owner decision applied:

- For F-002B only, `project_manager` authority continues to be represented by existing `tenant_administrator` authority.
- `project_manager` was not added to `RoleKey`.
- No new dependency, ADR, production migration, hosted migration, or real client data was introduced.

Verification:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 22 files / 65 tests.
- `npm run test:integration`: passed, 15 files / 58 tests.
- `npm run test:rls`: passed; simulator 6 files / 19 tests and pgTAP 2 files / 85 tests.
- `npm run test:component`: passed, 9 files / 29 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; routes include `/clients/[clientId]/contracts/[contractId]/packages` and `/clients/[clientId]/contracts/[contractId]/packages/new`.
- Targeted `npm run test:integration -- tests/integration/packages/package-management.test.ts`: passed, 1 file / 8 tests.
- Targeted `npm run test:component -- tests/component/packages/package-form.test.tsx tests/component/contracts/contract-form.test.tsx`: passed, 2 files / 9 tests.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed after applying the F-002B migration.
- `npm run test:rls:db`: passed, 2 pgTAP files / 85 tests.

Out of scope confirmed:

- F-002 full acceptance.
- Deliverables creation.
- Kanban.
- Files.
- Comments.
- Approvals.
- SLA engine.
- Hosted migration.
- Production usage.
- Real client data.
- Dependency changes.

## F-002A Contract Context - 2026-06-28

Scope implemented:

- Scoped contract repository and safe contract summary mapper.
- Server-side create contract command with Zod validation, actor authorization, tenant/client scope validation, idempotency key handling, required audit event, and audit-failure rollback.
- Supabase migration `20260628120805_f002a_contract_context.sql` for `contracts.idempotency_key`, unique tenant idempotency index, and audited `f002_create_contract_context` RPC.
- Direct authenticated writes to F-002 tables remain closed; contract creation is through the reviewed RPC/command path only.
- Arabic RTL contract create/list UI under `/clients/[clientId]/contracts` and `/clients/[clientId]/contracts/new`.
- Client detail page links to scoped contracts only when `CONTRACT_VIEW` is allowed.

Owner decision applied:

- For F-002A only, `project_manager` authority is represented by existing `tenant_administrator` authority.
- `project_manager` was not added to `RoleKey`.
- No new role, dependency, ADR, production migration, hosted migration, or real client data was introduced.

Verification:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 22 files / 65 tests.
- `npm run test:integration`: passed, 14 files / 50 tests.
- `npm run test:rls`: passed; simulator 6 files / 19 tests and pgTAP 2 files / 75 tests.
- `npm run test:component`: passed, 8 files / 24 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; routes include `/clients/[clientId]/contracts` and `/clients/[clientId]/contracts/new`.

Out of scope confirmed:

- F-002 full acceptance.
- Packages implementation.
- Deliverables creation.
- Kanban.
- Files.
- Comments.
- Approvals.
- SLA engine.
- Hosted migration.
- Production usage.
- Real client data.
- Dependency changes.

## F-002 RLS DB Gate Follow-up - 2026-06-28

Scope:

- PR #7 merged into `main`.
- F-002 RLS DB gate is verified.
- The F-002 blocker is removed.
- The next allowed phase is F-002A Contract Context only.
- The no-direct-write RLS gate now includes `TRUNCATE`, and the F-002 migration explicitly revokes `TRUNCATE` from `anon` and `authenticated` on F-002 tables.
- GitHub Actions and `npm run test:rls:db` use the documented local Docker Hub registry override for Supabase test images to avoid public ECR rate-limit failures in CI.
- No Packages implementation, Deliverables creation, Kanban, files, comments, approvals, SLA engine, hosted migration, production usage, real client data, or dependency changes are allowed in this follow-up.

Owner Decision:

- For F-002A only, `project_manager` is temporarily treated as equivalent to `tenant_administrator` for contract context authority.
- `project_manager` must not be added to `RoleKey` or seeded as a new role without a separate ADR and owner approval.
- If a distinct `project_manager` role is still needed after F-002A, open a separate ADR before implementation.

## F-002 RLS DB Gate Repair - 2026-06-28

Scope:

- Gate repair only for F-002 database/RLS verification.
- No Phase 3 server commands or UI.
- No production Supabase, hosted migration, real client data, dependencies, or feature scope expansion.

Official active worktree:

- `D:\code - projects\sharik-worktrees\f002-deliverables-core`

Legacy path governance:

- `shrek` and `sherk` paths are historical evidence only and must not be used for active Sharik work.
- A local historical Docker project named `shrek-platform-f001a` was stopped only to free port `54322` for Sharik Supabase local verification.

Fixes:

- Restored `supabase/tests/database/f002_deliverables_core.test.sql` to its declared `plan(31)` by adding the two missing pgTAP governance assertions for direct authenticated write grants and direct write RLS policies.
- Added `scripts/supabase-rls-db-test.mjs` so `npm run test:rls:db` uses Supabase CLI `2.107.0` with telemetry disabled, avoiding PostHog shutdown timeouts after successful pgTAP runs.

Verification:

- `npm run test:rls:db`: passed, 2 pgTAP files / 68 tests.
- `npm run test:rls`: passed; simulator 6 files / 19 tests and pgTAP 2 files / 68 tests.
- Full gate evidence captured in `specs/002-deliverables-core/evidence/f002-rls-db-gate.md`.

Owner/ADR decision:

- F-002 spec references `project_manager`, but `RoleKey` currently does not include it.
- No role was added in this repair.
- Owner decision for F-002A: temporarily map `project_manager` authority to `tenant_administrator`.
- A distinct `project_manager` role remains deferred until a separate ADR is opened and accepted.

## F-002 Deliverables Core - 2026-06-28

Scope started:

- Spec Kit package created under `specs/002-deliverables-core/`.
- Official English spelling confirmed as `Sharik`; package slug updated to `sharik-platform`.
- Worktree/branching standard added at `docs/07-spec-driven-delivery/worktree-and-branching-standard.md`.
- Phase 1 domain foundation completed for package ledger projection, deliverable status/progress rules, F-002 permission catalog, and synthetic fixtures.
- Phase 2 database/RLS foundation started with `202606280001_f002_deliverables_core.sql`, pgTAP coverage, and RLS simulator coverage.

Verification completed:

- `npm run test:unit`: passed, 22 files and 65 tests.
- `npm run test:integration`: passed, 13 files and 44 tests.
- `npm run test:component`: passed, 7 files and 20 tests.
- `npm run test:rls:simulator`: passed, 6 files and 19 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed.
- `npm audit --audit-level=high`: passed high/critical threshold; two moderate PostCSS advisories remain through Next.js.

Historical blocked local verification, superseded by the F-002 RLS DB Gate Repair above:

- `npm run test:rls:db`: was blocked because local Supabase could not connect in the original F-002 foundation run.
- `npx supabase@2.107.0 start`: was blocked because Docker Desktop was unavailable in the original F-002 foundation run.

Out of scope confirmed:

- No hosted staging migration.
- No production Supabase.
- No real client data.
- No Kanban, files, comments, approvals, delivery, billing, social scheduling, or full SLA engine.

## F-001B Completion Note - 2026-06-28

F-001B was later completed through Cycle 2C/2D, pushed, reviewed, and merged via PR #5. Any older Cycle 2B blocked notes below are historical pre-hardening evidence and are superseded by the merged F-001B result.

## F-001B Cycle 2B - 2026-06-27

Cycle status:

- F-001B Cycle 2A = Locally Verified and committed at `a22a5f596fc9d298246d223bea9a1187808a47a0`.
- F-001B Cycle 2B = BLOCKED before hosted staging migration.
- F-001B is not ready for merge.

Blocker:

- HIGH finding H-001: migration `202606270001_f001b_client_write_workflows.sql` grants direct `insert, update` on `public.clients` to `authenticated`, while existing RLS policies allow tenant management roles to write clients. This can bypass the intended RPC audit transaction and `expected_revision` guard.

Evidence:

- `specs/001-secure-tenant-client-onboarding/evidence/f001b/cycle-2b-hosted-staging-uat.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/reviews/cycle-2b-migration-security-review.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/reviews/cycle-2b-spec-compliance.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/reviews/cycle-2b-code-quality-security.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/stack-compliance-cycle-2b.md`

Verification completed before block:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:unit`: passed, 18 files / 51 tests.
- `npm run test:integration`: passed, 13 files / 44 tests.
- `npm run test:component`: passed, 7 files / 20 tests.
- `npm run test:rls:db` with Supabase telemetry disabled: passed, 1 pgTAP file / 34 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- `npm audit --audit-level=high`: passed high/critical threshold; two moderate PostCSS advisories remain through Next.js.

Out of scope confirmed:

- No invitations were started.
- No role/member mutations were executed outside verification.
- No deliverables, contracts/packages, files, SLA, approvals, Kanban, billing, or social scheduling were started.
- No production Supabase project, production credentials, real client data, merge to `main`, push, or hosted staging mutation was used.

## Owner Gate - 2026-06-24 Stabilization Only

Owner decision for this round:

- Stabilization and Full E2E reconciliation only.
- T037-T083 are classified as `EXECUTED — PENDING OWNER REVIEW`.
- T037-T083 are not finally accepted in this worktree.
- T084-T103 and Phase 7 were not started.
- No merge to `main` was performed.

Evidence:

- `evidence/f001a/phase-6-stabilization-report-2026-06-24.md`
- `evidence/f001a/owner-gate-2026-06-24.md`

Latest stabilization verification:

- `npm run lint`: passed, exit 0.
- `npm run typecheck`: passed, exit 0.
- `npm run test:unit`: passed, 10 files and 30 tests, exit 0.
- `npm run test:integration`: passed, 13 files and 32 tests, exit 0.
- `npm run test:component`: passed, 6 files and 16 tests, exit 0.
- `npm run test:rls`: passed, simulator 5 files / 16 tests and pgTAP 1 file / 29 tests, exit 0.
- `npm run test:e2e`: passed, 30 tests, exit 0.
- `npm run secret:scan`: passed, no high-confidence secrets found, exit 0.
- `npm run build`: passed, 10 app routes generated, exit 0.
- `npm audit --audit-level=high`: passed, zero high/critical findings; two moderate PostCSS findings remain deferred, exit 0.

## Stage Status

| Stage | Status | Evidence |
|---|---|---|
| A0 Project Foundation | COMPLETE | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a0.md` |
| A1 Identity and Tenant Context | VERIFIED AFTER A1R | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a1.md`; real DB verification completed in A1R. |
| A1R Real Supabase RLS Verification | FULLY VERIFIED | Local Docker Desktop/WSL2 stack is running; local Supabase database reset passed twice; pgTAP RLS tests passed. |
| A2 Client Foundation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a2.md`. |
| A3 Internal Member Invitation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a3.md`. |
| A4 Client Member Invitation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a4.md`. |
| A5 Invitation Lifecycle Hardening | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a5.md`. |
| A6 Membership and Role Lifecycle | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a6.md`. |

## Latest A6 Checkpoint

A6 Membership and Role Lifecycle completed and verified on 2026-06-24 after owner approval.

Implemented scope:

- Role assignment authority rules for role/scope compatibility, active membership, actor authority, and cross-tenant denial.
- `assignRoleCommand` with validation, tenant/client scoped authority checks, and `RoleAssigned` / denial audit.
- `changeRoleAssignmentCommand` with old/new scope authority checks and `RoleUpdated` or `RoleRevoked` audit.
- `removeClientScopeCommand` with client-scope role revocation and `ClientScopeRemoved` audit.
- `disableMembershipCommand` with active responsibility guard, role revocation, pending invitation cancellation, and `MembershipSuspended` / `InvitationRevoked` audit.
- Management members surface at `/members` with role selector, resend/revoke controls, disabled membership state, and responsibility-transfer blocked state.
- Offboarding prerequisite documentation for later delivery-domain responsibility transfer.

Out of scope and not started:

- Phase 7 Role-Aware Navigation.
- Phase 8 Verification and Acceptance.
- Deliverable responsibility transfer implementation.
- Deliverables, contracts, files, SLA, approvals, Kanban, deploy, production Supabase usage, and real client data.

Verification results:

- Targeted unit tests: passed, 1 file and 4 tests.
- Targeted integration tests: passed, 3 files and 6 tests.
- Targeted component tests: passed, 1 file and 3 tests.
- Targeted member lifecycle E2E: passed, 3 tests across desktop, mobile, and RTL projects.
- `npm run test:unit`: passed, 10 files and 30 tests.
- `npm run test:integration`: passed, 13 files and 32 tests.
- `npm run test:component`: passed, 6 files and 16 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed and included `/members`.

## Latest A5 Checkpoint

A5 Invitation Lifecycle Hardening completed and verified on 2026-06-24 after owner approval.

Implemented scope:

- Invitation state machine for pending, accepted, revoked, superseded, derived expired, email mismatch, already-used, and not-found decisions.
- Deterministic 7-day expiry boundary; acceptance is denied at `expires_at`.
- Idempotent accepted-link refresh for the same accepting user without duplicate memberships, roles, or audit side effects.
- Replay denial for already-used invitations by another user.
- Revoke invitation command with tenant/client scoped authorization and audit.
- Resend invitation command with supersession before replacement creation, local email dispatch capture, and audit.
- Accept-invitation hardening for expired, revoked, superseded, already-used, email mismatch, idempotency, and replay.
- In-memory rate limiter abstraction integrated into invite, resend, and accept command paths.
- Safe invitation lifecycle UI states at `/invite/[token]`.

Out of scope and not started:

- General membership/role lifecycle.
- Broad role-aware navigation.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

Verification results:

- Targeted unit tests: passed, 2 files and 4 tests.
- Targeted integration tests: passed, 5 files and 11 tests.
- Targeted component smoke: passed, 1 file and 3 tests.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 29 tests.
- `npm run test:unit`: passed, 9 files and 26 tests.
- `npm run test:integration`: passed, 10 files and 26 tests.
- `npm run test:rls`: passed; simulator 5 files / 16 tests and pgTAP 1 file / 29 tests.
- `npm run test:component`: passed, 5 files and 13 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- Targeted lifecycle E2E: passed, 15 tests across desktop, mobile, and RTL projects.

## Latest A4 Checkpoint

A4 Client Member Invitation completed and verified on 2026-06-24 after owner approval.

Implemented scope:

- Client invitation role/scope validation for `client_admin`, `client_approver`, and `client_viewer`.
- Exact one-client scope enforcement for client invitations.
- `invite-client-member` command with tenant-management authorization, client role validation, idempotent pending retry, local email dispatch capture, delivery state, and audit.
- Existing-user and new-user client invitation acceptance path that activates client membership and scoped client role assignment.
- `public.invitations` support for client invitations while preserving tenant-management-only invitation/audit RLS.
- Minimal client portal first-entry surface at `/client`.

Out of scope and not started:

- Resend, revoke, supersede, and invitation lifecycle hardening.
- General membership/role lifecycle.
- Broad role-aware navigation.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

Verification results:

- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 29 tests.
- `npm run test:rls`: passed; simulator 5 files / 16 tests and pgTAP 1 file / 29 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 7 files and 22 tests.
- `npm run test:integration`: passed, 5 files and 15 tests.
- `npm run test:component`: passed, 5 files and 13 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- Targeted `npm run test:e2e -- tests/e2e/invitations/client-invite.spec.ts`: passed, 3 tests across desktop, mobile, and RTL projects.

## Latest A3 Checkpoint

A3 Internal Member Invitation completed and verified on 2026-06-24 after owner approval of commit `0966128`.

Implemented scope:

- Internal invitation role/scope validation for approved internal roles only.
- `invite-internal-member` command with tenant-management authorization, tenant/client scoped validation, local email dispatch capture, idempotent pending retry, and audit events.
- Existing-user internal invitation acceptance path that activates tenant membership and scoped client role assignments.
- `public.invitations` table for internal invitations only, with RLS enabled and tenant-management insert/read/update policies.
- Assigned internal client portfolio surface.
- Tenant-management-only read policy for internal audit events, replacing the broader active-tenant-member audit read policy.

Out of scope and not started:

- Client member invitation.
- Resend, revoke, supersede, expiry hardening beyond valid internal acceptance and simple expiry denial.
- Client portal invitation acceptance.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

Verification results:

- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 25 tests.
- `npm run test:rls`: passed; simulator 4 files / 13 tests and pgTAP 1 file / 25 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 6 files and 19 tests.
- `npm run test:integration`: passed, 4 files and 11 tests.
- `npm run test:component`: passed, 4 files and 10 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- Targeted Playwright E2E after installing Chromium: passed, 6 tests across desktop, mobile, and RTL projects.

## Latest A2 Checkpoint

A2 Client Foundation completed on 2026-06-24.

Implemented scope:

- `public.clients` table with tenant scope and RLS.
- Tenant-management client create/update/list command surface.
- Server-side authorization before sensitive client mutations.
- Audit events for client creation/update and sensitive denials.
- Arabic RTL client management empty/create/edit UI surface.
- A2-only integration, RLS simulator, pgTAP database, component, and E2E specs.

Out of scope and not started:

- Invitation lifecycle.
- Internal member invitation.
- Client member invitation.
- Membership/role lifecycle beyond existing A1 foundations.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

## Latest A1R Checkpoint

Commands run on 2026-06-24:

```powershell
docker version
docker info
docker desktop status
npx supabase@2.107.0 start --exclude edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector
npx supabase@2.107.0 db reset --local --no-seed
npx supabase@2.107.0 db reset --local --no-seed
npm run test:rls:db
npm run test:rls
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run secret:scan
npm run build
```

Results:

- `docker version`: passed; client `29.5.3`, Docker Desktop server `29.5.3`.
- `docker info`: passed; Docker Desktop Linux engine running on WSL2 kernel `6.18.33.1-microsoft-standard-WSL2`.
- `docker desktop status`: passed; status `running`.
- Local WSL check: `docker-desktop` distro running on WSL version 2.
- `npx supabase@2.107.0 start`: passed after using the Docker Hub registry override for local images and excluding services not required for A1R database verification.
- First `npx supabase@2.107.0 db reset --local --no-seed`: passed after the local stack was running.
- Second `npx supabase@2.107.0 db reset --local --no-seed`: passed, proving migration replay reproducibility.
- `npm run test:rls:db`: passed, 1 pgTAP file and 15 tests.
- `npm run test:rls`: passed; simulator 2 files / 7 tests and pgTAP 1 file / 15 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 5 files and 15 tests.
- `npm run test:integration`: passed, 2 files and 4 tests.
- `npm run test:component`: passed, 2 files and 3 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed.

## A1R Fixes Applied

- Added an append-only database trigger for `public.audit_events` to raise `42501` on UPDATE or DELETE.
- Corrected pgTAP `throws_ok` expectations so cross-tenant audit insert and append-only audit mutation assertions validate the actual PostgreSQL error code and message.

## Supabase Runtime Note

The local Supabase stack initially attempted to pull images from the default registry and stalled on the Postgres image. The A1R run used `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` and pulled `docker.io/supabase/postgres:17.6.1.136`. No production Supabase project and no real customer data were used.

## Out of Scope Until Owner Approval

- Broad role-aware navigation.
- Phase 8 verification package.
- Production Supabase usage.
- Real customer data.
- Merging into `main`.
