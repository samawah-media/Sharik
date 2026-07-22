# Tasks: R-010 Production-Candidate Gap Closure / Hosted Completion Decision

**Input**: Design documents from `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/`

**Prerequisites**: R-009 final closure evidence at `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/evidence/final-closure.md`

**Status**: Path B active for planning/evidence hardening only. Owner chose Path B on 2026-07-09: proceed with production-candidate planning using R-009 as partial owner-deferred evidence.

**Tests**: Planning validation only. Hosted checks, hosted mutation, deploy/promotion, account creation, role changes, hosted file operations, non-Hadna data, dependency changes, product code changes, and Production acceptance are blocked.

## Phase 1: Path B Decision Capture

**Goal**: Record the owner decision and prevent R-009 partial evidence from being overclaimed.

- [X] T001 Record R-009 closure as PARTIAL OWNER-DEFERRED in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/gap-closure-decision.md`
- [X] T002 Record no-more-R-009-hosted-checks boundary in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/spec.md`
- [X] T003 Record Path A as non-active fallback in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/plan.md`
- [X] T004 Record owner Path B selection in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/gap-closure-decision.md`
- [X] T005 Confirm R-009 T038, T039, and T044 remain unchecked in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/tasks.md`

## Phase 2: Path B Evidence Hardening

**Goal**: Create the production-candidate planning evidence package without hosted execution.

- [X] T006 Update Path B status and requirements in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/spec.md`
- [X] T007 Update accepted, partial/deferred, blocked-claim, Path A fallback, and next-package sections in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/plan.md`
- [X] T008 Create production-candidate readiness gap register in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/production-candidate-gap-register.md`
- [X] T009 Create residual-risk acceptance matrix in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/residual-risk-matrix.md`
- [X] T010 Create production-candidate go/no-go checklist in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/production-candidate-go-no-go-checklist.md`
- [X] T011 Create Path B rollback/no-op planning note in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/path-b-rollback-and-no-op.md`
- [X] T012 Update R-010 evidence summary in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/gap-closure-decision.md`
- [X] T013 Update project progress in `docs/PROJECT_PROGRESS.md`
- [X] T014 Refine future execution tasks in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/tasks.md`

## Phase 3: Next Package Preparation - R-011

**Goal**: Prepare the next large Spec Kit package after R-010, but do not start it until the owner approves.

**Independent Test**: A reviewer can see the exact next owner decision required before any implementation or hosted verification starts.

- [ ] T015 [R011] Create R-011 Spec Kit package at `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/spec.md` after owner approval
- [ ] T016 [R011] Define R-011 plan at `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/plan.md`
- [ ] T017 [R011] Define R-011 task list at `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/tasks.md`
- [ ] T018 [P] [R011] Map accepted R-008/R-009 evidence and deferred R-010 risks in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/evidence-map.md`
- [ ] T019 [P] [R011] Define client approver auth/portal/approval-control/isolation treatment criteria in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/spec.md`
- [ ] T020 [P] [R011] Define waiting-approval non-empty evidence criteria in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/spec.md`
- [ ] T021 [P] [R011] Define final-delivery list/category evidence criteria in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/spec.md`
- [ ] T022 [R011] Define required local tests, hosted-readiness gates, redaction checks, no-op proof, and owner stop conditions in `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/plan.md`

## Phase 4: Future Implementation Pass - Only After R-011 Approval

**Goal**: Give the next implementation pass a clear shape without authorizing it in R-010.

- [ ] T023 [R011] Review client approver control surfaces in `src/ui/client/client-approval-panel.tsx` and related authorization modules only after R-011 approval
- [ ] T024 [R011] Implement approved client approver auth/portal/approval-control/isolation fixes only if R-011 identifies product-code gaps
- [ ] T025 [R011] Implement approved waiting-approval non-empty presentation or fixture path only if R-011 authorizes product-code or data-prep work
- [ ] T026 [R011] Implement approved final-delivery list/category presentation only if R-011 authorizes product-code or data-prep work
- [ ] T027 [R011] Add or update local tests for client approver, waiting-approval, final-delivery, tenant isolation, and redaction boundaries in `tests/`
- [ ] T028 [R011] Run lint, typecheck, targeted tests, secret scan, whitespace check, and scoped redaction scan after any R-011 code or evidence changes

## Phase 5: Path A Fallback - Blocked Unless Owner Reopens It

**Goal**: Preserve Path A as the mutation-prep fallback without executing it.

- [ ] T029 [PathA] Record a new owner decision in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/gap-closure-decision.md` before returning to Path A
- [ ] T030 [PathA] Define exact hosted environment, Hadna-only scope, mutation categories, item counts, rollback/no-op owner, evidence rules, and stop conditions before any mutation
- [ ] T031 [PathA] Execute owner-approved hosted prep mutation only in a later package; do not execute in R-010
- [ ] T032 [PathA] Run later hosted read-only completion verification only after owner approval; do not execute in R-010

## Phase 6: Verification And Closure

- [X] T033 Run `npm run secret:scan`
- [X] T034 Run `git diff --check`
- [X] T035 Run scoped redaction scan over touched R-010/R-009 docs with count-only output
- [X] T036 Confirm lint/typecheck are not required because this pass changed documentation/evidence only
- [X] T037 Record final R-010 Path B status and residual risks in `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/evidence/gap-closure-decision.md`

## Dependencies & Execution Order

- Phase 1 and Phase 2 complete this R-010 Path B planning/evidence pass.
- Phase 3 cannot start until the owner explicitly approves R-011.
- Phase 4 cannot start until R-011 identifies and authorizes implementation work.
- Phase 5 cannot start unless the owner reopens Path A with explicit mutation approval.
- Phase 6 closes this documentation-only pass.

## Guardrails

- Do not run more R-009 hosted checks.
- Do not run R-010 hosted checks.
- Do not mutate hosted DB.
- Do not upload, delete, download, or open hosted files.
- Do not create accounts, invitations, roles, memberships, or password flows.
- Do not submit approvals, change requests, delivery, or status transitions.
- Do not deploy, promote, or change hosted configuration.
- Do not use non-Hadna data unless separately approved.
- Do not record credentials, emails, screenshots, workbook content, route links, captions, deliverable titles, token values, secret values, direct identifiers, file contents, or row-level customer content.
- Do not treat R-010 or R-009 as Production acceptance.
