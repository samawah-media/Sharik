# Spec 015 gate status

## Current owner decision — 2026-07-20

`HOLD / HOSTED_TEAM_UAT_BLOCKED`. The 2026-07-20 corrective code slice closed the rescue's product-code gaps (raw enums, viewer copy, synthetic-UAT visibility, Uppy English) plus three rescue build/CI defects, and the complete exact-HEAD quality matrix is green on PR #37 quality run `29725841355` for head `0d7e8886f9ea975def04cf2405ef8555d04feda5`, with the exact-HEAD Vercel Preview Ready. Two hosted/data blockers remain open and keep H008-H010/X007/T032 closed: the setup-only service credential required for the bounded UAT data correction (defects C/F → S015-P1-078 / S015-P2-078) is unavailable on this workstation, and the hosted role walkthrough (S015-P1-079) cannot be driven without protected Preview access and the approved UAT persona accounts. No hosted data was mutated and no secret was printed or requested.

## Exact-HEAD quality matrix — 2026-07-20 (green)

- Branch: `codex/015-persistent-mvp-pilot-completion`. Final HEAD: `0d7e8886f9ea975def04cf2405ef8555d04feda5`. Draft PR #37: open, unmerged.
- CI: GitHub Actions `F-001 Quality` run `29725841355`, job `88298622704`, SUCCESS in 16m19s.
- Result: npm ci PASS; lint PASS; typecheck PASS; unit 53 files / 191 tests PASS; integration 28 files / 112 tests PASS; clean local Supabase start PASS; clean `db reset --local` PASS; RLS simulator 8 files / 24 tests PASS; pgTAP 6 files / 404 tests PASS; component 21 files / 69 tests PASS; fixture E2E 126 passed (6 configured mobile-only skips); persistent E2E 4 passed; secret scan PASS; build PASS.
- Vercel: deployment `8LLCzASyKbKZBatUGHRyHFw2mBZh` completed for the exact head; target Preview; Ready. No Production alias or environment was changed.
- Local cross-check on the same head: lint, typecheck, secret scan, `git diff --check`, unit 191, integration 112, component 69, RLS simulator 24, pgTAP 404, build, and the two corrected E2E specs (18 runs across desktop/mobile/RTL) all passed. Persistent E2E could not be completed locally because of the known post-reset auth-recovery race; the retry hardening lets the authoritative exact-HEAD CI run pass it.
- Defects S015-P1-073 through S015-P1-077 and S015-P2-076/S015-P2-077 are reconciled as fixed/CI-verified. S015-P1-078, S015-P2-078, and S015-P1-079 remain open hosted/data blockers.


`HOLD / HOSTED_TEAM_UAT_BLOCKED`. The first owner human trial rejected the product experience. Automated Auth/RLS/lifecycle evidence remains useful technical evidence, but it did not prove representative data, comprehensible navigation, actionable client approvals, or professional role-specific UX. H008-H010, X007, and T032 are reopened until X008 passes and the owner explicitly accepts the corrected Preview.

Correction update: X008-A through X008-G are now implemented and verified on a new protected non-Production Preview. Real-Auth role smoke passed 21/21 across desktop, mobile, and Arabic RTL, and two genuine current Glass versions are visible to the client, including one with real caption/body. Status remains HOLD because X008-H requires explicit owner human PASS; no team invitation has been sent. The setup-only credential required to rerun the synthetic hosted mutation lifecycle is also unavailable on this workstation, so that rerun is recorded as a hosted permission blocker rather than a pass.

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed before this continuation. |
| Persistent schema/RLS | green | Additive migration `202607150001` replayed from a clean reset in PR #37 quality run `29404575276` for head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`; pgTAP passed 6 files / 404 tests, including non-recursive RLS, active-role task mutation, eligible-assignee scope, and direct-helper denials. |
| Persistent workflow | green | Internal review, internal approval, client submission, client decision, delivery, closure, exact-version binding, audit, SLA, ledger, idempotency, terminal-state, and rollback paths are covered by local DB-backed tests. |
| Fixture boundary | green | Production routes use scoped persistent reads outside local/test actor-fixture mode; persistent read failures do not silently instantiate fixture repositories. `APP_ENV=test-persistent` is denied by the fixture predicate and verified by the persistent E2E helper. |
| Role and secrecy boundary | green locally and hosted | Exact-HEAD CI run `29490121433` passed the complete local matrix. Direct hosted smoke passed 27/27 and the persistent hosted lifecycle passed 1/1 with real UAT Auth sessions, assigned/unassigned denial, client read-only/approval separation, and internal comment/file secrecy. |
| RTL/mobile/keyboard UX | green locally and hosted | Repository visual QA remains green; exact-HEAD hosted smoke passed across desktop, mobile Chromium, and Arabic RTL. The hosted lifecycle also verified keyboard/focus-critical surfaces and no page-level horizontal overflow. |
| Persistent browser E2E | green | PR #37 quality run `29404575276` passed the full persistent suite on head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`: original lifecycle, mobile/RTL smokes, and real-Auth assignment journey covering management create/reassign, assignee status updates, old-assignee denial, and unrelated/client persona secrecy. |
| Local MVP acceptance | green for Checkpoint 1A | Checkpoint 1A is locally accepted for the exact corrective commit after PR #37 quality run `29404575276` passed npm ci, lint, typecheck, unit 182, integration 112, clean Supabase start/reset, RLS simulator 24, pgTAP 6 files / 404 tests, component 65, fixture E2E 123, persistent E2E 4, secret scan, and build; local `git diff --check` also passed. No P0/P1 remains open for Checkpoint 1A. |
| Hosted UAT | amber / corrected Preview verified | New real-Auth role smoke passed 21/21 across desktop/mobile/RTL after representative Glass preparation. The setup-only service credential needed for a fresh synthetic mutation lifecycle is unavailable; historical lifecycle evidence remains technical context only. |
| Human product acceptance | red / HOLD | X008-A through X008-G are complete, but no team invitation or formal trial may begin until the owner explicitly passes management, assigned-team, client-viewer, and client-approver journeys under X008-H. |
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
| Migration gate | green for current Supabase UAT inventory | Six reviewed additive migrations `202607140001` through `202607150001` were applied only to the verified non-Production Supabase UAT target. A post-apply inventory confirms every local/remote timestamp matches. No table/column drop, TRUNCATE, Storage mutation, or Production access occurred. |
| Synthetic Hadna seed | green | Idempotent S015 hosted seed now scopes to an active client-viewer role assignment through tenant membership and created one synthetic contract, package, package line, deliverable, version, file metadata row, client-visible comment, and SLA segment. Evidence is count/category-only. |
| Team access | green: seven approved categories | The ignored secure persona store contains management, account manager, assigned writer, assigned designer, unassigned internal negative tester, client approver, and client viewer. Seven scoped `member_profiles` were synchronized with a run-ID-scoped tool and verified before the lifecycle. All seven categories authenticated and reached only their allowed hosted surfaces. |
| Preview deployment | green on exact reviewed head | A non-Production Preview was built from `3266d6fae0f4792da3ba7ceff4ce3d84b8362924`, with `/work`, `/client/pending`, and `/client/files` present in the route manifest. The UAT-only alias was reassigned to that deployment; its protection-bypass configuration remained enabled. No Production alias or environment was changed. |
| Hosted workflow/UX UAT | green | Boundary and persona smoke passed 27/27 across desktop, mobile, and Arabic RTL. The one-worker persistent hosted lifecycle passed 1/1 using real UAT Auth and UI actions for task assignment, three versions, internal changes/approval, client changes/approval, stale-version denial, final delivery, files, comments, SLA, audit, ledger, idempotency, and terminal-state denial. |
| T032 hosted evidence | green / closed | R-011A T032 is closed by direct bounded Preview/UAT evidence. Four failed synthetic lifecycle runs were retired using real authorized actors and audited RPCs; allocations were released and immediate replay returned no-op. No unrelated scope or Production system was touched. |
| Glass/Hadna workbook importer | green for controlled UAT apply/replay/rollback dry-run | A management-authenticated audited RPC created the minimal Glass UAT client/contract/package scope because only Hadna existed. The new run dry-run and apply produced 16 deliverables / 16 versions / 7 internal tasks, with 0 approval decisions and 0 file assets. Same-run replay stayed 16/16/7, unrelated scope counts stayed stable, and rollback dry-run proved 16/16/7 removable by run ID. Workbook content, paths, IDs, URLs, and credentials remain uncommitted. |
| Local import apply/rollback validation | green locally | Clean local Supabase was available after Docker recovery. Repository importer local apply/replay/rollback passed with category-only counts: first apply 16 deliverables / 16 versions / 7 tasks; same-run replay unchanged; rollback dry-run 16 / 16 / 7; rollback 16 / 16 / 7; imported remaining 0; unrelated client scope stable. No hosted mutation occurred. |

## Product Experience Rescue amendment status (2026-07-13)

| Gate | Status | Evidence |
|---|---|---|
| Spec/design amendment | green locally | Spec 015 `spec.md`, `plan.md`, and `tasks.md` amended; root `DESIGN.md` added. |
| Client pending entry point | green locally and hosted | `/client/pending` is present in the exact-HEAD route manifest; client viewer and approver hosted sessions reached it across desktop/mobile/RTL, and the approver completed exact-version decisions in the hosted lifecycle. |
| Raw assignee secrecy | green locally and hosted | Board maps known scoped members to human labels and unknown members to a generic team label. Hosted member-profile preflight and management task assignment passed without exposing raw identifiers. |
| Local UX rescue verification | green / X006 closed | Exact-head run `29490121433` passed the complete matrix after all X006/X007 changes; earlier partial run `29239615839` remains historical evidence only. |
| Hosted team workflow | green for controlled internal trial | H008-H010 and X007 are closed by direct Preview/UAT evidence recorded in `hosted-team-uat-final-handoff.md`. Production remains blocked. |
| Client E2E navigation regression | green locally and hosted | Initial duplicate-landmark failure was fixed; client viewer/approver navigation passed hosted desktop/mobile/RTL smoke and the exact-version lifecycle. |
| X007 product gaps | green locally and hosted / closed | Team task mutation, quality gate, lazy drawer details, focus containment, client files, and honest content fallbacks passed local CI and direct hosted lifecycle verification. |

## 2026-07-14 X007 Checkpoint 3 local matrix
This section is historical checkpoint evidence and is superseded for current hosted status by the `HOSTED_TEAM_UAT_READY` rows above.
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
