# Tasks: SLA MVP

**Input**: Design documents from `specs/003-sla-mvp/`

**Prerequisites**: `spec.md`, `plan.md`, `quickstart.md`, `AGENTS.md`, `.specify/memory/constitution.md`, PR #16 merged to `main`, owner approval to open F-003 SLA MVP implementation.

**Status**: Implementation-ready F-003 SLA MVP task list.

**Scope Guard**: This branch may implement SLA MVP foundation only. It must not add background jobs, production/staging migrations, dependencies, Kanban, files, comments, approvals workflow, hosted/staging migration, production usage, real client data, `RoleKey` changes, or a standalone `project_manager` role.

**At-Risk Policy**: Owner-approved F-003 MVP threshold is deterministic: active Samawah-owned work becomes `at_risk` when an applicable due boundary exists, `now` is before that boundary, and remaining calendar time is less than or equal to 24 hours. Date-only due dates are normalized to the end of that UTC calendar day for deterministic local tests. Tenant/type/business-calendar thresholds are deferred.

**Task Format**: `- [ ] T### [P?] [Story?] Description with file path; Req; Verification; Dependencies; Category`

## Phase 1: Context And Task Readiness

**Purpose**: Confirm gate context and convert the PR #16 scaffold into implementation-ready tasks before code.

- [X] T001 Confirm PR #16 is merged on `origin/main` and branch `codex/f003-sla-mvp-implementation` starts from latest `origin/main`; Req: FR-011; Verification: git log/status evidence; Dependencies: none; Category: Spec Gate
- [X] T002 Update `specs/003-sla-mvp/spec.md`, `plan.md`, `tasks.md`, and `quickstart.md` with implementation scope and deterministic `at_risk` policy; Req: FR-001 through FR-013, SC-001 through SC-007; Verification: docs show allowed and excluded scope; Dependencies: T001; Category: Planning

## Phase 2: Domain Tests First

**Purpose**: Lock down sensitive SLA math before implementation.

- [X] T003 [P] Add unit tests in `tests/unit/sla/sla-policy.test.ts` for `on_track`, deterministic `at_risk`, `overdue`, terminal `completed/cancelled`, and due-date boundary selection; Req: FR-001, FR-002, FR-003, FR-013; Verification: `npm run test:unit`; Dependencies: T002; Category: Tests
- [X] T004 [P] Add unit tests in `tests/unit/sla/sla-policy.test.ts` for `paused_waiting_client`, `paused_waiting_internal_decision`, Samawah/client/internal delay attribution, and pause/resume audit event shape; Req: FR-004, FR-005, FR-006, FR-007, FR-012, SC-002, SC-003, SC-006; Verification: `npm run test:unit`; Dependencies: T002; Category: Tests
- [X] T005 Add integration tests in `tests/integration/sla/management-sla-summary.test.ts` for management scoped SLA visibility, same-tenant/cross-tenant denial, and denial audit representation; Req: FR-008, FR-009, FR-010, SR-001, SR-002, SR-005; Verification: `npm run test:integration`; Dependencies: T002; Category: Tests

## Phase 3: SLA Domain Foundation

**Purpose**: Implement pure, deterministic SLA status and timeline attribution without background jobs or persisted SLA segments.

- [X] T006 Implement `src/modules/sla/sla-policy.ts` with SLA status types, applicable due boundary selection, deterministic 24-hour `at_risk`, pause status derivation, delay attribution, and pause/resume audit event builders; Req: FR-001 through FR-007, FR-012, FR-013; Verification: T003/T004 pass; Dependencies: T003, T004; Category: Core
- [X] T007 Implement `src/modules/sla/sla-summary.ts` to produce management-safe SLA summaries from existing deliverable safe summaries without exposing client-facing internal reasoning; Req: FR-008, FR-010, SR-005; Verification: T005 pass; Dependencies: T006; Category: Core

## Phase 4: Server-Side Scoped Read

**Purpose**: Expose management SLA summaries through server-side authorization and Zod input validation only.

- [X] T008 Implement `src/server/commands/sla/list-management-sla-summaries.ts` with Zod `clientId` validation, actor tenant derivation, existing scoped permission checks, management-role-only access, tenant/client-scoped repository reads, and denial audit representation; Req: FR-008, FR-009, SR-001, SR-002; Verification: T005 pass; Dependencies: T005, T007; Category: Integration

## Phase 5: Verification

**Purpose**: Run the allowed local gates and capture remaining risks.

- [X] T009 Run `git diff --check`; Req: implementation hygiene; Verification: command passes; Dependencies: T006-T008; Category: Verification
- [X] T010 Run `npm run typecheck`; Req: TypeScript strict where possible; Verification: command passes; Dependencies: T006-T008; Category: Verification
- [X] T011 Run `npm run lint`; Req: implementation gate; Verification: command passes; Dependencies: T006-T008; Category: Verification
- [X] T012 Run `npm run test:unit`; Req: sensitive SLA domain logic covered; Verification: command passes; Dependencies: T006; Category: Verification
- [X] T013 Run `npm run test:integration`; Req: scoped management read behavior covered; Verification: command passes; Dependencies: T008; Category: Verification
- [X] T014 Run `npm run build`; Req: server/module changes compile in app build; Verification: command passes; Dependencies: T006-T008; Category: Verification

## Explicitly Deferred Implementation Tasks

- Background job scheduling.
- Production/staging migration execution.
- New database tables or persisted SLA timeline segments.
- New dependencies.
- Kanban integration.
- File integration.
- Comment integration.
- Approval workflow integration.
- Hosted/staging migration.
- Production rollout.
- Real client data verification.
- `RoleKey` or standalone `project_manager` changes.
- Tenant/type/business-calendar at-risk thresholds beyond the documented 24-hour MVP threshold.

## Dependencies & Execution Order

1. Phase 1 must complete before code.
2. Phase 2 tests are written before domain/server implementation.
3. Phase 3 domain foundation must pass unit tests before server scoped read is considered complete.
4. Phase 4 must preserve tenant/client scoped reads and deny without resource enumeration.
5. Phase 5 must run before presenting the branch for merge/hold recommendation.
