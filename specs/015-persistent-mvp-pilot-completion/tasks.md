# Tasks: Persistent MVP Pilot Completion

## Milestone 0–1: consolidation

- [x] T001 Correct Stage 2C gate integrity and hydration regression.
- [x] T002 Commit corrected Stage 2C baseline locally.
- [x] T003 Create canonical Spec 015 package and execution spine.
- [x] T004 Run Spec Kit checklist/consistency analysis and record evidence.

## Milestone 2: persistent foundation

- [ ] T005 Apply and review persistent MVP migration.
- [ ] T006 Add and execute schema/RLS tests for tenant, same-tenant client, role-negative, composite-FK, append-only, atomicity, and idempotency behavior. Tests are implemented; PostgreSQL execution is blocked.
- [ ] T007 Add persistent repository contracts for versions, approvals, comments, files, and SLA segments.
- [x] T008 Add audited server commands for internal review, internal approval, client submission, client decision, delivery, and closure.

## Milestone 3: workflow wiring

- [ ] T009 Replace production route fixture reads with scoped persistent reads.
- [ ] T010 Wire and DB-verify account_manager/content_writer/designer assigned-team submission and internal review UI. Wiring is implemented; DB-backed use remains blocked.
- [x] T011 Wire client approval/change-request UI with exact-version and scope checks.
- [x] T012 Persist SLA pause/resume and package consumption in the same audited workflow.
- [ ] T013 Add complete persistent role-based E2E journey and secrecy assertions.

## Milestone 4: local acceptance

- [ ] T014 Run lint, typecheck, unit, integration, component, RLS simulator, RLS DB, E2E, secret scan, diff check, and build.
- [ ] T015 Run manual RTL/mobile/keyboard matrix and record evidence.
- [ ] T016 Burn down P0/P1 and disposition every P2.
- [ ] T017 Record local acceptance only if DB-backed checks are green.

## Milestone 5: handoff preparation only

- [ ] T018 Prepare bounded Hadna-only hosted UAT prompt, approvals, stop conditions, rollback owner, and T032 closure evidence requirements.
- [ ] T019 Confirm hosted actions performed: zero; Production acceptance: not granted.
