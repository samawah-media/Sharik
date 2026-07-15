# Project Progress

## Spec 015 Checkpoint 1A Exact-HEAD Closure - 2026-07-15

Checkpoint 1A is locally accepted for Draft PR #37 after exact-head verification of `98a6e6745cf5e6c13e76e672a44883ec0bd51201` on branch `codex/015-persistent-mvp-pilot-completion`.

Evidence: GitHub Actions `F-001 Quality` run `29404575276` / job `87316811754` passed npm ci, lint, typecheck, unit `182/182`, integration `112/112`, clean local Supabase start/reset, RLS simulator `24/24`, pgTAP 6 files / 404 tests, component `65/65`, fixture Playwright E2E `123 passed`, persistent Playwright E2E `4 passed`, secret scan, and build. Local exact-head `git diff --check` passed.

Disposition: S015-P1-049, 050, 051, 052, and 054 are fixed and exact-CI verified. S015-P2-053, 055, and 056 are fixed and exact-CI verified. No P0/P1 remains open for Checkpoint 1A.

Boundary: no hosted UAT workflow, H008/H009/H010, workbook import, Preview mutation, Production action, PR merge, Spec 016, parallel plan, or new milestone occurred. X007 hosted work, T032, and Production acceptance remain open/not granted.

## Spec 015 Checkpoint 1A Independent Review Correction — 2026-07-15

Checkpoint 1A was blocked after independent review of commit `0641797`. Exact-HEAD GitHub run `29393394677` failed lint, and the assignment test used service-role access for persona/RLS claims. The review also found mutually recursive deliverable/task RLS, actor-unscoped UI capabilities, an eligible-assignee query against a nonexistent column, continued exclusion of task-only writers/designers from `/work`, unwired task edit/reassignment UI, an inactive-former-assignee RPC path, and task status controls that were not tied to the exact actor assignment.

The bounded correction stays inside Spec 015. Additive migration `202607150001_s015_task_assignment_review_corrections.sql` removes policy recursion, gates an active-member eligible-assignee directory to management, revokes direct access to the assignee-validation oracle, and places task mutation behind an active-role wrapper. Server reads now derive capabilities only from the actor's active membership. The drawer exposes task edit/reassignment, exact-assignee status controls and missing capabilities fail closed, and persistent E2E uses real Supabase Auth sessions and browser mutations rather than service-role persona simulation.

Local PASS: full lint, typecheck, unit `182/182`, integration `112/112`, component `65/65`, RLS simulator `24/24`, clean Supabase migration replay, pgTAP `404/404`, secret scan, `git diff --check`, and production build. The original persistent lifecycle plus mobile/RTL smokes passed in the combined run; after correcting test isolation and late-table service-role grants, the real-Auth task create/assign/update/reassign/old-assignee-denial/new-assignee-complete journey passed independently. The later exact-head PR #37 quality run `29404575276` closed this blocker. No hosted mutation, Production action, PR merge, or workbook tracking occurred.

## Spec 015 X007 Corrective Slice 3 — 2026-07-15

Checkpoint 1A was reopened for a third corrective slice to make the task assignment journey coherent from PostgreSQL/RLS to «مهامي», the universal drawer, and persistent browser E2E. Five new defects were registered and addressed: S015-P1-044 (`created_by` permanent task-read grant removed), S015-P1-045 (undifferentiated update authority restructured to management/owner-contributor/assignee tiers), S015-P1-046 (deliverable discoverability for task-only assignees via narrowed RLS + `/work` and board page fixes), S015-P1-047 (explicit server capabilities replace implicit UI inference, eligible-assignee list gated to management, empty-string-to-null), and S015-P2-048 (active-role-to-active-membership linkage in assignee validation).

Additive migration `202607140005_s015_task_assignment_authority_correction.sql` is additive only; no prior migration is modified. The canonical assignment model is now: management (tenant or client scoped) can create/assign/reassign/unassign/edit/delete within scope; owner/contributor can create (self/null assignee only) and edit all fields except assignee; task assignee can update status only with all protected fields preserved server-side; `created_by` is not a permanent read grant; client personas see zero tasks/counts/assignees. Server-derived capabilities (`canCreateTask`, `canAssignOthers`, `canReassignTask`, `canUpdateOwnTaskStatus`) flow from active roles to the workspace read model and the UI.

Local verification: typecheck PASS, unit 50/179 PASS, integration 28/112 PASS, component 19 files including 7 new TaskForm capability tests PASS (1 pre-existing client-pending-inbox flaky failure unrelated), secret scan PASS. Docker-backed verification was superseded by the fourth corrective slice and exact-head PR #37 quality run `29404575276`. H008-H010, T032, hosted UAT, and Production acceptance remain open/not granted.

Last updated: 2026-07-15

## Spec 015 Hosted Team UAT Amendment - 2026-07-12

- Owner authorized a controlled online Team-Only Hadna UAT amendment to the existing Spec 015 package.
- Historical status at this entry was `OWNER AUTHORIZED / PREFLIGHT IN PROGRESS`, not PASS. The current snapshot is `HOSTED ACCESS READY / X007 CHECKPOINT 4 IN PROGRESS`; later migrations and the approved Hadna/Glass import still require current UAT revalidation before hosted lifecycle acceptance.
- This amendment does not create Spec 016, does not alter the accepted local evidence, and does not grant Production readiness, Production acceptance, customer acceptance, or public release.
- Safe preflight performed so far: clean worktree confirmed, `origin` fetched, branch/HEAD/merge-base reviewed, and migration inventory review started.
- Historical note superseded: the pre-push database gate later passed in CI and Draft PR #37/Preview were created. This is not evidence for later X006 migrations or hosted workflow acceptance.
- New migrations remain unapplied to Supabase UAT; no merge, Production promotion, real client invitation, or public signup is authorized.
- Next hosted gates are H001-H010 in `specs/015-persistent-mvp-pilot-completion/tasks.md`: branch/PR preflight, rollback approval, Draft PR/CI, Supabase UAT migration, synthetic Hadna seed, team access, Vercel Preview deployment, hosted workflow UAT, defect/T032 evidence, and hosted handoff.
- Production boundary remains strict: no Production deployment, Production alias/domain change, Vercel Production env change, Production Supabase access, real customer data, external client invitation, public signup, force push, PR merge, or Production acceptance.

## Spec 015 persistent E2E reproducibility hardening - 2026-07-12

- Reproduced the persistent suite from a stopped local Docker engine and clean Supabase reset; no hosted target was contacted.
- Added guarded global database reset before and after the persistent Playwright suite and increased first-compile/hook time budgets.
- Prevented native pre-hydration sign-in submission without adding an authentication bypass.
- Persistent E2E passed 3/3; fixture E2E passed 105 with 6 configured viewport duplicates skipped; pgTAP passed 228.
- Hosted actions: zero. Production acceptance remains not granted.

## Spec 015 Persistent MVP Local Closure - 2026-07-10

- Continued from local commit `e52d5aa` on `codex/015-persistent-mvp-pilot-completion` and kept the scope to canonical Spec 015 only.
- Unblocked local Docker/Supabase/PostgreSQL verification and fixed migration replay defects in the S015 persistent foundation.
- Fixed DB workflow defects for protected status denial, nullable assigned-team authorization, idempotent terminal replay, realistic client memberships in pgTAP, exact-version workflow coverage, file/comment secrecy, SLA pause/resume/completion, package ledger consumption, audit counts, and final delivery replay.
- Fixed the mobile Kanban width regression discovered by Playwright and reran the board/component coverage.
- Final local matrix passed: `npm run lint`, `npm run typecheck`, `npm run test:unit` (48 files / 171 tests), `npm run test:integration` (28 files / 112 tests), `npm run test:component` (17 files / 55 tests), `npm run test:rls:simulator` (8 files / 24 tests), `npm run test:rls:db` (6 files / 228 tests), `npm run test:e2e` (105 passed / 6 configured skips), `npm run secret:scan`, `git diff --check`, and `npm run build`.
- Local acceptance is green for synthetic/Hadna-only persistent MVP verification. Hosted UAT remains not authorized, Production acceptance is not granted, no hosted actions were performed, no real data was accessed, no dependency was added, and no push/deploy occurred.

## Spec 015 findings-first corrective closure - 2026-07-10

- Reopened approval/state-machine P1 defects because the generic status path still allowed an exact-version bypass.
- Implemented PostgreSQL and UI denial for approval-derived/delivery statuses in the generic command; delivered, cancelled, and archived are terminal.
- Added independent assigned-team version-submission authority for account manager, content writer, and designer without approval/send/client-decision/delivery grants.
- Expanded local pgTAP coverage for Tenant A/B, same-tenant Client A/B, assignments, exact-version decisions, secrecy, append-only, replay/conflict, terminal states, and atomic rollback.
- DB-dependent P1 findings remain `implemented, verification blocked`; local MVP and Production acceptance are not granted.
- Added no dependency. S015-P2-009 remains open for a bounded amendment to this same Spec 015 after P1 and DB-backed acceptance.
- Hosted actions performed: zero.

## R-011A Stage 2C Internal Team MVP Trial And Hardening - 2026-07-10

- Created Stage 2C Spec Kit package at `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/` with spec, plan, tasks, contracts, quickstart, trial matrix, defect register, and execution log.
- Added local Stage 2C release gate at `src/modules/release/r011a-stage-2c-trial.ts` with unit coverage for role categories, lifecycle states, SLA states, approvals, files/comments, audit completeness, evidence redaction, hosted boundary, defect burn-down, and Production boundary.
- Fixed one P2 Kanban hydration warning for the status disclosure and retested targeted Kanban component/E2E plus full local verification.
- Corrective completion audit added a traceable defect register and handoff prompts. Reconciled entries include the fixed P2 hydration warning, 6 configured E2E skips as P3 deferred-with-rationale, blocked local RLS DB verification as P2 blocked, and hosted executor/UAT deployment limitation as P2 blocked/outside Stage 2C authority.
- Verification passed: `npm run lint`, `npm run typecheck`, `npm run test:unit` (46 files / 163 tests), `npm run test:integration` (28 files / 112 tests), `npm run test:component` (17 files / 54 tests), `npm run test:rls:simulator` (8 files / 24 tests), `npm run test:e2e` (105 passed / 6 skipped), `npm run secret:scan`, `git diff --check`, and `npm run build`.
- RLS DB remains BLOCKED locally because the local Postgres connection failed with `LegacyDbConnectError`. No hosted DB or hosted state was accessed as a substitute.
- Mutation boundary: 0 hosted mutations, 0 hosted file content operations, 0 deployments/promotions/config changes, 0 Production acceptance actions. Stage 2C used local synthetic/value-free evidence only.
- Canonical execution: Stage 2C is historical `Verified with blockers / superseded for execution by Spec 015`. Spec 015 is the only active package for persistent local MVP completion. It does not close R-011A T032, approve UAT deployment/team-access configuration, or grant Production readiness/acceptance.

## Current Status Dashboard — R-011A Stage 2A (2026-07-10)

| Area                  | Status         | Current truth                                                                                                                                      |
| --------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local MVP baseline    | IN PROGRESS    | R-007–R-011 local workflows and R-011A safe setup/readiness paths are present on the consolidation branch.                                         |
| Professional RTL UX   | IN PROGRESS    | Existing sign-in, management, client, deliverable, SLA, approval, file, waiting-approval, and portal surfaces are being consolidated and polished. |
| SaaS guardrails       | IN PROGRESS    | Tenant/client scope, deny-by-default, internal-content separation, version-aware approvals, audit, and SLA rules remain mandatory review targets.  |
| Local verification    | PENDING        | Full Stage 2A matrix must be rerun after implementation; unavailable DB/hosted checks will remain explicitly blocked/skipped.                      |
| Hosted R-011A Stage 2 | BLOCKED / OPEN | T032 remains open. No hosted mutation, file operation, deploy, promotion, or Production acceptance is authorized by this pass.                     |
| Next route            | OWNER DECISION | Stage 2B requires reviewed hosted executor, bounded Hadna-only gap closure, UAT deployment, and team-access preparation.                           |

Stage 2A does not change the historical evidence below and does not convert local readiness into hosted or Production acceptance.

## R-011A Stage 2A Local Verification — 2026-07-10

- Passed: `npm run lint`, `npm run typecheck`, unit (45 files / 159 tests), integration (28 files / 112 tests), component (17 files / 54 tests), RLS simulator (8 files / 24 tests), `npm run secret:scan`, `git diff --check`, `npm run build`, and E2E (105 passed / 6 skipped across desktop, mobile, and RTL projects).
- The six E2E skips remain skipped by the existing test configuration and are not counted as PASS.
- RLS DB test was attempted and is BLOCKED because the local Postgres connection failed (`LegacyDbConnectError`). No hosted DB or hosted state was accessed.
- E2E emitted one non-fatal hydration warning on the board fixture because a `details` element rendered with an open state differed between SSR and browser hydration; the scenario still passed. This remains a follow-up risk for Stage 2B/defect burn-down.
- Spec Kit prerequisite check passed and the read-only consistency review found the original R-011 FR/SC history needed explicit Stage 2A boundary wording; that reconciliation is now recorded in the artifacts.
- Local consolidation commit prepared: `49dce8b` (`feat: consolidate Samawah MVP baseline and R-011A UX`). No push, deploy, promotion, hosted mutation, or configuration change was performed.

## R-011A Hosted Dry-Run No-Op Rehearsal - 2026-07-09

- Owner explicit approval recorded for R-011A hosted dry-run only. `apply_hosted`, hosted mutation, hosted DB write/read, hosted route checks, account creation, role changes, hosted file operations, deploy/promotion, non-Hadna data use, and Production acceptance remained forbidden.
- Confirmed the existing `hosted_dry_run` code path maps to the local `dry_run` command through injected repository/audit boundaries. The focused harness uses in-memory repository and audit sinks, does not create setup records, and emits category/count-only evidence.
- Ran only the focused hosted dry-run/no-op readiness wrapper case. Result: passed.
- Category readiness summary: client approver category, waiting approval category, and final delivery/file-list category were ready for no-op rehearsal only with expected `would_create` status labels. They remain unresolved as hosted evidence, and T032 remains open.
- Expected no-op counts: hosted mutation 0, hosted DB read/write 0, hosted route check 0, hosted file operation 0, account/category change 0, approval/status/delivery mutation 0, deploy/promotion 0, non-Hadna data use 0, Production acceptance 0, sensitive value output 0.
- `apply_hosted` remains blocked by the existing code path because it requires a future apply approval category and still denies when no hosted executor is configured. It was not invoked in this dry-run.
- Verification for this docs/evidence update passed: focused hosted dry-run wrapper test, `npm run secret:scan`, `git diff --check`, and scoped count-only redaction scan. `git diff --check` reported only existing broader dirty-worktree CRLF warnings and no whitespace errors. Scoped redaction scan found 0 URL, 0 email, and 0 image-reference matches in touched R-011A dry-run docs and the new project-progress section; 80 R-011A doc keyword matches and 3 progress-section keyword matches were reviewed as safe redaction vocabulary. Lint/typecheck were not run because no product code changed.

## R-011A Hosted Execution Readiness Pass - 2026-07-09

- Owner direction continued R-011A with hosted-execution readiness only. Hosted mutation, hosted dry-run against real hosted access, hosted DB reads, hosted route checks, deploy/promotion, non-Hadna data use, hosted file operations, account creation, approval/status/delivery mutation, and Production acceptance remained forbidden.
- Added a hosted-readiness wrapper at `src/server/commands/release/r011a-hosted-gap-setup-readiness.ts`.
- Added explicit hosted execution modes for `hosted_dry_run` and `apply_hosted`.
- `hosted_dry_run` now requires the no-op approval category `r011a_hosted_dry_run_noop_rehearsal`, Hadna-only scope, read-only/no-op approval, and value-free evidence.
- `apply_hosted` is denied without explicit apply approval category `r011a_apply_hosted_bounded_mutation` and remains blocked because no hosted executor is configured in this pass.
- Added value-free hosted evidence summary building with category labels, status labels, and counts only.
- Added hosted readiness tests for dry-run approval, hosted apply denial, non-Hadna denial, over-count denial, unsafe file operation denial, evidence redaction shape, and rollback-summary no-op before apply.
- Added R-011A hosted execution runbook, hosted dry-run plan, stop conditions, and evidence policy.
- Updated R-011A mutation, rollback, safe-path implementation, execution log, verification evidence, and release documentation.
- Targeted hosted-readiness integration test passed and `npm run typecheck` passed during implementation.
- Full verification passed: targeted R-011A tests, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run secret:scan`, `git diff --check`, scoped R-011A redaction scan, and `npm run build`.
- Full unit suite passed: 45 files / 159 tests.
- Full integration suite passed: 28 files / 112 tests.
- Scoped R-011A redaction scan passed/reviewed: 12 scoped docs/sections, 0 URL, 0 email, 0 image-reference matches, and 126 redaction-vocabulary matches reviewed as category/prohibition wording.
- RLS tests were not run because this pass does not change database migrations, RLS policies, or hosted DB paths.
- Real hosted dry-run execution remains pending owner/operator window if hosted access is needed.
- Hosted apply remains blocked pending explicit owner apply approval and reviewed hosted executor.
- No hosted mutation, hosted DB read query, hosted route check, hosted file operation, deploy/promotion, non-Hadna data use, sensitive evidence output, or Production acceptance occurred.

## R-011A Safe Local UAT Gap Setup Paths - 2026-07-09

- Owner direction continued R-011A with a local implementation pass only. Hosted mutation, hosted DB reads, hosted route checks, deploy/promotion, non-Hadna data use, hosted file operations, real hosted account creation, and Production acceptance remained forbidden.
- Added a domain/service layer for R-011A setup planning and denial rules at `src/modules/release/r011a-gap-setup-plan.ts`.
- Added an injected local setup repository contract at `src/modules/release/r011a-gap-setup-repository.ts`.
- Added a management-only server command at `src/server/commands/release/r011a-gap-setup.ts` with `dry_run`, `apply_local`, and `rollback_summary` modes.
- The command is tenant/client scoped, denies non-Hadna or unapproved scope, requires active tenant-level management/admin authority, prevents over-count and duplicate-category requests, denies hosted mutation and Production acceptance requests, denies unsafe hosted file operations, creates audit events, supports idempotent no-op behavior, and rolls back local setup records if audit append fails.
- Added unit, integration, and authorization tests for the R-011A safe local setup paths.
- Updated R-011A evidence for mutation planning, rollback/no-op handling, safe path implementation, and verification.
- Verification passed: targeted R-011A unit tests, targeted R-011A integration tests, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run secret:scan`, `git diff --check`, scoped R-011A redaction scan, and `npm run build`.
- RLS tests were not run because this pass does not change database migrations, RLS policies, or hosted DB paths.
- Later hosted Stage 2 is not executed and not accepted in this pass. It still requires owner-approved execution timing, safe hosted persistence/execution wiring, value-free evidence collection, and stop-condition review.

## R-011A Limited Hosted UAT Gap Closure Preflight - 2026-07-09

- Owner selected R-011A and explicitly approved minimal Hadna-only hosted mutation for the three unresolved categories only: client approver account/category, waiting approval item/category, and final delivery/file-list category.
- R-011A Stage 1 completed: owner approval record, mutation plan, rollback/no-op plan, test data boundary, and execution log were added under the R-011 evidence package.
- Existing code/server/schema paths were inspected. Scoped deliverable creation and status-transition RPC paths exist, but no safe hosted account/category repair path, no safe waiting item/category context, and no hosted final-delivery file-list marker path were available inside the current repo and local category context.
- Stage 2 stopped before hosted mutation. No hosted mutation, hosted DB read query by this agent, hosted route check, account/category change, approval/status/delivery mutation, file operation, deploy/promotion/config change, non-Hadna data use, screenshot, sensitive evidence output, or Production acceptance occurred.
- The client approver hosted auth/portal/approval controls/isolation category remains unresolved.
- The waiting approval safe non-empty item/category remains unresolved.
- The final delivery/file-list category remains unresolved.
- Rollback status is no-op only because no hosted mutation occurred.
- Verification passed: `npm run secret:scan`, `git diff --check`, and scoped count-only redaction scans over R-011A evidence/release/task/R-010 traceability plus the new project progress section. R-011A evidence/release/task/R-010 traceability files had 0 URL, 0 email, 0 image-reference, and 95 keyword matches reviewed as redaction vocabulary or prohibited-category labels. The new progress section had 0 URL, 0 email, 0 image-reference, and 6 keyword matches reviewed as redaction vocabulary or prohibited-category labels. Lint/typecheck and targeted tests were not run because no product code changed.
- Recommended next owner decision: provide safe R-011A execution categories or authorize a narrower direct mutation runbook with exact scoped path, audit expectation, rollback/no-op handling, and stop conditions; otherwise choose R-011B residual-risk acceptance for non-Production planning or R-011C stop/request missing UAT categories.

## R-011 Production-Candidate Residual Risk Treatment And Hosted Acceptance Readiness - 2026-07-09

- Owner decision recorded: start R-011 as the next Spec Kit package after R-010 Path B for production-candidate residual-risk treatment and hosted acceptance readiness.
- R-011 package created at `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/`.
- R-011 scope is planning/readiness only: treat R-010 residual risks, define production-candidate blockers, define owner-acceptable residual risks for non-Production planning, define hosted acceptance readiness gates, and define future routes R-011A/R-011B/R-011C.
- Residual risks carried forward remain explicit: client approver auth/portal/approval controls/isolation unproven, waiting approval remains empty-state, and final delivery/file-list category remains unproven.
- Production-candidate review remains blocked unless the owner later selects R-011A with explicit mutation approval, selects R-011B with explicit accepted residual risk for non-Production planning, or selects R-011C to stop and request missing UAT data/categories.
- Production acceptance remains blocked. R-011 cannot claim full hosted completion, client approver hosted acceptance, waiting-approval hosted acceptance, final-delivery hosted acceptance, hosted file-list readiness, Production readiness, or Production acceptance.
- R-011 defines owner gates for client approver validation, waiting approval validation, final delivery/file-list validation, tenant/client isolation evidence, approval workflow evidence, SLA reporting evidence, audit completeness evidence, and rollback/no-op readiness.
- R-011 does not authorize or perform hosted checks, hosted mutation, hosted DB reads, deploy/promote/config changes, account or role changes, hosted file operations, non-Hadna data use, dependency changes, product code implementation, or Production acceptance.
- Recommended next implementation route after R-011: R-011A limited hosted completion with explicit mutation approval if the owner wants proof before production-candidate review; otherwise R-011B only with explicit non-Production residual-risk acceptance, or R-011C to stop and request missing UAT data/categories.
- Verification for this planning pass passed: `git diff --check`, `npm run secret:scan`, and scoped redaction scan over 16 new R-011 docs/release files. `git diff --check` reported existing Windows line-ending warnings from the broader dirty worktree and no whitespace errors. The scoped redaction scan found 0 link, 0 email, and 0 image-reference matches; prohibited-vocabulary matches were reviewed as redaction vocabulary or prohibited-category labels. Lint/typecheck were not run because R-011 changed documentation only.

## R-010 Path B Production-Candidate Planning Evidence Hardening - 2026-07-09

- Owner Path B decision recorded: proceed with production-candidate planning using R-009 as partial owner-deferred evidence.
- R-010 status is PATH B ACTIVE / PRODUCTION-CANDIDATE PLANNING ONLY; no hosted check, hosted mutation, hosted DB read, deploy/promote/config change, account or role change, hosted file operation, non-Hadna data use, code implementation, or Production acceptance was introduced.
- Accepted evidence from R-008/R-009 is limited to R-008 local readiness, R-009 available-category hosted read-only evidence, R-009 no-op proof, and R-009 redaction rules.
- Partial/deferred evidence remains explicit: client approver auth/portal/approval controls/isolation unproven, waiting approval remains empty-state, final-delivery list/category remains unproven, and R-009 T038, T039, and T044 remain unchecked.
- R-010 cannot claim full hosted completion, client approver hosted acceptance, waiting-approval hosted acceptance, final-delivery list/category hosted acceptance, hosted file-list readiness, Production readiness, or Production acceptance.
- Path B evidence hardening added a production-candidate gap register, residual-risk matrix, production-candidate go/no-go checklist, and Path B rollback/no-op planning note under `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/`.
- Path A remains a fallback only if the owner later requires hosted proof or bounded category prep; it still requires explicit mutation approval with environment, Hadna-only scope, exact category/item limits, rollback/no-op owner, evidence rules, and stop conditions.
- Recommended next package: `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/`.
- Exact next owner decision: approve R-011 residual-risk treatment and hosted acceptance readiness, return to Path A with explicit mutation approval, or stop.
- Verification for this Path B planning pass passed: `npm run secret:scan`, `git diff --check`, and scoped count-only redaction scan over 11 R-010/R-009 docs plus the new project progress section. `git diff --check` reported LF-to-CRLF warnings from the broader dirty worktree only. Lint/typecheck were not run because this pass changed documentation/evidence only.

## R-010 Gap Closure Planning And Owner Decision Package - 2026-07-09

- Owner decision recorded: close R-009 as PARTIAL OWNER-DEFERRED after the final retry; do not attempt more R-009 hosted checks; proceed to R-010 planning/gap closure only.
- R-009 unresolved gaps summarized in R-010: client approver credential/auth gap, waiting approval empty-state gap, and final delivery list/category gap.
- R-010 Path A now defines hosted completion prep only with explicit owner mutation approval before any account/category/data exposure change.
- Path A exact candidate mutation boundaries are limited to fixing or creating one safe client approver account/category, creating or exposing one safe waiting-approval item, and creating or exposing one safe final-delivery list/category.
- Path A also defines rollback/no-op requirements, evidence redaction rules, and stop conditions; no Path A mutation or hosted check was run.
- R-010 Path B defines deferring unresolved hosted categories into production-candidate planning as explicit residual risks.
- Path B documents that full R-009 hosted completion, client approver hosted acceptance, waiting-approval hosted acceptance, final-delivery list/category hosted acceptance, hosted file-list readiness, and Production acceptance cannot be claimed.
- R-009 T038, T039, and T044 remain unchecked and were not relabeled by R-010 planning.
- R-010 decision evidence was added at `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/gap-closure-decision.md`.
- R-009 release wording was clarified to reflect the final owner closure decision and the no-more-R-009-hosted-checks boundary.
- Verification for this planning pass passed: `npm run secret:scan`, `git diff --check`, and scoped count-only redaction scan over touched R-010/R-009 docs and the new project progress section.
- `git diff --check` reported LF-to-CRLF warnings from the broader dirty worktree only; no whitespace error was reported.
- Lint/typecheck were not run because this task changed documentation and evidence only.
- No hosted DB read query, hosted mutation, hosted check, deploy/promote/config change, non-Hadna data use, account creation, role change, hosted file operation, approval/status/delivery mutation, screenshot, sensitive evidence output, code change, dependency change, or Production acceptance was introduced.
- Exact next owner decision: choose R-010 Path A with explicit mutation approval, choose R-010 Path B with residual-risk acceptance for production-candidate planning, or stop.

## R-009 Final Hosted Read-Only Retry After Owner Category Correction - 2026-07-09

- Corrected local `.env.r009-hosted.local` category source was present for hosted base, client approver email category, client approver password category, and final-delivery route category.
- Waiting-approval route category remains empty and is recorded as OWNER-DEFERRED / EMPTY-STATE; no waiting route was opened and no waiting item was created.
- Hosted sign-in category loaded through the safe sign-in route category and exposed RTL sign-in signals.
- Client approver sign-in was attempted once using the approved local credential categories, but it remained on the authentication surface with a generic auth state.
- Client approver portal, approval-control visibility, role shell/navigation, and client approver isolation remain unresolved and uncounted.
- Final-delivery route category opened read-only without another credential submission, but no file-list/final-delivery markers were exposed.
- Final-delivery list/category visibility remains unresolved; no file was opened, downloaded, uploaded, deleted, or mutated.
- No deferred R-009 task checkbox was newly marked complete. T038, T039, and T044 remain unchecked.
- Final retry result is PARTIAL OWNER-DEFERRED / AUTH STILL BLOCKED, not PASS.
- No hosted DB read query, hosted mutation, deploy/promote/config change, non-Hadna data use, account creation, hosted file operation, approval/status/delivery mutation, screenshot, sensitive evidence output, or Production acceptance was introduced.
- Recommendation: close R-009 as PARTIAL OWNER-DEFERRED and proceed to R-010 planning/gap closure.

## R-009 Hosted Completion Retry With Local Env - 2026-07-09

- Local `.env.r009-hosted.local` preflight now passes for required present categories: hosted target, client approver email category, client approver password category, and final-delivery route category.
- Waiting-approval route category is present as an empty value and is recorded as OWNER-DEFERRED / EMPTY-STATE; no waiting-approval route was opened and no waiting item was created.
- Hosted target base route opened and exposed the sign-in category with Arabic RTL signals.
- Client approver sign-in was attempted once using the approved local credential categories, but it remained on the authentication surface with a generic auth-error signal; no credential value or error text was printed.
- Because client approver sign-in did not complete, client approver portal, approval-control visibility, role shell/navigation, and client approver isolation remain unresolved and uncounted.
- Final-delivery route category was opened read-only after the sign-in blocker; it did not expose file-list/final-delivery signals and showed denied/not-found/auth-state signals. No file was opened, downloaded, uploaded, deleted, or mutated.
- No deferred R-009 task checkbox was newly marked complete. T038, T039, and T044 remain unchecked.
- Completion retry status is PARTIAL OWNER-DEFERRED / BLOCKED BY AUTH AND ROUTE STATE, not PASS.
- No hosted DB read query, hosted mutation, deploy/promote/config change, non-Hadna data use, account creation, hosted file operation, approval/status/delivery mutation, screenshot, sensitive evidence output, or Production acceptance was introduced.

## R-009 Hosted Completion Pass Attempt - 2026-07-09

- Owner approval was recorded to continue R-009 hosted read-only completion using locally supplied `.env.r009-hosted.local` values.
- Completion pass preflight failed before hosted route execution because the exact local env file was not present in the workspace or user-profile filename search, and no R-009 category variables were loaded in the shell environment.
- Missing categories recorded by name only: local env file category, hosted target category, client approver credential category, waiting-approval route or empty-state category, and files/final-delivery route category.
- No hosted route was opened in this completion attempt.
- No deferred category was resolved; client approver, waiting approval, and files/final delivery remain unresolved from the prior partial closure.
- Waiting approval could not be classified as EMPTY-STATE in this attempt because the local category source needed to confirm the empty route/value was unavailable.
- Files/final-delivery could not be inspected because the final-delivery route category was unavailable; no file was opened, downloaded, uploaded, deleted, or mutated.
- R-009 completion pass status for this attempt is FAIL at local env preflight; prior available-category evidence remains PASS, and the release remains PARTIAL OWNER-DEFERRED overall.
- T038, T039, and T044 remain unchecked because their required categories were not actually executed.
- R-010 was reassessed with no Production acceptance granted and no path implementation started. This earlier next-step option is superseded by the final owner closure decision: no more R-009 hosted checks; proceed to R-010 planning/gap closure only.
- No hosted mutation, deploy/promote/config change, non-Hadna data use, account creation, hosted file operation, approval/status/delivery mutation, screenshot, sensitive evidence output, or Production acceptance was introduced.

## R-009 Final Closure And R-010 Proposed Direction - 2026-07-09

- R-009 final status is CLOSED - PARTIAL OWNER-DEFERRED available-category hosted read-only evidence.
- Available-category hosted read-only evidence passed for management/project admin, assigned internal/account manager, client viewer, and unassigned/unauthorized client categories.
- Client approver remains OWNER-DEFERRED because credential category unavailable.
- Waiting-approval remains OWNER-DEFERRED because hosted read-only route/data category unavailable.
- Files/final-delivery remains OWNER-DEFERRED because hosted read-only route/data category unavailable; no file was opened, downloaded, uploaded, deleted, or mutated.
- Production acceptance is NOT GRANTED.
- Hosted mutation is NOT GRANTED.
- T040, T043, T045, T046, and T047 are complete. T038, T039, and T044 remain unchecked because their wording requires actual deferred-category execution.
- Final closure evidence was added at `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/final-closure.md`.
- Proposed R-010 planning-only package was created at `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/` and later refined into two owner paths: hosted completion prep with explicit owner mutation approval, or production-candidate gap planning with R-009 deferred categories carried forward.
- No hosted mutation, deploy/promote/config change, non-Hadna data use, account creation, hosted file upload/delete/download/opening, approval/status/delivery mutation, screenshot, sensitive evidence output, or Production acceptance was introduced.
- Exact next owner decision is superseded by R-010 gap closure planning: choose Path A with explicit mutation approval, choose Path B with residual-risk acceptance for production-candidate planning, or stop.

## R-009 Phase 6 Read-Only Isolation Available Categories - 2026-07-09

- Owner direction started Phase 6 read-only isolation checks under the OWNER-DEFERRED Phase 5 scope.
- Phase 6 status is PARTIAL OWNER-DEFERRED, not full PASS.
- Available approved category checks passed for management/project admin, assigned internal/account manager, client viewer, and unassigned/unauthorized client.
- Management/project admin route categories remained read-only and did not trigger mutation.
- Assigned internal/account manager category did not expose unrelated client scope.
- Client viewer category stayed in allowed client scope and did not expose management chrome or approval-action categories.
- Unassigned/unauthorized client category remained safe denied/empty and exposed no customer content.
- Client approver remains OWNER-DEFERRED because credential category unavailable.
- Waiting-approval and files/final-delivery remain OWNER-DEFERRED because hosted read-only data/route category unavailable; no file was opened or downloaded.
- T043, T045, T046, and T047 are complete. T044 remains unchecked. T038 and T039 remain unchecked from Phase 5. T040 remains complete.
- No hosted mutation, deploy/promote/config change, non-Hadna data use, account creation, file upload/delete/download/opening, approval/status/delivery mutation, screenshot, sensitive evidence output, or Production acceptance was introduced.
- Recommendation: close R-009 as partial owner-deferred available-category evidence, or require owner-supplied client approver credential category plus safely exposed hosted read-only waiting/files route or data categories before any deferred completion pass.

## R-009 Phase 5 Blocker Burn-Down - 2026-07-09

- Owner direction accelerated R-009 Phase 5 blocker burn-down under the existing limited hosted read-only boundary.
- Approved target and credential availability were confirmed by category only; no target value, credential, email, token, secret, route URL, screenshot, workbook content, link, caption, deliverable title, or row-level customer content was recorded.
- Phase 5 hosted smoke and blocker burn-down ran in read-only browser mode for available approved persona and route categories.
- Phase 5 final outcome is OWNER-DEFERRED, not PASS.
- Management/project admin recheck passed for sign-in, management shell, client summary, and readiness summary categories.
- Assigned internal/account manager route categories passed for sign-in, management/readiness summary, client list/detail summary, deliverables summary, package/contract summary, SLA/audit summary, and RTL.
- Client viewer route categories passed for sign-in, client portal home, package/contract summary, deliverables summary, RTL, and mobile rendering.
- Unassigned/unauthorized client category passed for sign-in and safe denied/empty client portal route categories.
- Client approver route categories are OWNER-DEFERRED with exact reason: credential category unavailable.
- Waiting-approval and files/final-delivery route categories are OWNER-DEFERRED with exact reason: hosted read-only data/route category unavailable; no file was opened or downloaded.
- T038 and T039 remain unchecked because deferred categories were not actually executed; T040 remains complete.
- Phase 6 read-only isolation checks were not started in this burn-down.
- No hosted mutation, deploy/promote/config change, non-Hadna data use, account creation, file upload/delete/download/opening, approval/status/delivery mutation, screenshot, sensitive evidence output, or Production acceptance was introduced.
- Recommendation: Phase 6 may start only under the owner-deferred Phase 5 scope and must exclude client approver, waiting-approval, and files/final-delivery categories unless the owner supplies a client approver credential category and safely exposed hosted read-only waiting/files route or data categories.

## R-009 Limited Hosted Read-Only UAT Start Pass - 2026-07-08

- Owner approval for R-009 limited hosted read-only UAT execution was recorded inside the R-009 package using safe labels/categories only.
- Hosted target metadata preflight passed by category only: existing hosted read-only UAT target category, no target URL or secret value recorded, no deploy/promotion, no hosted configuration change, no account creation, no file operation, and no mutation.
- Route/persona smoke categories were approved by category only for management/project admin, assigned internal/account manager, client approver, client viewer, and unassigned/unauthorized client category.
- Hosted route/persona smoke was blocked, not failed, because approved out-of-band credentials were unavailable in this local execution context; no hosted route was opened.
- Read-only tenant/client isolation categories were approved, but hosted isolation execution was blocked by the same credential availability blocker; no direct object identifiers, row content, file content, or customer content were accessed.
- No-op proof was recorded with aggregate operational counts only: 0 hosted routes opened, 0 hosted DB reads by this agent, 0 hosted mutations, 0 file operations, 0 account operations, 0 deploy/promote/config operations, and 0 approval/status/delivery mutations.
- Customer-content baseline counts were blocked because collecting hosted data counts would require approved credentials or hosted DB access not available here; no row content was read.
- No hosted DB mutation, deploy/promote action, non-Hadna customer data use, account creation, file upload/delete/download/opening, credential output, screenshot, workbook content, evidence link, caption, deliverable title, token value, secret value, row-level customer content, or Production acceptance was introduced.
- Recommended next phase after target preflight/no-op proof: resume Phase 5 route/persona smoke only after approved credentials are supplied out-of-band, then Phase 6 read-only isolation checks if all routes remain read-only.

## R-009 Limited Hosted Read-Only UAT Authorization & Execution Planning - 2026-07-08

- Owner accepted R-008 as local readiness only.
- R-008 remains closed as local readiness evidence only; it is not Production acceptance and does not authorize hosted DB mutation, deploy/promote, or non-Hadna data use.
- Owner authorized creating R-009 as the next large Spec Kit package for limited hosted read-only UAT authorization and execution planning.
- R-009 package created at `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/` with spec, plan, tasks, research, data model, contracts, quickstart, checklist, and evidence scaffolds.
- R-009 defines hosted target requirements, allowed read-only checks, forbidden actions, credential and evidence redaction rules, no-op proof, route/persona smoke categories, and tenant/client isolation checks that can be run read-only.
- R-009 execution is blocked until explicit owner approval is recorded inside the R-009 package with target environment, Hadna-only data boundary, personas, read-only routes/checks, duration, credential handling, evidence rules, no-op proof, stop conditions, and rollback/no-op owner.
- No hosted check, hosted DB mutation, deploy/promote action, non-Hadna customer data use, account creation, file upload/delete, dependency addition, product code change, credential output, screenshot, workbook content, external evidence link, caption, deliverable title, token value, secret value, or Production acceptance was introduced by this planning pass.

## R-008 Final Local-Only Go/No-Go Package - 2026-07-08

- Owner direction continued R-008 with a large final local-only pass covering Phase 7 / US5 and Phase 8.
- US5 added the final go/no-go summary builder, release boundary tests, and owner decision package.
- The owner package offers these choices: accept R-008 local readiness only, request fixes, authorize limited hosted read-only UAT, authorize limited hosted UAT mutation with named environment/data/rollback/duration/evidence, or start a separate production-candidate package.
- Targeted US5 verification passed: 2 files / 5 tests.
- Final Phase 8 local verification passed for lint, typecheck, unit, integration, component, RLS simulator, full E2E, secret scan, whitespace check, build, and final R-008 evidence redaction scan.
- Local pgTAP database verification was blocked by local Docker engine availability; no DB/RLS changed in this pass, RLS simulator passed, and no hosted database check was used.
- No hosted database mutation, deploy/promote action, non-Hadna customer data use, dependency addition, credential output, screenshot, workbook content, external evidence link, caption, deliverable title, token, secret value, or Production acceptance was introduced.
- Next owner decision: choose one R-008 go/no-go outcome from the final package. Production acceptance remains a separate explicit owner decision and is not granted or implied.

## R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution Planning - 2026-07-08

- Owner accepted R-007 for readiness review with the recorded local Docker repeatability risk.
- This acceptance is not Production acceptance and does not authorize hosted database mutation, non-Hadna customer data use, deploy, or promotion.
- Owner authorized starting R-008 as a new Spec Kit package, planning first only.
- R-008 package created at `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/` with spec, plan, tasks, research, data model, contracts, quickstart, checklist, and initial evidence.
- R-008 scope is controlled pilot execution gates, tenant/client isolation proof, production-candidate security checklist, hosted UAT authorization boundary, client approval hardening, file/final-delivery readiness, audit completeness, SLA reporting readiness, rollback planning, and owner go/no-go evidence.
- No R-008 code implementation, hosted DB mutation, non-Hadna data use, dependency addition, deploy, promotion, or Production acceptance was introduced by this planning pass.
- Next owner decision: approve a specific R-008 implementation path, such as local-only hardening, limited hosted read-only UAT, or limited hosted UAT mutation with named environment, data boundary, mutation plan, rollback plan, duration, and evidence rules.

## R-008 Phase 3/4 Local Hardening - 2026-07-08

- Owner direction continued R-008 on the approved local-only hardening path.
- Phase 3 / US1 implemented owner-controlled pilot gate logic for allowed local actions, blocked hosted mutation, deploy/promote, non-Hadna data, production-candidate review, and separate Production acceptance.
- Phase 4 / US2 implemented tenant/client isolation proof using synthetic local fixture categories only.
- Isolation proof covers management/project admin, assigned internal user, client viewer, client approver, and unassigned client user categories.
- Client A category cannot see Client B category deliverables, files, or approval items; unassigned client category receives a safe empty/denied state.
- Client viewer category cannot approve; client approver category can approve only assigned current visible client items.
- Targeted local unit verification passed: 5 files / 18 tests.
- Targeted local integration verification passed: 1 file / 4 tests.
- Targeted local client isolation E2E passed: 9 tests across desktop, mobile, and RTL projects.
- Final local verification for this US1/US2 pass passed:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run secret:scan`
  - `git diff --check` with existing Windows line-ending warnings only
  - `npm run test:unit`: 36 files / 129 tests
  - `npm run test:integration`: 24 files / 96 tests
  - `npm run test:component`: 17 files / 54 tests
  - `npm run test:rls:simulator`: 8 files / 24 tests
  - `npm run test:e2e`: 98 passed / 4 skipped
  - `npm run build`
- No hosted database mutation, deploy/promote action, non-Hadna customer data use, dependency addition, credential output, screenshot, workbook content, external evidence reference, caption, deliverable title, token, secret value, or Production acceptance was introduced.

## R-008 Phase 5/6 Local Hardening - 2026-07-08

- Owner direction continued R-008 on the approved local-only hardening path.
- Phase 5 / US3 implemented production-candidate security checklist, R-008 evidence redaction policy, rollback plan model, and safe security/rollback evidence docs.
- Phase 6 / US4 implemented local approval journey, final delivery file readiness, audit completeness, and SLA reporting readiness probes.
- Client approval journey is locally proven for current-version approval, stale-version denial, viewer denial, and approver scope denial.
- Final delivery readiness proves internal file categories stay hidden and final files require authorized final visibility.
- Audit completeness covers approval, file, SLA, delivery, package-affecting, and security-denial categories.
- SLA reporting readiness proves client waiting time is separated from Samawah-owned work time.
- Client approval/final-delivery mobile and RTL readiness is covered locally.
- Targeted US3 verification passed: 3 unit files / 9 tests.
- Targeted US4 verification passed: 2 integration files / 4 tests, 2 unit files / 5 tests, and focused Playwright 7 passed / 2 skipped.
- Final local verification for this pass passed:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run secret:scan`
  - `git diff --check` with existing Windows line-ending warnings only
  - `npm run test:unit`: 41 files / 143 tests
  - `npm run test:integration`: 26 files / 100 tests
  - `npm run test:component`: 17 files / 54 tests
  - `npm run test:e2e`: 105 passed / 6 skipped
  - `npm run build`
- Count-only R-008 evidence redaction scan returned 0 link, 0 email, and 0 image-reference matches in R-008 evidence/release docs; remaining matches are redaction vocabulary only.
- No hosted database mutation, deploy/promote action, non-Hadna customer data use, dependency addition, credential output, screenshot, workbook content, external evidence reference, caption, deliverable title, token, secret value, or Production acceptance was introduced.
- Next recommended phase is Phase 7 / US5: owner go/no-go evidence package. Hosted mutation, deploy/promote, non-Hadna data, and Production acceptance remain blocked unless separately approved.

## R-007 Phase 7 Final Polish And Verification - 2026-07-08

- R-007 is ready for owner readiness review, not Production acceptance.
- Fixed the full E2E client-invitation portal route regression caused by the R-007 client detail waiting-approval label no longer being exposed as a heading.
- Full E2E now passes: 89 passed / 4 skipped across desktop, mobile, and RTL route categories.
- Final local checks passed for lint, typecheck, unit, integration, component, RLS simulator, standalone pgTAP after local reset, secret scan, whitespace, and build.
- Standalone `npm run test:rls:db` passed after starting Docker Desktop and resetting the local Supabase database: 4 pgTAP files / 142 tests.
- Repeat combined `npm run test:rls` remains locally unstable because Docker Desktop later stayed in a starting/API-error state. Simulator and standalone pgTAP evidence passed, but the combined command was not repeatably green at the end of Phase 7.
- No hosted database mutation, non-Hadna customer data use, dependency change, credential output, screenshot, workbook content, link, caption, deliverable title, token, secret value, or Production acceptance was introduced by Phase 7.
- Next owner decision: accept R-007 owner readiness review with the recorded local Docker repeatability risk, then decide separately whether to authorize a broader pilot or production-candidate Spec Kit package.

## R-007 US4 Release Evidence Readiness - 2026-07-08

- R-007 remains a readiness package only; it does not grant Production acceptance.
- US4 added release evidence completeness coverage and role matrix regression coverage using local synthetic categories only.
- Evidence categories now include `tenant_client_isolation`, `role_negative_tests`, `client_waiting_pause`, `resume_on_client_change_request`, `version_bound_decisions`, `stale_version_denial`, `internal_file_hidden`, `client_visible_file_authorization`, `sensitive_transition_audit`, `security_denial_audit`, `client_rtl_mobile`, `secret_scan_outcome`, `blocked_checks_and_residual_risks`, and `production_acceptance_separate_owner_decision`.
- Persona categories recorded for owner review: `management_project_admin`, `assigned_internal_user`, `client_approver`, `client_viewer`, and `unassigned_client_user`.
- Local quickstart verification passed for typecheck, lint, unit, integration, component, RLS simulator, secret scan, whitespace, and build checks.
- Local pgTAP DB verification is blocked by local database connectivity; no hosted DB mutation was attempted.
- Full E2E is not green: the client-invitation portal route category fails across desktop, mobile, and RTL projects, while the R-007 client portal readiness route category passed across those projects.
- No hosted database mutation, non-Hadna customer data use, dependency change, credential output, screenshot, workbook content, link, caption, deliverable title, token, secret value, or Production acceptance was introduced by US4.
- Next owner decision: accept R-007 for Phase 7 final polish/verification, then decide separately whether to authorize a broader pilot or production-candidate Spec Kit package.

## R-006 Owner Acceptance Decision - 2026-07-08

- Owner explicitly accepted R-006 after the final owner acceptance smoke passed.
- Accepted scope: Hadna-only internal UAT/MVP evaluation flow on the promoted alias after PR #36 merge.
- This acceptance does not grant Production acceptance, does not authorize non-Hadna customer data use, and does not authorize new hosted DB mutation.
- No code, dependency, hosted data, credential, screenshot, workbook-content, link, caption, or deliverable-title change was introduced by this decision record.
- Next larger work should start as a new Spec Kit package with explicit scope before code, using R-006 as the accepted baseline.

## R-006 Final Owner Acceptance Smoke - 2026-07-08

- Ran the final owner acceptance smoke on the current promoted `main` alias after PR #36 merge.
- Scope used only Hadna R-006 UAT accounts and out-of-band credentials.
- No hosted DB mutation was performed, and no credentials, emails, screenshots, workbook row content, links, captions, deliverable titles, tokens, or secret values were recorded.
- Management/project admin passed: Hadna context loaded with the correct admin shell.
- Account manager passed: role shell labels were visible and admin-only shell labels were absent.
- Client viewer A passed: simplified client portal, package, and deliverables scope loaded without management chrome or management-only links.
- Viewer B isolation passed: no Hadna context and no client data cards were visible.
- Mobile client portal passed: no horizontal overflow and no management chrome.
- Final smoke found no Product, UX, Security, or Data issue in the requested scope.
- R-006 is ready for owner acceptance review as internal UAT evidence only; this is not Production acceptance.

## R-006 PR #36 Merge And Post-Merge Smoke - 2026-07-08

- Owner explicitly approved merging PR #36 (`fix(R-006): scope account manager shell navigation`).
- PR #36 was marked ready for review and merged into `main` with merge commit `ce57bd103d585d8d18cbb5273e5120dc6cab7b7e`.
- Pre-merge review conclusion: UX-only follow-up for UX-001; no Supabase migration, RLS policy, permission model, server action, hosted data script, package dependency, or workflow-state mutation changed.
- `quality` passed and CodeRabbit had no actionable review findings before the normal merge; no admin override was used.
- The merged `main` build was deployed and promoted for UAT smoke as `https://sharik-platform-qhhotsd0e-omarhussien2s-projects.vercel.app` behind `https://sharik-platform.vercel.app`.
- Post-merge authenticated smoke passed on the alias for management/project admin, account manager, and client viewer A using only Hadna R-006 UAT accounts and out-of-band credentials.
- UX-001 is resolved on the promoted alias: the account manager sees role shell labels and no admin-only shell labels.
- No hosted DB mutation, credential output, screenshots, workbook row content, captions, links, tokens, deliverable titles, or Production acceptance was introduced by this pass.

## R-006 Owner UAT Follow-up - 2026-07-08

- Ran hosted owner UAT on merged MVP Productization `main` at `https://sharik-platform.vercel.app` using only Hadna R-006 UAT accounts and out-of-band credentials.
- No hosted application data mutation was performed; no credentials, screenshots, workbook row content, captions, links, tokens, or deliverable titles were recorded.
- Management/project admin passed: Hadna-first landing, Arabic RTL, Hadna client scope, and 52 safe management deliverable cards.
- Client viewer A passed: Hadna client portal and package summary loaded with 52 client deliverable cards, no management labels, and no forbidden identifiers.
- Viewer B isolation passed: safe no-assigned-client state, 0 data cards, and no Hadna visibility.
- Account manager produced one UX follow-up: data remained safe and scoped, but static page chrome exposed admin-oriented labels (`لوحة الإدارة`, `الفريق`, `الدعوات`) above the correct account-manager body navigation.
- Focused follow-up branch created: `codex/r006-owner-uat-shell-nav-fix`.
- Fix prepared: management shell now accepts role-aware navigation/breadcrumb labels from authenticated runtime, with a neutral fallback for fixture/unauthenticated states.
- Targeted local verification passed after the fix:
  - `npm run test:component -- tests/component/product-shell.test.tsx tests/component/security-shell.test.tsx`
  - `npm run test:e2e -- tests/e2e/mvp/three-role-mvp.spec.ts`

## R-006 Owner Merge Gate - 2026-07-08

- Owner explicitly approved merging PR #35 (`R-006 MVP Productization Sprint`).
- PR #35 was merged into `main` with merge commit `4a7b2d1dd6aa2e5230bbf2863abfd62307e8f748`.
- Local `main` was fast-forwarded to `origin/main` after the merge.
- PR #35 pre-merge gate was green: `MERGEABLE`, `CLEAN`, `quality` success, and CodeRabbit status success.
- Post-merge UAT smoke passed on `https://sharik-platform.vercel.app` for `/`, `/sign-in`, `/portfolio`, `/clients`, `/client`, and `/client/commercial`.
- No hosted DB mutation, credential output, non-Hadna data use, or production acceptance was introduced by the merge gate.

## R-006 MVP Productization Sprint - 2026-07-03

This section supersedes the narrower three-role navigation polish notes for the current MVP evaluation branch.

- PR #34 (`R-006 Three-role UAT navigation polish`) was merged into `main`; new work continues on `codex/r006-mvp-productization`.
- Productization goal: make the Hadna UAT journey understandable as: `هذه هدنة، هذه الباقة، هذه المخرجات، هذا ما تم، هذا ما ينتظر، وهذا ما يراه كل دور`.
- No hosted DB mutation was performed in this pass; the Hadna data scope remains the existing owner-authorized UAT data only.
- Added a Hadna MVP snapshot surface across management, account-manager, deliverables, and client portal pages: 52 deliverables, 5 package lines, internal UAT status, work waiting count, and client waiting count.
- Updated the role navigation model:
  - Management/project admin: `لوحة الإدارة`, `العملاء`, `هدنة`, `المخرجات`, `المتابعة / SLA`.
  - Account manager: `عملائي`, `هدنة`, `مخرجات هدنة`, `ملخص المتابعة`.
  - Client: `الرئيسية`, `مخرجاتي`, `الباقة والمتبقي`, `بانتظار موافقتي` when applicable later.
- Client portal now shows only the Hadna client portal story: package summary, allowed deliverables, and no management/customer-list surface.
- Deliverable lists now show a safe scannable set only: name, channel/type, date, status, and progress. Full descriptions/captions/links are not rendered in the MVP list.
- Route fixtures used by local E2E now model Hadna-only UAT with 1 client, 1 contract, 1 package, 5 package lines, and 52 deliverables; `client_viewer_b` remains unassigned for isolation coverage.
- Replaced user-facing old wording on touched surfaces:
  - `تسجيل الدخول الإداري` -> `تسجيل الدخول إلى شريك`
  - `لوحة المتابعة` where it meant internal board -> `لوحة العمل`
  - `ملخص المتابعة` where it meant package/SLA surface -> `المتابعة / SLA` or `الباقة والمتبقي`
  - generic unavailable-resource wording -> clearer Arabic safe-denial copy.
- Local targeted verification passed before full release checks:
  - `npm run typecheck`
  - `npm run test:unit`
  - `npm run test:component`
  - `npm run lint`
  - targeted Playwright set for commercial summary, MVP three-role smoke, create-client, internal invite, and denial UX across desktop/mobile/RTL.
- Full requested verification passed after the MVP code pass:
  - `npm run lint`: PASS.
  - `npm run typecheck`: PASS.
  - `npm run test:unit`: PASS, 24 files / 84 tests.
  - `npm run test:component`: PASS, 16 files / 51 tests.
  - `npm run test:e2e`: PASS, 79 passed / 2 skipped across desktop, mobile, and RTL projects.
  - `npm run secret:scan`: PASS, no high-confidence secrets found.
  - `git diff --check`: PASS with Windows CRLF working-copy warnings only.
  - `npm run build`: PASS, including static page generation.
- Vercel UAT deployment completed with direct deployment `https://sharik-platform-ao0fjvrwn-omarhussien2s-projects.vercel.app` and alias `https://sharik-platform.vercel.app`.
- Post-deploy unauthenticated smoke passed: `/` redirects to `/sign-in`, `/sign-in` returns 200, and protected management/client routes render safe sign-in/session states without Hadna data exposure. Authenticated three-role smoke was covered locally by E2E because hosted fixture actors are disabled by design and UAT credentials remain out-of-band.
- PR #35 was opened for review, then explicitly approved by the owner and merged on 2026-07-08.

## Latest R-006 Execution Update - 2026-07-03

This section supersedes the older R-006 blocked/preflight notes below for the current PR #33 state.

- Owner-authorized internal UAT executed using the Hadna workbook, Supabase UAT `sharik-uat` / `jnvuccapgsabrwwkxnbh`, and temporary Vercel UAT hosting.
- Imported the 52-row forward Hadna block into scoped UAT records: 1 client, 1 contract, 1 package, 5 package lines, 52 deliverables, 4 synthetic users, and 57 audit events after the Arabic display-name correction audit.
- Added F006 client-portal commercial read RLS policies requiring active client membership and active client-scoped role assignment.
- Hosted RLS database test passed for the new commercial read policies.
- Vercel deployment URL: `https://sharik-platform-785s4i5xd-omarhussien2s-projects.vercel.app`.
- Temporary smoke URL: `https://sharik-platform.vercel.app`, promoted to the same deployment for internal UAT.
- Web smoke passed for tenant admin login, client viewer login, management/client visibility, basic isolation, RTL, and mobile.
- Supabase data smoke passed: admin and viewer A see 1 client, 1 package, and 52 deliverables; viewer B sees 0 clients.
- Access fix pass completed after owner reported account-manager safe-denial behavior: hosted DB audit showed the account manager already had an active client-scoped Hadna role, viewer A had active Hadna client membership plus role, and viewer B had no active Hadna client membership.
- Root cause was the `/clients` route guard requiring tenant-wide client list permission; the fix allows non-client internal users with assigned client-scoped `CLIENT_VIEW` while keeping client-portal-only users out of the management clients index.
- Access fix smoke passed on `https://sharik-platform.vercel.app`: account manager sees 1 Hadna card on `/clients`, opens Hadna detail, and sees 52 deliverables; client viewer A sees Hadna client portal/commercial summary; viewer B sees safe no-assigned-client state and no Hadna data.
- Hadna visibility-first pass deployed and promoted `https://sharik-platform-gq8tjtxyj-omarhussien2s-projects.vercel.app`: UUID-like route segments are hidden from breadcrumbs, client-unavailable copy now says `لا يمكنك الوصول لهذا العميل` / `تأكد من اختيار عميل مسند لك.` / `العودة للعملاء`, and the false no-real-client-data shell phrase was removed.
- Visibility smoke passed on `https://sharik-platform.vercel.app`: account manager sees 1 client card, opens Hadna detail, sees 52 deliverables, and no Hadna UUID is rendered in page text; viewer A sees Hadna portal/commercial summary; viewer B sees safe no-assigned-client state with zero articles and no Hadna name/slug.
- Arabic UX UAT pass corrected the scoped Hadna display name to `هدنة` with a `ClientUpdated` audit event, kept the client id/slug/linkage unchanged, and simplified the first `/clients` card buttons to `عرض العميل`, `المخرجات`, `العقد والباقة`, and `ملخص المتابعة`.
- Arabic UX smoke passed on `https://sharik-platform.vercel.app`: account manager sees `هدنة`, no UUID or Latin `Hadna`, four requested card buttons, 4 detail operation cards, and 52 deliverables; viewer A sees `هدنة`; viewer B sees zero articles and no `هدنة`/`Hadna`.
- Three-role UAT navigation polish added clearer next-step links without DB mutation: the account-manager/team portfolio cards now link directly to `عرض العميل`, `المخرجات`, and `ملخص المتابعة`; the client portal home now has a primary `عرض ملخص المتابعة` action and a simple `المخرجات والمتابعة` explanation.
- Three-role UAT navigation polish deployed `https://sharik-platform-16z047sh3-omarhussien2s-projects.vercel.app` and promoted `https://sharik-platform.vercel.app`. Public alias unauthenticated check redirects to `/sign-in`; authenticated UAT credentials remain out-of-band.
- No hosted DB correction was needed in the access fix pass.
- No existing UAT data was deleted.
- No workbook row content, links, captions, screenshots, credentials, tokens, or sensitive values were recorded.
- PR #33 remains Draft/Open and must not be merged without separate owner authorization.

## Current Execution Gate

| Item                     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product name             | `Sharik`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Package slug             | `sharik-platform`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Feature                  | R-006 Internal Online Trial Execution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Worktree                 | `codex/r006-internal-online-trial-execution`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Branch                   | `codex/r006-internal-online-trial-execution` from PR #32 `origin/main`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Draft PR                 | [#33 R-006 Internal Online Trial Execution - Preflight Blocked](https://github.com/samawah-media/Sharik/pull/33)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| PR status                | Draft / Open / Preflight Blocked; GitHub live check reports mergeable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Draft PR creation HEAD   | `2e3fe7e830336e24b56ce078da4af23d8bf98734`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Current allowed stage    | Internal UAT mapping and execution evidence only; no hosted mutation/deployment until mapping and a minimum-scope insertion/deploy plan are reviewed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Status                   | R-006 execution started from `10fc4a3b4c8f717d284d177906d1f32f5f61976c`. Owner update on 2026-07-02 authorizes using Supabase UAT `sharik-uat` / `jnvuccapgsabrwwkxnbh` despite previous users/data, authorizes the local workbook `خطة محتوى هدنة - العدد الثاني (1)` as internal source input, and authorizes Vercel deployment for internal testing only, not Production acceptance. Workbook structure was inspected without printing sensitive row content. No trial URL, credentials, hosted seed, hosted migration, hosted insertion, deployment, production promotion, public signup, dependency change, or product feature expansion was introduced. |
| Latest preflight refresh | 2026-07-02: Project-control refresh confirmed PR #33 remains Draft/Open/MERGEABLE from HEAD `ea3512f4be0164bb13c5e711936251c8d4f1deb7`. The earlier clean-target blocker is superseded by owner authorization for internal UAT only. Local workbook review found 15 sheets and three main convertible blocks with 20, 40, and 52 candidate rows. The run still stopped before hosted mutation/deploy because mapping and exact insertion/deploy plans must be reviewed first.                                                                                                                                                                                 |
| Next gate                | Review the workbook-to-Sharik mapping, choose the exact row subset, decide whether to create an isolated internal-trial client/contract/package or attach to existing UAT records, then prepare a minimum hosted insertion plan using existing scoped/audited paths.                                                                                                                                                                                                                                                                                                                                                                                          |
| Owner decision required  | Approve the exact mapping/execution path and row subset. Do not convert PR #33 to Ready and do not merge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## R-006 Internal Online Trial Execution - 2026-07-02

Baseline:

- Started from PR #32 `origin/main` commit `10fc4a3b4c8f717d284d177906d1f32f5f61976c`.
- Active branch: `codex/r006-internal-online-trial-execution`.
- Draft PR #33: `https://github.com/samawah-media/Sharik/pull/33`.
- PR #33 status: Draft / Open / Preflight Blocked; GitHub live check reports mergeable.
- Draft PR creation HEAD: `2e3fe7e830336e24b56ce078da4af23d8bf98734`.
- Readiness package reviewed before operational action: `specs/007-r006-internal-online-trial-readiness/`.
- Execution package created under `specs/008-r006-internal-online-trial-execution/`.

Preflight result:

- Supabase candidate metadata: `sharik-uat`, ref `jnvuccapgsabrwwkxnbh`, region `eu-west-1`, `ACTIVE_HEALTHY`.
- Supabase local linked ref remains `jnvuccapgsabrwwkxnbh`.
- Supabase table-name read-only query passed without row values.
- Supabase auth count preflight BLOCKED: 5 auth users exist and all are outside `@r006.example.test`.
- Supabase public data preflight BLOCKED: aggregate counts found 1 tenant, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, and 3 audit events.
- Owner update: `sharik-uat` is authorized for internal R-006 despite those existing users/data; this does not authorize broad mutation or cleanup.
- Supabase public signup status remains BLOCKED because no safe read-only status surface was available; no signup attempt was made.
- Vercel linked project is `sharik-platform`.
- Vercel Preview env names are empty, branch-scoped Preview env names are empty, and custom `staging` is not found.
- Vercel env names are otherwise scoped to Production only.
- Vercel Preview deployments are empty; listed deployments are Production environment only.
- Follow-up PR #33 live check on 2026-07-02 confirmed Draft/Open/MERGEABLE with `quality` and `CodeRabbit` passing; no CodeRabbit blocker marker was detected.

Stop decision:

- No hosted migration.
- No hosted seed.
- No hosted insertion from the workbook.
- No hosted account creation.
- No temporary credentials generated.
- No Vercel deployment.
- No preview/staging trial URL issued.
- All requested smoke checks are blocked until mapping, insertion/deploy path, URL, and credentials are approved.

Workbook mapping evidence:

- Local workbook source was authorized by owner for internal trial only.
- The workbook has 15 sheets; three main convertible blocks were structurally inspected without printing row content.
- Candidate blocks contain 20, 40, and 52 convertible rows with date ranges 2026-02-12 to 2026-03-08, 2026-03-16 to 2026-07-24, and 2026-07-25 to 2026-09-29.
- Proposed mapping targets existing Sharik client/contract/package/package-line/deliverable fields; no migration is currently required for the basic import plan.

Synthetic roster prepared without credentials:

- `tenant-admin@r006.example.test`
- `account-manager@r006.example.test`
- `client-viewer-a@r006.example.test`
- `client-viewer-b@r006.example.test`

Evidence:

- Execution release doc: `docs/08-release/R-006-internal-online-trial-execution.md`.
- Evidence file: `specs/008-r006-internal-online-trial-execution/evidence/verification.md`.

## R-006 Internal Online Trial Readiness - 2026-07-01

Baseline:

- Started from post-F-005 `origin/main` commit `1bc9e74af87959a053937e373d1d34ffcc6e2b65`.
- F-005 PR #29 is merged and is the official UI baseline.
- Active worktree identifier: `codex/r006-internal-online-trial-readiness`.

Scope prepared:

- Created Spec Kit package under `specs/007-r006-internal-online-trial-readiness/`.
- Added release readiness doc `docs/08-release/R-006-internal-online-trial-readiness.md`.
- Defined non-production Supabase boundary and non-production Vercel preview/staging boundary.
- Added synthetic data plan only; no `r006` seed file was created or applied.
- Added readiness checklist for current accepted surfaces: sign-in, product shell, clients, contracts, packages, deliverables, Kanban, audit, SLA, tenant/client isolation, denied client viewer board access, RTL, and mobile.

Scope preserved:

- No online trial started.
- No hosted Supabase project was linked, migrated, seeded, or mutated.
- No Vercel deployment was created.
- No Production Supabase, production deployment, production acceptance, or real client data.
- No temporary credentials, password hashes, database passwords, service role keys, access tokens, or secrets were recorded.
- No dependencies, schema migrations, seed files, product code, files/comments/approvals, drag/drop, AI, social scheduling, or billing were added.

Verification:

- `npm ci`: passed from existing lockfile only; 2 moderate existing audit findings reported.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 24 files / 81 tests.
- `npm run test:integration`: passed, 20 files / 83 tests.
- `npm run test:rls`: passed; simulator 8 files / 24 tests and pgTAP 3 files / 133 tests.
- `npm run test:component`: passed, 15 files / 47 tests.
- `npm run test:e2e`: passed, 67 passed / 2 skipped.
- `npm run secret:scan`: passed; no high-confidence secrets found.
- `npm run build`: passed.
- Final `git diff --check`: passed; CRLF working-copy warnings only.
- Final `npm run secret:scan`: passed after docs were finalized; no high-confidence secrets found.

Result:

- R-006 is ready for owner review as a readiness package only.
- The internal online trial remains blocked until a separate owner-approved execution package exists.

## R-005 Internal Online Trial Readiness - 2026-07-01

Scope prepared:

- Created Spec Kit package under `specs/006-internal-online-trial-readiness/`.
- Defined hosted staging environment name `sharik-internal-trial-staging`.
- Added guarded synthetic seed at `supabase/seeds/r005_internal_online_trial_readiness.sql`.
- Seed fixture uses tenant `Samawah Demo`, two synthetic clients, one contract and one package per client, eight deliverables across current workflow states, and three personas: tenant admin, account manager, and client viewer.
- All seeded emails use `@r005.example.test`; seeded users have no committed password value or password hash.
- Documented out-of-GitHub credential delivery for the project owner.
- Added UAT checklist for login, clients, client detail, contract/package/deliverables, Kanban board, allowed/denied status transition, client viewer board denial, audit log, SLA display, and RTL/mobile basic.
- Extended `npm run secret:scan` coverage to include SQL files.

Scope preserved:

- No Production Supabase.
- No real client data.
- No public signup.
- No broad/open permissions.
- No AI, social scheduling, billing, drag/drop, files, comments, or full approval workflow.
- No database schema migration and no dependency addition.

Verification:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 24 files / 81 tests.
- `npm run test:integration`: passed, 20 files / 83 tests.
- `npm run test:rls`: passed after local Supabase reset; simulator 8 files / 24 tests and pgTAP 3 files / 133 tests.
- `npm run test:component`: passed, 13 files / 42 tests.
- `npm run test:e2e`: passed, 67 passed / 2 skipped.
- `npm run secret:scan`: passed with SQL files included.
- `npm run build`: passed.
- Local R-005 seed validation: passed against local Supabase after reset; no hosted Supabase project was mutated.
- PR opened: draft PR #27, `chore(R-005): prepare internal online trial`.

## F-004 Internal Kanban Workflow MVP - 2026-07-01

Scope implemented:

- Created Spec Kit package under `specs/005-internal-kanban-workflow/`.
- Chose `/clients/[clientId]/deliverables/board` to keep the board nested under the existing deliverables management area.
- Used existing deliverable lifecycle statuses and select/action controls; no `dnd-kit` dependency was added and no ADR was required.
- Added tenant/client scoped board reads, management links from `/clients`, `/clients/[clientId]`, and `/clients/[clientId]/deliverables`.
- Added secure status transition command, server action, Supabase RPC migration, progress derivation from status, SLA card evaluation, and audit events for allowed/denied transitions.
- Preserved constraints: no Production Supabase, no real client data, no RoleKey changes, no standalone `project_manager`, no comments/files/full approvals/social scheduling/AI.

Targeted verification passed before the full suite:

- Unit: deliverable rules and permission catalog.
- Integration: status workflow command, audit events, rollback, stale revision, client-role denial.
- RLS simulator: Client A/Client B isolation and client-role internal board denial.
- Component: board columns/cards/action controls.
- E2E: board route and client viewer denial across desktop/mobile/RTL.

Full local verification:

- `git diff --check`: passed; CRLF working-copy warnings only.
- `npm run secret:scan`: passed; no high-confidence secrets found.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 23 files / 77 tests.
- `npm run test:integration`: passed, 20 files / 83 tests.
- `npm run test:rls`: simulator passed, 8 files / 24 tests; DB pgTAP portion was blocked because Docker Desktop/local Supabase Postgres was unavailable in this environment (`dockerDesktopLinuxEngine` pipe missing). No hosted or Production Supabase was used.
- `npm run test:component`: passed, 13 files / 42 tests.
- `npm run test:e2e`: passed on final rerun, 67 passed / 2 skipped.
- `npm run build`: passed.

## R-004 Closure After PR #25 - 2026-07-01

Verification:

- PR #24, `[codex] R-004 authenticated synthetic UAT`, merged on 2026-06-30 with merge commit `9d7d69e293000e479790958da4ed82641354f1a6`.
- PR #25, `[codex] R-004 expose management UAT routes`, merged on 2026-07-01 with merge commit `0872780d00799ec42e95d3ea889c686cce8b7bad`.
- The active F-004 branch starts from `origin/main` after PR #25.
- Supabase UAT project ref remains `jnvuccapgsabrwwkxnbh`; no Production Supabase or real client data was used.
- Temporary password cleanup was run only for hosted users matching `@r004.example.test`.
- Cleanup result: 5 synthetic users had temporary password hashes cleared; follow-up verification found 0 `@r004.example.test` users with a remaining password hash.
- No password, database password, service role key, access token, or secret value was printed or committed.

Result:

- R-004 is closed for internal online MVP UAT evidence after PR #25.
- Vercel `https://sharik-platform.vercel.app` remains Production hosting-only, not Production acceptance.
- `supabase/seeds/r004_internal_online_mvp_uat.sql` remains the only approved R-004 hosted UAT seed; `supabase/seed.sql` remains prohibited for hosted R-004 UAT.
- Broader Supabase access token or DB password rotation, if needed from earlier owner-operated setup, remains outside committed repo evidence and must be handled without exposing secrets.

## R-004G Authenticated Synthetic UAT - 2026-06-30

Verification:

- `origin/main` contains PR #23 merge commit `4559d14495f76af8596aad79c2afd53617855935`.
- New branch `codex/r004-authenticated-synthetic-uat` starts from `origin/main` after PR #23.
- Required R-004 docs and AGENTS guidance were reviewed before implementation.
- Root `/` no longer exposes the F-001A placeholder; unauthenticated users redirect to `/sign-in`.
- Authenticated root visits redirect through existing role-aware navigation and assigned client scope.
- Temporary passwords were activated for 5 hosted `@r004.example.test` users using local in-memory environment state only; no password was written to docs, git, PR text, or logs.
- Vercel public runtime env values were refreshed after non-printable BOM characters were detected; env key names remain `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and no service-role env exists.
- Latest Vercel deployment is `dpl_9vYzg7XMUAvn1Ftm38pA8SLVdnVB`, Ready, target Production hosting-only, alias `https://sharik-platform.vercel.app`.
- Authenticated hosted browser UAT passed 22 assertions with synthetic users only.
- Browser UAT covered `/clients`, `/clients/[clientId]`, `/clients/[clientId]/contracts`, `/clients/[clientId]/contracts/[contractId]/packages`, `/clients/[clientId]/deliverables`, `/clients/[clientId]/commercial`, `/client`, and `/client/commercial`.
- Tenant/client isolation was verified in browser: Client Alpha did not see Beta, client viewers did not see management deliverables, and scoped internal users saw only allowed data.

Result:

- R-004G authenticated synthetic UAT was reviewed through PR #24 and followed by PR #25, both merged by the owner.
- No Production Supabase, real client data, dependency addition, RoleKey change, standalone `project_manager` role, Kanban/files/comments/approvals/social scheduling/AI expansion, or PR merge was introduced.
- Temporary synthetic hosted passwords were cleared after review evidence; verification found 0 remaining password hashes for `@r004.example.test`.
- Broader Supabase access token or DB password rotation, if needed from earlier owner-operated setup, remains outside committed repo evidence and must be handled without exposing secrets.

Local verification:

- `git diff --check`: passed; line-ending warnings only.
- `npm run secret:scan`: passed; no high-confidence secrets found.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 23 files / 72 tests.
- `npm run test:integration`: passed, 19 files / 76 tests.
- `npm run test:rls`: passed; simulator 7 files / 21 tests and pgTAP 2 files / 110 tests.
- `npm run test:component`: passed, 12 files / 39 tests.
- `npm run test:e2e`: passed, 61 passed / 2 expected skips.
- `npm run build`: passed without `.env.local` after marking `/` as dynamic, matching GitHub Actions where Supabase public env vars are not present.

## R-004F Hosted Supabase/Vercel UAT Results - 2026-06-30

Verification:

- `origin/main` is `20b84984913e8f707fcf5dabad54eea5b03eff64`, the merge commit for PR #22.
- GitHub check-runs for `20b84984913e8f707fcf5dabad54eea5b03eff64` returned zero checks; combined commit status has no contexts.
- New results branch `codex/r004-hosted-uat-results` starts from `origin/main` after PR #22.
- Supabase project ref `jnvuccapgsabrwwkxnbh` resolves to project `sharik-uat`, region `eu-west-1`, status `ACTIVE_HEALTHY`.
- Pre-migration no-real-data checks passed with counts only: 0 auth users, 0 non-R-004 auth users, and 0 public base tables.
- Hosted migration dry-run listed exactly 11 local migrations; hosted `db push --linked` completed.
- Post-migration `migration list --linked` shows all 11 local migrations matched on remote.
- Hosted seed used only `supabase/seeds/r004_internal_online_mvp_uat.sql`; `supabase/seed.sql` was not used.
- Direct Docker seed to the database host failed on DNS resolution; pooler-based `psql` seed succeeded.
- Post-seed counts: 5 synthetic auth users, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, 0 non-R-004 auth users, and 0 non-R-004 clients.
- Vercel CLI `50.11.0` is authenticated as `omarhussien2`; project `sharik-platform` is linked.
- Vercel production env key names only are `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; values remain encrypted and no service-role env was set.
- Vercel deployment `dpl_D3QBhGPnecEcoHtf223NvGNBVosL` is Ready with alias `https://sharik-platform.vercel.app`; target is Production hosting-only, not Production acceptance.
- Smoke checks for `/`, `/sign-in`, `/clients?actor=tenant_admin_a`, and `/client/commercial?actor=client_viewer_a` returned HTTP 200.
- Hosted HTML checks found no `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, or `sb_secret` markers and did not expose fixture client names.
- Hosted RLS count simulation: account-manager Alpha sees 1 client and 6 deliverables; Alpha/Beta client viewers each see 1 client and 0 management deliverables.
- `SUPABASE_DB_PASSWORD` and `PGPASSWORD` were confirmed absent from the shell environment after hosted operations.

Result:

- R-004 hosted migration is complete for the approved non-production UAT project.
- R-004 hosted synthetic seed is complete and scoped to the approved fixture set.
- Sharik is online for internal review at `https://sharik-platform.vercel.app`.
- The deployment is public on Vercel Hobby/free; do not use real client data.
- Full authenticated browser UAT for client management, contracts, packages, deliverables, commercial summaries, and SLA summaries remains blocked until synthetic users receive an approved temporary password/sign-in path.
- A non-blocking Supabase pg-delta catalog cache certificate warning appeared after `db push`.
- One tenant-admin RLS simulation retry was blocked by a temporary Supabase pooler auth circuit breaker after parallel checks; scoped account-manager/client-viewer simulations passed.
- No Production Supabase, real client data, new dependency, RoleKey change, standalone `project_manager` role, Kanban/files/comments/approvals/social scheduling/AI expansion, or PR merge was introduced in this results branch.

## R-004E Vercel Readiness And Remaining Hosted Blockers - 2026-06-30

Verification:

- `origin/main` is `86119ca350811511dfdc81403a5ae6548e0caf7f`, the merge commit for PR #21.
- GitHub check-runs for `86119ca350811511dfdc81403a5ae6548e0caf7f` returned zero checks; combined commit status has no contexts.
- PR #22 (`[codex] R-004 Supabase DB password blocker`) is open with `quality` and `CodeRabbit` passing.
- `SUPABASE_DB_PASSWORD` is not available in the Codex process environment, so hosted auth/user count and no-real-data verification cannot complete.
- `npx supabase@2.107.0 projects list --output-format json` shows project ref `jnvuccapgsabrwwkxnbh` as linked to `sharik-uat`.
- `npx supabase@2.107.0 link --project-ref jnvuccapgsabrwwkxnbh` still succeeds.
- Vercel CLI `50.11.0` is authenticated as `omarhussien2`.
- No `.vercel/project.json` exists in the R-004 worktree.
- `vercel project list` for the personal account reports no projects.
- The current app needs at least `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for hosted sign-in and Supabase-backed pages.

Result:

- No hosted Supabase migration was run.
- No hosted seed was run.
- No Vercel project was created or linked.
- No Vercel env var was added, updated, or printed.
- No Vercel deployment was run.
- A shell-only Vercel deployment could be created after project confirmation, but it would not be a valid team UAT without Supabase migration, synthetic seed, and smoke/security/UAT checks.
- Team-ready online UAT can proceed after DB password access is made available securely, no-real-data verification passes, hosted migration and `supabase/seeds/r004_internal_online_mvp_uat.sql` succeed, and Vercel project/env/deploy evidence is recorded.

## R-004D Supabase Link Success And DB Password Blocker - 2026-06-30

Owner action:

- Owner logged the machine into Supabase with a Personal Access Token.

Verification:

- `npx supabase@2.107.0 projects list --output-format json` now shows project ref `jnvuccapgsabrwwkxnbh`.
- Project metadata: name `sharik-uat`, region `eu-west-1`, status `ACTIVE_HEALTHY`, created `2026-06-30T08:35:34.159437Z`.
- `npx supabase@2.107.0 link --project-ref jnvuccapgsabrwwkxnbh` passed and returned the target project ref.
- Initial schema metadata query through `db query --linked` succeeded and showed only Supabase-managed auth base tables before hosted migration.
- A follow-up `auth.users` count query failed because the CLI could not complete Postgres authentication and requested `SUPABASE_DB_PASSWORD`.

Result:

- Target metadata supports UAT/non-production intent.
- The target has not been fully verified as free of real client users/data because DB password access is still missing.
- No hosted Supabase migration was run.
- No hosted seed was run.
- `supabase/seeds/r004_internal_online_mvp_uat.sql` remains the only approved R-004 hosted seed after DB verification passes.

## R-004C Supabase UAT Access Attempt - 2026-06-30

Owner input:

- Supabase project ref provided: `jnvuccapgsabrwwkxnbh`.
- The ref has the correct Supabase project-ref shape and replaces the previous placeholder blocker.
- The work continued on new branch `codex/r004-hosted-uat-run` because PR #20 was already merged into `main`.

Verification:

- `origin/main` is `a900a6e206b74a9a6e7afc62356400444bbe47f3`, the merge commit for PR #20.
- GitHub check-runs for `a900a6e206b74a9a6e7afc62356400444bbe47f3` returned zero checks; combined commit status has no contexts.
- Supabase CLI `2.107.0` is available when telemetry is disabled.
- Current Supabase CLI organizations are visible, but the target project ref is not listed under the current account.
- `npx supabase@2.107.0 link --project-ref jnvuccapgsabrwwkxnbh` failed with a Supabase access-control error: the current account does not have privileges for that project.

Result:

- No hosted Supabase migration was run.
- No hosted seed was run.
- The target could not be verified as non-production.
- The target could not be inspected for real client data/users.
- `supabase/seeds/r004_internal_online_mvp_uat.sql` remains the only approved R-004 hosted seed after access is fixed and the target passes verification.

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

| Stage                              | Status                | Evidence                                                                                                                               |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| A0 Project Foundation              | COMPLETE              | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a0.md`                                         |
| A1 Identity and Tenant Context     | VERIFIED AFTER A1R    | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a1.md`; real DB verification completed in A1R. |
| A1R Real Supabase RLS Verification | FULLY VERIFIED        | Local Docker Desktop/WSL2 stack is running; local Supabase database reset passed twice; pgTAP RLS tests passed.                        |
| A2 Client Foundation               | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a2.md`.                                      |
| A3 Internal Member Invitation      | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a3.md`.                                      |
| A4 Client Member Invitation        | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a4.md`.                                      |
| A5 Invitation Lifecycle Hardening  | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a5.md`.                                      |
| A6 Membership and Role Lifecycle   | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a6.md`.                                      |

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

## Latest Spec 015 Persistent MVP Checkpoint

Spec 015 local persistent MVP verification completed on 2026-07-11 after correcting the browser acceptance gap found in `S015-P1-019`.

Implemented scope:

- Added `APP_ENV=test-persistent` and a separate `npm run test:e2e:persistent` Playwright path.
- Exercised real local Supabase Auth/API sign-in and browser actions with route actor fixtures disabled.
- Verified assigned team submission, role-negative denials, internal approval, client change request/approval, stale-version rejection, delivery, final file visibility, audit, SLA, idempotency, and package ledger state through database assertions.
- Enabled only the local Supabase services required for API/Auth E2E and kept hosted/Vercel values out of the test app process.

Verification results:

- `npx supabase@2.107.0 db reset --local --no-seed`: passed.
- `npm run test:e2e:persistent`: passed, 3 tests.
- Full matrix passed: lint, typecheck, unit, integration, component, RLS simulator, RLS DB, fixture E2E, persistent E2E, secret scan, diff check, and build.

Boundary:

- Hosted actions performed: zero.
- Production acceptance: not granted.
- Hosted Hadna UAT remains separate and owner-approved only.

## Spec 015 latest reconciliation - 2026-07-13

- Owner-provided GitHub quality run `29248954232` initially backed X006-A through X006-G; exact-HEAD PR #37 quality run `29263587871` attempt 2 now closes X006-H and parent X006 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`.
- The temporary visual harness was removed after a pre-navigation Windows Playwright ESM loading failure; repository Playwright visual QA replaced it and is covered by the exact-HEAD CI fixture E2E run.
- No hosted persona PASS is claimed.
- X007 and H008-H010 remain open. No UAT migration/import, rollback/no-op rehearsal, Production action, external client invitation, public signup, PR merge, or workbook tracking occurred in this continuation.
