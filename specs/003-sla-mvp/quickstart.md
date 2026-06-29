# Quickstart Validation Guide: SLA MVP

Date: 2026-06-29

This guide describes future validation scenarios for F-003 SLA MVP. It is not an implementation guide and includes no code, migrations, secrets, hosted migration, production usage, or real client data.

## Preconditions

- F-002 owner review gate is resolved before F-003 implementation starts.
- Synthetic deliverables exist for Client A and Client B in local or explicitly approved non-production data.
- Due-date fields are populated with synthetic dates for on-track, at-risk under an owner-approved threshold, overdue, client-waiting pause, internal-decision pause, completed, and cancelled scenarios.
- Test users and emails use `.example.test` or equivalent non-real values.
- No production Supabase, production credentials, real client names, real emails, or real client data are used.

## Future Test Accounts

| Account | Purpose | Scope |
|---|---|---|
| `tenant-admin@example.test` | management reviewer | Samawah tenant |
| `marketing-manager@example.test` | management SLA reviewer | Client A and Client B as assigned |
| `account-manager-a@example.test` | scoped internal reviewer | Client A only |
| `client-viewer-a@example.test` | negative visibility check | Client A only |
| `client-viewer-b@example.test` | negative control | Client B only |

## Scenario 1: On-Track SLA

- Create or select a synthetic active deliverable before its risk boundary.
- Expected result: management-visible SLA status is `on_track`.
- Evidence expectation: due-date boundary is explainable from synthetic data.
- Scope expectation: only authorized Client A management/internal users can see Client A status.

## Scenario 2: At-Risk SLA

- Create or select a synthetic active deliverable inside the owner-approved at-risk threshold.
- Expected result: management-visible SLA status is `at_risk`.
- Evidence expectation: the at-risk boundary is deterministic, documented, and owner-approved before implementation.
- Scope expectation: unauthorized users cannot infer the deliverable exists.

## Scenario 3: Overdue SLA

- Create or select a synthetic active deliverable past its applicable due boundary.
- Expected result: management-visible SLA status is `overdue`.
- Evidence expectation: overdue is based on due-date and running-time boundaries, not a manual label alone.

## Scenario 4: Pause While Waiting For Client

- Move or represent a synthetic deliverable in a client-waiting state.
- Expected result: SLA status is `paused_waiting_client`.
- Evidence expectation: pause audit expectation includes source, actor when applicable, tenant/client scope, deliverable, previous state, new state, reason, and timestamp.
- Delay expectation: time in this state does not count against Samawah.

## Scenario 5: Resume After Client Action

- Return a synthetic deliverable from client waiting to a Samawah-owned work state after a client change request or equivalent return.
- Expected result: SLA resumes from the resume boundary.
- Evidence expectation: resume audit expectation includes source, actor when applicable, tenant/client scope, deliverable, previous state, new state, reason, and timestamp.
- Delay expectation: only running time after resume counts against Samawah.

## Scenario 6: Pause While Waiting For Internal Decision

- Move or represent a synthetic deliverable in an explicit internal-decision waiting state after a future approved policy defines that state.
- Expected result: SLA status is `paused_waiting_internal_decision`.
- Evidence expectation: the pause is distinct from client waiting and includes source, actor when applicable, tenant/client scope, deliverable, previous state, new state, reason, and timestamp.
- Delay expectation: the future approved policy defines whether internal-decision paused time is excluded from Samawah running time; it must not be attributed to client waiting.

## Scenario 7: Complete Or Cancel SLA

- Mark a synthetic SLA-tracked deliverable as completed or cancelled in a future approved implementation.
- Expected result: SLA status is `completed` or `cancelled`.
- Evidence expectation: active Samawah delay stops at the completion or cancellation boundary.

## Scenario 8: Management Visibility

- Sign in as a management user with Client A scope.
- View Client A deliverables.
- Expected result: each SLA-tracked deliverable shows management-visible SLA status.
- Security evidence: Client B SLA status is not visible without Client B scope.

## Scenario 9: Client Waiting Time Exclusion

- Use a synthetic deliverable with one or more client-waiting pause segments.
- Expected result: management reporting can distinguish Samawah running time from client waiting time.
- Evidence expectation: client waiting time is excluded from Samawah delay and remains explainable.

## Scenario 10: Cross-Client Denial

- As a Client A-only user, attempt to access Client B SLA status or a Client B deliverable identifier.
- Expected result: denied/not found without Client B name, status, due dates, or existence leak.
- Audit expectation: sensitive denial is eligible for future audit evidence.

## Current Spec Kit Command Context

For this PR, `specs/003-sla-mvp` is the intended feature directory. If local `.specify/feature.json` still points to another feature while running Spec Kit analysis, use a temporary explicit feature override and do not treat another feature directory as F-003 evidence:

```powershell
$env:SPECIFY_FEATURE = '003-sla-mvp'
$env:SPECIFY_FEATURE_DIRECTORY = 'specs/003-sla-mvp'
.\.specify\scripts\powershell\check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
Remove-Item Env:\SPECIFY_FEATURE
Remove-Item Env:\SPECIFY_FEATURE_DIRECTORY
```

## Future Verification Commands

When a separate owner-approved implementation branch exists, use the closest project commands available at that time:

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
npm run build
```

## Current PR Evidence Status

| Target | Result | Notes |
|---|---:|---|
| F-003 implementation | NOT RUN | Explicitly out of scope. |
| SLA engine | NOT RUN | Explicitly out of scope. |
| Background jobs | NOT RUN | Explicitly out of scope. |
| Migrations | NOT RUN | Explicitly out of scope. |
| Hosted/staging migration | NOT RUN | Explicitly out of scope. |
| Production Supabase / real client data | NOT RUN | Explicitly prohibited. |

## Acceptance Evidence Checklist For Future Implementation

- SLA statuses include `on_track`, `at_risk`, `overdue`, `paused_waiting_client`, `paused_waiting_internal_decision`, `completed`, and `cancelled`.
- Due-date boundaries are deterministic and documented.
- The `at_risk` threshold is deterministic, documented, and owner-approved before implementation.
- SLA pauses when waiting for the client.
- Client waiting time does not count against Samawah.
- Internal-decision pause remains distinct from client waiting and cannot attribute internal waiting as client waiting or client delay.
- SLA resumes when client action returns the deliverable to Samawah-owned work.
- Pause/resume decisions have audit evidence.
- Management can see SLA status for scoped deliverables.
- Unauthorized users cannot infer another client's SLA status.
- No Kanban, files, comments, approvals, hosted migration, production usage, or real client data are used without a separate owner-approved gate.
