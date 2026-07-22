# Implementation Plan: R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution

**Branch**: `[010-r008-controlled-v1-pilot-production-candidate-readiness-execution]` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/spec.md`

## Summary

Create the controlled execution package after R-007 owner readiness acceptance. R-008 starts with planning only and defines the future path for controlled V1 pilot execution, tenant/client isolation proof, security checklist readiness, hosted UAT authorization, client approval hardening, file/final-delivery readiness, audit completeness, SLA reporting, rollback, and owner go/no-go evidence. No code, hosted mutation, deployment, dependency addition, non-Hadna data use, or Production acceptance is authorized by the planning package.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16 App Router, React 19.

**Primary Dependencies**: Existing approved dependencies only: Supabase SSR/client libraries, Zod, Lucide, current UI primitives, Vitest, Testing Library, Playwright, ESLint, and TypeScript. No new dependency is planned.

**Storage**: Supabase PostgreSQL with RLS, Supabase Auth, and Supabase Storage as already approved stack. Hosted mutation remains blocked until a later explicit owner approval names environment, data boundary, mutation type, duration, rollback plan, and evidence rules.

**Testing**: Vitest unit, integration, component, RLS simulator, pgTAP database tests when local Supabase is available, Playwright E2E, `npm run secret:scan`, `git diff --check`, and `npm run build`.

**Target Platform**: Current Sharik web app on Next.js plus local Supabase validation. Hosted UAT, deploy/promote, and Production acceptance are outside the planning package until later owner approval.

**Project Type**: Full-stack modular monolith with Spec Kit documentation, server-side command boundaries, Supabase/PostgreSQL persistence, RLS, and Arabic RTL web UI.

**Performance Goals**: Pilot evidence pages and core pilot surfaces should remain fast enough for owner/reviewer smoke. R-008 does not introduce heavy report generation, large media processing, or new infrastructure.

**Constraints**:

- R-007 is accepted for owner readiness review only.
- R-008 starts planning-first and does not authorize implementation by itself.
- No hosted database mutation, hosted deploy/promote, non-Hadna data use, dependency addition, or Production acceptance is allowed without a later explicit owner approval.
- Do not print credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.
- Preserve tenant/client isolation, deny-by-default authorization, server-side sensitive commands, RLS defense in depth, and append-only auditability.
- Internal comments, internal files, drafts, and management-only navigation must remain hidden from clients.
- Client approval, file/final delivery, SLA, package-affecting changes, and security denials require audit evidence.
- Any new strategic dependency, tenancy model change, RLS model change, SLA calculation change, approval workflow change, or production acceptance semantics requires ADR or owner review before implementation.
- Current working branch may still reflect R-007 uncommitted work; future implementation should use an isolated R-008 branch/worktree before code changes.

**Scale/Scope**: One controlled V1 pilot and production-candidate readiness package spanning management, assigned internal/team, and client portal surfaces. Planning covers future local evidence and potential hosted UAT gates, but hosted action is blocked now.

## Constitution Check

### Pre-Execution Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | R-008 spec and plan are created before implementation. |
| Approved acceptance criteria | PASS | `spec.md` includes prioritized stories, scenarios, requirements, and success criteria. |
| Tenant/client isolation | PASS | Isolation proof is a first-class R-008 gate. |
| Client isolation within tenant | PASS | Requirements include client, internal assigned, and unauthorized persona checks. |
| Deny by default | PASS | Hosted mutation, non-Hadna data, deploy/promote, and Production acceptance are blocked without owner approval. |
| Server-side sensitive commands | PASS | Future sensitive actions remain server-side and audited. |
| RLS defense in depth | PASS | RLS/server authorization evidence is included in the production-candidate checklist. |
| No internal content to client | PASS | Approval, file, comment, and portal readiness requirements keep internal content hidden. |
| Internal approval before client exposure | PASS | Client approval journey hardening retains this rule. |
| Version-aware approvals | PASS | Current-version and stale-version evidence is required. |
| Append-only auditability | PASS | Audit completeness matrix is a required artifact. |
| SLA timeline principles | PASS | SLA reporting readiness requires pause/resume ownership evidence. |
| No secrets in repo/browser | PASS | Redaction rules are repeated in spec, contracts, quickstart, and evidence. |
| No unreviewed dependency | PASS | No new dependency is planned. |
| No social scheduling in V1 | PASS | Social scheduling remains out of scope. |
| Branch/worktree isolation | PASS WITH NOTE | Planning docs can be created now; future code implementation should switch to an isolated R-008 branch/worktree. |

No constitution violation is introduced by planning.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation (this feature)

```text
specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   |-- pilot-execution-boundary.md
|   `-- production-candidate-readiness-contract.md
`-- evidence/
    `-- verification.md
```

### Source Code (future implementation only)

```text
src/
|-- app/
|   |-- (client)/
|   |-- (management)/
|   `-- (platform)/
|-- modules/
|   |-- approvals/
|   |-- audit/
|   |-- authorization/
|   |-- comments/
|   |-- deliverables/
|   |-- files/
|   |-- release/
|   `-- sla/
|-- server/
|   |-- actions/
|   `-- commands/
`-- ui/
    |-- client/
    |-- management/
    `-- release/

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

**Structure Decision**: Continue the existing modular monolith layout. R-008 planning artifacts are created now. Future implementation, if approved, should keep domain rules under `src/modules`, sensitive mutations under `src/server/commands` or server actions, UI under `src/ui` and `src/app`, database/RLS changes under `supabase`, and verification under `tests` plus release evidence docs.

## Phase 1 Design Artifacts

- [data-model.md](./data-model.md)
- [contracts/pilot-execution-boundary.md](./contracts/pilot-execution-boundary.md)
- [contracts/production-candidate-readiness-contract.md](./contracts/production-candidate-readiness-contract.md)
- [quickstart.md](./quickstart.md)

## Post-Execution Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | R-008 planning is bounded to controlled pilot and production-candidate readiness execution. |
| Tenant/client isolation | PASS | Required by spec, data model, contracts, quickstart, and tasks. |
| Hosted mutation boundary | PASS | Hosted mutation is blocked until later explicit owner approval. |
| Non-Hadna data boundary | PASS | Non-Hadna data remains blocked until later explicit owner approval. |
| Audit required | PASS | Audit completeness matrix is required for sensitive success and denial paths. |
| SLA pause/resume | PASS | SLA reporting readiness includes waiting-client and resume evidence. |
| Rollback required | PASS | Rollback plan is a first-class gate before hosted UAT. |
| No new dependency | PASS | Existing dependencies only. |
| Production acceptance separate | PASS | Production acceptance remains a separate explicit owner decision. |

No post-design constitution violation is introduced.

## Agent Context Update

The managed Spec Kit section in `AGENTS.md` should point to `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/plan.md` while R-008 is the active planning package.
