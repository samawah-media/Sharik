# Spec 015 gate status

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed before this continuation. |
| Persistent schema/RLS | green | Clean local Supabase reset passed and pgTAP DB suite passed 6 files / 228 tests. |
| Persistent workflow | green | Internal review, internal approval, client submission, client decision, delivery, closure, exact-version binding, audit, SLA, ledger, idempotency, terminal-state, and rollback paths are covered by local DB-backed tests. |
| Fixture boundary | green | Production routes use scoped persistent reads outside local/test actor-fixture mode; persistent read failures do not silently instantiate fixture repositories. `APP_ENV=test-persistent` is denied by the fixture predicate and verified by the persistent E2E helper. |
| Role and secrecy boundary | green | Client/team/management role-negative paths, same-tenant client isolation, Tenant A/B isolation, internal comment secrecy, file visibility, and final-delivery visibility passed local DB-backed tests. |
| RTL/mobile/keyboard UX | green | Full Playwright suite passed across configured desktop, mobile, and RTL projects; mobile Kanban width regression fixed and rerun. |
| Persistent browser E2E | green | `npm run test:e2e:persistent` passed against local Supabase API/Auth using real sign-in, synthetic users, browser actions, and DB assertions. This is distinct from the fixture E2E suite. |
| Local MVP acceptance | green | Full local matrix passed with DB-backed RLS verification plus persistent browser E2E. Acceptance is local-only and synthetic-data-only; API/Auth are enabled locally only and no hosted action was performed. |
| Hosted UAT | not authorized | Must remain separate and Hadna-only; prompt exists for a future owner-approved run. |
| Production acceptance | not granted | Outside task boundary. No deploy, push, hosted mutation, hosted read, or real data access occurred. |
