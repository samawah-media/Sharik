# Project Progress

Last updated: 2026-06-28

## Current Execution Gate

| Item | Value |
|---|---|
| Product name | `Sharik` |
| Package slug | `sharik-platform` |
| Feature | F-002 Deliverables Core |
| Worktree | `D:\code - projects\sharik-worktrees\f002-deliverables-core` |
| Branch | `fix/f002-rls-db-gate-and-governance` |
| Current allowed stage | F-002A/F-002 database foundation only |
| Status | RLS DB gate repair ready for review |
| Next gate | PR review to remove the F-002 blocker |
| Owner decision required | Required before hosted staging migration, production usage, real data, merge, or scope expansion |

## F-002 RLS DB Gate Repair - 2026-06-28

Scope:

- Gate repair only for F-002 database/RLS verification.
- No Phase 3 server commands or UI.
- No production Supabase, hosted migration, real client data, dependencies, or feature scope expansion.

Official active worktree:

- `D:\code - projects\sharik-worktrees\f002-deliverables-core`

Legacy path governance:

- `shrek` and `sherk` paths are historical evidence only and must not be used for active Sharik work.
- A local historical Docker project named `shrek-platform-f001a` was stopped only to free port `54322` for Sharik Supabase local verification.

Fixes:

- Restored `supabase/tests/database/f002_deliverables_core.test.sql` to its declared `plan(31)` by adding the two missing pgTAP governance assertions for direct authenticated write grants and direct write RLS policies.
- Added `scripts/supabase-rls-db-test.mjs` so `npm run test:rls:db` uses Supabase CLI `2.107.0` with telemetry disabled, avoiding PostHog shutdown timeouts after successful pgTAP runs.

Verification:

- `npm run test:rls:db`: passed, 2 pgTAP files / 68 tests.
- `npm run test:rls`: passed; simulator 6 files / 19 tests and pgTAP 2 files / 68 tests.
- Full gate evidence captured in `specs/002-deliverables-core/evidence/f002-rls-db-gate.md`.

Owner/ADR finding:

- F-002 spec references `project_manager`, but `RoleKey` currently does not include it.
- No role was added in this repair.
- Owner should decide whether to map `project_manager` to `tenant_administrator` temporarily or add `project_manager` later through a separate ADR.

## F-002 Deliverables Core - 2026-06-28

Scope started:

- Spec Kit package created under `specs/002-deliverables-core/`.
- Official English spelling confirmed as `Sharik`; package slug updated to `sharik-platform`.
- Worktree/branching standard added at `docs/07-spec-driven-delivery/worktree-and-branching-standard.md`.
- Phase 1 domain foundation completed for package ledger projection, deliverable status/progress rules, F-002 permission catalog, and synthetic fixtures.
- Phase 2 database/RLS foundation started with `202606280001_f002_deliverables_core.sql`, pgTAP coverage, and RLS simulator coverage.

Verification completed:

- `npm run test:unit`: passed, 22 files and 65 tests.
- `npm run test:integration`: passed, 13 files and 44 tests.
- `npm run test:component`: passed, 7 files and 20 tests.
- `npm run test:rls:simulator`: passed, 6 files and 19 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed.
- `npm audit --audit-level=high`: passed high/critical threshold; two moderate PostCSS advisories remain through Next.js.

Historical blocked local verification, superseded by the F-002 RLS DB Gate Repair above:

- `npm run test:rls:db`: was blocked because local Supabase could not connect in the original F-002 foundation run.
- `npx supabase@2.107.0 start`: was blocked because Docker Desktop was unavailable in the original F-002 foundation run.

Out of scope confirmed:

- No hosted staging migration.
- No production Supabase.
- No real client data.
- No Kanban, files, comments, approvals, delivery, billing, social scheduling, or full SLA engine.

## F-001B Completion Note - 2026-06-28

F-001B was later completed through Cycle 2C/2D, pushed, reviewed, and merged via PR #5. Any older Cycle 2B blocked notes below are historical pre-hardening evidence and are superseded by the merged F-001B result.

## F-001B Cycle 2B - 2026-06-27

Cycle status:

- F-001B Cycle 2A = Locally Verified and committed at `a22a5f596fc9d298246d223bea9a1187808a47a0`.
- F-001B Cycle 2B = BLOCKED before hosted staging migration.
- F-001B is not ready for merge.

Blocker:

- HIGH finding H-001: migration `202606270001_f001b_client_write_workflows.sql` grants direct `insert, update` on `public.clients` to `authenticated`, while existing RLS policies allow tenant management roles to write clients. This can bypass the intended RPC audit transaction and `expected_revision` guard.

Evidence:

- `specs/001-secure-tenant-client-onboarding/evidence/f001b/cycle-2b-hosted-staging-uat.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/reviews/cycle-2b-migration-security-review.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/reviews/cycle-2b-spec-compliance.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/reviews/cycle-2b-code-quality-security.md`
- `specs/001-secure-tenant-client-onboarding/evidence/f001b/stack-compliance-cycle-2b.md`

Verification completed before block:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:unit`: passed, 18 files / 51 tests.
- `npm run test:integration`: passed, 13 files / 44 tests.
- `npm run test:component`: passed, 7 files / 20 tests.
- `npm run test:rls:db` with Supabase telemetry disabled: passed, 1 pgTAP file / 34 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- `npm audit --audit-level=high`: passed high/critical threshold; two moderate PostCSS advisories remain through Next.js.

Out of scope confirmed:

- No invitations were started.
- No role/member mutations were executed outside verification.
- No deliverables, contracts/packages, files, SLA, approvals, Kanban, billing, or social scheduling were started.
- No production Supabase project, production credentials, real client data, merge to `main`, push, or hosted staging mutation was used.

## Owner Gate - 2026-06-24 Stabilization Only

Owner decision for this round:

- Stabilization and Full E2E reconciliation only.
- T037-T083 are classified as `EXECUTED — PENDING OWNER REVIEW`.
- T037-T083 are not finally accepted in this worktree.
- T084-T103 and Phase 7 were not started.
- No merge to `main` was performed.

Evidence:

- `evidence/f001a/phase-6-stabilization-report-2026-06-24.md`
- `evidence/f001a/owner-gate-2026-06-24.md`

Latest stabilization verification:

- `npm run lint`: passed, exit 0.
- `npm run typecheck`: passed, exit 0.
- `npm run test:unit`: passed, 10 files and 30 tests, exit 0.
- `npm run test:integration`: passed, 13 files and 32 tests, exit 0.
- `npm run test:component`: passed, 6 files and 16 tests, exit 0.
- `npm run test:rls`: passed, simulator 5 files / 16 tests and pgTAP 1 file / 29 tests, exit 0.
- `npm run test:e2e`: passed, 30 tests, exit 0.
- `npm run secret:scan`: passed, no high-confidence secrets found, exit 0.
- `npm run build`: passed, 10 app routes generated, exit 0.
- `npm audit --audit-level=high`: passed, zero high/critical findings; two moderate PostCSS findings remain deferred, exit 0.

## Stage Status

| Stage | Status | Evidence |
|---|---|---|
| A0 Project Foundation | COMPLETE | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a0.md` |
| A1 Identity and Tenant Context | VERIFIED AFTER A1R | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a1.md`; real DB verification completed in A1R. |
| A1R Real Supabase RLS Verification | FULLY VERIFIED | Local Docker Desktop/WSL2 stack is running; local Supabase database reset passed twice; pgTAP RLS tests passed. |
| A2 Client Foundation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a2.md`. |
| A3 Internal Member Invitation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a3.md`. |
| A4 Client Member Invitation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a4.md`. |
| A5 Invitation Lifecycle Hardening | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a5.md`. |
| A6 Membership and Role Lifecycle | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a6.md`. |

## Latest A6 Checkpoint

A6 Membership and Role Lifecycle completed and verified on 2026-06-24 after owner approval.

Implemented scope:

- Role assignment authority rules for role/scope compatibility, active membership, actor authority, and cross-tenant denial.
- `assignRoleCommand` with validation, tenant/client scoped authority checks, and `RoleAssigned` / denial audit.
- `changeRoleAssignmentCommand` with old/new scope authority checks and `RoleUpdated` or `RoleRevoked` audit.
- `removeClientScopeCommand` with client-scope role revocation and `ClientScopeRemoved` audit.
- `disableMembershipCommand` with active responsibility guard, role revocation, pending invitation cancellation, and `MembershipSuspended` / `InvitationRevoked` audit.
- Management members surface at `/members` with role selector, resend/revoke controls, disabled membership state, and responsibility-transfer blocked state.
- Offboarding prerequisite documentation for later delivery-domain responsibility transfer.

Out of scope and not started:

- Phase 7 Role-Aware Navigation.
- Phase 8 Verification and Acceptance.
- Deliverable responsibility transfer implementation.
- Deliverables, contracts, files, SLA, approvals, Kanban, deploy, production Supabase usage, and real client data.

Verification results:

- Targeted unit tests: passed, 1 file and 4 tests.
- Targeted integration tests: passed, 3 files and 6 tests.
- Targeted component tests: passed, 1 file and 3 tests.
- Targeted member lifecycle E2E: passed, 3 tests across desktop, mobile, and RTL projects.
- `npm run test:unit`: passed, 10 files and 30 tests.
- `npm run test:integration`: passed, 13 files and 32 tests.
- `npm run test:component`: passed, 6 files and 16 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed and included `/members`.

## Latest A5 Checkpoint

A5 Invitation Lifecycle Hardening completed and verified on 2026-06-24 after owner approval.

Implemented scope:

- Invitation state machine for pending, accepted, revoked, superseded, derived expired, email mismatch, already-used, and not-found decisions.
- Deterministic 7-day expiry boundary; acceptance is denied at `expires_at`.
- Idempotent accepted-link refresh for the same accepting user without duplicate memberships, roles, or audit side effects.
- Replay denial for already-used invitations by another user.
- Revoke invitation command with tenant/client scoped authorization and audit.
- Resend invitation command with supersession before replacement creation, local email dispatch capture, and audit.
- Accept-invitation hardening for expired, revoked, superseded, already-used, email mismatch, idempotency, and replay.
- In-memory rate limiter abstraction integrated into invite, resend, and accept command paths.
- Safe invitation lifecycle UI states at `/invite/[token]`.

Out of scope and not started:

- General membership/role lifecycle.
- Broad role-aware navigation.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

Verification results:

- Targeted unit tests: passed, 2 files and 4 tests.
- Targeted integration tests: passed, 5 files and 11 tests.
- Targeted component smoke: passed, 1 file and 3 tests.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 29 tests.
- `npm run test:unit`: passed, 9 files and 26 tests.
- `npm run test:integration`: passed, 10 files and 26 tests.
- `npm run test:rls`: passed; simulator 5 files / 16 tests and pgTAP 1 file / 29 tests.
- `npm run test:component`: passed, 5 files and 13 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- Targeted lifecycle E2E: passed, 15 tests across desktop, mobile, and RTL projects.

## Latest A4 Checkpoint

A4 Client Member Invitation completed and verified on 2026-06-24 after owner approval.

Implemented scope:

- Client invitation role/scope validation for `client_admin`, `client_approver`, and `client_viewer`.
- Exact one-client scope enforcement for client invitations.
- `invite-client-member` command with tenant-management authorization, client role validation, idempotent pending retry, local email dispatch capture, delivery state, and audit.
- Existing-user and new-user client invitation acceptance path that activates client membership and scoped client role assignment.
- `public.invitations` support for client invitations while preserving tenant-management-only invitation/audit RLS.
- Minimal client portal first-entry surface at `/client`.

Out of scope and not started:

- Resend, revoke, supersede, and invitation lifecycle hardening.
- General membership/role lifecycle.
- Broad role-aware navigation.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

Verification results:

- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 29 tests.
- `npm run test:rls`: passed; simulator 5 files / 16 tests and pgTAP 1 file / 29 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 7 files and 22 tests.
- `npm run test:integration`: passed, 5 files and 15 tests.
- `npm run test:component`: passed, 5 files and 13 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- Targeted `npm run test:e2e -- tests/e2e/invitations/client-invite.spec.ts`: passed, 3 tests across desktop, mobile, and RTL projects.

## Latest A3 Checkpoint

A3 Internal Member Invitation completed and verified on 2026-06-24 after owner approval of commit `0966128`.

Implemented scope:

- Internal invitation role/scope validation for approved internal roles only.
- `invite-internal-member` command with tenant-management authorization, tenant/client scoped validation, local email dispatch capture, idempotent pending retry, and audit events.
- Existing-user internal invitation acceptance path that activates tenant membership and scoped client role assignments.
- `public.invitations` table for internal invitations only, with RLS enabled and tenant-management insert/read/update policies.
- Assigned internal client portfolio surface.
- Tenant-management-only read policy for internal audit events, replacing the broader active-tenant-member audit read policy.

Out of scope and not started:

- Client member invitation.
- Resend, revoke, supersede, expiry hardening beyond valid internal acceptance and simple expiry denial.
- Client portal invitation acceptance.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

Verification results:

- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 25 tests.
- `npm run test:rls`: passed; simulator 4 files / 13 tests and pgTAP 1 file / 25 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 6 files and 19 tests.
- `npm run test:integration`: passed, 4 files and 11 tests.
- `npm run test:component`: passed, 4 files and 10 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed.
- Targeted Playwright E2E after installing Chromium: passed, 6 tests across desktop, mobile, and RTL projects.

## Latest A2 Checkpoint

A2 Client Foundation completed on 2026-06-24.

Implemented scope:

- `public.clients` table with tenant scope and RLS.
- Tenant-management client create/update/list command surface.
- Server-side authorization before sensitive client mutations.
- Audit events for client creation/update and sensitive denials.
- Arabic RTL client management empty/create/edit UI surface.
- A2-only integration, RLS simulator, pgTAP database, component, and E2E specs.

Out of scope and not started:

- Invitation lifecycle.
- Internal member invitation.
- Client member invitation.
- Membership/role lifecycle beyond existing A1 foundations.
- Deliverables, contracts, files, SLA, approvals, Kanban, and production Supabase usage.

## Latest A1R Checkpoint

Commands run on 2026-06-24:

```powershell
docker version
docker info
docker desktop status
npx supabase@2.107.0 start --exclude edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector
npx supabase@2.107.0 db reset --local --no-seed
npx supabase@2.107.0 db reset --local --no-seed
npm run test:rls:db
npm run test:rls
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run secret:scan
npm run build
```

Results:

- `docker version`: passed; client `29.5.3`, Docker Desktop server `29.5.3`.
- `docker info`: passed; Docker Desktop Linux engine running on WSL2 kernel `6.18.33.1-microsoft-standard-WSL2`.
- `docker desktop status`: passed; status `running`.
- Local WSL check: `docker-desktop` distro running on WSL version 2.
- `npx supabase@2.107.0 start`: passed after using the Docker Hub registry override for local images and excluding services not required for A1R database verification.
- First `npx supabase@2.107.0 db reset --local --no-seed`: passed after the local stack was running.
- Second `npx supabase@2.107.0 db reset --local --no-seed`: passed, proving migration replay reproducibility.
- `npm run test:rls:db`: passed, 1 pgTAP file and 15 tests.
- `npm run test:rls`: passed; simulator 2 files / 7 tests and pgTAP 1 file / 15 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 5 files and 15 tests.
- `npm run test:integration`: passed, 2 files and 4 tests.
- `npm run test:component`: passed, 2 files and 3 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed.

## A1R Fixes Applied

- Added an append-only database trigger for `public.audit_events` to raise `42501` on UPDATE or DELETE.
- Corrected pgTAP `throws_ok` expectations so cross-tenant audit insert and append-only audit mutation assertions validate the actual PostgreSQL error code and message.

## Supabase Runtime Note

The local Supabase stack initially attempted to pull images from the default registry and stalled on the Postgres image. The A1R run used `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` and pulled `docker.io/supabase/postgres:17.6.1.136`. No production Supabase project and no real customer data were used.

## Out of Scope Until Owner Approval

- Broad role-aware navigation.
- Phase 8 verification package.
- Production Supabase usage.
- Real customer data.
- Merging into `main`.
