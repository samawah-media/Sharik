# Tasks: Persistent MVP Pilot Completion

## Milestone 0–1: consolidation

- [x] T001 Correct Stage 2C gate integrity and hydration regression.
- [x] T002 Commit corrected Stage 2C baseline locally.
- [x] T003 Create canonical Spec 015 package and execution spine.
- [x] T004 Run Spec Kit checklist/consistency analysis and record evidence.

## Milestone 2: persistent foundation

- [x] T005 Apply and review persistent MVP migration.
- [x] T006 Add and execute schema/RLS tests for tenant, same-tenant client, role-negative, composite-FK, append-only, atomicity, and idempotency behavior.
- [x] T007 Add persistent repository contracts for versions, approvals, comments, files, and SLA segments.
- [x] T008 Add audited server commands for internal review, internal approval, client submission, client decision, delivery, and closure.

## Milestone 3: workflow wiring

- [x] T009 Replace production route fixture reads with scoped persistent reads.
- [x] T010 Wire and DB-verify account_manager/content_writer/designer assigned-team submission and internal review UI.
- [x] T011 Wire client approval/change-request UI with exact-version and scope checks.
- [x] T012 Persist SLA pause/resume and package consumption in the same audited workflow.
- [x] T013 Add complete persistent role-based E2E journey and secrecy assertions.

## Milestone 4: local acceptance

- [x] T014 Run lint, typecheck, unit, integration, component, RLS simulator, RLS DB, E2E, secret scan, diff check, and build.
- [x] T015 Run manual RTL/mobile/keyboard matrix and record evidence.
- [x] T016 Burn down P0/P1 and disposition every P2.
- [x] T017 Record local acceptance only if DB-backed checks are green.

## Milestone 5: handoff preparation only

- [x] T018 Prepare bounded Hadna-only hosted UAT prompt, approvals, stop conditions, rollback owner, and T032 closure evidence requirements.
- [x] T019 Confirm hosted actions performed: zero; Production acceptance: not granted.

## Owner-Authorized Hosted Team UAT Amendment

Status: PARTIAL HOSTED EXECUTION COMPLETE / BLOCKED ON OWNER ACCESS INPUTS.

The following hosted tasks extend Spec 015 only. They do not reopen or invalidate completed local tasks T001-T019.

- [x] H001 Hosted target and branch preflight: confirm clean worktree, fetch origin, inspect merge base, commit list, full diff/stat, migrations, generated files, secrets, and unrelated historical work.
- [x] H002 Rollback and stop-condition approval: record deployment, database, access rollback, rollback owner, executor, execution window, stop authority, expected rollback time, and verification steps before hosted mutation.
- [x] H003 Draft PR and CI: run full local verification, push the safe reviewed branch, create a Draft PR, inspect CI, and fix only in-scope failures. Do not merge.
- [x] H004 Supabase UAT migration: verify UAT target, compare migration state, review migration inventory for destructive or unsafe operations, apply only pending reviewed repository migrations, and run post-migration schema/RLS/RPC smoke checks.
- [x] H005 Synthetic Hadna UAT seed: create minimal idempotent run-ID-scoped Hadna tenant/client/contract/package/deliverable/file metadata records and record category/count-only evidence.
- [ ] H006 Team account/access setup: configure only approved individual Samawah team testers and team-controlled client personas; if approved email mapping is unavailable, stop with `TEAM_ACCESS_INPUT_REQUIRED`.
- [x] H007 Vercel Preview deployment: configure Preview/UAT env only, deploy reviewed branch to Preview/UAT, verify Supabase UAT binding, sign-in, Arabic RTL shell, no fixture actor support, non-local `APP_ENV`, no service-role key in client bundles/logs. Preview is Ready, the owner-configured public UAT alias resolves without Deployment Protection, and hosted smoke passes for the available valid personas.
- [ ] H008 Hosted team workflow UAT: run the online UI journey with actual UAT Auth sessions across management, assigned team, unassigned internal negative, client viewer, and client approver roles.
- [ ] H009 Defect burn-down and T032 evidence: record defects in the existing register, block on P0/P1, owner-disposition every P2, verify rollback/no-op rehearsal, and record hosted T032 outcome.
- [ ] H010 Hosted handoff and boundary record: produce final owner-facing result with hosted state, PR/CI/deployment status, redacted target category, seed run ID category/count summary, team access category/count summary, isolation/approval/secrecy/audit/SLA/ledger findings, rollback result, out-of-scope work, and Production boundary.

Hosted amendment note: H001-H007 have completed under owner authorization. Hosted UAT is not PASS until H006, H008, H009, and H010 complete successfully.

## Correction note: persistent browser verification

On 2026-07-11, T013, T016, and T017 were reopened after defect `S015-P1-019` identified that the prior Playwright path used route actor fixtures under `APP_ENV=test` and therefore did not prove a real browser-to-persistent-database journey. They were closed again only after `npm run test:e2e:persistent` passed against the local Supabase API/Auth stack with `APP_ENV=test-persistent`, route fixtures disabled, synthetic Auth users, and DB assertions for version binding, role boundaries, comments/files secrecy, SLA, audit, package ledger, and delivery.
