# Feature Specification: R-006 Internal Online Trial Execution

**Feature Branch**: `codex/r006-internal-online-trial-execution`

**Created**: 2026-07-02

**Status**: Blocked at target preflight; Draft PR #33 is Open / Draft / Preflight Blocked.

**Draft PR**: [#33 R-006 Internal Online Trial Execution - Preflight Blocked](https://github.com/samawah-media/Sharik/pull/33)

**Draft PR creation HEAD**: `2e3fe7e830336e24b56ce078da4af23d8bf98734`

**Input**: User description: "Start R-006 Internal Online Trial Execution as a separate non-production-only package. Owner decision is GO for non-production internal online trial only. Confirm exact non-production Supabase and Vercel targets, run preflight, prepare synthetic internal trial accounts only, deploy or use preview/staging only if target is confirmed non-production, run smoke checks, record evidence without secrets, and stop without production promotion."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm Safe Targets (Priority: P1)

As the project owner, I need the execution package to confirm exact non-production Supabase and Vercel targets before any hosted mutation, account creation, deployment, or smoke test so the internal trial cannot accidentally use production.

**Why this priority**: The owner gave GO only for a non-production internal online trial. Target safety blocks every other step.

**Independent Test**: Review the execution evidence and confirm whether each target is explicitly non-production, has required environment boundaries, and passed preflight.

**Acceptance Scenarios**:

1. **Given** the execution branch starts from `origin/main`, **When** baseline is verified, **Then** it records merge commit `10fc4a3b4c8f717d284d177906d1f32f5f61976c`.
2. **Given** a Supabase target candidate exists, **When** preflight is run, **Then** the package records target metadata, real-data status, public-signup status, and whether mutation is allowed.
3. **Given** a Vercel target candidate exists, **When** deployment readiness is checked, **Then** the package records whether preview/staging environment variables exist and whether production deployment/aliases are absent from the trial path.
4. **Given** target confirmation or preflight is blocked, **When** the execution package is reviewed, **Then** no hosted seed, migration, account creation, deployment, credential generation, or smoke test is performed.

---

### User Story 2 - Prepare Synthetic Trial Accounts Safely (Priority: P2)

As the internal trial operator, I need a synthetic-only account roster prepared without credentials in GitHub, docs, logs, screenshots, or terminal evidence so account setup can proceed securely only after the target passes preflight.

**Why this priority**: Trial users are required for smoke checks, but credentials are high-risk and must not be created before the target is safe.

**Independent Test**: Inspect the account roster and evidence to confirm all emails use `@r006.example.test`, no passwords or hashes appear, and account creation is either safely completed or explicitly blocked.

**Acceptance Scenarios**:

1. **Given** account preparation begins, **When** the roster is documented, **Then** every email uses `@r006.example.test`.
2. **Given** credentials are needed, **When** target preflight is incomplete, **Then** no credentials are generated.
3. **Given** credentials are generated in a future resumed run, **When** instructions are delivered, **Then** delivery happens outside GitHub, docs, comments, screenshots, and logs.

---

### User Story 3 - Execute Trial Smoke Checks Only On Confirmed Preview/Staging (Priority: P3)

As the owner, I need trial smoke checks to run only on a confirmed non-production deployment URL so the result is valid without becoming production acceptance.

**Why this priority**: Smoke checks are valuable only after the target and deployment are confirmed safe.

**Independent Test**: Review evidence for a preview/staging URL and smoke results covering sign-in, product shell, clients, client detail, contracts, packages, deliverables list, Kanban board, status transition behavior, audit evidence, SLA display, tenant/client isolation, denied client viewer access, RTL, and mobile.

**Acceptance Scenarios**:

1. **Given** preview/staging deployment is unavailable or unsafe, **When** smoke checks are requested, **Then** smoke checks are blocked and no production URL is used as a substitute.
2. **Given** preview/staging deployment is confirmed, **When** smoke checks run, **Then** evidence records pass/fail status without screenshots or logs containing secrets.
3. **Given** smoke checks complete, **When** reporting ends, **Then** no production promotion or production alias is created.

### Edge Cases

- The only available Supabase target is named like UAT but cannot complete data/auth preflight.
- The linked local env file is labeled production even though the Supabase project name is UAT.
- Vercel has only Production environment variables and Production deployments.
- Supabase hosted count queries require `SUPABASE_DB_PASSWORD` that is not available in the agent environment.
- A public publishable key is available but the target is not fully confirmed as non-production.
- A temporary credential would be useful, but generating it before target confirmation would violate the release boundary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Execution MUST run on branch `codex/r006-internal-online-trial-execution`.
- **FR-002**: Execution MUST verify `origin/main` baseline commit `10fc4a3b4c8f717d284d177906d1f32f5f61976c` before any operational step.
- **FR-003**: Execution MUST read the R-006 readiness release doc and Spec Kit package before operational action.
- **FR-004**: Execution MUST use non-production Supabase only.
- **FR-005**: Execution MUST use Vercel preview/staging only and MUST NOT run `vercel --prod`, create a production alias, or treat production hosting as acceptance.
- **FR-006**: Execution MUST use synthetic data only and only `@r006.example.test` account emails.
- **FR-007**: Execution MUST keep public signup disabled before account creation or trial use can proceed.
- **FR-008**: Execution MUST NOT run a hosted migration or hosted seed without explicit preflight and owner confirmation for the exact target.
- **FR-009**: Execution MUST NOT create temporary credentials unless target preflight passes.
- **FR-010**: Execution MUST NOT record credentials, passwords, hashes, database passwords, access tokens, service-role keys, or secret values in GitHub, docs, comments, screenshots, logs, or final output.
- **FR-011**: Execution MUST prepare a smoke-check plan for sign-in, product shell, clients, client detail, contracts, packages, deliverables list, Kanban board, status transition behavior, audit evidence, SLA display, tenant/client isolation, denied client viewer access, RTL, and mobile.
- **FR-012**: Execution MUST stop and report if exact non-production targets cannot be confirmed.
- **FR-013**: Execution MUST introduce no product feature expansion, dependency addition, schema migration, or seed file.
- **FR-014**: Execution MUST record evidence without secrets.

### Key Entities *(include if feature involves data)*

- **Execution Target**: A candidate hosted service target with name/ref, environment class, and preflight status.
- **Preflight Check**: A read-only or metadata check proving target safety before mutation.
- **Synthetic Trial Account Roster**: Planned internal trial personas with fake emails and no credential values.
- **Smoke Check Result**: A planned or executed status for each required trial surface.
- **Execution Blocker**: A reason that prevents mutation, deployment, credential generation, or smoke checks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reviewers can identify the baseline commit, execution branch, and target status in under 2 minutes.
- **SC-002**: 100% of operational gates have a recorded `PASS`, `BLOCKED`, or `NOT_RUN` status.
- **SC-003**: The package contains zero secret values and zero temporary credentials.
- **SC-004**: No production deployment, production alias, hosted seed, hosted migration, or real-data use occurs.
- **SC-005**: If deployment is blocked, the report clearly states no trial URL is issued and lists exact unblock requirements.

## Assumptions

- The owner GO decision authorizes only non-production internal trial execution and does not waive target preflight.
- `sharik-uat` is a candidate Supabase target, not an automatically approved target until data/auth preflight passes.
- Existing Vercel project `sharik-platform` is a candidate project, not an approved target while it has only Production environment variables/deployments.
- Credential delivery, if later unblocked, will happen through an owner-approved channel outside GitHub/docs/logs.
- Resuming execution requires secure Supabase DB preflight access and confirmation of a Vercel Preview/Staging target; no trial URL or credentials exist while PR #33 remains preflight-blocked.
