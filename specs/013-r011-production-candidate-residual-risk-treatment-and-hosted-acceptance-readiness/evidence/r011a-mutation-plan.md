# R-011A Mutation Plan

Date: 2026-07-09

## Status

Current implementation result: SAFE LOCAL SETUP PATHS IMPLEMENTED / HOSTED MUTATION NOT RUN.

The prior Stage 1 preflight found no safe app/server paths for the three unresolved categories. This implementation pass adds local, injected app/server paths for planning, dry-run preview, local setup marker creation, denial auditing, idempotency, and rollback/no-op summaries.

This does not execute hosted mutation, hosted DB reads, hosted route checks, hosted file operations, deploy/promotion, non-Hadna data use, or Production acceptance.

## Implemented Safe Local Paths

| Area | Local safe path | Audit behavior | Hosted Stage 2 status |
|---|---|---|---|
| Client approver account/category | `runR011AGapSetupCommand` can plan and locally mark one approved client approver category through `fix_or_create_client_approver_category`. | Allowed local apply records `R011AClientApproverCategoryPrepared` and `R011AGapSetupApplied`; denials record `R011AGapSetupDenied`. | Not executed. Hosted account/category mutation still requires a later approved execution pass and safe persistence wiring. |
| Waiting approval item/category | Command can plan and locally mark one waiting-approval item/category through `create_or_expose_waiting_approval_item`. | Allowed local apply records `R011AWaitingApprovalItemPrepared` and `R011AGapSetupApplied`; denials record `R011AGapSetupDenied`. | Not executed. Hosted waiting item/category creation/exposure still requires a later approved execution pass. |
| Final delivery/file-list category | Command can plan and locally mark one final-delivery file-list marker through `create_or_expose_final_delivery_file_list_marker`. | Allowed local apply records `R011AFinalDeliveryFileListPrepared` and `R011AGapSetupApplied`; denials record `R011AGapSetupDenied`. | Not executed. Hosted file-list exposure still requires a later approved execution pass and must avoid file content operations. |

## Command Modes

| Mode | Behavior | Mutation boundary |
|---|---|---|
| `dry_run` | Produces a preview of what would be created or skipped and records a preview audit event. | No setup records are created. |
| `apply_local` | Creates local setup marker records through an injected repository and treats existing category/idempotency records as no-op. | Local/test repository only in this pass; no hosted execution. |
| `rollback_summary` | Summarizes no-op/rollback availability for each requested category and records a rollback-summary audit event. | No setup records are deleted or changed. |

## Denial Rules

The local plan and command deny:

- Missing owner approval.
- Incomplete owner approval.
- Non-Hadna or unapproved scope.
- Tenant/client scope mismatch.
- Duplicate category requests.
- Category counts above the owner-approved maximum.
- Hosted mutation requests in this local pass.
- Production acceptance requests.
- Non-Hadna data requests.
- Hosted file content operations.
- Unsafe file operations such as open, download, upload, or delete.
- Idempotency key reuse across another category or client.
- Execution by non-management/non-admin actors.

## Exact Operations Approved But Not Hosted-Executed

| Operation | Intended count | Local path | Required later hosted path | Result |
|---|---:|---|---|---|
| Client approver category fix/create | At most 1 | Implemented as a local setup marker path. | A safe hosted persistence adapter/execution wrapper that does not expose credentials or broaden roles. | Local tests passed; hosted mutation not executed. |
| Waiting approval item/category create/expose | At most 1 | Implemented as a local setup marker path. | A safe hosted execution pass that creates or exposes only one Hadna waiting category through audited app/server logic. | Local tests passed; hosted mutation not executed. |
| Final delivery/file-list category create/expose | At most 1 | Implemented as a local setup marker path. | A safe hosted execution pass that exposes a list/category marker without file content operations. | Local tests passed; hosted mutation not executed. |

## Direct Mutation Decision

Direct hosted mutation remains blocked. Direct SQL, broad account repair, role model changes, approval/status/delivery decisions, hosted file content operations, and file-list storage repair remain stop conditions.

The new local command narrows a later hosted path, but it does not by itself authorize or run hosted Stage 2.

## Expected Counts

| Count type | Result |
|---|---:|
| Hosted mutations executed | 0 |
| Hosted DB read queries executed by this agent | 0 |
| Hosted route checks executed by this agent | 0 |
| Account/category hosted mutations executed | 0 |
| Waiting item/category hosted mutations executed | 0 |
| Final delivery/file-list hosted mutations executed | 0 |
| Hosted file operations executed | 0 |
| Production acceptance decisions | 0 |

## Remaining Stop Conditions Before Hosted Execution

- No hosted execution was requested or run in this pass.
- A later hosted Stage 2 pass still needs an owner-approved execution window and operator.
- A later hosted Stage 2 pass must provide safe persistence/execution wiring for the local command boundary.
- A later hosted Stage 2 pass must confirm the Hadna-only tenant/client scope without printing values.
- A later hosted Stage 2 pass must preserve value-free evidence and avoid direct identifiers.
- A later hosted Stage 2 pass must stop if any operation requires file content access, direct SQL, broad role/account repair, or Production acceptance.

## Decision

The R-011A gap setup path is now locally implemented and tested. Hosted Stage 2 remains not executed and not accepted.

## Hosted Execution Readiness Addendum

This pass adds hosted execution readiness wiring without hosted mutation:

| Area | Readiness wiring | Current result |
|---|---|---|
| Hosted dry-run | `runR011AHostedGapSetupReadinessCommand` accepts `hosted_dry_run` only with the no-op approval category `r011a_hosted_dry_run_noop_rehearsal`. | Local wrapper tests passed; real hosted dry-run remains pending owner/operator window if hosted access is needed. |
| Hosted apply | The same wrapper accepts the `apply_hosted` execution mode shape but denies it without explicit apply approval category `r011a_apply_hosted_bounded_mutation`. | Hosted apply remains blocked. No hosted executor is configured in this pass. |
| Evidence summary | `buildR011AHostedGapSetupEvidenceSummary` emits category labels, status labels, and counts only. | Tenant/client/user values and sensitive values are not included in the summary. |
| Stop conditions | Runbook, dry-run plan, stop conditions, and evidence policy were added under this evidence package. | Hosted Stage 2 remains pending and not accepted. |

No hosted mutation, hosted DB read query, hosted route check, hosted file operation, deploy/promotion, non-Hadna data use, or Production acceptance occurred during the readiness pass.
