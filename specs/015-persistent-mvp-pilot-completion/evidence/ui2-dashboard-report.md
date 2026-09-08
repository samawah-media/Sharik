# UI2 Task 1 — dashboard implementation

Status: source accepted; lead combined GREEN 25/25 recorded in
[checkpoint](ui2-lead-checkpoint.md). Integrated visual QA remains pending.

Planck source review: ACCEPT, no blockers (reported by lead). Applied its
nonblocking copy suggestion: workload heading is now “المخرجات حسب المسؤول”;
counts and all other behavior are unchanged. Lead combined GREEN session 85518
is running; its result is pending, not claimed here. Worker runtime ownership
is returned to the lead; no new runtime was launched.

## Changes

- `src/ui/management/exception-dashboard.tsx`: calm card hierarchy, `h2`
  “يحتاج انتباهكم” with existing heading ID, explicit current-scoped-snapshot
  subtitle, five preserved operational metrics, status distribution bars,
  readable workload, client delivery cards and recent-decision rows.
- `tests/component/management/exception-dashboard.test.tsx`: 18 cases total;
  2 existing regressions preserved, 4 new aggregate/empty/client/long-text
  scenarios, and 12 individual-status mapping cases.
- This report only. Existing dirty baseline retained; HEAD remains the
  lead-provided `115fb9af5a43b7cbd2a8855c568f89bb86f9fa21` baseline.

## RED evidence and verification ownership

Requested focused command:

```powershell
node node_modules/vitest/vitest.mjs run --project component tests/component/management/exception-dashboard.test.tsx
```

- Worker session 3394 stalled without output and was stopped, exit 1.
  It was not valid RED. No dashboard production edit occurred at that point.
- Lead subsequently reported the isolated threads run: 18 tests, 16 FAIL /
  2 PASS, exit 1, 3.34s, no runtime errors. Expected failures were missing
  “وين وصل الشغل؟” region, `h2`, meters and empty-state wording. This is the
  valid RED used for the explicitly authorized production implementation.
- The exact command/flags for that lead-owned threads invocation were not
  supplied to this worker; do not substitute the requested command as its log.
- No worker runtime launched after that authorization. GREEN and scoped ESLint
  are pending the lead's serial combined checks, not claimed as passed.
- No browser, Next, build, full suite or TypeScript run by this worker for UI2.

## Chart contract and self-review

Status mapping is exhaustive over the existing status type: delivered 1,
waiting-client 1, internal-review 1, inside-team 7, cancelled/archived 2 for
the all-12 fixture. Individual-status tests prevent swapped groups from hiding
behind equal aggregate counts. Overdue remains a separate SLA metric.

Bars expose direct labels, counts and denominators with accessible meters;
their widths are count/total from zero with no minimum-fill fiction. Empty
snapshots/clients render explanatory text instead of zero-denominator meters.
Client bars use delivered/total; the former average-progress bar and misleading
package heading are removed. No trend or historical performance claim.

Self-review retained props, due-soon selection/window, SLA derivation inputs,
all five operational metric definitions, recent status selection/order/limit,
original client/recent destinations, user text and shared components. Responsive
grids use minmax/min-w-0 and wrapping rather than essential-label truncation;
existing 44px ButtonLink targets remain. Browser layout is not verified here.

TDD/test-guard guided independent expectations; clean-code-guard guided the
bounded delta. Visualization guidance is applied to the approved existing SaaS
surface and chart contract, not a separate artifact/runtime.

## Preserved semantic limits and remaining gates

- Workload still groups by display name, counts every non-delivered status
  (including cancelled/archived), and shows the first eight sorted names.
  Identical display names therefore still merge; zero-count owners may remain.
  Its visible wording now says non-delivered and discloses closed statuses,
  rather than mislabeling these counts as active. No workload policy changed.
- Dashboard assumes complete successful scoped reads. PortfolioPage failure
  suppression is the lead's disjoint Task 2; this component performs no reads.
- Existing E2E assertions requiring the old main heading, `h1`, the old
  “تقدم العملاء والباقات” heading or average-progress bar would need review;
  no E2E files were changed. Hydrated 375/1440 visual and keyboard QA remain
  pending; source/component checks cannot establish those results.
- No Spec/ADR edits by worker; UI2 plan is the approved Spec boundary. No new
  technology, dependency, query, SQL, auth, permission, audit or SLA policy.
- AGENTS.md compliance: V1 presentation scope, unchanged isolation/privacy and
  protected operations; no commit/push/deploy, external calls or subagents.
  Owner acceptance and full-app gates remain pending, not waived.
