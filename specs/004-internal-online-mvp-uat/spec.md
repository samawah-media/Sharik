# Feature Specification: Internal Online MVP UAT

**Feature Branch**: `codex/internal-online-mvp-uat`

**Created**: 2026-06-29

**Status**: Draft for PR review - hosted operations are gated

**Input**: Prepare the smallest protected internal online UAT after PR #17, with strict AGENTS.md and Spec Kit compliance, non-production only, synthetic data only, no new feature scope, and no hosted Supabase migration without explicit approval.

## Overview

This feature prepares Sharik for an internal online UAT pass after PR #17 (`feat(F-003): implement SLA MVP foundation`) is merged to `main`. The goal is not Production readiness. The goal is a protected non-production preview that internal testers can use to validate the currently accepted MVP surface with synthetic data and recorded evidence.

The UAT scope is deliberately narrow: authentication and protected access, tenant/client isolation, existing client, contract, package, deliverable, and SLA MVP surfaces, and smoke/security checks. This feature must not expand into Kanban, files, comments, approvals, social scheduling, AI, background jobs, new dependencies, `RoleKey` changes, or a standalone `project_manager` role.

## Confirmed Decisions

- PR #17 was merged into `main` on 2026-06-29 with merge commit `6c406049203230c6b7e34eb0708bac0f82c981f8`.
- The UAT branch is `codex/internal-online-mvp-uat`, created from `origin/main` after PR #17.
- This feature is an internal online UAT gate, not a product feature expansion.
- The UAT environment must be non-production and protected.
- Hosted Supabase migration is blocked until a separate explicit owner approval names the non-production project ref and confirms synthetic data only; approvals that keep `<PROJECT_REF>` as a placeholder are not valid.
- No real client data, real client emails, production credentials, or production Supabase project may be used.
- No dependency changes are allowed.
- No `RoleKey` changes and no standalone `project_manager` role are allowed.
- The UAT PR must not be merged without review.

## Least Internal Online MVP

The smallest online UAT that is useful and still safe is:

1. A protected Preview deployment under the approved Sharik/Samawah Vercel scope.
2. A separate non-production Supabase project, never Production.
3. Synthetic tenant, client, user, contract, package, deliverable, and currently persistable SLA examples only.
4. Smoke checks for protected access, sign-in surface, fixture disablement in hosted runtime, build health, and no secret exposure.
5. Security checks for tenant/client isolation, unauthorized denial, role boundaries, and service role non-exposure.
6. UAT checks for existing accepted surfaces only: client management, contracts, packages, deliverables, commercial summaries, and SLA MVP summaries.
7. Evidence recorded in this Spec Kit package and `docs/PROJECT_PROGRESS.md`.

## User Scenarios & Testing

### User Story 1 - Approve A Bounded UAT Plan (Priority: P1)

As the owner or project lead, I want a bounded internal online UAT plan before any hosted operation so that Sharik is not accidentally treated as Production or expanded beyond the accepted MVP.

**Why this priority**: AGENTS.md requires a clear Spec before code or hosted execution, and the user specifically required plan, tasks, quickstart, and data risk documentation before deploy or hosted migration.

**Independent Test**: A reviewer can read this Spec Kit package and confirm the MVP scope, out-of-scope list, environment gates, data policy, and required evidence without inspecting code.

**Acceptance Scenarios**:

1. **Given** PR #17 is merged to `main`, **When** the UAT feature is prepared, **Then** the UAT branch starts after the PR #17 merge commit.
2. **Given** the UAT plan is reviewed, **When** hosted migration or deployment is requested, **Then** the plan shows required gates, data risks, rollback steps, and evidence targets first.
3. **Given** a requested task mentions Kanban, files, comments, approvals, social scheduling, AI, new dependencies, role changes, or Production, **When** the UAT scope is checked, **Then** the request is rejected or deferred outside this PR.

---

### User Story 2 - Validate A Protected Non-Production Preview (Priority: P1)

As an internal tester, I want to access a protected non-production online preview with synthetic data so that I can validate the existing MVP surfaces without risking real client data.

**Why this priority**: Online UAT is only valuable if testers can reach the app safely and the environment cannot expose Production data or unauthenticated surfaces.

**Independent Test**: A tester can open the protected Preview URL, authenticate through the approved protection layer, use only synthetic accounts/data, and record smoke/security results.

**Acceptance Scenarios**:

1. **Given** a Preview deployment exists, **When** an unauthenticated visitor opens it, **Then** the visitor is blocked by the approved protection layer before reaching internal pages.
2. **Given** an internal tester is authorized for UAT, **When** they access the Preview, **Then** they can reach only the accepted existing MVP surfaces backed by synthetic data.
3. **Given** the hosted runtime uses Preview or staging configuration, **When** route actor fixtures are tested, **Then** query-selected fixture actors are disabled in the hosted runtime.
4. **Given** the deployment is inspected, **When** HTML and logs are checked, **Then** service role keys, secret values, and real client data are not exposed.

---

### User Story 3 - Record UAT Evidence And Stop Before Merge (Priority: P2)

As the reviewer, I want UAT evidence recorded and the PR opened without merging so that the team can review results before accepting the internal online MVP UAT gate.

**Why this priority**: The requested outcome is a clear PR and evidence trail, not silent merge or Production release.

**Independent Test**: The PR contains the Spec Kit package, quickstart, evidence checklist, progress update, and explicit hosted operation status.

**Acceptance Scenarios**:

1. **Given** local and hosted checks are run, **When** results are complete, **Then** `docs/PROJECT_PROGRESS.md` records the outcome, blockers, and out-of-scope items.
2. **Given** hosted Supabase migration is not explicitly approved, **When** evidence is recorded, **Then** hosted migration and dependent UAT checks are marked blocked, not passed.
3. **Given** the PR is opened, **When** reviewers inspect it, **Then** the PR clearly states it must not be merged without review.

## Edge Cases

- PR #17 is not merged or `origin/main` is stale.
- The local worktree has unrelated dirty changes.
- Vercel CLI is authenticated to the wrong account or scope.
- The Preview project is missing Vercel Authentication or equivalent protection.
- The non-production Supabase project is missing required migrations.
- Hosted migration approval is not explicit enough.
- A seed script attempts to use real domains, real names, real client emails, or a hosted project that already contains non-synthetic users/clients.
- A route works locally through fixtures but fails in hosted Preview because fixtures are correctly disabled.
- A smoke check can only prove protected shell access until hosted migration is approved.
- A tester tries to treat local evidence as hosted UAT evidence.

## Requirements

### Functional Requirements

- **FR-001**: The team MUST verify PR #17 is merged to `main` before starting the UAT branch.
- **FR-002**: The UAT branch MUST be isolated from unrelated local work and must start from `origin/main` after PR #17.
- **FR-003**: The feature MUST define the least internal online MVP scope before hosted deployment or hosted migration.
- **FR-004**: The UAT environment MUST be non-production and protected from public access.
- **FR-005**: The UAT data set MUST be synthetic only and must avoid real client names, real client emails, production credentials, and production data.
- **FR-006**: Hosted Supabase migration MUST NOT run until explicit owner approval names the non-production target and confirms synthetic data only.
- **FR-007**: The UAT feature MUST NOT add dependencies, product features, database schema changes, background jobs, `RoleKey` changes, or a standalone `project_manager` role.
- **FR-008**: The UAT feature MUST NOT expand scope into Kanban, files, comments, approvals, social scheduling, AI, advanced analytics, billing, or Production rollout.
- **FR-009**: Smoke checks MUST cover protected access, sign-in surface, hosted fixture disablement, build health, and no obvious secret exposure.
- **FR-010**: Security checks MUST cover tenant/client isolation, unauthorized denial, role boundary expectations, service role non-exposure, and no real client data.
- **FR-011**: UAT checks MUST cover only accepted existing MVP surfaces: client management, contracts, packages, deliverables, commercial summaries, and SLA MVP summaries.
- **FR-012**: Results MUST be recorded in this Spec Kit package and `docs/PROJECT_PROGRESS.md`.
- **FR-013**: The PR MUST be opened for review and MUST NOT be merged by the agent.

### Security And Audit Requirements

- **SR-001**: No Production Supabase project or Production Vercel target may be used.
- **SR-002**: No service role or secret key may be exposed to browser code, logs, screenshots, docs, PR text, or committed files.
- **SR-003**: Synthetic data must preserve tenant/client isolation scenarios with at least Client A and Client B.
- **SR-004**: Hosted UAT evidence must not be marked passed unless it was run against the hosted non-production environment.
- **SR-005**: Cross-tenant and cross-client denial checks must avoid resource enumeration.
- **SR-006**: Any hosted mutation, migration, or seed must have rollback instructions and evidence.
- **SR-007**: The hosted UAT seed MUST refuse to run when the target contains client/auth data outside the approved synthetic R-004 fixture set.

### Key Entities

- **UAT Environment**: The protected Preview deployment plus its approved non-production data backend.
- **Synthetic Data Set**: Non-real tenant/client/user/contract/package/deliverable/currently-persistable SLA records used only for UAT.
- **Hosted Migration Gate**: Explicit owner approval required before applying migrations to a non-production Supabase project.
- **Evidence Record**: A dated result for a smoke, security, or UAT check, including status and blocker if not run.
- **Review PR**: The branch publication mechanism; it is not an approval to merge.

## Included Scope

- Spec Kit package for internal online MVP UAT.
- Least MVP UAT scope definition.
- Non-production environment plan.
- Data risk plan.
- Quickstart for local, hosted, smoke, security, and UAT checks.
- Evidence checklist.
- Project progress update.
- PR creation after local validation.

## Excluded Scope

- Production deployment.
- Production Supabase usage.
- Real client data.
- New dependencies.
- New product features.
- Database schema changes in this branch.
- Hosted Supabase migration without explicit approval.
- Kanban.
- Files.
- Comments.
- Internal approvals.
- Client approvals.
- Social scheduling.
- AI generation.
- Background jobs.
- Role catalog changes.
- Standalone `project_manager` role.
- Merging the UAT PR without review.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of hosted operation gates list the required approval, target, data policy, and rollback expectation.
- **SC-002**: The UAT evidence checklist includes smoke, security, and UAT checks with status fields for run, blocked, skipped, or failed.
- **SC-003**: The UAT scope contains no new product feature beyond accepted existing surfaces.
- **SC-004**: No real client data, real client email, Production credential, or service role value appears in committed files.
- **SC-005**: Hosted Supabase migration is either explicitly approved and evidenced, or recorded as blocked.
- **SC-006**: The PR includes a clear note that it must not be merged without review.

## Assumptions

- The approved online host is Vercel Preview with authentication protection or an equivalent approved protection layer already used by the project.
- The approved data backend is a separate non-production Supabase project.
- Existing local evidence from F-001 through F-003 is useful context, but does not substitute for hosted UAT evidence.
- UAT testers are internal Samawah/Sharik reviewers, not real clients.
- A separate explicit approval message is required before hosted Supabase migration.
