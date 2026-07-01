# Tasks: F-005 UX Rescue Product Shell

**Input**: Design documents from `specs/006-ux-rescue-product-shell/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/ui-contract.md`, `quickstart.md`, `AGENTS.md`, `.specify/memory/constitution.md`

**Tests**: Required by user request and AGENTS.md quality gates.

**Task Format**: `- [ ] T### [P?] [Story?] Description with file path`

## Phase 1: Setup And Spec Gate

**Purpose**: Complete governance before code.

- [x] T001 Create F-005 Spec Kit package in `specs/006-ux-rescue-product-shell/`
- [x] T002 [P] Review `AGENTS.md`, `.specify/memory/constitution.md`, and current plan reference before implementation
- [x] T003 [P] Review current clients, client detail, contracts, packages, deliverables list, and deliverables board pages under `src/app/(management)/clients/`
- [x] T004 [P] Review existing UX docs in `docs/04-ux-and-user-flows/`
- [x] T005 Update `.specify/feature.json` and `AGENTS.md` Spec Kit pointer to `specs/006-ux-rescue-product-shell/plan.md`

## Phase 2: Foundational UI System

**Purpose**: Add reusable primitives before page-specific changes.

- [x] T006 [P] [US2] Add shared Button component in `src/ui/core/button.tsx`
- [x] T007 [P] [US2] Add shared Card and SectionPanel components in `src/ui/core/card.tsx`
- [x] T008 [P] [US2] Add shared Badge and StatCard components in `src/ui/core/badge.tsx`
- [x] T009 [P] [US2] Add EmptyState, ErrorState, and LoadingSkeleton components in `src/ui/core/states.tsx`
- [x] T010 [P] [US1] Add PageHeader and breadcrumb helpers in `src/ui/layout/page-header.tsx`
- [x] T011 [P] [US1] Add ProductShell component in `src/ui/layout/product-shell.tsx`
- [x] T012 [P] [US1] Add component tests for shell and UI states in `tests/component/product-shell.test.tsx`

## Phase 3: User Story 1 - Product Shell For Reviewed Pages (P1)

**Goal**: Reviewed management pages share one RTL shell and page header model.

**Independent Test**: Component tests and E2E smoke show the shell around the reviewed routes.

- [x] T013 [US1] Replace management layout wrapper with ProductShell in `src/app/(management)/layout.tsx`
- [x] T014 [US1] Update clients list page header/actions/cards in `src/app/(management)/clients/page.tsx`
- [x] T015 [US1] Update client detail page title/cards in `src/app/(management)/clients/[clientId]/page.tsx`
- [x] T016 [US1] Update contracts page header/list state wiring in `src/app/(management)/clients/[clientId]/contracts/page.tsx` and `src/ui/management/contract-form.tsx`
- [x] T017 [US1] Update packages page header/list state wiring in `src/app/(management)/clients/[clientId]/contracts/[contractId]/packages/page.tsx` and `src/ui/management/package-form.tsx`
- [x] T018 [US1] Update deliverables list header/actions/list state wiring in `src/app/(management)/clients/[clientId]/deliverables/page.tsx` and `src/ui/management/deliverable-form.tsx`

## Phase 4: User Story 3 - Kanban Redesign Without Drag/Drop (P1)

**Goal**: Current board becomes readable and responsive while keeping existing status update behavior.

**Independent Test**: Component tests verify column sizing, horizontal scroll contract, card containment, badges, and compact action control.

- [x] T019 [P] [US3] Update Kanban component tests in `tests/component/deliverables/deliverable-board.test.tsx`
- [x] T020 [US3] Redesign board layout, columns, cards, badges, and compact status controls in `src/ui/management/deliverable-board.tsx`
- [x] T021 [US3] Update board page header/actions in `src/app/(management)/clients/[clientId]/deliverables/board/page.tsx`
- [x] T022 [US3] Add or update E2E smoke for board open/navigation/status-control path in `tests/e2e/management/kanban-board.spec.ts`

## Phase 5: RTL, Responsive, And Visual Evidence (P2)

**Goal**: Prove desktop/mobile/tablet RTL behavior and capture before/after evidence.

**Independent Test**: Screenshot evidence and E2E assertions show no obvious overlapping or broken board layout.

- [x] T023 [P] [US4] Capture pre-change or baseline evidence notes in `specs/006-ux-rescue-product-shell/evidence/verification.md`
- [x] T024 [P] [US4] Capture after screenshots in `specs/006-ux-rescue-product-shell/evidence/screenshots/`
- [x] T025 [US4] Add docs summary with screenshot/evidence links in `docs/08-release/F-005-ux-rescue-product-shell.md`
- [x] T026 [US4] Update `specs/006-ux-rescue-product-shell/evidence/verification.md` with final command results

## Phase 6: Verification

**Purpose**: Run the requested gate before PR creation.

- [x] T027 Run `npm run lint`
- [x] T028 Run `npm run typecheck`
- [x] T029 Run `npm run test:unit`
- [x] T030 Run `npm run test:integration`
- [x] T031 Run `npm run test:component`
- [x] T032 Run `npm run test:e2e`
- [x] T033 Run `npm run secret:scan`
- [x] T034 Run `npm run build`

## Phase 7: PR

**Purpose**: Publish for review and stop before merge.

- [x] T035 Commit F-005 changes on `codex/f-005-ux-rescue-product-shell`
- [x] T036 Push branch `codex/f-005-ux-rescue-product-shell`
- [x] T037 Open PR titled `fix(F-005): rescue product shell and kanban UX`
- [x] T038 Confirm PR remains open and unmerged

## Dependencies & Execution Order

1. Phase 1 must complete before production code edits.
2. Phase 2 primitives must complete before page updates.
3. Page shell work and Kanban redesign can proceed after primitives are available.
4. Evidence must be updated before final PR.
5. Verification must complete before commit/push/PR.

## Explicitly Deferred

- Drag/drop and dnd-kit.
- Files.
- Comments.
- Approval flows.
- AI.
- Social scheduling.
- Production Supabase.
- Real client data.
- New dependencies without ADR.
