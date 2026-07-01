# Implementation Plan: R-005 Internal Online Trial Readiness

**Branch**: `codex/r-005-internal-online-trial-readiness` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-internal-online-trial-readiness/spec.md`

## Summary

Prepare a staging-only internal online trial package after PR #26, using the current application state with no product expansion. The work creates a Spec Kit package, a guarded R-005 synthetic seed, a UAT checklist, release/readiness documentation, and verification evidence. The named hosted staging target is `sharik-internal-trial-staging`; no Production Supabase, real client data, public signup, broad permissions, committed passwords, or new product features are allowed.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React, Supabase/PostgreSQL SQL seed artifacts.

**Primary Dependencies**: Existing dependencies only: Next.js, TypeScript, Supabase client, Zod, React, Lucide, Vitest, Testing Library, Playwright.

**Storage**: Existing Supabase/PostgreSQL schema from migrations through F-004. R-005 adds a seed file only; no schema migration is planned.

**Testing**: Existing required commands: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:rls`, `npm run test:component`, `npm run test:e2e`, `npm run secret:scan`, and `npm run build`.

**Target Platform**: Hosted staging only, named `sharik-internal-trial-staging`, plus local verification before PR.

**Project Type**: Full-stack modular monolith with release-readiness documentation and seed data preparation.

**Performance Goals**: Seeded internal trial surfaces load with 5-8 deliverables and two clients without adding new runtime work or dependencies.

**Constraints**:

- Spec before code.
- PR #26 must be merged first.
- No Production Supabase and no real client data.
- No public signup, open permissions, or broad role access.
- No committed or printed temporary passwords.
- No product feature additions: no AI, social scheduling, billing, drag/drop, files, comments, or full approval workflow.
- No new dependency and no ADR required because no technology change is introduced.
- All staged data must be synthetic and use `@r005.example.test`.

**Scale/Scope**: One internal staging trial tenant, two synthetic clients, two contracts, two packages, 5-8 deliverables, and three login personas.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | This package precedes seed/docs changes. |
| Tenant/client isolation | PASS | Seed includes two clients and UAT checks for client viewer board denial. |
| Deny by default | PASS | Docs require no public signup and no broad permissions. |
| Server-side sensitive commands | PASS | Existing status transition command is reused; no new client-side write path is added. |
| RLS defense in depth | PASS | Existing RLS tests remain required; no schema/RLS broadening is planned. |
| No internal content to client | PASS | UAT checks deny client viewer access to the internal board. |
| Append-only auditability | PASS | UAT checks require audit log evidence for allowed and denied status transitions. |
| SLA timeline principles | PASS | UAT checks include SLA display and paused waiting client state. |
| No secrets in repo/browser | PASS | Seed has no passwords; credential delivery is outside GitHub. |
| No unreviewed dependency | PASS | No dependency is added. |
| No social scheduling in V1 | PASS | Explicitly out of scope. |

No constitution violation is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation

```text
specs/006-internal-online-trial-readiness/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- internal-trial-uat.md
`-- evidence/
    `-- verification.md

docs/08-release/
`-- R-005-internal-online-trial-readiness.md
```

### Source Code

```text
supabase/seeds/
`-- r005_internal_online_trial_readiness.sql

tests/unit/seeds/
`-- r005-synthetic-seed.test.ts

scripts/
`-- secret-scan.mjs
```

**Structure Decision**: R-005 is readiness work, not a product feature. The only executable artifact is the synthetic seed and a unit-level policy check for that seed. No application route, schema migration, dependency, drag/drop, file/comment, approval, AI, social scheduling, or billing implementation is added.

## Design Decisions

| Decision | Rationale | Alternatives |
|---|---|---|
| Use a new `r005` seed instead of mutating R-004 | Keeps the closed R-004 evidence immutable and ensures the new trial can refuse old targets. | Reuse R-004 seed; rejected because R-005 requires `Samawah Demo`, `@r005.example.test`, and Kanban-after-PR-26 coverage. |
| Keep password values out of the seed | Avoids committed or logged credentials. | Seed password hashes; rejected by user constraints and security policy. |
| Require out-of-GitHub credential delivery | Lets the project owner receive temporary credentials without exposing them in PRs, logs, or screenshots. | Put temp passwords in docs or comments; rejected. |
| Add seed policy unit test | Ensures required synthetic constraints remain reviewable in CI/local checks. | Rely on manual review only; rejected because the seed is security-sensitive. |
| No new schema migration | R-005 uses current accepted surfaces after PR #26. | Add staging metadata tables; rejected as feature expansion. |

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | Only docs, seed, seed policy test, and secret scan coverage are changed. |
| Tenant/client isolation | PASS | Synthetic Client Alpha/Beta fixtures and checklist include isolation checks. |
| Audit required | PASS | Checklist requires allowed and denied transition audit evidence. |
| SLA pause/resume | PASS | Seed includes waiting-client and due-date variations for SLA display. |
| No new dependency | PASS | Package manifests are unchanged. |
| Review before merge | PASS | PR creation only; no merge by agent. |
