# Spec 015 gate status

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed before this continuation. |
| Persistent schema/RLS | green | Additive migration `202607150001` replayed from a clean reset in PR #37 quality run `29404575276` for head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`; pgTAP passed 6 files / 404 tests, including non-recursive RLS, active-role task mutation, eligible-assignee scope, and direct-helper denials. |
| Persistent workflow | green | Internal review, internal approval, client submission, client decision, delivery, closure, exact-version binding, audit, SLA, ledger, idempotency, terminal-state, and rollback paths are covered by local DB-backed tests. |
| Fixture boundary | green | Production routes use scoped persistent reads outside local/test actor-fixture mode; persistent read failures do not silently instantiate fixture repositories. `APP_ENV=test-persistent` is denied by the fixture predicate and verified by the persistent E2E helper. |
| Role and secrecy boundary | green for X006 | PR #37 quality run `29263587871` attempt 2 passed exact commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`, including Supabase start/reset, RLS, fixture E2E, persistent E2E, and secret scan. |
| RTL/mobile/keyboard UX | green for X006 / hosted pending | Repository Playwright visual QA `tests/e2e/visual-qa.spec.ts` passed locally across desktop, mobile, and Arabic RTL with direct screenshot inspection; the same visual checks are included in CI fixture E2E for exact commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`. |
| Persistent browser E2E | green | PR #37 quality run `29404575276` passed the full persistent suite on head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`: original lifecycle, mobile/RTL smokes, and real-Auth assignment journey covering management create/reassign, assignee status updates, old-assignee denial, and unrelated/client persona secrecy. |
| Local MVP acceptance | green for Checkpoint 1A | Checkpoint 1A is locally accepted for the exact corrective commit after PR #37 quality run `29404575276` passed npm ci, lint, typecheck, unit 182, integration 112, clean Supabase start/reset, RLS simulator 24, pgTAP 6 files / 404 tests, component 65, fixture E2E 123, persistent E2E 4, secret scan, and build; local `git diff --check` also passed. No P0/P1 remains open for Checkpoint 1A. |
| Hosted UAT | owner authorized / preflight in progress | Owner authorized a controlled Team-Only Hadna Preview/UAT run as an amendment to Spec 015. No hosted PASS is claimed until Draft PR, CI, Preview/UAT target verification, Supabase UAT migration/seed, approved team access, hosted workflow/UX checks, rollback validation, and T032 evidence complete. |
| Production acceptance | not granted | Outside task boundary. Existing actions are limited to the authorized Draft PR and Preview/UAT target; no Production deployment, promotion, merge, public signup, external-client invitation, or real customer data is authorized. |

## 2026-07-15 Checkpoint 1A exact-HEAD closure

- Branch: `codex/015-persistent-mvp-pilot-completion`.
- Corrective commit verified: `98a6e6745cf5e6c13e76e672a44883ec0bd51201`.
- Draft PR: #37, unmerged.
- CI evidence: GitHub Actions `F-001 Quality` run `29404575276`, job `87316811754`, SUCCESS.
- Matrix result: npm ci PASS; lint PASS; typecheck PASS; unit 51 files / 182 tests PASS; integration 28 files / 112 tests PASS; clean local Supabase start/reset PASS; RLS simulator 8 files / 24 tests PASS; pgTAP 6 files / 404 tests PASS; component 19 files / 65 tests PASS; fixture E2E 123 PASS; persistent E2E 4 PASS; secret scan PASS; build PASS. Local exact-head `git diff --check` PASS.
- Mandatory evidence checks pass: persona assertions use real Supabase Auth clients or browser sessions; service-role is limited to synthetic setup/teardown and post-action assertions; no `length >= 0` always-true assertion remains; management task create/assign/edit/reassign is covered; writer/designer task-assignee discovery through `/work` is covered; assignee status mutation is exact-owner-only; old assignee loses task/deliverable access after reassignment; unassigned internal and client personas see no internal tasks; disabled former assignee cannot invoke task mutation; deliverable/task RLS has no recursive-policy failure; eligible-assignee listing is management-only and same-tenant/same-client; internal comments, quality data, and task data remain hidden from clients.
- Defects S015-P1-049, S015-P1-050, S015-P1-051, S015-P1-052, S015-P1-054, S015-P2-053, S015-P2-055, and S015-P2-056 are reconciled as fixed/CI-verified.
- X007 hosted work, H008-H010, T032, and Production acceptance remain open and outside this closure.

## Owner-Authorized Hosted Team UAT gate additions

| Gate | Status | Reason |
|---|---|---|
| Branch/PR preflight | green | `git fetch origin --prune` completed; current branch is `codex/015-persistent-mvp-pilot-completion`; merge base with `origin/main` is `37027d458145dbf8a7e6d8d4e63a0eecd12a9328`; branch commit list and full diff/name-status were inspected. Hosted mutations were limited to the owner-authorized UAT migration, seed, Preview env, and Preview deployment. |
| Draft PR and CI | green | Branch pushed to origin and Draft PR #37 opened against `main`. GitHub `quality` check passed after lint, typecheck, unit, integration, local Supabase start/reset, RLS, component, E2E, secret scan, and build. CodeRabbit status passed/skipped. PR remains draft and unmerged. |
| Hosted target verification | green | Supabase linked target is UAT and ACTIVE_HEALTHY. The Vercel project is GitHub-connected, the reviewed branch deployment is Ready as Preview rather than Production, and the owner-configured public UAT alias was assigned to that deployment. Normal browser requests reach the Arabic sign-in shell without Deployment Protection. |
| Rollback approval | green | Owner-authorized amendment remains bounded to Team-Only Hadna Preview/UAT. Rollback owner and stop authority: project owner. Executor: Codex in this session. Window: current 2026-07-12 preflight/hosted attempt. Deployment rollback: disable/remove only this run's Preview alias/deployment. Database rollback: prefer forward fixes; remove only run-ID-scoped synthetic rows. Access rollback: revoke/disable only accounts/role assignments created by this run. Expected rollback verification: count/category-only checks plus Preview access check. |
| Migration gate | CI green / UAT pending | GitHub quality run `29239615839` applied repository migrations 202607130001/002 in a clean Supabase start/reset and passed RLS 228/228. Those migrations and every later X006 migration remain unapplied to Supabase UAT; the target and inventory must be rechecked before mutation. |
| Synthetic Hadna seed | green | Idempotent S015 hosted seed now scopes to an active client-viewer role assignment through tenant membership and created one synthetic contract, package, package line, deliverable, version, file metadata row, client-visible comment, and SLA segment. Evidence is count/category-only. |
| Team access | green | Owner approved synthetic UAT account creation. Seven active categories now cover management, account manager, assigned writer, assigned designer, unassigned internal negative tester, client approver, and client viewer. Direct Auth verification plus active tenant membership and role-assignment checks pass for every category. The assigned writer owns the run-scoped synthetic deliverable and the assigned designer is its contributor; credentials remain local-only and uncommitted. |
| Preview deployment | green for Preview build and public UAT entry | Preview deployment built successfully and is Ready. Preview env contains the required app and public Supabase configuration; the public UAT alias returns the Arabic sign-in shell, signs in available valid UAT personas, has zero observed browser console errors for those personas, and shows no service-role marker or internal secret leakage. Production remains untouched. |
| Hosted workflow/UX UAT | open | H008 remains open. Hosted Playwright tooling is present and fails closed without an explicit secure-env hostname allowlist and non-Production target category. X006 exact-HEAD CI, UAT migrations/imports, Preview update, and direct persona evidence are still required. |
| T032 hosted evidence | pending | T032 remains open. Rollback boundary and migration/seed/deploy/public-entry/access evidence exist; workflow and final rollback/no-op evidence remain pending. |
| Glass/Hadna workbook importer dry-run | green locally | Process-only Codex runtime configuration resolved the previous runtime-path blocker. Importer `--dry-run` passed with category-only counts: deliverables 16, content deliverables 15, coordination deliverables 1, versions 16, tasks 7, approval decisions 0, file assets 0. Workbook content and paths remain unprinted/uncommitted. |
| Local import apply/rollback validation | green locally | Clean local Supabase was available after Docker recovery. Repository importer local apply/replay/rollback passed with category-only counts: first apply 16 deliverables / 16 versions / 7 tasks; same-run replay unchanged; rollback dry-run 16 / 16 / 7; rollback 16 / 16 / 7; imported remaining 0; unrelated client scope stable. No hosted mutation occurred. |

## Product Experience Rescue amendment status (2026-07-13)

| Gate | Status | Evidence |
|---|---|---|
| Spec/design amendment | green locally | Spec 015 `spec.md`, `plan.md`, and `tasks.md` amended; root `DESIGN.md` added. |
| Client pending entry point | green locally / hosted pending | `/client/pending` is present in the Next build route manifest and client shell navigation. Hosted persona verification remains H008. |
| Raw assignee secrecy | green locally / hosted visual pending | Board maps known scoped members to human labels and unknown members to a generic team label; component regression passes. |
| Local UX rescue verification | prior slice CI green / X006 open | CI run `29239615839` passed lint, secret scan, build, fixture E2E 108, and DB/RLS 228/228 for migrations 202607130001/002. Persistent browser E2E and the full matrix have not rerun after the latest X006 changes. |
| Hosted team workflow | open | H008-H010 remain open; no claim of hosted PASS is made from local evidence. |
| Client E2E navigation regression | green locally | Initial duplicate-landmark failure was fixed; affected client/accessibility tests pass across desktop/mobile/RTL with configured skips unchanged. |
| X007 Checkpoint 1 product gaps | green locally / hosted pending | Team task mutation, management quality mutation, quality-gated internal approval, lazy drawer detail loading, drawer focus containment, `/client/files`, and honest brand/content fallback behavior are implemented locally. Checkpoint 3 DB and browser matrix passed, including pgTAP 6 files / 329 tests. Hosted persona workflow remains H008. |

## 2026-07-14 X007 Checkpoint 3 local matrix
- Clean local reset applied all migrations through `202607140002_s015_task_quality_idempotency_hardening.sql`.
- Local matrix passed: lint, typecheck, unit 50/179, integration 28/112, component 18/57, RLS simulator 8/24, pgTAP 6 files / 329 tests, fixture E2E 123 passed / 6 configured skips, persistent E2E 3/3, secret scan, diff check, and build.
- Visual QA is included in fixture E2E across desktop, mobile, and RTL. A mobile hydration wait was increased after a timeout-only failure; focused mobile visual QA and the full fixture suite passed afterward.
- Exact-HEAD PR quality run `29324709845` failed only on persistent mobile client approval detail width; the surface was fixed and exact-HEAD PR quality run `29329914612` passed for commit `f1690dc`.
- A corrective review found P1 gaps in task read isolation and assignee validation; corrective migrations `202607140003` and `202607140004` and expanded pgTAP coverage were added. Exact-HEAD PR quality run `29334543580` passed for commit `efa307e` after the first corrective slice. A second corrective slice (`202607140004`) adds team-member assignee authority and expanded negative pgTAP; exact-HEAD CI is pending after push.
- A third corrective slice (`202607140005`) reopens Checkpoint 1A to fix task assignment authority: removes `created_by` permanent grant, narrows deliverables SELECT for team to owner/contributor/task-assignee, restructures update authority (management/owner-contributor/assignee), adds explicit server capabilities, and fixes active-role-to-active-membership linkage. Local typecheck/unit/integration/component/secret-scan PASS; Docker-backed DB/persistent-E2E/build verification deferred to exact-HEAD CI. Checkpoint 1A is not green while P1 defects S015-P1-044 through S015-P1-047 are open pending exact-HEAD CI.
- Hosted H008/H009/H010/T032 remain open. No hosted mutation, Production action, PR merge, or workbook tracking occurred.

Continuation evidence correction: CI run `29239615839` is valid database evidence for migrations 202607130001/002 (RLS 228/228) and fixture evidence (E2E 108). Later X006 closure is instead backed by exact-HEAD PR #37 quality run `29263587871` attempt 2 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`. X007, H008-H010, and T032 remain open.

Latest X006 evidence: local lint, typecheck, unit 50/174, integration 28/112, component 18/57, RLS simulator 8/24, fixture E2E 123 passed / 6 configured skips, visual QA, secret scan, diff check, production build, and workbook dry-run (15 content deliverables + 1 coordination deliverable + 16 draft versions + 7 tasks; 0 approvals/files). Exact-HEAD PR #37 quality run `29263587871` attempt 2 additionally passed Supabase start/reset, RLS, fixture E2E, persistent E2E, secret scan, and build.

## 2026-07-13 reconciliation
- Latest owner-provided quality CI `29248954232` remains historical evidence for X006-A through X006-G.
- X006-H and parent X006 are closed by exact-HEAD PR #37 quality run `29263587871` attempt 2 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`.
- X007, H008-H010, UAT migration/import, rollback/no-op rehearsal, and T032 remain open.

## 2026-07-13 local visual QA continuation
- X006-H visual tooling now runs through the repository Playwright CLI, not the abandoned temporary ESM harness.
- Local synthetic visual QA passed 12/12 across desktop, mobile, and Arabic RTL, with direct screenshot inspection.
- Hosted UAT Playwright tooling now requires a secure local env with an explicit hostname allowlist and accepted non-Production target category; without them it fails closed before navigation.
- X006-H is closed by exact-HEAD PR #37 quality run `29263587871` attempt 2 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`.
- X007, H008-H010, T032, hosted UAT workflow, UAT import/rollback evidence, and Production acceptance remain open/not granted.
