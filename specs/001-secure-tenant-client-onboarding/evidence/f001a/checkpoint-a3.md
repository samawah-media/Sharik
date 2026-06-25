# A3 - Internal Member Invitation Checkpoint

## Status

Complete and verified.

## Scope Guard

- Implemented only A3 Internal Member Invitation tasks T037-T047.
- Client member invitations were not started.
- Invitation resend, revoke, supersede, and lifecycle hardening were not started beyond A3 valid internal acceptance and safe expiry/mismatch denial.
- No production Supabase project was used.
- No real customer data was used.

## Implemented A3 Surface

- Internal invitation role/scope validation for `account_manager`, `content_writer`, and `designer`.
- `public.invitations` table for internal invitations only with tenant scope, explicit client scope array, status, expiry, delivery state, and RLS enabled.
- Tenant-management-only RLS policies for invitation insert/read/update.
- Tenant-management-only audit read policy for internal audit events.
- `inviteInternalMemberCommand` with validation, permission check, idempotent pending retry, local email dispatch capture, and audit.
- Local invitation email dispatcher abstraction with in-memory capture and no external provider/secrets.
- `acceptInternalInvitationCommand` for existing-user internal acceptance, tenant membership activation, scoped role assignment, and audit.
- Assigned internal client portfolio surface and internal invitation UI surface.

## A3 Audit Events

- `TenantMembershipInvited`
- `RoleAssigned` with `intent_pending_acceptance`
- `TenantMembershipActivated`
- `InvitationAccepted`
- `AuthorizationDenied`
- `InternalInvitationDenied`
- `InvitationAcceptanceDenied`

## Verification Evidence

Commands run on 2026-06-24:

```powershell
npm run test:unit
npm run test:integration
npm run test:rls:simulator
npm run test:component
npm run typecheck
npm run lint
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npx supabase@2.107.0 db reset --local --no-seed
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npm run test:rls:db
npm run test:rls
npm run secret:scan
npm run build
npx playwright install chromium
npm run test:e2e -- tests/e2e/invitations/internal-invite.spec.ts tests/e2e/management/create-client.spec.ts
```

Current results:

- `npm run test:unit`: passed, 6 files and 19 tests.
- `npm run test:integration`: passed, 4 files and 11 tests.
- `npm run test:rls:simulator`: passed, 4 files and 13 tests.
- `npm run test:component`: passed, 4 files and 10 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 25 tests.
- `npm run test:rls`: passed; simulator 4 files / 13 tests and pgTAP 1 file / 25 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed.
- Initial targeted Playwright E2E run failed before product execution because Chromium was missing from the local Playwright cache.
- `npx playwright install chromium`: passed.
- Targeted `npm run test:e2e -- tests/e2e/invitations/internal-invite.spec.ts tests/e2e/management/create-client.spec.ts`: passed, 6 tests across desktop, mobile, and RTL projects.

## Verification Note

An early `npm run test:unit -- --runInBand` attempt failed because Vitest does not support the Jest `--runInBand` flag. The supported `npm run test:unit` command was rerun and passed.

The first targeted Playwright E2E run failed because the browser executable was missing from the local cache. After installing Chromium with Playwright, the same E2E command passed. The passing run emitted a Next.js dev-server HMR origin warning for `127.0.0.1`, but no test failed and no application behavior was affected.

## Risks / Assumptions

- The A3 UI surfaces are static test surfaces matching the current A2 style; live Server Actions remain outside this sub-slice.
- Internal invitation acceptance covers the existing-user path required by A3. New-user acceptance remains part of broader invitation/client onboarding scope.
- Expiry and email mismatch are implemented as safe command denials, but resend/revoke/supersede/expired-link UX hardening remains out of A3.
- `audit_events` read policy was tightened from active-tenant-member read to tenant-management read because A3 introduces invitation/member audit events containing sensitive internal access details.

## Stop Condition

Stop after A3 completion. Do not begin A4, client member invitation, or general invitation lifecycle hardening without explicit owner approval.
