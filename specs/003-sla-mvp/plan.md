# Implementation Plan: SLA MVP

**Branch**: `003-sla-mvp` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-sla-mvp/spec.md`

**Status**: Draft - planning artifact only. No implementation, migrations, dependencies, hosted migration, production usage, or real client data are included in this PR.

## Summary

F-003 SLA MVP defines the first deliverable-level SLA foundation for Sharik. The plan records the intended boundaries for SLA statuses, due-date meaning, `paused_waiting_client`, pause/resume audit expectations, client waiting exclusion from Samawah delay, and management-visible SLA status.

This branch is a specification gate only. Future implementation requires a separate owner-approved gate after F-002 owner review.

## Technical Context

**Language/Version**: Existing TypeScript and Next.js App Router stack from the repository baseline. No code changes in this PR.

**Primary Dependencies**: Existing dependencies only. No dependency changes are planned or allowed in this PR.

**Storage**: Existing Supabase/PostgreSQL deliverable context from F-002 is the planning baseline. No migrations are created in this PR.

**Testing**: No tests are added or run for implementation behavior in this PR. Future implementation should use unit/domain, integration, RLS, component, E2E, typecheck, lint, secret scan, audit, and build gates.

**Target Platform**: Web SaaS, Arabic RTL management experience, tenant/client scoped data.

**Project Type**: Full-stack web application, modular monolith.

**Performance Goals**: Future SLA status evaluation should be understandable and responsive for pilot-scale deliverable lists. No performance implementation is included in this PR.

**Constraints**:

- F-002 is review-ready only, not production accepted without explicit written owner approval.
- No SLA engine.
- No background jobs.
- No migrations.
- No dependencies.
- No hosted/staging migration.
- No production usage.
- No real client data.
- No Kanban, files, comments, or approvals.
- No `RoleKey` changes and no standalone `project_manager` role.

**Scale/Scope**: Specification for F-003 SLA MVP only, centered on deliverable-level SLA state and management visibility.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | This branch creates `spec.md` before any F-003 implementation. |
| Approved acceptance criteria | PASS | `spec.md` defines acceptance scenarios and measurable success criteria. |
| Tenant/client isolation | PASS | SLA visibility and future behavior are scoped to tenant/client access. |
| Deny by default | PASS | Unauthorized SLA status access must deny without resource enumeration. |
| Server-side sensitive commands | PASS | Future pause/resume mutations are treated as sensitive command candidates. |
| RLS defense in depth | PASS | Future implementation must preserve tenant/client scoped reads and RLS expectations. |
| Append-only auditability | PASS | Pause/resume audit expectations are append-only. |
| SLA timeline, not counters | PASS | The plan centers pause/resume boundaries and excludes client waiting time. |
| No new dependency without review | PASS | No dependency changes are included. |
| Scope control | PASS | SLA engine, background jobs, migrations, Kanban, files, comments, approvals, production, and real client data are out of scope. |

No constitution violation is introduced by this documentation-only PR.

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
No source code changes are included in this PR.
```

Future implementation targets must be defined in a later owner-approved plan before code, migrations, tests, or dependencies are added.

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
- Client-waiting work must be `paused_waiting_client`.
- Client waiting time must not count against Samawah delay.
- Internal-decision waiting can be represented by `paused_waiting_internal_decision` where applicable.
- Completion and cancellation stop active SLA delay.
- Pause and resume events must be explainable by audit expectations.

## Deferred Design Work

- Exact persisted data shape for SLA segments.
- Exact management UI placement for SLA status.
- Exact at-risk threshold policy.
- Exact relationship between future approval workflow states and SLA pause/resume.
- Exact migration/RLS details.
- Exact tests and evidence files for implementation.

These deferred decisions must be resolved before any F-003 implementation starts.

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | This PR is documentation-only and blocks implementation scope. |
| Tenant/client isolation | PASS | Requirements preserve scoped visibility. |
| Auditability | PASS | Pause/resume audit expectations are explicit. |
| SLA timeline | PASS | Client waiting is modeled as paused time, not Samawah delay. |
| No production data | PASS | Production and real client data are explicitly out of scope. |

No unresolved implementation approval exists in this plan.
