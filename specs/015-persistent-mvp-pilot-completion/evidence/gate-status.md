# Spec 015 gate status

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed before this continuation. |
| Persistent schema/RLS | blocked for this continuation | The new 202607130001/002 migrations are reviewed and additive, but local Supabase reset/pgTAP could not execute because Docker Desktop is unavailable. Prior baseline evidence is not reused as proof for these new policies. |
| Persistent workflow | green | Internal review, internal approval, client submission, client decision, delivery, closure, exact-version binding, audit, SLA, ledger, idempotency, terminal-state, and rollback paths are covered by local DB-backed tests. |
| Fixture boundary | green | Production routes use scoped persistent reads outside local/test actor-fixture mode; persistent read failures do not silently instantiate fixture repositories. `APP_ENV=test-persistent` is denied by the fixture predicate and verified by the persistent E2E helper. |
| Role and secrecy boundary | partial | Server/component/fixture secrecy checks pass; the new client current-version DB/RLS boundary is pending Docker-backed execution. |
| RTL/mobile/keyboard UX | partial | Targeted desktop fixture pending inbox 2/2 and prior client/accessibility evidence pass; the newly added pending spec has not yet been rerun across every configured project after its selector fix. |
| Persistent browser E2E | green | `npm run test:e2e:persistent` passed against local Supabase API/Auth using real sign-in, synthetic users, browser actions, and DB assertions. This is distinct from the fixture E2E suite. |
| Local MVP acceptance | blocked for this continuation | Typecheck, unit, integration, component, simulator RLS, build, targeted lint, and diff checks pass. Required DB-backed verification for the new migrations is blocked by unavailable Docker Desktop. |
| Hosted UAT | owner authorized / preflight in progress | Owner authorized a controlled Team-Only Hadna Preview/UAT run as an amendment to Spec 015. No hosted PASS is claimed until Draft PR, CI, Preview/UAT target verification, Supabase UAT migration/seed, approved team access, hosted workflow/UX checks, rollback validation, and T032 evidence complete. |
| Production acceptance | not granted | Outside task boundary. No deploy, push, hosted mutation, hosted read, or real data access occurred. |

## Owner-Authorized Hosted Team UAT gate additions

| Gate | Status | Reason |
|---|---|---|
| Branch/PR preflight | green | `git fetch origin --prune` completed; current branch is `codex/015-persistent-mvp-pilot-completion`; merge base with `origin/main` is `37027d458145dbf8a7e6d8d4e63a0eecd12a9328`; branch commit list and full diff/name-status were inspected. Hosted mutations were limited to the owner-authorized UAT migration, seed, Preview env, and Preview deployment. |
| Draft PR and CI | green | Branch pushed to origin and Draft PR #37 opened against `main`. GitHub `quality` check passed after lint, typecheck, unit, integration, local Supabase start/reset, RLS, component, E2E, secret scan, and build. CodeRabbit status passed/skipped. PR remains draft and unmerged. |
| Hosted target verification | green | Supabase linked target is UAT and ACTIVE_HEALTHY. The Vercel project is GitHub-connected, the reviewed branch deployment is Ready as Preview rather than Production, and the owner-configured public UAT alias was assigned to that deployment. Normal browser requests reach the Arabic sign-in shell without Deployment Protection. |
| Rollback approval | green | Owner-authorized amendment remains bounded to Team-Only Hadna Preview/UAT. Rollback owner and stop authority: project owner. Executor: Codex in this session. Window: current 2026-07-12 preflight/hosted attempt. Deployment rollback: disable/remove only this run's Preview alias/deployment. Database rollback: prefer forward fixes; remove only run-ID-scoped synthetic rows. Access rollback: revoke/disable only accounts/role assignments created by this run. Expected rollback verification: count/category-only checks plus Preview access check. |
| Migration gate | CI green / UAT pending | GitHub quality run `29239218799` applied the repository migrations in a clean Supabase start/reset and passed RLS 228/228. The new migrations have not been applied to UAT in this continuation; no hosted mutation is authorized until the UAT target is rechecked. |
| Synthetic Hadna seed | green | Idempotent S015 hosted seed now scopes to an active client-viewer role assignment through tenant membership and created one synthetic contract, package, package line, deliverable, version, file metadata row, client-visible comment, and SLA segment. Evidence is count/category-only. |
| Team access | green | Owner approved synthetic UAT account creation. Seven active categories now cover management, account manager, assigned writer, assigned designer, unassigned internal negative tester, client approver, and client viewer. Direct Auth verification plus active tenant membership and role-assignment checks pass for every category. The assigned writer owns the run-scoped synthetic deliverable and the assigned designer is its contributor; credentials remain local-only and uncommitted. |
| Preview deployment | green for Preview build and public UAT entry | Preview deployment built successfully and is Ready. Preview env contains the required app and public Supabase configuration; the public UAT alias returns the Arabic sign-in shell, signs in available valid UAT personas, has zero observed browser console errors for those personas, and shows no service-role marker or internal secret leakage. Production remains untouched. |
| Hosted workflow/UX UAT | blocked on prerequisite verification | H008 remains open. The new client visibility/pending/profile changes need Preview re-deploy and direct persona evidence after the migration gate is cleared. |
| T032 hosted evidence | pending | T032 remains open. Rollback boundary and migration/seed/deploy/public-entry/access evidence exist; workflow and final rollback/no-op evidence remain pending. |

## Product Experience Rescue amendment status (2026-07-13)

| Gate | Status | Evidence |
|---|---|---|
| Spec/design amendment | green locally | Spec 015 `spec.md`, `plan.md`, and `tasks.md` amended; root `DESIGN.md` added. |
| Client pending entry point | green locally / hosted pending | `/client/pending` is present in the Next build route manifest and client shell navigation. Hosted persona verification remains H008. |
| Raw assignee secrecy | green locally / hosted visual pending | Board maps known scoped members to human labels and unknown members to a generic team label; component regression passes. |
| Local UX rescue verification | partial / CI green | Local environment lacks Docker for DB-backed execution, but CI run `29239218799` passed full lint, secret scan, build, full fixture E2E 108 passed, and DB/RLS 228/228. Targeted local desktop pending E2E 2/2 also passed. |
| Hosted team workflow | open | H008-H010 remain open; no claim of hosted PASS is made from local evidence. |
| Client E2E navigation regression | green locally | Initial duplicate-landmark failure was fixed; affected client/accessibility tests pass across desktop/mobile/RTL with configured skips unchanged. |

Continuation evidence correction: the historical green rows above describe the earlier baseline. They are not evidence that the new 202607130001/002 migrations have passed DB/RLS execution. The current continuation status is governed by the partial/blocked rows above until Docker-backed reset/pgTAP, Preview redeploy, and direct hosted persona checks are rerun.
