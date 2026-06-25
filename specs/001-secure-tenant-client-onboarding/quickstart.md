# Quickstart Validation Guide: Secure Tenant and Client Onboarding

This guide describes how to validate F-001 after implementation. It is not a full implementation guide and includes no secrets, SQL, migrations, or product code.

## Preconditions

- Local app environment is configured with placeholder development values only.
- Supabase local or development project is available.
- Samawah tenant exists as test data.
- Test users and emails are synthetic.
- Email delivery uses local capture, Supabase development email view, or a safe test inbox.
- No real client names, real emails, service-role keys, or production data are used.

## Test Accounts

| Account | Purpose | Scope |
|---|---|---|
| `tenant-admin@example.test` | tenant administrator | Samawah tenant |
| `internal-a@example.test` | internal team member | Client A only |
| `client-viewer-a@example.test` | client viewer | Client A only |
| `client-b-user@example.test` | negative control | Client B only |

## Scenario Steps

### 1. Run Local Environment

- Expected Result: app loads with Arabic RTL shell and sign-in route.
- Test Account: none.
- Scope: local only.
- Audit Evidence: none required.
- Security Evidence: no secrets printed in browser or logs.
- Cleanup: stop local services after validation.

### 2. Prepare Samawah Tenant Test Data

- Expected Result: Samawah tenant is active and visible only to authorized tenant admin.
- Test Account: setup/admin fixture.
- Scope: tenant.
- Audit Evidence: fixture creation may be outside F-001; note source.
- Security Evidence: Tenant B fixture exists for negative tests.
- Cleanup: remove/reset fixtures after test run.

### 3. Create Tenant Administrator

- Expected Result: tenant admin has active tenant membership and tenant-scoped role assignment.
- Test Account: `tenant-admin@example.test`.
- Scope: Samawah tenant.
- Audit Evidence: membership/role fixture or setup audit.
- Security Evidence: no global user role used for authorization.
- Cleanup: reset membership after validation.

### 4. Sign In

- Expected Result: tenant admin enters management console.
- Test Account: `tenant-admin@example.test`.
- Scope: Samawah tenant.
- Audit Evidence: optional sign-in event; no sensitive command audit required.
- Security Evidence: active membership is checked before showing management navigation.
- Cleanup: sign out.

### 5. Create Client A

- Expected Result: Client A is created under Samawah tenant and appears in management clients list.
- Test Account: tenant admin.
- Scope: Samawah tenant + Client A.
- Audit Evidence: `ClientCreated` with actor, tenant, target client, timestamp.
- Security Evidence: creation fails for user without `PERM.CLIENT.CREATE`.
- Cleanup: archive/delete fixture only through test reset process.

#### A2 Evidence - 2026-06-24

- Integration: `tests/integration/clients/client-management.test.ts` verifies allowed create/update, unauthorized create denial, no unauthorized client creation, `ClientCreated`, `ClientUpdated`, and authorization denial audit events.
- RLS simulator: `tests/rls/client-access.test.ts` verifies tenant admins can read/insert scoped clients, assigned internal users can read only their assigned client, unassigned users are denied, and cross-tenant client reads are denied.
- Database RLS: `supabase/tests/database/a1r_rls_foundation.test.sql` now includes `public.clients` RLS, tenant-management insert, tenant-scoped select, and non-management denial assertions.
- Component: `tests/component/clients/client-form.test.tsx` verifies Arabic labels, empty state, and safe denied state.
- E2E spec added: `tests/e2e/management/create-client.spec.ts` covers the Arabic empty client list and create-client form route; this remains limited to A2 UI surfaces.
- Out of scope: invitation lifecycle, membership lifecycle, client portal access, deliverables, files, SLA, approvals, and production Supabase usage.

### 6. Invite Internal Member

- Expected Result: pending invitation created for `internal-a@example.test` with Client A scope and internal role.
- Test Account: tenant admin.
- Scope: Samawah tenant + Client A.
- Audit Evidence: `TenantMembershipInvited` and intended `RoleAssigned`.
- Security Evidence: invitation scope is explicit; no access before acceptance.
- Cleanup: revoke unused invitation if test stops.

### 7. Accept Internal Invitation

- Expected Result: internal member activates tenant membership and Client A role assignment.
- Test Account: `internal-a@example.test`.
- Scope: Samawah tenant + Client A.
- Audit Evidence: `TenantMembershipActivated`, role assignment event.
- Security Evidence: repeated acceptance creates no duplicate membership/role.
- Cleanup: disable membership after test run.

#### A3 Evidence - 2026-06-24

- Unit: `tests/unit/invitations/internal-invitation-rules.test.ts` verifies internal role allow-list, required client scope, and cross-tenant client scope denial.
- Integration: `tests/integration/invitations/invite-internal.test.ts` verifies `TenantMembershipInvited`, pending role intent audit, local email capture, unauthorized invite denial, and valid existing-user internal acceptance.
- RLS simulator: `tests/rls/internal-assigned-clients.test.ts` verifies an assigned internal user can read Client A but not Client C, and that invitation/audit read is tenant-management only.
- Database RLS: `supabase/tests/database/a1r_rls_foundation.test.sql` verifies `public.invitations` RLS, tenant-management invitation insert/read, non-management invitation denial, and tightened management-only audit read.
- Component: `tests/component/invitations/internal-invite-form.test.tsx` verifies the internal invite form, role selector, scope selector, loading, failure, empty invitation state, and assigned-client portfolio state.
- E2E spec added: `tests/e2e/invitations/internal-invite.spec.ts` covers the internal invite form route and assigned-client portfolio surface.
- Audit events: `TenantMembershipInvited`, `RoleAssigned` with `intent_pending_acceptance`, `TenantMembershipActivated`, `InvitationAccepted`, and sensitive denial events for unauthorized invite/mismatch/expiry paths covered by command logic.
- Out of scope: client member invitations, resend/revoke/supersede lifecycle hardening, client portal invitation acceptance, deliverables, files, SLA, approvals, and production Supabase usage.

### 8. Invite Client Viewer

- Expected Result: pending invitation created for `client-viewer-a@example.test` with exactly one Client A scope.
- Test Account: tenant admin.
- Scope: Client A.
- Audit Evidence: `ClientMemberInvited`, intended role assignment.
- Security Evidence: `client_admin` cannot perform this invite in F-001.
- Cleanup: revoke unused invitation if needed.

### 9. Accept Client Viewer Invitation

- Expected Result: client viewer enters client-facing surfaces only.
- Test Account: `client-viewer-a@example.test`.
- Scope: Client A.
- Audit Evidence: `ClientMembershipActivated`, `InvitationAccepted`.
- Security Evidence: no tenant-wide client list; no management console.
- Cleanup: disable membership after test run.

#### A4 Evidence - 2026-06-24

- Unit: `tests/unit/invitations/client-invitation-rules.test.ts` verifies allowed client roles, exact one-client scope, multi-client denial, non-client-role denial, and cross-tenant client scope denial.
- Integration: `tests/integration/invitations/invite-client-member.test.ts` verifies `ClientMemberInvited`, pending `RoleAssigned` intent, local email capture, client self-service/admin-action denial, existing-user acceptance, and new-user acceptance through the client invitation path.
- RLS simulator: `tests/rls/client-member-isolation.test.ts` verifies client users can read only their own client basics and cannot read tenant invitation or internal audit records.
- Database RLS: `supabase/tests/database/a1r_rls_foundation.test.sql` now covers client invitation insert/read by tenant management, client-user Client A-only read, and client-user audit/invitation denial.
- Component: `tests/component/client/client-onboarding.test.tsx` verifies client invite form controls, client portal first-entry surface, empty state, denied state, and absence of Client B/admin leakage.
- E2E spec added: `tests/e2e/invitations/client-invite.spec.ts` covers the `/client` first-entry surface across desktop, mobile, and RTL projects.
- Audit events: `ClientMemberInvited`, `RoleAssigned` with `intent_pending_acceptance`, `ClientMembershipActivated`, `InvitationAccepted`, `AuthorizationDenied`, `ClientInvitationDenied`, and `InvitationAcceptanceDenied` for safe mismatch/expiry validation.
- Out of scope: resend, revoke, supersede lifecycle hardening, general membership/role lifecycle, role-aware navigation beyond the minimal client portal entry surface, deliverables, files, SLA, approvals, and production Supabase usage.

#### A5 Evidence - 2026-06-24

- Unit: `tests/unit/invitations/invitation-expiry.test.ts` verifies deterministic expiry at `expires_at`; `tests/unit/invitations/invitation-idempotency.test.ts` verifies accepted-link idempotency and replay denial.
- Integration: `tests/integration/invitations/revoke-invitation.test.ts`, `tests/integration/invitations/resend-invitation.test.ts`, and `tests/integration/invitations/email-mismatch.test.ts` verify revoked, superseded, mismatch, and not-found behavior without membership activation.
- Rate limit: `tests/integration/security/invitation-rate-limit.test.ts` verifies invite/resend/accept throttling returns safe `RATE_LIMITED` responses without token or email state leakage.
- Audit: `tests/integration/audit/invitation-denial-audit.test.ts` verifies expired, revoked, superseded, already-used, and email-mismatch denial audit coverage.
- E2E spec added: `tests/e2e/invitations/invitation-lifecycle.spec.ts` covers `/invite/[token]` safe UI states for expired, revoked, superseded, already-used, and email mismatch across desktop, mobile, and RTL projects.
- Commands: `revokeInvitationCommand` and `resendInvitationCommand` are server-authorized and tenant/client scoped; `accept-invitation` is hardened through `src/modules/invitations/invitation-state-machine.ts`.
- Out of scope: general membership/role lifecycle, broad role-aware navigation, deliverables, files, SLA, approvals, and production Supabase usage.

### 10. Verify Navigation

- Expected Result: tenant admin sees management clients/members/audit surfaces; internal member sees assigned client/team surfaces; client viewer sees client-facing surfaces only.
- Test Account: all test accounts.
- Scope: role-specific.
- Audit Evidence: routine navigation not required; sensitive denials audit eligible.
- Security Evidence: direct URL access is tested separately and does not rely on hidden nav.
- Cleanup: none.

### 11. Attempt to Open Client B

- Expected Result: Client A user receives safe permission denied/not found UX; no Client B data appears.
- Test Account: `client-viewer-a@example.test` and `internal-a@example.test`.
- Scope: unauthorized Client B.
- Audit Evidence: `AccessDeniedCrossClient` or equivalent sensitive denial event.
- Security Evidence: response does not reveal Client B name/existence.
- Cleanup: none.

### 12. Verify Tenant/Client Denial

- Expected Result: Tenant A user cannot access Tenant B or Client B via manual URL/resource identifier.
- Test Account: all non-authorized accounts.
- Scope: unauthorized tenant/client.
- Audit Evidence: `AccessDeniedCrossTenant`/`AccessDeniedCrossClient`.
- Security Evidence: no IDOR, no enumeration, no leaked identifiers.
- Cleanup: none.

#### Phase 7 UX Evidence - 2026-06-25

- Unit: `tests/unit/navigation/navigation-resolver.test.ts` verifies tenant admin, assigned internal, client viewer, client approver, and no-assigned-client navigation states. Navigation items are marked advisory and do not grant authorization.
- Unit: `tests/unit/navigation/f001-copy.test.ts` verifies the Arabic Saudi F-001 copy catalog covers loading, empty, invitation lifecycle, denial, session, save/network failure, membership-disabled, and no-assigned-client states without mojibake.
- Component: `tests/component/navigation/denial-states.test.tsx` verifies permission denied, not found, no assigned clients, session expired, and membership disabled states do not name unauthorized tenants, clients, or IDs.
- E2E security: `tests/e2e/security/denial-ux.spec.ts` verifies direct URL tampering, same-tenant unassigned client denial, cross-tenant Client B denial, client-viewer admin-action denial, and no-client state without resource enumeration.
- E2E accessibility/mobile: `tests/e2e/accessibility/rtl-mobile.spec.ts` verifies RTL direction, labelled navigation, keyboard focus, visible form labels, mobile client portal primary navigation, and accessible denial recovery action.
- Server guard evidence: `src/server/navigation/route-guards.ts` repeats authorization for direct URLs. `src/modules/navigation/navigation-resolver.ts` only resolves visible navigation and marks items as advisory.
- UI evidence: `src/ui/shared/access-states.tsx` and `src/ui/navigation/role-aware-nav.tsx` provide shared Arabic RTL denial and navigation surfaces.
- Out of scope: Phase 8 verification package, deliverables, Kanban, SLA, files, approvals, production Supabase usage, push, merge, amend, and rebase.

### 13. Resend Invitation

- Expected Result: old pending invitation is superseded and new pending invitation is issued.
- Test Account: tenant admin.
- Scope: original invitation scope.
- Audit Evidence: `InvitationSuperseded`, `InvitationResent`.
- Security Evidence: old token/link cannot activate access.
- Cleanup: revoke latest invitation if not accepted.

### 14. Validate Old Link Invalidated

- Expected Result: old link returns safe superseded/unavailable message and creates no membership.
- Test Account: invited user.
- Scope: invitation scope.
- Audit Evidence: sensitive denial event for superseded invite attempt.
- Security Evidence: no scope granted; no resource existence leakage.
- Cleanup: none.

### 15. Disable Membership

- Expected Result: membership state becomes disabled and pending invitations for that membership target are cancelled according to policy.
- Test Account: tenant admin disables internal/client test user.
- Scope: target tenant/client membership.
- Audit Evidence: `MembershipSuspended` and invitation cancellation events if applicable.
- Security Evidence: no hard delete of audit history.
- Cleanup: reset fixture.

### 16. Verify Access Denied After Disablement

- Expected Result: disabled user cannot access protected resources or execute commands, even if session still exists.
- Test Account: disabled member.
- Scope: previous Client A scope.
- Audit Evidence: membership-disabled denial event if sensitive.
- Security Evidence: server-side membership state is checked on each protected path.
- Cleanup: sign out/reset user.

### 17. Verify Audit Events

- Expected Result: authorized tenant admin can review internal audit events for client creation, invitation lifecycle, role assignment, membership disablement, and sensitive denials.
- Test Account: tenant admin.
- Scope: Samawah tenant and Client A.
- Audit Evidence: event list itself.
- Security Evidence: client roles cannot read internal audit.
- Cleanup: export not required; reset local fixtures.

## Negative Validation Matrix

| Case | Expected Result |
|---|---|
| Expired invitation | no membership activated; `INVITATION_EXPIRED` safe UX |
| Revoked invitation | no membership activated; `INVITATION_REVOKED` safe UX |
| Superseded invitation | no membership activated; `INVITATION_SUPERSEDED` safe UX |
| Already-used invitation | no duplicate membership/role; safe no-op or denial |
| Email mismatch | no membership activated; `EMAIL_MISMATCH` safe UX |
| Client viewer attempts admin action | denied without revealing admin resource |
| Internal user assigned Client A opens Client B | denied without Client B data |
| Manual `client_id` tampering | ignored or denied; no access expansion |

## Acceptance Evidence Checklist

- Client A creation audit exists.
- Internal member invitation and acceptance audit exist.
- Client viewer invitation and acceptance audit exist.
- Resend supersedes prior invitation.
- Disabled membership denies access.
- Role-aware navigation matches scope.
- Cross-client and cross-tenant denials do not leak resource existence.
- RTL layout, labels, focus, and mobile invitation acceptance are usable.
- No `tasks.md`, product code, SQL, migrations, real secrets, or real client data are required by this guide.

## Phase 8B Evidence - 2026-06-25

- Security review: `docs/06-security/f001-security-review.md` records no CRITICAL/HIGH findings at HEAD `76bfbb6c1af2b5f1dc2d1472fcc05ce49f20a280`.
- Acceptance evidence: `docs/07-delivery/f001-acceptance-evidence.md` records scope confirmation, quickstart evidence mapping, and residual risks.
- Ready for Build package: `docs/07-delivery/f001-ready-for-build.md` records a PASS owner-review package and does not self-approve an Owner Gate.
- Commands run for Phase 8B resume: Spec Kit prerequisite check exit 1 due known owner branch-name mismatch; `npm run secret:scan` exit 0; `npm audit --audit-level=high` exit 0; `npm run typecheck` exit 0; `npm run lint` exit 0; route-guard unit test exit 0.
- Post-fix focused E2E evidence from HEAD lineage: `tests/e2e/security/denial-ux.spec.ts` and `tests/e2e/accessibility/rtl-mobile.spec.ts` ran 24 total tests with 22 passed and 2 expected mobile-only skips.
- Final full verification from HEAD `76bfbb6c1af2b5f1dc2d1472fcc05ce49f20a280`: unit 13 files/38 tests exit 0; integration 13 files/44 tests exit 0; RLS simulator 5 files/16 tests exit 0; RLS pgTAP 1 file/29 tests exit 0; component 7 files/19 tests exit 0; E2E 54 total with 52 passed and 2 expected mobile-only skips exit 0.
