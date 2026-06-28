# Quickstart Validation Guide: Deliverables Core

Date: 2026-06-28

This guide describes how to validate F-002 after implementation. It is not an implementation guide and includes no secrets, SQL, migrations, or product code.

## Preconditions

- F-001 secure tenant/client onboarding is implemented and verified.
- Samawah tenant exists as test data.
- Client A and Client B exist as synthetic test clients.
- Test users and emails are synthetic.
- Local Supabase or a non-production development/staging project is used.
- No production Supabase, real client names, real emails, service-role keys, or production data are used.

## Test Accounts

| Account | Purpose | Scope |
|---|---|---|
| `tenant-admin@example.test` | tenant administrator | Samawah tenant |
| `project-manager@example.test` | management actor | Client A and Client B as assigned |
| `account-manager-a@example.test` | deliverable creator | Client A only |
| `client-viewer-a@example.test` | client viewer | Client A only |
| `client-viewer-b@example.test` | negative control | Client B only |

## Scenario 1: Create Contract For Client A

- Sign in as authorized management user.
- Create Client A contract with required name/reference, period, and initial status.
- Expected result: contract appears under Client A only.
- Audit evidence: `ContractCreated`.
- Security evidence: a Client A-only actor cannot create or view Client B contract context.

## Scenario 2: Create Package And Package Lines

- Under Client A contract, create a package with lines such as posts, reels, report, and content plan.
- Expected result: package summary displays committed quantities.
- Ledger evidence: commitment entries exist for each package line.
- Security evidence: client users see only safe committed/remaining summaries, not internal notes.

## Scenario 3: Create A Reserved Deliverable

- Create a normal deliverable linked to Client A package line with available capacity.
- Expected result: deliverable status is `not_started`, progress is `0%`, and package capacity is reserved.
- Ledger evidence: `quantity_reserved` entry.
- Audit evidence: deliverable creation and reservation are explainable from audit/ledger records.

## Scenario 4: Deny Over-Capacity Deliverable

- Attempt to create another normal deliverable when the package line has no available capacity.
- Expected result: creation is denied with a safe Arabic message.
- Security evidence: no deliverable, allocation, or reservation ledger entry is created.
- Recovery UX: user can choose another package line, request adjustment, or create approved extra if authorized.

## Scenario 5: Create Approved Extra Deliverable

- As a project manager, create an approved extra deliverable with a reason.
- Expected result: deliverable is marked as approved extra.
- Ledger evidence: no package reservation is created by default.
- Audit evidence: approved-extra action records actor, client, target, reason, and timestamp.

## Scenario 6: Cancel Not-Started Deliverable

- Cancel a reserved deliverable that is still `not_started`, providing a reason.
- Expected result: deliverable becomes cancelled and capacity is released.
- Ledger evidence: `reservation_released` entry.
- Idempotency evidence: retrying cancellation does not create duplicate release entries.

## Scenario 7: Deny Progressed Cancellation

- Attempt to release reservation for a deliverable that has progressed beyond the F-002 eligible state.
- Expected result: action is denied and points to later change-control workflow.
- Audit evidence: sensitive denial event if applicable.

## Scenario 8: Client Summary View

- Sign in as Client A viewer.
- View Client A contract/package/deliverable summary.
- Expected result: safe summary includes agreed package quantities and deliverable status/progress.
- Security evidence: no internal ledger reasons, audit internals, files, comments, tasks, or approval details appear.

## Scenario 9: Cross-Client Denial

- As Client A viewer or Client A-only account manager, open Client B contract/package/deliverable identifier.
- Expected result: denied/not found without Client B name or existence.
- Audit evidence: sensitive denial event eligible.

## Required Verification Commands

Use the closest project commands available at implementation time:

```text
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:rls
npm run test:component
npm run test:e2e
npm run secret:scan
npm audit --audit-level=high
```

## Acceptance Evidence Checklist

- Contract creation is tenant/client scoped and audited.
- Package commitments create append-only ledger entries.
- Package balance is derived from ledger entries.
- Deliverable creation reserves capacity and starts `not_started` / `0%`.
- Insufficient capacity denies normal deliverable creation.
- Approved extra deliverable path is explicit and audited.
- Not-started cancellation releases reservation through ledger.
- Client summary hides internal fields.
- Cross-client resource access is denied without enumeration.
- No Kanban, files, comments, approvals, delivery, SLA timeline, billing, social scheduling, production Supabase, or real data are used.
