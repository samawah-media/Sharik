# Shape Up Pitches

## P-001 Secure Access Foundation

- Problem: no safe V1 work can begin without tenant/client membership, roles, scoped navigation, and audit.
- Appetite: one focused cycle.
- Business value: prevents the highest-risk class of failures.
- Users: tenant admin, team member, client admin/approver/viewer.
- Solution: login, tenant membership, client creation, invitations, role/scope assignment, role-scoped navigation, audit events.
- Breadboard: Auth -> Tenant -> Client -> Invite -> Role/scope -> Navigation -> Denied access test.
- Must-haves: server-derived scope, deny by default, audit, client isolation tests.
- Nice-to-haves: bulk invites.
- No-gos: deliverables, contracts, billing.
- Rabbit holes: overbuilding delegation/offboarding.
- Demo: Client user cannot access another client.
- Cut list: advanced invitation branding.

## P-002 Commercial Context and Deliverable Start

- Problem: deliverables need contract/package context and ledger reservation before work.
- Appetite: one cycle.
- Solution: contracts, packages, package reservation, deliverable creation, basic SLA start.
- No-gos: payment processing, invoices.
- Demo: PM creates package and deliverable; reservation appears; client sees progress summary.

## P-003 Internal Execution Workspace

- Problem: team needs one internal workspace for tasks, Kanban, comments, files, and review submission.
- Appetite: one cycle.
- Solution: task assignment, Kanban transitions, internal comments, file versions, review request.
- No-gos: client visibility before internal approval.
- Demo: invalid Kanban transition rolls back and creates no illegal state.

## P-004 Approval Loop and SLA Accountability

- Problem: Samawah must approve internally before client decision and avoid counting client waiting time.
- Appetite: one cycle.
- Solution: internal approval, send to client, client approve/change request, SLA pause/resume.
- No-gos: multi-party client approval.
- Demo: stale version approval denied; SLA pauses waiting client and resumes on change request.

## P-005 Delivery, Monitoring, and Pilot Readiness

- Problem: V1 needs closing, ledger consumption, simple portals, dashboards, and hardening.
- Appetite: one to two cycles.
- Solution: final delivery, ledger consumption, client summary, management monitoring, audit viewer, pilot hardening.
- No-gos: advanced analytics, audit export.
- Demo: approved deliverable is delivered, package balance changes via ledger, client sees final file.
