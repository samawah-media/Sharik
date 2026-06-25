# F-001 Security Review

Date: 2026-06-25
Branch: `feat/f001a-secure-client-foundation`
HEAD reviewed: `9112a80f5d9cff221456f701779522524fdf4c5a`
Scope: Phase 8B / T099 security review for F-001 secure tenant and client onboarding.

## Decision

CONDITIONAL PASS for owner review.

No CRITICAL or HIGH security finding remains in the reviewed Phase 8B scope.

This is not owner acceptance and does not approve merge, push, deployment, or the next feature.

## Commands

| Check | Command | Exit | Evidence |
|---|---|---:|---|
| Spec Kit prerequisites | `powershell -ExecutionPolicy Bypass -File .specify/scripts/powershell/check-prerequisites.ps1 -Json` | 1 | Known branch-name mismatch: owner-required branch is `feat/f001a-secure-client-foundation`, while local Spec Kit expects numeric `001-*` branch names. |
| Secret scan | `npm run secret:scan` | 0 | No high-confidence secrets found. |
| Dependency audit | `npm audit --audit-level=high` | 0 | No high/critical advisories. Two moderate PostCSS advisories remain through Next.js. |
| TypeScript | `npm run typecheck` | 0 | Type check passed. |
| Unit guard regression | `npm run test:unit -- tests/unit/navigation/route-guards.test.ts` | 0 | 1 file, 3 tests passed. |
| Lint | `npm run lint` | 0 | Lint passed with `--max-warnings=0`. |

## Checklist

| Area | Result | Evidence |
|---|---|---|
| Privilege escalation | PASS | `resolveRouteActor()` ignores query-selected actors in production and unknown non-production keys resolve to a disabled actor. Covered by `tests/unit/navigation/route-guards.test.ts`. |
| Direct URL authorization | PASS | Management, client detail, client write, invitation, members, portfolio, and client portal pages call server route guards instead of relying on navigation visibility. |
| Tenant/client isolation | PASS | Focused E2E denial tests on HEAD lineage passed after the fix: 24 total, 22 passed, 2 expected mobile-only skips. Earlier Phase 8A full RLS evidence passed before the Phase 8B security fix. |
| Enumeration resistance | PASS | E2E assertions verify unauthorized Client B and `tenant_b` identifiers are not rendered in denial states. |
| Service-role exposure | PASS | `SUPABASE_SERVICE_ROLE_KEY` remains server config only and is not found in client route/page code. `.env.example` contains placeholders only. |
| Secret leakage | PASS | Secret scan passed with no high-confidence secrets. |
| Mass assignment | PASS | Existing command/rule test suites cover role, invitation, client, membership, and scope validation. No new mass-assignment surface was introduced in Phase 8B. |
| Rate limits | PASS | Existing integration evidence covers invitation create/resend/accept throttling and safe `RATE_LIMITED` behavior. No new rate-limited endpoint was introduced in Phase 8B. |
| Audit failure behavior | PASS | Existing audit integration tests cover fail-closed sensitive command behavior and sensitive denial audit coverage. |
| Production connection | PASS | No production Supabase project, production database, deployment, push, merge, or production URL was used. |
| Dependency change | PASS | No dependency was added or upgraded in Phase 8B. |

## Current Findings

No CRITICAL or HIGH findings.

Watch items:

- `npm audit --audit-level=high` exits 0, but reports two moderate PostCSS advisories through Next.js. The suggested forced fix would downgrade Next.js and is not appropriate without a separate owner-approved dependency task.
- The local Spec Kit prerequisite script exits 1 because the owner-required branch name does not match the numeric Spec Kit branch convention. This is an execution-policy mismatch, not an implementation security failure.
- Full T094-T098 verification was completed before the Phase 8B route-actor hardening commit. After the commit, targeted route-guard, typecheck, lint, and focused security/accessibility E2E checks passed. A final full-suite rerun from `9112a80` remains a prudent owner decision before final acceptance.

## External Reference Checked

- Supabase changelog: https://supabase.com/changelog

The changelog was reviewed for current security/platform notes. No item changed the Phase 8B result. The known Supabase Data API/schema exposure guidance remains relevant for future SQL/RLS work: grants, RLS, and server authorization must continue to be reviewed as separate controls.

