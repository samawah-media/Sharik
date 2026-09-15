# D18 / X010-B-7C-19 — LOCAL PASS

## Current shared-harness checkpoint — 2026-09-07

D17 / X010-B-7C-18 and D18 / X010-B-7C-19 are LOCAL PASS. Lead six-file
regression session 31896 exited 0: 59 PASS / 25 intentional profile SKIP (5.5m),
including all six D18 cases passing again after the 6 PASS diagnostic (4.4m).
Independent audit and viewed screenshots support acceptance. Lead accepts the
installed Turbopack plus /work warmup for the shared local fixture harness;
no dependency, guard or assertion changes and no proven root-cause claim.
Fresh node check, scoped ESLint and diff check exited 0 (lead-reported).
No local successor is approved. Exact-HEAD CI/target confirmation and owner
walkthrough remain pending; all 20 owner checkboxes remain unchecked.

Lead supplied the independent Hubble audit: all six diagnostic metrics show
row height 110px, summary height 44px and `errors: []`. Lead viewed desktop,
mobile and mobile-stress screenshots copied to
`visual-20260907/*-d18-turbopack.png`. Fresh lead-run `node --check`, one-file
ESLint and `git diff --check` each exited 0. The completed broader regression
and independent audit now support local closure, not external acceptance.

### Final regression command, output and operational decision

Exact lead-launched six-file command from repository root:

```powershell
$env:APP_ENV='test'
$env:NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:54321'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='local-e2e-publishable-key'
$env:PLAYWRIGHT_HTML_OUTPUT_DIR='playwright-report/d18-regression'
npm run test:e2e -- tests/e2e/visual-qa.spec.ts tests/e2e/management/mobile-shell-density.spec.ts tests/e2e/management/team-directory-density.spec.ts tests/e2e/client/approval-panel-density.spec.ts tests/e2e/client/pending-inbox.spec.ts tests/e2e/management/drawer-task-density.spec.ts --output=test-results/d18-regression
```

Lead session 31896: exit 0, **59 passed / 25 intentional profile skips (5.5m)**;
all six D18 cases repeated PASS. Earlier unchanged D18-only diagnostic:
exit 0, **6 passed (4.4m)**. Together with independent metrics/screenshot
review, these are the two GREEN runs supporting local acceptance.

Operational rationale: the inherited explicit webpack dev harness continued
to fail after route warmup alone. The same installed Next toolchain using
explicit `--turbopack` plus the `/work?as=assigned_internal_a` warmup passed
both the focused cases and broader shared-harness regression. Lead accepts
this local fixture harness configuration; no new ADR is required for this
operational choice within the installed toolchain. This comparison does not
prove the underlying HMR/readiness root cause. No dependency, fixture guard,
production behavior or assertion change is part of the harness correction.

If future regression requires rollback, revert only these two owned harness
lines: remove the added `/work?as=assigned_internal_a` warmup entry and restore
`--webpack` in place of `--turbopack`. Preserve all other inherited changes;
rollback is not performed here and would require renewed verification.
Fixture geometry and DOM-only text stress do not prove persistence, real-DB
authorization or production-mode behavior. Production actor fixtures remain
forbidden; approved authenticated setup is required for external browser QA.
No approved local successor, commit or deployment. Exact-HEAD CI/target
confirmation and owner walkthrough remain pending; all 20 owner checks stay
unchecked.

## Completed warmup-only and Turbopack diagnostics — history

Warmup-only run 17330 ended exit 1: 5 PASS / 1 FAIL (5.9m). RTL1440
failed the 30s readiness poll; four HMR router-initialization exceptions were
observed **after the poll failure**. This chronology is distinct from the
earlier desktop1440 pre-click trace below. Warmup alone was insufficient.
Lead-reported `node --check` and one-file ESLint both passed, exit 0.
The subsequent Turbopack diagnostic passed all six unchanged cases, exit 0
(4.4m); this supports broader comparison, not a proven root cause or adoption.

Lead delegated the one-line warmup edit: `/work?as=assigned_internal_a`
after `/` in `scripts/playwright-webserver.mjs` routesToWarm. Baseline SHA256
verified before editing: `9B651986A654441C0B271897C4A49EF523A120E3CAC77888412128A16DFE2099`.
Warmup-only script SHA256 at that checkpoint: `439856DA0260EC28B062CBE46D7B25BBE478E97316F64674E7DA366B78BCB6ED`.
The previous failed six-case run is regression RED; no assertion was changed.

Completed run 17330 used `--trace=on`
and `--output=test-results/d18-warm`. Warmup returned
HTTP 200 and consumed the full body in **13,797ms before readiness**.
This tested moving cold route compilation ahead of browser startup;
the failed result did not establish prevention or a root cause.
Desktop375 trace review suggests CPU/startup delay, not demonstrated blocked
chunks or route drift; this remains a hypothesis, separate from the confirmed
pre-click desktop1440 HMR error recorded below.

Read-only SHA256 verification confirms unchanged files:

- D18 browser test: `F1CFC29F2F5092B5D0AEE16676D3149687D4BA1A86DA6B2989946C069596E61A`.
- D17 production panel: `520407C4AD9BB7FFF86105E3362AD3B801830D68979FD7E1147DA9252F8725D1`.
- D18 production drawer: `B2DBDB8B6C6EB1950582E65F31707E3DFE7AD417B07589A3D8B2505D4F9F4133`.

At that diagnostic checkpoint D18 was implemented, verification-pending and
unchecked; superseded by local closure above. D17 was LOCAL PASS, and all 20
owner checks remained unchecked. No dependency upgrade,
error filtering or production fixture-guard bypass. Production-mode browser
verification still requires approved authenticated DB setup; external gates
remain pending. Lead owns runtime and final results.

## Historical checkpoint — before warmup diagnostic, lead-reported

Both D17/D18 layouts implemented after RED; independent spec/quality reviews
found no issues. Full component 38 files / 263 tests PASS. First shared browser
exited 1: 11 PASS / 5 FAIL / 5 intentional SKIP (6.9m). D17 all four geometry
cases and six pending-inbox regressions PASS; D18 desktop1440 PASS. Five other
D18 cases failed initial drawer opening before geometry. Reviewed bounded
React readiness test-only correction retains geometry and makes no real
prehydration-click claim.
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
D17 desktop/mobile and D18 desktop
images saved in visual-20260907. All 20 owner checks remain unchecked;
real-DB/hosted/CI/deployment acceptance remains pending.

## Worker implementation history

- Lead confirmed browser RED: collapsed desktop task row 152px >120px, exit 1; remaining steps passed. Layout implementation then authorized.
- Production change is restricted to TaskWorkspaceCard: no nested closed-state border/padding, compact outer vertical spacing, naturally wrapping identity, 44px native summary, editor separator visible only when expanded. No measured savings claimed before browser GREEN.
- Added `tests/component/deliverables/drawer-task-density.test.tsx`: real drawer/forms/status controls, edit/reassign/own-status/read-only variants, identity fallback, disclosure error focus, retained failed inputs and identical retry payload/key.
- Added `tests/e2e/management/drawer-task-density.spec.ts`: existing guarded `/work?as=assigned_internal_a` fixture; 1440/375px, collapsed-row geometry, 44px summary, keyboard disclosure, invalid-title focus, no overflow/title clipping, console/page-error capture.
- Focused command: `npm run test:component -- tests/component/deliverables/drawer-task-density.test.tsx --maxWorkers=1`.
- Post-layout focused result: 1 file / 6 tests PASS, exit 0 (139.82s; assertions 2.95s); includes positive date/status regressions. Component results do not prove geometry GREEN.
- Browser not run by worker. Lead must verify <=120px desktop / <=160px mobile on normal rows after this correction.
- Browser attachments: `drawer-task-metrics.json`, `drawer-task-collapsed.png`, `drawer-task-browser-errors.json` via test output paths.
- Component assertions now positively require Arabic due date, selected status and read-only status badge.
- Browser DOM-only stress replaces rendered title/metadata text after baseline checks; asserts multi-line wrapping, no clipping/overflow and status >=44px. This is not persisted/fixture data. No backend fixture changes.
- Production baseline SHA256 `1664EB5DF92367CDD9DAAE60ACF9F38BC98EA86857CDECD9B56F5399E1CC58D4`; layout SHA256 `B2DBDB8B6C6EB1950582E65F31707E3DFE7AD417B07589A3D8B2505D4F9F4133`.
- No server/build/browser/full-suite/typecheck/DB/hosted/commit/delegation actions by worker. Shared results are lead-reported. Inherited edits preserved.

## Lead browser follow-up

- Shared run ended exit 1: 11 passed / 5 failed / 5 skipped (6.9m). D18 desktop1440 geometry passed; five D18 cases stopped before geometry because the drawer was absent after the initial click.
- Read-only desktop375 trace: click completed at 353121ms; React DevTools initialization message appeared at 355167ms; drawer remained absent through the 5s assertion. This supports a readiness race but does not directly prove hydration state at click time.
- Test-only correction reuses visual-qa's 30s bounded `__reactProps$` readiness poll on the exact opening button before one click. No sleep, reclick, visibility timeout increase, production change or relaxed geometry.
- Corrected six-case browser rerun ended exit 1: 4 PASS / 2 FAIL (9.4m), detailed above; unexecuted by worker. This harness gate does not establish that real user prehydration clicks work or that the product has no hydration race.

## Exact desktop1440 trace evidence — Hubble inspection, lead supplied

In this case's `trace.zip`, entry `0-trace.trace`: pageError at
301870.711ms; first drawer click at 318653.053ms. The error occurred
16,782.342ms before the click. Stack in node_modules Next:
`WebSocket.handleMessage` (`web-socket.js:91`) → `processMessage`
(`hot-reloader-app.js:299`) → `hmrRefresh` (`app-router-instance.js:328`)
→ `dispatchAppRouterAction` (`use-action-queue.js:50`).
This confirms a pre-click HMR failure for THIS desktop1440 case only, not a
failure caused by the drawer click. Desktop375's readiness failure is separate;
its cause remains unproven. No additional production correction was made.

Additional saved and lead-viewed images:
`visual-20260907/drawer-task-mobile-d18.png` and
`visual-20260907/drawer-task-mobile-stress-d18.png`.
