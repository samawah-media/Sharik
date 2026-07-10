# Evidence: Stage 2C Internal MVP Trial Matrix

**Date**: 2026-07-10
**Boundary**: Local Hadna-only synthetic trial. No hosted mutation, deployment, hosted file content operation, access configuration change, or Production acceptance.

## Role Matrix

| Category | Required Evidence | Status | Notes |
| --- | --- | --- | --- |
| Management/admin | client visibility, creation, assignment, internal approval, client submission, delivery, audit visibility | Passed | Covered by local lifecycle, authorization, audit, component, and E2E suites |
| Project manager | managed-client lifecycle and audit visibility | Passed | Covered by local role/MVP E2E and authorization categories |
| Account manager | assigned-client coordination and waiting approval visibility | Passed | Covered by assigned workspace and MVP E2E categories |
| Assigned team | assigned-client visibility, execution, file metadata, internal comments, denied approval/send actions | Passed | Covered by assigned-client, comments, files, and role-negative suites |
| Client viewer | client-scoped visibility, no internal comments/files, no approval action, safe denial states | Passed | Covered by client portal, approval delivery, isolation, and denial UX suites |
| Client approver | current-version approve/request changes, approval comment, audit event, no cross-client access | Passed | Covered by approval journey and client portal suites |
| Unauthorized client | direct URL denial, no enumeration, no file download, no approval-link reuse | Passed | Covered by isolation, denial UX, stale approval, and route guard suites |

## Lifecycle Matrix

| Step | Expected Evidence | Status |
| --- | --- | --- |
| Creation | local synthetic allowed transition plus audit expectation | Passed |
| Assignment | scoped assignment plus team visibility | Passed |
| Execution | assigned team execution without approval bypass | Passed |
| Internal review | management review and internal-only content protection | Passed |
| Internal approval | allowed management approval and audit expectation | Passed |
| Client approval | current-version client approver action and audit expectation | Passed |
| Delivery | final delivery visibility without internal file exposure | Passed |
| Closure | completed state and audit expectation | Passed |

## SLA Matrix

| State | Expected Evidence | Status |
| --- | --- | --- |
| start | SLA timeline starts on work activation | Passed |
| at-risk | local summary can mark at-risk | Passed |
| overdue | local summary can mark overdue | Passed |
| paused-waiting-client | waiting approval pauses Samawah SLA | Passed |
| resume | client change request or return to team resumes SLA | Passed |
| completed | closure completes SLA timeline | Passed |

## Initial Counts

- Local synthetic persisted mutations recorded: 0
- Local synthetic allow/deny categories covered: 7 role categories, 8 lifecycle steps, 6 SLA states
- Hosted mutations recorded: 0
- Hosted file content operations recorded: 0
- Deployments/promotions/config changes recorded: 0
- Production acceptance actions recorded: 0

## Isolation Findings

- Management/admin, project manager, and account manager categories remain tenant/client scoped in local role and route guard checks.
- Assigned team category remains limited to assigned client scope; approval/send/final-delivery actions are denied where applicable.
- Client viewer category remains read-only, client-scoped, and does not expose internal comments, internal files, or approval actions.
- Client approver category remains client-scoped and current-version bound; stale and cross-client approval attempts deny safely.
- Unauthorized client category receives safe denial/empty states without resource enumeration, file download, or approval-link reuse.
