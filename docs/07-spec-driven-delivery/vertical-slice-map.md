# Vertical Slice Map

| Slice | User outcome | Scenario | Dependencies | Security concerns | Data changes | UX surfaces | Tests | Out of scope | Appetite |
|---|---|---|---|---|---|---|---|---|---|
| VS-001 Secure Tenant and Client Onboarding | Admin creates safe access. | login, tenant, client, invites, scoped nav, audit. | none | tenant/client leakage | users, memberships, clients, audit | auth, admin settings, nav | E2E, permission, audit | deliverables | 1 cycle |
| VS-002 Client Contract and Package Setup | Admin creates agreement context. | create contract/package and client sees summary. | VS-001 | contract cross-client access | contracts, packages | management + client contract view | integration/E2E | billing | 1 cycle |
| VS-003 Deliverable Creation and Reservation | PM creates agreed deliverable and reserves package units. | add deliverable, owner, dates, SLA start, reservation. | VS-002 | scope, ledger append-only | deliverables, ledger, SLA | deliverable form/detail | domain/E2E | execution tasks | 1 cycle |
| VS-004 Team Tasks and Internal Kanban | Team executes work internally. | task assignment, Kanban move, invalid move rollback. | VS-003 | transition bypass | tasks, statuses, audit | team workspace/Kanban | Playwright/domain | client approval | 1 cycle |
| VS-005 Internal Files, Comments and Review | Team submits a version privately. | upload, internal comment, request review. | VS-004 | internal leak, file URL | files, versions, comments, review | drawer/files/comments | file security/E2E | client visibility | 1 cycle |
| VS-006 Internal Approval and Client Submission | Management approves and sends to client. | approve version, send, SLA pause, notify. | VS-005 | stale version, missing approval | approvals, SLA, notifications | review panel/send | integration/E2E | client decision | 1 cycle |
| VS-007 Client Review and Approval | Client decides safely. | mobile approve/change request; SLA resumes on change. | VS-006 | wrong client/version | client approval, comments, SLA | client portal | mobile/E2E | multi-party | 1 cycle |
| VS-008 SLA Tracking and Escalation | PM sees risk/overdue. | job updates risk and escalation. | VS-003/006/007 | job crosses tenant | SLA projections, audit | dashboards/action center | job/domain | advanced calendars | 1 cycle |
| VS-009 Delivery and Package Consumption | Approved work closes and consumes package. | final file, deliver, ledger consume. | VS-007/008 | transaction/ledger | deliverable, file, ledger | delivery panel/client files | integration | invoicing | 1 cycle |
| VS-010 Client Portal Summary | Client understands status. | pending, delivered, remaining. | VS-009 | internal fields leak | read models | client dashboard | E2E/mobile | full audit export | 0.5 cycle |
| VS-011 Management Monitoring | Management monitors across clients. | SLA/client/team indicators. | VS-008/009 | admin overreach | read models | management console | E2E | advanced analytics | 0.5 cycle |
| VS-012 Pilot Hardening | Pilot can run safely. | security/a11y/backup/perf checks. | all | production risk | ops configs/docs | all critical flows | ASVS/manual | new features | 1 cycle |
