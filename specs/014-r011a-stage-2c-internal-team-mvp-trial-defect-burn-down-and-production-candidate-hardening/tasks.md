# Tasks: R-011A Stage 2C - Internal Team MVP Trial, Defect Burn-down, And Production-Candidate Hardening

**Input**: Stage 2C design artifacts in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/`
**Prerequisites**: Owner approved local Hadna-only Stage 2C execution. Hosted mutation, deployment, access configuration, hosted file content operations, real customer data, new dependencies, broad repair, and Production acceptance are not approved.

## Phase 1: Setup And Planning

- [x] T001 Create Stage 2C feature directory at `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/`
- [x] T002 Create Stage 2C specification in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/spec.md`
- [x] T003 Create Stage 2C implementation plan in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/plan.md`
- [x] T004 Reconcile open R-011A T032 hosted blocker in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/spec.md`
- [x] T005 Define Stage 2C defect severity model in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/spec.md`

## Phase 2: Design Artifacts And Evidence Scaffolds

- [x] T006 [P] Create Stage 2C research decisions in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/research.md`
- [x] T007 [P] Create Stage 2C data/evidence model in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/data-model.md`
- [x] T008 [P] Create internal trial contract in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/contracts/internal-trial-matrix.md`
- [x] T009 [P] Create evidence redaction contract in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/contracts/evidence-redaction-contract.md`
- [x] T010 [P] Create quickstart validation runbook in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/quickstart.md`
- [x] T011 [P] Create internal MVP trial matrix in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/internal-mvp-trial-matrix.md`
- [x] T012 [P] Create defect register in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/defect-register.md`
- [x] T013 [P] Create Stage 2C execution log in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`

## Phase 3: User Story 1 - Management Lifecycle Trial

**Goal**: Prove the full local Hadna-only lifecycle for management/admin, project manager, and account manager without hosted operations.
**Independent Test**: Synthetic lifecycle evidence covers creation, assignment, execution, internal review, internal approval, client approval, delivery, closure, SLA transitions, audit, and unsafe-transition denial.

- [x] T014 [P] [US1] Review existing lifecycle and approval tests under `tests/integration/` and `tests/unit/` for Stage 2C coverage gaps
- [x] T015 [US1] Add or update lifecycle/audit/SLA coverage for management roles in existing test files or new focused Stage 2C tests
- [x] T016 [US1] Record management lifecycle results and mutation/no-op counts in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`

## Phase 4: User Story 2 - Assigned Team Negative-Permission Trial

**Goal**: Prove assigned team users can execute permitted work while approval/send/cross-client actions remain denied.
**Independent Test**: Role-negative tests prove assigned-client visibility, internal comments/files behavior, denied approval/send/delivery, and safe denial evidence.

- [x] T017 [P] [US2] Review assigned-team authorization, comments, files, and route guard tests for Stage 2C coverage gaps
- [x] T018 [US2] Add or update assigned-team permission and secrecy tests in existing unit/integration/E2E suites
- [x] T019 [US2] Record assigned-team trial findings in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/internal-mvp-trial-matrix.md`

## Phase 5: User Story 3 - Client Viewer, Client Approver, And Unauthorized Trial

**Goal**: Prove client portal scope, current-version approvals, internal secrecy, and unauthorized denial.
**Independent Test**: Client viewer, client approver, and unauthorized tests prove no internal content exposure, no stale-version approval, no direct URL/resource enumeration, no file download, and no approval-link reuse.

- [x] T020 [P] [US3] Review client portal, client approval, file visibility, stale approval, and unauthorized tests for gaps
- [x] T021 [US3] Add or update client viewer, client approver, unauthorized, stale-link, and file/comment secrecy tests
- [x] T022 [US3] Record client/unauthorized isolation findings in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/internal-mvp-trial-matrix.md`

## Phase 6: User Story 4 - UX, Accessibility, And Defect Burn-down

**Goal**: Review and improve trial-critical UX, mobile Arabic RTL, keyboard accessibility, hydration, state UX, and defect burn-down.
**Independent Test**: Playwright/component coverage and manual evidence prove required UX categories or record honest blockers.

- [x] T023 [P] [US4] Review sign-in, dashboard, clients, client detail, deliverables, Kanban, detail, SLA, approvals, files/final delivery, waiting approval, portal, and state UX tests for gaps
- [x] T024 [US4] Add or update mobile RTL, keyboard, focus, semantic label, overflow, denied/error/empty/success/stale-state tests
- [x] T025 [US4] Fix scoped P0/P1/P2 defects found during Stage 2C without broad repair
- [x] T026 [US4] Record defect status, retest result, and Production impact in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/defect-register.md`

## Phase 7: Verification And Evidence

- [x] T027 Run `npm run lint` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T028 Run `npm run typecheck` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T029 Run `npm run test:unit` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T030 Run `npm run test:integration` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T031 Run `npm run test:component` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T032 Run `npm run test:rls:simulator` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T033 Run `npm run test:rls:db` when local infrastructure is available, or record blocked status and reason
- [x] T034 Run `npm run test:e2e` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T035 Run `npm run secret:scan` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T036 Run `git diff --check` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T037 Run `npm run build` and record result in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`
- [x] T038 Run scoped evidence redaction scan over Stage 2C docs and record result

## Phase 8: Final Guard And Handoff

- [x] T039 Update `docs/PROJECT_PROGRESS.md` with Stage 2C result, blockers, and explicit Production boundary
- [x] T040 Run Samawah quality gate over changed docs/code/tests
- [x] T041 Confirm no deployment, hosted mutation, hosted file content operation, access configuration change, or Production acceptance occurred
- [x] T042 Produce final Stage 2C summary with files changed, specs, ADRs, tests, risks, out-of-scope, and AGENTS checklist

## Phase 9: Corrective Completion Audit

- [x] T043 Create traceable defect register with ID, severity, role, workflow, reproduction, security/data impact, owner, status, regression test, and evidence reference in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/defect-register.md`
- [x] T044 Reconcile fixed P2 hydration warning, six skipped E2E cases, blocked local RLS DB verification, UX/accessibility findings, and hosted executor/deployment limitations in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/defect-register.md`
- [x] T045 Add required `INTERNAL_MVP_TRIAL_PROMPT` and `EXPERT_REVIEW_AGENT_PROMPT` in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/stage-2c-handoff-prompts.md`
- [x] T046 Update Stage 2C traceability in `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/data-model.md`, `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/execution-log.md`, `docs/PROJECT_PROGRESS.md`, and `docs/08-release/R-011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness.md`
- [x] T047 Run corrective verification: relevant tests, secret scan, diff check, Spec Kit consistency analysis, and build
- [x] T048 Record corrective verification results and final boundary status

## Dependencies

- Phase 1 must complete before any implementation.
- Phase 2 evidence scaffolds must exist before recording trial execution.
- US1, US2, and US3 can proceed in parallel after Phase 2.
- US4 can proceed after trial surfaces are identified and may run in parallel with US1-US3 reviews.
- Phase 7 verification depends on all code/test/doc changes.
- Phase 8 final guard depends on verification evidence.

## Notes

- R-011A T032 from the previous package remains the hosted completion blocker and is not closed by Stage 2C.
- All evidence must be value-free.
- Any P0 defect stops trial continuation. Any open P1 blocks production-candidate claims.

