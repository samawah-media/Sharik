# A1R - Real Supabase RLS Verification Gate

## Status

Fully verified.

A1 has now been verified against a real local Supabase/PostgreSQL stack. The previous blocker was resolved by enabling WSL2/Docker Desktop. The local database migrations replay successfully from a clean reset, and actual pgTAP RLS tests pass.

This checkpoint approves A1R only. It does not approve starting A2; owner approval is still required before crossing that gate.

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
- Initial A1R resumed status: Docker blocked previously; A2 not started.

## Tooling Readiness

| Check | Result | Evidence |
| --- | ---: | --- |
| Docker CLI | Pass | `docker version` returned client `29.5.3`. |
| Docker engine | Pass | `docker version` returned Docker Desktop server `29.5.3`. |
| Docker Desktop status | Pass | `docker desktop status` returned `running`. |
| WSL2 backend | Pass | `docker info` reported Linux/WSL2 kernel `6.18.33.1-microsoft-standard-WSL2`. |
| Local Supabase stack | Pass | `npx supabase@2.107.0 start` started local development database. |
| Supabase CLI pinned via npx | Pass | Commands used `npx supabase@2.107.0`. |

## Reset Reproducibility

The local Supabase database reset was run twice after the A1R migration fix:

```powershell
npx supabase@2.107.0 db reset --local --no-seed
npx supabase@2.107.0 db reset --local --no-seed
```

Both runs passed and applied:

- `202606230001_f001a_identity_security_foundation.sql`
- `202606230002_f001a_rls_helpers_and_policies.sql`

Expected idempotent notices were observed for missing policies/triggers during clean replay.

## RLS Verification

`npm run test:rls:db` passed against the real local PostgreSQL database:

- 1 pgTAP file.
- 15 database RLS tests.
- Result: PASS.

`npm run test:rls` also passed:

- RLS simulator: 2 files, 7 tests.
- Database pgTAP: 1 file, 15 tests.
- Result: PASS.

Verified database behaviors include:

- tenant tables have RLS enabled;
- active Tenant A member sees Tenant A only;
- disabled tenant membership reads no tenant rows;
- client membership visibility is scoped;
- role assignment visibility is tenant scoped;
- same-tenant audit insert succeeds;
- cross-tenant audit insert is denied by RLS;
- audit events are append-only and reject UPDATE/DELETE with `42501`.

## Fixes Made During A1R

- Added `public.f001_prevent_audit_event_mutation()` and a statement-level `f001_audit_events_append_only` trigger on `public.audit_events`.
- Updated pgTAP `throws_ok` expectations to include actual PostgreSQL error messages.

## Full Verification Commands

| Command | Result |
| --- | ---: |
| `docker version` | Pass |
| `docker info` | Pass |
| `docker desktop status` | Pass |
| `npx supabase@2.107.0 db reset --local --no-seed` | Pass |
| `npx supabase@2.107.0 db reset --local --no-seed` | Pass |
| `npm run test:rls:db` | Pass |
| `npm run test:rls` | Pass |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test:unit` | Pass |
| `npm run test:integration` | Pass |
| `npm run test:component` | Pass |
| `npm run secret:scan` | Pass |
| `npm run build` | Pass |

## Runtime Note

The first `db reset` attempt before `supabase start` failed with `supabase start is not running`. After starting the local stack, both required reset runs passed.

The default public ECR pull path stalled while pulling the Supabase Postgres image. The successful run used `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io` and `docker.io/supabase/postgres:17.6.1.136`. This is a local image registry source change only; no hosted Supabase project was used.

## Remaining Risks

- Data API grants remain a later explicit design decision; A1R focused on direct local PostgreSQL RLS verification.
- `SECURITY DEFINER` helper functions remain intentionally scoped to membership lookups and should continue to be reviewed when future policies are added.

## Decision

A1R is FULLY VERIFIED.

Stop here and wait for owner approval before starting A2 Client Foundation.
