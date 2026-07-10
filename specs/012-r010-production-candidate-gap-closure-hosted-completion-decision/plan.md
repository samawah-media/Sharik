# Implementation Plan: R-010 Production-Candidate Gap Closure / Hosted Completion Decision

**Branch**: `[012-r010-production-candidate-gap-closure-hosted-completion-decision]` | **Date**: 2026-07-09 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/spec.md`

## Summary

Create a planning-only R-010 Path B gap closure package that follows the owner decision to close R-009 as PARTIAL OWNER-DEFERRED after the final retry and continue production-candidate planning using R-009 as partial owner-deferred evidence. R-010 is now an evidence-hardening package, not an execution package. Path B is active for planning only. Path A remains a fallback if the owner later decides the unresolved hosted categories must be fixed or exposed through explicit hosted mutation approval.

No code, dependency, database, storage, hosted configuration, account, hosted file-operation, hosted mutation, non-Hadna data, deploy, promotion, or Production acceptance is authorized by this proposed package.

2026-07-09 owner closure decision: R-009 is closed as PARTIAL OWNER-DEFERRED. No more R-009 hosted checks are authorized. R-010 proceeds as planning/gap closure only.

2026-07-09 owner Path B decision: use R-009 as partial owner-deferred evidence for production-candidate planning. Do not perform hosted mutation, hosted checks, deploy/promote, account/role changes, hosted file operations, non-Hadna data use, code implementation, or Production acceptance.

2026-07-09 evidence reassessment: the local env source later became available, but client approver sign-in did not complete, waiting approval remained empty-state, and the final-delivery route category did not expose file-list/final-delivery signals. Path A therefore requires explicit owner mutation approval if fixing or exposing the missing categories needs account/category/data changes. Path B carries the gaps as explicit risk.

## Technical Context

**Language/Version**: Documentation and Spec Kit planning only. Existing app stack remains unchanged.

**Primary Dependencies**: Existing approved dependencies only. No new dependency is planned or allowed by this R-010 proposal.

**Storage**: Existing Supabase PostgreSQL, Supabase Auth, and Supabase Storage remain unchanged. No migration, seed, import, storage operation, hosted SQL, or mutating RPC is allowed by this proposed package.

**Testing**: Planning validation uses document review, secret scan, whitespace check, and scoped redaction scan. Lint/typecheck are needed only if product code changes in a later owner-approved package.

**Target Platform**: Existing hosted target categories only if a later owner-approved package authorizes Path A prep or a future read-only verification. Path B is planning-only unless a later package says otherwise.

**Project Type**: Spec Kit release decision package for the existing full-stack modular monolith.

**Constraints**:

- R-009 is closed as partial owner-deferred available-category hosted read-only evidence.
- R-009 is closed and no more R-009 hosted checks are authorized.
- R-010 is planning-only until owner selects Path A, Path B, or stop.
- No hosted execution starts from this proposal.
- No hosted mutation, hosted file operation, account creation, deploy, promotion, configuration change, non-Hadna data use, dependency change, product code change, or Production acceptance is authorized.
- Evidence must remain category-only and redacted.
- Deferred R-009 categories must not be counted as pass evidence unless executed safely in a later separately approved package.

**Scale/Scope**: One decision package with two possible owner paths.

## Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | R-010 is spec/plan/tasks only. |
| Tenant/client isolation | PASS | Deferred categories remain visible and cannot be overclaimed. |
| Deny by default | PASS | Path B planning is active; hosted execution and Production acceptance remain blocked. |
| No hosted mutation without approval | PASS | Mutation remains forbidden. |
| No secrets in evidence | PASS | Redaction rules inherited from R-009. |
| No new dependency | PASS | No dependency change. |
| Production acceptance separate | PASS | Production acceptance is not granted or implied. |
| R-009 closure honored | PASS | R-009 is closed partial owner-deferred; R-010 does not run more R-009 hosted checks. |
| Path B truthfulness | PASS | Accepted evidence, partial/deferred evidence, residual risks, and forbidden claims are separated. |

## Project Structure

```text
specs/012-r010-production-candidate-gap-closure-hosted-completion-decision/
|-- evidence/
|   |-- gap-closure-decision.md
|   |-- path-b-rollback-and-no-op.md
|   |-- production-candidate-gap-register.md
|   |-- production-candidate-go-no-go-checklist.md
|   `-- residual-risk-matrix.md
|-- spec.md
|-- plan.md
`-- tasks.md
```

This package keeps R-010 as planning/evidence only. It does not update `AGENTS.md` or `.specify/feature.json` because R-010 is not active implementation until the owner chooses a future path.

## Unresolved R-009 Gaps

R-010 carries forward exactly three unresolved hosted categories:

- Client approver credential/auth gap: corrected credential categories were present, but sign-in stayed on a generic authentication surface, so portal, approval controls, shell/navigation, and isolation remain unproven.
- Waiting approval empty-state gap: the waiting route/category value was empty, so no waiting route opened and no safe waiting item existed for hosted evidence.
- Final delivery list/category gap: the final-delivery route opened read-only but exposed no file-list/final-delivery marker, and no hosted file operation occurred.

## Evidence Accepted From R-008/R-009

Path B accepts the following as production-candidate planning input only:

- R-008 local readiness evidence, including local checks and local evidence packaging, remains accepted as local readiness only.
- R-009 available-category hosted read-only evidence passed for management/project admin, assigned internal/account manager, client viewer, and unassigned/unauthorized client categories.
- R-009 no-op proof remains accepted for planning: no hosted mutation, no direct hosted SQL/data API read by this agent, no hosted file operation, no account creation, no deploy/promotion/config change, no non-Hadna data use, no approval/status/delivery mutation, no screenshot, and no Production acceptance.
- R-009 evidence redaction rules remain accepted as the evidence standard for the next package.

## Evidence Partial Or Deferred

Path B carries forward the following as partial/deferred evidence, not pass evidence:

- Client approver credential/auth/portal/approval controls/shell/navigation/isolation hosted evidence remains unproven.
- Waiting approval remains an empty-state hosted evidence gap because no safe non-empty waiting item/category was inspected.
- Final delivery list/category remains unproven because the route state did not expose file-list/final-delivery markers and no hosted file operation occurred.
- R-009 T038, T039, and T044 remain unchecked.

## Claims Still Blocked

Path B cannot claim:

- Full R-009 hosted completion.
- Client approver hosted acceptance.
- Waiting-approval hosted acceptance.
- Final-delivery list/category hosted acceptance.
- Hosted file-list readiness.
- Production acceptance.

## Path A: Fallback Hosted Completion Prep With Explicit Owner Mutation Approval

Use Path A only if the owner later decides that the Path B residual risks cannot be carried into the next package or if a required production-candidate check cannot be completed without safely creating/fixing/exposing the missing hosted categories. This planning pass does not grant that approval.

Required owner approval fields:

- Named hosted environment and Hadna-only client/tenant boundary.
- Named operator and approval window.
- Exact mutation categories approved and maximum item count for each category.
- Rollback/no-op owner and rollback window.
- Evidence redaction rules and allowed evidence forms.
- Stop conditions and escalation owner.
- Explicit statement that Production acceptance, deploy/promotion, non-Hadna data, broad data repair, and file content operations remain forbidden.

Exact candidate mutation boundaries:

- Client approver account/category: fix or create at most one safe client approver account/category in the approved Hadna scope. No broader role model change, account migration, password reset campaign, or unrelated membership change is allowed.
- Waiting approval item: create or expose at most one safe waiting-approval item in the approved Hadna scope. If a workflow/status mutation is used, it must follow the normal approval workflow and audit-log policy.
- Final delivery list/category: create or expose at most one safe final-delivery list/category marker in the approved Hadna scope. File content must not be opened, downloaded, uploaded, deleted, replaced, or visibility-mutated outside the exact approved category exposure.

Rollback/no-op plan:

- Prefer exposing an existing safe category over creating data.
- If a client approver account/category is created only for evidence prep, define whether it will be disabled, removed from scope, or retained as an approved UAT account/category after review.
- If a waiting-approval item is created or moved, define the reversible state and audit trail before the mutation.
- If a final-delivery list/category marker is created, define how it is hidden, archived, or removed without touching file content.
- If any planned rollback would require a broader mutation than the original approval, stop before mutation and return to the owner.

Evidence rules:

- Evidence may record only path status, category names, counts, safe state labels, command names, and no-op/rollback status.
- Evidence must not record credentials, emails, screenshots, workbook content, route links, captions, deliverable titles, token values, secret values, direct identifiers, file contents, row-level customer content, or hosted target values.

Stop conditions:

- No explicit mutation approval is recorded.
- A proposed mutation exceeds the exact approved category or item count.
- The work requires non-Hadna data, direct object identifiers in evidence, direct unscoped SQL, role model changes, deploy/promotion, hosted configuration changes, file content access, approval decisions, or Production acceptance.
- The rollback owner or rollback/no-op plan is missing.
- The route exposes unapproved scope or prohibited evidence.

## Path B: Defer Hosted Categories And Proceed With Production-Candidate Planning

Path B is the active owner-selected path. Use it to accept R-009 partial available-category evidence for planning only and intentionally defer missing categories. Path B must carry these gaps forward:

- Client approver hosted read-only evidence missing.
- Waiting-approval hosted non-empty/read-only evidence missing.
- Final-delivery list/category hosted evidence missing.

Residual risks:

- Client approver login, portal, approval-control visibility, shell/navigation, and isolation remain unproven in hosted evidence.
- The client-facing waiting-approval path has not been shown with a safe non-empty item in hosted evidence.
- The final-delivery list/category has not been shown in hosted evidence.
- R-009 T038, T039, and T044 remain unchecked.

Cannot be claimed under Path B:

- Full R-009 hosted completion.
- Client approver hosted acceptance.
- Waiting-approval hosted acceptance.
- Final-delivery list/category hosted acceptance.
- Hosted file-list readiness beyond the unresolved route-state observation.
- Production acceptance.

Path B can plan production-candidate risk treatment, but it does not grant Production acceptance.

## Required Checks Before Any Production Acceptance Package

- Confirm client approver auth, portal, approval controls, role shell/navigation, and isolation are either proven in a later owner-approved package or explicitly accepted as residual risk by the owner for a non-Production milestone only.
- Confirm a safe non-empty waiting-approval item/category is proven in a later owner-approved package or explicitly accepted as residual risk by the owner for a non-Production milestone only.
- Confirm final-delivery list/category visibility is proven without hosted file upload/download/open/delete/content access, or explicitly accepted as residual risk by the owner for a non-Production milestone only.
- Confirm tenant/client isolation remains proven for all personas and no customer-scope leakage is observed.
- Confirm no internal comments, restricted files, direct identifiers, credentials, emails, route links, captions, deliverable titles, tokens, secrets, file contents, or row-level customer content appear in evidence.
- Confirm audit-log and SLA boundaries remain intact for any future workflow/state checks.
- Confirm `npm run secret:scan`, `git diff --check`, and scoped redaction scans pass for the package under review.
- Confirm lint/typecheck/test gates run if any product code changes in a future package.

## Triggers For Returning To Path A

Return to Path A only after a separate owner decision if any of these occur:

- The owner no longer accepts client approver, waiting-approval, or final-delivery hosted gaps as residual planning risk.
- The next package requires actual hosted evidence for client approver controls, a non-empty waiting item, or final-delivery list/category visibility before it can proceed.
- A safe category cannot be exposed without a bounded account/category/data change.
- Production acceptance is requested before the missing hosted categories are proven or separately accepted through a formal risk decision.
- A proposed check would require direct object identifiers, file content access, broad account/role repair, non-Hadna data, hosted configuration changes, deploy/promotion, or unbounded mutation.

## Next Spec Kit Package After R-010

Recommended next package:

`specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/`

Purpose: convert the R-010 Path B planning package into an owner-approved production-candidate readiness pass that treats the residual risks, defines any required local implementation or verification work, and prepares a later hosted acceptance package without granting Production acceptance.

## Verification Plan

- Run `npm run secret:scan`.
- Run `git diff --check`.
- Run scoped redaction scan over touched R-010 docs and selected R-009 closure docs using count-only output.
- Do not run lint/typecheck unless product code changes.

## Agent Context Position

Do not update the active Spec Kit pointer for this planning package. R-009 remains the latest active closure package until the owner selects a future R-010 implementation path or a separate package.
