# Quickstart: R-009 Planning And Read-Only UAT Validation

This guide validates R-009 planning without running hosted checks or mutating hosted state.

## Preconditions

- Read `AGENTS.md`.
- Read `docs/PROJECT_PROGRESS.md`.
- Read `docs/08-release/R-008-controlled-v1-pilot-production-candidate-readiness-execution.md`.
- Read R-008 final evidence under `specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution/evidence/`.
- Treat R-008 as accepted local readiness only.
- Do not run hosted checks until `evidence/owner-approval-record.md` records explicit approval.
- Do not mutate hosted DB.
- Do not deploy or promote.
- Do not use non-Hadna data unless separately approved.
- Do not print credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, secret values, or file contents.

## Planning Validation Commands

Use these lightweight checks after planning docs change:

```powershell
git status --short
rg --count-matches "https?://|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}|!\\[|service_role|SUPABASE_SERVICE_ROLE|sb_secret|password|token|secret" specs/011-r009-limited-hosted-read-only-uat-authorization-execution docs/08-release/R-009-limited-hosted-read-only-uat-authorization-execution.md docs/PROJECT_PROGRESS.md
```

Review counts manually. Redaction vocabulary is allowed; actual sensitive values, external evidence links, emails, images, or customer content are not.

## Owner Approval Gate

Before hosted execution, update `evidence/owner-approval-record.md` with:

- Approval status recorded as approved.
- Target environment or approved target label.
- Confirmation that no deploy, promotion, alias change, or configuration change is required.
- Data boundary.
- Persona categories.
- Credential handling method.
- Route categories.
- Read-only checks.
- Execution window.
- Evidence rules.
- No-op proof method.
- Stop conditions.
- Rollback/no-op owner.

If any field is missing, do not execute hosted checks.

## First Execution Phase After Approval

Run Phase 3 / US1 first:

- Confirm owner approval is complete.
- Confirm target is existing and read-only.
- Confirm credentials are out-of-band.
- Confirm route/persona categories are approved.
- Confirm stop conditions.
- Record only safe status in `evidence/execution-log.md`.

Only after Phase 3 passes may route/persona smoke begin.

## Future Hosted Read-Only Smoke Categories

Execute only after approval:

- Approved sign-in and route load checks.
- Approved management/project admin shell visibility.
- Approved assigned internal/account manager shell visibility.
- Approved client viewer portal visibility.
- Approved client approver portal visibility without approving.
- Approved unassigned or unauthorized safe-denial check.
- Approved file list visibility without opening or downloading contents.
- Approved SLA, audit, package, and deliverable summary checks with safe counts/categories only.
- Approved mobile and RTL rendering checks without screenshots.

## Completion Gate

R-009 planning is ready when:

- `spec.md`, `plan.md`, and `tasks.md` exist.
- Contracts and evidence scaffolds define approval, target, read-only checks, forbidden actions, redaction, no-op proof, route/persona smoke, and isolation.
- The owner approval record remains pending unless approval is explicitly recorded.
- Execution log says 0 hosted checks run before approval.
- No hosted checks, hosted mutation, deploy/promote, non-Hadna data use, dependency change, product code change, or Production acceptance occurred.

R-009 execution is ready to start only when the owner approval record is complete and the first execution phase confirms the boundary.
