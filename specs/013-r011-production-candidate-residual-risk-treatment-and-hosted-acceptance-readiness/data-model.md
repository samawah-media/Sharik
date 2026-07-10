# Data Model: R-011 Readiness Planning Entities

Date: 2026-07-09

This package defines planning and evidence entities only. It does not create database tables, migrations, schemas, seeds, storage objects, accounts, roles, or product code.

## ResidualRisk

Represents an unresolved R-010 risk carried into R-011.

Fields:

- `risk_id`: Stable label such as `R011-RISK-001`.
- `source`: Prior package source, normally R-010 gap register or residual-risk matrix.
- `description`: Non-sensitive summary of the risk.
- `current_state`: Accepted, partial, deferred, empty-state, unproven, blocked, or stop.
- `production_candidate_treatment`: Blocker, owner-acceptable non-Production residual risk, or future proof required.
- `production_acceptance_treatment`: Required proof or hard blocker.
- `evidence_required`: Value-free evidence required in a later package.
- `mutation_approval_required`: Yes, no, or conditional.

## ReadinessBlocker

Represents a condition that stops production-candidate review or Production acceptance.

Fields:

- `blocker_id`: Stable label.
- `scope`: Production-candidate review, Production acceptance, or both.
- `condition`: Non-sensitive blocker statement.
- `owner_override`: Whether owner residual-risk acceptance can proceed.
- `required_resolution`: Proof, risk acceptance, owner mutation approval, or stop.

Validation rules:

- Tenant/client leakage, prohibited evidence, non-Hadna data, unapproved hosted mutation, hosted file content access, and Production acceptance claims have no owner override inside R-011.
- Client approver, waiting approval, and final delivery/file-list gaps can be accepted only for non-Production planning.

## OwnerGate

Represents a required readiness gate before hosted acceptance or risk acceptance.

Fields:

- `gate_id`: Stable label.
- `gate_name`: Client approver validation, waiting approval validation, final delivery/file-list validation, tenant/client isolation evidence, approval workflow evidence, SLA reporting evidence, audit completeness evidence, or rollback/no-op readiness.
- `required_evidence`: Value-free evidence needed.
- `allowed_evidence_forms`: Status, category, count, safe state, command name, no-op/rollback summary.
- `stop_conditions`: Conditions requiring stop/escalation.
- `mutation_approval_required`: Whether future hosted prep requires explicit owner approval.
- `current_status`: Pending, ready for future validation, accepted residual risk, blocked, or not applicable.

## HostedMutationApproval

Represents a future owner decision required before any hosted prep mutation.

Fields:

- `approval_status`: Not requested, requested, approved, rejected, expired.
- `environment_label`: Owner-approved environment label without URL or secret value.
- `hadna_scope`: Confirmation that work remains within approved Hadna scope.
- `operator`: Named role or owner-approved operator category.
- `approval_window`: Bounded time window.
- `mutation_category`: Client approver account/category, waiting approval item/category, final delivery/file-list category, or no-op.
- `maximum_item_count`: Exact maximum count.
- `rollback_owner`: Owner responsible for rollback/no-op decision.
- `rollback_plan`: Value-free rollback summary.
- `evidence_rules`: Redaction and allowed evidence forms.
- `stop_conditions`: Conditions that halt the package.

## ValueFreeEvidence

Represents evidence safe to record.

Fields:

- `evidence_id`: Stable label.
- `area`: Gate or risk area.
- `status`: Pass, fail, blocked, owner-deferred, accepted risk, no-go, no-op.
- `safe_summary`: Non-sensitive summary.
- `counts`: Optional aggregate counts only.
- `category_labels`: Optional category labels only.
- `prohibited_values_present`: Must be false.

## FutureRouteDecision

Represents the next owner route after R-011.

Fields:

- `route`: R-011A, R-011B, or R-011C.
- `meaning`: Limited hosted completion with mutation approval, production-candidate planning with accepted residual risk, or stop and request missing UAT data/categories.
- `allowed_actions`: Value-free planning actions or later owner-approved actions.
- `blocked_actions`: Actions still forbidden.
- `next_package`: Recommended future package path or stop condition.

## State Transitions

```text
R-010 Path B active
  -> R-011 planning active
  -> R-011 complete with owner route decision pending
  -> R-011A approved: create later limited hosted completion package with mutation approval
  -> R-011B approved: create later production-candidate planning package with residual risk accepted
  -> R-011C selected: stop and request missing UAT data/categories
```
