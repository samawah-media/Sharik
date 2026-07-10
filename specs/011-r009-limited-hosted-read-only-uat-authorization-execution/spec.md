# Feature Specification: R-009 Limited Hosted Read-Only UAT Authorization & Execution

**Feature Branch**: `[011-r009-limited-hosted-read-only-uat-authorization-execution]`

**Created**: 2026-07-08

**Status**: Active - owner approval recorded for limited read-only start pass; Phase 5 route/persona smoke partially executed read-only; hosted isolation execution blocked until Phase 5 fully passes safely

**Input**: User description: "Owner accepts R-008 local readiness only and authorizes creating R-009 Limited Hosted Read-Only UAT Authorization & Execution as a new Spec Kit package. Planning only. No hosted checks or mutation until R-009 approval is recorded."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner Locks The Hosted UAT Authorization Gate (Priority: P1)

The owner needs R-009 to convert R-008 local readiness into a strict hosted read-only UAT authorization gate without accidentally authorizing hosted checks, hosted mutation, deploy/promote activity, non-Hadna data use, or Production acceptance.

**Why this priority**: R-008 is accepted only as local readiness. R-009 must be safe even before execution by making owner approval the first executable gate.

**Independent Test**: A reviewer can inspect the R-009 package and identify that hosted read-only UAT remains blocked until the owner approval record is complete.

**Acceptance Scenarios**:

1. **Given** R-008 is accepted as local readiness only, **When** R-009 is reviewed, **Then** it states that R-008 is not Production acceptance and does not authorize hosted mutation, deploy/promote, or non-Hadna data use.
2. **Given** no R-009 owner approval record is complete, **When** any hosted check is proposed, **Then** the package classifies the action as blocked.
3. **Given** the owner later approves execution, **When** the approval record is reviewed, **Then** it names target, data boundary, personas, route categories, read-only checks, duration, credential handling, evidence rules, no-op proof, stop conditions, and rollback/no-op owner before execution starts.

---

### User Story 2 - Release Reviewer Defines The Hosted Read-Only Target (Priority: P2)

The release reviewer needs exact target requirements for a limited hosted read-only UAT run that can be executed without deploy, promotion, configuration change, account creation, file mutation, or database mutation.

**Why this priority**: A vague hosted target can lead to accidental promotion, unapproved credentials, or unsafe data exposure.

**Independent Test**: A reviewer can verify the target requirements checklist and determine whether a proposed hosted target is complete, incomplete, or forbidden.

**Acceptance Scenarios**:

1. **Given** a hosted target is proposed, **When** it requires deploy, promotion, alias change, or configuration change, **Then** R-009 rejects the target as out of scope.
2. **Given** a hosted target is proposed, **When** it includes non-Hadna data without separate approval, **Then** R-009 rejects the target as out of scope.
3. **Given** a hosted target is approved, **When** credentials are needed, **Then** credentials remain out-of-band and evidence records only role or persona categories.

---

### User Story 3 - UAT Reviewer Runs Only Approved Read-Only Smoke Categories (Priority: P3)

After owner approval is recorded, the UAT reviewer needs a route and persona smoke plan that verifies the hosted app through read-only inspection only.

**Why this priority**: Read-only hosted UAT should provide confidence in real hosting behavior without changing hosted state.

**Independent Test**: The reviewer can map every proposed hosted action to an allowed read-only category or a forbidden category before execution.

**Acceptance Scenarios**:

1. **Given** an approved persona category signs in, **When** the reviewer opens approved route categories, **Then** the reviewer records only safe status and route category outcomes.
2. **Given** a page exposes approval, upload, delete, invite, edit, status-change, delivery, or account controls, **When** the reviewer sees those controls, **Then** the reviewer does not activate them and records a safe blocked-action observation only.
3. **Given** mobile or RTL checks are needed, **When** they are executed, **Then** evidence records pass/fail summaries without screenshots.

---

### User Story 4 - Security Reviewer Proves Read-Only Isolation Without Mutating State (Priority: P4)

The security reviewer needs read-only tenant/client isolation checks that verify management, assigned internal, client approver, client viewer, and unassigned categories without creating, modifying, approving, deleting, or downloading content.

**Why this priority**: Tenant/client isolation remains the highest production-readiness risk, but hosted checks must not mutate or expose data.

**Independent Test**: The reviewer can inspect the isolation check plan and see positive and negative read-only checks for each approved persona category.

**Acceptance Scenarios**:

1. **Given** a client persona is approved, **When** the reviewer opens approved client route categories, **Then** only the approved client scope appears.
2. **Given** an unassigned or unauthorized persona category is approved for negative testing, **When** the reviewer opens approved route categories, **Then** the app shows a safe empty or denied state without customer content.
3. **Given** a file, comment, approval, audit, SLA, package, or deliverable surface is inspected, **When** the reviewer records evidence, **Then** evidence uses only safe counts, categories, or statuses.

---

### User Story 5 - Owner Receives Redacted No-Op Execution Evidence (Priority: P5)

The owner needs a post-execution evidence package, if and only if execution is later approved, that proves what was checked, what remained untouched, what was blocked, and what decision is now requested.

**Why this priority**: Hosted read-only UAT is useful only if the evidence proves both readiness signals and no-op behavior without leaking sensitive information.

**Independent Test**: The owner can review the R-009 evidence package and decide whether to request fixes, authorize another limited UAT pass, start a separate mutation UAT package, or start a separate production-candidate package.

**Acceptance Scenarios**:

1. **Given** R-009 execution is completed after approval, **When** evidence is reviewed, **Then** it lists approved target category, persona categories, route categories, read-only outcomes, blocked actions, no-op proof, residual risks, and next decision options.
2. **Given** evidence is prepared, **When** it is scanned for prohibited categories, **Then** committed evidence contains no credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, or secret values.
3. **Given** hosted read-only UAT passes, **When** the owner reviews the result, **Then** Production acceptance still remains a separate explicit owner decision.

### Edge Cases

- Owner accepts R-008 local readiness only but does not approve R-009 hosted execution.
- A proposed hosted target requires a deploy, promotion, alias change, or configuration change.
- A route requires creating an account or invitation before it can be inspected.
- Approved credentials are unavailable or do not match the approved persona categories.
- A page attempts to perform a write on load or includes an auto-save behavior.
- A read-only check exposes a mutation control that cannot be safely avoided.
- A file surface requires download or opening file content to verify visibility.
- A negative isolation check would require accessing a direct URL containing customer identifiers.
- Evidence scan finds redaction vocabulary but no actual sensitive values.
- Hosted read-only UAT passes but local pgTAP remains blocked by local Docker availability.
- The owner requests mutation UAT or Production acceptance after R-009, which requires a separate package or approval.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The package MUST record that the owner accepts R-008 as local readiness only.
- **FR-002**: The package MUST state that R-008 is not Production acceptance and does not authorize hosted DB mutation, deploy/promote, or non-Hadna data use.
- **FR-003**: The package MUST keep hosted read-only UAT execution blocked until explicit owner approval is recorded in R-009.
- **FR-004**: The owner approval record MUST require target environment or approved target label, data boundary, persona categories, route categories, read-only checks, duration, credential handling, evidence rules, no-op proof, stop conditions, and rollback/no-op owner.
- **FR-005**: The package MUST define exact hosted read-only target requirements and reject any target that requires deploy, promotion, alias change, account creation, data mutation, file mutation, or non-Hadna data without separate approval.
- **FR-006**: The package MUST define allowed read-only checks limited to route load, navigation visibility, role shell visibility, client portal visibility, safe summary inspection, tenant/client isolation negative checks, approval-control visibility without action, file-list visibility without content access, mobile rendering, and RTL rendering.
- **FR-007**: The package MUST forbid insert, update, delete, direct data repair, seed/import, migration, mutating RPC, approval decisions, status transitions, file upload/delete/download/opening, account creation/invite/role mutation, deploy/promote/configuration changes, and Production acceptance.
- **FR-008**: The package MUST define credential handling rules that keep credentials and account identifiers out-of-band and out of evidence.
- **FR-009**: The package MUST define evidence redaction rules that prohibit credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, secret values, and file contents.
- **FR-010**: The package MUST define rollback/no-op proof for read-only execution, including planned touched surfaces, forbidden-action avoidance, no mutation evidence, stop conditions, and communication if execution aborts.
- **FR-011**: The package MUST define route/persona smoke categories for management/project admin, assigned internal/account manager where approved, client viewer, client approver, and unassigned or unauthorized client category where approved.
- **FR-012**: The package MUST define tenant/client isolation checks that can be run read-only and can be evidenced using only categories, statuses, and counts.
- **FR-013**: The package MUST require execution to stop if an approved route attempts an unavoidable write, exposes unapproved data scope, requires unapproved credentials, requires file content access, or would record prohibited evidence.
- **FR-014**: The package MUST keep hosted DB mutation, deploy/promote, non-Hadna data use, dependency changes, product code changes, and Production acceptance out of scope unless separately approved.
- **FR-015**: The package MUST provide a post-execution evidence scaffold that remains empty or pending until owner approval is recorded and execution is performed.

### Key Entities *(include if feature involves data)*

- **R-008 Acceptance Record**: The owner decision that R-008 is accepted as local readiness only.
- **R-009 Owner Approval Record**: The explicit approval required before hosted read-only execution.
- **Hosted Read-Only Target Requirement**: Conditions the hosted target must satisfy before inspection.
- **Allowed Read-Only Check**: A safe inspection category that cannot mutate hosted state.
- **Forbidden Hosted Action**: A prohibited action that stops or blocks execution.
- **Credential Handling Rule**: A rule keeping credentials out-of-band and out of evidence.
- **Evidence Redaction Rule**: A rule defining what evidence may and may not record.
- **Route/Persona Smoke Category**: A route and role category pairing approved for read-only smoke.
- **Read-Only Isolation Probe**: A positive or negative isolation check that does not mutate state.
- **No-Op Proof**: Evidence that the run avoided mutation and stopped on unsafe conditions.
- **R-009 Evidence Package**: The owner-facing result package after approved execution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Before approval, 100% of R-009 evidence scaffolds state that hosted execution is blocked until owner approval is recorded; after approval, evidence must state any remaining execution blockers.
- **SC-002**: A reviewer can identify within 10 minutes the exact owner approval fields required before execution.
- **SC-003**: 100% of planned hosted checks map to either an allowed read-only category or a forbidden-action category.
- **SC-004**: The route/persona smoke plan covers at least four persona categories when approved: management/project admin, assigned internal or account manager, client viewer, and client approver.
- **SC-005**: The read-only isolation plan covers at least five data-path categories: deliverables, files, comments, approvals, and SLA or audit summaries.
- **SC-006**: The forbidden-action contract covers all required decision boundaries: read-only inspection only, no insert/update/delete/RPC mutation, no file upload/delete, no account creation, no deploy/promote, no Production acceptance, no non-Hadna data without separate approval, and no sensitive evidence values.
- **SC-007**: No R-009 committed evidence records credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, or secret values.
- **SC-008**: Before owner approval is recorded, the execution log contains 0 hosted checks run.
- **SC-009**: After any later approved execution, the owner evidence package provides at least four next outcomes: request fixes, authorize another read-only pass, start a separate mutation UAT package, or start a separate production-candidate package.

## Assumptions

- R-008 is accepted by the owner as local readiness only.
- R-009 package creation is authorized, but hosted execution is not yet authorized.
- Hadna remains the only allowed customer data boundary unless a later explicit owner decision says otherwise.
- Existing hosted credentials, if used later, will be supplied out-of-band and not recorded in committed evidence.
- The hosted target, if approved later, already exists and does not require deploy, promotion, alias change, or configuration changes.
- No product code, dependency, database, RLS, or storage change is planned in this R-009 planning pass.
- Production acceptance remains a separate explicit owner decision after any later production-candidate package.
