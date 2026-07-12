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

## Corrective workflow integrity requirements

- The generic status command permits only documented operational transitions between `not_started` and `in_progress`, plus resuming change-request work to `in_progress`.
- Approval-derived statuses and delivery require exact-version commands; `delivered`, `cancelled`, and `archived` are terminal.
- `account_manager`, `content_writer`, and `designer` may submit only assigned deliverables in their active client scope. They receive no approval, client-send, client-decision, or delivery authority.
- Database acceptance requires executed replay, append-only, atomicity, exact-version, assigned-team, Tenant A/B, and same-tenant Client A/B regressions.

## Out of scope

Hosted UAT execution, deployment/promotion, team access, real customer data, social scheduling, billing, mobile apps, microservices, new dependencies, and Production acceptance.

## Owner-Authorized Hosted Team UAT Amendment

Status: OWNER AUTHORIZED / PREFLIGHT IN PROGRESS.

This amendment extends Spec 015 only. It does not create Spec 016, does not invalidate the completed local acceptance evidence, and does not convert local MVP acceptance into hosted or Production acceptance.

### Hosted objective

Publish the accepted local MVP as a controlled online Team-Only Hadna UAT environment so approved Samawah team testers can sign in remotely and exercise the complete workflow against a Preview/UAT deployment and Supabase UAT target.

This is not a customer trial, Production deployment, Production acceptance, public release, public signup, or external client invitation.

### Hosted authorization boundary

Allowed external actions are limited to fetching GitHub remote state, creating a safe reviewable branch if required, pushing the reviewed UAT branch, creating a Draft PR, inspecting CI, configuring only Preview/UAT environment variables, deploying only a Vercel Preview/UAT build from the reviewed branch, verifying only the reviewed Supabase UAT project, applying only reviewed pending repository migrations, creating run-ID-scoped synthetic Hadna data, creating or inviting only explicitly approved Samawah team test users, running bounded hosted route/auth/RLS/workflow/UX checks, and rolling back only deployment or synthetic data created by this hosted UAT run.

Forbidden actions remain Production deployment, Production alias/domain changes, Vercel Production environment changes, Production Supabase access, real customer data, external client invitations, public signup, shared accounts or committed passwords, Non-Hadna data, destructive schema operations, deleting existing users or unrelated data, force push, PR merge, Production acceptance, product dependency additions, dnd-kit/Uppy/Tiptap/TanStack/React Hook Form integration, social scheduling, billing, AI, CRM, or other feature expansion.

### Hosted acceptance criteria

1. The branch and PR are reviewable, contain only required Samawah MVP changes, and expose no secrets, private artifacts, hosted URLs, direct identifiers, credentials, emails, tokens, or unexplained migrations.
2. Draft PR CI and the full local verification matrix pass before hosted mutation.
3. Vercel Preview/UAT target and Supabase UAT target are verified as non-Production before any hosted read or mutation.
4. Preview/UAT environment variables point only to Supabase UAT; Production variables remain untouched; no service-role key is exposed through `NEXT_PUBLIC_*`, browser bundles, logs, screenshots, Git, PR text, or evidence.
5. Hosted database preflight is count/category-only and confirms no real/unknown customer data will be touched, the synthetic Hadna namespace is isolated, migrations are compatible, and rollback is possible.
6. Pending repository migrations apply cleanly to Supabase UAT; migration error or partial application blocks PASS.
7. Synthetic Hadna UAT data is idempotent, run-ID scoped, tenant/client scoped, minimal, safe to rerun, safe to roll back, and unable to touch unrelated data.
8. Team-Only UAT uses individual approved accounts for management, account manager, assigned writer/designer, unassigned internal negative tester, team-controlled client viewer, and team-controlled client approver. No guessed invitations are sent.
9. Hosted UI journey passes for exact-version internal approval, send-to-client, waiting-client SLA pause, client viewer read-only secrecy, client approver change request/approval, stale-version rejection, delivery, audit, ledger, idempotency, and terminal delivered state.
10. Desktop Chromium, mobile Chromium, Arabic RTL, and keyboard-only critical paths pass with no hydration errors, sensitive console/log output, page-level horizontal overflow, or client exposure of internal comments/files.
11. No open P0/P1 defects remain; every P2 is owner-dispositioned; rollback rehearsal or no-op validation is recorded.

### Stop conditions

Stop before mutation or stop immediately during execution if Production is detected, target identity is ambiguous, real or unknown customer data may be affected, Non-Hadna data enters scope, migration fails or partially applies, rollback is unavailable, tenant/client/assignment isolation fails, unauthorized approval/send/delivery succeeds, internal comment/file becomes client-visible, stale version approval succeeds, audit/SLA/ledger/idempotency partial write occurs, a service-role key or secret appears in browser/logs/evidence, public signup is available, a P0/P1 defect is found, deployment points to the wrong Supabase project, or the task would require Production configuration.

### Hosted completion states

Use only one hosted final state:

- `HOSTED_TEAM_UAT_PASS`
- `HOSTED_TEAM_UAT_READY_AWAITING_TEAM_ACCESS`
- `HOSTED_TEAM_UAT_BLOCKED`

Do not use Production ready, Production accepted, customer accepted, or live release for this amendment.
