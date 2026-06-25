# F-001 Acceptance Evidence

Date: 2026-06-25
Branch: `feat/f001a-secure-client-foundation`
HEAD: `9112a80f5d9cff221456f701779522524fdf4c5a`
Scope: Phase 8B / T100-T102 evidence for F-001 secure tenant and client onboarding.

## Status

CONDITIONAL PASS for owner review.

This evidence records the implementation and verification state. It does not self-approve the owner gate and does not authorize merge, push, deployment, or another feature.

## Verification Summary

Phase 8A full verification evidence was recorded before the Phase 8B fix:

| Suite | Result |
|---|---|
| Unit | 12 files, 35 tests, exit 0 |
| Integration | 13 files, 44 tests, exit 0 |
| RLS simulator | 5 files, 16 tests, exit 0 |
| RLS pgTAP | 1 file, 29 tests, exit 0 |
| Component | 7 files, 19 tests, exit 0 |
| E2E | 54 total, 52 passed, 2 skipped, exit 0 |

Post-fix verification on the current HEAD lineage:

| Check | Result |
|---|---|
| `npm run test:unit -- tests/unit/navigation/route-guards.test.ts` | 1 file, 3 tests, exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| Focused E2E: `tests/e2e/security/denial-ux.spec.ts` and `tests/e2e/accessibility/rtl-mobile.spec.ts` | 24 total, 22 passed, 2 skipped, exit 0 |
| `npm run secret:scan` | no high-confidence secrets, exit 0 |
| `npm audit --audit-level=high` | no high/critical advisories, exit 0 |

## Acceptance Coverage

| Area | Evidence |
|---|---|
| Client creation and update | Integration, RLS, component, and E2E evidence in quickstart A2 notes. |
| Internal invitation | Unit, integration, RLS, component, E2E, and audit evidence in quickstart A3 notes. |
| Client invitation | Unit, integration, RLS, component, E2E, and audit evidence in quickstart A4 notes. |
| Invitation lifecycle | Unit, integration, rate-limit, audit, and E2E evidence in quickstart A5 notes. |
| Role and membership lifecycle | A6 checkpoint evidence covers role assignment, role changes, scope removal, disablement, and audit events. |
| Role-aware navigation and denial UX | Phase 7 quickstart evidence covers navigation, safe denial states, mobile, RTL, and accessibility. |
| Phase 8B security review | `docs/06-security/f001-security-review.md`. |

## Scope Confirmation

Implemented in F-001:

- secure tenant and client onboarding foundation;
- client creation/update surfaces;
- internal and client invitation rules and flows;
- invitation lifecycle hardening;
- role assignment, role change, client-scope removal, membership disablement;
- role-aware navigation and denial UX;
- audit expectations and test evidence for sensitive actions and denials.

Confirmed out of scope for F-001:

- deliverables;
- contracts and packages;
- Kanban;
- files and storage flows;
- comments;
- SLA;
- internal approvals and client approvals;
- billing;
- social scheduling;
- tenant switching;
- platform support or break-glass;
- bulk invitations;
- MFA, SSO, SCIM;
- external integration APIs;
- production deployment or production Supabase usage.

## Residual Risks

- Final owner acceptance should decide whether to rerun the full T094-T098 suite from `9112a80`. The targeted post-fix suite passed, but the full suite was last run before the Phase 8B fix commit.
- The local Spec Kit prerequisite script remains blocked by the owner-required branch name convention mismatch.
- Moderate PostCSS audit advisories remain through Next.js with no high/critical advisory and no safe forced fix in this feature scope.

