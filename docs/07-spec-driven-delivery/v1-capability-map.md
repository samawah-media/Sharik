# V1 Capability Map

| Capability | Business outcome | Users | Domain context | Architecture module | Security | V1/Later | Dependencies | Readiness | Open questions |
|---|---|---|---|---|---|---|---|---|---|
| Authentication | Known users access correct workspace. | All | Identity | Auth | High | V1 | Supabase Auth | Conditionally ready | Invite/session details |
| Tenant Membership | Samawah tenant roles established. | Admins/team | Tenancy | Membership | Critical | V1 | Auth | Ready | Offboarding timing |
| Client Membership | Users scoped to clients. | Admin/client | Client scope | Membership | Critical | V1 | Tenant membership | Ready | Delegation expiry |
| Roles and Permissions | Least privilege operations. | All | Permission model | Authorization | Critical | V1 | Membership | Ready | Exact audit viewer scopes |
| Client Management | Add/manage clients. | Admin/PM | Client | Clients | High | V1 | Auth/membership | Ready | Client lifecycle states |
| Contracts | Track agreement context. | Admin/client | Contract | Contracts | High | V1 | Clients | Ready | Contract file visibility |
| Packages | Track purchased units. | Admin/client | Package | Packages | High | V1 | Contracts | Ready | Package templates |
| Package Ledger | Auditable usage. | Admin | Ledger | Ledger | Critical | V1 | Packages/deliverables | Ready | Reopen policy |
| Deliverables | Manage agreed outputs. | All roles | Deliverable | Deliverables | Critical | V1 | Clients/packages | Ready | Template depth |
| Deliverable Templates | Speed consistent creation. | PM/admin | Type/template | Deliverables | Medium | V1 | Deliverables | Conditional | Template governance |
| Tasks | Assign work. | Team/PM | Task | Tasks | High | V1 | Deliverables | Conditional | Task vs deliverable status |
| Kanban | Internal workflow visibility. | Team/PM | Kanban/status | Workspace | High | V1 | Tasks/deliverables | Ready | Accessible DnD details |
| Internal Comments | Private collaboration. | Team/PM | Comments | Comments | Critical | V1 | Deliverables | Ready | Tiptap/fallback |
| Client Comments | Client feedback captured. | Client/team | Comments | Comments | High | V1 | Client portal | Conditional | Viewer comments |
| Files and Versions | Work and final assets controlled. | All | File/version | Storage | Critical | V1 | Clients/deliverables | Ready | Video threshold |
| Internal Review | Quality checkpoint. | Team/PM | Review | Approvals | Critical | V1 | Files/versions | Ready | Checklist detail |
| Internal Approval | Management approval. | PM/MM | Approval | Approvals | Critical | V1 | Review | Ready | Delegation |
| Client Review | Client sees approved version. | Client | Review | Client portal | Critical | V1 | Internal approval | Ready | Bulk review |
| Client Approval | Formal decision. | Client approver | Approval | Approvals | Critical | V1 | Client review | Ready | Multi-party deferred |
| SLA | Delivery accountability. | PM/team/client | SLA timeline | SLA/jobs | Critical | V1 | Deliverables/status | Ready | Reopen SLA |
| Escalations | Surface risk/overdue. | PM/admin | SLA | Notifications | High | V1 | SLA | Conditional | Escalation channels |
| Notifications | Prompt required actions. | All | Events | Notification/outbox | High | V1 minimal | Audit/events | Conditional | Email/SMS scope |
| Audit Log | Accountability. | Admin/PM | Audit | Audit | Critical | V1 | All sensitive actions | Ready | Export deferred |
| Client Portal | Simple client view/actions. | Client | Read models | Client app | Critical | V1 | Approvals/files | Ready | Audit history scope |
| Team Workspace | Work execution. | Team | Workspace | Team app | High | V1 | Tasks/Kanban | Ready | Workload metrics |
| Management Console | Cross-client control. | Admin/PM | Management | Admin app | Critical | V1 | All | Ready | Dashboard granularity |
| Settings | Manage users/scopes. | Admin | Settings | Admin | Critical | V1 | Membership | Conditional | Self-service limits |
| Arabic and RTL | Usable for primary audience. | All | UX | UI system | Medium | V1 | App shell | Ready | Locale/date format |
| Mobile Client Experience | Client decisions on mobile. | Client | UX | Client portal | High | V1 | Client portal | Ready | File preview constraints |
| Security and Isolation | Prevent leakage. | All | Cross-cutting | Auth/RLS/commands | Critical | V1 | All | Ready | Staging verification |
| Observability | Debug pilot safely. | Admin/dev | Ops | Logs/metrics | High | V1 | Deployment | Conditional | Tooling choice |
| Backup and Recovery | Recover data. | Admin/dev | Ops | Supabase/Vercel | High | V1 | Deployment | Conditional | Restore drill |
