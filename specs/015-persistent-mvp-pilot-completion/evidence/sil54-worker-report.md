# SIL54 worker — Phase 2 implementation ready for lead verification

Status: IMPLEMENTED_AWAITING_LEAD_GREEN. No test execution by this worker.

Approved contract: activeReserved = max(0, R - L - C); available = committed +
adjustments - activeReserved - consumed. Consumption transfers reserved usage;
it does not require an extra reservation_released entry.

## Changes

- tests/unit/packages/package-ledger.test.ts: eight added cases (twelve total,
  including the existing four), covering the reported 2/1/1 stream, unchanged
  input history, mixed active/cancelled/delivered works, fractional service units,
  positive/negative adjustments with amendments, remaining-capacity reservation,
  negative historical availability remaining visible, and exact two-decimal
  remaining-capacity reservation after fractional consumption.
- supabase/tests/database/s015_sil54_consumed_reservation_balance.test.sql:
  twenty-one planned pgTAP assertions; isolated synthetic transaction and rollback;
  existing SQL helper projection, unchanged security/grants, other line/client/
  tenant balances, authenticated helper denial and ledger RLS, mismatched-scope
  RPC denial, successful remaining-unit reservation, replay, overcapacity and
  adjustment denial, and preserved consumption/allocation/audit evidence.
- src/modules/packages/package-ledger.ts: subtract consumed quantity when
  deriving active reservations. Persisted two-decimal quantities are accumulated
  as integer hundredths and converted back only in the returned projection,
  preserving event totals and negative availability without a comparison tolerance.
- supabase/migrations/202609100002_s015_sil54_consumed_reservation_balance.sql:
  additive migration replaces only f002_package_line_balance with the matching
  calculation. Same uuid argument and result columns (uuid plus six numeric), SQL/STABLE,
  SECURITY DEFINER, public search_path, and restricted helper execution privileges.

The SQL fixture seeds the existing post-delivery ledger/allocation shape; it
does not claim to execute or verify the final-delivery workflow itself.

## Evidence and execution ownership

Lead reported the focused unit RED command:

```sh
node node_modules/vitest/vitest.mjs run --project unit tests/unit/packages/package-ledger.test.ts
```

Lead-reported actual RED: 7 expected failures / 4 passes, exit 1, including
reserved=1/available=0 instead of reserved=0/available=1 and mixed/fractional/
remaining-capacity regressions. Lead then explicitly authorized Phase 2.

### Decimal revision — 2026-09-10

Independent review identified binary floating-point drift for 0.30 committed,
0.10 reserved and 0.10 consumed: the projection denied an exact 0.20 reservation.
The schema stores commitment, ledger and allocation quantities as numeric(12, 2)
in 202606280001_f002_deliverables_core.sql; the approved SIL54 contract supports
fractional units.

One focused unit regression was added before the arithmetic revision. It expects
exactly 0.20 available, permits reservation of 0.20 and rejects 0.21. Lead ran
the focused file and reported **1 failed / 11 passed**, confirming the expected
insufficient_capacity failure for 0.20, then authorized the minimal fix.

The implementation now sums integer hundredths for each event category and
performs reservation/availability arithmetic before converting back to quantities.
The strict reservation comparison, existing integer cases, negative availability,
and append-only history are unchanged. No implementation change preceded this
decimal regression's lead-confirmed RED.

The SQL test adds the matching 0.30/0.10/0.10 projection and 0.20-versus-0.21
capacity comparison using the existing f002_package_line_balance helper; its
plan is now 21 assertions. This SQL parity assertion is **NOT EXECUTED**.
No migration change was needed for PostgreSQL numeric arithmetic.

Decimal revision status: **GREEN-ready, lead GREEN pending**. The worker ran no
unit, SQL, lint, typecheck, build or browser tests. Scoped git diff --check passed
for the tracked TS change (Git emitted its LF-to-CRLF warning); no runtime pass
is claimed. Only the owned TS implementation and SQL regression changed in the
decimal GREEN-preparation phase; this report records that evidence afterward.

Manual UI/DB RED is separate: the owner walkthrough records two committed
posts, one reservation followed by one consumption, no release, but UI shows
one reserved and zero available. This is existing reported UAT evidence, not
an automated SQL-test result and not a new DB query by this worker.

Automated SQL tests are NOT EXECUTED: Docker/database infrastructure is unavailable.
Post-fix unit GREEN is PENDING the lead's run; no pass is inferred from the patch.
No SQL command, credentials, network access, broad tests or deployment used.

The additive migration is authored only, NOT applied locally or to hosted UAT.
Lead owns the same focused unit rerun and all shared verification output.
No shared test helper, canonical spec/plan, historical migration, ledger or audit
history edited. Existing dirty SIL44 and concurrent work preserved.

## Boundaries

Tests use the approved supported-stream aggregate semantics, not an allocation
join or new legacy-repair policy. Real historical anomaly classification,
authenticated SQL execution, delivery replay in a complete lifecycle, hosted
UI acceptance and deployment remain lead-owned/unverified. No ADR added: this
restores the documented transfer semantics within existing ADR-009 architecture.
