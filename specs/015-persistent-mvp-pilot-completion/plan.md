# Plan: Persistent MVP Pilot Completion

## Milestones and exit gates

0. Consolidate Stage 2C evidence and commit corrected baseline. Exit: no hardcoded security success, hydration root cause fixed, blockers explicit.
1. Establish this canonical package and execution spine. Exit: Spec 015 is the only active next-work source.
2. Add persistent versions, approvals, comments, files, SLA segments, idempotency, audit transaction boundaries, and RLS. Exit: clean local migration and DB tests.
3. Replace production fixture reads/writes with scoped Supabase repositories and server commands. Exit: complete persistent lifecycle and no production fixture dependency.
4. Run local acceptance matrix and defect burn-down. Exit: DB-backed MVP green; blocked DB checks prevent acceptance.
5. Prepare hosted UAT handoff only. Exit: bounded prompt and owner decisions ready; no hosted actions executed here.

## Design constraints

Use existing Supabase SSR client, server actions/RPCs, Zod, current RLS helper functions, and existing audit/status workflow patterns. Do not introduce a dependency. Sensitive writes must be idempotent, server-side, tenant/client scoped, and audited.

## Corrective sequencing

1. Close the generic `f004` approval/delivery bypass in PostgreSQL and UI.
2. Separate `DELIVERABLE_VERSION_SUBMIT` from generic status and management authority, with assignment enforcement.
3. Execute the expanded behavioral pgTAP matrix before any P1 is called fixed.
4. Keep dependency work open as a bounded amendment to this same Spec 015 after P1 and DB-backed acceptance; add no dependency in this corrective task.
