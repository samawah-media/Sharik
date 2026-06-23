# A1R Review - Security And Test Quality

## Status

Blocked pending Docker-enabled local Supabase verification.

## Findings

### HIGH - RLS proof is not yet backed by a passing PostgreSQL run

`npm run test:rls:simulator` passes, and `supabase/tests/database/a1r_rls_foundation.test.sql` now exists for pgTAP coverage. `npm run test:rls:db` still fails before executing assertions because the local Supabase/PostgreSQL stack is unavailable.

The scripts are now split so:

- `test:rls:simulator` runs the fast simulator checks.
- `test:rls:db` runs actual database pgTAP checks.
- `test:rls` runs both and should remain blocked until Docker/Supabase local stack is available.

### HIGH - Cross-tenant denial has not been proven in PostgreSQL

Simulator tests cover the intended behavior, but actual PostgreSQL RLS behavior still needs pgTAP coverage for tenant A versus tenant B reads, writes, and updates.

### HIGH - Audit immutability has not been proven in PostgreSQL

The migration defines `audit_events` and policies, but actual user-level UPDATE and DELETE denial must be tested in PostgreSQL before A1 can be fully accepted.

### MEDIUM - SECURITY DEFINER helper functions require final database security review

The migration uses `SECURITY DEFINER` helper functions for membership checks. This can be valid for RLS helper patterns, but final A1R must verify function ownership, execution grants, search path, and that the functions do not expose unintended access.

## Tests Observed

| Command | Result |
| --- | --- |
| `npm run test:unit` | 5 files, 15 tests passed |
| `npm run test:integration` | 2 files, 4 tests passed |
| `npm run test:rls:simulator` | 2 files, 7 tests passed; simulator only |
| `npm run test:rls:db` | Blocked before assertions: failed to connect to local Postgres |
| `npm run test:component` | 2 files, 3 tests passed |
| `npm run secret:scan` | No high-confidence secrets found |

## Acceptance Impact

A1R should remain blocked. Do not proceed to A2 until Docker is available and actual database RLS tests pass with exit code 0.
