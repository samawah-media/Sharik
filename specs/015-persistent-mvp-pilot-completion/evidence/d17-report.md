# D17 — local PASS; external and owner gates pending

State: minimal layout correction implemented after RED; independent reviews found no issues. Lead full component 38 files / 263 tests PASS. First shared browser exited 1 overall (11 PASS / 5 FAIL / 5 intentional SKIP, 6.9m), but all four D17 geometry cases and six pending-inbox regressions passed. D18 desktop1440 passed; five other D18 cases failed initial drawer opening before geometry. Reviewed bounded readiness correction is test-only. No real-DB/hosted/CI/deployment acceptance.

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

D17 images saved: `visual-20260907/approval-panel-desktop-d17.png` and `visual-20260907/approval-panel-mobile-d17.png`. D18 desktop image: `visual-20260907/drawer-task-desktop-d18.png`.

## Scope and baseline

- Updated `tests/component/client/r007-client-approval-panel.test.tsx`; initial SHA256 `B29F888B39EF68A7751836E6A159FDC2FC90821B796E374BB0EBEBD14FFBF90C` (baseline diff empty).
- Added `tests/e2e/client/approval-panel-density.spec.ts`; file absent at baseline.
- Production baseline SHA256 `166B92A72E0A5B0664D243E977661BAE82065B5D4DC6D547F4A19DECC0E3F280` was confirmed before editing. Current SHA256: `520407C4AD9BB7FFF86105E3362AD3B801830D68979FD7E1147DA9252F8725D1`.
- Sole production change in `src/ui/client/client-approval-panel.tsx`: add `sm:items-start` to the two-form grid. No shared Button changes, extra width/alignment utilities, form/payload changes or mobile ordering changes.
- Preserved inherited edits. No route, fixture, server, schema, dependency, global style or canonical documentation changes.

## Tests and evidence

Component additions verify separate decision forms, exact hidden IDs/revision/idempotency/action/reason fields, required reason and 500-character constraint, and non-actionable/no-server-action protections. Existing viewer coverage remains.

Browser tests use the existing guarded `/client/pending?as=client_approver_a` fixture with real panel rendering. They measure 1440px desktop and 375/412px mobile, RTL, button heights 44–56px, normal summary-free panel height <=210px desktop / <=270px mobile, visible reason, top alignment, mobile ordering, keyboard order, no page overflow and reason preservation across resize. Screenshots use `caret: "initial"`; metrics and images use `testInfo.outputPath`/attachments. Irrelevant project/viewport combinations are intentionally skipped.

Historical lead-reported browser RED: exit 1, approve button measured 136px against the 56px maximum; other test steps passed. The approved brief's top alignment supersedes the earlier audit's bottom-alignment proposal. Browser tests also capture console errors/page errors and assert none, without filtering. Post-fix D17 results are recorded in the current checkpoint above; combined integration remains open.

## Commands and limitations

- Executed focused component command: `npm run test:component -- tests/component/client/r007-client-approval-panel.test.tsx --maxWorkers=1`; exit 0, 1 file / 5 tests passed (72.01s).
- Post-implementation same focused command: initial attempt exit 1 before any tests (Vitest fork worker startup timeout, 60.34s); unchanged-command retry exit 0, 1 file / 5 tests passed (48.97s).
- Scoped Prettier and `git diff --check` completed successfully for the test files.
- Lead-only browser command: `npm run test:e2e -- tests/e2e/client/approval-panel-density.spec.ts` using existing `playwright.config.ts` fixture harness.
- No browser/server/build/typecheck/full suite, provider, DB, hosted action or delegation executed by this worker; shared results above were supplied by lead.
- Fixture decisions are no-ops; these checks do not establish persistence/security integration. The normal fixture has short labels; long reason preservation is checked, but long-title rendered geometry is not covered by this fixture.
- Lead owns canonical docs and integration. TDD/test-guard kept geometry in the browser and payload preservation in real components; the accepted minimal recipe keeps the production fix to one responsive class. Docs-guard limits this report to observed results.
