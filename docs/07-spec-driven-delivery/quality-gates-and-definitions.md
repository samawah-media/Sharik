# Quality Gates and Definitions

## Definition of Ready for Spec

- Problem, users, business outcome, V1 fit, source docs, known exclusions, and open questions are documented.
- No unresolved product blocker.

## Definition of Ready for Plan

- Spec has approved acceptance criteria, permissions, tenant/client scope, UX surfaces, audit/SLA/ledger effects, error states, mobile/RTL/a11y notes, and test strategy.

## Definition of Ready for Build

- `spec.md`, `plan.md`, and `tasks.md` exist and pass checklist/analyze.
- ADRs are accepted where required.
- Branch/worktree isolation is prepared.
- No critical security or scope blockers.

## Definition of Done

- Feature behavior implemented according to spec.
- Server-side authorization and RLS strategy applied.
- Audit, SLA, ledger, file, and visibility side effects implemented where relevant.
- Tests and docs updated.

## Definition of Verified

- Required unit/domain/integration/E2E/security/a11y/mobile evidence exists.
- Negative tests pass for cross-tenant/client access and role denials.
- Reviewer confirms no internal content leaks.

## Definition of Pilot Ready

- Critical flows pass on staging.
- Backup/restore approach tested or documented with date.
- Monitoring/logging captures auth, denied access, approvals, SLA jobs, and file access errors.

## Definition of Production Ready

- ASVS V1 checklist complete for in-scope controls.
- No unresolved critical/high security bugs.
- Rollback and support process documented.
- Owner accepts residual risks.
