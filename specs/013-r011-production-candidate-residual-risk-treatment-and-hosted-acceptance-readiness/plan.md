# Implementation Plan: R-011A Stage 2A — MVP Baseline Consolidation, SaaS Guardrails, And Professional UX Foundation

**Branch**: `[013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness]` | **Date**: 2026-07-09 | **Spec**: `spec.md`

**Input**: Feature specification from `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/spec.md`

## Summary

Consolidate the already implemented R-007–R-011 local baseline into an internally testable MVP. Stage 2A updates the stale R-011 planning package, audits the actual application surfaces, hardens the documented SaaS guardrails and negative-test matrix, and polishes the Arabic RTL operational UX without hosted mutation. The original residual-risk and hosted-readiness evidence remains historical and is carried forward as explicit Stage 2B input.

Recommended next implementation route after R-011: R-011A as a separate owner-approved package for limited hosted completion with bounded mutation approval, if the owner wants the three unresolved hosted categories proven before production-candidate review. If the owner does not approve mutation or cannot supply safe categories, use R-011C to stop and request missing UAT data/categories. Use R-011B only when the owner explicitly accepts the residual risks for non-Production production-candidate planning.

## Technical Context

**Language/Version**: Existing Next.js/TypeScript application. Approved app stack remains unchanged.

**Primary Dependencies**: Existing approved dependencies only. No new dependency is planned or allowed.

**Storage**: Existing Supabase PostgreSQL, Supabase Auth, and Supabase Storage remain unchanged. No migration, seed, import, storage operation, hosted SQL, hosted DB read, or mutating RPC is allowed by R-011.

**Testing**: Lint, typecheck, unit, integration, component, E2E, RLS simulator, DB RLS when local infrastructure is available, secret scan, diff check, build, and scoped redaction review.

**Target Platform**: Existing hosted target categories may be referenced only as future owner-gated readiness categories. R-011 does not open hosted routes or perform hosted checks.

**Project Type**: Local MVP consolidation and readiness package for the existing full-stack modular monolith.

**Performance Goals**: A reviewer can identify blockers, owner gates, future route choices, and Production acceptance prerequisites within 5 minutes.

**Constraints**:

- R-008 local readiness is complete but not hosted or Production acceptance.
- R-009 is closed as PARTIAL OWNER-DEFERRED.
- R-010 Path B is active for production-candidate planning only.
- Client approver hosted evidence, waiting-approval hosted evidence, and final-delivery/file-list hosted evidence remain unresolved.
- R-011 must not perform hosted checks, hosted mutation, account or role changes, hosted file operations, deploy/promotion/config changes, non-Hadna data use, dependency changes, product code implementation, or Production acceptance.
- Evidence must remain value-free and redacted.
- Any future hosted mutation requires explicit owner approval.

**Scale/Scope**: One readiness package with future route definitions for R-011A, R-011B, and R-011C.

## Constitution Check

| Principle                                | Result | Evidence                                                                                                          |
| ---------------------------------------- | -----: | ----------------------------------------------------------------------------------------------------------------- |
| Spec before code                         |   PASS | R-011 is a Spec Kit planning package before any implementation.                                                   |
| Approved acceptance criteria             |   PASS | Spec success criteria and gate docs define reviewable outcomes.                                                   |
| Tenant/client isolation                  |   PASS | Isolation evidence is an owner gate and Production prerequisite.                                                  |
| Deny by default                          |   PASS | Hosted checks, mutation, file operations, and Production acceptance are blocked unless explicitly approved later. |
| No internal content to client            |   PASS | Client-facing validation requires internal comments/files remain hidden.                                          |
| Internal approval before client exposure |   PASS | Approval workflow evidence is a required owner gate.                                                              |
| Append-only auditability                 |   PASS | Audit completeness evidence is required before later acceptance.                                                  |
| SLA timeline integrity                   |   PASS | SLA reporting evidence is required before later acceptance.                                                       |
| No secrets in evidence                   |   PASS | R-011 evidence rules prohibit sensitive values and row-level content.                                             |
| No unreviewed dependency                 |   PASS | No dependencies are added.                                                                                        |
| No Production acceptance by implication  |   PASS | R-011 explicitly blocks Production readiness and acceptance claims.                                               |

## Project Structure

```text
specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   |-- evidence-redaction-and-no-op-contract.md
|   |-- future-route-contract.md
|   `-- owner-gates-contract.md
|-- evidence/
|   |-- evidence-map.md
|   |-- future-route-decision.md
|   |-- hosted-acceptance-readiness-gates.md
|   |-- no-op-and-rollback-readiness.md
|   |-- production-candidate-blockers.md
|   `-- residual-risk-treatment-register.md
|-- data-model.md
|-- plan.md
|-- research.md
|-- spec.md
`-- tasks.md
```

Supporting release documentation:

```text
docs/08-release/R-011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness.md
docs/PROJECT_PROGRESS.md
AGENTS.md
.specify/feature.json
```

## Production-Candidate Readiness Blockers

The following block production-candidate review unless the owner explicitly selects R-011B and accepts them as non-Production residual risks:

- Client approver hosted auth, portal, approval controls, shell/navigation, and isolation remain unproven.
- Waiting approval remains empty-state and lacks safe non-empty hosted evidence.
- Final delivery/file-list category remains unproven.
- Any required owner gate lacks either proof, a readiness plan, or an explicit residual-risk acceptance.

The following block production-candidate review even under R-011B:

- Any evidence of tenant/client scope leakage.
- Any evidence that internal comments, internal files, restricted files, or direct identifiers are exposed to client categories.
- Any need for hosted mutation without exact owner approval.
- Any need to use non-Hadna data.
- Any need to open, download, upload, delete, replace, or mutate hosted file content.
- Any evidence that would expose credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, secrets, direct identifiers, file contents, or row-level customer content.
- Any Production acceptance claim.

## Owner-Acceptable Residual Risk

The owner may accept these as residual risk only for non-Production production-candidate planning:

- Client approver hosted validation is not yet proven, while local/read-only available-category evidence remains separate.
- Waiting approval is not yet proven with a safe non-empty hosted item/category.
- Final delivery/file-list category is not yet proven in hosted evidence.

This acceptance cannot replace Production acceptance, tenant/client isolation proof, approval workflow proof, audit completeness, SLA reporting evidence, or redaction compliance.

## Proof Required Before Any Production Acceptance Package

Before any future Production acceptance package can be requested, a separate package must prove or formally close:

- Client approver auth, portal, approval controls, role shell/navigation, and tenant/client isolation.
- Waiting approval with a safe non-empty item/category.
- Final delivery/file-list visibility without hosted file content operations.
- Tenant/client isolation across management, internal, client viewer, client approver, and unauthorized categories.
- Approval workflow evidence that no client-facing approval occurs before internal approval and that no approval/status/delivery mutation bypasses audit.
- SLA reporting evidence, including waiting-client pause behavior where applicable.
- Audit completeness evidence for approval/status/delivery and any prep mutations.
- Rollback/no-op readiness for any owner-approved hosted prep.
- Value-free evidence and passing local secret, whitespace, and redaction scans.

## Owner Approval Required For Hosted Mutation

Any future hosted mutation, including account/category correction or creating/exposing safe waiting/final-delivery categories, requires explicit owner approval that names:

- Hosted environment and Hadna-only tenant/client boundary.
- Operator and approval window.
- Exact mutation category and maximum item count.
- Whether each approved action is create, fix, expose, archive, disable, or no-op.
- Rollback/no-op owner and rollback window.
- Required audit-log behavior for any workflow/state mutation.
- Evidence redaction rules and allowed evidence forms.
- Stop conditions and escalation owner.
- Confirmation that Production acceptance, deploy/promotion, hosted configuration change, broad data repair, non-Hadna data, direct unscoped SQL, broad account/role repair, and file content operations remain forbidden.

## Owner Gates

| Gate                                | Minimum readiness evidence                                                                                                                      | Blocks review when                                                                             | Mutation approval needed when                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Client approver validation          | Auth reaches protected client approver surface, approval controls are visible only where allowed, shell/navigation match role, isolation holds. | Auth or protected surface remains blocked and owner has not selected R-011B risk acceptance.   | Account/category fix or creation is required.                |
| Waiting approval validation         | Safe non-empty waiting-approval category is available for later read-only validation.                                                           | Only empty-state exists and owner has not selected R-011B risk acceptance.                     | A waiting item/category must be created, moved, or exposed.  |
| Final delivery/file-list validation | Safe final-delivery/file-list category is available without file content operations.                                                            | File-list marker remains unproven and owner has not selected R-011B risk acceptance.           | A final-delivery marker/category must be created or exposed. |
| Tenant/client isolation evidence    | Management, internal, client viewer, client approver, and unauthorized category boundaries are documented.                                      | Leakage is observed or client approver isolation has neither proof nor risk acceptance.        | Data/category prep is needed to prove a missing persona.     |
| Approval workflow evidence          | Internal approval precedes client exposure; client approval/change request is authorized and audited.                                           | Workflow bypass, missing audit, or unproven client approver controls are not accepted as risk. | Any status/workflow item must be created or moved.           |
| SLA reporting evidence              | Waiting-client pause and reporting categories are available or planned.                                                                         | SLA evidence contradicts AGENTS.md or lacks required reporting basis.                          | SLA state/data prep is needed.                               |
| Audit completeness evidence         | Required events exist for approval, change request, delivery, and prep mutations.                                                               | Any sensitive business action lacks audit-log expectations.                                    | Any prep mutation must be audited.                           |
| Rollback/no-op readiness            | Rollback/no-op owner, stop conditions, and no-op proof method are defined.                                                                      | Rollback owner/plan is missing for any future mutation.                                        | Any hosted mutation is approved.                             |

## Future Route Decision

- **R-011A - Limited hosted completion with mutation approval**: Use when owner wants proof for the three unresolved categories and accepts bounded hosted prep mutation. Recommended if production-candidate review should reduce residual security/workflow risk before proceeding.
- **R-011B - Production-candidate planning with accepted residual risk**: Use when owner accepts the unresolved hosted categories as non-Production residual risks and wants planning to continue without hosted mutation. This still blocks Production acceptance.
- **R-011C - Stop and request missing UAT data/categories**: Use when owner will not accept residual risk and will not approve mutation/prep. This route pauses until safe categories or data are supplied.

## Stage 2A Workstreams

1. **Repository/spec consolidation** — reconcile R-010/R-011 tasks, document completed local dry-run work, and maintain a concise status dashboard without rewriting historical evidence.
2. **UX foundation** — improve the existing app surfaces, shared shell, forms, cards, states, board ergonomics, focus behavior, mobile overflow, and Arabic copy using approved dependencies only.
3. **SaaS guardrails** — review touched reads/commands/routes/file guards for tenant/client scope and add synthetic negative coverage for management, assigned team, client viewer, client approver, and unauthorized categories.
4. **Verification and handoff** — run local checks, record unavailable infrastructure honestly, prepare reviewable local commits, and generate the bounded Stage 2B prompt.

## Verification Plan

- Run `git diff --check`.
- Run `npm run secret:scan`.
- Run scoped redaction scan over new R-011 docs with count-only output and manual review of keyword matches as redaction vocabulary.
- Because Stage 2A changes product code, run the full local verification matrix and record unavailable RLS DB/hosted checks as blocked or skipped.

## Stage 2B Boundary

The next package is Stage 2B: reviewed hosted executor, bounded Hadna-only gap closure, UAT deployment, and team-access preparation. It requires explicit owner approval and must not be inferred from local green checks.

## Agent Context Position

Update `.specify/feature.json` and the managed Spec Kit pointer in `AGENTS.md` to point to:

`specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/plan.md`
