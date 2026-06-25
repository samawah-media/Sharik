# A4 - Client Member Invitation Checkpoint

## Status

Complete and verified.

## Scope Guard

- Implemented only A4 Client Member Invitation tasks T048-T057.
- Invitation resend, revoke, supersede, and lifecycle hardening were not started.
- General membership/role lifecycle and broad role-aware navigation were not started.
- No production Supabase project was used.
- No real customer data was used.

## Implemented A4 Surface

- Client invitation role/scope validation for `client_admin`, `client_approver`, and `client_viewer`.
- Exact one-client scope enforcement for client invitations.
- `inviteClientMemberCommand` with tenant-management authorization, client role validation, idempotent pending retry, local email dispatch capture, delivery state, and audit.
- Existing-user and new-user client invitation acceptance path that activates client membership and scoped client role assignment only.
- `public.invitations` support for `membership_type = 'client'` with one-client scope constraint and tenant-management-only RLS preserved.
- Minimal client portal first-entry surface at `/client` that does not expose management or other-client data.

## A4 Audit Events

- `ClientMemberInvited`
- `RoleAssigned` with `intent_pending_acceptance`
- `ClientMembershipActivated`
- `InvitationAccepted`
- `AuthorizationDenied`
- `ClientInvitationDenied`
- `InvitationAcceptanceDenied`

## Verification Evidence

Commands run on 2026-06-24:

```powershell
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npx supabase@2.107.0 db reset --local --no-seed
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npm run test:rls:db
npm run test:unit
npm run test:integration
npm run test:rls
npm run test:component
npm run lint
npm run typecheck
npm run secret:scan
npm run build
npm run test:e2e -- tests/e2e/invitations/client-invite.spec.ts
```

Current results:

- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 29 tests.
- `npm run test:unit`: passed, 7 files and 22 tests.
- `npm run test:integration`: passed, 5 files and 15 tests.
- `npm run test:rls`: passed; simulator 5 files / 16 tests and pgTAP 1 file / 29 tests.
- `npm run test:component`: passed, 5 files and 13 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed and included `/client`.
- Targeted `npm run test:e2e -- tests/e2e/invitations/client-invite.spec.ts`: passed, 3 tests across desktop, mobile, and RTL projects.

## Verification Notes

- The first targeted A4 E2E attempt timed out before test execution while waiting for the Next.js dev server. After the production build warmed the project, the E2E run reached the app.
- The next A4 E2E run exposed a strict locator ambiguity because `بانتظار موافقتي` appeared as both a nav link and a heading. The test was tightened to assert the heading and then passed.
- Next.js emitted the existing local dev-server warning for `127.0.0.1` HMR origin during E2E; no test failed after the locator fix.

## Risks / Assumptions

- The client portal surface is a minimal A4 entry surface, not comprehensive role-aware navigation.
- The client invitation acceptance path treats new-user acceptance as a newly created Auth session supplied to the command; Supabase Auth account creation UI is outside A4.
- `client_admin` is an allowed invited client role, but client-admin self-service invitation remains denied because only tenant owner/admin actors have `PERM.USR.INVITE`.
- Expiry and email mismatch are implemented as safe command denials, but resend/revoke/supersede/expired-link UX hardening remains out of A4.
- `audit_events` read policy remains tenant-management-only.

## Stop Condition

Stop after A4 completion. Do not begin Phase 5, Invitation Lifecycle hardening, Membership/Role lifecycle, or broad Role-Aware Navigation without explicit owner approval.
