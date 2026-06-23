# A1R Review - Database And Spec Compliance

## Status

Blocked pending real local Supabase verification.

## Findings

### HIGH - Actual migrations have not been applied to a clean local Supabase database

`supabase db reset` could not be run because Docker is unavailable in the current shell. A1 cannot be fully accepted until migrations are applied from a clean local database at least once, and preferably twice, to prove reproducibility.

### HIGH - No actual database RLS test suite exists yet

`supabase/tests/database/` is not present. The project has useful simulator tests, but it does not yet have pgTAP tests that prove RLS behavior inside PostgreSQL.

### MEDIUM - Supabase local config is not present

The `supabase/` folder currently contains migrations, but no `supabase/config.toml`. Before running the local stack, initialize or restore config carefully without overwriting existing migrations.

### MEDIUM - Data API grants need explicit review

The current migrations enable RLS and define policies, but they do not include explicit role grants. Because Supabase is moving toward stricter Data API exposure defaults, later review should decide whether tables are intended to be accessible through the Data API and add deliberate grants where appropriate.

## Scope Check

- No A2 tables were identified in the reviewed migrations.
- No invitation lifecycle implementation was identified in the reviewed migrations.
- Existing migrations stay within identity, membership, roles, permissions, and audit foundation scope.

## Acceptance Impact

A1 remains conditionally verified only. Database/spec compliance cannot be approved until actual local Supabase migration replay and pgTAP verification pass.
