# V1 Feature Catalog

| ID | Feature | Problem solved | Included | Excluded | Key permissions | Aggregates | Security/NFR | Dependencies | Evidence | Cycle | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | Secure Tenant and Client Onboarding | Users need scoped access. | login, tenant join, client create, team/client invite, role/scope nav, audit | deliverables | MEMBERSHIP.*, CLIENT.CREATE | Tenant, Membership, Client | tenant/client isolation | none | E2E + permission tests | C1 | Brief ready |
| F-002 | Role-Scoped Navigation | Users see only relevant surfaces. | nav by role/scope, denied states | full settings | NAV.*, SETTINGS.READ | Membership | deny by default | F-001 | component/E2E | C1 | Candidate |
| F-003 | Contract and Package Setup | Client work needs commercial context. | contracts, packages, balances | billing | CONTRACT.*, PACKAGE.* | Contract, Package | scope + audit | F-001 | integration/E2E | C2 | Candidate |
| F-004 | Package Ledger Reservation | Prevent overcommit. | reserve/release units | consumption | LEDGER.RESERVE | Package, Ledger | append-only | F-003 | domain tests | C2 | Candidate |
| F-005 | Deliverable Creation | Add agreed outputs. | type, owner, dates, flags, status/progress | templates advanced | DELIV.CREATE | Deliverable | tenant/client scope | F-003 | E2E/domain | C2 | Candidate |
| F-006 | Deliverable Templates | Reuse common setups. | basic templates | marketplace | TEMPLATE.* | Template | admin-only writes | F-005 | unit/E2E | C2 | Candidate |
| F-007 | Team Task Assignment | Turn deliverables into work. | tasks, owner/contributors | workload forecast | TASK.* | Task | scoped assignment | F-005 | E2E | C3 | Candidate |
| F-008 | Internal Kanban | Track execution. | columns, drag/drop, rollback, transitions | client Kanban | KANBAN.MOVE | Deliverable, Task | transition validation | F-007 | Playwright | C3 | Candidate |
| F-009 | Internal Comments | Private collaboration. | internal comments, visibility | rich editor if deferred | COMMENT.INTERNAL_ADD | Comment | never client visible | F-005 | E2E denial | C3 | Candidate |
| F-010 | Files and Versions | Manage assets safely. | upload, metadata, version, visibility | R2 | FILE.* | File, Version | no public URL | F-005 | file security tests | C3 | Candidate |
| F-011 | Internal Review | Submit work for review. | version submit, checklist, changes | automated QA | APPROVAL.REQUEST_INTERNAL | Review, Version | version required | F-010 | domain/E2E | C4 | Candidate |
| F-012 | Internal Approval | Approve before client. | approve/request changes, audit | client decision | APPROVAL.INTERNAL_* | Approval | maker/checker | F-011 | integration | C4 | Candidate |
| F-013 | Client Submission | Send approved version. | send, pause SLA, notify | social publish | APPROVAL.SEND_CLIENT | Approval, SLA | internal approval gate | F-012 | E2E | C4 | Candidate |
| F-014 | Client Review and Approval | Client decides. | view version, approve/change request/comment | multi-party approval | APPROVAL.CLIENT_* | Approval, Comment | client scope/version | F-013 | mobile/E2E | C4 | Candidate |
| F-015 | SLA Timeline Tracking | Avoid wrong delay attribution. | start/pause/resume/overdue | advanced calendars | SLA.* | SLA Timeline | audit + idempotency | F-005/F-013/F-014 | domain/job tests | C4 | Candidate |
| F-016 | Delivery and Consumption | Close work and consume package. | ready/delivered/final file/ledger consume | invoicing | DELIV.DELIVER, LEDGER.CONSUME | Deliverable, Ledger | transaction | F-014/F-015 | integration | C5 | Candidate |
| F-017 | Client Portal Summary | Client sees simple status. | pending, done, remaining, files | internal Kanban | PORTAL.READ | Read models | no internal fields | F-014/F-016 | E2E/mobile | C5 | Candidate |
| F-018 | Management Monitoring | Admin sees SLA/work status. | dashboards, filters, risk | advanced analytics | DASHBOARD.MGMT_READ | Read models | scoped admin | F-015 | E2E | C5 | Candidate |
| F-019 | Notifications and Action Center | Prompt decisions. | in-app/email minimal | WhatsApp/SMS | NOTIF.* | Event/outbox | scoped links | F-013/F-015 | integration | C5 | Candidate |
| F-020 | Audit Viewer | Review history by role. | internal audit, client external history | export | AUDIT.READ | Audit | role filtering | all | E2E | C5 | Candidate |
| F-021 | Reopen/Correction Cycle | Handle post-delivery changes. | reopen, new revision marker | auto reversal | DELIV.REOPEN | Deliverable, SLA, Ledger | explicit audit | F-016 | domain | C6 | Needs decision |
| F-022 | Pilot Hardening | Release safely. | security, a11y, backup, perf | new features | OPS.* | Cross-cutting | production readiness | all prior | checklist | C6 | Candidate |
