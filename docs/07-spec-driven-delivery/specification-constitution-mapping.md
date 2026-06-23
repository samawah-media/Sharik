# Specification Constitution Mapping

| Constitution principle | Spec artifact requirement | Plan/task requirement | Test evidence |
|---|---|---|---|
| Spec Before Code | Feature spec status must be Approved for Planning. | No build tasks before approved spec. | Governance checklist. |
| Approved Acceptance Criteria | Every feature spec has testable ACs. | Plan maps AC to verification. | AC evidence table. |
| Tenant/Client Isolation | Include scope and denied cases. | Include RLS and server auth design. | Cross-tenant/client tests. |
| Deny/Least Privilege | Permission IDs required. | Commands verify roles/scopes/states. | Negative permission tests. |
| Server-Side Sensitive Commands | Sensitive actions listed. | Server command boundaries. | Integration/domain tests. |
| Internal Content Hidden | Visibility matrix. | Read models exclude internal fields. | Client E2E denial tests. |
| Approval Before Exposure | State machine transitions. | Transaction design. | State transition tests. |
| Version-Aware Approvals | Version rules. | Freshness checks. | Superseded approval denial. |
| Append-Only Audit/Ledger | Audit/ledger event list. | Append-only persistence. | Mutation/reversal tests. |
| SLA Timeline | SLA state effects. | Timeline segment model. | Pause/resume/overdue tests. |
| RTL/Mobile/A11y | UX surface constraints. | Responsive UI tasks. | Playwright/mobile/a11y evidence. |
| No Secrets/Dependencies | Env/dependency notes. | Dependency review. | Secret scan/dependency review. |
| Traceability | Requirement-feature-test IDs. | Task references IDs. | Master index updated. |
