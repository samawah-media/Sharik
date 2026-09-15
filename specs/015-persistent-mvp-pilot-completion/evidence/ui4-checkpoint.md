# UI4 verification checkpoint — 2026-09-08

Status: UI4 LOCAL PASS; owner/hosted acceptance remains pending.
Scope: [UI4 plan](ui4-plan.md). HEAD115fb9af unchanged; local dirty work preserved.

## Actual delta

- Client review opts into full title/caption; other ContentPreviewCard consumers
  retain their two/three-line default. Text selection and uploaded media unchanged.
- Review preview precedes decision on mobile; lg two-column RTL review area.
- Decision shows the existing human version label, «اعتماد النسخة», and
  «وش التعديل المطلوب على النسخة؟». Read-only/nonactionable summary says «للاطلاع».
- Hidden fields, actions, revision/idempotency keys, permissions, required500
  reason, comments/files, SLA and persistence are unchanged.
- Exact pre-UI4 dirty-baseline delta: [review package](ui4-review-package.md).

## Executed checks

- Harvey native Astra medium reported RED14fail/25pass, then focused GREEN39/39.
- Follow-up added missing-review-payload guard coverage and corrected the old
  work-board negative button locator. Final focused6files/49PASS, worker-reported.
- Lead full components session62457:41files/316PASS, exit0,121.10s.
- Final full components after all test follow-ups: session9859,41files/317PASS,
  exit0,35.65s (`node node_modules/vitest/vitest.mjs run --project component --reporter=dot`).
- Initial TypeScript session17526 failed on missing required statusLabel in
  the new test fixture, not production. Corrected; session2183 exit0 with
  `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Scoped ESLint exit0, max-warnings=0: three production files, client component
  tests, preview component test, visual files, client E2E, visual-qa and hosted
  persona smoke locator updates. Hosted tests themselves were not executed.
- Isolated real ContentPreviewCard + compiled project CSS:2/2PASS at375/1440,
  session33620,11.26s. Checks full/default long-title/caption geometry and overflow.
  This is not Next hydration or a persisted client version.
- Expanded isolated run:6/6PASS,5.96s, including real ClientDeliverableDetail
  approver/viewer at375/1440, geometry, controls, full text and neutral viewer copy.
- Final TypeScript session85272 exit0 after expanded visual tests.
- Final follow-up ESLint session66835 exit0, max-warnings=0.
- Rawls native Astra medium independently reviewed the exact production delta
  and specified component/visual tests: PASS, no actionable production regressions.
  Source-only review; runtime and owner gates remain separate.

## Integrated browser gate

First attempt session94624 failed before any scenario: root warm-up / exceeded
the harness timeout (AbortError). Full component suite was running concurrently;
causation is unproven. No source/harness/cache change made to hide the failure.
Serial retry session33505 started after competing component/typecheck work ended.
It reached tests:2PASS,1FAIL,2profile skips,55notrun. Existing card-navigation
assertion timed out at5s while Next logged compilation of the dynamic detail route.
Only that exact-URL assertion was given a bounded30s wait; no expected URL,
permission, content assertion, application source or runtime harness was changed.
Rawls reviewed the follow-up test changes and accepted their scope/assertions.

Final combined session50295:51PASS,9intentional profile skips,exit0,1.3m.
The skipped cases select mobile sizes only on the mobile project and desktop
sizes on desktop/RTL; they are not pending owner tests or failed scenarios.
Command covers approval-panel-density, pending-inbox, r007-client-portal-readiness
and client-work-experience under the existing three Playwright profiles.

```text
node node_modules/@playwright/test/cli.js test tests/e2e/client/approval-panel-density.spec.ts tests/e2e/client/pending-inbox.spec.ts tests/e2e/client/r007-client-portal-readiness.spec.ts tests/e2e/client/client-work-experience.spec.ts --max-failures=1
```

Lead viewed the integrated [375px decision](ui4-visual/client-review-375.png)
and [1440px review](ui4-visual/client-review-1440.png): readable version/controls,
preview-before-decision mobile order, side-by-side desktop, no horizontal clipping.
Also inspected the isolated long-text viewer image; no decision controls and
no truncated review text. [412px full page](ui4-visual/client-review-412-full.png).

The density test includes a DOM-only long-title stress case; app fixture has no
caption. The isolated component test supplies caption coverage without changing
application fixtures. Fixture actions are no-ops, not persistence verification.

## Open gates and boundaries

All20 owner requirements-quality boxes remain unchecked. UI4 scenarios are in
the existing owner walkthrough as «لم ينفّذ». Real-role/hosted/persistent decisions,
actual media, exact-HEAD CI/build and owner acceptance are not claimed.
No TEAM_UAT_READY, production claim, commit, push, deploy, dependency or ADR change.
AGENTS.md protected behavior remains unchanged. Native delegation used;
external providers not retried, model token usage/cost unknown.

## Changed-file inventory for this slice

Production: src/ui/client/client-approval-panel.tsx,
src/ui/client/client-deliverable-detail.tsx,
src/ui/deliverables/content-preview-card.tsx.
Component tests: client/{r007-client-approval-panel,client-deliverable-review,
client-pending-inbox,client-deliverable-dates,client-work-board}.test.tsx and
deliverables/content-preview-card.test.tsx under tests/component.
Browser tests: tests/e2e/client/{approval-panel-density,client-work-experience,
pending-inbox,r007-client-portal-readiness}.spec.ts; button-label consistency only
in tests/e2e/visual-qa.spec.ts and tests/e2e-hosted/hosted-persona-smoke.spec.ts.
Isolated tests: tests/visual/content-preview-review.test.tsx and vitest.config.ts.
Docs: Spec015 spec/plan/tasks, owner-acceptance-walkthrough-ar.md,
delegation-queue.md, UI4 plan/checkpoint/review package/screenshots, PROJECT_PROGRESS.md.
No ADR added or updated. Other pre-existing dirty files are not UI4 changes.
