# Data Model: R-009 Limited Hosted Read-Only UAT Authorization & Execution

This file describes planning and evidence entities for R-009. It does not introduce database migrations, persistence changes, RLS changes, storage changes, or product code.

## R-008 Acceptance Record

Represents the owner decision that starts R-009.

**Key attributes**:

- Accepted package: R-008
- Acceptance type: local readiness only
- Accepted date
- Excluded meanings: hosted mutation, deploy/promote, non-Hadna data, Production acceptance
- Next package: R-009

**Rules**:

- Acceptance does not authorize hosted checks.
- Acceptance does not authorize Production acceptance.
- Acceptance must remain visible in R-009 evidence.

## R-009 Owner Approval Record

Represents the explicit approval required before hosted read-only execution.

**Key attributes**:

- Approval status: `not_recorded`, `recorded`, `rejected`, `expired`, `superseded`
- Hosted target environment or approved target label
- Data boundary
- Approved persona categories
- Approved route categories
- Approved read-only check categories
- Credential handling method
- Execution window
- Evidence rules
- No-op proof method
- Stop conditions
- Rollback/no-op owner
- Communication owner

**Rules**:

- Hosted read-only execution is blocked while status is `not_recorded`, `rejected`, `expired`, or `superseded`.
- Approval must be complete before any hosted route is opened.
- Approval does not grant mutation, deploy/promote, non-Hadna data use, or Production acceptance.

## Hosted Read-Only Target Requirement

Represents requirements a hosted target must satisfy before inspection.

**Key attributes**:

- Target label
- Environment category
- Deployment state: existing only
- Data boundary
- Persona availability
- No deploy/promote confirmation
- No configuration change confirmation
- Credential source: out-of-band only
- Stop condition notes

**Rules**:

- The target must already exist.
- The target must not require deploy, promotion, alias change, environment variable change, or hosted configuration change.
- Target links or secrets must not be recorded in committed evidence.

## Allowed Read-Only Check

Represents an inspection action that is allowed after owner approval.

**Key attributes**:

- Check category
- Persona category
- Route category
- Expected safe result
- Evidence form
- Stop condition

**Rules**:

- Check must not submit forms, click mutation controls, download files, upload files, delete files, create accounts, change status, or trigger approvals.
- Evidence may record only categories, counts, statuses, and safe summaries.

## Forbidden Hosted Action

Represents an action that blocks or stops execution.

**Key attributes**:

- Action category
- Trigger condition
- Risk
- Required owner decision
- Evidence-safe note

**Rules**:

- Insert, update, delete, mutating RPC, import, seed, migration, and direct data repair are forbidden.
- File upload, delete, visibility mutation, content download, and opening file contents are forbidden.
- Account creation, invitation, role change, membership change, and password reset are forbidden.
- Deploy, promotion, alias change, and hosted configuration change are forbidden.
- Production acceptance is forbidden.

## Credential Handling Rule

Represents how approved hosted personas are accessed without leaking secrets.

**Key attributes**:

- Persona category
- Credential source
- Storage rule
- Evidence rule
- Expiration or revocation expectation

**Rules**:

- Credentials stay out-of-band.
- Evidence records persona categories only.
- Emails, usernames, passwords, one-time codes, token values, and secret values are prohibited in evidence.

## Evidence Redaction Rule

Represents safe evidence handling.

**Key attributes**:

- Allowed evidence categories
- Prohibited evidence categories
- Scan category
- Remediation rule

**Rules**:

- Allowed evidence includes pass/fail/blocked status, route categories, role categories, counts, safe state names, command names, and non-sensitive risk summaries.
- Prohibited evidence includes credentials, emails, screenshots, workbook content, external evidence links, captions, deliverable titles, token values, secret values, and file contents.

## Route/Persona Smoke Category

Represents an approved persona and route category pairing.

**Key attributes**:

- Persona category
- Route category
- Device category
- Directionality category
- Expected visible scope category
- Forbidden controls to avoid
- Evidence form

**Rules**:

- Persona and route categories must be listed in the owner approval record before execution.
- Direct customer identifiers must not be committed.
- Mutation controls may be observed but not activated.

## Read-Only Isolation Probe

Represents tenant/client isolation verification without mutation.

**Key attributes**:

- Persona category
- Data-path category
- Positive or negative expectation
- Safe expected outcome
- Evidence form
- Stop condition

**Rules**:

- Probes must not use unapproved direct object links.
- Client personas must see only approved client scope.
- Unauthorized or unassigned categories must show safe empty or denied state.
- Evidence must not include customer content.

## No-Op Proof

Represents evidence that the hosted run avoided mutation.

**Key attributes**:

- Approved run identifier
- Started/ended status category
- Surfaces inspected
- Forbidden actions avoided
- Stop conditions encountered
- Mutation evidence summary
- Reviewer statement

**Rules**:

- The proof must record that no write action was intentionally performed.
- If unavoidable write behavior appears, execution stops and records a blocker.
- No-op proof does not grant Production acceptance.

## R-009 Evidence Package

Represents the owner-facing evidence after approved execution, or pending evidence before approval.

**Key attributes**:

- Approval status
- Target category
- Persona categories
- Route categories
- Read-only outcome summary
- Isolation outcome summary
- No-op proof
- Redaction scan summary
- Residual risks
- Next owner decision options

**Rules**:

- Package remains pending until owner approval is recorded and execution is performed.
- Package must keep Production acceptance separate.
- Package must not include prohibited evidence values.
