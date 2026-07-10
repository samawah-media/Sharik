# Master Traceability Index

| Requirement | Business rule | Permission ID | Aggregate | UX Flow | Screen ID | ADR | Component | Security/NFR | Feature | Slice | Candidate spec | Test type | Cycle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tenant users only see authorized tenant data | tenant membership required | MEMBERSHIP.READ | TenantMembership | login/scope select | AUTH-01 | ADR-004/005 | Auth/DB | SEC-001 | F-001 | VS-001 | secure-tenant-client-onboarding | E2E/RLS | C1 |
| Client user cannot see another client | client scope required | CLIENT.READ_SCOPED | ClientMembership | client portal login | CP-01 | ADR-004/005 | Auth/RLS | SEC-002 | F-001/F-017 | VS-001/010 | onboarding/client-portal | E2E/RLS | C1/C5 |
| Internal comment hidden from client | internal visibility denied | COMMENT.INTERNAL_READ | Comment | deliverable drawer/client portal | TW-04/CP-02 | ADR-005 | Comments/read models | SEC-003 | F-009/F-017 | VS-005/010 | internal-comments | E2E | C3/C5 |
| Internal approval before client send | approved version required | APPROVAL.SEND_CLIENT | Approval/Version | send to client | MGMT-05 | ADR-006 | Commands | SEC-006 | F-012/F-013 | VS-006 | internal-approval-client-submission | Integration/E2E | C4 |
| Client approval binds to version | stale version denied | APPROVAL.CLIENT_GRANT | Approval | client approval | CP-02 | ADR-006 | Commands | version invariant | F-014 | VS-007 | client-review-approval | Integration/E2E | C4 |
| SLA pauses waiting client | client wait excluded | SLA.PAUSE | SLA Timeline | send/client review | MGMT-05/CP-02 | ADR-008 | SLA/jobs | SLA NFR | F-015 | VS-006/007/008 | sla-tracking | Unit/integration | C4 |
| Package consumption append-only | delivery consumes ledger | LEDGER.CONSUME | UsageLedger | delivery | MGMT-06 | ADR-009 | Ledger | SEC-008 | F-016 | VS-009 | delivery-package-consumption | Domain/integration | C5 |
| Files protected by visibility | no public internal/final URLs | FILE.READ | FileVersion | files drawer/client files | TW-05/CP-04 | ADR-007 | Storage | file security | F-010/F-016 | VS-005/009 | files-and-versions | File/E2E | C3/C5 |
| Role-scoped navigation | no hidden privilege via UI | NAV.READ | Membership | nav | NAV-01 | ADR-005 | UI/Auth | least privilege | F-002 | VS-001 | role-scoped-navigation | Component/E2E | C1 |
| Audit all sensitive decisions | append-only audit | AUDIT.READ/WRITE | AuditEvent | activity feed | MGMT-08 | ADR-009 | Audit | accountability | F-020 | all | audit-viewer | Integration/E2E | C5 |

## Requirements Not Yet Fully Traced

- Backup/restore operational target: traced to F-022 but needs exact evidence definition.
- Offboarding and delegation expiry: traced to F-001 family but needs separate spec if included in V1.
- Bulk approval: UX exists but V1 inclusion remains open.
- Audit export: explicitly deferred unless owner changes scope.
# Canonical execution pointer (2026-07-10)

Active objective: persistent Hadna-only MVP completion. Canonical spec/plan/tasks: `specs/015-persistent-mvp-pilot-completion/`. Historical R-007–R-011A artifacts remain evidence and are superseded for execution.
