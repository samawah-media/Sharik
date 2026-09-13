# Implementation Plan: R-007 V1 Owner Pilot Expansion and Acceptance-to-Production Readiness

**Branch**: `[009-r007-v1-owner-pilot-expansion-readiness]` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-r007-v1-owner-pilot-expansion-readiness/spec.md`

## Summary

Create the next V1 readiness workstream after R-006 owner-accepted internal UAT. R-007 defines and then implements the minimum evidence-backed path from Hadna-only MVP evaluation toward broader owner pilot expansion and production-candidate readiness. The work focuses on the V1 core operating loop: deliverables, SLA, internal approvals, client approvals, files, permissions, audit logs, and client portal readiness. R-006 is treated as the accepted baseline, not as an open bugfix phase.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16 App Router, React 19.

**Primary Dependencies**: Existing approved dependencies only: Supabase SSR/client libraries, Zod, Lucide, current UI primitives, Vitest, Testing Library, Playwright, ESLint, TypeScript. No new dependency is planned for R-007 without separate review.

**Storage**: Supabase PostgreSQL with RLS, Supabase Auth, and future Supabase Storage use for file readiness. Hosted mutation remains blocked until a new explicit owner approval and task-level scope authorize it.

**Testing**: Vitest unit, integration, component, RLS simulator, pgTAP database tests, Playwright E2E, `npm run secret:scan`, `git diff --check`, `npm run build`.

**Target Platform**: Current Sharik web app on Next.js plus Supabase local/UAT environments. Production acceptance is explicitly outside this package unless a later owner decision creates a separate production-candidate gate.

**Project Type**: Full-stack modular monolith with Spec Kit documentation, server-side command boundaries, Supabase/PostgreSQL persistence, and Arabic RTL web UI.

**Performance Goals**: Readiness pages and core pilot surfaces should remain fast enough for owner and role smoke review; no heavy report generation or large media processing is in scope. User-facing pilot navigation should load within ordinary web expectations during smoke.

**Constraints**:

- R-006 is accepted for Hadna-only internal UAT and must not be reopened as an active bugfix phase.
- No production acceptance is granted by R-007 planning or implementation.
- Do not use non-Hadna customer data unless a new explicit owner approval and Spec Kit scope authorize it.
- Do not mutate a hosted database unless a new explicit owner approval and task-level scope authorize it.
- Do not print credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.
- Preserve tenant/client isolation, deny-by-default authorization, and server-side sensitive commands.
- Internal comments, internal files, drafts, and management-only navigation must remain hidden from clients.
- Approval, SLA, package, file visibility, and delivery state changes require audit evidence.
- Any new strategic dependency, tenancy model change, RLS model change, SLA calculation change, or approval workflow change requires ADR review before implementation.

**Scale/Scope**: One V1 readiness package spanning management, account/team, and client portal pilot surfaces. The package may prepare broader pilot gates but may only execute within explicitly authorized internal UAT boundaries.

## Constitution Check

### Pre-Execution Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | R-007 spec, plan, and tasks are created before code. |
| Approved acceptance criteria | PASS | `spec.md` includes prioritized stories, scenarios, requirements, and success criteria. |
| Tenant/client isolation | PASS | Isolation is a first-class requirement and test task. |
| Deny by default | PASS | Missing owner approval blocks hosted mutation, non-Hadna data, and production acceptance. |
| Server-side sensitive commands | PASS | Planned approval, SLA, delivery, file visibility, and package-affecting changes stay server-side. |
| RLS defense in depth | PASS | RLS and server authorization are planned for all scoped data paths. |
| No internal content to client | PASS | Client portal readiness includes internal comment/file hiding. |
| Internal approval before client exposure | PASS | Explicit acceptance scenarios and task coverage included. |
| Version-aware approvals | PASS | Approval decisions are bound to deliverable versions in the spec and data model. |
| Append-only auditability | PASS | Audit evidence is mandatory for sensitive transitions and denials. |
| SLA timeline principles | PASS | SLA pause/resume is planned as timeline evidence, not manual counters. |
| No secrets in repo/browser | PASS | Evidence boundaries explicitly forbid sensitive values. |
| No unreviewed dependency | PASS | Existing dependencies only unless ADR/review is added. |
| No social scheduling in V1 | PASS | Social publishing/scheduling remains out of scope. |

No constitution violation is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation (this feature)

```text
specs/009-r007-v1-owner-pilot-expansion-readiness/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
`-- contracts/
    |-- readiness-boundary.md
    `-- v1-workflow-contract.md
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- (client)/
|   `-- (management)/
|-- modules/
|   |-- approvals/
|   |-- audit/
|   |-- authorization/
|   |-- comments/
|   |-- deliverables/
|   |-- files/
|   |-- packages/
|   `-- sla/
|-- server/
|   |-- actions/
|   `-- commands/
`-- ui/
    |-- client/
    `-- management/

supabase/
|-- migrations/
`-- tests/database/

tests/
|-- unit/
|-- integration/
|-- component/
|-- rls/
`-- e2e/

docs/08-release/
```

**Structure Decision**: Continue the existing modular monolith layout. Domain rules live under `src/modules`, sensitive mutations under `src/server/commands` or server actions, UI under `src/ui` and `src/app`, database/RLS changes under `supabase`, and verification under `tests` plus release evidence docs.

## Phase 1 Design Artifacts

- [data-model.md](./data-model.md)
- [contracts/readiness-boundary.md](./contracts/readiness-boundary.md)
- [contracts/v1-workflow-contract.md](./contracts/v1-workflow-contract.md)
- [quickstart.md](./quickstart.md)

## Post-Execution Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | R-007 is bounded to V1 readiness core and excludes production acceptance. |
| Tenant/client isolation | PASS | Required by spec, data model, contracts, and tasks. |
| Audit required | PASS | Audit events are required for approvals, SLA, files, delivery, package-affecting changes, and denials. |
| SLA pause/resume | PASS | Planned with timeline segments and tests. |
| No new dependency | PASS | Existing dependencies only. |
| Review before merge | PASS | Tasks require evidence bundle and owner decision gate. |

No post-design constitution violation is introduced.
