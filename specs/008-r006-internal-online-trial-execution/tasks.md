# Tasks: R-006 Internal Online Trial Execution

**Input**: Design documents from `specs/008-r006-internal-online-trial-execution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Operational smoke checks are required only after mapping approval, minimum hosted insertion/deploy approval, deployment URL, and credentials exist. Current execution stops before hosted mutation and smoke checks.

**Organization**: Tasks are grouped by user story to enable independent review.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create execution branch `codex/r006-internal-online-trial-execution`
- [x] T002 Verify `origin/main` baseline commit `10fc4a3b4c8f717d284d177906d1f32f5f61976c`
- [x] T003 Read `docs/08-release/R-006-internal-online-trial-readiness.md`
- [x] T004 Read `specs/007-r006-internal-online-trial-readiness/`
- [x] T005 Create execution Spec Kit package under `specs/008-r006-internal-online-trial-execution/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T006 Document execution boundary in `specs/008-r006-internal-online-trial-execution/contracts/execution-boundary.md`
- [x] T007 Record synthetic account roster in `specs/008-r006-internal-online-trial-execution/data-model.md`
- [x] T008 Record non-secret preflight evidence in `specs/008-r006-internal-online-trial-execution/evidence/verification.md`

---

## Phase 3: User Story 1 - Confirm Safe Targets (Priority: P1)

**Goal**: Confirm exact non-production Supabase and Vercel targets before mutation/deployment.

**Independent Test**: Review execution evidence and boundary contract.

- [x] T009 [US1] Inspect Supabase linked project metadata without secret output
- [x] T010 [US1] Inspect Supabase hosted schema table names without row values
- [x] T011 [US1] Verify Supabase hosted counts for auth users, clients, and non-approved data; owner later accepted this UAT target for internal R-006 only
- [ ] T012 [US1] Verify Supabase public signup is disabled
- [x] T013 [US1] Inspect Vercel linked project and env scope without values
- [x] T014 [US1] Inspect Vercel deployment list and confirm no preview/staging target is available
- [x] T015 [US1] Stop before mutation because mapping and exact hosted insertion/deploy plan require review

---

## Phase 4: User Story 2 - Prepare Synthetic Trial Accounts Safely (Priority: P2)

**Goal**: Prepare internal trial roster without credentials.

**Independent Test**: Verify all roster emails use `@r006.example.test` and no credentials are present.

- [x] T016 [US2] Prepare synthetic roster in `specs/008-r006-internal-online-trial-execution/data-model.md`
- [x] T017 [US2] Do not generate credentials because target preflight is blocked
- [ ] T018 [US2] Create hosted synthetic users only after Supabase preflight passes and owner confirms target
- [ ] T019 [US2] Deliver credentials outside GitHub/docs/logs only after user creation is complete

---

## Phase 5: User Story 3 - Execute Trial Smoke Checks Only On Confirmed Preview/Staging (Priority: P3)

**Goal**: Run smoke checks only on confirmed preview/staging URL.

**Independent Test**: Review smoke check evidence for all required surfaces.

- [ ] T020 [US3] Deploy or select Vercel preview/staging URL after target confirmation
- [ ] T021 [US3] Run sign-in smoke check
- [ ] T022 [US3] Run product shell, clients, client detail, contracts, packages, deliverables list, and Kanban board smoke checks
- [ ] T023 [US3] Run status transition behavior, audit evidence, SLA display, tenant/client isolation, and denied client viewer access checks
- [ ] T024 [US3] Run RTL and mobile smoke checks
- [x] T025 [US3] Record current smoke checks as BLOCKED because no preview/staging URL or credentials exist

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T026 Update release execution doc in `docs/08-release/R-006-internal-online-trial-execution.md`
- [x] T027 Update project progress in `docs/PROJECT_PROGRESS.md`
- [x] T028 Update active Spec Kit context in `.specify/feature.json` and `AGENTS.md`
- [x] T029 Run `npm run secret:scan`
- [x] T030 Run `git diff --check`

## Phase 7: Owner Decision Update & Workbook Mapping

- [x] T031 Record owner authorization for `sharik-uat` internal UAT despite previous users/data
- [x] T032 Record owner authorization for local workbook source use without printing sensitive row content
- [x] T033 Inspect workbook structure locally and record only row counts, headers, date ranges, and mapping rules
- [x] T034 Prepare proposed mapping to client, contract/package, package lines, deliverables, due dates/SLA, owner, and status fields
- [x] T035 Re-run `npm run secret:scan` after the decision/mapping docs update
- [x] T036 Re-run `git diff --check` after the decision/mapping docs update

## Dependencies & Execution Order

- Phase 1 must complete before target preflight.
- Phase 2 records boundaries before any future mutation.
- US1 blocks US2 hosted account creation and all US3 smoke checks.
- US2 credential generation is blocked until US1 passes.
- US3 deployment and smoke checks are blocked until US1 and required US2 account setup pass.

## Implementation Strategy

1. Establish execution package and baseline.
2. Run non-secret target preflight.
3. Stop before hosted mutation until mapping and row subset are reviewed.
4. Resume only after minimum-scope hosted insertion/deploy approval and credential delivery outside GitHub/docs/logs/chat/screenshots.
