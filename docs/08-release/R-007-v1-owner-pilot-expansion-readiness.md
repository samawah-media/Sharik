# R-007 V1 Owner Pilot Expansion and Acceptance-to-Production Readiness

## Status

R-007 is ready for owner readiness review after Phase 7 final polish and verification.

R-006 is accepted only for Hadna internal UAT/MVP evaluation. R-006 is not Production acceptance, does not authorize non-Hadna customer data use, and does not authorize new hosted database mutation.

## Owner Readiness Acceptance

Owner accepted R-007 for readiness review on 2026-07-08 with the recorded local Docker repeatability risk.

This acceptance does not grant Production acceptance, does not authorize hosted database mutation, does not authorize non-Hadna customer data use, and does not authorize deploy or promotion activity.

Owner also authorized starting R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution as a new Spec Kit package, planning first only.

## Baseline

- Accepted baseline: R-006 Hadna-only internal UAT after final owner acceptance smoke.
- R-007 scope: V1 readiness boundary for deliverables, SLA, approvals, files, permissions, audit logs, and client portal readiness.
- R-007 does not reopen R-006 as a bugfix phase.
- Hosted mutation remains blocked until a new explicit owner approval and Spec Kit task scope authorize it.

## Evidence Rules

R-007 evidence may record counts, role categories, route categories, status names, pass/fail outcomes, and safe summaries.

R-007 evidence must not record credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.

## Initial Readiness Gates

| Gate | Status | Safe summary |
|---|---:|---|
| R-006 baseline separation | PASS | R-006 is treated as accepted internal UAT only. |
| V1 core scope | PASS | Readiness is mapped to deliverables, SLA, approvals, files, permissions, audit logs, and client portal. |
| Hosted mutation boundary | Blocked without owner decision | No hosted DB mutation is authorized by this initial R-007 setup. |
| Non-Hadna data boundary | Blocked without owner decision | No non-Hadna customer data use is authorized by this initial R-007 setup. |
| Production acceptance | Not granted | Production acceptance requires a separate explicit owner decision. |

## US1 MVP Readiness Boundary

US1 is implemented as a local readiness review boundary:

- Added a release boundary helper that classifies allowed local readiness work, owner-decision blockers, ADR blockers, and separate production acceptance decisions.
- Added an evidence redaction helper for prohibited evidence categories.
- Added an Arabic management readiness review route at `/readiness/r007`, guarded for management/audit-capable roles.
- Added owner-readable readiness summary copy for baseline, V1 gates, blocked scope, and next owner decision.

US1 verification:

| Check | Status | Safe result |
|---|---:|---|
| Red test before implementation | PASS | New US1 tests failed before helper modules existed. |
| US1 unit tests | PASS | 2 files / 9 tests passed. |
| `npm run lint` | PASS | ESLint passed after US1 implementation. |
| `npm run typecheck` | PASS | TypeScript passed after US1 implementation. |
| `npm run secret:scan` | PASS | No high-confidence secrets found. |
| `git diff --check` | PASS | Whitespace check passed with CRLF working-copy warnings only. |

No hosted database mutation, non-Hadna customer data use, dependency change, workflow semantics change, credential output, screenshot, workbook content, link, caption, deliverable title, token, or secret value was introduced by US1.

## US2 Core Workflow Readiness

US2 is implemented as a local, fixture-backed workflow readiness slice:

- Added R-007 lifecycle rules for current version checks, internal approval, client visibility, client decisions, and delivery target readiness.
- Added SLA timeline segment rules for running time, client-wait pause, resume after client change request, invalid state denial, and completion.
- Added local approval command coverage for internal approval, internal change request, send-to-client, client approval, and client change request.
- Added workflow-specific permission mapping for the management status action and compact management affordances for approval-capable actors.
- Preserved the hosted mutation boundary by using local repositories, local fixtures, and safe summaries only.

US2 verification:

| Check | Status | Safe result |
|---|---:|---|
| US2 unit tests | PASS | 3 files / 17 tests passed. |
| US2 integration tests | PASS | 3 files / 14 tests passed. |
| US2 component regressions | PASS | 2 files / 7 tests passed. |
| `npm run lint` | PASS | ESLint passed after US2 implementation. |
| `npm run typecheck` | PASS | TypeScript passed after US2 implementation. |
| `npm run secret:scan` | PASS | No high-confidence secrets found. |
| `npm run build` | PASS | Production build passed after US2 implementation. |

No hosted database mutation, non-Hadna customer data use, dependency change, architecture change, credential output, screenshot, workbook content, link, caption, deliverable title, token, or secret value was introduced by US2. US2 does not grant Production acceptance.

## US3 Client Portal Readiness

US3 is implemented as a local, fixture-backed client portal readiness slice:

- Added a controlled client approval panel for approvers with read-only behavior for viewers.
- Added a client-safe deliverable detail surface that summarizes approval, files, comments, status, and progress without internal content.
- Added file visibility and file access guard rules so internal files remain hidden and client-visible/final files stay scoped.
- Added comment visibility rules that filter internal and other-client comments away from client portal readers.
- Updated the client portal composition to show approval detail only for an assigned client scope and to use guarded server-side client decision commands.
- Preserved the hosted mutation boundary by using local fixtures, route categories, role categories, and safe summaries only.

US3 verification:

| Check | Status | Safe result |
|---|---:|---|
| US3 component tests | PASS | 3 files / 7 tests passed. |
| US3 unit tests | PASS | 1 file / 3 tests passed. |
| US3 integration tests | PASS | 1 file / 2 tests passed. |
| US3 E2E tests | PASS | 10 passed / 2 skipped across desktop, mobile, and RTL projects. |
| `npm run lint` | PASS | ESLint passed after US3 implementation. |
| `npm run typecheck` | PASS | TypeScript passed after US3 implementation. |
| `npm run secret:scan` | PASS | No high-confidence secrets found. |
| `git diff --check` | PASS | Whitespace check passed with CRLF working-copy warnings only. |
| `npm run build` | PASS | Production build passed after US3 implementation. |

No hosted database mutation, non-Hadna customer data use, dependency change, architecture change, credential output, screenshot, workbook content, link, caption, deliverable title, token, or secret value was introduced by US3. US3 does not grant Production acceptance.

## US4 Release Evidence Bundle

US4 packages the R-007 release evidence for owner/reviewer inspection. It remains a readiness bundle only and does not grant Production acceptance.

Required US4 evidence coverage:

| Evidence key | Status | Safe summary |
|---|---:|---|
| tenant_client_isolation | PASS | Client and tenant scope checks remain covered by local role, portal, and visibility regressions. |
| role_negative_tests | PASS | Role matrix regression covers management, assigned internal, client approver, client viewer, inactive, and unassigned categories. |
| client_waiting_pause | PASS | SLA timeline tests cover waiting-client pause state. |
| resume_on_client_change_request | PASS | SLA timeline tests cover resume after client change request. |
| version_bound_decisions | PASS | Approval workflow tests cover decisions attached to current versions. |
| stale_version_denial | PASS | Lifecycle and approval tests cover stale or superseded version denial. |
| internal_file_hidden | PASS | File visibility and access tests deny internal files to client roles. |
| client_visible_file_authorization | PASS | File access guard tests allow only scoped client-visible/final file categories. |
| sensitive_transition_audit | PASS | Workflow audit tests require audit evidence for sensitive state changes. |
| security_denial_audit | PASS | Approval and file denial paths record safe audit evidence. |
| client_rtl_mobile | PASS | Client portal E2E covers mobile and RTL route categories. |
| secret_scan_outcome | PASS | No high-confidence secrets found in final US4 quickstart verification. |
| blocked_checks_and_residual_risks | RECORDED | Full E2E is green after the client-invitation heading fix. Standalone pgTAP passed after local Docker/Supabase reset, but repeat combined `npm run test:rls` remains locally unstable because Docker Desktop entered a starting/API-error state. |
| production_acceptance_separate_owner_decision | PASS | Production acceptance remains a separate explicit owner decision. |

Persona categories included in US4 evidence:

- management_project_admin
- assigned_internal_user
- client_approver
- client_viewer
- unassigned_client_user

Residual risks and blocked scope:

- Hosted database mutation remains blocked without a new explicit owner approval and task-level scope.
- Non-Hadna customer data use remains blocked without a new explicit owner approval and task-level scope.
- Production-candidate review remains separate from R-007 readiness completion.
- Production acceptance remains blocked until a separate explicit owner decision.
- The earlier full E2E client-invitation failure is resolved; full E2E now passes across desktop, mobile, and RTL projects.
- Standalone local pgTAP DB verification passed after starting Docker Desktop and resetting the local Supabase database.
- Repeat combined `npm run test:rls` remains locally unstable because Docker Desktop later stayed in a starting/API-error state; simulator and standalone pgTAP evidence passed in Phase 7, but the combined command was not repeatably green at the end.
- A non-fatal Kanban hydration warning appeared during E2E, but the suite passed. This is recorded as a follow-up observation, not a Production acceptance blocker for R-007 readiness review.

US4 local verification summary:

| Check | Status | Safe result |
|---|---:|---|
| Targeted US4 unit tests | PASS | 2 files / 7 tests passed. |
| `npm run lint` | PASS | ESLint passed. |
| `npm run typecheck` | PASS | TypeScript passed. |
| `npm run test:unit` | PASS | 31 files / 111 tests passed. |
| `npm run test:integration` | PASS | 23 files / 92 tests passed. |
| `npm run test:component` | PASS | 17 files / 54 tests passed when rerun alone after a parallel Vitest worker EPIPE. |
| `npm run test:rls:simulator` | PASS | 8 files / 24 tests passed. |
| `npm run test:rls:db` | PASS | After local Docker/Supabase recovery, 4 pgTAP files / 142 tests passed. |
| `npm run test:rls` | PARTIAL/BLOCKED | Simulator passed, but repeat combined RLS could not complete after Docker Desktop entered a starting/API-error state. |
| Targeted client-invitation E2E | PASS | 3 passed across desktop, mobile, and RTL after the waiting-approval heading fix. |
| `npm run test:e2e` | PASS | 89 passed / 4 skipped across desktop, mobile, and RTL projects. |
| `npm run secret:scan` | PASS | No high-confidence secrets found. |
| `git diff --check` | PASS | Whitespace check passed with existing CRLF working-copy warnings only. |
| `npm run build` | PASS | Production build completed. |

Out of scope for R-007:

- Hosted DB mutation.
- Non-Hadna customer data.
- Production acceptance.
- Direct social publishing or scheduling.
- New dependencies or architecture changes.

## Next Owner Decision

After Phase 7, the next owner decision is whether to accept R-007 as ready for owner readiness review with the recorded local Docker repeatability risk, then decide separately whether to authorize a broader pilot or production-candidate Spec Kit package.

The required decision key remains `production_acceptance_separate_owner_decision`: R-007 evidence can support a future production-candidate review request, but it does not grant Production acceptance.
