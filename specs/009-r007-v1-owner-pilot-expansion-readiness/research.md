# Research: R-007 V1 Owner Pilot Expansion and Acceptance-to-Production Readiness

## Decision: Use R-006 as the Accepted Baseline

**Rationale**: R-006 passed final owner acceptance smoke and was explicitly accepted for Hadna-only internal UAT. R-007 must build from that known baseline rather than reopen accepted UAT work.

**Alternatives considered**:

- Reopen R-006 for more fixes. Rejected because the owner accepted R-006 and requested the next workstream as a new Spec Kit package.
- Start production acceptance directly. Rejected because R-006 is internal UAT acceptance only.

## Decision: Keep R-007 Focused on V1 Core Readiness

**Rationale**: The V1 product heart is deliverables, SLA, Kanban/workflow, internal approval, client approval, files, permissions, multi-client isolation, and audit logs. R-007 should turn the accepted MVP evaluation flow into a readiness package for the next pilot decision.

**Alternatives considered**:

- Add social scheduling, AI generation, billing, CRM, or mobile apps. Rejected as outside V1.
- Treat R-007 as broad polish. Rejected because readiness needs testable gates, not open-ended cleanup.

## Decision: Require Explicit Owner Approval Before Hosted Mutation or Non-Hadna Data

**Rationale**: The current owner boundary says not to mutate hosted DB or use non-Hadna customer data without a new explicit approval and Spec Kit scope.

**Alternatives considered**:

- Reuse the existing R-006 approval for new data or hosted mutation. Rejected because R-006 approval was scoped to Hadna internal UAT.
- Prepare local-only fixtures and wait for owner approval before hosted execution. Accepted as the default.

## Decision: Use Existing Stack and Architecture

**Rationale**: AGENTS.md and the constitution require the approved V1 stack: Next.js, TypeScript, Supabase/PostgreSQL/RLS, Supabase Auth/Storage, server-side sensitive commands, Zod, current tests, and existing UI conventions.

**Alternatives considered**:

- Add a new backend framework or microservice. Rejected without ADR and because V1 remains a modular monolith.
- Add a new workflow, file, or editor dependency before implementation. Rejected unless a later ADR proves it is needed.

## Decision: Treat Production Readiness as Evidence, Not a Deployment Action

**Rationale**: R-007 can produce a readiness bundle and recommend next owner decisions, but production acceptance remains a separate explicit decision.

**Alternatives considered**:

- Promote UAT success directly to production acceptance. Rejected because acceptance boundaries must remain visible and auditable.
- Require a separate production-candidate Spec Kit package after R-007. Accepted as the likely next step if R-007 passes.

## Decision: Prioritize Negative Security and Visibility Tests

**Rationale**: The highest V1 risks are cross-client leakage, client visibility of internal content, unauthorized approvals, untracked state changes, stale approvals, file exposure, and SLA misattribution.

**Alternatives considered**:

- Rely on happy-path smoke only. Rejected because it cannot prove isolation or deny-by-default behavior.
- Delay security checks until production. Rejected because pilot expansion needs confidence before broader usage.
