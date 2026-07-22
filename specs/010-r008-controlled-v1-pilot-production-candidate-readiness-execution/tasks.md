# Tasks: R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution

**Input**: Design documents from `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required for isolation, permissions, approvals, files, audit, SLA, evidence redaction, rollback, and go/no-go readiness. Write tests before implementation for domain/security logic unless a task explicitly records a reviewed exception.

**Organization**: Tasks are grouped by user story to enable independent implementation and review.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create or switch to isolated R-008 branch/worktree `codex/r008-controlled-v1-pilot-production-candidate-readiness-execution`
- [X] T002 Confirm R-007 owner readiness acceptance is recorded as readiness-only in `docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md`
- [X] T003 [P] Create R-008 release evidence scaffold in `docs/08-release/R-008-controlled-v1-pilot-production-candidate-readiness-execution.md`
- [X] T004 [P] Create R-008 redaction/evidence rules in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T005 [P] Create R-008 gate checklist scaffold in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/gate-checklist.md`
- [X] T006 Confirm no new dependencies are required in `package.json` and record the result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T007 Record explicit blocked boundaries for hosted mutation, non-Hadna data, deploy/promote, and Production acceptance in `docs/08-release/R-008-controlled-v1-pilot-production-candidate-readiness-execution.md`

**Checkpoint**: R-008 setup is ready. No code, hosted mutation, non-Hadna data, deploy/promote, dependency change, or Production acceptance has occurred.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T008 Review R-007 readiness evidence in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T009 Review release boundary helpers in `src/modules/release/r007-readiness-boundary.ts`
- [X] T010 Review evidence redaction helpers in `src/modules/release/evidence-redaction.ts`
- [X] T011 Review authorization catalog in `src/modules/authorization/permission-catalog.ts`
- [X] T012 Review approval commands in `src/server/commands/approvals/`
- [X] T013 Review file visibility rules in `src/modules/files/file-visibility-rules.ts`
- [X] T014 Review comment visibility rules in `src/modules/comments/comment-visibility-rules.ts`
- [X] T015 Review SLA timeline rules in `src/modules/sla/sla-timeline.ts`
- [X] T016 Review audit service coverage in `src/modules/audit/audit-service.ts`
- [X] T017 [P] Define R-008 synthetic fixture plan in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/fixture-boundary.md`
- [X] T018 [P] Define R-008 owner approval request template in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/owner-approval-template.md`
- [X] T019 Run planning redaction scan from `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/quickstart.md` and record safe result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`

**Checkpoint**: Foundational review is complete. User story work can proceed only inside approved local/synthetic boundaries unless a later owner approval expands scope.

---

## Phase 3: User Story 1 - Owner Controls Pilot Execution Gates (Priority: P1) MVP

**Goal**: Produce an owner-readable gate system that separates planning, local implementation, hosted UAT, production-candidate review, and Production acceptance.

**Independent Test**: Reviewer can inspect release docs and gate artifacts to identify allowed scope, blocked scope, evidence needed, and exact owner approvals required.

### Tests for User Story 1

- [X] T020 [P] [US1] Add pilot gate unit tests in `tests/unit/release/r008-pilot-gates.test.ts`
- [X] T021 [P] [US1] Add hosted boundary unit tests in `tests/unit/release/r008-hosted-boundary.test.ts`
- [X] T022 [P] [US1] Add owner decision evidence tests in `tests/unit/release/r008-owner-decision.test.ts`

### Implementation for User Story 1

- [X] T023 [US1] Implement R-008 pilot gate definitions in `src/modules/release/r008-pilot-gates.ts`
- [X] T024 [US1] Implement hosted UAT boundary classifier in `src/modules/release/r008-hosted-boundary.ts`
- [X] T025 [US1] Add owner-readable R-008 copy in `src/ui/copy/ar-SA/r008-readiness.ts`
- [X] T026 [US1] Add R-008 gate summary component in `src/ui/management/r008-gate-summary.tsx`
- [X] T027 [US1] Add internal R-008 readiness route in `src/app/(management)/readiness/r008/page.tsx`
- [X] T028 [US1] Record US1 evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`

**Checkpoint**: Owner gate control is reviewable without changing hosted data.

---

## Phase 4: User Story 2 - Reviewer Proves Tenant and Client Isolation (Priority: P2)

**Goal**: Prove tenant/client isolation across management, assigned internal, client portal, approval, file, comment, audit, and SLA reporting paths.

**Independent Test**: Reviewer can inspect positive and negative evidence for each persona category and scoped data path.

### Tests for User Story 2

- [X] T029 [P] [US2] Add isolation proof unit tests in `tests/unit/authorization/r008-isolation-proof.test.ts`
- [X] T030 [P] [US2] Add role negative regression tests in `tests/unit/authorization/r008-role-negative.test.ts`
- [X] T031 [P] [US2] Add client portal isolation E2E tests in `tests/e2e/client/r008-client-isolation.spec.ts`
- [X] T032 [P] [US2] Add file/comment scope integration tests in `tests/integration/security/r008-client-scope-visibility.test.ts`

### Implementation for User Story 2

- [X] T033 [US2] Implement isolation proof matrix in `src/modules/release/r008-isolation-proof.ts`
- [X] T034 [US2] Extend synthetic R-008 fixtures in `tests/fixtures/r008-fixtures.ts`
- [X] T035 [US2] Add management/team persona checks in `src/modules/authorization/r008-persona-scope.ts`
- [X] T036 [US2] Add client portal safe-denial evidence mapper in `src/modules/release/r008-client-denial-evidence.ts`
- [X] T037 [US2] Record isolation proof evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/isolation-proof.md`
- [X] T038 [US2] Record US2 evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`

**Checkpoint**: Isolation proof is complete using local/synthetic or owner-approved boundaries only.

---

## Phase 5: User Story 3 - Security Reviewer Receives Production-Candidate Checklist (Priority: P3)

**Goal**: Build the production-candidate security checklist with control status, evidence, residual risks, and owner decision needs.

**Independent Test**: Reviewer can determine which security controls pass, fail, block hosted UAT, or require owner risk acceptance.

### Tests for User Story 3

- [X] T039 [P] [US3] Add production checklist completeness tests in `tests/unit/release/r008-security-checklist.test.ts`
- [X] T040 [P] [US3] Add evidence redaction regression tests in `tests/unit/release/r008-evidence-redaction.test.ts`
- [X] T041 [P] [US3] Add rollback readiness tests in `tests/unit/release/r008-rollback-plan.test.ts`

### Implementation for User Story 3

- [X] T042 [US3] Implement security checklist model in `src/modules/release/r008-security-checklist.ts`
- [X] T043 [US3] Implement R-008 evidence redaction policy in `src/modules/release/r008-evidence-policy.ts`
- [X] T044 [US3] Implement rollback plan model in `src/modules/release/r008-rollback-plan.ts`
- [X] T045 [US3] Create checklist evidence doc in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/security-checklist.md`
- [X] T046 [US3] Create rollback plan doc in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/rollback-plan.md`
- [X] T047 [US3] Record US3 evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`

**Checkpoint**: Security checklist and rollback plan are owner-reviewable before hosted UAT.

---

## Phase 6: User Story 4 - Pilot Team Hardens Client Approval and Final Delivery (Priority: P4)

**Goal**: Harden or verify client approval, file/final delivery, audit completeness, and SLA reporting readiness for controlled pilot execution.

**Independent Test**: Pilot reviewer can exercise or inspect current-version approval, stale denial, client viewer denial, internal file hiding, final file authorization, audit, and SLA ownership reporting.

### Tests for User Story 4

- [X] T048 [P] [US4] Add client approval journey integration tests in `tests/integration/approvals/r008-client-approval-journey.test.ts`
- [X] T049 [P] [US4] Add final delivery file tests in `tests/unit/files/r008-final-delivery-readiness.test.ts`
- [X] T050 [P] [US4] Add audit completeness tests in `tests/integration/audit/r008-audit-completeness.test.ts`
- [X] T051 [P] [US4] Add SLA reporting readiness tests in `tests/unit/sla/r008-sla-reporting.test.ts`
- [X] T052 [P] [US4] Add client approval mobile/RTL E2E tests in `tests/e2e/client/r008-client-approval-delivery.spec.ts`

### Implementation for User Story 4

- [X] T053 [US4] Implement approval journey probe in `src/modules/approvals/r008-approval-journey.ts`
- [X] T054 [US4] Implement final delivery readiness rules in `src/modules/files/r008-final-delivery-readiness.ts`
- [X] T055 [US4] Implement audit completeness matrix in `src/modules/audit/r008-audit-completeness.ts`
- [X] T056 [US4] Implement SLA reporting readiness mapper in `src/modules/sla/r008-sla-reporting.ts`
- [X] T057 [US4] Update client approval detail surface in `src/ui/client/client-deliverable-detail.tsx`
- [X] T058 [US4] Update management readiness surface in `src/ui/management/r008-gate-summary.tsx`
- [X] T059 [US4] Record approval/file/audit/SLA evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/core-workflow-readiness.md`
- [X] T060 [US4] Record US4 evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`

**Checkpoint**: Core client approval and final delivery readiness is testable without hosted mutation.

---

## Phase 7: User Story 5 - Owner Receives Go/No-Go Evidence Package (Priority: P5)

**Goal**: Produce the final owner decision package with gate status, residual risks, rollback readiness, out-of-scope items, and next decision options.

**Independent Test**: Owner can choose continue local/internal pilot, authorize limited hosted UAT, request fixes, or start a separate Production acceptance package.

### Tests for User Story 5

- [X] T061 [P] [US5] Add go/no-go evidence completeness tests in `tests/unit/release/r008-go-no-go-evidence.test.ts`
- [X] T062 [P] [US5] Add release doc boundary tests in `tests/unit/release/r008-release-boundary.test.ts`

### Implementation for User Story 5

- [X] T063 [US5] Implement go/no-go summary builder in `src/modules/release/r008-go-no-go-summary.ts`
- [X] T064 [US5] Update R-008 release doc in `docs/08-release/R-008-controlled-v1-pilot-production-candidate-readiness-execution.md`
- [X] T065 [US5] Update project progress with safe R-008 status in `docs/PROJECT_PROGRESS.md`
- [X] T066 [US5] Record final owner decision options in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/go-no-go-package.md`
- [X] T067 [US5] Record US5 evidence in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`

**Checkpoint**: R-008 evidence is ready for owner go/no-go review, not Production acceptance.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T068 [P] Update R-008 quickstart if commands or evidence rules change in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/quickstart.md`
- [X] T069 [P] Update R-008 data model if entity boundaries change in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/data-model.md`
- [X] T070 [P] Run `npm run lint` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T071 [P] Run `npm run typecheck` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T072 [P] Run `npm run test:unit` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T073 [P] Run `npm run test:integration` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T074 [P] Run `npm run test:component` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T075 Run `npm run test:rls:simulator` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T076 Run local `npm run test:rls:db` only if local Docker/Supabase is available and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T077 Run `npm run test:e2e` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T078 Run `npm run secret:scan` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T079 Run `git diff --check` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T080 Run `npm run build` and record result in `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/verification.md`
- [X] T081 Run final evidence redaction scan from `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/quickstart.md`
- [X] T082 Prepare final R-008 owner go/no-go summary in `docs/08-release/R-008-controlled-v1-pilot-production-candidate-readiness-execution.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before all other phases.
- Phase 2 blocks all implementation stories.
- US1 is the MVP and must complete before hosted or expansion decisions.
- US2 and US3 can proceed after Phase 2 but must inform US5 evidence.
- US4 depends on US2 isolation and US3 checklist boundaries.
- US5 depends on selected implementation story evidence.
- Phase 8 runs after desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: No dependency after Phase 2. Establishes gate control.
- **US2 (P2)**: Depends on Phase 2 and aligns with US1 boundaries.
- **US3 (P3)**: Depends on Phase 2 and informs hosted/prod-candidate gate decisions.
- **US4 (P4)**: Depends on Phase 2 and should use US2/US3 evidence categories.
- **US5 (P5)**: Depends on completed story evidence.

### Parallel Opportunities

- T003, T004, and T005 can run in parallel.
- T017 and T018 can run in parallel.
- Test tasks within each user story can run in parallel before implementation.
- US2 and US3 can proceed in parallel after Phase 2 if file paths remain separate.
- Final verification commands can be grouped carefully, but long-running Playwright and local Supabase checks must be tracked to completion before final reporting.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 only.
3. Stop and review owner gate boundaries.
4. Continue to US2/US3/US4 only after implementation scope remains accepted.

### Incremental Delivery

1. US1: Gate control and owner decision boundaries.
2. US2: Tenant/client isolation proof.
3. US3: Security checklist and rollback plan.
4. US4: Client approval, final delivery, audit, and SLA readiness.
5. US5: Owner go/no-go evidence package.

### Guardrails

- Do not use non-Hadna data without later explicit owner approval.
- Do not mutate hosted DB without later explicit owner approval and task scope.
- Do not deploy or promote without later explicit owner approval.
- Do not print credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.
- Do not add dependencies or change architecture without required review/ADR.
- Do not call R-008 Production acceptance unless the owner explicitly grants that in a separate decision.
