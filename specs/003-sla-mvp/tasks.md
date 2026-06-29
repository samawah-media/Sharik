# Tasks: SLA MVP

**Input**: Design documents from `specs/003-sla-mvp/`

**Prerequisites**: `spec.md`, `plan.md`, `quickstart.md`, `AGENTS.md`, `.specify/memory/constitution.md`, F-002 owner review gate.

**Status**: Initial Spec Kit task scaffold only. No F-003 implementation tasks are executed by this PR.

**Scope Guard**: This PR must not implement F-003. It must not add an SLA engine, background jobs, migrations, dependencies, Kanban, files, comments, approvals, hosted/staging migration, production usage, real client data, `RoleKey` changes, or a standalone `project_manager` role.

**Tests**: No product tests are added in this documentation-only PR. Future implementation must add tests before sensitive SLA logic.

**Task Format**: `- [ ] T### [P?] [Story?] Description with file path; Req; Verification; Dependencies; Category`

**Categories**: Spec Gate, Planning, Future Verification.

## Phase 1: Spec Gate Closure

**Purpose**: Confirm the F-003 SLA MVP scope is ready for owner review before implementation.

- [ ] T001 Review `specs/003-sla-mvp/spec.md` with the owner and confirm F-003 remains SLA MVP only; Req: FR-001 through FR-013; Verification: explicit owner review note; Dependencies: PR #15 merged; Category: Spec Gate
- [ ] T002 Review `specs/003-sla-mvp/plan.md` for AGENTS.md compliance and confirm no implementation is authorized; Req: Included Scope and Excluded Scope; Verification: no migration, dependency, or code work approved by this task; Dependencies: T001; Category: Spec Gate
- [ ] T003 Review `specs/003-sla-mvp/quickstart.md` and confirm all scenarios use synthetic local or non-production data only; Req: SR-001 through SR-005; Verification: quickstart scenarios require no production or real client data; Dependencies: T001; Category: Spec Gate

**Checkpoint 1**: F-003 has a reviewed specification gate, but implementation remains blocked.

## Phase 2: Future Implementation Planning Placeholder

**Purpose**: Capture the next planning steps that must happen in a later owner-approved PR before code.

- [ ] T004 [P] Expand future SLA data model planning in `specs/003-sla-mvp/plan.md`; Req: FR-002, FR-003, FR-007, FR-012, FR-013; Verification: due-date, deterministic owner-approved at-risk threshold, pause segment, internal-decision pause, and audit boundaries are fully specified; Dependencies: owner approval to continue planning; Category: Planning
- [ ] T005 [P] Expand future test matrix in `specs/003-sla-mvp/quickstart.md`; Req: SC-001 through SC-007; Verification: on-track, deterministic owner-approved at-risk threshold, overdue, client-waiting pause, internal-decision pause, resume, and scoped visibility scenarios are mapped to future evidence; Dependencies: owner approval to continue planning; Category: Future Verification
- [ ] T006 Draft a later implementation task breakdown in `specs/003-sla-mvp/tasks.md`; Req: all F-003 requirements; Verification: tasks include tests first and exact file paths before any code starts; Dependencies: F-002 owner gate and F-003 spec approval; Category: Planning

**Checkpoint 2**: A later PR can turn the scaffold into executable implementation tasks only after owner approval.

## Explicitly Deferred Implementation Tasks

These items are intentionally not tasks in this PR:

- SLA engine.
- Background job scheduling.
- Database migrations.
- Runtime code.
- New dependencies.
- Kanban integration.
- File integration.
- Comment integration.
- Approval workflow integration.
- Hosted/staging migration.
- Production rollout.
- Real client data verification.
- `RoleKey` or standalone `project_manager` changes.

## Dependencies & Execution Order

- PR #15 must be merged before this scaffold is created.
- F-002 remains review-ready only until explicit written owner approval says otherwise.
- F-003 implementation must not start from this scaffold.
- The next allowed step is owner review of the F-003 SLA MVP Spec only.

## Implementation Strategy

### Current PR

1. Record PR #15 merge and F-002 review-ready status in `docs/PROJECT_PROGRESS.md`.
2. Create initial F-003 SLA MVP Spec Kit files.
3. Run documentation evidence checks only.
4. Open a PR for review.

### Later Owner-Approved PR

1. Resolve any owner comments on the F-003 spec.
2. Expand tasks into implementation-ready, test-first tasks with exact file paths.
3. Only then start code, tests, or migrations if explicitly approved.

## Notes

- `[P]` means the planning tasks touch different documentation sections and can be reviewed in parallel.
- This file is intentionally conservative because the current request is Spec Kit preparation only.
- Any future implementation task must preserve tenant/client isolation, auditability, and the rule that client waiting time does not count against Samawah.
