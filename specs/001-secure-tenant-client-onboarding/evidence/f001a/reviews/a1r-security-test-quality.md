# A1R Review - Security And Test Quality

## Status

Passed.

## Findings

No blocking security/test quality findings remain for A1R.

### RESOLVED - RLS proof is backed by a passing PostgreSQL run

`npm run test:rls` now runs both the simulator and the actual database pgTAP checks successfully:

- `test:rls:simulator`: 2 files, 7 tests passed.
- `test:rls:db`: 1 pgTAP file, 15 tests passed.

### RESOLVED - Cross-tenant denial is proven in PostgreSQL

The pgTAP suite verifies that an active Tenant A member can see Tenant A only and that a cross-tenant audit insert is denied by RLS with SQLSTATE `42501`.

### RESOLVED - Audit immutability is proven in PostgreSQL

The pgTAP suite verifies that authenticated users cannot update or delete append-only audit events. The database raises SQLSTATE `42501`.

### WATCH - SECURITY DEFINER helper functions need continued review as scope grows

The current helper functions are narrowly scoped to active tenant/client membership checks and use an explicit `search_path`. Future policies should continue reviewing ownership, grants, and whether helper functions are still the right boundary.

## Tests Observed

| Command | Result |
| --- | --- |
| `npm run test:rls:db` | Passed, 1 file and 15 tests |
| `npm run test:rls` | Passed, simulator 7 tests plus pgTAP 15 tests |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run test:unit` | Passed, 5 files and 15 tests |
| `npm run test:integration` | Passed, 2 files and 4 tests |
| `npm run test:component` | Passed, 2 files and 3 tests |
| `npm run secret:scan` | Passed, no high-confidence secrets found |
| `npm run build` | Passed |

## Acceptance Impact

A1R security/test quality is approved. Stop for owner decision before A2.
