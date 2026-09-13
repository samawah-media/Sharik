# Feature Specification: R-010 Production-Candidate Gap Closure / Hosted Completion Decision

**Feature Branch**: `[012-r010-production-candidate-gap-closure-hosted-completion-decision]`

**Created**: 2026-07-09

**Status**: Path B active for production-candidate planning and evidence hardening only. Owner has closed R-009 as PARTIAL OWNER-DEFERRED after the final retry, directed that no further R-009 hosted checks be attempted, and selected R-010 Path B. R-010 now accepts R-008/R-009 evidence only as bounded production-candidate planning input while carrying the unresolved hosted categories as explicit residual risks. This package does not authorize code changes, hosted checks, hosted mutation, deploy/promotion, account creation, hosted file operations, non-Hadna data use, or Production acceptance.

**Input**: Owner direction from R-009 final closure and final retry: close R-009 as partial owner-deferred evidence, stop R-009 hosted checks, choose R-010 Path B, and proceed with production-candidate planning using R-009 as partial owner-deferred evidence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner Path B Decision Is Recorded (Priority: P1)

The owner needs the R-010 package to record that Path B is now active after R-009 partial owner-deferred closure. The package must show that production-candidate planning may proceed only with the unresolved hosted categories carried as explicit residual risks.

**Why this priority**: R-009 produced useful available-category hosted evidence, but client approver, waiting-approval, and files/final-delivery categories remain owner-deferred. R-010 must prevent accidental overclaiming while allowing the next planning pass to be scoped.

**Independent Test**: A reviewer can inspect R-010 and identify that Path B is active for planning only, no hosted check or hosted mutation starts, and the residual gaps are not counted as completed evidence.

**Acceptance Scenarios**:

1. **Given** R-009 is closed as partial owner-deferred evidence, **When** R-010 is reviewed, **Then** it records that the owner selected Path B.
2. **Given** Path B is active, **When** any hosted completion prep, hosted check, hosted mutation, or production-candidate acceptance action is proposed, **Then** R-010 classifies it as blocked unless a later package explicitly authorizes it.
3. **Given** Path B is active, **When** R-010 is reviewed, **Then** the selected path states accepted evidence, deferred evidence, residual risks, forbidden claims, required checks before Production acceptance, triggers for returning to Path A, and the next Spec Kit package.

---

### User Story 2 - Path A Remains A Fallback With Explicit Owner Mutation Approval (Priority: P2)

The owner may return to a future hosted completion prep path if the unresolved client approver, waiting-approval, and final-delivery categories cannot be accepted as residual risk or cannot be closed safely through planning. Path A is not active and is not authorized by this planning pass; it requires a separate explicit owner mutation approval before any account, role, deliverable, approval-state, file-list, category, or data exposure change.

**Why this priority**: The final retry showed that the missing categories are not just a read-only navigation issue. Closing them may require creating or fixing a client approver account/category, creating or exposing a safe waiting-approval item, and creating or exposing a safe final-delivery list/category.

**Independent Test**: A reviewer can verify whether Path A names the exact approved mutation boundaries, rollback/no-op plan, redaction rules, and stop conditions before any hosted mutation or later read-only completion check.

**Acceptance Scenarios**:

1. **Given** the owner later returns to Path A, **When** the path is prepared, **Then** no mutation starts until the owner names the exact environment, Hadna-only scope, approved mutation categories, rollback/no-op owner, evidence rules, and time window.
2. **Given** the client approver gap is addressed, **When** Path A is reviewed, **Then** it allows only an explicitly approved fix/create action for one safe client approver account/category in the approved scope and forbids broader account or role changes.
3. **Given** the waiting-approval gap is addressed, **When** Path A is reviewed, **Then** it allows only an explicitly approved create/expose action for one safe waiting-approval item and requires the normal approval/audit workflow if a state change is used.
4. **Given** the final-delivery gap is addressed, **When** Path A is reviewed, **Then** it allows only an explicitly approved create/expose action for one safe final-delivery list/category and forbids opening, downloading, uploading, deleting, or mutating file content.

---

### User Story 3 - Path B Plans Production-Candidate Gaps With Deferred Risk (Priority: P3)

The owner has accepted R-009 partial evidence for planning and has selected Path B. R-010 must prepare the production-candidate planning package that carries the missing hosted categories as explicit residual risk rather than pretending they passed.

**Why this priority**: Production-candidate planning can continue only if deferred evidence is visible and not converted into acceptance.

**Independent Test**: A reviewer can inspect the package and see that deferred R-009 categories remain risk items, not completed evidence.

**Acceptance Scenarios**:

1. **Given** the owner chose Path B, **When** production-candidate planning starts, **Then** R-009 client approver, waiting-approval, and final-delivery list/category remain documented gaps.
2. **Given** a production-candidate checklist is drafted, **When** it references R-009, **Then** it distinguishes available-category pass evidence from owner-deferred categories.
3. **Given** Production acceptance is requested, **When** R-010 is reviewed, **Then** it blocks acceptance unless the owner grants it separately after the required package.

---

### User Story 4 - Reviewer Preserves No-Op And Evidence Boundaries (Priority: P4)

The reviewer needs R-010 to preserve the same evidence redaction, no hosted mutation, no deploy/promote, no account creation, no non-Hadna data, and no hosted file-operation boundaries until a later explicit approval changes them.

**Why this priority**: The next package must not weaken R-009 closure boundaries.

**Independent Test**: A reviewer can map every R-010 task to a planning-only, read-only, or separately approved boundary.

**Acceptance Scenarios**:

1. **Given** R-010 Path B is active for planning only, **When** the package is reviewed, **Then** no hosted execution task is marked complete.
2. **Given** evidence is recorded, **When** it is reviewed, **Then** it contains no credentials, emails, screenshots, workbook content, route links, captions, deliverable titles, tokens, secret values, direct identifiers, file contents, or row-level customer content.
3. **Given** Path B is active or Path A is later reopened, **When** execution or planning begins, **Then** the active path still forbids out-of-scope hosted mutation and Production acceptance.

### Edge Cases

- Owner approves one Path A mutation category but not the others.
- Waiting-approval category requires a direct object identifier.
- Files/final-delivery category requires opening or downloading file content.
- Path A would require broad account repair, role redesign, direct SQL without audit, non-Hadna data, or unbounded data repair.
- Owner chooses Path B and later asks whether R-009 was a full pass.
- Production acceptance is requested before deferred gaps are resolved or explicitly accepted as risk.
- Non-Hadna data appears in a proposed route or evidence source.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: R-010 MUST record the owner closure decision that R-009 is PARTIAL OWNER-DEFERRED and no further R-009 hosted checks are to be attempted.
- **FR-002**: R-010 MUST state that R-009 final closure is partial owner-deferred available-category evidence, not full hosted completion.
- **FR-003**: R-010 MUST keep T038, T039, and T044 from R-009 classified as deferred and unchecked unless a later separately approved package actually executes the missing categories safely.
- **FR-004**: Path A MUST require explicit owner mutation approval before any hosted account/category/data exposure change, including environment, Hadna-only scope, operator, mutation categories, time window, rollback/no-op owner, and evidence rules.
- **FR-005**: Path A MUST define exact mutation boundaries for only these candidate categories: fixing or creating one safe client approver account/category, creating or exposing one safe waiting-approval item, and creating or exposing one safe final-delivery list/category.
- **FR-006**: Path A MUST forbid broad data repair, direct unscoped SQL, role model changes, deploy/promotion, configuration changes, non-Hadna data, file content operations, approval decisions, and Production acceptance unless a later owner decision explicitly grants a narrower action.
- **FR-007**: Path A MUST define rollback/no-op handling, audit-log expectations for any workflow/state mutation, evidence redaction rules, and stop conditions before any mutation can occur.
- **FR-008**: Path B MUST carry client approver, waiting-approval, and final-delivery list/category as explicit production-candidate gaps or accepted deferred risks.
- **FR-009**: Path B MUST document residual risks and what cannot be claimed from R-009 partial evidence.
- **FR-010**: R-010 MUST not grant or imply Production acceptance.
- **FR-011**: R-010 evidence MUST remain free of credentials, emails, screenshots, workbook content, route links, captions, deliverable titles, tokens, secret values, direct identifiers, file contents, and row-level customer content.
- **FR-012**: R-010 MUST provide the exact next owner decision after this planning package.
- **FR-013**: R-010 MUST record the owner Path B decision as active for planning only.
- **FR-014**: R-010 MUST create or update a production-candidate readiness gap register, residual-risk matrix, go/no-go checklist, and Path B rollback/no-op planning note.
- **FR-015**: R-010 MUST name the evidence accepted from R-008/R-009, the evidence remaining partial/deferred, what cannot be claimed, and the checks required before any Production acceptance package.
- **FR-016**: R-010 MUST define what would trigger returning to Path A.
- **FR-017**: R-010 MUST name the recommended next Spec Kit package after R-010.

### Key Entities *(include if feature involves data)*

- **R-009 Final Closure Record**: The source closure stating available-category pass evidence and owner-deferred categories.
- **R-010 Path Decision**: Owner selection of Path A, Path B, or stop after this planning package.
- **Path A Hosted Completion Prep**: A future owner-approved mutation-prep path for fixing or exposing the missing hosted categories safely.
- **Path B Production-Candidate Gap Plan**: Planning path that carries missing categories as explicit gaps or accepted deferred risks.
- **Production-Candidate Gap Register**: The Path B evidence register that separates accepted, partial, deferred, and forbidden claims.
- **Residual-Risk Matrix**: The Path B risk acceptance matrix that states what the owner accepts for planning and what remains required before Production acceptance.
- **Go/No-Go Checklist**: The checklist for deciding whether the next package may proceed and whether any Production acceptance package remains blocked.
- **Deferred Category**: Client approver, waiting-approval, or files/final-delivery category not executed in R-009.
- **No-Op Evidence Boundary**: The redaction and no-mutation rules inherited from R-009.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can identify within 5 minutes that R-009 is closed as PARTIAL OWNER-DEFERRED and that no more R-009 hosted checks are authorized.
- **SC-002**: 100% of R-009 deferred categories are visible in R-010 until actually executed or explicitly carried as accepted risk.
- **SC-003**: 100% of Path A candidate mutations have explicit boundaries, rollback/no-op handling, evidence redaction rules, and stop conditions before any future mutation can start.
- **SC-004**: 100% of Path B production-candidate claims distinguish available-category pass evidence from owner-deferred categories.
- **SC-005**: 0 R-010 evidence files contain credentials, emails, screenshots, workbook content, route links, captions, deliverable titles, tokens, secret values, direct identifiers, file contents, or row-level customer content.
- **SC-006**: 0 hosted mutation, deploy/promotion, account creation, hosted file upload/delete/download/opening, non-Hadna data use, dependency changes, product code changes, or Production acceptance actions occur from the proposed R-010 package itself.
- **SC-007**: A reviewer can identify the next Spec Kit package after R-010 and the owner decision required to start it.

## Assumptions

- R-009 is closed as partial owner-deferred available-category hosted read-only evidence after the final retry.
- The owner has directed that no further R-009 hosted checks be attempted.
- A 2026-07-09 R-009 completion pass attempt did not resolve the deferred categories because the required local env category source was unavailable before hosted route execution.
- A later retry confirmed the local env source exists, but client approver sign-in did not complete, waiting approval remained empty-state, and final-delivery route state did not expose file-list/final-delivery signals.
- R-010 starts as planning/gap closure only. Path B is active for production-candidate planning and evidence hardening, but it does not authorize Production acceptance.
- Hadna remains the only allowed customer data boundary unless a later explicit owner decision says otherwise.
- Production acceptance remains a separate explicit owner decision after any required package.
