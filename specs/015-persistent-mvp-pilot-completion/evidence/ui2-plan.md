# UI2 — dashboard implementation plan

> Agentic workers: use project-delegate and subagent-driven-development with
> this canonical ledger, TDD and independent scoped review. No commits.

Goal: ship the approved calm Saudi dashboard presentation using real scoped
data, without hiding read failures or changing operational/security policy.
Architecture: retain PortfolioPage scoped read boundary and the existing
ManagementExceptionDashboard props. Page suppresses dashboard if any read fails;
dashboard receives only complete successful snapshots. No new service or query.
Stack: existing React/TypeScript/Tailwind/Lucide/Vitest; no dependencies.
Spec: ../spec.md approved UI section; ui-research-20260908/handoff.md and voice-guide.md.

## Owner decision and constraints

Owner explicitly requested UI2 implementation now and machine restart afterwards.
This supersedes the execution dependency on UI1 browser GREEN, not its acceptance
gate. No Next/browser warmup rerun this turn. Full app, owner20 and UAT stay pending.
Preserve tenant/client isolation, guards, auth, audit, SLA calculation, domain
transitions, user text, routes, contracts/ledger and existing dirty changes.
No commit/push/deploy, external relay, package changes, shared shell/token edits.
Use the existing application surface; chart guidance does not replace this SaaS
with a standalone analytics artifact or install a second chart runtime.

## Chart contract

Question: how are visible scoped deliverables distributed now, and how many were
delivered for each visible client? Current snapshot only, no historical claim.
Form: directly labeled horizontal bars, zero baseline, explicit counts/denominator.
Groups are mutually exclusive and exhaustive over the12 current statuses:

- تم التسليم: delivered.
- بانتظار العميل: waiting_client_approval.
- للمراجعة الداخلية: ready_for_internal_review.
- داخل الفريق: not_started, in_progress, internal_changes_requested,
  internally_approved, client_changes_requested, client_approved, ready_for_delivery.
- ملغي أو مؤرشف: cancelled, archived.

Overdue is separate overlapping SLA indicator, never another segment. Single
accent root plus neutral track; direct labels/counts supply non-color encoding.
No fake minimum bar width. Zero input shows honest empty state, not a100% chart.
No broader query for denser charts: permission-scoped current snapshot is the
data boundary. For sparse input retain exact labels and counts without trends.
Client delivery bar uses delivered/total, not average progress or package usage.
Existing average progress may remain only under explicit separate wording.
Responsive375/1440; no forced widths, truncated essential labels or color-only key.
Final hydrated visual QA deferred by owner; component/static evidence is separate.

## Task1 — dashboard (delegated writer)

Files: src/ui/management/exception-dashboard.tsx;
tests/component/management/exception-dashboard.test.tsx;
evidence/ui2-dashboard-report.md (relative to this evidence directory).
Consumes unchanged deliverables: DeliverableSafeSummary[], clientNames:
Record<string,string>, now:string. No new required props.

- [x] Add behavioral tests first: all12 statuses sum to12 once; delivered count1,
  internal group7, internal review1, waiting1, closed2. An overdue in_progress
  remains one inside-team item, not extra total. Test zero input, long user names,
  preserved links and visible accessible labels/counts. Hand-derived expectations.
- [x] Run focused component test; record intended RED before production edits.
- [x] Implement dashboard hierarchy: concise heading `يحتاج انتباهكم`, retain5
  operational metrics, add status bars, readable workload/client/recent sections.
  Use existing palette, rounded quiet surfaces, restrained Lucide if helpful.
  Keep recent heading `أحدث القرارات والتسليمات` and original destinations.
- [x] In per-client section show explicit delivered/total delivery bar and clearly
  separate average workflow progress if retained. Do not label it package usage.
- [x] Run focused GREEN and scoped lint. Self-review, report exact results and
  unexecuted browser QA. Do not edit existing E2E yet; report affected assertions.

Command: `node node_modules/vitest/vitest.mjs run --project component tests/component/management/exception-dashboard.test.tsx`.

## Task2 — complete-read boundary (lead, disjoint files)

Files: src/app/(management)/portfolio/page.tsx;
new tests/component/management/portfolio-page.test.tsx.
No dashboard prop change: use a branch before rendering the dashboard.

- [x] Test successful empty, complete nonempty, partial failure, all failure and
  thrown read. Mock read/runtime external boundaries; render actual page/dashboard.
  Assert generic alert and absent summary/chart on failure; assigned-client links
  remain available. No resource names/errors leak through the generic alert.
- [x] Observe RED, then preserve individual read results using the existing calls:

```ts
const results = await Promise.allSettled(visibleClients.map((client) =>
  listScopedDeliverables({ tenantId: client.tenantId, clientId: client.id })));
const unavailable = results.some((result) =>
  result.status === "rejected" || !result.value.ok);
```

Render a role=alert region on unavailable: `ما قدرنا نحمّل ملخص الأعمال.` and
`الأرقام غير متاحة الآن. تقدر تفتح مساحة العميل أو تعيد تحميل الصفحة.`
Never render partial aggregate as complete, never pass raw error text. Existing
client links stay. Successful empty reads are distinct from failed reads. The
existing zero-client guard still renders NoAssignedClientState before reads;
it is not a successful empty dashboard. Retain all guards.
- [x] Focused GREEN, then combined component suite/typecheck/scoped lint once.

## Preflight, ownership and acceptance

| Pair/task | Shared interface | Finding |
| --- | --- | --- |
| Task1/Task2 | Existing dashboard props | Unchanged; disjoint source/test files |
| Task1 | Chart counts vs actual state |12-status contract; overlapping SLA excluded |
| Task2 | Missing reads vs numeric zero | Suppress entire summary; keep scoped links |
| Both | Test processes | Worker owns first focused cycle; lead waits to run own |

Ruling: keep current dirty feature checkout and canonical evidence, not a clean
HEAD worktree that omits prior fixes. Exact pre-UI2 baseline saved; review UI2 delta
only. Cost if wrong: local rework, no shared-state or data mutation.
Ruling: owner permits UI2 ahead of browser verification. Cost: cumulative UI1/UI2
browser regressions remain a release gate, not silently waived.

- [x] Independent spec/quality review of scoped source and task evidence.
- [x] Update canonical owner walkthrough with UI2 scenarios, all unexecuted.
- [x] Record checks and remaining owner/hosted QA in recovery checkpoint.
Usage/cost unknown. Further drawer/client slices outside this turn.

Implementation and independent source review completed; focused GREEN 25/25.
Typecheck failed in generated `.next/dev/types/validator.ts`; scoped lint was
stopped after a bounded no-output wait. Both must be rerun after restart.
Full component regression and integrated visual/owner acceptance remain pending.
See [restart checkpoint](ui2-lead-checkpoint.md), not historical UI1 pass counts.

Post-restart results supersede the preceding pre-restart failures: focused25,
component286, integrated dashboard6 PASS; TypeScript/scoped lint exit0. Lead
reviewed375/1440 screenshots. This is scoped LOCAL verification only; owner20,
hosted/real-auth and long-name browser QA remain open. See
[recovery checkpoint](ui2-recovery-checkpoint.md).
