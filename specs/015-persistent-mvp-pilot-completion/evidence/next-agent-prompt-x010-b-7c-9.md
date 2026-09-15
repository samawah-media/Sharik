# X010-B-7C-9 — Safe owner-UAT workspace rollover agent prompt

## Mandate

Continue the existing Samawah Spec 015 work and implement only
X010-B-7C-9 / S015-P2-128 / S015-P2-139. The objective is to give the owner and
approved internal test team a clean natural UAT entry after repeated synthetic
runs while preserving all historical evidence. This is a reversible workspace
rollover, not a row-deletion exercise.

Do not stop after an audit or plan. Inspect, add failing tests, implement the
local code, run the scoped verification matrix, review your diff, and update
the canonical evidence. Stop before any hosted mutation.

## Read first

Read completely before editing:

1. `AGENTS.md`.
2. `specs/015-persistent-mvp-pilot-completion/spec.md`.
3. `specs/015-persistent-mvp-pilot-completion/plan.md`.
4. `specs/015-persistent-mvp-pilot-completion/tasks.md`, especially
   X009-B and X010-B-7C-9.
5. `evidence/defect-register.md`, `evidence/execution-log.md`,
   `evidence/gate-status.md`, and the owner UAT notes.
6. `src/modules/uat/clean-workspace.ts`,
   `scripts/prepare-s015-clean-workspace.mjs`, their unit tests, the X009-B
   persistent seed/journey, relevant pgTAP, and current package scripts.

Inspect `git status`, the complete relevant diff, and untracked files. The
worktree contains valuable unfinished owner-feedback batches. Preserve every
unrelated user/agent change; do not reset, restore, delete, reformat broadly,
or create a competing Spec package.

## Confirmed defect and required design

The X009-B tool originally assumed that every approved persona had exactly one
membership outside the deterministic target. After a successful rollover and
new owner trials, a second rollover sees multiple historical inactive
memberships and can fail as ambiguous. Fix that limitation without weakening
tenant isolation.

Use this contract:

- For every approved internal persona, select exactly one active source
  membership. All selected memberships must belong to the same source tenant.
- Historical inactive memberships are allowed and remain unchanged.
- Zero active source memberships, more than one active source for a persona,
  a source-tenant mismatch, collision with the deterministic target, missing
  reviewed internal roles, or any ambiguous target must fail closed before
  mutation.
- Reuse deterministic run-scoped target tenant, membership, role, profile-sync,
  and audit identifiers. Do not add a parallel cleanup script or a new data
  model unless repository evidence proves it unavoidable.
- Apply must fully provision and verify the empty target and approved internal
  tenant-scoped roles, then persist a deterministic append-only audit binding
  containing the exact source tenant and membership set before disabling those
  memberships. Status, replay, and rollback in later processes must resolve
  that binding and fail on missing or conflicting identity. Never expose the
  bound identifiers in console or committed evidence.
- Replay of the same run and payload is a no-op. Conflicting replay fails.
- Partial failure must compensate safely. Never leave personas without the
  last verified active workspace.
- Rollback reactivates only the exact source memberships recorded for
  this run and disables only this run's target memberships. It does not delete
  the target or any source rows.
- Never copy client-only personas automatically.
- Never delete or rewrite clients, contracts, packages, deliverables, versions,
  tasks, comments, approvals, file metadata, Storage objects, audit events, or
  package ledger entries. `audit_events` and `package_ledger_entries` remain
  append-only.
- Retain `--dry-run`, `--status`, `--apply`, and `--rollback`, exact approved
  Supabase-host allowlisting, non-Production category enforcement, explicit
  apply/rollback confirmations, bounded retries, and category/count-only
  output. Never print IDs, names, emails, URLs, content, file paths, tokens, or
  credentials.

If the current implementation cannot record the exact source safely without a
schema change, stop and document the evidence and smallest required ADR/spec
amendment. Do not improvise a destructive fallback.

## Required implementation sequence

1. Reproduce the defect in a focused failing unit test: deterministic target
   plus one active source and one or more historical inactive memberships.
2. Add negative tests for zero/multiple active sources, cross-persona source
   mismatch, client-only roles, target collision, and conflicting replay.
3. Harden the pure selection/planning contract first, then the hosted script.
   Keep duplicated identifier logic exactly synchronized or safely centralize
   it without introducing a runtime boundary violation.
4. Add or extend persistent and pgTAP coverage for:
   - empty target operational counts;
   - approved internal persona entry and role preservation;
   - no automatic client-persona access;
   - historical inactive membership tolerance;
   - apply, separate-process-equivalent replay/status, rollback, and final
     state;
   - source operational/file rows unchanged;
   - Audit/Ledger append-only preservation;
   - tenant isolation and fail-closed ambiguity.
5. If an affected product empty state changes, verify Arabic RTL, keyboard,
   desktop, and mobile behavior. Do not perform unrelated visual redesign.
6. Run the repository's actual npm scripts; do not substitute pnpm when the
   checked-in lockfile and package scripts use npm. Start focused, then run the
   relevant local matrix serially when worker limits require it. Do not weaken
   assertions or call environment failures a pass.
7. Review the final production, test, security, and documentation diff. Run
   `git diff --check` and the repository secret scan. Update tasks, defect
   status, execution log, gate status, owner notes, and project progress with
   exact executed counts and honest blockers.

## Verification minimum

At minimum execute and report:

- focused unit tests for the clean-workspace module;
- full unit suite;
- typecheck and lint;
- relevant integration/RLS simulator suites if touched;
- local Supabase reset when database-backed tests require it;
- the full pgTAP matrix;
- focused and full persistent journeys needed to prove rollover behavior;
- production build if production imports or routes changed;
- secret scan and `git diff --check`.

Do not rerun unrelated browser suites merely to inflate evidence. If Docker or
the local database is unavailable, diagnose it safely, finish independent
checks, and leave the DB-backed task open. Do not reset Docker to factory
defaults or delete volumes.

## Explicitly unauthorized

- No command against hosted Supabase or Vercel, including read-only inventory,
  dry-run, apply, rollback, deployment, or environment changes.
- No migration application to hosted UAT.
- No real or test invitation sending.
- No commit, push, PR update, merge, force-push, or Production action.
- No deletion of UAT data, files, buckets, audit, or ledger history.
- No dependency, tenancy/RLS/workflow/SLA architecture change without the
  required Spec/ADR process.
- Do not mark X010-B-7C-9E, owner acceptance, `OWNER_UAT_PASS`,
  `TEAM_UAT_READY`, or Production as complete.

## Completion report

Return:

- Summary and root cause.
- Files changed.
- Specs/evidence updated.
- ADRs added/updated, or explicitly none.
- Tests added/updated and exact results.
- Security/privacy/tenant-isolation review.
- Risks and assumptions.
- What remains open, especially exact-HEAD CI, hosted rehearsal/apply,
  Preview persona verification, owner recheck, invitations, merge, and
  Production.
- AGENTS.md compliance checklist.

Do not claim completion from prose or mocks. X010-B-7C-9A-D may be marked done
only when their actual local evidence passes; X010-B-7C-9E remains unchecked.
