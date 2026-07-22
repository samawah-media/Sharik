# R-011A Hosted Execution Readiness Runbook

Date: 2026-07-09

## Status

Hosted execution readiness is prepared for a later operator window.

No hosted mutation, hosted DB read query, hosted route check, hosted file operation, deploy/promotion, non-Hadna data use, approval/status/delivery mutation, account creation, or Production acceptance is authorized or executed by this runbook.

## Safe Invocation Surface

The hosted readiness wrapper is `runR011AHostedGapSetupReadinessCommand` in `src/server/commands/release/r011a-hosted-gap-setup-readiness.ts`.

Supported execution modes:

| Execution mode | Current behavior | Mutation boundary |
|---|---|---|
| `hosted_dry_run` | Rehearses the existing local dry-run path and emits value-free category/count evidence. | No setup records and no hosted operations. |
| `apply_hosted` | Blocked unless a future explicit apply approval category is supplied; still blocked in this pass because no hosted executor is configured. | No hosted mutation in this pass. |

## Hosted Dry-Run Rehearsal

Hosted dry-run rehearsal may be invoked only with:

- Tenant-level management/admin actor.
- Hadna-only approved scope.
- Existing R-011A owner approval for the three categories.
- Hosted dry-run approval category `r011a_hosted_dry_run_noop_rehearsal`.
- `readOnlyNoOp = true`.
- `evidenceValueFree = true`.
- Category counts within the owner-approved maximum.

The wrapper maps `hosted_dry_run` to the existing `dry_run` setup command and returns only category labels, status labels, and counts.

## Later Apply Hosted Invocation

A later `apply_hosted` attempt must be a separate owner/operator package. It must provide:

- Explicit hosted apply approval category `r011a_apply_hosted_bounded_mutation`.
- Hadna-only scope.
- Operator window approval.
- Rollback plan approval.
- Stop-condition review.
- Value-free evidence rules.
- Maximum mutation counts for each approved category.
- A reviewed hosted executor that uses scoped app/server logic and append-only audit.

This pass does not configure a hosted executor. If `apply_hosted` is invoked now, the wrapper returns a denial and records an audit denial.

## Operator Steps For A Later No-Op Dry-Run Window

1. Confirm the owner/operator window and Hadna-only scope without printing values.
2. Confirm hosted dry-run approval category and value-free evidence rules.
3. Prepare the exact three approved category requests or a smaller subset.
4. Run `hosted_dry_run` only if the operator confirms it is no-op/read-only.
5. Record summary counts only: category count, requested item count, status counts, hosted mutation count, hosted file operation count, Production acceptance count, and sensitive value count.
6. Stop before any hosted apply, hosted DB write, hosted route check, hosted file operation, or direct SQL.

## Current Readiness Decision

Hosted dry-run wiring is locally implemented and tested as a no-op rehearsal wrapper.

Real hosted dry-run execution remains pending an owner/operator window if real hosted access is required.

Hosted apply remains blocked pending explicit owner apply approval and a reviewed hosted executor.
