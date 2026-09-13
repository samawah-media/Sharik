# UI1 Task 1 — implementation evidence

Current lead verification supersedes the pending lead-check notes below:
see [lead checkpoint](ui1-lead-checkpoint.md). Full-app acceptance stays blocked.

Status: implemented; isolated rendered-component visual checks GREEN. Full-app
browser/hydration/mobile regression remains blocked and is not certified here.

## Scope and baseline

- HEAD: `115fb9af5a43b7cbd2a8855c568f89bb86f9fa21`; existing dirty checkout retained.
- Pre-edit SHA256, also rechecked before production edits:
  - globals.css: `C23A076692AD47DBD057DFEBAB52C442C4BDFBAA0CBE86EE29BD7817AF3B961B`
  - product-shell.tsx: `8C4388C08A62B340897F1F8DF0D6C735A2E0441110FB7AA63F0B41418C60A121`
  - client-shell.tsx: `FB6ACA553186CFF2032C78FCD8C434131710B7B17DF21E9140EDE6984A14113A`
- Changes: `src/app/globals.css`, `src/ui/layout/product-shell.tsx`,
  `src/ui/client/client-shell.tsx`, new `tests/visual/shell-light-theme.test.tsx`,
  new dedicated `tests/visual/vitest.config.ts`,
  this report and four authorized screenshot artifacts.
- No existing tests changed. No commit/push/deploy, dependency, auth, server,
  database, route, permission, approval, notification-state or SLA changes.

## Implementation and self-review

Applied the prescribed light tokens, semantic active/inactive/hover navigation,
accent focus and semantic sign-out surfaces. Kept the global anchor reset and
global focus rule unchanged; unlayered color corrections target shell sidebar
navigation only, and focus-color correction targets sidebar anchors only.

Actual delta reviewed against captured pre-edit file text, not just HEAD.
Preserved props, callbacks, route lists, aria-current, accessible labels,
client canApprove behavior, notification markup, sidebar widths, card/link
sizes, content spacing, status colors, fonts and prior dirty fixes.

Final geometry correction: both shells explicitly use mobile grid rows
`auto minmax(0,1fr)` and reset to one desktop row. Original navigation padding
and overflow classes are restored: no padding inflation. Sidebar navigation
focus outlines use a scoped -3px offset to draw inward without clipping.
Full-app density and horizontal focus-reveal regression remain lead-owned
pending checks.

TDD and test-guard guided real Chromium computed-style assertions rather than
source matching. Clean-code-guard review found no new application logic or
abstractions. Documentation claims were checked against command results.

## RED / GREEN and commands

Current command for isolated verification (requires installed Chromium):

```powershell
node node_modules/vitest/vitest.mjs run --config tests/visual/vitest.config.ts
```

- Lead full-app runs 67392 and 19967: exit 1 during `/` warmup AbortError,
  no test reached; not valid RED. No production changes preceded valid RED.
- Initial worker sandbox run 53635 stopped after no results: exit 1, not RED.
- Native isolated run 67861: exit 1, 4 failed, 62.37s. Real assertions observed
  dark rail `rgb(36, 33, 47)` versus white and old active surface `[109,74,255]`
  versus `[238,233,255]`; one management desktop case also timed out. This is
  the observed isolated RED before production edits, not a full-app RED.
- Bounded installed compiler/Chromium probe: exit 0; compiled 108734 CSS bytes
  and launched/closed Chromium. No test harness or dependency change.
- First implementation: exit 1, 1 passed / 3 failed, 5.79s; remaining failures
  were vertical focus clipping. Subsequent 4px-padding attempts still failed.
- Historical 6px-padding visual run: exit 0, 4 passed, 4.16s; superseded below.
- Screenshot run 59366: exit 0, 4 passed, 9.24s.
- Lead typecheck 94791 reported TS2349 for PostCSS require typing. Corrected to
  `typeof import("postcss").default`, matching installed callable declaration;
  no `any`. Isolated run after typing correction: exit 0, 4 passed, 4.31s.
  Lead typecheck rerun remains pending; worker did not run tsc/build.

### Lead review corrections — final verification

- Verified `.github/workflows/f001-quality.yml` runs component tests before
  installing Chromium. Moved the diagnostic out of the component glob into
  `tests/visual/`; the dedicated config sets repository root, JSDOM, existing
  setup/aliases and only this diagnostic. No workflow/root-config edit.
- Added the lead-requested short-content mobile geometry assertion before
  changing grid rows. Dedicated-config RED: exit 1, 2 passed / 2 failed, 5.97s;
  both 375px shells measured header bottom 571px against the <=200px limit.
- Explicit grid rows initially left management at 206px (exit 1, 3 passed /
  1 failed, 6.23s). Restored original navigation padding and moved focus inward.
- Immediate client focus samples sometimes reported a transient 0px offset.
  The diagnostic now waits two animation frames after native Tab before
  measuring; no React hydration or handler simulation is introduced.
- Final dedicated-config GREEN: exit 0, 4 passed, 4.87s, including <=200px
  mobile header bottom, light rails, actual text/focus contrast and 44px links.
- Final screenshot refresh with `UI1_CAPTURE_GREEN=1` and the current command:
  exit 0, 4 passed, 5.17s. All four PNGs replace the pre-correction captures.
- PostCSS typing remains `typeof import("postcss").default`; installed
  declaration verified. Lead owns the fresh typecheck and combined gates.

Focused regression:

```powershell
node node_modules/vitest/vitest.mjs run --project component tests/component/product-shell.test.tsx
```

Final result after grid correction: exit 0, 11 passed, 2.30s. Earlier worker
regression passed 11 tests in 3.02s. Prior lead baseline 75937 and 96382 also
reported 11 passes; those are baseline evidence, not this implementation pass.
Scoped production `git diff --check`: exit 0; Git emitted LF/CRLF notices.

## Screenshot artifacts

Captured from the final corrected test with `UI1_CAPTURE_GREEN=1`:

- [Management desktop](ui1-visual/management-1440.png)
- [Management mobile](ui1-visual/management-375.png)
- [Client desktop](ui1-visual/client-1440.png)
- [Client mobile](ui1-visual/client-375.png)

These are real shell HTML rendered by Testing Library/JSDOM and displayed
with compiled current globals.css in installed Chromium. Next navigation is
mocked at the existing boundary; browser requests are aborted. They are not
hydrated app screenshots. Existing component tests cover handler interactions.
Lead visual review remains pending.

## Remaining gates and compliance

- No specs/tasks/ADRs edited by worker; lead owns plan amendment. No new ADR
  needed for this presentation-only change using the approved installed stack.
- Shared semantic tokens intentionally affect their existing consumers; this
  isolated shell test cannot certify contrast on every other application view.
- Pending: lead TypeScript/scoped lint, independent review, screenshot review,
  full-app browser GREEN and existing mobile-shell-density regressions.
- AGENTS.md: approved UI1 Spec/plan followed; V1 presentation scope retained;
  tenant isolation, internal privacy, audit and SLA logic untouched. No owner
  acceptance checkbox or deployment/readiness gate is marked complete.
