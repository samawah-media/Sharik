# Tasks: R-006 Internal Online Trial Execution

**Input**: Design documents from `specs/008-r006-internal-online-trial-execution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Operational smoke checks ran after owner authorization for the Hadna workbook, `sharik-uat`, and temporary Vercel UAT hosting.

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
- [x] T015 [US1] Record owner authorization that superseded the earlier mutation/deploy hold for this Hadna-only UAT run

---

## Phase 4: User Story 2 - Prepare Synthetic Trial Accounts Safely (Priority: P2)

**Goal**: Prepare internal trial roster without credentials.

**Independent Test**: Verify all roster emails use `@r006.example.test` and no credentials are present.

- [x] T016 [US2] Prepare synthetic roster in `specs/008-r006-internal-online-trial-execution/data-model.md`
- [x] T017 [US2] Generate credentials only in local ignored/internal storage for smoke use
- [x] T018 [US2] Create hosted synthetic users after owner confirmed the UAT target
- [ ] T019 [US2] Complete any required credential handoff outside GitHub/docs/logs/chat/screenshots

---

## Phase 5: User Story 3 - Execute Trial Smoke Checks Only On Confirmed Preview/Staging (Priority: P3)

**Goal**: Run smoke checks on the owner-authorized temporary Vercel UAT target.

**Independent Test**: Review smoke check evidence for all required surfaces.

- [x] T020 [US3] Deploy and promote Vercel URL for temporary internal UAT
- [x] T021 [US3] Run sign-in smoke check
- [x] T022 [US3] Run client, package, and deliverables visibility smoke checks
- [x] T023 [US3] Run basic tenant/client isolation and denied client viewer access checks
- [x] T024 [US3] Run RTL and mobile smoke checks
- [x] T025 [US3] Record smoke evidence in `specs/008-r006-internal-online-trial-execution/evidence/verification.md`

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
- [x] T035 Execute hosted Hadna insertion for the owner-authorized 52-row forward block
- [x] T036 Add and run client-portal commercial RLS policy test
- [x] T037 Run Vercel deployment and promote temporary UAT alias
- [x] T038 Run web and Supabase data smoke checks
- [x] T039 Re-run `npm run secret:scan` after the execution/evidence docs update
- [x] T040 Re-run `git diff --check` after the execution/evidence docs update

## Phase 8: MVP Productization Sprint

- [x] T041 Confirm PR #34 was merged and create `codex/r006-mvp-productization` from updated `main`
- [x] T042 Run product/UX audit for sign-in, management, Hadna, deliverables, commercial summary, and client portal pages
- [x] T043 Define role navigation model for management/project manager, account manager, and client
- [x] T044 Implement Hadna-first MVP snapshot cards and role landing pages without hosted DB mutation
- [x] T045 Simplify deliverables display to safe MVP fields: name, type/channel, date, status, progress
- [x] T046 Simplify client portal to Hadna, package summary, allowed deliverables, and no management/other-client surface
- [x] T047 Add/update unit, component, and E2E coverage for MVP navigation, route guards, and Viewer B isolation
- [x] T048 Record MVP productization evidence in docs and verification notes
- [x] T049 Run full requested verification suite after documentation update
- [x] T050 Deploy to Vercel UAT alias and run post-deploy smoke
- [x] T051 Commit, push, and open the MVP Productization PR

## Phase 9: Owner UAT On Merged MVP Productization Main

- [x] T052 Run hosted owner UAT on merged `main` build with Hadna UAT accounts only
- [x] T053 Verify management/project admin, account manager, client viewer A, and Viewer B isolation views
- [x] T054 Classify hosted UAT feedback as Product / UX / Security / Data
- [x] T055 Prepare focused display-only fix for the account-manager shell UX finding without hosted DB mutation
- [x] T056 Add targeted component and E2E coverage for role-aware shell navigation and Viewer B isolation continuity
- [ ] T057 Push and open focused follow-up PR for owner review

## Dependencies & Execution Order

- Phase 1 must complete before target preflight.
- Phase 2 records boundaries before any future mutation.
- US1 owner authorization unblocked this Hadna-only UAT run.
- US2 account creation completed for smoke; credential handoff remains outside repo/chat/logs.
- US3 deployment and smoke checks completed on the promoted temporary UAT alias.
- Phase 8 must not perform hosted DB mutation unless a separate minimum-scope owner approval is recorded.

## Implementation Strategy

1. Establish execution package and baseline.
2. Run non-secret target preflight.
3. Execute the owner-authorized 52-row Hadna insertion with scoped audit evidence.
4. Deploy, smoke, document, and keep PR #33 Draft until separate merge authorization.
