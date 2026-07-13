# Plan: Persistent MVP Pilot Completion

## Milestones and exit gates

0. Consolidate Stage 2C evidence and commit corrected baseline. Exit: no hardcoded security success, hydration root cause fixed, blockers explicit.
1. Establish this canonical package and execution spine. Exit: Spec 015 is the only active next-work source.
2. Add persistent versions, approvals, comments, files, SLA segments, idempotency, audit transaction boundaries, and RLS. Exit: clean local migration and DB tests.
3. Replace production fixture reads/writes with scoped Supabase repositories and server commands. Exit: complete persistent lifecycle and no production fixture dependency.
4. Run local acceptance matrix and defect burn-down. Exit: DB-backed MVP green; blocked DB checks prevent acceptance.
5. Prepare hosted UAT handoff only. Exit: bounded prompt and owner decisions ready; no hosted actions executed here.
6. Execute the Owner-Authorized Hosted Team UAT Amendment. Exit: Draft PR, Preview/UAT deployment, Supabase UAT migration/seed, approved team access, hosted workflow/UX checks, rollback validation, and T032 evidence are complete, or an explicit hosted blocker is recorded.

## Design constraints

Use the existing Supabase SSR client, server actions/RPCs, current RLS helper
functions, and existing audit/status workflow patterns. The owner-authorized
rescue completes the `AGENTS.md` stack with React Hook Form + Zod for changed
non-trivial forms, dnd-kit for the governed board interaction, Uppy with
Supabase Storage for files, Tiptap for persistent comments, and TanStack
Query/Table only where the shared persistent source needs them. Review and pin
these dependencies; do not introduce any other technology. Sensitive writes
must be idempotent, server-side, tenant/client scoped, atomic, SLA-aware, and
audited.

## Corrective sequencing

1. Close the generic `f004` approval/delivery bypass in PostgreSQL and UI.
2. Separate `DELIVERABLE_VERSION_SUBMIT` from generic status and management authority, with assignment enforcement.
3. Execute the expanded behavioral pgTAP matrix before any P1 is called fixed.
4. Keep dependency work open as a bounded amendment to this same Spec 015 after P1 and DB-backed acceptance; add no dependency in this corrective task.

## Owner-Authorized Hosted Team UAT Amendment

Status: OWNER AUTHORIZED / PREFLIGHT IN PROGRESS.

This hosted amendment is additive to the accepted local baseline. T001-T019 remain historical local acceptance evidence and must not be edited into hosted PASS evidence.

### Hosted execution sequence

1. Complete hosted target, branch, rollback, and stop-condition preflight before any hosted mutation.
2. Fetch remote state, inspect merge base, commit list, diff, migration inventory, generated files, and secret boundary.
3. Use the current branch only if it can produce a clean reviewable PR; otherwise create a preserved integration branch such as `codex/015-hosted-team-uat` without reset, rewrite, force push, or unrelated cleanup.
4. Run the full local verification matrix before push, with typecheck and build sequential.
5. Push the reviewed branch, create a Draft PR, inspect CI, and fix only in-scope failures.
6. Verify Vercel Preview/UAT and Supabase UAT targets before any hosted read or mutation. If the target is ambiguous, shared with Production, mismatched, or unverifiable, stop before mutation.
7. Perform count/category-only hosted data preflight. Do not print row contents, names, emails, deliverable titles, comments, file paths, tokens, or identifiers.
8. Re-run local Supabase reset, RLS DB tests, and persistent E2E before hosted migration. Apply only pending reviewed repository migrations to Supabase UAT.
9. Create minimal run-ID-scoped synthetic Hadna UAT records and approved team access only after target and migration gates pass.
10. Deploy only a Vercel Preview/UAT build from the reviewed branch and verify the hosted app uses Supabase UAT, has no fixture actor query support, and exposes no service-role key to the client.
11. Execute the hosted team UAT journey through the UI using actual UAT Auth sessions. Use scoped read-only DB assertions only after UI actions.
12. Record T032 outcome, defect disposition, rollback rehearsal/no-op validation, and final hosted state without committing hosted URLs, secrets, emails, tokens, or direct identifiers.

### Rollback plan summary

- Deployment rollback: remove or disable only the Preview deployment/alias created by this run, or revert to the previous reviewed Preview deployment if one exists.
- Database rollback: prefer forward corrective migrations for schema issues; never use destructive down migrations against shared UAT; remove only run-ID-scoped synthetic rows created by this task.
- Access rollback: disable only UAT test accounts and revoke only role assignments created by this run.
- Owner authority: the project owner is the approval and stop-decision owner; the executing agent may not expand the mutation boundary.

### Hosted mutation boundary

No hosted mutation may begin until target identity, environment category, data category, migration inventory, rollback owner/window, and stop authority are verified and recorded in redacted form.

## Product Experience Rescue Amendment

Status: implementation in progress within Spec 015. The rescue closes client navigation/profile discoverability, creates the real multi-item pending-approval route, narrows client visibility to the exact current client-visible version, resolves scoped member display data, removes raw assignee identifiers, and implements the shared Samawah design contract across the universal drawer and role workspaces. The owner has authorized the approved stack dependencies and generic Glass/Hadna UAT import in this same rescue. Migrations remain additive and reviewed before UAT application. X006/X007 and H008-H010 remain open until local persistent verification and hosted persona evidence pass.

Dependency inventory: add only the pinned packages required for React Hook Form,
dnd-kit, Uppy, Tiptap, and TanStack Query/Table after license/security review.
No dependency may weaken the server/RLS boundary or become a source of client
payload leakage.
