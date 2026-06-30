# Tasks: Internal Online MVP UAT

**Input**: Design documents from `specs/004-internal-online-mvp-uat/`

**Prerequisites**: `spec.md`, `plan.md`, `quickstart.md`, `AGENTS.md`, `.specify/memory/constitution.md`, PR #17 merged to `main`.

**Status**: UAT gate task list. Vercel Hobby/free and Vercel Production hosting target are owner-approved; hosted Supabase migration and data-backed UAT remain blocked until a Supabase UAT project exists and receives explicit approval.

**Scope Guard**: This branch prepares internal online MVP UAT only. It must not add product features, dependencies, database schema changes, Kanban, files, comments, approvals, social scheduling, AI, `RoleKey` changes, a standalone `project_manager` role, Production Supabase usage, real client data, or Production acceptance. Vercel Production target is allowed only as hosting.

**Task Format**: `- [ ] T### [P?] [Story?] Description with file path; Req; Verification; Dependencies; Category`

## Phase 1: Gate And Branch Readiness

**Purpose**: Prove the UAT branch starts from the correct merged baseline and does not disturb unrelated local work.

- [x] T001 Confirm PR #17 is merged into `origin/main`; Req: FR-001; Verification: `gh pr view 17` reports `MERGED`; Dependencies: none; Category: Gate
- [x] T002 Create isolated branch/worktree `codex/internal-online-mvp-uat` from `origin/main` after PR #17; Req: FR-002; Verification: `git status --short --branch`; Dependencies: T001; Category: Gate
- [x] T003 [P] Read `AGENTS.md`, `docs/PROJECT_PROGRESS.md`, `.specify/memory/constitution.md`, and relevant F-003 docs before edits; Req: FR-003; Verification: file review completed; Dependencies: T001; Category: Spec Gate

## Phase 2: Spec Kit And Data Risk Documentation

**Purpose**: Complete the documentation required before hosted deploy or hosted migration.

- [x] T004 [P] [US1] Create `specs/004-internal-online-mvp-uat/spec.md` with bounded UAT scope and exclusions; Req: FR-003, FR-007, FR-008; Verification: spec checklist; Dependencies: T003; Category: Spec
- [x] T005 [P] [US1] Create `specs/004-internal-online-mvp-uat/plan.md` with environment plan, hosted gates, data risks, and rollback; Req: FR-003, FR-004, FR-005, FR-006; Verification: plan review; Dependencies: T004; Category: Plan
- [x] T006 [P] [US1] Create `specs/004-internal-online-mvp-uat/research.md` and `data-model.md` for UAT decisions and evidence entities; Req: FR-005, FR-012; Verification: docs review; Dependencies: T004; Category: Plan
- [x] T007 [P] [US1] Create `specs/004-internal-online-mvp-uat/contracts/uat-gates.md` with H0-H3 gate contracts; Req: FR-006, FR-009, FR-010; Verification: gate review; Dependencies: T005; Category: Plan
- [x] T008 [P] [US1] Create `specs/004-internal-online-mvp-uat/checklists/requirements.md`; Req: SC-001 through SC-006; Verification: checklist complete; Dependencies: T004; Category: Spec Gate
- [x] T009 [P] [US1] Create `specs/004-internal-online-mvp-uat/evidence/uat-evidence-checklist.md`; Req: FR-012; Verification: evidence checklist exists; Dependencies: T005; Category: Evidence
- [x] T010 [US1] Create `specs/004-internal-online-mvp-uat/quickstart.md` for local, hosted, smoke, security, UAT, and rollback steps; Req: FR-009, FR-010, FR-011; Verification: quickstart review; Dependencies: T005-T009; Category: Quickstart

## Phase 3: Local Verification Before Hosted Operations

**Purpose**: Validate the branch without deploying or mutating hosted Supabase.

- [x] T011 [P] Run `git diff --check`; Req: implementation hygiene; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T012 [P] Run `npm run typecheck`; Req: implementation gate; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T013 [P] Run `npm run lint`; Req: implementation gate; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T014 [P] Run `npm run test:unit`; Req: existing sensitive logic remains passing; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T015 [P] Run `npm run test:integration`; Req: existing integration behavior remains passing; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T016 [P] Run `npm run test:rls`; Req: tenant/client isolation evidence; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T017 [P] Run `npm run test:component`; Req: UI surfaces remain stable; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T018 [P] Run `npm run test:e2e`; Req: end-to-end smoke coverage; Verification: command passes with 61 passed and 2 expected skips; Dependencies: T010; Category: Local Verification
- [x] T019 [P] Run `npm run secret:scan`; Req: SR-002; Verification: command passes; Dependencies: T010; Category: Local Verification
- [x] T020 [P] Run `npm audit --audit-level=high`; Req: dependency/security gate; Verification: command passes with existing moderate PostCSS advisory only; Dependencies: T010; Category: Local Verification
- [x] T021 Run `npm run build`; Req: deploy readiness; Verification: command passes; Dependencies: T011-T020; Category: Local Verification

## Phase 4: Hosted Supabase Gate

**Purpose**: Stop before any hosted database mutation until approval is explicit.

- [ ] T022 [US2] Obtain explicit owner approval matching `contracts/uat-gates.md` Gate H1 before hosted Supabase migration; Req: FR-006; Verification: approval recorded without secrets and without the literal `<PROJECT_REF>` placeholder; Dependencies: T021; Category: Hosted Gate
- [ ] T023 [US2] Verify target Supabase project is non-production and contains no real client data; Req: FR-005, SR-001; Verification: project/ref evidence without secrets; Dependencies: T022; Category: Hosted Gate
- [ ] T024 [US2] Run hosted non-production migration only after T022-T023; Req: FR-006; Verification: migration list/evidence; Dependencies: T023; Category: Hosted Migration
- [ ] T025 [US2] Seed synthetic data from `supabase/seeds/r004_internal_online_mvp_uat.sql` only after migration approval and target verification; Req: FR-005, SR-003, SR-007; Verification: seed manifest and row counts without secrets; Dependencies: T024; Category: Hosted Data

## Phase 5: Vercel Hobby/Free Deployment

**Purpose**: Publish the owner-approved Vercel deployment only after documentation and environment gates.

- [ ] T026 [US2] Confirm Vercel account is the owner-approved Hobby/free account; Req: FR-004, SR-001; Verification: `vercel whoami` and project link evidence without secrets; Dependencies: T021; Category: Deploy Gate
- [ ] T027 [US2] Configure or confirm deployment environment variables and protection/public exposure status; Req: FR-004, SR-002; Verification: env/protection evidence without secret values and without Production Supabase; Dependencies: T026; Category: Deploy Gate
- [ ] T028 [US2] Deploy Vercel target approved by owner; Production target is hosting-only, not Production acceptance; Req: FR-004, SR-001; Verification: deployment URL/id, target evidence, and rollback path; Dependencies: T027; Category: Deploy

## Phase 6: Smoke, Security, And UAT Checks

**Purpose**: Record evidence only for checks actually run against the correct environment.

- [ ] T029 [P] [US2] Run Vercel URL smoke against the deployed URL; Req: FR-009; Verification: target/account/response recorded and no secrets exposed; Dependencies: T028; Category: Smoke
- [ ] T030 [P] [US2] Run sign-in surface and hosted fixture-disablement smoke; Req: FR-009; Verification: fixture actors disabled in hosted runtime; Dependencies: T028; Category: Smoke
- [ ] T031 [P] [US2] Run browser response and secret exposure checks; Req: SR-002; Verification: no service role or secret values exposed; Dependencies: T028; Category: Security
- [ ] T032 [US2] Run Client A/B tenant and client isolation checks; Req: FR-010, SR-003, SR-005; Verification: unauthorized data is denied/not found; Dependencies: T025, T028; Category: Security
- [ ] T033 [US2] Run role boundary checks for internal and client users; Req: FR-010; Verification: client users cannot reach management-only surfaces; Dependencies: T025, T028; Category: Security
- [ ] T034 [US2] Run accepted MVP UAT surface checks for client management, contracts, packages, deliverables, commercial summaries, and SLA summaries; Req: FR-011; Verification: UAT evidence rows; Dependencies: T025, T028; Category: UAT

## Phase 7: Evidence, Progress, And PR

**Purpose**: Publish the reviewable branch and stop before merge.

- [ ] T035 [US3] Update `specs/004-internal-online-mvp-uat/evidence/uat-evidence-checklist.md` with local and hosted statuses; Req: FR-012, SR-004; Verification: evidence checklist is current; Dependencies: T011-T034 as applicable; Category: Evidence
- [ ] T036 [US3] Update `docs/PROJECT_PROGRESS.md` with UAT status, blockers, and out-of-scope confirmations; Req: FR-012; Verification: progress doc updated; Dependencies: T035; Category: Documentation
- [ ] T037 [US3] Commit and push branch `codex/internal-online-mvp-uat`; Req: FR-013; Verification: remote branch exists; Dependencies: T036; Category: PR
- [ ] T038 [US3] Open PR clearly marked internal online UAT, not Production, and do not merge; Req: FR-013; Verification: PR URL exists; Dependencies: T037; Category: PR

## Phase 8: R-004A Follow-up Corrections

**Purpose**: Fix follow-up gate issues discovered after PR #18 review without running hosted operations.

- [x] T039 [US1] Allow `.specify/feature.json` to satisfy `check-prerequisites.ps1` branch validation for pinned feature directories; Req: FR-012; Verification: `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` passes on `codex/*` branch; Dependencies: T010; Category: Tooling
- [x] T040 [US2] Add guarded R-004 synthetic Client A/B seed at `supabase/seeds/r004_internal_online_mvp_uat.sql`; Req: FR-005, SR-003, SR-007; Verification: seed SQL guard and local validation; Dependencies: T021; Category: Hosted Data Preparation
- [x] T041 [US2] Update H1 approval docs so placeholder `<PROJECT_REF>` remains blocked; Req: FR-006, SR-001; Verification: `quickstart.md` and `contracts/uat-gates.md`; Dependencies: T022; Category: Hosted Gate
- [x] T042 [US2] Document that `paused_waiting_internal_decision` is not persisted in the current MVP seed without a future schema change; Req: FR-007, FR-011; Verification: `plan.md`, `quickstart.md`, `data-model.md`; Dependencies: T040; Category: Scope Control

## Phase 9: R-004B Free Vercel And Supabase Deferral Decision

**Purpose**: Capture the owner correction that no new Supabase project exists yet and Vercel Team scope is not required for the free deployment path.

- [x] T043 [US1] Record owner decision that Vercel Hobby/free is acceptable and Vercel Production target may be used for hosting only; Req: FR-004, SR-001; Verification: `spec.md`, `plan.md`, `quickstart.md`, `contracts/uat-gates.md`; Dependencies: T042; Category: Scope Control
- [x] T044 [US1] Defer hosted Supabase migration/seed until a Supabase UAT project exists; Req: FR-006, SR-004; Verification: `spec.md`, `plan.md`, `data-model.md`, evidence checklist; Dependencies: T043; Category: Hosted Gate
- [ ] T045 [US2] Run Vercel deployment checks under owner-approved Hobby/free account; Req: FR-004, FR-009; Verification: deployment URL/id/target and rollback path; Dependencies: T026-T028; Category: Deploy

## Dependencies & Execution Order

1. Phase 1 must complete before documentation edits.
2. Phase 2 must complete before any hosted operation.
3. Phase 3 must complete before branch publication readiness.
4. Phase 4 is blocked until a Supabase UAT project exists and receives explicit owner approval.
5. Phase 5 may publish Vercel hosting before Supabase, but data-backed UAT remains blocked and must be labeled limited.
6. Phase 6 evidence must distinguish local, hosted, blocked, skipped, and failed checks.
7. Phase 7 opens the PR and stops before merge.

## Explicitly Deferred

- Production Supabase.
- Production acceptance.
- Real client data.
- Product feature implementation.
- New dependencies.
- Database schema changes in this branch.
- Kanban.
- Files.
- Comments.
- Internal approvals.
- Client approvals.
- Social scheduling.
- AI generation.
- Background jobs.
- `RoleKey` changes.
- Standalone `project_manager` role.
