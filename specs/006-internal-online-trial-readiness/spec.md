# Feature Specification: R-005 Internal Online Trial Readiness

**Feature Branch**: `codex/r-005-internal-online-trial-readiness`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "After PR #26 is merged, prepare a safe hosted internal online trial for Samawah using synthetic data only, no Production Supabase, no real client data, no public signup, no open permissions, no new product features, and open a PR titled `chore(R-005): prepare internal online trial`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prepare Safe Hosted Staging (Priority: P1)

As the project owner, I need a clearly named hosted staging trial package so Samawah can test the current platform state online without touching Production Supabase or real client data.

**Why this priority**: The online trial cannot start until the environment boundary, staging name, synthetic data policy, and out-of-scope limits are explicit.

**Independent Test**: Review the R-005 Spec Kit package and release doc and confirm that the only hosted environment name is `sharik-internal-trial-staging`, the scope excludes product expansion, and no secret values or real data are present.

**Acceptance Scenarios**:

1. **Given** PR #26 is merged, **When** R-005 starts, **Then** the branch starts from updated `main` and records PR #26 as the baseline.
2. **Given** hosted staging is prepared, **When** reviewers inspect the docs, **Then** they see only `sharik-internal-trial-staging` as the staging target and no Production Supabase authorization.
3. **Given** the R-005 PR is reviewed, **When** the diff is inspected, **Then** it contains no credentials, password values, tokens, service role keys, or real client details.

---

### User Story 2 - Seed Synthetic Trial Data (Priority: P1)

As an internal tester, I need a synthetic dataset that represents the current product surfaces so I can log in and test clients, contracts, packages, deliverables, Kanban, SLA display, status transitions, and audit logs without real client data.

**Why this priority**: The trial is only useful if testers can exercise the accepted MVP surfaces using known, fake data.

**Independent Test**: Apply the R-005 seed to an approved empty non-production staging database and confirm it creates `Samawah Demo`, two synthetic clients, one contract and one package per client, 5-8 deliverables in varied statuses, and the three required synthetic user personas.

**Acceptance Scenarios**:

1. **Given** an empty approved staging target, **When** the R-005 seed runs, **Then** it creates tenant `Samawah Demo`, two synthetic clients, one synthetic contract per client, one synthetic package per client, and 5-8 synthetic deliverables.
2. **Given** seeded users exist, **When** auth/user records are inspected, **Then** all seeded email addresses end with `@r005.example.test`.
3. **Given** temporary credentials are needed for login, **When** credentials are delivered, **Then** the delivery happens outside GitHub and no password is printed or committed.

---

### User Story 3 - Run Internal Trial Checklist (Priority: P2)

As a Samawah tester, I need a concise UAT checklist so I can validate the current state online and record pass/fail evidence without testing deferred V1 features.

**Why this priority**: The trial must focus on the current platform state and avoid accidentally expanding scope into files, comments, full approvals, drag/drop, AI, scheduling, or billing.

**Independent Test**: Execute the UAT checklist against `sharik-internal-trial-staging` with the synthetic accounts and record outcomes for login, clients, contract/package/deliverables, Kanban board, allowed/denied transitions, client-viewer denial, audit log, SLA display, and basic RTL/mobile.

**Acceptance Scenarios**:

1. **Given** a tenant admin signs in, **When** they open clients and a client detail page, **Then** they can view the synthetic contract, package, deliverables, Kanban board, SLA display, and audit evidence.
2. **Given** an account manager signs in, **When** they update an allowed deliverable status, **Then** the status change succeeds and an audit event is recorded.
3. **Given** an account manager attempts a forbidden transition, **When** they submit it, **Then** the transition is denied and an audit event records the denial.
4. **Given** a client viewer signs in, **When** they try to open the internal Kanban board, **Then** access is denied or safely redirected without exposing internal board data.
5. **Given** a tester uses mobile or RTL viewport, **When** they open core trial surfaces, **Then** basic layout and direction remain usable.

---

### Edge Cases

- The hosted target already contains users or clients outside the approved R-005 synthetic fixture set.
- A reviewer attempts to run the R-005 seed against the old R-004 UAT project.
- A temporary password is accidentally pasted into terminal output, GitHub, docs, screenshots, or PR text.
- Public sign-up is enabled in Supabase Auth for the staging project.
- A client viewer directly guesses a management board URL.
- A tester tries deferred scope such as drag/drop, files, comments, full approvals, AI, social scheduling, or billing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The work MUST create a new Spec Kit package at `specs/006-internal-online-trial-readiness/`.
- **FR-002**: The hosted staging environment MUST be named exactly `sharik-internal-trial-staging`.
- **FR-003**: The R-005 package MUST document that this is staging-only internal trial readiness, not Production acceptance.
- **FR-004**: The R-005 package MUST prohibit Production Supabase, real client data, public sign-up, open permissions, and broad role access.
- **FR-005**: The synthetic seed MUST create tenant `Samawah Demo`.
- **FR-006**: The synthetic seed MUST create exactly two synthetic clients, with one synthetic contract and one synthetic package per client.
- **FR-007**: The synthetic seed MUST create 5 to 8 synthetic deliverables with varied lifecycle statuses suitable for current Kanban and SLA display checks.
- **FR-008**: The synthetic seed MUST create at least one tenant admin, one account manager, and one client viewer user, and every seeded email MUST end with `@r005.example.test`.
- **FR-009**: The seed and docs MUST NOT include temporary password values, password hashes, service role keys, database passwords, access tokens, or other secrets.
- **FR-010**: The R-005 package MUST document an out-of-GitHub process for delivering temporary login credentials to the project owner.
- **FR-011**: The UAT checklist MUST include login, clients list, client detail, contract/package/deliverables display, Kanban board, allowed status transition, forbidden transition, client viewer board denial, audit log, SLA display, and basic RTL/mobile checks.
- **FR-012**: The R-005 work MUST NOT add product features or dependencies, including AI, social scheduling, billing, drag/drop, files, comments, or full approval workflow.
- **FR-013**: The PR MUST be opened with title `chore(R-005): prepare internal online trial`.
- **FR-014**: Before PR creation, the requested local verification commands MUST be run and their results recorded.

### Key Entities *(include if feature involves data)*

- **Hosted Staging Environment**: The non-production hosted target named `sharik-internal-trial-staging`; includes deployment, Supabase staging data backend, public runtime env names, and access policy notes.
- **Synthetic Tenant**: `Samawah Demo`, the only tenant created by the R-005 seed.
- **Synthetic Client**: Fake client records under `Samawah Demo`; used for management/client-scope trial paths.
- **Synthetic Contract**: One fake contract per synthetic client.
- **Synthetic Package**: One fake package per synthetic client with package-line and ledger fixtures where needed by current summaries.
- **Synthetic Deliverable**: 5-8 fake deliverables across varied accepted statuses, with dates and progress suitable for Kanban/SLA display.
- **Synthetic Trial User**: Seeded auth/profile membership records for tenant admin, account manager, and client viewer personas using only `@r005.example.test` email addresses.
- **UAT Checklist Item**: A discrete validation step with expected result, evidence status, and scope guard.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reviewers can identify the staging target name and no-production boundary in under 2 minutes.
- **SC-002**: The R-005 seed can be inspected without finding any email outside `@r005.example.test`.
- **SC-003**: The UAT checklist covers 100% of the user-requested trial checks.
- **SC-004**: Secret scanning passes before PR creation.
- **SC-005**: All requested local verification commands are run before PR creation, with pass/fail/blocker status recorded.
- **SC-006**: The PR contains zero new product feature surfaces and zero new runtime dependencies.

## Assumptions

- PR #26 is merged into `main` before this work begins.
- The owner will provision or approve the hosted staging Supabase/Vercel target out-of-band when live deployment is needed.
- Seeded users intentionally have no committed password value; temporary password activation and delivery are operational steps outside GitHub.
- Public sign-up is disabled through staging Supabase Auth settings, not through a committed secret.
- Existing authenticated sign-in, routing, client management, contracts, packages, deliverables, Kanban, SLA display, and audit behavior from prior features are reused without product expansion.
