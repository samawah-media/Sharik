# A5 - Invitation Lifecycle Hardening Checkpoint

## Status

Complete and verified.

## Scope Guard

- Implemented only Phase 5 Invitation Lifecycle Hardening tasks T058-T071.
- General membership/role lifecycle was not started.
- Broad role-aware navigation was not started.
- No production Supabase project was used.
- No real customer data was used.

## Implemented A5 Surface

- Invitation state machine for pending, accepted, revoked, superseded, derived expired, email mismatch, already-used, and not-found decisions.
- Deterministic 7-day expiry boundary using an authoritative timestamp; acceptance is denied at `expires_at`.
- Idempotent accepted-link refresh for the same accepting user without duplicate memberships, roles, or audit side effects.
- Replay denial for already-used invitations by another user.
- `revokeInvitationCommand` with tenant/client scoped server authorization and `InvitationRevoked` audit.
- `resendInvitationCommand` with supersession before replacement creation, local email dispatch capture, and `InvitationSuperseded` / `InvitationResent` audit.
- `accept-invitation` hardening for expired, revoked, superseded, already-used, email mismatch, idempotency, and replay.
- In-memory rate limiter abstraction integrated into invite, resend, and accept command paths.
- Safe invitation lifecycle UI states at `/invite/[token]` for expired, revoked, superseded, already-used, and email mismatch.

## A5 Audit Events

- `InvitationRevoked`
- `InvitationSuperseded`
- `InvitationResent`
- `InvitationAcceptanceDenied` with reasons:
  - `INVITATION_EXPIRED`
  - `INVITATION_REVOKED`
  - `INVITATION_SUPERSEDED`
  - `INVITATION_ALREADY_USED`
  - `EMAIL_MISMATCH`

## Verification Evidence

Commands run on 2026-06-24:

```powershell
npm run test:unit -- tests/unit/invitations/invitation-expiry.test.ts tests/unit/invitations/invitation-idempotency.test.ts
npm run test:integration -- tests/integration/invitations/revoke-invitation.test.ts tests/integration/invitations/resend-invitation.test.ts tests/integration/invitations/email-mismatch.test.ts tests/integration/security/invitation-rate-limit.test.ts tests/integration/audit/invitation-denial-audit.test.ts
npm run typecheck
npm run lint
npm run test:component -- tests/component/client/client-onboarding.test.tsx
npm run build
npm run test:e2e -- tests/e2e/invitations/invitation-lifecycle.spec.ts
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npx supabase@2.107.0 db reset --local --no-seed
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npm run test:rls:db
npm run test:unit
npm run test:integration
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npm run test:rls
npm run test:component
npm run lint
npm run typecheck
npm run secret:scan
npm run build
npm run test:e2e -- tests/e2e/invitations/invitation-lifecycle.spec.ts
```

Current results:

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
- `npm run build`: passed and included `/invite/[token]`.
- Targeted lifecycle E2E: passed, 15 tests across desktop, mobile, and RTL projects.

## Verification Notes

- The first targeted lifecycle E2E attempt reached the app after build but timed out on the first cold `/invite/expired` navigation. The spec now waits for `domcontentloaded` and allows a 60-second timeout; the rerun passed all 15 tests.
- The first parallel `test:rls:db` attempt timed out while other suites were starting. Rerunning `test:rls:db` independently passed, and the later full `test:rls` gate also passed.
- The first parallel full component run emitted a worker exit after passing visible tests under concurrent load. Rerunning `npm run test:component` independently passed all 5 files and 13 tests.
- Next.js emitted the existing local dev-server warning for `127.0.0.1` HMR origin during E2E; no test failed after the timeout adjustment.

## Risks / Assumptions

- Rate limiting is an in-memory abstraction for local F-001A command verification; durable distributed throttling is deferred until production deployment planning.
- The `/invite/[token]` page is a safe lifecycle-state UI surface for A5 tests, not a full Supabase Auth invitation flow.
- Resend/revoke commands are implemented against the current in-memory repository and command contracts; production persistence/RLS remains governed by existing Supabase migration boundaries.

## Stop Condition

Stop after A5 completion. Do not begin Phase 6 Membership/Role lifecycle or Phase 7 Role-Aware Navigation without explicit owner approval.
