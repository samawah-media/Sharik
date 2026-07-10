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

## Correction note: persistent browser verification

On 2026-07-11, T013, T016, and T017 were reopened after defect `S015-P1-019` identified that the prior Playwright path used route actor fixtures under `APP_ENV=test` and therefore did not prove a real browser-to-persistent-database journey. They were closed again only after `npm run test:e2e:persistent` passed against the local Supabase API/Auth stack with `APP_ENV=test-persistent`, route fixtures disabled, synthetic Auth users, and DB assertions for version binding, role boundaries, comments/files secrecy, SLA, audit, package ledger, and delivery.
