# Tasks: R-011A Stage 2A — MVP Baseline Consolidation, SaaS Guardrails, And Professional UX Foundation

**Input**: Design documents from `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/`

**Prerequisites**: R-010 Path B evidence at `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/`

**Status**: Historical R-011 planning and local-readiness package. Its original no-hosted-action boundary remains historical evidence. T032 received technical hosted evidence on 2026-07-16, then was reopened by the owner's 2026-07-19 human product rejection under Spec 015 X008. Production acceptance is still not authorized.

**Tests**: Documentation verification only: `git diff --check`, `npm run secret:scan`, and scoped redaction scan over new R-011 docs. Lint/typecheck only if code changes.

## Phase 1: Package Setup

**Goal**: Create the R-011 Spec Kit package and required local release pointers.

- [x] T001 Create R-011 feature directory at `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/`
- [x] T002 Create R-011 specification in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/spec.md`
- [x] T003 Create R-011 implementation plan in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/plan.md`
- [x] T004 Create R-011 research notes in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/research.md`
- [x] T005 Create R-011 data model in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/data-model.md`
- [x] T006 Create R-011 boundary contracts in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/contracts/`
- [x] T007 Create R-011 evidence scaffolds in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/`
- [x] T008 Create R-011 requirements checklist in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/checklists/requirements.md`

## Phase 2: Residual Risk Treatment (US1)

**Goal**: Answer what blocks production-candidate readiness and what can be accepted as residual risk.

**Independent Test**: A reviewer can find each R-010 residual risk and its treatment without hosted access.

- [x] T009 [US1] Map accepted and deferred evidence in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/evidence-map.md`
- [x] T010 [US1] Define residual risk treatment in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/residual-risk-treatment-register.md`
- [x] T011 [US1] Define production-candidate blockers in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/production-candidate-blockers.md`
- [x] T012 [US1] Record what must be proven before Production acceptance in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/plan.md`

## Phase 3: Owner Gates (US2)

**Goal**: Define exact hosted acceptance readiness gates without executing them.

**Independent Test**: A reviewer can identify evidence, stop conditions, and mutation-approval requirements for every gate.

- [x] T013 [US2] Define owner gate contract in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/contracts/owner-gates-contract.md`
- [x] T014 [US2] Define hosted acceptance readiness gates in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/hosted-acceptance-readiness-gates.md`
- [x] T015 [US2] Define evidence redaction and no-op contract in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/contracts/evidence-redaction-and-no-op-contract.md`
- [x] T016 [US2] Define no-op and rollback readiness in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/no-op-and-rollback-readiness.md`

## Phase 4: Future Routes (US3)

**Goal**: Define R-011A, R-011B, and R-011C as future owner choices.

**Independent Test**: A reviewer can choose the next route and see what is allowed and blocked.

- [x] T017 [US3] Define future route contract in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/contracts/future-route-contract.md`
- [x] T018 [US3] Create future route decision scaffold in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/future-route-decision.md`
- [x] T019 [US3] Recommend next implementation route in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/plan.md`

## Phase 5: No-Op, Redaction, And Project Updates (US4)

**Goal**: Preserve the no-hosted-action and no-Production-acceptance boundary.

**Independent Test**: A reviewer can verify local docs changed without hosted execution or sensitive evidence.

- [x] T020 [US4] Update `.specify/feature.json`
- [x] T021 [US4] Update AGENTS.md Spec Kit pointer
- [x] T022 [US4] Update `docs/PROJECT_PROGRESS.md`
- [x] T023 [US4] Create R-011 release doc in `docs/08-release/R-011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness.md`
- [x] T024 [US4] Run `git diff --check`
- [x] T025 [US4] Run `npm run secret:scan`
- [x] T026 [US4] Run scoped redaction scan over new R-011 docs
- [x] T027 [US4] Confirm lint/typecheck not run because no product code changed

## Phase 6: R-011A - Owner Approval Recorded, Mutation Blocked By Preflight

**Goal**: Record the owner-selected R-011A route, define the bounded mutation plan, and stop before hosted mutation when safe paths are unavailable.

- [x] T028 [R011A] Record explicit owner mutation approval before any hosted prep mutation
- [x] T029 [R011A] Define bounded client approver account/category prep only if owner approves it
- [x] T030 [R011A] Define bounded waiting approval item/category prep only if owner approves it
- [x] T031 [R011A] Define bounded final delivery/file-list category prep only if owner approves it
- [ ] T032 [R011A] Run limited hosted completion checks only after owner approval in a later package. Technical checks passed on 2026-07-16, but closure was reopened by the owner's 2026-07-19 human product rejection. Reclose only through Spec 015 X008-H after corrected exact-Preview owner acceptance.

## Phase 6A: R-011A - Safe Local UAT Gap Setup Paths

**Goal**: Implement safe, scoped, auditable local app/server setup paths for the three R-011A gaps without hosted mutation.

- [x] T036 [R011A] Add setup planning and validation domain layer in `src/modules/release/r011a-gap-setup-plan.ts`
- [x] T037 [R011A] Add local setup repository contract in `src/modules/release/r011a-gap-setup-repository.ts`
- [x] T038 [R011A] Add management-only server setup command in `src/server/commands/release/r011a-gap-setup.ts`
- [x] T039 [R011A] Add unit tests for plan validation and denial rules
- [x] T040 [R011A] Add integration tests for command behavior, audit requirements, idempotency, rollback/no-op summary, and unsafe file-operation denial
- [x] T041 [R011A] Add authorization tests for management-only execution and client/scope denials
- [x] T042 [R011A] Update R-011A mutation, rollback, safe-path implementation, verification, release, and project progress evidence
- [x] T043 [R011A] Run full required local verification for the new safe paths

## Phase 6B: R-011A - Hosted Execution Readiness Without Hosted Mutation

**Goal**: Prepare safe hosted execution wiring, no-op hosted dry-run rehearsal, value-free evidence collection, stop conditions, and runbook evidence without hosted mutation.

- [x] T044 [R011A] Add hosted-readiness tests for hosted dry-run approval, hosted apply denial, Hadna/count/file denials, value-free evidence summary, and rollback no-op before apply
- [x] T045 [R011A] Add hosted-readiness wrapper and value-free summary builder in `src/server/commands/release/r011a-hosted-gap-setup-readiness.ts`
- [x] T046 [R011A] Create hosted execution runbook, hosted dry-run plan, stop conditions, and evidence policy
- [x] T047 [R011A] Update R-011A mutation, rollback, safe-path implementation, execution log, verification, release, and project progress evidence
- [x] T048 [R011A] Run full required verification for hosted execution readiness wiring and redaction scope

## Phase 7: Future R-011B Or R-011C - Blocked Until Owner Selection

- [ ] T033 [R011B] Record owner risk acceptance for every carried residual risk before production-candidate planning continues with risk
- [ ] T034 [R011B] Preserve blocked Production acceptance claims in the later package
- [ ] T035 [R011C] Stop and request safe missing UAT data/categories if owner rejects residual risk and mutation approval

## Phase 8: R-011A Stage 2A — Local MVP Consolidation

- [x] T049 [R011A] Update the R-011A spec, plan, tasks, release note, and project-progress dashboard to reflect implemented local scope and open hosted gaps
- [x] T050 [R011A] Reconcile stale R-010/R-011 planning tasks as completed, superseded, deferred, or open
- [x] T051 [R011A] Audit and polish sign-in, management, client, deliverable, SLA, approval, file, waiting-approval, and client-portal surfaces for Arabic RTL desktop/mobile UX
- [x] T052 [R011A] Review touched queries, commands, routes, and file guards for tenant/client scope and deny-by-default behavior
- [x] T053 [R011A] Add synthetic negative coverage for management, assigned team, client viewer, client approver, and unauthorized client categories
- [x] T054 [R011A] Add/update component and Playwright coverage for keyboard access, responsive overflow, RTL, and core approval/delivery states
- [x] T055 [R011A] Run required local verification and record unavailable RLS DB/hosted checks honestly
- [x] T056 [R011A] Prepare reviewable local commits without pushing, deploying, or promoting
- [x] T057 [R011A] Generate the complete Stage 2B next-agent prompt and require the following internal MVP trial prompt

## Dependencies & Execution Order

- Phases 1-5 complete R-011 planning.
- Phase 6 Stage 1 started after the owner selected R-011A with explicit mutation approval.
- Phase 6 Stage 2 remains blocked because safe hosted mutation paths were not available in preflight.
- Phase 6A implements safe local setup paths only; it does not complete T032 or execute hosted Stage 2.
- Phase 6B prepares hosted execution readiness, no-op dry-run wiring, evidence policy, and stop conditions only; it does not complete T032 or execute hosted Stage 2.
- Phase 7 cannot start until the owner selects R-011B or R-011C.
- Phase 8 is the owner-approved local consolidation pass and does not close T032 hosted completion.

## Guardrails

- Do not perform hosted checks.
- Do not mutate hosted DB.
- Do not create accounts or change roles.
- Do not upload, download, open, delete, replace, or mutate hosted files.
- Do not deploy, promote, or change hosted configuration.
- Do not use non-Hadna data.
- Do not add dependencies.
- Do not implement product code outside the owner-approved R-011A safe local setup paths and Stage 2A UX/guardrail/test scope.
- Do not grant or imply Production acceptance.
- Do not record credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, secrets, direct identifiers, file contents, or row-level customer content.
