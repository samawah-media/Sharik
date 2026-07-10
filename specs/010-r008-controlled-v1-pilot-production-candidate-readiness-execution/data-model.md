# Data Model: R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution

This file describes the planning and evidence entities for R-008. It does not introduce database migrations by itself. Exact persistence changes, if any, must be confirmed during later implementation tasks and reviewed against tenant/client isolation rules.

## Pilot Execution Gate

Represents a controlled checkpoint before pilot progression.

**Key attributes**:

- Gate identifier
- Gate area: pilot control, isolation, security, hosted UAT, approvals, files, audit, SLA, rollback, owner evidence
- Entry criteria
- Exit criteria
- Evidence owner
- Evidence path
- Status: `not_started`, `in_progress`, `passed`, `failed`, `blocked`, `accepted_with_risk`
- Residual risk summary
- Required owner decision

**Rules**:

- Hosted mutation, non-Hadna data, deploy/promote, and Production acceptance gates start as blocked.
- Security, isolation, approval, file, audit, or SLA failures block production-candidate readiness.
- Accepted-with-risk status requires explicit owner acceptance and must not imply Production acceptance.

## Isolation Proof

Represents evidence that tenant and client boundaries hold across a path.

**Key attributes**:

- Persona category
- Tenant/client scope
- Surface or command category
- Allowed result
- Denied result
- Audit or denial evidence
- Test or review reference

**Rules**:

- Proof must include positive and negative scenarios.
- Client users must not see other-client data, internal comments, internal files, drafts, or management-only navigation.
- Assigned internal users must not gain management-only powers by default.

## Security Checklist Item

Represents a production-candidate security control.

**Key attributes**:

- Control area
- Requirement
- Evidence needed
- Status: `not_started`, `passed`, `failed`, `blocked`, `accepted_with_risk`
- Risk severity
- Remediation or owner decision

**Rules**:

- Missing tenant/client isolation evidence is blocking.
- Missing audit evidence for sensitive transitions is blocking.
- Redaction or secret-scan failure is blocking until corrected.

## Hosted UAT Authorization

Represents the exact owner-approved boundary for hosted action.

**Key attributes**:

- Environment name
- Data boundary
- Allowed actors
- Allowed mutation type
- Allowed routes or workflows
- Start/end or review window
- Rollback owner
- Evidence rules
- Approval record

**Rules**:

- No hosted mutation may occur without this record.
- Non-Hadna customer data requires a separate explicit owner approval.
- Hosted approval does not imply Production acceptance.

## Approval Journey Probe

Represents a scenario proving client approval readiness.

**Key attributes**:

- Persona category
- Deliverable state category
- Version state category
- Attempted action
- Expected result
- Audit requirement
- SLA impact

**Rules**:

- Client approval must bind to the current visible version.
- Stale or superseded version decisions must be denied.
- Client viewer denial must be safe and auditable.

## Final Delivery Probe

Represents a scenario proving file and final delivery readiness.

**Key attributes**:

- File visibility category
- Deliverable state category
- Persona category
- Expected visibility
- Download authorization result
- Final delivery audit requirement

**Rules**:

- Internal files remain hidden from clients.
- Final delivery files require authorized final visibility.
- Download authorization must enforce tenant/client scope.

## Audit Completeness Matrix

Represents required audit coverage.

**Key attributes**:

- Event category
- Success path covered
- Denial path covered
- Actor category
- Entity scope
- Evidence reference
- Gap or blocker

**Rules**:

- Approval, rejection, change request, send-to-client, delivery, file visibility change, SLA pause/resume, package-affecting change, and security denial events require audit evidence.
- Audit evidence summaries must not print sensitive values or customer content.

## SLA Reporting Probe

Represents a scenario proving SLA reporting readiness.

**Key attributes**:

- Deliverable state category
- Timeline segment category
- Ownership classification
- Reported status
- Client waiting duration handling
- Risk state

**Rules**:

- Waiting-client time must not count against Samawah.
- Resume after client change request must return ownership to team work.
- Internal-decision pause must be distinguishable from client waiting.

## Rollback Plan

Represents recovery steps before hosted UAT or production-candidate action.

**Key attributes**:

- Rollback area: code, config, hosted data, files, communication, permissions
- Trigger
- Owner
- Steps
- Verification after rollback
- Communication note

**Rules**:

- Hosted mutation cannot be approved without rollback steps.
- Rollback must include data/file visibility changes, not only code.

## Go/No-Go Evidence Package

Represents the final owner-facing decision bundle.

**Key attributes**:

- Scope summary
- Gate status summary
- Verification summary
- Phase 8 verification status
- Residual risks
- Blocked scope
- Rollback readiness
- Decision options
- Owner decision required
- Production acceptance boundary

**Rules**:

- Evidence must be safe summaries only.
- Decision options must include accepting local readiness only, requesting fixes, authorizing limited hosted read-only UAT, authorizing limited hosted UAT mutation with a complete named boundary, and starting a separate production-candidate package.
- Decision options must not grant or imply Production acceptance.
- Production acceptance remains a separate explicit owner decision after any later production-candidate package.
