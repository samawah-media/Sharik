# UI1 runtime diagnostic — 2026-09-08 continuation

Status: full-app verification still BLOCKED before tests. No production or
test-harness edit made during this continuation. No application assertion failed.

## Evidence and bounded experiment

- Read current harness, Next config, root route and proxy. Prior accepted D18
  evidence does not prove a cache cause; its successful comparison changed the
  bundler and warmed `/work`. Those changes are already present in this checkout.
- No listeners were reported on3310/3210/3000/3320 before the experiment.
  Node command-line identity was unavailable/unhelpful; no unrelated process was
  terminated. Absence of listeners is not proof that every compiler is idle.
- Preserved generated `.next/dev` at `.next/dev-ui1-preserved-20260908` after
  verifying both absolute paths remained within this workspace. No deletion.
  Retain the backup; do not overwrite a newly generated cache to roll back.
- Ran the unchanged harness with fresh generated cache, session78988:

```powershell
node node_modules/@playwright/test/cli.js test tests/e2e/management/shell-light-theme.spec.ts tests/e2e/management/mobile-shell-density.spec.ts --project=desktop-chromium --project=mobile-chromium --project=rtl-arabic --max-failures=1
```

- Result: exit1, `Playwright warm-up failed for /: AbortError`, at the existing
  150000ms request bound. No test reached. No assertion/timeout/guard relaxation.
- New log: Next filesystem benchmark reported505ms and emitted its slow-filesystem
  warning. Log-relative times: warning77.808s, compiling proxy88.309s, compiling
  root129.095s. This is evidence of startup delay, not proof of its root cause.
- OS sample reported2578904KB free physical memory out of16453196KB total.
  One sample cannot establish memory pressure as the cause; no app was closed.

Interpretation: the same failure with fresh cache weakens the stale-cache
hypothesis. Cold compilation changes workload; corruption is neither established
nor a valid reason for further blind resets. Do not retry unchanged again.

## Delegation and next diagnostic boundary

Native Astra readonly worker Laplace reviewed historical harness evidence in
parallel with lead runtime checks. It found no source-backed cache cause and
warned that process ownership must not be inferred from empty ports.
Native Astra readonly reviewer Planck scoped UI2 without editing it. Actual
token/cost usage unknown. No external relay, recursive delegation or paid fallback.

Next meaningful runtime step needs an environment change or targeted tracing,
not UI code changes: retry after owner frees machine resources/restarts the local
environment, or separately plan a retained isolated runtime on an approved local
path. Do not terminate unrelated apps, change Defender exclusions, migrate the
workspace, upgrade dependencies or bypass fixture/production guards implicitly.

UI1 is still implemented/source-reviewed, not full LOCAL PASS. Prior component,
isolated visual, tsc and lint passes are historical evidence, not rerun here.
Owner20, hosted/exact-HEAD CI and owner walkthrough remain pending.

## UI2 preparation (not an implementation plan or authorization to bypass UI1)

- Bounded production files: `src/ui/management/exception-dashboard.tsx` and
  `src/app/(management)/portfolio/page.tsx`.
- Reuse DeliverableSafeSummary arrays, clientNames and server now. Preserve
  deriveSlaStatus, scoped reads, guards, links and user-authored text.
- Chart counts must use mutually exclusive statuses across the supplied dataset;
  overdue is an overlapping separate indicator, not an additional status segment.
- Existing client progress is average workflow progress; delivered/total is a
  different measure. Neither represents contract consumption or a historical trend.
- Current portfolio flatMap discards failed client reads as empty arrays. The
  scoped UI2 Spec/plan must distinguish failure from empty success and suppress
  misleading complete totals when input is partial. No query/security redesign.
- Tests to extend: component management/exception-dashboard.test.tsx; E2E
  mvp/three-role-mvp.spec.ts and accessibility/rtl-mobile.spec.ts. Add a scoped
  portfolio-page component test for partial/all read failures before implementation.
- Shared shells/tokens, drawers, client approval, ledger charts, historical trends,
  new dependencies and data cleanup remain outside this minimal UI2 scope.

AGENTS compliance: investigation within approved UI1 verification; no production,
database, permission, SLA, approval or audit changes. Documentation only, no ADR,
commit, push or deployment. User dirty changes preserved.
