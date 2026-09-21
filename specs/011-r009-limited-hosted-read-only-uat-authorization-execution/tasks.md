# Tasks: R-009 Limited Hosted Read-Only UAT Authorization & Execution

**Input**: Design documents from `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: R-009 planning and start-pass tasks use documentation and evidence validation only unless approved out-of-band credentials are available. Hosted route checks, browser checks, and live target inspection were blocked before owner approval and are OWNER-DEFERRED when credentials or safe evidence boundaries are unavailable.

**Organization**: Tasks are grouped by user story to enable independent review and owner-controlled execution.

## Phase 1: Setup (Planning Package)

- [X] T001 Create R-009 package directory at `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/`
- [X] T002 Record R-008 local readiness-only acceptance in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/spec.md`
- [X] T003 [P] Create R-009 implementation plan in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/plan.md`
- [X] T004 [P] Create R-009 research decisions in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/research.md`
- [X] T005 [P] Create R-009 data model in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/data-model.md`
- [X] T006 [P] Create R-009 release note in `docs/08-release/R-009-limited-hosted-read-only-uat-authorization-execution.md`
- [X] T007 Update project progress with R-009 planning status in `docs/PROJECT_PROGRESS.md`
- [X] T008 Update active Spec Kit pointer in `AGENTS.md`
- [X] T009 Update active Spec Kit feature pointer in `.specify/feature.json`

**Checkpoint**: R-009 planning package exists. No hosted checks or hosted mutation have run.

---

## Phase 2: Foundational (Boundary Artifacts)

- [X] T010 [P] Create hosted read-only UAT boundary contract in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/contracts/hosted-read-only-uat-boundary.md`
- [X] T011 [P] Create evidence redaction and no-op proof contract in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/contracts/evidence-redaction-and-noop-proof.md`
- [X] T012 [P] Create route/persona smoke contract in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/contracts/route-persona-smoke-contract.md`
- [X] T013 [P] Create planning quickstart in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/quickstart.md`
- [X] T014 [P] Create specification quality checklist in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/checklists/requirements.md`
- [X] T015 [P] Create verification scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/verification.md`
- [X] T016 [P] Create owner approval record scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/owner-approval-record.md`
- [X] T017 [P] Create hosted target requirements scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/hosted-target-requirements.md`
- [X] T018 [P] Create allowed read-only checks scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/allowed-read-only-checks.md`
- [X] T019 [P] Create forbidden actions scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/forbidden-actions.md`
- [X] T020 [P] Create redaction rules scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/redaction-rules.md`
- [X] T021 [P] Create no-op/rollback proof scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/no-op-rollback-proof.md`
- [X] T022 [P] Create route/persona smoke categories scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/route-persona-smoke-categories.md`
- [X] T023 [P] Create read-only isolation checks scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/read-only-isolation-checks.md`
- [X] T024 [P] Create execution log scaffold in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`

**Checkpoint**: All boundary artifacts exist and hosted execution remains blocked pending owner approval.

---

## Phase 3: User Story 1 - Owner Locks The Hosted UAT Authorization Gate (Priority: P1) MVP

**Goal**: Make owner approval the first executable gate and block all hosted checks until the approval record is complete.

**Independent Test**: Reviewer can inspect the owner approval record and execution log and see that execution is blocked until approval is complete.

### Planning Tasks for User Story 1

- [X] T025 [US1] Define required owner approval fields in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/owner-approval-record.md`
- [X] T026 [US1] Define no-execution-before-approval rule in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/contracts/hosted-read-only-uat-boundary.md`
- [X] T027 [US1] Record 0 hosted checks before approval in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [X] T028 [US1] Record explicit owner approval in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/owner-approval-record.md`
- [X] T029 [US1] Re-check owner approval completeness before hosted target preflight and record result in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`

**Checkpoint**: Hosted execution remains blocked until T028 is complete.

---

## Phase 4: User Story 2 - Release Reviewer Defines The Hosted Read-Only Target (Priority: P2)

**Goal**: Define and later validate the hosted target without deploy, promotion, configuration change, account creation, mutation, or non-Hadna data.

**Independent Test**: Reviewer can classify a proposed target as allowed, incomplete, or rejected before opening any hosted route.

### Planning Tasks for User Story 2

- [X] T030 [P] [US2] Define hosted target requirements in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/hosted-target-requirements.md`
- [X] T031 [P] [US2] Define target rejection conditions in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/contracts/hosted-read-only-uat-boundary.md`
- [X] T032 [P] [US2] Define credential handling rules in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/redaction-rules.md`
- [X] T033 [US2] After owner approval, validate target requirements without opening hosted app routes and record result in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [X] T034 [US2] Stop and record blocker in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md` if target requires deploy, promotion, account creation, mutation, file content access, or non-Hadna data

**Checkpoint**: Target preflight must pass before route/persona smoke.

---

## Phase 5: User Story 3 - UAT Reviewer Runs Only Approved Read-Only Smoke Categories (Priority: P3)

**Goal**: Execute only approved route/persona smoke categories after owner approval and target preflight.

**Independent Test**: Every executed action maps to an allowed read-only check, and every forbidden action is avoided or blocks the route.

### Planning Tasks for User Story 3

- [X] T035 [P] [US3] Define allowed read-only checks in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/allowed-read-only-checks.md`
- [X] T036 [P] [US3] Define forbidden actions in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/forbidden-actions.md`
- [X] T037 [P] [US3] Define route/persona categories in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/route-persona-smoke-categories.md`
- [ ] T038 [US3] After owner approval and target preflight, run approved sign-in and route load smoke only and record safe categories in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [ ] T039 [US3] After owner approval, inspect approved role shell and navigation visibility without mutation and record safe summaries in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [X] T040 [US3] After owner approval, inspect approved mobile/RTL categories without screenshots and record pass/fail status in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`

2026-07-09 burn-down note: Phase 5 final outcome is OWNER-DEFERRED, not PASS. T038 and T039 remain unchecked because client approver and unavailable hosted route/data categories were not actually executed and are outside R-009 hosted read-only completion. Exact next owner input for T038 is a client approver credential category plus safely exposed hosted read-only waiting/files route or data categories. Exact next owner input for T039 is a client approver credential category. T040 remains complete.

2026-07-09 completion pass attempt note: owner approved a hosted read-only completion pass using locally supplied `.env.r009-hosted.local` values, but the exact local env file and R-009 shell category variables were unavailable in this execution context. No hosted route was opened, no sign-in or route load category was executed, no waiting-approval empty-state category could be confirmed, and no files/final-delivery route category was inspected. T038 and T039 remain unchecked.

2026-07-09 hosted completion retry note: the local env file is now present and the hosted target sign-in category opened. Client approver sign-in was attempted once with approved local credential categories but did not complete. Waiting-approval route category is empty and recorded as OWNER-DEFERRED / EMPTY-STATE. Final-delivery route category opened read-only but did not expose file-list/final-delivery signals. T038 and T039 remain unchecked because the required client approver route load and shell/navigation checks did not complete.

**Checkpoint**: Smoke evidence is limited to approved route/persona categories and safe summaries.

---

## Phase 6: User Story 4 - Security Reviewer Proves Read-Only Isolation Without Mutating State (Priority: P4)

**Goal**: Verify tenant/client isolation with read-only checks only.

**Independent Test**: Approved personas can inspect only allowed scope, unauthorized categories see safe empty/denied state, and evidence contains only safe categories/counts/statuses.

### Planning Tasks for User Story 4

- [X] T041 [P] [US4] Define read-only isolation matrix in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/read-only-isolation-checks.md`
- [X] T042 [P] [US4] Define isolation stop conditions in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/read-only-isolation-checks.md`
- [X] T043 [US4] After owner approval, run approved client viewer isolation checks read-only and record safe status in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [ ] T044 [US4] After owner approval, run approved client approver isolation checks without approving and record safe status in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [X] T045 [US4] After owner approval, run approved assigned internal/account manager scope checks and record safe status in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [X] T046 [US4] After owner approval, run approved unassigned or unauthorized safe-denial checks and record safe status in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`
- [X] T047 [US4] Stop and record blocker if isolation checks require direct object identifiers, file content access, mutation, or prohibited evidence in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/execution-log.md`

2026-07-09 Phase 6 note: Available-category read-only isolation checks passed for client viewer, assigned internal/account manager, unassigned/unauthorized client, and management/project admin read-only behavior. T044 remains unchecked because client approver credential category is unavailable. Waiting-approval and files/final-delivery categories remain OWNER-DEFERRED because hosted read-only data/route category unavailable and are not counted as PASS. No direct object identifiers, file content, mutation, or prohibited evidence were used.

2026-07-09 completion pass attempt note: client approver isolation was not executed because the required local env category source was unavailable. T044 remains unchecked.

2026-07-09 hosted completion retry note: client approver isolation was not executed because sign-in did not complete. T044 remains unchecked.

**Checkpoint**: Isolation proof remains read-only and redacted.

---

## Phase 7: User Story 5 - Owner Receives Redacted No-Op Execution Evidence (Priority: P5)

**Goal**: Produce a post-execution evidence package only after approved execution, proving checked categories, no-op behavior, blockers, and next owner decision options.

**Independent Test**: Owner can review evidence without sensitive values and decide the next path.

### Planning Tasks for User Story 5

- [X] T048 [P] [US5] Define no-op proof requirements in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/no-op-rollback-proof.md`
- [X] T049 [P] [US5] Define evidence redaction rules in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/redaction-rules.md`
- [X] T050 [P] [US5] Define post-execution evidence expectations in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/verification.md`
- [X] T051 [US5] After approved execution, update no-op proof in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/no-op-rollback-proof.md`
- [X] T052 [US5] After approved execution, update verification evidence in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/verification.md`
- [X] T053 [US5] After approved execution, run count-only redaction scan from `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/quickstart.md` and record counts without values in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/verification.md`
- [X] T054 [US5] After approved execution, update release doc with safe R-009 result in `docs/08-release/R-009-limited-hosted-read-only-uat-authorization-execution.md`
- [X] T055 [US5] After approved execution, update project progress with safe R-009 result in `docs/PROJECT_PROGRESS.md`

**Checkpoint**: Owner evidence is redacted, no-op proof is complete, and Production acceptance remains separate.

---

## Phase 8: Planning Validation And Polish

- [X] T056 [P] Run R-009 planning redaction scan from `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/quickstart.md` and record safe count summary in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/verification.md`
- [X] T057 [P] Review R-009 docs for accidental hosted execution claims in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/`
- [X] T058 [P] Review R-009 release doc for R-008 local-only closure in `docs/08-release/R-009-limited-hosted-read-only-uat-authorization-execution.md`
- [X] T059 Confirm no product code or dependency files were changed for R-009 planning in `docs/PROJECT_PROGRESS.md`
- [X] T060 Confirm owner approval remains pending unless explicitly recorded in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/owner-approval-record.md`

---

## Phase 9: Final Closure And Next Decision Package

- [X] T061 Create final closure evidence in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/final-closure.md`
- [X] T062 Update R-009 release doc with final closure status in `docs/08-release/R-009-limited-hosted-read-only-uat-authorization-execution.md`
- [X] T063 Update project progress with safe final R-009 status in `docs/PROJECT_PROGRESS.md`
- [X] T064 Create proposed R-010 planning-only package in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/`
- [X] T065 Run final local closure verification for secret scan, whitespace, and scoped redaction scan and record safe results in `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/final-closure.md`

2026-07-09 final closure note: R-009 is closed as PARTIAL OWNER-DEFERRED available-category hosted read-only evidence. T038, T039, and T044 intentionally remain unchecked because their wording requires actual client approver, waiting-approval, or files/final-delivery execution. Deferred categories were not executed and are not counted as PASS.

2026-07-09 reopened completion pass note: the attempt failed at local env preflight before any hosted route was opened. No task checkbox was newly marked complete.

2026-07-09 hosted completion retry note: retry completed as PARTIAL OWNER-DEFERRED / BLOCKED BY AUTH AND ROUTE STATE. No task checkbox was newly marked complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 and Phase 2 are planning setup and boundary scaffolding.
- Phase 3 / US1 is the MVP and blocks every hosted execution task.
- Phase 4 / US2 depends on owner approval and must pass before route/persona smoke.
- Phase 5 / US3 depends on Phase 3 and Phase 4.
- Phase 6 / US4 depends on Phase 3 and Phase 4.
- Phase 7 / US5 depends on any approved execution evidence.
- Phase 8 can validate planning now, but post-execution updates must wait for approval and execution.

### User Story Dependencies

- **US1 (P1)**: No hosted execution dependency; establishes approval gate.
- **US2 (P2)**: Depends on US1 owner approval.
- **US3 (P3)**: Depends on US1 approval and US2 target preflight.
- **US4 (P4)**: Depends on US1 approval and US2 target preflight.
- **US5 (P5)**: Depends on executed US3/US4 evidence if execution is later approved.

### Parallel Opportunities

- T003 through T006 can run in parallel.
- T010 through T024 can run in parallel because they create separate docs.
- T030 through T032 can run in parallel.
- T035 through T037 can run in parallel.
- T041 and T042 can run in parallel.
- T048 through T050 can run in parallel.
- No hosted execution tasks can run in parallel until owner approval is recorded and target preflight passes.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2 planning artifacts.
2. Complete US1 approval gate.
3. Stop. Do not execute hosted checks.
4. Wait for owner approval record.

### First Execution Phase After Approval

1. Complete T028 and T029.
2. Complete US2 target preflight T033.
3. Stop if any target rejection condition appears.
4. Begin limited route/persona smoke only after preflight passes.

### Guardrails

- Do not run hosted checks before owner approval is recorded.
- Do not mutate hosted DB.
- Do not upload, delete, download, or open files.
- Do not create accounts, invitations, roles, memberships, or password flows.
- Do not submit approvals, change requests, delivery, or status transitions.
- Do not deploy, promote, or change hosted configuration.
- Do not use non-Hadna data unless separately approved.
- Do not record credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, secret values, or file contents.
- Do not treat R-009 as Production acceptance.
