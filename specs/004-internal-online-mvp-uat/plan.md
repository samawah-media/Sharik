# Implementation Plan: Internal Online MVP UAT

**Branch**: `codex/internal-online-mvp-uat` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-internal-online-mvp-uat/spec.md`

**Status**: Documentation and gate preparation complete in this branch; hosted Supabase migration and hosted UAT execution require explicit owner approval before running.

## Summary

This plan prepares the smallest protected internal online UAT for Sharik after PR #17. The approach is a release/UAT gate, not a product feature: define the non-production environment, synthetic data policy, hosted migration approval gate, protected Preview deployment expectations, smoke/security/UAT checks, evidence capture, and PR review process.

No code, dependencies, schema changes, role changes, Kanban, files, comments, approvals, social scheduling, AI, background jobs, Production deployment, Production Supabase, or real client data are included in this plan.

## Technical Context

**Language/Version**: Existing TypeScript and Next.js App Router stack from the repository baseline.

**Primary Dependencies**: Existing dependencies only. No dependency changes are allowed.

**Storage**: Existing Supabase/PostgreSQL schema from merged F-001, F-002, and F-003 context. Hosted non-production migration is gated by explicit owner approval.

**Testing**: Existing local gates plus hosted smoke/security/UAT evidence after approved hosted setup. Local gates include typecheck, lint, unit, integration, RLS, component, E2E, secret scan, audit high threshold, and build as appropriate.

**Target Platform**: Protected Vercel Preview or approved equivalent, backed only by non-production Supabase when explicitly approved.

**Project Type**: Full-stack web application, modular monolith.

**Performance Goals**: Internal UAT preview should load accepted MVP pages quickly enough for pilot review. No load or Production performance target is introduced.

**Constraints**:

- PR #17 must be merged before this work starts.
- Non-production only.
- Synthetic data only.
- No hosted Supabase migration without explicit owner approval.
- No deploy before the plan, tasks, quickstart, and data risks are documented.
- No real client data.
- No new dependencies.
- No `RoleKey` changes or standalone `project_manager` role.
- No scope expansion into Kanban, files, comments, approvals, social scheduling, AI, or Production.
- Do not merge the UAT PR without review.

**Scale/Scope**: Internal UAT for a small synthetic data set: one Samawah tenant, two or three synthetic clients, a small set of internal and client-role synthetic accounts, contracts, packages, deliverables, and SLA status cases.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | This Spec Kit package is created before hosted operation or UAT execution. |
| Tenant/client isolation | PASS | UAT checks require Client A/B synthetic isolation and denial evidence. |
| Deny by default | PASS | Protected Preview and unauthorized denial checks are required. |
| Server-side sensitive commands | PASS | Hosted migration, seed, and mutations are gated and must be evidenced. |
| RLS defense in depth | PASS | Hosted Supabase migration is blocked until explicit approval and must include RLS evidence. |
| Append-only auditability | PASS | Existing audit-sensitive flows remain in scope for verification only, not new implementation. |
| No new dependency without review | PASS | No dependencies are added. |
| No social scheduling or microservices | PASS | Both are out of scope. |
| No Production/real data | PASS | Production and real client data are prohibited. |

No constitution violation is introduced.

## Least MVP UAT Scope

The minimum useful UAT is:

1. Protected Preview deployment.
2. Non-production Supabase target only after explicit migration approval.
3. Synthetic data set with Client A and Client B isolation checks.
4. Accepted existing surfaces only:
   - sign-in/protected access;
   - client management;
   - contracts;
   - packages;
   - deliverables;
   - commercial summaries;
   - SLA MVP summaries and status behavior.
5. Smoke/security/UAT evidence.
6. Progress and PR documentation.

Anything outside this list is deferred.

## Project Structure

### Documentation (this feature)

```text
specs/004-internal-online-mvp-uat/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- uat-gates.md
`-- evidence/
    `-- uat-evidence-checklist.md
```

### Source Code

```text
No source code changes are planned for this branch.
```

**Structure Decision**: This is a release/UAT Spec Kit package and documentation update. Product source code and migrations stay unchanged unless a later reviewed PR explicitly approves a narrow fix.

## Environment Plan

| Area | Decision | Gate |
|---|---|---|
| Host | Vercel Preview under approved Sharik/Samawah scope | Verify account/scope before deploy |
| Protection | Vercel Authentication or approved equivalent | Must be enabled before sharing URL |
| Database | Separate non-production Supabase project | Migration requires explicit owner approval |
| Data | Synthetic only | Seed and screenshots must avoid real data |
| Env vars | Preview/staging scoped only | No Production env mutation |
| Service role | Server-only secret | Never printed or committed |
| Rollback | Remove deployment and optionally retire non-production data | Record deployment id/project ref |

## Hosted Operation Gates

### Gate H0 - Documentation

Required before any hosted operation:

- Spec, plan, tasks, quickstart, and evidence checklist exist.
- Data risks and rollback are documented.
- PR #17 merge is verified.
- UAT branch is isolated.

### Gate H1 - Hosted Supabase Approval

Required before hosted non-production migration:

- Owner approval explicitly says to run hosted non-production Supabase migration.
- Approval names or confirms the target project/ref.
- Approval confirms synthetic data only.
- Rollback and evidence commands are ready.

Without H1, hosted migration is `BLOCKED`, not skipped as passed.

### Gate H2 - Protected Preview Deployment

Required before sharing the online URL:

- Correct Vercel account/scope is confirmed.
- Deployment target is Preview, not Production.
- Protection is enabled.
- Production env vars are not touched.
- Preview env vars point only to non-production resources.

### Gate H3 - Smoke, Security, And UAT Evidence

Required before PR review can consider this UAT gate ready:

- Smoke checks pass or blockers are documented.
- Security checks pass or blockers are documented.
- UAT checks pass only for hosted checks that were actually run.
- `docs/PROJECT_PROGRESS.md` is updated with results and blockers.

## Data Risk Plan

| Risk | Impact | Control | Evidence |
|---|---|---|---|
| Real client data used in UAT | Critical trust breach | Synthetic-only seed and screenshots | Seed manifest review |
| Production Supabase used accidentally | Critical environment breach | Project ref confirmation before migration | CLI/project evidence without secrets |
| Wrong Vercel account/scope | Preview under wrong owner | `vercel whoami` and project scope check | Evidence checklist |
| Service role exposed | Critical secret leak | Server-only env, secret scan, HTML scan | `npm run secret:scan`, response checks |
| Hosted fixtures enabled | False security confidence | Hosted fixture-disablement smoke | Route guard checks |
| Local evidence misreported as hosted | False acceptance | Separate local vs hosted status fields | Evidence checklist |

## Synthetic Data Boundary

Minimum synthetic data set:

- Tenant: `Samawah UAT`.
- Clients: `Client Alpha UAT`, `Client Beta UAT`, optionally `Client Gamma UAT`.
- Internal users: tenant admin, marketing manager, account manager for Client Alpha only.
- Client users: approver/viewer for Client Alpha and viewer for Client Beta.
- Contracts/packages: one active synthetic contract and package for Client Alpha, one negative-control set for Client Beta.
- Deliverables/SLA: on track, at risk, overdue, paused waiting client, paused waiting internal decision, completed, and cancelled examples.

All emails must use reserved domains such as `.example.test`.

## Verification Plan

Local before PR:

- `git diff --check`
- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:rls`
- `npm run test:component`
- `npm run test:e2e`
- `npm run secret:scan`
- `npm audit --audit-level=high`
- `npm run build`

Hosted after explicit approval:

- Protected Preview unauthenticated access blocked.
- Authorized tester can reach accepted MVP surfaces.
- Hosted fixture actors disabled.
- Client A cannot see Client B data.
- Client user cannot reach management-only surfaces.
- Management-scoped SLA summaries show synthetic statuses.
- Browser response does not expose service role or secret values.
- Production target/env not mutated.

## Rollback Plan

1. Remove or disable the Preview deployment by id.
2. Remove Preview-only env vars if the preview is retired.
3. Do not delete the non-production Supabase project without owner approval.
4. If hosted migration was applied and rollback is required, apply an approved reversal plan or recreate the synthetic non-production project.
5. Record rollback result in `docs/PROJECT_PROGRESS.md` and the evidence checklist.

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | Product scope is frozen to accepted MVP surfaces. |
| Tenant/client isolation | PASS | Client A/B checks are required. |
| No secrets in repo/browser | PASS | Secret scan and browser response checks are required. |
| No unreviewed dependency | PASS | No dependencies are added. |
| No Production data | PASS | Production and real data are prohibited. |
| Review before merge | PASS | PR must remain open for review. |

Hosted execution remains gated and cannot be marked complete without explicit approval and evidence.
