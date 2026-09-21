# Feature Specification: R-011A Stage 2A — MVP Baseline Consolidation, SaaS Guardrails, And Professional UX Foundation

> This package supersedes the original R-011 planning-only framing for the owner-approved local Stage 2A implementation. Hosted mutation, hosted file operations, deployment, promotion, non-Hadna data, and Production acceptance remain out of scope.

**Feature Branch**: `[013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness]`

**Created**: 2026-07-09

**Status**: Planning active. This package treats R-010 residual risks and defines hosted acceptance readiness gates only. It does not authorize hosted checks, hosted mutation, deploy/promotion, account or role changes, hosted file operations, non-Hadna data use, product code implementation, or Production acceptance.

**Input**: Owner decision to start R-011 after R-010 Path B. R-008 is complete as local readiness. R-009 is closed as PARTIAL OWNER-DEFERRED. R-010 Path B is active for production-candidate planning only. Client approver hosted evidence, waiting-approval hosted evidence, and final-delivery/file-list hosted evidence remain unresolved.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Residual Risks Are Treated Explicitly (Priority: P1)

The owner needs R-011 to identify what blocks production-candidate readiness, what can be carried only as explicit residual risk, and what must be proven before any future Production acceptance package.

**Why this priority**: R-010 carries unresolved hosted categories forward. R-011 must prevent those gaps from being hidden, relabeled, or treated as pass evidence.

**Independent Test**: A reviewer can inspect R-011 and find every R-010 residual risk, its treatment, its production-candidate effect, and its Production acceptance requirement without opening hosted systems.

**Acceptance Scenarios**:

1. **Given** R-010 Path B residual risks, **When** R-011 is reviewed, **Then** client approver, waiting approval, and final delivery/file-list gaps are all listed with blocker and owner-acceptance treatment.
2. **Given** a stakeholder requests production-candidate review, **When** R-011 is reviewed, **Then** it distinguishes risks that can be owner-accepted for non-Production review from hard blockers that stop the review.
3. **Given** Production acceptance is requested, **When** R-011 is reviewed, **Then** it blocks the request until required proof or a separate Production acceptance package exists.

---

### User Story 2 - Hosted Acceptance Readiness Gates Are Defined Without Execution (Priority: P2)

The owner needs exact gates for client approver validation, waiting approval validation, final delivery/file-list validation, tenant/client isolation, approval workflow evidence, SLA reporting evidence, audit completeness, and rollback/no-op readiness.

**Why this priority**: The next package cannot safely run hosted checks or prep mutations unless the acceptance gates and evidence rules are defined first.

**Independent Test**: A reviewer can inspect the owner gate documents and identify required evidence, allowed evidence forms, stop conditions, and whether hosted mutation approval is required for each gate.

**Acceptance Scenarios**:

1. **Given** no hosted checks are authorized in R-011, **When** the gates are reviewed, **Then** every gate is defined as readiness criteria only.
2. **Given** a gate would require account, data, workflow, or file-list prep, **When** R-011 is reviewed, **Then** the gate requires explicit owner mutation approval before any hosted change.
3. **Given** evidence must be collected later, **When** R-011 is reviewed, **Then** it defines value-free evidence that does not expose prohibited data.

---

### User Story 3 - Future Owner Routes Are Clear (Priority: P3)

The owner needs R-011 to define the future route choices: R-011A limited hosted completion with mutation approval, R-011B production-candidate planning with accepted residual risk, or R-011C stop and request missing UAT data/categories.

**Why this priority**: R-011 is a readiness package. It must end with clear owner decisions rather than accidental execution.

**Independent Test**: A reviewer can inspect R-011 and choose the next route without ambiguity, while seeing which route allows hosted mutation and which route still blocks Production acceptance.

**Acceptance Scenarios**:

1. **Given** the owner wants hosted proof, **When** R-011A is selected later, **Then** hosted mutation remains blocked until exact mutation approval is recorded.
2. **Given** the owner accepts residual risk for non-Production planning, **When** R-011B is selected later, **Then** deferred risks remain visible and cannot become Production acceptance.
3. **Given** required UAT data/categories are missing, **When** R-011C is selected later, **Then** work stops and requests the missing categories instead of creating unapproved data.

---

### User Story 4 - No-Op, Redaction, And Production Boundaries Are Preserved (Priority: P4)

The reviewer needs R-011 to preserve the no hosted action, no mutation, no file operation, no non-Hadna data, no sensitive evidence, and no Production acceptance boundaries inherited from R-009 and R-010.

**Why this priority**: Planning evidence must not weaken the security and acceptance boundaries that kept R-009/R-010 safe.

**Independent Test**: A reviewer can map every R-011 artifact and task to local planning documentation only, with verification limited to local secret, whitespace, and redaction scans.

**Acceptance Scenarios**:

1. **Given** R-011 is a planning package, **When** tasks and evidence are reviewed, **Then** no hosted check or hosted mutation is marked complete.
2. **Given** evidence rules are reviewed, **When** prohibited value categories are checked, **Then** R-011 forbids credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, secrets, direct identifiers, file contents, and row-level customer content.
3. **Given** R-011 completes, **When** its status is summarized, **Then** it does not grant or imply Production readiness or Production acceptance.

### Edge Cases

- The owner accepts client approver, waiting approval, or final delivery/file-list gaps for production-candidate planning but later asks for Production acceptance.
- One owner gate is proven locally but lacks hosted evidence.
- A future validation would require direct object identifiers, file content access, non-Hadna data, or prohibited evidence.
- A future hosted prep step requires account creation, role change, workflow/status mutation, file-list exposure, or rollback planning.
- Waiting approval remains empty-state and no safe non-empty item/category is available.
- Final-delivery route/category remains present but exposes no file-list marker.
- Client approver sign-in remains blocked or protected surfaces remain inaccessible.
- Evidence or release notes accidentally overclaim R-009/R-010 as full hosted completion.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: R-011 MUST treat the three R-010 residual risks explicitly: client approver hosted controls/isolation unproven, waiting approval empty-state/unproven, and final delivery/file-list category unproven.
- **FR-002**: R-011 MUST state exactly what blocks production-candidate readiness review.
- **FR-003**: R-011 MUST state what can be owner-accepted only as residual risk for non-Production production-candidate planning.
- **FR-004**: R-011 MUST state what must be proven before any future Production acceptance package.
- **FR-005**: R-011 MUST define exact owner gates for client approver validation, waiting approval validation, final delivery/file-list validation, tenant/client isolation evidence, approval workflow evidence, SLA reporting evidence, audit completeness evidence, and rollback/no-op readiness.
- **FR-006**: Each owner gate MUST define required evidence, allowed value-free evidence forms, stop conditions, and whether hosted mutation approval is required.
- **FR-007**: R-011 MUST define the owner approval required before any hosted mutation, including environment, Hadna-only scope, exact mutation category, maximum item count, operator, approval window, rollback/no-op owner, rollback plan, evidence rules, and stop conditions.
- **FR-008**: R-011 MUST define evidence collection rules that do not expose credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, secrets, direct identifiers, file contents, or row-level customer content.
- **FR-009**: R-011 MUST define three future routes: R-011A limited hosted completion with mutation approval, R-011B production-candidate planning with accepted residual risk, and R-011C stop and request missing UAT data/categories.
- **FR-010**: R-011 MUST recommend the next implementation package after R-011 without creating it.
- **FR-011**: The original R-011 hosted/readiness boundary MUST not perform hosted checks, hosted mutation, deploy/promotion, account or role changes, hosted file operations, non-Hadna data use, dependency changes, or Production acceptance. Stage 2A may change local product code only within the scope defined below.
- **FR-012**: R-011 MUST update Spec Kit state, AGENTS.md Spec Kit pointer, project progress, and the R-011 release documentation.
- **FR-013**: R-011 MUST preserve R-009 T038, T039, and T044 as unresolved historical tasks unless a later package actually executes equivalent checks safely.
- **FR-014**: The original R-011 planning pass MUST require `git diff --check`, `npm run secret:scan`, and scoped redaction review over new R-011 docs.
- **FR-015**: Stage 2A MUST run lint/typecheck and the full local verification matrix when product code changes.

### Key Entities _(include if feature involves data)_

- **Residual Risk**: A known unresolved evidence gap carried forward from R-010.
- **Readiness Blocker**: A condition that prevents production-candidate review or any future Production acceptance package.
- **Owner Gate**: A named approval/evidence gate required before hosted acceptance or risk acceptance can proceed.
- **Hosted Mutation Approval**: A future owner decision authorizing bounded hosted prep mutation for a named category.
- **Value-Free Evidence**: Evidence recorded as status, category, count, safe state label, command name, or no-op/rollback summary without prohibited values.
- **Future Route Decision**: Owner selection of R-011A, R-011B, or R-011C after R-011 planning.
- **Production Acceptance Prerequisite**: Evidence that must exist before any package can ask for Production acceptance.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A reviewer can identify all production-candidate readiness blockers in under 5 minutes from R-011 evidence.
- **SC-002**: 100% of R-010 residual risks have an explicit treatment status: block, owner-accepted residual risk for non-Production planning, or future proof required.
- **SC-003**: 100% of required owner gates list required evidence, stop conditions, and mutation-approval requirements.
- **SC-004**: 0 R-011 artifacts claim full hosted completion, client approver hosted acceptance, waiting-approval hosted acceptance, final-delivery hosted acceptance, hosted file-list readiness, Production readiness, or Production acceptance.
- **SC-005**: 0 hosted checks, hosted mutations, account or role changes, hosted file operations, deploy/promote/config changes, non-Hadna data uses, or dependency changes occur in R-011A Stage 2A; local product-code changes are limited to the approved scope.
- **SC-006**: 0 R-011 evidence files contain prohibited values or row-level customer content.
- **SC-007**: A reviewer can identify the recommended next implementation route and required owner decision in under 5 minutes.

## Assumptions

## Stage 2A Implementation Scope

The accumulated R-007–R-011 work is treated as the local MVP baseline. Stage 2A consolidates that baseline and polishes the existing Arabic RTL operational experience across sign-in, management, clients, client detail, deliverable board/detail, SLA, internal/client approvals, files/final delivery, waiting approval, and client portal surfaces.

The implementation preserves the existing modular-monolith stack and all server-side tenant/client authorization, version-aware approval, audit, file-visibility, and SLA pause/resume rules. UI checks never replace server-side authorization.

### Acceptance Criteria

- Spec, plan, tasks, release note, and progress dashboard describe the same Stage 2A scope and remaining hosted gaps.
- Main MVP surfaces have consistent Arabic RTL hierarchy, responsive spacing, keyboard-visible focus, mobile-safe overflow, and loading/empty/denied/error/success states.
- Management, assigned-team, client-viewer, client-approver, and unauthorized-client categories have negative coverage for cross-tenant/client access and internal-content leakage.
- Internal approval remains a prerequisite for client exposure; approval, status, delivery, and file-visibility changes remain audited and version-aware.
- Local verification records lint, typecheck, unit, integration, component, E2E, RLS simulator/DB availability, secret scan, diff check, and build results without converting skipped checks into PASS.
- No hosted mutation, deployment, promotion, configuration change, non-Hadna content, or Production acceptance is performed or implied.

### Out of Scope

Hosted Stage 2B execution, UAT deployment, team-access preparation, Production acceptance, social publishing, new dependencies, database schema redesign, broad data repair, hosted file operations, and customer-content fixtures.

- R-008 remains accepted as local readiness only.
- R-009 remains closed as PARTIAL OWNER-DEFERRED and must not be relabeled as full hosted completion.
- R-010 Path B remains the active planning basis for R-011.
- Hadna remains the only permitted customer data boundary for any future hosted work unless a separate owner decision changes it.
- R-011 is documentation and readiness planning only.
- Production acceptance requires a separate future package and explicit owner decision.
