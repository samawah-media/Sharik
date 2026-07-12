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
| Branch/PR preflight | green | `git fetch origin --prune` completed; current branch is `codex/015-persistent-mvp-pilot-completion`; merge base with `origin/main` is `37027d458145dbf8a7e6d8d4e63a0eecd12a9328`; branch commit list and full diff/name-status were inspected. Current uncommitted fix is scoped to the persistent E2E sign-in helper. No hosted target has been read or mutated. |
| Draft PR and CI | green | Branch pushed to origin and Draft PR #37 opened against `main`. GitHub `quality` check passed after lint, typecheck, unit, integration, local Supabase start/reset, RLS, component, E2E, secret scan, and build. CodeRabbit status passed/skipped. PR remains draft and unmerged. |
| Hosted target verification | pending | No Vercel or Supabase hosted mutation may occur until Preview/UAT and Supabase UAT are verified as non-Production in redacted form. |
| Rollback approval | green | Owner-authorized amendment remains bounded to Team-Only Hadna Preview/UAT. Rollback owner and stop authority: project owner. Executor: Codex in this session. Window: current 2026-07-12 preflight/hosted attempt. Deployment rollback: disable/remove only this run's Preview alias/deployment. Database rollback: prefer forward fixes; remove only run-ID-scoped synthetic rows. Access rollback: revoke/disable only accounts/role assignments created by this run. Expected rollback verification: count/category-only checks plus Preview access check. |
| Migration gate | local prerequisite green / hosted pending | Local reset PASS, RLS DB PASS, and persistent E2E PASS. Hosted migration remains forbidden until Supabase UAT target verification, migration inventory comparison, hosted apply, and post-migration smoke checks pass. |
| Synthetic Hadna seed | pending | No hosted seed has been created; future seed must be idempotent, run-ID scoped, and category/count-only in evidence. |
| Team access | pending | Approved email/role mapping is required before invitations; no guessed invitations are allowed. |
| Preview deployment | pending | Vercel Preview/UAT deployment has not yet been created by this amendment. Production remains untouched. |
| Hosted workflow/UX UAT | pending | Hosted UI journey and desktop/mobile/RTL/keyboard checks have not yet run. |
| T032 hosted evidence | pending | T032 remains open until hosted Team UAT passes or is blocked with rollback status. |
