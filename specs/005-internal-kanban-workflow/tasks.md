# Tasks: Internal Kanban Workflow MVP

**Input**: Design documents from `specs/005-internal-kanban-workflow/`

**Prerequisites**: `spec.md`, `plan.md`, `data-model.md`, `contracts/kanban-workflow.md`, `quickstart.md`, `AGENTS.md`, `.specify/memory/constitution.md`

**Tests**: Required by user request and AGENTS.md security gates.

**Task Format**: `- [ ] T### [P?] [Story?] Description with file path`

## Phase 1: Setup And Spec Gate

**Purpose**: Complete governance and confirm route/dependency decisions before code.

- [x] T001 Confirm PR #25 merge commit `0872780d00799ec42e95d3ea889c686cce8b7bad` is present on current branch in git history
- [x] T002 [P] Review `AGENTS.md`, `docs/PROJECT_PROGRESS.md`, and R-004 release/evidence docs before implementation
- [x] T003 [P] Review existing deliverable, audit, SLA, route guard, and permission modules in `src/modules/`, `src/server/`, and `src/app/(management)/clients/`
- [x] T004 [P] Document dnd-kit decision in `specs/005-internal-kanban-workflow/research.md` and `plan.md`
- [x] T005 Update `.specify/feature.json` and `AGENTS.md` Spec Kit pointer to `specs/005-internal-kanban-workflow/plan.md`

## Phase 2: Foundational Domain And Data Contract

**Purpose**: Add reusable status rules before UI or DB writes.

- [x] T006 [P] Add status transition rule tests in `tests/unit/deliverables/deliverable-rules.test.ts`
- [x] T007 Add active board status constants, transition validation, and progress derivation helpers in `src/modules/deliverables/deliverable-rules.ts`
- [x] T008 [P] Add command schema tests as part of `tests/unit/deliverables/deliverable-rules.test.ts`
- [x] T009 Extend deliverable schemas for status updates in `src/server/commands/deliverables/deliverable-schemas.ts`

## Phase 3: User Story 1 - View Client Deliverables Board (P1)

**Goal**: Authorized internal users can view a tenant/client scoped board.

**Independent Test**: Component and route checks show active workflow columns and scoped cards only.

- [x] T010 [P] [US1] Add board grouping/unit tests in `tests/unit/deliverables/deliverable-rules.test.ts`
- [x] T011 [P] [US1] Add component tests for board columns/cards in `tests/component/deliverables/deliverable-board.test.tsx`
- [x] T012 [US1] Add board UI component in `src/ui/management/deliverable-board.tsx`
- [x] T013 [US1] Add board page at `src/app/(management)/clients/[clientId]/deliverables/board/page.tsx`
- [x] T014 [US1] Derive SLA card status using existing SLA policy in the board page or UI adapter

## Phase 4: User Story 2 - Change Deliverable Status Safely (P1)

**Goal**: Authorized internal status changes update status/progress with audit and SLA-safe rules.

**Independent Test**: Integration command tests cover allowed transition, invalid transition, stale revision, and client-role denial.

- [x] T015 [P] [US2] Add integration tests for `updateDeliverableStatusCommand` in `tests/integration/deliverables/deliverable-status-workflow.test.ts`
- [x] T016 [P] [US2] Add RLS/simulator coverage that Client A cannot update/view Client B board data in `tests/rls/kanban-workflow-isolation.test.ts`
- [x] T017 [US2] Extend `DeliverableRepository` and `InMemoryDeliverableRepository` with status update support in `src/modules/deliverables/deliverable-repository.ts`
- [x] T018 [US2] Implement `update-deliverable-status.ts` in `src/server/commands/deliverables/update-deliverable-status.ts`
- [x] T019 [US2] Add audited Supabase RPC migration in `supabase/migrations/*_f004_deliverable_status_workflow.sql`
- [x] T020 [US2] Add RPC client mapping in `src/server/actions/deliverable-write-rpc.ts`
- [x] T021 [US2] Add server action in `src/server/actions/deliverable-status.ts`
- [x] T022 [US2] Wire status action controls in `src/ui/management/deliverable-board.tsx`

## Phase 5: User Story 3 - Discover Board From Existing Client Pages (P2)

**Goal**: Authorized internal users can reach the board from existing management pages.

**Independent Test**: Component/E2E checks confirm links exist for internal users and are absent or denied for client viewers.

- [x] T023 [P] [US3] Add component or E2E assertions for board links in `tests/e2e/management/kanban-board.spec.ts`
- [x] T024 [US3] Add board link from `src/app/(management)/clients/page.tsx`
- [x] T025 [US3] Add board link from `src/app/(management)/clients/[clientId]/page.tsx`
- [x] T026 [US3] Add board link from `src/app/(management)/clients/[clientId]/deliverables/page.tsx`

## Phase 6: Documentation And Evidence

**Purpose**: Keep progress and verification traceable.

- [x] T027 [P] Update `docs/PROJECT_PROGRESS.md` with F-004 implementation status, route decision, and security notes
- [x] T028 [P] Update `specs/005-internal-kanban-workflow/evidence/verification.md` with commands and results
- [x] T029 [P] Review whether an ADR is required; record "no ADR added" or update ADR notes in final evidence

## Phase 7: Verification

**Purpose**: Run the full requested gate before PR creation.

- [x] T030 Run `git diff --check`
- [x] T031 Run `npm run secret:scan`
- [x] T032 Run `npm run lint`
- [x] T033 Run `npm run typecheck`
- [x] T034 Run `npm run test:unit`
- [x] T035 Run `npm run test:integration`
- [x] T036 Run `npm run test:rls`
- [x] T037 Run `npm run test:component`
- [x] T038 Run `npm run test:e2e`
- [x] T039 Run `npm run build`

## Phase 8: PR

**Purpose**: Publish for review and stop before merge.

- [x] T040 Commit F-004 changes on `codex/f-004-internal-kanban-workflow`
- [x] T041 Push branch `codex/f-004-internal-kanban-workflow`
- [x] T042 Open PR titled `[codex] F-004 internal kanban workflow MVP`
- [x] T043 Confirm PR remains unmerged

## Dependencies & Execution Order

1. Phase 1 must complete before production code edits.
2. Phase 2 must complete before board UI or status command work.
3. US1 and US2 can progress in parallel after Phase 2, but UI action wiring depends on the server action.
4. US3 depends on the chosen board route from US1.
5. Verification must complete before PR creation.

## Explicitly Deferred

- Drag/drop and dnd-kit.
- Files.
- Comments.
- Full approvals workflow.
- Production Supabase.
- Real client data.
- RoleKey changes.
- Standalone `project_manager`.
- Social scheduling.
- AI.
