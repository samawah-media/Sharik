# Feature Specification: R-006 Internal Online Trial Readiness

**Feature Branch**: `codex/r006-internal-online-trial-readiness`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "Prepare R-006 Internal Online Trial Readiness from the post-F-005 main baseline. Allowed scope is readiness docs, checklist, evidence, full baseline quality gate, non-production Supabase/Vercel boundaries, and a synthetic data plan only. Do not start the online trial, use production, use real client data, add product features, add dependencies, or add files/comments/approvals/drag-drop."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify Post-F-005 Baseline (Priority: P1)

As the project owner, I need the post-F-005 `main` baseline verified with the full local quality gate so I can decide whether the platform is ready for a separate internal trial readiness go/no-go package.

**Why this priority**: R-006 cannot safely reason about hosted readiness until the merged F-005 UI baseline is proven locally with the full agreed gate.

**Independent Test**: Run the full baseline command set from the post-F-005 worktree and inspect `specs/007-r006-internal-online-trial-readiness/evidence/verification.md` for command-by-command results.

**Acceptance Scenarios**:

1. **Given** `origin/main` is `1bc9e74af87959a053937e373d1d34ffcc6e2b65`, **When** R-006 begins, **Then** the branch starts from that commit and records F-005 as the official UI baseline.
2. **Given** the baseline quality gate is run, **When** reviewers inspect the evidence, **Then** lint, typecheck, unit, integration, RLS, component, E2E, secret scan, and build results are recorded with pass/fail/blocker status.
3. **Given** a command fails or is blocked, **When** the readiness report is reviewed, **Then** the failure is recorded as a blocker and no online trial is authorized.

---

### User Story 2 - Define Non-Production Boundaries (Priority: P1)

As the owner and future trial operator, I need clear Supabase and Vercel boundaries so no one mistakes an internal online trial for production usage or production acceptance.

**Why this priority**: The largest risk is operational: accidentally touching production, real users, or real client data.

**Independent Test**: Review the R-006 boundary contract and release doc and confirm they prohibit production, real data, public signup, service-role exposure, and trial execution without owner go/no-go approval.

**Acceptance Scenarios**:

1. **Given** a future hosted target is proposed, **When** R-006 docs are applied, **Then** it must be explicitly non-production and approved before any hosted migration or seed.
2. **Given** a Vercel deployment is proposed, **When** reviewers check the readiness boundary, **Then** only a non-production preview/staging deployment is allowed and `vercel --prod` is not authorized.
3. **Given** runtime environment variables are configured, **When** the boundary is checked, **Then** browser-visible service-role keys, database passwords, and access tokens are forbidden.

---

### User Story 3 - Prepare Synthetic Trial Plan (Priority: P2)

As the future trial coordinator, I need a synthetic-only data plan and checklist so the internal online trial can be prepared without creating or applying data during this readiness step.

**Why this priority**: R-006 should define the shape of safe synthetic data and go/no-go checks, but must not execute the trial or mutate hosted systems.

**Independent Test**: Review the synthetic data plan and UAT readiness checklist and confirm they use `@r006.example.test`, include no passwords or hashes, and cover only current accepted surfaces.

**Acceptance Scenarios**:

1. **Given** synthetic data is planned, **When** reviewers inspect the plan, **Then** all emails use `@r006.example.test` and all tenant/client names are visibly fake.
2. **Given** temporary credentials will be needed later, **When** the plan is reviewed, **Then** credential generation and delivery are explicitly outside GitHub and outside this PR.
3. **Given** a tester asks to validate files, comments, approvals, drag/drop, AI, scheduling, billing, or production behavior, **When** the checklist is applied, **Then** those checks are marked out of scope.

---

### Edge Cases

- `origin/main` moves after this branch starts.
- The R-006 worktree is created outside `D:\code - projects\sharik-worktrees\`.
- A hosted Supabase target contains any real users, real clients, or non-approved fixture data.
- Public signup is enabled on the proposed Supabase target.
- A Vercel production deployment or production alias is proposed for R-006.
- Temporary passwords, password hashes, database passwords, service-role keys, or access tokens are pasted into docs, logs, screenshots, or PR text.
- The local RLS gate is blocked because Docker Desktop or local Supabase is unavailable.
- A reviewer treats R-006 readiness as permission to start the online trial.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: R-006 MUST start from post-F-005 `origin/main` commit `1bc9e74af87959a053937e373d1d34ffcc6e2b65`.
- **FR-002**: R-006 MUST create a Spec Kit package at `specs/007-r006-internal-online-trial-readiness/`.
- **FR-003**: R-006 MUST record F-005 as the official UI baseline before defining trial readiness.
- **FR-004**: R-006 MUST run and record the full baseline quality gate: lint, typecheck, unit, integration, RLS, component, E2E, secret scan, and build.
- **FR-005**: R-006 MUST document that no online trial has started.
- **FR-006**: R-006 MUST document that Production Supabase, production deployment, production acceptance, and real client data are forbidden.
- **FR-007**: R-006 MUST define non-production Supabase requirements before any future hosted migration or seed.
- **FR-008**: R-006 MUST define non-production Vercel deployment boundaries and explicitly prohibit `vercel --prod` for this readiness step.
- **FR-009**: R-006 MUST provide a synthetic data plan only; it MUST NOT add or apply a new seed file.
- **FR-010**: The synthetic data plan MUST use `@r006.example.test` for any planned trial account emails.
- **FR-011**: R-006 docs MUST prohibit committed temporary passwords, password hashes, database passwords, service-role keys, access tokens, and secrets in screenshots/logs.
- **FR-012**: R-006 MUST define a readiness checklist for current accepted surfaces: sign-in, product shell, clients, client detail, contracts, packages, deliverables list, Kanban board, status transition behavior, audit evidence, SLA display, tenant/client isolation, denied client viewer access, RTL, and mobile.
- **FR-013**: R-006 MUST explicitly exclude product features and dependencies, including files, comments, approvals, drag/drop, AI, social scheduling, billing, and real client data.
- **FR-014**: R-006 MUST update project progress documentation to identify R-006 readiness as the current gate and the online trial as still blocked.

### Key Entities *(include if feature involves data)*

- **Baseline Gate Result**: A command-by-command record of the post-F-005 quality gate, including pass/fail/blocker status and notes.
- **Non-Production Supabase Boundary**: The required attributes of any future staging database target, including no real data, disabled public signup, and no service-role exposure.
- **Non-Production Vercel Boundary**: The required attributes of any future deployment target, including preview/staging-only behavior and no production alias or production acceptance.
- **Synthetic Data Plan**: A planned fixture shape for future R-006 trial data; not an executable seed and not applied during this task.
- **Readiness Checklist Item**: A reviewable go/no-go check for future internal online trial approval.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reviewers can identify the post-F-005 baseline commit and UI baseline status in under 2 minutes.
- **SC-002**: 100% of required baseline quality commands have recorded outcomes.
- **SC-003**: The R-006 boundary docs contain zero production authorization paths.
- **SC-004**: The synthetic data plan contains zero real client names, real user emails, passwords, password hashes, or secrets.
- **SC-005**: The readiness checklist covers 100% of the user-requested allowed scope and explicitly excludes every forbidden scope item.
- **SC-006**: The PR contains zero product code changes, zero dependency changes, and zero hosted environment mutations.

## Assumptions

- F-005 PR #29 is merged into `main` before R-006 begins.
- R-006 is a readiness package, not an online trial execution package.
- Hosted Supabase and Vercel targets will be approved separately by the owner before any future mutation or deployment.
- Existing R-005 synthetic seed artifacts may inform fixture shape, but R-006 does not create, apply, or mutate seed data.
- Temporary credential generation and delivery remain outside GitHub and outside this readiness PR.
