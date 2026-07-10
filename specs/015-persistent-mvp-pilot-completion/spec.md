# Spec 015: Persistent MVP Pilot Completion

## Objective

Move the Hadna-only local MVP from synthetic route fixtures to one persistent, tenant-scoped Supabase/PostgreSQL workflow:

`team version -> internal review -> internal approval -> client approval/change request -> SLA pause/resume -> delivery -> package closure -> audit`

## Scope and boundaries

- Local Hadna synthetic data only. No hosted mutation, deployment, access configuration, real customer data, or Production acceptance.
- This is the only active execution package. Historical R-007–R-011A packages remain evidence and are superseded for execution.
- Existing stack and dependencies remain unchanged.

## Acceptance criteria

1. Core workflow reads and writes persistent local database records; production routes do not instantiate fixture repositories.
2. Every customer-scoped table carries `tenant_id` and `client_id` where applicable, with composite foreign keys and explicit RLS.
3. Internal comments/files are inaccessible to client roles; client exposure requires internal approval of the same version.
4. Approvals bind to `version_id`; stale, cross-client, replayed, and unauthorized decisions are denied and audited.
5. SLA timeline records running, paused-waiting-client, paused-internal, resumed, completed, and cancelled segments; client wait is excluded from Samawah time.
6. Final delivery requires the required approval, records an audit event, consumes package commitment append-only, and closes the deliverable.
7. Local DB RLS tests and complete role-based E2E pass. If the DB cannot start, acceptance remains blocked.
8. No open P0/P1 defects remain; every P2 has accountable owner disposition and evidence.

## Out of scope

Hosted UAT execution, deployment/promotion, team access, real customer data, social scheduling, billing, mobile apps, microservices, new dependencies, and Production acceptance.
