# Tasks: R-005 Internal Online Trial Readiness

**Input**: Design documents from `specs/006-internal-online-trial-readiness/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include a seed policy unit test and run the user-requested verification suite.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Pin the active Spec Kit feature directory in `.specify/feature.json`
- [x] T002 Create the R-005 Spec Kit package in `specs/006-internal-online-trial-readiness/`
- [x] T003 Update the managed Spec Kit AGENTS.md plan pointer to `specs/006-internal-online-trial-readiness/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Record PR #26 merge as the R-005 baseline in `specs/006-internal-online-trial-readiness/spec.md`
- [x] T005 Define hosted staging name `sharik-internal-trial-staging` in `specs/006-internal-online-trial-readiness/quickstart.md`
- [x] T006 Document no Production Supabase, no real client data, no public signup, no open permissions, and no committed passwords in `specs/006-internal-online-trial-readiness/contracts/internal-trial-uat.md`

---

## Phase 3: User Story 1 - Prepare Safe Hosted Staging (Priority: P1)

**Goal**: Define a safe hosted staging package for internal trial readiness.

**Independent Test**: Review R-005 docs and confirm the staging-only boundary, environment name, and out-of-scope list are explicit.

- [x] T007 [US1] Create release readiness documentation in `docs/08-release/R-005-internal-online-trial-readiness.md`
- [x] T008 [US1] Document out-of-GitHub credential delivery in `specs/006-internal-online-trial-readiness/quickstart.md`
- [x] T009 [US1] Update project progress with R-005 current gate in `docs/PROJECT_PROGRESS.md`

---

## Phase 4: User Story 2 - Seed Synthetic Trial Data (Priority: P1)

**Goal**: Provide guarded synthetic data for the current online trial surfaces.

**Independent Test**: Inspect or apply the seed to an approved empty staging target and verify the required fixture shape.

- [x] T010 [US2] Add guarded R-005 seed in `supabase/seeds/r005_internal_online_trial_readiness.sql`
- [x] T011 [US2] Add seed policy unit coverage in `tests/unit/seeds/r005-synthetic-seed.test.ts`
- [x] T012 [US2] Include SQL files in secret scanning via `scripts/secret-scan.mjs`

---

## Phase 5: User Story 3 - Run Internal Trial Checklist (Priority: P2)

**Goal**: Provide a focused UAT checklist that validates the current state without product expansion.

**Independent Test**: Execute the checklist against `sharik-internal-trial-staging` using synthetic accounts.

- [x] T013 [US3] Define the requested UAT checklist in `specs/006-internal-online-trial-readiness/contracts/internal-trial-uat.md`
- [x] T014 [US3] Mirror the executable checklist in `docs/08-release/R-005-internal-online-trial-readiness.md`
- [x] T015 [US3] Record local verification results in `specs/006-internal-online-trial-readiness/evidence/verification.md`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 Run `npm run lint`
- [x] T017 Run `npm run typecheck`
- [x] T018 Run `npm run test:unit`
- [x] T019 Run `npm run test:integration`
- [x] T020 Run `npm run test:rls`
- [x] T021 Run `npm run test:component`
- [x] T022 Run `npm run test:e2e`
- [x] T023 Run `npm run secret:scan`
- [x] T024 Run `npm run build`
- [x] T025 Commit, push, and open PR titled `chore(R-005): prepare internal online trial`

---

## Dependencies & Execution Order

- Phase 1 must complete before planning/implementation evidence.
- Phase 2 blocks all hosted staging documentation.
- US1 and US2 can be reviewed independently after Phase 2.
- US3 depends on US1 staging boundaries and US2 synthetic data.
- Phase 6 must complete before PR creation.

## Parallel Opportunities

- T007 and T010 affect different paths and can be reviewed independently.
- T011 and T013 affect different paths after T010 exists.
- Verification commands in Phase 6 should run sequentially for clearer failure reporting.

## Implementation Strategy

1. Complete Spec Kit and planning artifacts.
2. Add the guarded seed and seed policy test.
3. Add release/UAT documentation.
4. Run all requested checks.
5. Record evidence.
6. Open the PR; do not merge it.
