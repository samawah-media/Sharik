# F-002 RLS DB Gate Evidence

Date: 2026-06-28
Branch: `fix/f002-rls-db-gate-and-governance`
Worktree: `D:\code - projects\sharik-worktrees\f002-deliverables-core`
Base: `origin/main` at `40812ce610266bd2da9a9c7a5222ce14b6c08599`

## Scope

Gate repair only. No Phase 3 server commands, UI, hosted migration, production Supabase, real client data, dependencies, or feature scope were added.

## PR #6 Failure Root Cause

GitHub Actions PR #6 failed in `npm run test:rls` at `npm run test:rls:db`.

Root cause:

- `supabase/tests/database/f002_deliverables_core.test.sql` declared `plan(31)`.
- The file only emitted 29 pgTAP assertions.
- pgTAP reported: planned 31 tests but ran 29.

Fix:

- Kept `plan(31)`.
- Added two missing pgTAP governance assertions:
  - `authenticated` has no direct `INSERT`, `UPDATE`, or `DELETE` grants on F-002 tables.
  - F-002 tables expose no direct write RLS policies.
- Stabilized `npm run test:rls:db` with a local Node wrapper that runs the pinned Supabase CLI `2.107.0` with `DO_NOT_TRACK=1` and `SUPABASE_TELEMETRY_DISABLED=1`, preventing successful pgTAP runs from exiting 1 during PostHog shutdown.

## Migration Review

Migration reviewed: `supabase/migrations/202606280001_f002_deliverables_core.sql`

F-002 tables reviewed:

- `contracts`
- `contract_amendments`
- `packages`
- `package_lines`
- `deliverables`
- `package_ledger_entries`
- `deliverable_allocations`

Findings:

- PASS: RLS is enabled on every F-002 table.
- PASS: `authenticated` receives SELECT grants only for reviewed read surfaces.
- PASS: direct `INSERT`, `UPDATE`, and `DELETE` grants are revoked from `anon` and `authenticated`.
- PASS: no direct write RLS policies exist for F-002 tables.
- PASS: package ledger append-only behavior is enforced by `f002_package_ledger_append_only`.
- PASS: pgTAP verifies ledger `UPDATE` and `DELETE` throw `42501` even after temporary test-only write grants.
- PASS: client users cannot read raw contract rows or raw package ledger rows/internal reasons.
- PASS: no grant was found that opens a direct authenticated write bypass for F-002 tables.

## Role Mismatch Finding

Finding:

- `specs/002-deliverables-core/spec.md` lists `project_manager` in F-002 permission coverage.
- `src/modules/memberships/membership.ts` does not include `project_manager` in `RoleKey`.

Action taken:

- No role was added in this gate repair.

Owner/ADR decision needed:

- Option A: temporarily map `project_manager` responsibilities to `tenant_administrator` for F-002.
- Option B: add `project_manager` later through a separate ADR and role-catalog change.

## Local/CI Safety

- Docker local only: YES.
- Production Supabase used: NO.
- Hosted migration run: NO.
- Real client data used: NO.
- New dependencies added: NO.
- Server commands or UI implemented: NO.

## Commands And Results

| Command | Result | Notes |
|---|---:|---|
| `npm ci` | PASS | 479 packages installed; 2 moderate advisories remain from existing dependency tree. |
| `npm run lint` | PASS | Re-run after wrapper addition. |
| `npm run typecheck` | PASS | No TypeScript errors. |
| `npm run test:unit` | PASS | 22 files / 65 tests. |
| `npm run test:integration` | PASS | 13 files / 44 tests. |
| `npx supabase@2.107.0 db start` | PASS | Initial local attempts failed because Docker was stopped, then because an old local `shrek-platform-f001a` container held port `54322`; the old local container was stopped and Sharik local DB started successfully. |
| `npx supabase@2.107.0 db reset --local` | PASS | Migrations replayed locally and seed completed. |
| `npm run test:rls:db` before fix | FAIL | Planned 31 tests but ran 29. |
| `npm run test:rls:db` after fix | PASS | 2 pgTAP files / 68 tests. |
| `npm run test:rls` final | PASS | RLS simulator: 6 files / 19 tests; pgTAP DB: 2 files / 68 tests. |
| `npm run test:component` | PASS | 7 files / 20 tests. |
| `npm run secret:scan` | PASS | No high-confidence secrets found. |
| `npm run build` | PASS | Next.js production build completed. |

## Final Gate Result

`npm run test:rls:db` succeeds locally against Supabase Docker local/CI-compatible tooling with no production or hosted Supabase usage.
