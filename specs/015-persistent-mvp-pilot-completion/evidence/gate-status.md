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
| Hosted UAT | owner authorized / preflight in progress | Owner authorized a controlled Team-Only Hadna Preview/UAT run as an amendment to Spec 015. No hosted PASS is claimed until Draft PR, CI, Preview/UAT target verification, Supabase UAT migration/seed, approved team access, hosted workflow/UX checks, rollback validation, and T032 evidence complete. |
| Production acceptance | not granted | Outside task boundary. No deploy, push, hosted mutation, hosted read, or real data access occurred. |

## Owner-Authorized Hosted Team UAT gate additions

| Gate | Status | Reason |
|---|---|---|
| Branch/PR preflight | blocked | Worktree was clean and origin fetch completed, but the required pre-push local matrix is blocked because `npx supabase@2.107.0 db reset --local --no-seed` failed on local Postgres health/connection timeout. No push, PR, hosted mutation, or hosted target read may proceed until this is fixed and the full matrix passes. |
| Hosted target verification | pending | No Vercel or Supabase hosted mutation may occur until Preview/UAT and Supabase UAT are verified as non-Production in redacted form. |
| Rollback approval | pending | Deployment, database, access, owner stop authority, and rollback verification steps must be recorded before hosted mutation. |
| Migration gate | blocked | Local reset failed before RLS DB and persistent E2E could run; hosted migration remains forbidden until local reset, DB tests, persistent E2E, inventory, UAT comparison, hosted apply, and post-migration smoke checks pass. |
| Synthetic Hadna seed | pending | No hosted seed has been created; future seed must be idempotent, run-ID scoped, and category/count-only in evidence. |
| Team access | pending | Approved email/role mapping is required before invitations; no guessed invitations are allowed. |
| Preview deployment | pending | Vercel Preview/UAT deployment has not yet been created by this amendment. Production remains untouched. |
| Hosted workflow/UX UAT | pending | Hosted UI journey and desktop/mobile/RTL/keyboard checks have not yet run. |
| T032 hosted evidence | pending | T032 remains open until hosted Team UAT passes or is blocked with rollback status. |
