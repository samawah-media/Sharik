# Spec 015 execution log

| Date | Milestone | Result | Evidence |
|---|---|---|---|
| 2026-07-10 | M0 | completed | Local Stage 2C correction commit `c71bfae`; focused unit/typecheck/diff checks passed. |
| 2026-07-10 | M1 | in progress | Canonical package created; implementation remains open. |
| 2026-07-10 | M2 | verified with blocker | Migration, client-decision RPC, schema pgTAP, and persistent client read/action added. `test:rls:db` BLOCKED: Supabase CLI absent, Docker Desktop absent, local PostgreSQL unreachable. |
| 2026-07-10 | UX regression | passed | Kanban disclosure uses deterministic native details without suppression; targeted Playwright passed 6/6 across desktop/mobile/RTL. |
| 2026-07-10 | focused verification | passed | Typecheck passed; persistent client decision unit tests passed 3/3. |
| 2026-07-10 | final automated matrix | verified with blocker | lint PASS; typecheck PASS; unit 167/167; integration 112/112; component 54/54 after focused regression fix; RLS simulator 24/24; targeted Kanban E2E 6/6; build PASS; secret scan PASS; diff check PASS. RLS DB BLOCKED by unavailable local PostgreSQL. |
| 2026-07-10 | P1 corrective review | implementation complete, DB retest blocked | Corrected account-manager privilege bypass, state-machine guards, cross-deliverable version FKs, comment visibility, and persistent internal-change/team-management wiring. |
| 2026-07-10 | P1 corrective verification | verified with DB blocker | lint PASS; typecheck PASS; unit 170/170; integration 112/112; component baseline 54/54 plus persistent workflow component regression 5/5; RLS simulator 24/24; build PASS; secret scan PASS; Kanban mobile/RTL passed and desktop retry 2/2 passed. Behavioral RLS DB remains BLOCKED by local PostgreSQL connectivity. |

Hosted actions performed: zero. Production acceptance: not granted.

## Findings-first corrective continuation

- Reopened S015-P1-004 and S015-P1-005; prior `fixed` wording was invalid while the generic `f004` bypass remained and DB regression execution was blocked.
- Implemented protected-status denial in `f004`, terminal delivered/cancelled/archived behavior, safe generic UI options, independent team version-submit permission, and assigned deliverable enforcement.
- Expanded pgTAP with Tenant A/B, same-tenant Client A/B, assigned/unassigned account manager/content writer/designer cases, exact-version client decisions, secrecy, replay/conflict, append-only, terminal, and atomicity assertions.
- Targeted TypeScript/unit/component checks passed. DB-dependent findings remain `implemented, verification blocked` until local PostgreSQL executes the suite.
- Final local matrix: lint PASS; typecheck PASS; unit 48 files/171 tests PASS; integration 28/112 PASS; component 17/55 PASS; RLS simulator 8/24 PASS; E2E 105 PASS/6 configured skips; targeted Kanban desktop/mobile/RTL 6/6 PASS; secret scan PASS; diff check PASS; build PASS.
- `npm run test:rls:db` BLOCKED with `LegacyDbConnectError: failed to connect to postgres`. Operator sequence: start a local Docker-compatible PostgreSQL/Supabase stack, run `npx supabase@2.107.0 db reset --local --no-seed`, then run `npm run test:rls:db`. Hosted database substitution is prohibited.
