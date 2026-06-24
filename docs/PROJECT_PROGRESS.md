# Project Progress

Last updated: 2026-06-24

## Current Execution Gate

| Item | Value |
|---|---|
| Feature | F-001A Secure Client Foundation |
| Worktree | `D:\code - projects\shrek-platform-f001a` |
| Branch | `feat/f001a-secure-client-foundation` |
| Current allowed stage | A3 - Internal Member Invitation |
| Status | A3 COMPLETE AND VERIFIED |
| Next gate | Stop before A4 Client Member Invitation |
| Owner decision required | Required before any A4 Client Member Invitation or lifecycle hardening work |

## Stage Status

| Stage | Status | Evidence |
|---|---|---|
| A0 Project Foundation | COMPLETE | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a0.md` |
| A1 Identity and Tenant Context | VERIFIED AFTER A1R | Existing evidence: `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a1.md`; real DB verification completed in A1R. |
| A1R Real Supabase RLS Verification | FULLY VERIFIED | Local Docker Desktop/WSL2 stack is running; local Supabase database reset passed twice; pgTAP RLS tests passed. |
| A2 Client Foundation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a2.md`. |
| A3 Internal Member Invitation | COMPLETE AND VERIFIED | Evidence captured in `specs/001-secure-tenant-client-onboarding/evidence/f001a/checkpoint-a3.md`. |

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

- Starting A4 Client Member Invitation.
- Invitation lifecycle hardening beyond A3 internal valid acceptance.
- Production Supabase usage.
- Real customer data.
- Merging into `main`.
