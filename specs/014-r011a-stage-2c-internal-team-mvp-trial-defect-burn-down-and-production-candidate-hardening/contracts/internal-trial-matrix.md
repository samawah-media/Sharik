# Contract: Stage 2C Internal MVP Trial Matrix

All scenarios use local Hadna-only synthetic data and value-free evidence.

## Role Categories

| Category | Must Prove | Must Deny Or Hide |
| --- | --- | --- |
| Management/admin | client visibility, deliverable creation, assignment, internal approval, client submission, delivery, audit visibility | cross-tenant leakage, unaudited sensitive transition |
| Project manager | assigned/managed client workflows, review, status movement, audit visibility | unauthorized client scope, unsafe approval bypass |
| Account manager | assigned client coordination, waiting approval visibility, client-facing state | internal-only actions outside role, cross-client access |
| Assigned team | assigned-client visibility, execution, local synthetic file metadata, internal comments | internal approval, send-to-client, final delivery, cross-client access |
| Client viewer | client-scoped visibility, final/client-visible files, safe denial states | internal comments, internal files, approval action, cross-client access |
| Client approver | client-scoped current-version approval, request changes, approval comment, audit event | stale-version approval, cross-client access, approval-link reuse |
| Unauthorized client | direct URL denial, no enumeration, no file download, no approval-link reuse | any data disclosure |

## Lifecycle Contract

The local trial must cover:

1. creation
2. assignment
3. execution
4. internal review
5. internal approval
6. client approval or change request
7. final delivery
8. closure

Each sensitive transition must have an audit expectation and an allowed/denied result.

## SLA Contract

The local trial must cover:

- start
- at-risk
- overdue
- paused-waiting-client
- resume after client change request or return to team
- completed

Client waiting time must not count as Samawah team overdue time.

## Stop Conditions

- Any P0 evidence stops continuation.
- Any P1 workflow/approval bypass blocks production-candidate claims.
- Any evidence containing real customer data, hosted secret, signed URL, hosted file content, or non-Hadna data is invalid and must be replaced with redacted value-free evidence.
- Any request for hosted mutation, deployment, promotion, access configuration, or Production acceptance requires separate owner approval.
