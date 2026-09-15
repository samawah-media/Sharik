# UI3 verification checkpoint — 2026-09-08

Status: UI3 LOCAL PASS; owner/hosted acceptance remains pending.
Scope: [plan](ui3-plan.md). HEAD115fb9af unchanged; all changes local/unstaged.

## Actual delta

- Drawer: «مساحة المخرج», three mobile/four desktop tab columns, naturally
  wrapping labels and minimum44px targets; compact icon/text missing-media row.
- Version form: «مؤشر النجاح» and «حفظ وإرسال للمراجعة الداخلية» only.
- Exact-baseline diff is in [review package](ui3-review-package.md). No server,
  upload, selection, permission, workflow, SLA, ledger or user-content edits.
- New real VersionContentForm tests cover all edited fields, draft/review
  payloads, failure/retry with retained inputs and all12 editability states.
- New browser test checks geometry, RTL arrows/Home/End, current-version label,
  mounted task draft across tabs, Escape and focus return.

## Executed checks

Worker Turing (native gpt-6-astra medium) reported component RED6 expected
copy failures/19PASS, then GREEN25, expanded GREEN55. Lead inspected actual
source delta and tests rather than relying on the report alone.

Lead browser RED session79725 exited1:375px four tab rows rather than three;
missing-media block144px rather than<=88px. Test also hit two matching version
labels; scope was corrected to the content-heading row, not production code.

Lead combined browser session37878 exited0:12/12 PASS,1.2m, no skipped cases.
Command:

```text
node node_modules/@playwright/test/cli.js test tests/e2e/management/drawer-presentation.spec.ts tests/e2e/management/drawer-task-density.spec.ts --project=desktop-chromium --project=mobile-chromium --project=rtl-arabic --max-failures=1
```

This covers375/1440 in allthree profiles, three mobile tab rows/two desktop
rows, unclipped labels/targets, no horizontal overflow, compact placeholder,
keyboard/focus/mounted task input and existing task-row regression. Existing
task test also checks long DOM-only title/metadata and browser console errors.

- Full components session23532:40files/303PASS, exit0,29.42s.
  `node node_modules/vitest/vitest.mjs run --project component --reporter=dot`
- TypeScript session65968:exit0.
  `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- Scoped diff whitespace check exit0; only existing LF-to-CRLF warnings.
- Scoped ESLint session60681:exit0, max-warnings=0, covering the two production
  files, changed drawer component test and new form/browser test files.
- Browser emitted environment NO_COLOR/FORCE_COLOR warnings; not product errors.
- CLI agent-browser unavailable; existing repository Playwright harness used.

## Visual review and limitations

Herschel (native gpt-6-astra medium,01a08079-a90b-7630-8dee-84b7e341c207)
independently reviewed the exact dirty-baseline delta. Spec compliance and
code/test quality PASS; no actionable P1/P2 findings. It did not rerun tests.
Its runtime/visual verification caveats are resolved by the lead runs above;
real-role/media/upload/hosted caveats remain open as stated below.

Lead viewed [mobile content](ui3-visual/drawer-content-375.png) and
[desktop overview](ui3-visual/drawer-overview-1440.png). Tabs, selected/focus
state and empty preview are readable and compact. The fixture version history
still displays its existing «حالة نسخة غير معروفة» for fixture status `final`;
this wave does not change version-domain labels.

Real image/video, real-role authorization, persistent uploads and submission
are not proved by the fixture browser run. Existing component regressions run,
but do not substitute for hosted tests. Build/exact-HEAD CI were not run here.
All20 owner requirements-quality boxes remain unchecked. UI4 and owner/hosted
gates remain open. The canonical owner walkthrough contains UI3 scenarios as
«لم ينفّذ». No TEAM_UAT_READY, Production or owner-PASS claim.

No ADR or dependency change; AGENTS.md protected boundaries preserved.
No commit, push, deploy or invitations. Model usage/cost not reported: unknown.
