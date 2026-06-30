# Implementation Plan: Internal Online MVP UAT

**Branch**: `codex/internal-online-mvp-uat` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-internal-online-mvp-uat/spec.md`

**Status**: Documentation, gate preparation, Spec Kit prerequisite repair, and a dedicated non-auto-run R-004 synthetic seed are prepared; Vercel Hobby/free and Vercel Production target are owner-approved for hosting only; hosted Supabase migration and hosted seed execution are deferred until a Supabase UAT project exists.

## Summary

This plan prepares the smallest internal online UAT for Sharik after PR #17. The approach is a release/UAT gate, not a product feature: define the owner-approved Vercel Hobby/free deployment path, the Vercel Production target decision, synthetic data policy, hosted Supabase approval gate, smoke/security/UAT checks, evidence capture, and PR review process.

No product source code, dependencies, schema changes, role changes, Kanban, files, comments, approvals, social scheduling, AI, background jobs, Production Supabase, real client data, or Production acceptance are included in this plan. The only SQL addition is a gated synthetic UAT seed file that is not part of automatic local seed execution.

## Technical Context

**Language/Version**: Existing TypeScript and Next.js App Router stack from the repository baseline.

**Primary Dependencies**: Existing dependencies only. No dependency changes are allowed.

**Storage**: Existing Supabase/PostgreSQL schema from merged F-001, F-002, and F-003 context. Hosted non-production migration is gated by explicit owner approval. R-004 synthetic data uses `supabase/seeds/r004_internal_online_mvp_uat.sql` after migration approval and target verification only.

**Testing**: Existing local gates plus hosted smoke/security/UAT evidence after approved hosted setup. Local gates include typecheck, lint, unit, integration, RLS, component, E2E, secret scan, audit high threshold, and build as appropriate.

**Target Platform**: Owner-approved Vercel Hobby/free deployment. Vercel Production target may be used for hosting only; data-backed checks require a later Supabase UAT project.

**Project Type**: Full-stack web application, modular monolith.

**Performance Goals**: Internal UAT deployment should load accepted MVP pages quickly enough for pilot review. No load or Production acceptance target is introduced.

**Constraints**:

- PR #17 must be merged before this work starts.
- Vercel Hobby/free account is allowed by owner decision.
- Vercel Production target is allowed for hosting only and does not mean Production acceptance.
- Synthetic data only.
- No hosted Supabase migration until a Supabase UAT project exists and receives explicit owner approval.
- No deploy before the plan, tasks, quickstart, and data risks are documented.
- No real client data.
- No new dependencies.
- No `RoleKey` changes or standalone `project_manager` role.
- No scope expansion into Kanban, files, comments, approvals, social scheduling, AI, Production Supabase, real data, or Production acceptance.
- Do not merge the UAT PR without review.

**Scale/Scope**: Internal UAT for a small synthetic data set: one Samawah tenant, two or three synthetic clients, a small set of internal and client-role synthetic accounts, contracts, packages, deliverables, and SLA status cases.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | This Spec Kit package is created before hosted operation or UAT execution. |
| Tenant/client isolation | PASS | UAT checks require Client A/B synthetic isolation and denial evidence. |
| Deny by default | PASS | Deployed access and unauthorized denial checks are required; data-backed denial checks wait for Supabase UAT. |
| Server-side sensitive commands | PASS | Hosted migration, seed, and mutations are gated and must be evidenced. |
| RLS defense in depth | PASS | Hosted Supabase migration is blocked until explicit approval and must include RLS evidence. |
| Append-only auditability | PASS | Existing audit-sensitive flows remain in scope for verification only, not new implementation. |
| No new dependency without review | PASS | No dependencies are added. |
| No social scheduling or microservices | PASS | Both are out of scope. |
| No Production Supabase/real data | PASS | Vercel Production target is hosting-only; Production Supabase and real client data are prohibited. |

No constitution violation is introduced.

## Least MVP UAT Scope

The minimum useful UAT is:

1. Owner-approved Vercel Hobby/free deployment.
2. Vercel Production target may be used for hosting only with rollback evidence.
3. Supabase UAT target only after the owner creates a project and gives explicit migration approval.
4. Synthetic data set with Client A and Client B isolation checks after Supabase UAT exists.
5. Accepted existing surfaces only:
   - deployed access and sign-in surface;
   - client management;
   - contracts;
   - packages;
   - deliverables;
   - commercial summaries;
   - SLA MVP summaries and status behavior.
6. Smoke/security/UAT evidence, with data-backed checks blocked while Supabase is deferred.
7. Progress and PR documentation.

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
No product source code or schema migration changes are planned for this branch.
```

### Seed Fixture

```text
supabase/seeds/r004_internal_online_mvp_uat.sql
```

**Structure Decision**: This is a release/UAT Spec Kit package and gated synthetic data preparation. Product source code and migrations stay unchanged unless a later reviewed PR explicitly approves a narrow fix. The R-004 seed is separate from `supabase/seed.sql` and must be executed manually only after H1 approval, target verification, and hosted migration.

## Environment Plan

| Area | Decision | Gate |
|---|---|---|
| Host | Vercel Hobby/free under owner-approved account | Verify `vercel whoami` before deploy |
| Deployment target | Vercel Production target allowed for hosting only | Record owner decision, target, URL, and rollback |
| Protection | If available, Vercel Authentication or approved equivalent; otherwise smoke checks must record public exposure limits | Must be documented before sharing URL |
| Database | Separate future Supabase UAT project | Migration requires project creation and explicit owner approval |
| Data | Synthetic only through `supabase/seeds/r004_internal_online_mvp_uat.sql` | Seed and screenshots must avoid real data |
| Env vars | Vercel deployment env vars must not point to Production Supabase or real data | No Supabase env mutation until Supabase UAT exists |
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

- A Supabase UAT project exists.
- Owner approval explicitly says to run hosted non-production Supabase migration.
- Approval names the target project/ref; the literal `<PROJECT_REF>` placeholder is not valid approval.
- Approval confirms synthetic data only.
- Rollback and evidence commands are ready.

Without H1, hosted migration is `BLOCKED`, not skipped as passed.

### Gate H2 - Vercel Hobby/Production Hosting Deployment

Required before sharing the online URL:

- Correct owner-approved Vercel account is confirmed.
- Deployment target is explicitly recorded; Production target is allowed for hosting only.
- Protection status is recorded. If protection is unavailable on the free account, public exposure limits are documented.
- Env vars do not point to Production Supabase or real client data.
- Rollback command and deployment id are recorded.

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
| Wrong Vercel account | Deployment under wrong owner | `vercel whoami` and project link check | Evidence checklist |
| Vercel Production target mistaken for product acceptance | False release confidence | Label as hosting-only until Supabase/data-backed checks pass | Release evidence |
| Service role exposed | Critical secret leak | Server-only env, secret scan, HTML scan | `npm run secret:scan`, response checks |
| Hosted fixtures enabled | False security confidence | Hosted fixture-disablement smoke | Route guard checks |
| Local evidence misreported as hosted | False acceptance | Separate local vs hosted status fields | Evidence checklist |

## Synthetic Data Boundary

Minimum synthetic data set:

- Tenant: `Samawah UAT`.
- Clients: `Client Alpha UAT`, `Client Beta UAT`, optionally `Client Gamma UAT`.
- Internal users: tenant administrator and account manager for Client Alpha only.
- Client users: approver/viewer for Client Alpha and viewer for Client Beta.
- Contracts/packages: one active synthetic contract and package for Client Alpha, one negative-control set for Client Beta.
- Deliverables/SLA: on track, at risk, overdue, paused waiting client, completed, and cancelled examples.

All emails must use reserved domains such as `.example.test`.

`paused_waiting_internal_decision` remains covered by F-003 domain/unit evidence because the accepted MVP has no persisted SLA segment table. Seeding it as hosted data would require a schema change, which is outside R-004.

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

- Vercel deployment target, account, URL, and rollback path recorded.
- Authorized tester can reach accepted MVP surfaces.
- Hosted fixture actors disabled.
- R-004 synthetic seed applied only after Supabase UAT exists and is approved, using approved `psql` or Supabase SQL Editor with `supabase/seeds/r004_internal_online_mvp_uat.sql`; secret connection values are not printed or committed.
- Client A cannot see Client B data only after hosted synthetic data exists.
- Client user cannot reach management-only surfaces only after hosted synthetic users exist.
- Management-scoped SLA summaries show synthetic statuses only after hosted synthetic data exists.
- Browser response does not expose service role or secret values.
- Vercel Production target, if used, is recorded as hosting-only and not Production acceptance.

## Rollback Plan

1. Remove or disable the Vercel deployment by id.
2. Remove deployment env vars if the deployment is retired.
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
| No Production Supabase or real data | PASS | Vercel Production target is hosting-only; Production Supabase and real data are prohibited. |
| Review before merge | PASS | PR must remain open for review. |

Hosted execution remains gated and cannot be marked complete without explicit approval and evidence.
