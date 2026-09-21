# Tasks: R-007 V1 Owner Pilot Expansion and Acceptance-to-Production Readiness

**Input**: Design documents from `specs/009-r007-v1-owner-pilot-expansion-readiness/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required for domain/security logic and release readiness. Write tests before implementation for approval, SLA, file visibility, permission, audit, and client portal safety logic unless a task explicitly records a reviewed exception.

**Organization**: Tasks are grouped by user story to enable independent implementation and review.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create isolated branch `codex/r007-v1-owner-pilot-expansion-readiness` from current `main`
- [X] T002 Confirm no unreviewed R-006 bugfix scope is being reopened in `specs/009-r007-v1-owner-pilot-expansion-readiness/spec.md`
- [X] T003 [P] Create release evidence file `docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md`
- [X] T004 [P] Create verification evidence file `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T005 [P] Create R-007 fixture planning note `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/fixture-boundary.md`
- [X] T006 Confirm no new dependencies are required in `./package.json` and record the result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T007 Review existing deliverable rules in `src/modules/deliverables/deliverable-rules.ts`
- [X] T008 Review existing deliverable status commands in `src/server/commands/deliverables/update-deliverable-status.ts`
- [X] T009 Review existing SLA rules in `src/modules/sla/sla-policy.ts`
- [X] T010 Review existing permission catalog in `src/modules/authorization/permission-catalog.ts`
- [X] T011 Review existing audit service in `src/modules/audit/audit-service.ts`
- [X] T012 Review existing client portal surfaces in `src/app/(client)/client/page.tsx` and `src/ui/client/client-home.tsx`
- [X] T013 Review existing management surfaces in `src/app/(management)/portfolio/page.tsx` and `src/ui/management/deliverable-board.tsx`
- [X] T014 [P] Add or update R-007 safe fixture definitions in `tests/fixtures/r007-fixtures.ts`
- [X] T015 [P] Add R-007 redaction guard notes to `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T016 Run baseline checks and record safe results in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`

**Checkpoint**: Foundation ready. No hosted mutation or non-Hadna data use has occurred.

---

## Phase 3: User Story 1 - Owner Reviews V1 Pilot Readiness (Priority: P1) MVP

**Goal**: Provide a clear readiness gate package that separates R-006 internal UAT acceptance from R-007 pilot expansion and production-candidate readiness.

**Independent Test**: A reviewer can inspect the release/evidence docs and determine baseline, allowed scope, blocked scope, required evidence, and next owner decision.

### Tests for User Story 1

- [X] T017 [P] [US1] Add release-boundary unit tests in `tests/unit/release/r007-readiness-boundary.test.ts`
- [X] T018 [P] [US1] Add evidence-redaction unit tests in `tests/unit/release/r007-evidence-redaction.test.ts`

### Implementation for User Story 1

- [X] T019 [US1] Implement R-007 readiness boundary helper in `src/modules/release/r007-readiness-boundary.ts`
- [X] T020 [US1] Implement evidence redaction helper in `src/modules/release/evidence-redaction.ts`
- [X] T021 [US1] Add owner-readable readiness summary copy in `src/ui/copy/ar-SA/r007-readiness.ts`
- [X] T022 [US1] Add internal readiness summary component in `src/ui/management/r007-readiness-summary.tsx`
- [X] T023 [US1] Add management route for readiness review in `src/app/(management)/readiness/r007/page.tsx`
- [X] T024 [US1] Record US1 evidence in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`

**Checkpoint**: Owner readiness gate is reviewable without changing hosted data.

---

## Phase 4: User Story 2 - Management Validates the Core Delivery Workflow (Priority: P2)

**Goal**: Make the deliverable lifecycle ready for pilot review across internal approval, client approval, SLA, delivery, package usage, and audit evidence.

**Independent Test**: A scoped pilot deliverable can move through the V1 readiness workflow with correct denials, SLA pause/resume, and audit evidence.

### Tests for User Story 2

- [X] T025 [P] [US2] Add deliverable lifecycle unit tests in `tests/unit/deliverables/r007-deliverable-lifecycle.test.ts`
- [X] T026 [P] [US2] Add SLA timeline unit tests in `tests/unit/sla/r007-sla-timeline.test.ts`
- [X] T027 [P] [US2] Add approval workflow integration tests in `tests/integration/approvals/r007-approval-workflow.test.ts`
- [X] T028 [P] [US2] Add audit-required integration tests in `tests/integration/audit/r007-workflow-audit.test.ts`

### Implementation for User Story 2

- [X] T029 [US2] Implement deliverable lifecycle readiness rules in `src/modules/deliverables/r007-deliverable-lifecycle.ts`
- [X] T030 [US2] Implement SLA timeline segment rules in `src/modules/sla/sla-timeline.ts`
- [X] T031 [US2] Implement internal approval command in `src/server/commands/approvals/approve-internally.ts`
- [X] T032 [US2] Implement internal change request command in `src/server/commands/approvals/request-internal-changes.ts`
- [X] T033 [US2] Implement send-to-client command guard in `src/server/commands/approvals/send-to-client.ts`
- [X] T034 [US2] Implement client approval command in `src/server/commands/approvals/approve-as-client.ts`
- [X] T035 [US2] Implement client change request command in `src/server/commands/approvals/request-client-changes.ts`
- [X] T036 [US2] Update deliverable status action mapping in `src/server/actions/deliverable-status.ts`
- [X] T037 [US2] Update management deliverable actions in `src/ui/management/deliverable-actions.tsx`
- [X] T038 [US2] Record US2 evidence in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`

**Checkpoint**: Core delivery workflow is testable independently with local/fixture data.

---

## Phase 5: User Story 3 - Client Portal Is Ready for Controlled Pilot Actions (Priority: P3)

**Goal**: Prepare the client portal for scoped approval, final files, package progress, and safe client visibility.

**Independent Test**: Client approver, client viewer, and unassigned viewer personas see only their allowed data and actions.

### Tests for User Story 3

- [X] T039 [P] [US3] Add client portal approval component tests in `tests/component/client/r007-client-approval-panel.test.tsx`
- [X] T040 [P] [US3] Add file visibility unit tests in `tests/unit/files/r007-file-visibility.test.ts`
- [X] T041 [P] [US3] Add client portal isolation E2E tests in `tests/e2e/client/r007-client-portal-readiness.spec.ts`
- [X] T042 [P] [US3] Add internal comment hiding tests in `tests/integration/comments/r007-comment-visibility.test.ts`

### Implementation for User Story 3

- [X] T043 [US3] Implement client approval panel in `src/ui/client/client-approval-panel.tsx`
- [X] T044 [US3] Implement client-safe deliverable detail view in `src/ui/client/client-deliverable-detail.tsx`
- [X] T045 [US3] Implement file visibility rules in `src/modules/files/file-visibility-rules.ts`
- [X] T046 [US3] Implement file access command guard in `src/server/commands/files/authorize-file-access.ts`
- [X] T047 [US3] Implement comment visibility rules in `src/modules/comments/comment-visibility-rules.ts`
- [X] T048 [US3] Update client portal route composition in `src/app/(client)/client/page.tsx`
- [X] T049 [US3] Update client commercial/package summary copy in `src/ui/client/commercial-summary.tsx`
- [X] T050 [US3] Record US3 evidence in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`

**Checkpoint**: Client portal readiness is testable independently without exposing internal data.

---

## Phase 6: User Story 4 - Release Reviewer Receives Evidence Before Production Candidate (Priority: P4)

**Goal**: Produce a release evidence bundle that supports owner go/no-go review without implying production acceptance.

**Independent Test**: Reviewer can inspect the R-007 release doc and evidence file to see tests run, pass/fail status, residual risks, out-of-scope items, and next owner decision required.

### Tests for User Story 4

- [X] T051 [P] [US4] Add R-007 evidence completeness test in `tests/unit/release/r007-evidence-completeness.test.ts`
- [X] T052 [P] [US4] Add role matrix regression tests in `tests/unit/authorization/r007-role-readiness.test.ts`

### Implementation for User Story 4

- [X] T053 [US4] Update release doc `docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md`
- [X] T054 [US4] Update verification evidence `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T055 [US4] Update project progress with safe R-007 status in `docs/PROJECT_PROGRESS.md`
- [X] T056 [US4] Run full local verification suite from `specs/009-r007-v1-owner-pilot-expansion-readiness/quickstart.md`
- [X] T057 [US4] Record any blocked checks without printing secrets or sensitive content in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T058 [US4] Identify next owner decision required in `docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md`

**Checkpoint**: R-007 is ready for owner review, not production acceptance.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T059 [P] Update R-007 quickstart if implementation commands differ in `specs/009-r007-v1-owner-pilot-expansion-readiness/quickstart.md`
- [X] T060 [P] Update R-007 data model if implementation changes entity boundaries in `specs/009-r007-v1-owner-pilot-expansion-readiness/data-model.md`
- [X] T061 [P] Run `npm run lint` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T062 [P] Run `npm run typecheck` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T063 [P] Run `npm run test:unit` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T064 [P] Run `npm run test:integration` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T065 [P] Run `npm run test:component` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T066 Run `npm run test:rls` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T067 Run `npm run test:e2e` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T068 Run `npm run secret:scan` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T069 Run `git diff --check` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T070 Run `npm run build` and record result in `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`
- [X] T071 Prepare final R-007 owner summary in `docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 must complete before all other phases.
- Phase 2 blocks all implementation stories.
- US1 is the MVP and should complete before any hosted or expansion decision.
- US2 and US3 can proceed after Phase 2, but sensitive command work in US2 should land before client action enablement in US3.
- US4 depends on selected implementation stories and verification results.
- Phase 7 runs after desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: No dependency after Phase 2. MVP readiness package.
- **US2 (P2)**: Depends on Phase 2 and benefits from US1 boundaries.
- **US3 (P3)**: Depends on Phase 2 and should align with US2 approval/file visibility rules.
- **US4 (P4)**: Depends on completed story evidence.

### Parallel Opportunities

- T003, T004, and T005 can run in parallel.
- T014 and T015 can run in parallel.
- Test tasks within US2 and US3 can run in parallel before implementation.
- UI copy/component work can proceed in parallel with domain tests when file paths do not overlap.
- Final verification commands can be grouped carefully, but any long-running Playwright or local Supabase run should be tracked to completion before final reporting.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 only.
3. Stop and review owner readiness boundary.
4. Continue to US2/US3 only after scope remains accepted.

### Incremental Delivery

1. US1: Readiness boundary and owner review surface.
2. US2: Core delivery workflow and audit/SLA readiness.
3. US3: Client portal action and visibility readiness.
4. US4: Release evidence and next owner decision package.

### Guardrails

- Do not use non-Hadna data without new explicit owner approval.
- Do not mutate hosted DB without new explicit owner approval and task scope.
- Do not print credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.
- Do not add dependencies or change architecture without required review/ADR.
- Do not call R-007 production acceptance unless the owner explicitly grants that in a separate decision.
