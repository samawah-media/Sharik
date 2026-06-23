# A1R Review - Database And Spec Compliance

## Status

Blocked pending real local Supabase verification.

## Findings

### HIGH - Actual migrations have not been applied to a clean local Supabase database

`supabase db reset` could not be run because Docker is unavailable in the current shell. A1 cannot be fully accepted until migrations are applied from a clean local database at least once, and preferably twice, to prove reproducibility.

### HIGH - Actual database RLS test suite is prepared but not executed successfully

`supabase/tests/database/a1r_rls_foundation.test.sql` now exists and targets tenant visibility, disabled membership denial, cross-tenant audit insert denial, and audit immutability. It has not passed yet because the local Supabase/PostgreSQL stack is unavailable.

### RESOLVED - Supabase local config is present

`supabase/config.toml` was created with the pinned Supabase CLI without `--force`, preserving existing migrations. Seed loading is disabled so A1R reset focuses on migration replay and RLS verification.

### MEDIUM - Data API grants need explicit review

The current migrations enable RLS and define policies, but they do not include explicit role grants. Because Supabase is moving toward stricter Data API exposure defaults, later review should decide whether tables are intended to be accessible through the Data API and add deliberate grants where appropriate.

## Scope Check

- No A2 tables were identified in the reviewed migrations.
- No invitation lifecycle implementation was identified in the reviewed migrations.
- Existing migrations stay within identity, membership, roles, permissions, and audit foundation scope.

## Acceptance Impact

A1 remains conditionally verified only. Database/spec compliance cannot be approved until actual local Supabase migration replay and pgTAP verification pass.
