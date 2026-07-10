# Spec 015 execution log

| Date | Milestone | Result | Evidence |
|---|---|---|---|
| 2026-07-10 | M0 | completed | Local Stage 2C correction commit `c71bfae`; focused unit/typecheck/diff checks passed. |
| 2026-07-10 | M1 | completed | Canonical package created and retained as the active persistent local MVP package. |
| 2026-07-10 | M2 | completed | Persistent migration applied after clean replay fixes; `npx supabase@2.107.0 db reset --local --no-seed` PASS. |
| 2026-07-10 | M2/M3 | completed | S015 persistent workflow pgTAP expanded to cover Tenant A/B, same-tenant Client A/B, assigned/unassigned team roles, exact-version decisions, comment/file secrecy, append-only, replay/conflict, terminal states, atomic rollback, SLA pause/resume/completion, and package ledger consumption. `npm run test:rls:db` PASS 6 files / 228 tests. |
| 2026-07-10 | UX regression | passed | Kanban disclosure uses deterministic native details without suppression; targeted Playwright passed 6/6 across desktop/mobile/RTL. |
| 2026-07-10 | P1 corrective review | passed | Corrected account-manager privilege bypass, state-machine guards, cross-deliverable version FKs, comment visibility, persistent internal-change/team-management wiring, nullable team assignment enforcement, and idempotent terminal replay ordering. |
| 2026-07-10 | Fixture leakage review | passed | Production route reads use scoped persistent Supabase reads outside guarded local/test actor fixtures. Persistent read errors return closed/empty states rather than silently falling back to fixtures. |
| 2026-07-10 | Mobile RTL board verification | passed | Manual screenshot inspection of failed mobile Kanban artifact showed usable RTL layout but a brittle width assertion; board column width was stabilized and full E2E reran PASS. |
| 2026-07-10 | Final automated matrix | passed | lint PASS; typecheck PASS; unit 48 files / 171 tests PASS; integration 28 files / 112 tests PASS; component 17 files / 55 tests PASS; RLS simulator 8 files / 24 tests PASS; RLS DB 6 files / 228 tests PASS; E2E 105 PASS / 6 configured skips; secret scan PASS; diff check PASS with line-ending warnings only; build PASS. |

Hosted actions performed: zero. Production acceptance: not granted.

## Verification notes

- Docker Desktop was started locally only to unblock the local Supabase/PostgreSQL stack. No hosted database, hosted route, hosted storage, deploy, promotion, production credential, real client data, or production-like mutation was used.
- One `npm run typecheck` attempt failed while running concurrently with `npm run build` because `.next/types` was being regenerated. A standalone rerun passed and is the recorded result.
- The six E2E skips are configured duplicate mobile-only scenarios skipped under non-mobile projects; the same mobile coverage passed under `mobile-chromium`.
- `git diff --check` reported Windows line-ending warnings only and no whitespace errors.
