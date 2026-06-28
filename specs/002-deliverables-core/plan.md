# Implementation Plan: Deliverables Core

**Branch**: `002-deliverables-core` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-deliverables-core/spec.md`

## Summary

F-002 establishes Cycle 2 commercial and deliverable start foundations: authorized management users can create client-scoped contracts, packages, package lines, agreed deliverables, and reservation ledger entries. The technical approach extends the existing Next.js App Router modular monolith and Supabase/PostgreSQL data model with server-side sensitive commands, explicit tenant/client authorization, RLS defense in depth, append-only package ledger semantics, and Arabic RTL management/client-safe summaries.

Implementation starts from the design artifacts in this directory and is sliced through `tasks.md`. Hosted migrations and production Supabase changes remain out of scope unless explicitly approved later.

## Technical Context

**Language/Version**: TypeScript with Next.js App Router, following the repository versions pinned in `package.json`.

**Primary Dependencies**: Existing stack only: Next.js, React, TypeScript, Supabase Auth/PostgreSQL, Zod, Testing Library, Vitest, Playwright, Tailwind CSS, Lucide Icons. No dependency changes are planned for F-002.

**Storage**: Supabase PostgreSQL using the existing shared database/shared schema multitenancy model. New conceptual tables are contracts, contract versions/amendments, packages, package lines, deliverables, deliverable allocations, package ledger entries, and audit events.

**Testing**: Vitest for domain/unit and integration tests, pgTAP/Supabase local tests for RLS and append-only ledger behavior, Testing Library for component surfaces, Playwright for E2E/mobile/RTL flows, and the existing secret scan/audit gates.

**Target Platform**: Web SaaS, Arabic RTL by default, desktop management console with mobile-safe client summary views.

**Project Type**: Full-stack web application, modular monolith.

**Naming and Workspace Standard**: Use official English product spelling `Sharik` and package slug `sharik-platform`. Active feature worktrees should use `D:\code - projects\sharik-worktrees\` after local dirty legacy checkouts are safely retired; see `docs/07-spec-driven-delivery/worktree-and-branching-standard.md`.

**Performance Goals**: Pilot-scale contract/package/deliverable list and summary interactions should feel responsive, with clear loading/empty states. Balance projections must be derived deterministically from ledger entries under ordinary pilot data sizes.

**Constraints**: No client-trusted `tenant_id`, `client_id`, contract id, package id, or deliverable id. Deny by default. Server-side sensitive commands. RLS defense in depth. Append-only ledger and audit. No mutable package balance counter as source of truth. No production Supabase or real client data in implementation or verification.

**Scale/Scope**: One tenant initially, multiple clients, multiple contracts/packages per client when service streams require it, tens to low hundreds of deliverables during pilot. Feature covers VS-002 and VS-003 only.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | `spec.md` exists for F-002 before implementation. |
| Approved acceptance criteria | PASS | Spec defines 10 acceptance scenarios and measurable success criteria. |
| Tenant/client isolation | PASS | Every contract/package/deliverable/ledger path is tenant/client scoped. |
| Deny by default and least privilege | PASS | Permissions and deny cases are explicit in the spec. |
| Server-side sensitive commands | PASS | Contract/package/deliverable/ledger mutations are sensitive command candidates. |
| RLS defense in depth | PASS | Plan keeps RLS plus command authorization; RLS is not the only guard. |
| Append-only auditability | PASS | Audit and ledger entries are append-only by requirement. |
| Ledger-based package accounting | PASS | Package balances derive from ledger entries, not mutable counters. |
| Idempotent sensitive operations | PASS | Reservations, releases, adjustments, and approved extras require retry safety. |
| Accessibility and RTL | PASS | Arabic RTL, mobile-safe summaries, keyboard/focus expectations included. |
| No new dependency without review | PASS | No dependencies are added in this planning phase. |
| No social scheduling/microservices | PASS | Both remain out of scope. |

No constitution violation requires complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-deliverables-core/
|-- spec.md
|-- checklists/
|   `-- requirements.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
`-- contracts/
    `-- operations.md
```

`tasks.md` is not created by `/speckit-plan`; it is created by the tasks workflow.

### Source Code (planned implementation targets)

```text
src/
|-- modules/
|   |-- contracts/
|   |-- packages/
|   |-- deliverables/
|   |-- ledger/
|   |-- authorization/
|   `-- audit/
|-- server/
|   |-- actions/
|   |-- commands/
|   |   |-- contracts/
|   |   |-- packages/
|   |   `-- deliverables/
|   `-- navigation/
|-- ui/
|   |-- management/
|   |-- client/
|   `-- copy/ar-SA/
`-- app/
    |-- (management)/
    `-- (client)/

supabase/
|-- migrations/
`-- tests/database/

tests/
|-- unit/
|-- integration/
|-- rls/
|-- component/
`-- e2e/
```

**Structure Decision**: extend the existing modular monolith. Domain modules hold pure rules and projections; server commands own sensitive mutations; UI surfaces call existing server-side patterns; database migrations and RLS tests are added only during implementation after task approval.

## Modules Affected

- Contract Domain: contract identity, period, status, and client-scoped summary rules.
- Package Domain: packages, package lines, and commitment adjustments.
- Package Ledger: append-only commitment, reservation, release, adjustment, and future consumption event model.
- Deliverable Domain: deliverable creation, status/progress derivation, allocation, approved extra path, and not-started cancellation.
- Authorization: new permission IDs and scope checks for contract/package/deliverable/ledger commands.
- Audit: new sensitive action names and denial events.
- Management UI: Arabic RTL contract/package/deliverable creation and summaries.
- Client UI: safe contract/package/deliverable summaries only.

## Data and Authorization Boundary

Every read or command resolves:

1. authenticated user identity;
2. active tenant membership;
3. management/client/internal assignment scope;
4. target client ownership;
5. requested permission;
6. contract/package/deliverable state;
7. package capacity and ledger invariants;
8. idempotency/concurrency guard;
9. audit and ledger event requirement.

Client users never receive tenant-wide commercial lists or internal ledger/audit detail.

## Ledger Strategy

Package balance is a projection:

```text
available = committed - reserved - consumed + released +/- adjustments
```

This projection is derived from ledger entries. The source of truth is the append-only ledger, not a manually edited balance field. F-002 writes commitment and reservation/release events only. Delivery consumption is deferred.

## Transaction Strategy

Implementation should use transaction boundaries for:

- create contract + audit;
- create package/package line + commitment ledger + audit;
- adjust package commitment + ledger adjustment/amendment + audit;
- create in-package deliverable + allocation + reservation ledger + audit;
- create approved extra deliverable + explicit approval/audit + no automatic reservation;
- cancel eligible not-started deliverable + reservation release + audit.

If the audit or ledger entry cannot be written for a sensitive mutation, the command should fail closed.

## RLS and Supabase Notes

Supabase platform changes make explicit table grants part of the migration design for exposed tables. RLS remains required for exposed schemas, and server-side authorization remains mandatory for sensitive commands. If implementation uses privileged database functions for atomic ledger/audit writes, they must include explicit actor and scope checks, restricted execution grants, and reviewed search paths.

References reviewed:

- Supabase changelog: breaking change for explicit Data API/GraphQL grants on tables.
- Supabase RLS docs: RLS as defense in depth.
- Supabase database functions docs: functions can encapsulate database operations but require careful grants and security review.

## Test Strategy

Unit/domain:

- package balance projection;
- capacity checks and overage denial;
- deliverable initial status/progress mapping;
- approved extra rules;
- cancellation eligibility and idempotency.

Integration:

- create contract/package/package lines;
- create deliverable with reservation;
- insufficient-capacity denial;
- approved extra creation;
- cancellation release;
- audit and ledger transaction failure behavior.

RLS/database:

- Client A cannot read Client B contracts, packages, ledger rows, or deliverables;
- client users see safe summaries only;
- ledger entries are append-only;
- direct write surfaces do not bypass server command invariants.

Component/E2E:

- Arabic RTL forms and summaries;
- insufficient capacity recovery paths;
- management vs client summary visibility;
- direct URL/resource tampering denial.

## Rollback and Recovery Considerations

- Bad package commitment changes are corrected through explicit adjustment/amendment entries.
- Bad deliverable reservations are released only through an eligible cancellation or later change-control workflow.
- Approved extras remain auditable and do not silently affect package balances.
- No hard delete of contracts, packages, deliverables, ledger entries, or audit records is planned for V1.

## Known Risks

- Combining contract/package setup and deliverable reservation can grow too large; tasks should slice VS-002 before VS-003 if needed.
- Package ledger design can overbuild; F-002 should limit entries to commitment, reservation, release, and adjustment.
- SLA date capture can drift into full SLA processing; SLA timeline work remains deferred.
- Client-facing summaries must be aggressively filtered to avoid internal ledger/audit leakage.

## Deferred Work

- Final delivery and quantity consumption.
- Full SLA timeline, pause/resume, at-risk/overdue jobs, and client-waiting calculations.
- Kanban, task assignment, files, comments, internal review, internal approval, client approval.
- Billing, invoicing, payment collection, VAT/tax, advanced commercial reporting.
- Carry-forward, expiration, partial delivery, reopen/reversal policy unless owner-approved later.
- Production Supabase migration and real client data.

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | F-002 covers VS-002/VS-003 and excludes later workflow features. |
| Tenant/client isolation | PASS | Data model and contracts require scope on every entity/operation. |
| Server-side sensitive commands | PASS | All mutations are server-command candidates. |
| RLS defense in depth | PASS | RLS plus command authorization is preserved. |
| Append-only audit and ledger | PASS | Ledger and audit rules are central to the design. |
| Idempotency | PASS | Sensitive retries are explicitly planned. |
| RTL/accessibility/mobile | PASS | Quickstart includes Arabic RTL/mobile-safe validation scenarios. |
| ADR alignment | PASS | Modular monolith, Supabase/PostgreSQL, RLS+server auth, audit/ledger architecture preserved. |

No unresolved `NEEDS CLARIFICATION` remains for planning.
