# UI1 — Calm light shell implementation plan

> Workers: use project-delegate and subagent-driven-development, with the
> canonical project ledger and no commits. User explicitly requested parallel
> work; use disjoint ownership. No external relay retries.

Goal: apply the approved calm visual foundation without changing application behavior.
Architecture: reuse existing ProductShell and ClientShell and semantic CSS tokens.
Tech stack: installed React, Tailwind, Lucide, Vitest and Playwright; no additions.
Spec: ../spec.md, approved visual implementation section; ui-research-20260908/prototype.html.

## Global constraints

- Presentation only; no server actions, permissions, route guards, database,
  financial quantities, SLA, approvals, notification state or auth changes.
- Preserve existing dirty work. Baseline HEAD 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21.
- No commit/push/deploy/dependency changes. Existing owner 20 remain unchecked.
- Keep mobile density, RTL navigation, >=44px targets and keyboard focus reveal.
- No synthetic metrics, sample artwork or personal sample names in production.

## Task 1: bounded shell implementation

Owned files: src/app/globals.css, src/ui/layout/product-shell.tsx,
src/ui/client/client-shell.tsx. May add tests/component/shell-light-theme.test.tsx.
Lead owns browser test tests/e2e/management/shell-light-theme.spec.ts and docs.
Existing tests/component/product-shell.test.tsx is read-only regression evidence.

Consumes: existing ProductShell props and ClientShell canApprove/notifications.
Produces: same public interfaces and routes, restyled shell surfaces.

- [ ] Lead adds browser RED: actual sidebar is white; inactive/active navigation
  text and focused outline have >=4.5:1 / >=3:1 contrast against real surfaces.
  Active state remains aria-current=page and not color-only. Assert 44px targets.
- [ ] Observe RED before production edits. Worker waits for lead's RED signal.
- [ ] Use tokens: background #f7f8fc, foreground #242136, muted #635f72,
  border #e6e3ee, accent #6340df, accent-soft #eee9ff, focus #6340df,
  shell #ffffff, shell-foreground #242136, shell-muted #635f72,
  shell-border #e6e3ee. Keep status tokens and existing font unchanged.
- [ ] Replace dark-shell white/opacity hover/focus assumptions in both shells:
  active uses accent-soft background and accent text, inactive uses shell-muted
  and readable hover, focus uses accent, sign-out surface uses semantic colors.
  Preserve widths, spacing, routes, callbacks, props and accessible labels.
- [ ] Run focused component regression:
  node node_modules/vitest/vitest.mjs run --project component tests/component/product-shell.test.tsx
- [ ] Lead runs browser GREEN and existing mobile-shell-density regressions,
  views screenshots, checks TypeScript/scoped ESLint and independent review.

## Task 2: readonly validation sidecar

Read current mobile-shell-density tests and approved prototype. Return exact
existing coverage to run plus missed risks for shell contrast/focus/roles.
No writes, processes, browser servers or delegation. Runs alongside lead test work.

## Preflight / ownership ledger

| Tasks | Shared interface/file | Decision |
| --- | --- | --- |
| Worker / lead | globals.css vs browser expectations | Worker waits for observed RED; one browser owner (lead). |
| Worker / sidecar | shells read by sidecar | Sidecar readonly, no mutation or shared test output. |
| Task 1 | plan colors vs real browser checks | Contrast and light surface checked in browser, not source-string tests. |
| Task 2 | no production output | Advice only, cannot certify tests or authorize scope expansion. |

Ruling: retain current dirty feature checkout with one scoped source writer and
readonly sidecar, as project-delegate permits; clean HEAD would omit required
prior fixes. Preserve SHA/text baseline for attributable deltas. No git changes.

## Runtime diagnostic amendment

Normal browser runs 67392 and 19967 both exited 1 before any test: warm-up `/`
aborted at 150s. Next logs stopped at proxy/root compilation; cause not proven.
No production edits were made. Component baseline passed 11/11 (75937, 96382).

Ruling: avoid changing the existing server harness. Worker may add the owned
component test using real rendered shell HTML and compiled current globals.css
in installed Playwright Chromium. Next navigation is a mocked framework boundary,
not an application route proof. Observe light-rail RED there before source edits,
then GREEN. This scopes typography/focus verification independently of Next's
startup problem; it cannot pass the pending real-app regression gate. Lead's
normal E2E spec remains the integrated test to run when the server is usable.

Lead yields browser ownership to worker for this isolated check. No simultaneous
runtime/build tests. No new packages or external requests. If isolated compilation
also fails, report exact blocker rather than changing app behavior to suit tests.

Status: implementation complete within UI1 scope after isolated RED/GREEN;
independent source review accepted. Full-app visual gate remains blocked.
See [lead checkpoint](ui1-lead-checkpoint.md) for current verification and resume.
Model usage/cost unknown unless reported.

Integrated follow-up 2026-09-08: brand outline regression reproduced at375
(top=-2px), then fixed by extending the existing inset focus offset to sidebar
brand anchors. Isolated4/4 and integrated28/28 executed cases passed;20 profile
exclusions are intentional. Source review accepted. See
[recovery evidence](ui2-recovery-checkpoint.md); owner/hosted gates remain open.

## Lead review corrections during implementation

1. CI runs component tests before Chromium installation. Keep that gate browser-
   free: move isolated visual test to tests/visual/shell-light-theme.test.tsx,
   with dedicated tests/visual/vitest.config.ts. Same installed stack, no CI or
   dependency change. Run with `node node_modules/vitest/vitest.mjs run --config tests/visual/vitest.config.ts`.
2. Short-content mobile screenshot showed a stretched rail (~473px), not compact
   chrome. Assert header bottom <=200px at375 and use explicit mobile grid rows
   auto/minmax(0,1fr), reset on desktop, preserving actual navigation dimensions.
3. Fix callable typing for installed PostCSS; no any-cast suppression.

Ruling: these are necessary integration/geometry fixes inside UI1, not new product
features. Cost if wrong: additional layout regression checks, not data mutations.
Worker owns the two added tests/visual paths and removes its temporary component
test only. Lead owns all existing tests and docs. No original user file deletion.
