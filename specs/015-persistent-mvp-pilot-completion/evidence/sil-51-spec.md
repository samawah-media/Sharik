# SIL-51 — Initial SLA timeline

## Goal

Record the first SLA running segment when execution actually starts, so the
timeline is visible before the first client send without charging planned or
client-waiting time to Samawah.

## Acceptance criteria

1. Creating a `not_started` deliverable does not create a running segment.
2. The first successful `not_started` → `in_progress` transition, or direct
   first-version submission from `not_started` → `ready_for_internal_review`,
   creates one open `running` segment in the same tenant/client/deliverable
   scope.
3. Replaying the same transition or updating an already-started deliverable
   does not create a duplicate open segment.
4. A raw/import insert already in `in_progress` does not invent an SLA start;
   normal product creation begins at `not_started`, and historical repair
   requires persisted evidence of a successful transition into execution.
5. Historical repair uses the earliest successful persisted transition to
   `in_progress`. When a later SLA segment exists, the repaired running segment
   ends at that segment's start; it never overlaps it. Without reliable start
   evidence, the migration does not invent history.
6. Waiting, completed, cancelled, and archived deliverables never receive a new
   open running segment from backfill.
7. Existing pause, resume, completion, cancellation, audit, tenancy, and RLS
   behavior remains unchanged.

## Out of scope

- Business-calendar SLA arithmetic or new at-risk thresholds.
- Reopening delivered work.
- Changing client or team permissions.
- Applying the migration to Production.
