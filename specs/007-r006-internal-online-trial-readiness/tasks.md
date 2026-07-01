# Tasks: R-006 Internal Online Trial Readiness

**Input**: Design documents from `specs/007-r006-internal-online-trial-readiness/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Run and record the full baseline quality gate. No new tests are added because R-006 is documentation/readiness only.

**Organization**: Tasks are grouped by user story to enable independent review.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Pin active Spec Kit feature directory in `.specify/feature.json`
- [x] T002 Create R-006 Spec Kit package in `specs/007-r006-internal-online-trial-readiness/`
- [x] T003 Update managed Spec Kit AGENTS.md plan pointer to `specs/007-r006-internal-online-trial-readiness/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Record post-F-005 baseline commit in `specs/007-r006-internal-online-trial-readiness/spec.md`
- [x] T005 Define R-006 as readiness-only in `specs/007-r006-internal-online-trial-readiness/plan.md`
- [x] T006 Document non-production Supabase/Vercel boundaries in `specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md`

---

## Phase 3: User Story 1 - Verify Post-F-005 Baseline (Priority: P1)

**Goal**: Prove the F-005 baseline is ready for a separate readiness decision.

**Independent Test**: Run the full quality gate and review `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`.

- [x] T007 [US1] Create baseline quickstart in `specs/007-r006-internal-online-trial-readiness/quickstart.md`
- [x] T008 [US1] Run `npm run lint` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T009 [US1] Run `npm run typecheck` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T010 [US1] Run `npm run test:unit` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T011 [US1] Run `npm run test:integration` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T012 [US1] Run `npm run test:rls` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T013 [US1] Run `npm run test:component` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T014 [US1] Run `npm run test:e2e` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T015 [US1] Run `npm run secret:scan` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`
- [x] T016 [US1] Run `npm run build` and record result in `specs/007-r006-internal-online-trial-readiness/evidence/verification.md`

---

## Phase 4: User Story 2 - Define Non-Production Boundaries (Priority: P1)

**Goal**: Make production and real-data use impossible to confuse with R-006.

**Independent Test**: Review the boundary contract and release doc for explicit production, real-data, and secret prohibitions.

- [x] T017 [US2] Document Supabase boundary in `specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md`
- [x] T018 [US2] Document Vercel boundary in `specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md`
- [x] T019 [US2] Mirror boundary in `docs/08-release/R-006-internal-online-trial-readiness.md`

---

## Phase 5: User Story 3 - Prepare Synthetic Trial Plan (Priority: P2)

**Goal**: Define safe synthetic data shape without applying it.

**Independent Test**: Review the synthetic data plan and confirm no seed, credentials, or real data are introduced.

- [x] T020 [US3] Document synthetic data plan in `specs/007-r006-internal-online-trial-readiness/data-model.md`
- [x] T021 [US3] Document synthetic data plan in `docs/08-release/R-006-internal-online-trial-readiness.md`
- [x] T022 [US3] Add readiness checklist in `specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T023 Update `docs/PROJECT_PROGRESS.md` with R-006 readiness status
- [x] T024 Re-run `git diff --check`
- [x] T025 Re-run `npm run secret:scan` after docs are finalized
- [ ] T026 Commit, push, and open a draft PR

---

## Dependencies & Execution Order

- Phase 1 must complete before planning evidence.
- Phase 2 blocks all readiness docs.
- US1 and US2 can be reviewed independently after Phase 2.
- US3 depends on US2 boundaries.
- Phase 6 must complete before PR handoff.

## Parallel Opportunities

- T017 and T020 affect different files and can be reviewed independently.
- Verification commands should run sequentially for clean evidence.

## Implementation Strategy

1. Create Spec Kit package.
2. Define boundaries and synthetic data plan.
3. Run full baseline quality gate.
4. Record evidence and update progress.
5. Open PR; do not merge and do not start trial.
