# Data And Evidence Model: R-011A Stage 2C

Stage 2C does not introduce a database schema change. These entities define local trial evidence and defect tracking.

## TrialRoleCategory

- `id`: management_admin, project_manager, account_manager, assigned_team, client_viewer, client_approver, unauthorized_client
- `scope`: management, internal_team, client, unauthorized
- `allowed_actions`: category labels only
- `denied_actions`: category labels only
- `evidence_required`: pass, fail, blocked, or skipped

## TrialScenario

- `id`: stable Stage 2C scenario identifier
- `role_category`: TrialRoleCategory id
- `surface`: sign-in, dashboard, clients, deliverables, kanban, detail, SLA, approval, files, portal, or state UX
- `expected_result`: allowed, denied, hidden, paused, resumed, completed, audited, or no-op
- `mutation_count`: local synthetic count only
- `no_op_count`: count only
- `audit_expected`: boolean
- `evidence_status`: pass, fail, blocked, or skipped

## Defect

- `id`: stable defect id
- `severity`: P0, P1, P2, or P3
- `surface`: affected feature surface
- `role_category`: affected role category
- `summary`: value-free description
- `affected_workflow`: lifecycle, approval, SLA, files, comments, RLS, hosted boundary, UX, accessibility, or verification
- `reproduction_steps`: value-free reproduction steps
- `security_data_impact`: value-free impact assessment
- `owner`: accountable owner category
- `status`: open, blocked, fixed, retested, deferred, or accepted-for-internal-trial-only
- `owner_disposition`: required for every P2/P3 deferred or blocked entry
- `regression_test`: command or test reference; required for fixed entries
- `production_impact`: blocks-production, blocks-trial, trial-limitation, or no-blocker
- `evidence`: command/test/manual reference without sensitive values

## EvidenceRecord

- `id`: stable evidence id
- `source`: test, command, manual review, docs audit, or redaction scan
- `result`: pass, fail, blocked, skipped, or no-op
- `counts`: value-free counts only
- `redaction_status`: pass, fail, or not-applicable
- `notes`: category-only summary

## Gate

- `id`: local-trial, security, workflow, SLA, files-comments, UX-a11y, verification, hosted, production
- `status`: green, yellow, red, blocked, or not-authorized
- `required_for_internal_trial`: boolean
- `required_for_production`: boolean
- `blocking_reason`: value-free explanation when not green
