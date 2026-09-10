# Plan: Persistent MVP Pilot Completion

## SIL-52 / SIL-54 correction — 2026-09-10

Execute [bounded plan](evidence/sil52-sil54-plan.md), under the top Spec015 amendment and ADR-013. Existing dirty SIL-44 is preserved. Native workers have disjoint source/test ownership; coordinator serializes test/build output and owns shared docs/review. No commit, push, migration apply or publication in worker assignments. Docker currently has no daemon endpoint; authenticated DB tests remain a separate required gate, not inferred from mock or unit results.

## SIL-44 bounded implementation — 2026-09-10

Owner approved the selector design. Lead owns common authorization/selection helper, server cookie action, route integration and canonical evidence. A native worker owns the isolated selector component and component tests only. Use test-first checks, then targeted unit/component/route regression, typecheck and lint. Preserve all existing dirty evidence and operational SQL. No database/schema or authorization model changes; no ADR needed for a UI preference using the existing server-action stack. Deliberate Preview publication and live A/B acceptance follow reviewed local verification; never mark pending owner tests passed.

## Owner-approved CI recovery — 2026-09-08

Owner approved moving Docker-dependent verification to disposable GitHub runner
Supabase after bounded Docker recovery failed. This supersedes the local-before-push
ordering only for those gates: review and remaining local checks precede a normal
push; exact-source clean reset, full database and persistent tests must pass in CI
before any UAT migration or deployment. No hosted data moves to CI.
The current Spec015 branch has automatic Vercel Git deployment disabled in
`vercel.json`; other branches and Production settings are unchanged. Keep that hold
until deliberate reviewed Preview publication. Record CI checkout SHA/results and
retain all owner/hosted acceptance as pending. No test requirement is waived.

## Approved UI implementation — 2026-09-08

UI3 internal drawer is LOCAL PASS: [bounded plan](evidence/ui3-plan.md) and
[verification](evidence/ui3-checkpoint.md). UI4 client approval is LOCAL PASS:
[bounded plan](evidence/ui4-plan.md) and [verification](evidence/ui4-checkpoint.md).
Owner-approved prototype direction is retained;
local checks are separate from pending owner/hosted acceptance.

Post-restart continuation: the owner confirmed Windows restart and requested work
to continue. UI1 integrated browser gate is now local GREEN28 (20 intentional
profile skips); UI2 dashboard browser GREEN6 and full component GREEN286.
Follow [current recovery evidence](evidence/ui2-recovery-checkpoint.md), including
remaining owner/hosted checks. The pre-restart runtime prohibition below is historical.

Owner requested UI2 implementation before restarting the machine. Follow
[UI2 bounded plan](evidence/ui2-plan.md); UI1/UI2 integrated browser acceptance
is deferred, not waived. Do not run more Next warmup attempts before the restart.
UI2 production implementation and independent source review are complete; the
[lead checkpoint](evidence/ui2-lead-checkpoint.md) separates executed checks from
pending acceptance. Do not restart UI2 implementation from the historical queue.

Owner approved the prototype direction and requested delegated execution.
Begin [UI1 shell foundation](evidence/ui1-plan.md); subsequent dashboard/drawer/
client slices retain dependency order and require detailed test boundaries.
Research artifacts remain sample-only. No deployment or owner-UAT pass implied.

## Research-only continuation — 2026-09-08

Owner approved public Saudi references, a concise Saudi voice guide, and three
standalone mockups before application changes. [Review package](evidence/ui-research-20260908/README.md)
is ready for design approval. No dependency, architecture, database, permission,
workflow or SLA change is authorized by this phase. Next: owner design decision,
then bounded implementation planning; no production successor is started.
Existing owner walkthrough remains canonical; its pending gates are not passed.

## Current continuation state — 2026-09-07

D18 / X010-B-7C-19 is LOCAL PASS. The installed Next.js Turbopack fixture
harness, with `/work?as=assigned_internal_a` warmed before readiness, passed
the unchanged six D18 browser cases (exit 0, 4.4m). The subsequent six-file
regression passed 59 cases with 25 intentional profile skips (exit 0, 5.5m),
including all six D18 cases again. Independent review found no blocker;
saved metrics show 110px rows, 44px summaries and empty browser-error arrays.
Lead reviewed desktop/mobile/long-text screenshots. Fresh script syntax,
scoped ESLint and git diff checks passed. Verification processes have ended.

Accept the two-line local test-harness change; no dependency/version,
production guard or test assertion changed. The normal `npm run dev` and
prior build already use Next's default bundler. Earlier warmup-only testing
failed 5 PASS / 1 FAIL (5.9m); the passing comparison does not prove the
Webpack root cause or real prehydration click safety. Full commands, evidence
and narrow rollback are in evidence/d18-report.md. No new architecture or ADR.

D17 remains LOCAL PASS. No further local implementation slice is approved
in the current queue. All 20 owner checks remain unchecked. Real-DB, exact-HEAD
CI, hosted target verification and owner walkthrough remain separate pending
gates; no commit, deployment or production-readiness claim is made.

### Historical implementation and failed browser runs

Prior implementation checkpoint (retained as history): both D17/D18 layouts implemented after
browser RED; independent spec/quality reviews found no issues. Full component
38 files / 263 tests PASS. First shared browser exited 1: 11 PASS / 5 FAIL /
5 intentional SKIP (6.9m). Four D17 geometry cases, six pending-inbox cases
and D18 desktop1440 passed; five other D18 cases failed the initial drawer
open before geometry. The bounded React readiness test-only correction was
reviewed without relaxing geometry or claiming real prehydration click support.
Corrected six-case D18 rerun: exit 1, 4 PASS / 2 FAIL (9.4m).
Mobile and RTL profiles at 1440/375 passed. Desktop1440 passed geometry,
interactions and DOM stress, but failed the final console assertion:
Next Router action dispatched before initialization. Desktop375 failed the
30s React readiness poll before geometry; its cause remains unproven.
D18 remains implemented, verification-pending and unchecked. Standalone
six-file scoped ESLint and git diff check exited 0. Typecheck PASS, exit 0.
Final isolated build PASS, exit 0: compiled in 2.5min, TypeScript 20.5s,
11 static pages. D17 / X010-B-7C-18 is LOCAL PASS and checked; D18 /
X010-B-7C-19 remains unchecked, implemented and verification-pending.
Those prior verification processes ended. Their final normal git diff check
passed; source changes remain local and unstaged. The continuation run above
is separate and still active.
All 20 owner checkboxes remain unchecked (lead verified).
Next bounded diagnostic: distinguish Next dev cold-start/HMR effects from
product behavior. The completed build is not production-mode browser
verification. `src/server/navigation/route-fixture-env.ts` disables `as=` actor
fixtures under `NODE_ENV=production`; do not bypass that guard. Subsequent
production-mode browser verification requires an approved authenticated DB
setup and has not been executed. External gates remain pending.
No dependency upgrade or error filtering is implemented/approved.
D17 desktop/mobile and D18 desktop images: evidence/visual-20260907.
All 20 owner checks remain unchecked; no real-DB/hosted/CI/deployment acceptance.

### Approved implementation sequence — retained for chronology

Owner approved D17/D18 on 2026-09-07. Execute X010-B-7C-18/19 in two disjoint
slices: client decision-panel geometry and collapsed drawer task-row density.
Write behavioral/geometry tests first; lead observes browser RED before any
production layout edit. Use natural 44–56px decision buttons, visible reason
input, preserved mobile order, and no clipped long text. Retain >=44px native
task disclosure, all editing fields and existing permission/retry behavior.
Only panel layout and TaskWorkspaceCard layout may change; no server/schema,
workflow, shared style, dependencies or navigation changes. Lead owns shared
browser/build gates and canonical evidence. Previous local results below do
not establish this wave's acceptance. External/owner gates remain pending.

### Historical D15/D16 and earlier wave evidence

Owner approved D15/D16 design. X010-B-7C-16 shell and X010-B-7C-17 directory
were implemented by two reused Astra workers with disjoint file ownership.
Lead browser RED preceded layout edits. Real-directory fixture tests retain
runtime/role guards; persistent queries are unchanged. Lead component 37/254,
navigation unit 2/9, scoped lint/diff, typecheck and browser gates pass.
Four initial client-mobile keyboard failures were reproduced with bounded
polling then fixed through nearest focus reveal. Final shell/client-inbox
browser: 19 PASS / 20 intentional skips; directory 12/12 and existing visual
15/15 also executed. Fresh build PASS (exit 0, 11 generated pages).
X010-B-7C-16/17 locally complete; external/owner gates remain open.
No worker shared test server.

Previous parallel wave: X010-B-7C-14 owns mobile filter layout and the My Work
drawer entry point; X010-B-7C-15 owns inline-media failure/reset behavior.
Worker files and baseline hashes are in evidence/delegation-queue.md. Tests
precede production edits, then lead reviews both deltas and runs combined
component, typecheck, scoped lint, browser/visual and build checks. No shared
browser/build output is written by workers. Prior completed local gates are
historical evidence, not proof for this wave.

Wave completed locally: full component 37/248, fixture visual 15/15 (4.9m),
typecheck, scoped lint/diff and fresh production build PASS. Read-only cross
review led to an additional deferred media race test; typecheck led to a
test-only query option correction. Desktop/mobile images inspected. No ADR,
schema, permission, dependency or hosted change. Remaining global header and
other-surface density work still needs bounded design; human/hosted/DB gates
remain open and are not waived by these local results.

Owner approved X010-B-7C-13 compact My Work rows. Execute inside this existing
Spec: D10 first reproduces the missing summary-only list contract in the real
component test, then changes only TeamWorkspace/its bounded row presentation;
D11 independently extends the fixture browser acceptance. Writers have
disjoint files and only the lead runs shared browser/build gates. Review the
actual diff, then run focused/full component checks, typecheck, lint and
desktop/mobile/RTL visual QA; inspect screenshots before accepting locally.
Kanban, server scope, authorization, schema and dependencies are unchanged.
Local execution completed: component 36/232, fixture visual 15/15, typecheck,
scoped lint/diff and build PASS; lead inspected desktop/mobile captures.
The former next candidates for filters, whole-row entry and media failure
handling are now locally completed in X010-B-7C-14/15 above. Mobile shell/header
and other-surface density remain candidates. Keep these
pending; the row slice does not close the broader UX/owner gates.

This section supersedes older readiness statements below. The owner-feedback
continuation is **not team-trial ready**. X010-B-7C-9A-D have historical local
happy-path evidence; X010-B-7C-11 now has locally verified actual-CLI request
failure recovery, still requiring real-DB/9E rehearsal. X010-B-7C-12 task form
feedback is locally verified including fixture browser/visual checks; valid
save/retry persistence still requires its real-DB browser gate.
X010-B-7C-10 date display has passed focused local tests, typecheck, and lint;
Preview and owner acceptance remain unexecuted. All 20 owner-acceptance items
remain pending. The canonical queue is `tasks.md`; bounded worker ownership
and evidence are in `evidence/delegation-queue.md`.

Recovery work must preserve exact source/run binding, append-only audit and
ledger history, client-role exclusion, and explicit hosted safety gates. Test
rollback restore failure, failed compensation, and reapply-after-rollback
failure against production orchestration without a real network/DB mutation.
Do not infer hosted authorization from completion of local implementation.

## Milestones and exit gates

0. Consolidate Stage 2C evidence and commit corrected baseline. Exit: no hardcoded security success, hydration root cause fixed, blockers explicit.
1. Establish this canonical package and execution spine. Exit: Spec 015 is the only active next-work source.
2. Add persistent versions, approvals, comments, files, SLA segments, idempotency, audit transaction boundaries, and RLS. Exit: clean local migration and DB tests.
3. Replace production fixture reads/writes with scoped Supabase repositories and server commands. Exit: complete persistent lifecycle and no production fixture dependency.
4. Run local acceptance matrix and defect burn-down. Exit: DB-backed MVP green; blocked DB checks prevent acceptance.
5. Prepare hosted UAT handoff only. Exit: bounded prompt and owner decisions ready; no hosted actions executed here.
6. Execute the Owner-Authorized Hosted Team UAT Amendment. Exit: Draft PR, Preview/UAT deployment, Supabase UAT migration/seed, approved team access, hosted workflow/UX checks, rollback validation, and T032 evidence are complete, or an explicit hosted blocker is recorded.

## Design constraints

Use the existing Supabase SSR client, server actions/RPCs, current RLS helper
functions, and existing audit/status workflow patterns. The owner-authorized
rescue completes the `AGENTS.md` stack with React Hook Form + Zod for changed
non-trivial forms, dnd-kit for the governed board interaction, Uppy with
Supabase Storage for files, Tiptap for persistent comments, and TanStack
Query/Table only where the shared persistent source needs them. Review and pin
these dependencies; do not introduce any other technology. Sensitive writes
must be idempotent, server-side, tenant/client scoped, atomic, SLA-aware, and
audited.

## Corrective sequencing

1. Close the generic `f004` approval/delivery bypass in PostgreSQL and UI.
2. Separate `DELIVERABLE_VERSION_SUBMIT` from generic status and management authority, with assignment enforcement.
3. Execute the expanded behavioral pgTAP matrix before any P1 is called fixed.
4. Keep dependency work open as a bounded amendment to this same Spec 015 after P1 and DB-backed acceptance; add no dependency in this corrective task.

## Owner-Authorized Hosted Team UAT Amendment

Status: `HOSTED_TEAM_UAT_READY_FOR_OWNER_TRIAL`. Automated local, database, CI, one-item semantic review-data, and hosted role gates are green; explicit owner human PASS remains the sole X008-H exit gate. The remaining imported Glass items stay internal until real review payloads are added. Production remains blocked.

This hosted amendment is additive to the accepted local baseline. T001-T019 remain historical local acceptance evidence and must not be edited into hosted PASS evidence.

### Hosted execution sequence

1. Complete hosted target, branch, rollback, and stop-condition preflight before any hosted mutation.
2. Fetch remote state, inspect merge base, commit list, diff, migration inventory, generated files, and secret boundary.
3. Use the current branch only if it can produce a clean reviewable PR; otherwise create a preserved integration branch such as `codex/015-hosted-team-uat` without reset, rewrite, force push, or unrelated cleanup.
4. Run the full local verification matrix before push, with typecheck and build sequential.
5. Push the reviewed branch, create a Draft PR, inspect CI, and fix only in-scope failures.
6. Verify Vercel Preview/UAT and Supabase UAT targets before any hosted read or mutation. If the target is ambiguous, shared with Production, mismatched, or unverifiable, stop before mutation.
7. Perform count/category-only hosted data preflight. Do not print row contents, names, emails, deliverable titles, comments, file paths, tokens, or identifiers.
8. Re-run local Supabase reset, RLS DB tests, and persistent E2E before hosted migration. Apply only pending reviewed repository migrations to Supabase UAT.
9. Create minimal run-ID-scoped synthetic Hadna UAT records and approved team access only after target and migration gates pass.
10. Deploy only a Vercel Preview/UAT build from the reviewed branch and verify the hosted app uses Supabase UAT, has no fixture actor query support, and exposes no service-role key to the client.
11. Execute the hosted team UAT journey through the UI using actual UAT Auth sessions. Use scoped read-only DB assertions only after UI actions.
12. Record T032 outcome, defect disposition, rollback rehearsal/no-op validation, and final hosted state without committing hosted URLs, secrets, emails, tokens, or direct identifiers.

### Rollback plan summary

- Deployment rollback: remove or disable only the Preview deployment/alias created by this run, or revert to the previous reviewed Preview deployment if one exists.
- Database rollback: prefer forward corrective migrations for schema issues; never use destructive down migrations against shared UAT; remove only run-ID-scoped synthetic rows created by this task.
- Access rollback: disable only UAT test accounts and revoke only role assignments created by this run.
- Owner authority: the project owner is the approval and stop-decision owner; the executing agent may not expand the mutation boundary.

### Hosted mutation boundary

No hosted mutation may begin until target identity, environment category, data category, migration inventory, rollback owner/window, and stop authority are verified and recorded in redacted form.

## Product Experience Rescue Amendment

Status: the corrective role shells, representative content, audited preparation, exact reviewed Preview, negative checks, and hosted desktop/mobile/RTL role matrix are complete. The sequence is now at its final owner action: perform the human walkthrough and record PASS or defects. Only a PASS may close H008-H010, X007, and T032. Production promotion is not authorized.

Dependency inventory: add only the pinned packages required for React Hook Form,
dnd-kit, Uppy, Tiptap, and TanStack Query/Table after license/security review.
No dependency may weaken the server/RLS boundary or become a source of client
payload leakage.

## Owner-trial workspace rollover correction

Status: `PLANNED_LOCAL_IMPLEMENTATION_ONLY`; tracked by X010-B-7C-9,
S015-P2-128, and S015-P2-139. Reuse and harden the existing X009-B
clean-workspace contract instead of deleting UAT business rows or introducing
a second cleanup architecture. Discovery selects the one shared active source
membership for every approved internal persona while tolerating any number of
historical inactive memberships. A new run ID yields deterministic target,
membership, role, profile-sync, and audit identifiers. Apply provisions and
verifies the empty target, persists a deterministic append-only binding to the
exact source tenant and membership set, and only then disables that source;
later status/replay/rollback processes resolve and validate this binding.
Rollback restores only that source and disables only the target created by the
same run. Both paths preserve source operational rows, files, audit, and ledger
unchanged and remain idempotent with compensation for partial failure.

Implementation order: add failing pure-selection/replay tests; harden the pure
workspace contract and hosted tool; add persistent and pgTAP evidence for
multi-history selection, empty natural entry, client-persona denial,
apply/replay/rollback, and append-only preservation; then run the scoped local
matrix and update evidence. Hosted execution is a separate owner-authorized
gate after exact-HEAD review. No migration or ADR is expected unless repository
inspection proves that the existing model cannot satisfy this contract.
