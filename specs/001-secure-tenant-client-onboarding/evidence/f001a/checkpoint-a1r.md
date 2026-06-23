# A1R - Real Supabase RLS Verification Gate

## Status

Blocked.

A1 remains functionally complete, but it is not fully verified against a real local Supabase/PostgreSQL stack yet. The blocker is environmental: Docker is not available in the current shell, so the local Supabase stack cannot be started and `supabase db reset` / `supabase test db` cannot be executed.

This checkpoint intentionally does not approve A1 for A2. It records A1R readiness findings only.

## Scope Guard

- Client Foundation was not started.
- Internal Invitations were not started.
- Client Invitations were not started.
- No production Supabase project was used.
- No customer data was used.
- No merge to `main` was performed.
- `/speckit.implement` was not run.

## Worktree And Branch

- Worktree: `D:\code - projects\shrek-platform-f001a`
- Branch: `feat/f001a-secure-client-foundation`
- Latest commit reviewed: `3e9ac1a docs(F-001A): record checkpoint A1 evidence`
- Initial git status: clean

## Tooling Readiness

| Check | Result | Evidence |
| --- | --- | --- |
| Node.js | Pass | `v24.12.0` |
| npm | Pass | `11.6.2` |
| Supabase CLI pinned via npx | Pass | `npx supabase@2.107.0 --version` returned `2.107.0` |
| Docker CLI | Blocked | `docker` command not recognized in current shell |
| Local Supabase stack | Not run | Requires Docker |
| `supabase db reset` | Blocked | `npx supabase@2.107.0 db reset --local --no-seed` reached Docker inspection and failed because Docker daemon/pipe is unavailable |
| `supabase test db` | Blocked | `npm run test:rls:db` reached the Supabase CLI but failed to connect to local Postgres |

## Existing A1 Verification Commands

| Command | Exit Code | Result |
| --- | ---: | --- |
| `npm run lint` | 0 | Passed |
| `npm run typecheck` | 0 | Passed |
| `npm run test:unit` | 0 | 5 files, 15 tests passed |
| `npm run test:integration` | 0 | 2 files, 4 tests passed |
| `npm run test:rls:simulator` | 0 | 2 files, 7 tests passed; simulator/Vitest only |
| `npm run test:rls:db` | 1 | Blocked: local Postgres connection failed because Supabase local stack is unavailable |
| `npm run test:component` | 0 | 2 files, 3 tests passed |
| `npm run secret:scan` | 0 | No high-confidence secrets found |
| `npm run build` | 0 | Next.js production build passed |

## Current Supabase Project State

- `supabase/migrations/202606230001_f001a_identity_security_foundation.sql` exists.
- `supabase/migrations/202606230002_f001a_rls_helpers_and_policies.sql` exists.
- `supabase/config.toml` exists and disables seed loading for A1R reset focus.
- `supabase/tests/database/a1r_rls_foundation.test.sql` exists.
- Actual pgTAP RLS tests are prepared but have not passed against PostgreSQL yet.

## RLS Verification Gap

`npm run test:rls:simulator` runs the Vitest RLS simulator project. These tests are useful fast checks, but they do not prove that PostgreSQL RLS policies behave correctly after migrations are applied to a real Supabase database. `npm run test:rls` now runs the simulator first, then the pgTAP database test command.

Required next verification remains:

1. Make Docker available in the shell.
2. Start the local Supabase stack with the pinned CLI.
3. Run `supabase db reset` from a clean local database.
4. Repeat `supabase db reset` to prove reproducibility.
5. Confirm migrations apply without seed dependency.
6. Review and run pgTAP tests under `supabase/tests/database/`.
7. Run `supabase test db`.
8. Keep simulator and actual database RLS checks separated in reporting.

## Supabase Documentation Notes

- Supabase CLI local development uses Docker to run the local stack.
- `supabase db reset` applies local migrations from a clean local database.
- `supabase test db` executes pgTAP tests against the local database.
- Supabase has announced stricter Data API exposure defaults in 2026. Future migration review should verify whether explicit `GRANT` statements are needed for any table intentionally exposed through the Data API, separate from RLS row filtering.

## A1 Acceptance Status

Conditionally verified at the application/simulator level, blocked for real database verification.

A1 is not fully verified until actual Supabase/PostgreSQL RLS tests pass with:

- `supabase db reset`
- `npm run test:rls:db`
- cross-tenant denial cases
- disabled membership denial cases
- audit immutability cases
- no tenant-owned table without RLS

## Remaining Risks

- Real PostgreSQL RLS behavior may differ from the TypeScript simulator.
- `SECURITY DEFINER` helper functions must be reviewed against Supabase security guidance before final approval.
- Actual policy behavior for INSERT/UPDATE/DELETE has not been proven against PostgreSQL.
- Audit immutability has not been proven against PostgreSQL.
- Data API grants have not been reviewed against current Supabase defaults.

## Decision

Do not proceed to A2 yet.

Resume A1R only after Docker or a compatible container runtime is available locally. Hosted production Supabase must not be used as a substitute. Any hosted development project requires owner approval before use.
