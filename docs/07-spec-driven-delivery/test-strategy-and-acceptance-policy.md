# Test Strategy and Acceptance Policy

## Test Levels

| Level | Purpose | Mandatory areas |
|---|---|---|
| Unit | Pure domain rules. | progress, transitions, SLA status, ledger projection, permissions helpers. |
| Domain | Aggregate invariants. | deliverable state, approval version, ledger append-only. |
| Permission | Role/scope decisions. | client viewer cannot approve, designer cannot send, admin scope. |
| RLS | Database row visibility. | tenant/client isolation, internal-only denial. |
| Integration | Server commands and transactions. | approvals, delivery, ledger, SLA pause/resume. |
| Component | UI states. | role nav, forms, drawers, denied states. |
| E2E | Full critical flows. | onboarding, approval loop, file visibility, delivery. |
| Accessibility/RTL/Mobile | Usability baseline. | client approval, navigation, dialogs. |
| Security/File | Leakage prevention. | no public URLs, signed URL authorization, internal file denial. |
| Concurrency/Idempotency | Safe retries. | duplicate approval/send/delivery/SLA jobs. |
| Backup/Restore | Operations. | pilot restore drill. |
| Manual Pilot | Real workflow acceptance. | Samawah and selected clients. |

## Mandatory Feature Triggers

- Tenant Isolation: any scoped data or query.
- Client Isolation: any client-visible or assigned-team feature.
- Roles: any command or navigation change.
- Internal Comments: comments, review, client portal.
- File Visibility: storage/files/final delivery.
- Internal Approval: review/submission/delivery.
- Client Approval: client portal/decisions/SLA.
- SLA: status transitions, waiting client, escalation.
- Package Ledger: contracts/packages/delivery/reopen.
- Audit Log: all sensitive commands.
- Reopening/Offboarding: lifecycle and membership specs.

## Acceptance Criterion Policy

Every acceptance criterion must state verification method, test level, expected evidence, and owner. Example: "Client approver cannot approve a superseded version" -> E2E + integration, screenshot/log/test output, QA/backend owner.
