# Contract: R-009 Hosted Read-Only UAT Boundary

## Purpose

This contract defines what R-009 may plan now, what may be executed only after owner approval, and what remains forbidden.

## Baseline

- R-008 is accepted as local readiness only.
- R-008 is not Production acceptance.
- R-008 does not authorize hosted checks, hosted database mutation, deploy/promote, or non-Hadna data use.
- R-009 starts as planning-only.

## Allowed Now

- Create R-009 Spec Kit planning artifacts.
- Define owner approval requirements.
- Define hosted target requirements.
- Define allowed read-only checks.
- Define forbidden actions.
- Define credential and evidence redaction rules.
- Define no-op proof and stop conditions.
- Define route/persona smoke categories.
- Define read-only tenant/client isolation checks.
- Create empty or pending evidence scaffolds.
- Update AGENTS.md Spec Kit plan pointer to the R-009 plan.

## Not Allowed Now

- Hosted route checks.
- Hosted database reads outside documented planning.
- Hosted database mutation.
- Hosted deploy or promotion.
- Hosted configuration changes.
- Non-Hadna data use.
- Account creation or invitation.
- File upload, delete, download, or opening file contents.
- Approval, rejection, change request, delivery, status transition, or any business mutation.
- New dependencies.
- Product code changes.
- Production acceptance.

## Owner Approval Required Before Execution

The owner approval record must name:

- Hosted target environment or approved target label.
- Confirmation that no deploy, promotion, alias change, or configuration change is needed.
- Data boundary, limited to Hadna unless separately approved.
- Approved persona categories.
- Credential handling method.
- Approved route categories.
- Approved read-only check categories.
- Execution window and reviewer.
- Evidence redaction rules.
- No-op proof method.
- Stop conditions.
- Rollback/no-op owner and communication owner.

## Allowed After Approval

Only the following may be executed after approval is recorded:

- Sign in using approved out-of-band credentials.
- Open approved route categories.
- Observe route load and safe navigation state.
- Observe role shell and client portal visibility.
- Observe approval controls without activating them.
- Observe file list categories without opening or downloading file contents.
- Observe SLA, audit, package, and deliverable summaries through safe counts or categories.
- Check mobile and RTL rendering without screenshots in evidence.
- Record safe pass/fail/blocked outcomes.

## Always Forbidden

- Insert, update, delete, direct data repair, seed, import, migration, or mutating RPC.
- File upload, delete, visibility mutation, download, or opening file contents.
- Account creation, invitation, password reset, role change, or membership change.
- Approval, rejection, change request, internal approval, send-to-client, delivery, or status transition.
- Deploy, promotion, alias change, environment variable change, scheduled job, or hosted configuration change.
- Non-Hadna data use without separate explicit owner approval.
- Recording credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, secret values, or file contents.
- Production acceptance.

## Stop Conditions

Execution must stop if:

- Approval record is incomplete.
- Target requires deploy, promotion, account creation, or configuration change.
- Credentials are missing or outside approved persona categories.
- Route requires a write to continue.
- Page auto-submits or auto-saves hosted state.
- File proof requires opening or downloading content.
- Non-Hadna data appears outside approval.
- Evidence would require a prohibited value.
