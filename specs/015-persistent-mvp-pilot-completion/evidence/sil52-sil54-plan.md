# SIL-52 / SIL-54 Implementation Plan

**Goal:** Correct the two Madar UAT blockers and preserve honest acceptance evidence.

**Architecture:** Retain the existing current-version mutation boundary; add a separate published-snapshot read boundary. Correct consumption-to-reservation conversion identically in TypeScript and SQL without changing ledger history.

**Tech stack:** Existing Next.js, TypeScript, Supabase/PostgreSQL, Vitest and pgTAP only.

**Spec:** [Spec015 amendment](../spec.md), [ADR-013](../../../docs/06-decisions/ADR-013-retained-client-review-snapshot.md).

## Global constraints

- Preserve tenant/client isolation, internal content secrecy, exact-version decisions, audit and SLA contracts.
- No historical migration edits, manual ledger correction, dependency changes, credentials in evidence, commit/push/deployment by workers.
- Use the current dirty checkout with disjoint native-worker ownership; preserve the [baseline manifest](sil52-sil54-baseline.json). Existing source context must not be replaced with clean HEAD.
- The actual Madar UI/database failure is pre-fix reproduction, not an automated pgTAP pass. Local Docker is unavailable. SQL RED/GREEN, exact-source CI and hosted publication remain mandatory before accepting a deployed fix.

## Task 1 — Retained version read policy (Erdos)

Allowed new files: `supabase/tests/database/s015_sil52_retained_client_version.test.sql`, `supabase/migrations/202609100001_s015_sil52_retained_client_version.sql` and its worker report. Existing migrations are read-only.

- [ ] Write authenticated SQL regression using existing read/mutation paths: v2 sent + v3 draft/submitted/internally approved retains v2, excludes v1/v3, denies historical writes, includes viewer read and revoked/cross-client denial.
- [ ] Implement a read-only helper with active scope checks, existing-current fast path and authoritative latest-send fallback in rework states only. Update SELECT/storage/profile readers, not current-version mutation checks.
- [ ] Execute against disposable migrated PostgreSQL and independently review policy differences. If runtime unavailable retain NOT RUN, never apply to hosted UAT to bypass that gate.

Expected public behavior example: querying v2 content returns one authorized row while v3 is an internal draft; querying v3 returns zero; an approval against v2 is denied without a new decision or audit success.

## Task 2 — Client projection and controls (Nietzsche)

Allowed files: `src/server/actions/persistent-client-approval.ts`, `src/server/actions/commercial-summary-read.ts`, new `src/modules/approvals/client-readable-version.ts`, `src/ui/client/client-deliverable-detail.tsx`, and focused tests under unit approvals/component client. Preserve SIL-44 route changes.

- [ ] Add regression at existing reader/UI boundary, run with coordinator and observe expected failure.
- [ ] Resolve the explicit client-readable mapping RPC with exact tenant/client/work scoping, including mixed client/team roles. Read files/comments for that ID, not internal current ID. Preserve current-only actionability.
- [ ] Map retained snapshot to client-safe changes-requested status/progress; suppress decision/comment controls. Include previously published work in home/work/commercial only when the readable version exists.
- [ ] Run focused unit/component checks and review no internal content or stale mutation control leaks.

Observable expectations: `isActionable === false`, `versionId === sentV2`, safe status `client_changes_requested`, progress `65`, no comment form for the historical snapshot. Resent/current v3 is actionable only in `waiting_client_approval` with a valid review payload.

## Task 3 — Package capacity (Noether)

Allowed files: `src/modules/packages/package-ledger.ts`, `tests/unit/packages/package-ledger.test.ts`, new `supabase/tests/database/s015_sil54_consumed_reservation_balance.test.sql`, new `supabase/migrations/202609100002_s015_sil54_consumed_reservation_balance.sql`, worker report.

- [ ] Add literal-result tests and observe failure before changing the projection.
- [ ] Use `activeReserved = Math.max(0, reserved - released - consumed)` for supported ledger streams, keeping consumed and released totals unchanged. Match SQL `f002_package_line_balance` without changing security/grants.
- [ ] Test reserve→consume, mixed active/cancelled/delivered work, fractional quantities, amendments/adjustments and remaining-capacity reservation rejection.
- [ ] Verify SQL capacity and delivery/cancellation replay against real disposable DB. Unmatched legacy consumption is an anomaly to inspect, not a reason to invent compensating releases.

Example assertion after commitment2, reservation1, consumption1:

```ts
expect(balance).toMatchObject({ committed: 2, reserved: 0, consumed: 1, available: 1 });
expect(assertCanReserveQuantity(balance, 1)).toEqual({ allowed: true });
expect(assertCanReserveQuantity(balance, 2)).toEqual({ allowed: false, reason: "insufficient_capacity" });
```

## Task 4 — Coordinator verification and acceptance

- [ ] Review actual worker deltas for spec compliance and quality; independently execute combined local tests, lint, types and build.
- [ ] Preserve independent database and hosted gates. Fresh browser case must test retain/rework/resend, files and capacity after reviewed deployment; no reuse of already delivered Madar to fabricate acceptance.
- [ ] Update canonical walkthrough, defects, gate status and progress. Keep viewer/full mobile/isolation/recovery/owner20 unexecuted where applicable.

## Ownership / dependency scan

| Pair or task | Shared boundary | Resolution |
| --- | --- | --- |
| 1 / 2 | Explicit client-readable version RPC; permissive mixed-role RLS is not publication selection | Implement separately; integrate and validate together before publication |
| 1 / 3 | Migration ordering only | Distinct new filenames; shared DB execution coordinator-only |
| 2 / 3 | Commercial summary consumes package projection | No overlapping file ownership; combine test run |
| 1 | Historical read vs current write | Separate helper; no broad mutation-helper relaxation |
| 2 | List/detail vs controls | Same retained projection, nonactionable historical snapshot |
| 3 | TS vs SQL arithmetic | Same supported-stream contract; do not change events |

Progress is recorded in `sil52-sil54-checkpoint.md`. Native workers inherited their existing model; no external provider dispatch or claimed zero cost.

Review extensions within these blockers: direct authenticated authoritative send-event INSERT is denied while trusted send RPC remains functional; dedicated client mapping prevents mixed-role historical-version selection; ledger arithmetic uses persisted two-decimal units to avoid rejecting exact fractional remaining capacity. No general role redesign or historical data repair.
