# Feature Specification: R-011A Stage 2C - Internal Team MVP Trial, Defect Burn-down, And Production-Candidate Hardening

**Feature Branch**: `codex/r011a-mvp-baseline-consolidation`
**Created**: 2026-07-10
**Status**: Stage 2C local execution active
**Input**: Owner objective to move Samawah from local MVP readiness into a controlled internal team MVP trial and production-candidate hardening cycle.

## Scope Boundary

Stage 2C is a local, bounded internal MVP trial and hardening pass using Hadna-only synthetic/local data. It does not authorize hosted mutation, deployment, promotion, access configuration changes, real customer data, hosted file content operations, broad repair, new dependencies, or Production acceptance.

## Open R-011A Reconciliation

- R-011A T032 remains open because hosted completion checks still require a reviewed hosted executor and separately approved hosted/UAT actions.
- Stage 2B evidence remains value-free and local/no-op where hosted execution was blocked by missing reviewed executor.
- Stage 2C may improve local test coverage, UX, workflow hardening, documentation, and evidence, but it cannot close hosted evidence gaps or claim Production readiness.

## Out Of Scope

- Production readiness or Production acceptance.
- Hosted database reads/writes, hosted route checks, hosted file content operations, hosted account changes, deployment, promotion, domain, environment, or access configuration changes.
- Real customer data or non-Hadna data.
- Broad data repair or mutation outside reviewed local synthetic fixtures.
- New dependencies without ADR and owner approval.
- Replacing the approved V1 stack or changing the tenancy, approval, SLA, files, or audit models.

## Defect Severity Model

- P0: Security, tenant leakage, client data leakage, internal comment/file exposure to client users, or uncontrolled hosted/Production action.
- P1: Workflow bypass, approval bypass, stale-version approval accepted, SLA pause/resume break, audit omission for sensitive transitions, or role permission bypass.
- P2: Major usability, accessibility, data integrity, mobile RTL, keyboard, stale-state, or evidence-quality issue that blocks a realistic internal trial.
- P3: Cosmetic or minor copy/layout issue that does not block trial execution or security/business correctness.

## User Scenarios And Testing

### User Story 1 - Management Executes The Full Deliverable Lifecycle (Priority: P1)

Management/admin users can create a synthetic Hadna deliverable, assign it, review team execution, internally approve it, submit it to the client, complete client approval, mark final delivery, close it, and review audit evidence.

**Independent Test**: A local Hadna-only synthetic journey proves each lifecycle transition, role permission boundary, SLA state, and audit event without exposing internal content to clients.

**Acceptance Scenarios**:

1. Given a management/admin role and Hadna synthetic data, when the deliverable moves through creation, assignment, execution, internal review, internal approval, client approval, delivery, and closure, then each allowed transition succeeds and records audit evidence.
2. Given a deliverable not internally approved, when management attempts client submission, then submission is denied or blocked until internal approval exists.
3. Given management views the audit trail, then sensitive values are not present in the recorded evidence.

### User Story 2 - Assigned Team Executes Work Without Approval Bypass (Priority: P1)

Assigned team users can see only assigned client work, execute tasks, upload or reference local synthetic file metadata where allowed, and write internal comments, while approval/send actions remain denied where applicable.

**Independent Test**: Assigned team checks prove assigned-client visibility, denied cross-client access, denied internal approval/send actions, and internal comment/file secrecy.

**Acceptance Scenarios**:

1. Given an assigned team role, when the user opens assigned Hadna work, then only assigned client-scoped deliverables and permitted files/comments are visible.
2. Given the same role, when it attempts internal approval, client submission, final delivery, or cross-client access, then the action is denied safely and audited when required.

### User Story 3 - Client Viewer And Client Approver Use Client-Scoped Portal Safely (Priority: P1)

Client viewer users can inspect only client-visible, client-scoped state without approval actions. Client approver users can approve or request changes only for the current version in their own client scope, with approval comments and audit evidence.

**Independent Test**: Client viewer, client approver, and unauthorized client checks prove client scoping, hidden internal comments/files, current-version enforcement, direct URL denial, no resource enumeration, no file download, and no approval-link reuse.

**Acceptance Scenarios**:

1. Given a client viewer, when the viewer opens waiting approval or delivery areas, then no internal comments, internal files, or approval action controls are visible.
2. Given a client approver and the current version, when approving or requesting changes, then the decision succeeds only for that client and version and records value-free audit evidence.
3. Given an unauthorized client or stale approval link, when direct access or approval is attempted, then access is denied safely without resource enumeration.

### User Story 4 - Trial UX, RTL, Accessibility, And Defect Burn-down Are Evidence-backed (Priority: P2)

Trial operators can evaluate sign-in, dashboards, clients, deliverables, Kanban, detail, SLA, approval, files/final delivery, waiting approval, client portal, and all loading/empty/denied/error/success/stale states across desktop, mobile Arabic RTL, and keyboard accessibility.

**Independent Test**: Local automated and manual evidence proves mobile RTL, keyboard navigation, visible focus, semantic controls, responsive overflow safety, hydration status, and defect severity/burn-down.

**Acceptance Scenarios**:

1. Given desktop and mobile trial viewports, when core screens render in RTL, then content remains readable, controls remain operable, and no horizontal overflow blocks use.
2. Given keyboard-only navigation, when users operate forms, dialogs, buttons, links, and approval flows, then visible focus and semantic labels are available.
3. Given defects are found, when they are recorded, then each has severity, owner/status, evidence, retest result, and Production impact.

## Functional Requirements

- FR-001: The trial package MUST define a role matrix for management/admin, project manager, account manager, assigned team, client viewer, client approver, and unauthorized client categories.
- FR-002: The trial MUST use Hadna-only synthetic/local data and record evidence without customer values, URLs, emails, signed paths, screenshots containing sensitive data, or file content.
- FR-003: The full deliverable lifecycle MUST be validated from creation through closure, including denied unsafe transitions.
- FR-004: SLA evidence MUST include start, at-risk, overdue, paused-waiting-client, resume, and completed states.
- FR-005: Internal comments and internal files MUST remain hidden from client viewer, client approver, and unauthorized users.
- FR-006: Client approvals MUST be version-aware and deny stale-version approval or approval-link reuse.
- FR-007: Audit evidence MUST exist for sensitive transitions, approvals, change requests, SLA pause/resume, delivery, denial, and no-op/blocked actions where required.
- FR-008: Every touched query, server action, command, route guard, file guard, approval path, status transition, and audit event MUST be checked for tenant/client scope and deny-by-default behavior.
- FR-009: The trial MUST classify defects as P0, P1, P2, or P3 and block Production readiness unless all required gates are green.
- FR-010: Required verification commands MUST be run or honestly recorded as skipped/blocked with the reason.
- FR-011: Stage 2C MUST preserve open hosted blockers, especially R-011A T032, until separately approved hosted evidence exists.
- FR-012: No deployment, promotion, environment, domain, or team-access configuration mutation may occur during Stage 2C without separate owner approval.

## Success Criteria

- SC-001: 100% of required Stage 2C role categories have local Hadna-only evidence or an honest blocked/skipped reason.
- SC-002: 100% of required lifecycle and SLA states have automated or documented local trial evidence.
- SC-003: 0 P0 and 0 P1 defects remain open before any production-candidate claim.
- SC-004: All P2 defects are either fixed and retested or explicitly accepted as non-Production trial limitations.
- SC-005: Required commands are run locally where infrastructure is available; any skipped/blocked check is recorded with exact reason.
- SC-006: Evidence contains no real customer data, hosted secrets, signed file paths, emails, URLs, or hosted file content.
- SC-007: Production boundary remains explicit: Stage 2C can support an internal MVP trial only and cannot authorize Production.

## Key Entities

- Trial Role Category: management/admin, project manager, account manager, assigned team, client viewer, client approver, unauthorized client.
- Trial Scenario: local Hadna-only workflow step with expected allow/deny result.
- Defect: severity, affected role/surface, evidence, status, retest result, Production impact.
- Evidence Record: value-free local result, command output summary, mutation/no-op count, audit expectation, redaction status.
- Gate: measurable condition for internal trial continuation or production-candidate consideration.

## Assumptions

- Existing local synthetic fixtures and test helpers are the approved source for Hadna-only trial data.
- No new dependency is needed for Stage 2C.
- Existing R-007 through R-011A local workflow, authorization, SLA, files, comments, audit, and E2E surfaces should be reused and extended instead of replaced.
- UAT deployment and team-access configuration are not approved in this request.
