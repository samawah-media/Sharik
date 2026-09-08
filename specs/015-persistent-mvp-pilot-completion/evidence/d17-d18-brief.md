# D17/D18 approved implementation brief — 2026-09-07

## D18 continuation — LOCAL PASS

D17 / X010-B-7C-18 and D18 / X010-B-7C-19 are LOCAL PASS. Lead six-file
regression session 31896 exited 0: 59 PASS / 25 intentional profile SKIP (5.5m),
including all six D18 cases passing again after the 6 PASS diagnostic (4.4m).
Independent audit and viewed screenshots support acceptance. Lead accepts the
installed Turbopack plus /work warmup for the shared local fixture harness;
no dependency, guard or assertion changes and no proven root-cause claim.
Fresh node check, scoped ESLint and diff check exited 0 (lead-reported).
No local successor is approved. Exact-HEAD CI/target confirmation and owner
walkthrough remain pending; all 20 owner checkboxes remain unchecked.
Completed diagnostic details are retained in the report.
Desktop375 CPU/startup delay remains a hypothesis, not an established cause.
See [diagnostic evidence](d18-report.md#current-shared-harness-checkpoint--2026-09-07).

### Historical diagnostic dispatch — before warmup edit

Owner requested continuation after D17 local acceptance. Reused native Astra
workers investigate disjoint read-only domains: Hubble owns the desktop375
trace/readiness failure; Fermat owns dev-server route warm-up analysis. Lead
owns integration, any shared harness edit, browser processes and docs. No
production, dependency, auth-guard or server-data changes are authorized by
this diagnostic step. No further test tolerance/error filtering is planned.

Baseline HEAD remains 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21; 112 dirty
status entries, no staged changes. Relevant SHA256 before new edits:

- scripts/playwright-webserver.mjs: 9B651986A654441C0B271897C4A49EF523A120E3CAC77888412128A16DFE2099
- tests/e2e/management/drawer-task-density.spec.ts: F1CFC29F2F5092B5D0AEE16676D3149687D4BA1A86DA6B2989946C069596E61A
- playwright.config.ts: AFC23966DC83E558937D611E78E8C8F2118A341A11E3A12572AE8F7472CBA017

Current hypothesis under review: the fixture harness reports ready without
warming /work, so the first drawer case overlaps route compilation and HMR.
This is not yet an accepted explanation of the separate desktop375 failure.
Any bounded correction must retain all geometry, console and permission
checks. All 20 owner acceptance checks and external gates remain pending.

Baseline HEAD 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21; inherited dirty tree.
Preserve existing edits. Canonical requirements: tasks X010-B-7C-18/19,
AGENTS.md and DESIGN.md. User expressly approved two parallel disjoint slices.
Use existing evidence queue instead of a competing SDD roadmap. No commit,
push, deployment, dependencies, global styles, server changes or subdelegation.
Lead owns browser/build processes and docs. Workers may run focused component
tests only, not concurrent full suites/typecheck/build/servers.

## Historical checkpoint and evidence — before warmup diagnostic

Lead-reported checkpoint: both bounded layouts implemented after observed RED
(approve136px >56px; task row152px >120px). Independent spec/quality reviews
found no issues. Full component 38 files / 263 tests PASS. First shared browser
exited 1: 11 PASS / 5 FAIL / 5 intentional SKIP (6.9m). All four D17 geometry
cases, six pending-inbox regressions and D18 desktop1440 passed. Five other
D18 cases failed initial drawer opening before geometry. Reviewed test-only
bounded React readiness correction preserves one click and all geometry;
it does not prove real prehydration click support.
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
Wave-owned verification processes have ended. Final normal git diff check
passed; source changes remain local and unstaged.
All 20 owner checkboxes remain unchecked (lead verified).
Next bounded diagnostic: distinguish Next dev cold-start/HMR effects from
product behavior. The completed build is not production-mode browser
verification. `src/server/navigation/route-fixture-env.ts` disables `as=` actor
fixtures under `NODE_ENV=production`; do not bypass that guard. Subsequent
production-mode browser verification requires an approved authenticated DB
setup and has not been executed. External gates remain pending.
No next fix, dependency upgrade or error filtering is implemented/approved.

Saved evidence: `visual-20260907/approval-panel-desktop-d17.png`,
`visual-20260907/approval-panel-mobile-d17.png`, and
`visual-20260907/drawer-task-desktop-d18.png`. See `d17-report.md`,
`d18-report.md`, `gate-status.md`, and `execution-log.md` for chronology.
All 20 owner checkboxes remain unchecked; no real-DB, hosted/Preview,
exact-HEAD CI, deployment or overall readiness acceptance is established.
Requirements and staged authorization below are retained as the original
approved sequence, not a claim that implementation is still waiting for RED.

## D17 — Fermat

Write scope: tests/component/client/r007-client-approval-panel.test.tsx
(existing), new tests/e2e/client/approval-panel-density.spec.ts. After lead
observes browser RED, src/ui/client/client-approval-panel.tsx layout only.
Initial production SHA256:
166B92A72E0A5B0664D243E977661BAE82065B5D4DC6D547F4A19DECC0E3F280.
First return tests/harness only; do not change production yet.

Reproduce stretched approve button against the real component, desktop1440,
mobile375/412, RTL. Buttons should be 44–56px tall; visible reason input,
no horizontal page overflow, mobile approve-before-change ordering. Prefer
natural top alignment instead of a tall blank approve form; no hidden/collapsed
reason. Preserve hidden payload IDs/revision/idempotency and reason semantics,
viewer/incomplete/no-server-action protections. Tests measure geometry, not
class strings. Avoid duplicate existing behavioral coverage. Reuse guarded
fixture routes; ask lead if additional fixture file ownership is required.
Target showSummary=false normal panel <=270px mobile and <=210px desktop,
but long text must grow, never clip. Capture via testInfo.outputPath.

## D18 — Hubble

Write scope: new tests/component/deliverables/drawer-task-density.test.tsx,
new tests/e2e/management/drawer-task-density.spec.ts. After lead browser RED,
TaskWorkspaceCard layout only in src/ui/deliverables/universal-deliverable-drawer.tsx.
Initial production SHA256:
1664EB5DF92367CDD9DAAE60ACF9F38BC98EA86857CDECD9B56F5399E1CC58D4.
First return tests/harness only; do not change production yet.

Reproduce redundant nested disclosure chrome using real drawer/task forms,
normal collapsed row <=160px mobile and <=120px desktop drawer; >=44px summary.
No clipping fixed height. Preserve all identity/status fields, allow long
Arabic names/titles wrapping. Remove nested decorative border/padding only,
retain outer row grouping and distinguish expanded editor. Preserve native
keyboard disclosure, validation focus, failed values/retry identity and
all canEdit/canReassign/status variants. Mock only server/network boundaries;
no fake TaskForm/status controls for new behavior tests. Reuse existing
fixtures; request extra fixture write ownership if needed.

## Gates and reports

Read current runner scripts before proposing commands. Focused components use
npm run test:component -- <file> --maxWorkers=1. Browser is lead-only using
existing Playwright local fixture configuration. No real DB/hosted actions.
Return <=15 lines: state, files, commands/results, expected failing geometry,
blockers. Full report paths d17-report.md / d18-report.md beside this brief.
Independent spec+quality review after implementation; lead runs combined
components, scoped lint/diff/typecheck, browser desktop/mobile/RTL and build.

## Preflight ownership

| Pair/task | Interface/write-set check |
| --- | --- |
| D17/D18 | Disjoint production and test files; shared ports/build lead-only |
| D17 | Presentation only; all decision fields/actions remain unchanged |
| D18 | Presentation only; full TaskForm remains real and mounted |

Owner-approved parallel execution and inherited dirty-file preservation take
precedence over generic skill serial/fresh-worktree/commit examples. No source
is deleted or reset to comply with generic templates.
