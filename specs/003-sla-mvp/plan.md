# Implementation Plan: SLA MVP

**Branch**: `003-sla-mvp` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-sla-mvp/spec.md`

**Status**: F-003 SLA MVP implementation branch after PR #16. No production/staging migration, dependencies, hosted migration, production usage, or real client data are included.

## Summary

F-003 SLA MVP implements the first deliverable-level SLA foundation for Sharik. The plan records and implements boundaries for SLA statuses, due-date meaning, `paused_waiting_client`, `paused_waiting_internal_decision`, pause/resume audit expectations, client waiting exclusion from Samawah delay, and management-visible SLA status.

## Technical Context

**Language/Version**: Existing TypeScript and Next.js App Router stack from the repository baseline.

**Primary Dependencies**: Existing dependencies only. No dependency changes are planned or allowed in this PR.

**Storage**: Existing Supabase/PostgreSQL deliverable context from F-002 is the baseline. This MVP does not run hosted/staging/production migrations.

**Testing**: Unit/domain tests cover SLA calculation and timeline attribution. Integration tests cover management scoped reads and denial/audit representation. Existing typecheck, lint, unit, integration, and build gates apply.

**Target Platform**: Web SaaS, Arabic RTL management experience, tenant/client scoped data.

**Project Type**: Full-stack web application, modular monolith.

**Performance Goals**: Future SLA status evaluation should be understandable and responsive for pilot-scale deliverable lists. No performance implementation is included in this PR.

**Constraints**:

- F-002 is review-ready only, not production accepted without explicit written owner approval.
- No background jobs.
- No production/staging migrations.
- No dependencies.
- No hosted/staging migration.
- No production usage.
- No real client data.
- No Kanban, files, comments, or approvals.
- No `RoleKey` changes and no standalone `project_manager` role.

**Scale/Scope**: F-003 SLA MVP only, centered on deliverable-level SLA state and management visibility.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | F-003 spec exists before implementation and is updated with implementation policy. |
| Approved acceptance criteria | PASS | `spec.md` defines acceptance scenarios and measurable success criteria. |
| Tenant/client isolation | PASS | SLA visibility and future behavior are scoped to tenant/client access. |
| Deny by default | PASS | Unauthorized SLA status access must deny without resource enumeration. |
| Server-side sensitive commands | PASS | Future pause/resume mutations are treated as sensitive command candidates. |
| RLS defense in depth | PASS | Future implementation must preserve tenant/client scoped reads and RLS expectations. |
| Append-only auditability | PASS | Pause/resume audit expectations are append-only. |
| SLA timeline, not counters | PASS | The plan centers pause/resume boundaries and excludes client waiting time. |
| No new dependency without review | PASS | No dependency changes are included. |
| Scope control | PASS | Full SLA engine beyond MVP, background jobs, production/staging migrations, Kanban, files, comments, approvals, production, and real client data are out of scope. |

No constitution violation is introduced by this SLA MVP branch.

## Project Structure

### Documentation (this feature)

```text
specs/003-sla-mvp/
|-- spec.md
|-- plan.md
|-- tasks.md
`-- quickstart.md
```

### Source Code

```text
src/modules/sla/
|-- sla-policy.ts
`-- sla-summary.ts

src/server/commands/sla/
`-- list-management-sla-summaries.ts

tests/unit/sla/
`-- sla-policy.test.ts

tests/integration/sla/
`-- management-sla-summary.test.ts
```

No Kanban, files, comments, approvals workflow, background jobs, or new dependencies are added.

## Data And Authorization Boundary

Future SLA implementation must resolve:

1. authenticated actor;
2. active tenant membership;
3. assigned client scope;
4. deliverable tenant/client ownership;
5. management visibility permission;
6. deliverable state;
7. due-date boundaries;
8. pause/resume boundaries;
9. audit requirement.

Browser-supplied tenant/client/deliverable identifiers must not be trusted as authorization proof.

## SLA Boundary Strategy

The MVP specification uses these business boundaries:

- Active Samawah-owned work can be `on_track`, `at_risk`, or `overdue`.
- Owner-approved F-003 MVP `at_risk` policy: active Samawah-owned work is `at_risk` when an applicable due boundary exists, `now` is before that boundary, and remaining calendar time is less than or equal to 24 hours. Date-only due dates are normalized to the end of that UTC calendar day for deterministic local tests.
- Client-waiting work must be `paused_waiting_client`.
- Client waiting time must not count against Samawah delay.
- Internal-decision waiting can be represented by `paused_waiting_internal_decision` where applicable, but it must remain distinct from `paused_waiting_client` and must not be attributed as client delay.
- Completion and cancellation stop active SLA delay.
- Pause and resume events must be explainable by audit expectations.

## Deferred Design Work

- Exact persisted data shape for SLA segments.
- Exact management UI placement for SLA status.
- Tenant/type/business-calendar at-risk threshold policy beyond this 24-hour MVP threshold.
- Persisted internal-decision pause policy and its effect on Samawah running time beyond the local timeline representation.
- Exact relationship between future approval workflow states and SLA pause/resume.
- Exact migration/RLS details.

These deferred decisions must be resolved before any later implementation that depends on persisted SLA segments, workflow integration, migrations, or expanded threshold policy.

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | This PR implements SLA MVP foundation only and blocks non-SLA scope. |
| Tenant/client isolation | PASS | Requirements preserve scoped visibility. |
| Auditability | PASS | Pause/resume audit expectations are explicit. |
| SLA timeline | PASS | Client waiting is modeled as paused time, not Samawah delay. |
| No production data | PASS | Production and real client data are explicitly out of scope. |

No unresolved implementation approval exists in this plan.
