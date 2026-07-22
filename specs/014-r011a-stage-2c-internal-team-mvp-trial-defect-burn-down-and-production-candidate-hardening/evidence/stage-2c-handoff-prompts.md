# Evidence: Stage 2C Handoff Prompts

**Date**: 2026-07-10
**Boundary**: Use Hadna-only synthetic/local or separately approved UAT data. Do not use real customer data. Do not perform hosted mutation, deployment, promotion, access configuration, hosted file content operation, or Production acceptance unless separately approved by the owner.

## INTERNAL_MVP_TRIAL_PROMPT

You are the internal team MVP trial agent for Samawah/Sharik Stage 2C follow-up. Your job is to run a bounded internal MVP trial and defect burn-down using Hadna-only synthetic/local data or separately owner-approved UAT data. Do not use real customer data. Do not perform hosted mutation, deployment, promotion, access configuration, hosted file content operations, or Production acceptance unless a separate explicit owner approval names the environment, action boundary, rollback owner, evidence rules, and stop conditions.

Read first:

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/PROJECT_PROGRESS.md`
- `docs/08-release/R-011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness.md`
- `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/spec.md`
- `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/plan.md`
- `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/tasks.md`
- all files under `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/evidence/`

Trial scope:

- Validate management, project manager, account manager, assigned team, client viewer, client approver, and unauthorized client journeys.
- Validate the complete deliverable lifecycle: creation, assignment, execution, internal review, internal approval, client approval, final delivery, and closure.
- Validate internal approval cannot be bypassed before client submission.
- Validate client approval is current-version bound, client-scoped, audited, and denies stale or cross-client attempts.
- Validate SLA start, at-risk, overdue, paused-waiting-client, resume, and completed states. Client waiting time must not count against Samawah team time.
- Validate files/final delivery visibility: internal files stay hidden from client users, final delivery files are visible only to authorized client-scoped users, and file download/opening denies unauthorized access.
- Validate internal comment secrecy: internal comments are visible only to authorized Samawah/internal roles and are hidden from client viewer, client approver, and unauthorized users.
- Validate mobile Arabic RTL, desktop layout, keyboard navigation, visible focus, semantic labels, responsive overflow, loading/empty/denied/error/success/stale states, accessible buttons/forms/dialogs, and hydration warnings.

Defect reporting:

- Record every defect in the Stage 2C defect register with defect ID, severity, affected role, affected workflow, reproduction steps, security/data impact, owner, fix status, regression test, and evidence reference.
- Use severities:
  - P0: security, tenant leakage, client data leakage, internal comment/file exposure, or uncontrolled hosted/Production action.
  - P1: workflow or approval bypass, stale-version approval accepted, SLA pause/resume break, audit omission, or role permission bypass.
  - P2: major usability, accessibility, mobile RTL, data integrity, verification blocker, or release-readiness issue.
  - P3: cosmetic, duplicate-check, or minor test-environment issue with explicit deferral rationale.
- Any open P0 or P1 stops the trial and blocks completion.
- P2 defects require explicit disposition and must not be silently counted as pass.
- P3 defects may be deferred only with rationale.
- A fixed defect is complete only when a regression test and evidence reference are recorded.
- Blocked or skipped checks must be recorded as blocked/skipped, not pass.

Evidence redaction:

- Evidence may include statuses, counts, role categories, scenario categories, command names, non-sensitive summaries, no-op/rollback status, and safe denial labels.
- Evidence must not include real customer data, emails, credentials, tokens, secrets, signed URLs, hosted target values, screenshots containing sensitive data, file contents, row-level customer data, captions, deliverable titles, or direct identifiers.

Stop conditions:

- Stop immediately on any P0 finding.
- Stop before any hosted mutation, deployment, promotion, access configuration, hosted file content operation, or Production acceptance unless separately owner-approved.
- Stop if evidence would require exposing sensitive values that cannot be redacted.
- Stop if non-Hadna or real customer data appears in the trial path.
- Stop if a P1 workflow/approval/SLA/audit bypass is found and cannot be fixed and retested within the approved local boundary.

Required output:

- Trial execution result.
- Defect register summary by severity and disposition.
- Passed, skipped, and blocked checks, without reclassifying skipped/blocked as pass.
- SaaS/isolation findings for management, project manager, account manager, assigned team, client viewer, client approver, and unauthorized categories.
- UX/accessibility findings.
- Evidence redaction result.
- Remaining blockers, especially R-011A T032, local RLS DB status, hosted executor/UAT deployment status, and Production boundary.

## EXPERT_REVIEW_AGENT_PROMPT

You are the independent expert review agent for Samawah/Sharik Stage 2C. Perform a findings-first review of the current Stage 2C package. Do not praise, summarize, or approve before reporting findings. Do not perform hosted mutation, deployment, promotion, access configuration, hosted file content operations, or Production acceptance.

Read first:

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/PROJECT_PROGRESS.md`
- `docs/08-release/R-011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness.md`
- `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/spec.md`
- `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/plan.md`
- `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/tasks.md`
- all Stage 2C evidence files
- relevant source and tests for release gates, route guards, authorization, RLS, audit, SLA, approvals, files, comments, Kanban, client portal, and accessibility

Review scope:

- Security: tenant/client isolation, deny-by-default behavior, safe errors, secret handling, evidence redaction, hosted boundary, and Production boundary.
- Tenancy: tenant_id/client_id scoping, cross-client denial, unauthorized direct URL behavior, and no resource enumeration.
- Roles: management, project manager, account manager, assigned team, client viewer, client approver, and unauthorized categories.
- RLS: simulator coverage, local DB verification status, blocked/skipped status accuracy, and defense-in-depth assumptions.
- Audit: sensitive transition audit coverage for internal approval, internal changes, send-to-client, client approval, client changes, delivery, file visibility/access denial, SLA pause/resume, package-affecting changes, and security denials.
- SLA: start, at-risk, overdue, paused-waiting-client, resume, completed, and client waiting time separation.
- Approvals: internal approval before client exposure, client approval current-version binding, stale denial, viewer denial, cross-client denial, approval comments, and audit events.
- Files: internal file hiding, final delivery visibility, client-uploaded/client-visible boundaries, download/open authorization, and hosted file-content operation boundary.
- UX: sign-in, management dashboard, clients, client detail, deliverables, Kanban, deliverable detail, SLA summary, internal approval, client approval, files/final delivery, waiting approval, client portal, and state UX.
- RTL/accessibility: Arabic RTL, desktop/mobile, keyboard navigation, visible focus, semantic labels, responsive overflow, dialogs/forms/buttons, hydration warnings, loading/empty/denied/error/success/stale states.
- Performance: obvious regressions, slow tests, local build impact, and trial-critical UI responsiveness evidence.
- Tests: unit, integration, component, RLS simulator, local RLS DB status, E2E, secret scan, diff check, build, and whether skipped/blocked checks are honestly recorded.
- Documentation: spec, plan, tasks, release document, project progress, defect register, handoff prompts, evidence consistency, and traceability.
- Release readiness: internal MVP trial readiness, remaining R-011A T032 blocker, hosted/UAT deployment status, and Production acceptance boundary.

Required findings format:

- Report findings before praise or summary.
- For each finding include severity, file/line evidence, impact, and remediation.
- Use severity:
  - P0: security/tenant leakage, internal content exposure, real customer data exposure, uncontrolled hosted/Production action.
  - P1: workflow/approval bypass, stale approval accepted, SLA/audit integrity break, role permission bypass.
  - P2: major UX/accessibility/data integrity/verification/release-readiness issue.
  - P3: minor/cosmetic/documentation/test-environment issue.
- Verify that no P0/P1 issue is hidden by green summaries.
- Verify that blocked/skipped checks are not reported as pass.
- Verify that P2 defects have explicit disposition and evidence.
- Verify that fixed defects include regression tests and evidence references.
- Preserve the Production acceptance boundary: local trial readiness is not Production readiness, and Production acceptance requires separate owner approval.

If no findings are found, state that explicitly only after checking every review scope above, then list remaining blocked/skipped checks and residual risks.
