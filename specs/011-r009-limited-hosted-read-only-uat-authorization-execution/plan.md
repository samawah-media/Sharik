# Implementation Plan: R-009 Limited Hosted Read-Only UAT Authorization & Execution

**Branch**: `[011-r009-limited-hosted-read-only-uat-authorization-execution]` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/spec.md`

## Summary

Create the authorization-first R-009 package after the owner accepts R-008 local readiness only. R-009 defines a limited hosted read-only UAT path, but execution remains blocked until the owner approval record is complete inside this package. The plan defines hosted target requirements, allowed read-only checks, forbidden actions, credential handling, evidence redaction, no-op proof, route/persona smoke categories, tenant/client isolation checks, and post-execution evidence scaffolds. No hosted checks, hosted DB mutation, deploy/promote action, non-Hadna data use, dependency change, product code change, or Production acceptance is authorized by this planning package.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16 App Router, React 19 for the existing app. R-009 planning itself is documentation/evidence only.

**Primary Dependencies**: Existing approved dependencies only. No new dependency is planned or allowed for R-009 planning.

**Storage**: Existing Supabase PostgreSQL with RLS, Supabase Auth, and Supabase Storage remain unchanged. No hosted database mutation, migration, seed, import, storage upload/delete, or mutating RPC is allowed.

**Testing**: Planning validation uses document review, redaction scans, and package consistency checks. Owner approval is recorded for a limited read-only start pass; Phase 5 hosted route/persona inspection partially executed in read-only mode and Phase 6 isolation remains blocked until Phase 5 fully passes safely.

**Target Platform**: Existing hosted Sharik/Samawah web app target only if later approved by owner. The target must already exist and must not require deploy, promotion, alias change, configuration change, or account creation.

**Project Type**: Full-stack modular monolith with Spec Kit documentation, server-side command boundaries, Supabase/PostgreSQL persistence, RLS, and Arabic RTL web UI.

**Performance Goals**: Read-only hosted smoke should be short and bounded after approval. R-009 planning targets a limited route/persona pass that an owner can review without customer content.

**Constraints**:

- R-008 is accepted as local readiness only.
- R-008 is not Production acceptance.
- R-009 package creation started planning-only.
- No hosted read-only checks may run outside the explicit owner approval recorded in R-009.
- No hosted insert, update, delete, direct data repair, seed/import, migration, or mutating RPC.
- No file upload, delete, visibility mutation, download, or opening file content.
- No account creation, invitation, role change, membership change, password reset, or credential recording.
- No deploy, promotion, alias change, environment variable change, scheduled job, or hosted configuration change.
- No non-Hadna data use unless separately approved.
- No credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, secret values, or file contents in evidence.
- No Production acceptance.
- Preserve tenant/client isolation, deny-by-default authorization, no internal content to client, version-aware approvals, auditability, and SLA waiting-client rules.

**Scale/Scope**: One limited hosted read-only UAT planning package covering owner approval, target readiness, route/persona smoke, read-only tenant/client isolation checks, no-op proof, evidence redaction, and owner decision output.

## Constitution Check

### Pre-Execution Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | R-009 spec and plan are created before any execution or code change. |
| Approved acceptance criteria | PASS | `spec.md` includes user stories, acceptance scenarios, requirements, and success criteria. |
| Tenant/client isolation | PASS | Read-only isolation checks are a first-class R-009 story and contract. |
| Client isolation within tenant | PASS | Persona categories include client viewer, client approver, assigned internal, and unassigned/unauthorized categories. |
| Deny by default | PASS | No hosted execution can start without complete owner approval. |
| Server-side sensitive commands | PASS | Sensitive commands are not invoked in R-009 read-only scope. |
| RLS defense in depth | PASS | R-009 does not alter RLS and only plans hosted read-only inspection. |
| No internal content to client | PASS | Evidence and smoke categories forbid internal content exposure. |
| Internal approval before client exposure | PASS | R-009 does not submit client exposure or approval actions. |
| Version-aware approvals | PASS | Approval controls may be inspected only for visibility, not activated. |
| Append-only auditability | PASS | No audit mutation is expected because no hosted state change is allowed. |
| SLA timeline principles | PASS | SLA summaries may be inspected read-only using safe categories/counts. |
| No secrets in repo/browser | PASS | Evidence redaction and credential handling rules are explicit. |
| No unreviewed dependency | PASS | No dependency change is planned. |
| No social scheduling in V1 | PASS | Social scheduling remains out of scope. |
| Branch/worktree isolation | PASS WITH NOTE | Planning docs are created in the current worktree; future code or execution changes need their own approval boundary. |

No constitution violation is introduced by planning.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation (this feature)

```text
specs/011-r009-limited-hosted-read-only-uat-authorization-execution/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   |-- hosted-read-only-uat-boundary.md
|   |-- evidence-redaction-and-noop-proof.md
|   `-- route-persona-smoke-contract.md
`-- evidence/
    |-- verification.md
    |-- owner-approval-record.md
    |-- hosted-target-requirements.md
    |-- allowed-read-only-checks.md
    |-- forbidden-actions.md
    |-- redaction-rules.md
    |-- no-op-rollback-proof.md
    |-- route-persona-smoke-categories.md
    |-- read-only-isolation-checks.md
    `-- execution-log.md
```

### Source Code

```text
No source code changes are planned or authorized by R-009 package creation.

Future read-only execution, if approved, should use existing app routes and existing test/browser tooling only.
Any product code, dependency, database, RLS, storage, or deployment change requires separate approval and likely a separate package.
```

**Structure Decision**: R-009 is a documentation, authorization, and evidence package. It does not introduce application modules, migrations, dependencies, or hosted configuration changes.

## Phase 1 Design Artifacts

- [data-model.md](./data-model.md)
- [contracts/hosted-read-only-uat-boundary.md](./contracts/hosted-read-only-uat-boundary.md)
- [contracts/evidence-redaction-and-noop-proof.md](./contracts/evidence-redaction-and-noop-proof.md)
- [contracts/route-persona-smoke-contract.md](./contracts/route-persona-smoke-contract.md)
- [quickstart.md](./quickstart.md)

## Post-Execution Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | R-009 planning is bounded to limited hosted read-only UAT authorization and execution planning. |
| Tenant/client isolation | PASS | Required by spec, data model, contracts, tasks, and evidence scaffolds. |
| Hosted mutation boundary | PASS | Hosted mutation is forbidden. |
| Hosted execution boundary | OWNER-DEFERRED | Owner approval is recorded; Phase 5 route/persona smoke was burned down read-only and unavailable credential/route categories remain outside R-009 hosted read-only completion. |
| Non-Hadna data boundary | PASS | Non-Hadna data remains blocked unless separately approved. |
| Evidence redaction | PASS | Evidence rules prohibit sensitive values and customer content. |
| No-op proof | PASS | No-op and stop-condition proof is a first-class evidence artifact. |
| No new dependency | PASS | Existing dependencies only. |
| Production acceptance separate | PASS | Production acceptance remains a separate explicit owner decision. |

No post-design constitution violation is introduced.

## Agent Context Update

The managed Spec Kit section in `AGENTS.md` should point to `specs/011-r009-limited-hosted-read-only-uat-authorization-execution/plan.md` while R-009 is the active planning package.
