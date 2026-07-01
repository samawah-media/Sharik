# Verification: R-005 Internal Online Trial Readiness

Date: 2026-07-01

## Baseline

| Check | Status | Evidence |
|---|---:|---|
| PR #26 merged | PASS | `gh pr view 26` reported `MERGED`, merged at `2026-07-01T06:33:02Z`. |
| Branch | PASS | Work started on `codex/r-005-internal-online-trial-readiness` from updated `main`. |
| Production Supabase avoided | PASS | No hosted Supabase mutation was run while preparing this PR. |
| Real client data avoided | PASS | R-005 seed uses `Samawah Demo`, fake clients, and `@r005.example.test` only. |
| Temporary passwords avoided | PASS | Seeded users have `encrypted_password` set to null; credential delivery is documented outside GitHub. |
| Local R-005 seed validation | PASS | Applied the R-005 seed to the local Supabase database after reset; it created 3 auth users, 1 tenant, 2 clients, 2 contracts, 2 packages, and 8 deliverables. |

## Local Verification

| Command | Status | Notes |
|---|---:|---|
| `npm run lint` | PASS | Completed after final changes. |
| `npm run typecheck` | PASS | Completed after final changes. |
| `npm run test:unit` | PASS | 24 files / 81 tests. Includes R-005 seed policy coverage. |
| `npm run test:integration` | PASS | 20 files / 83 tests. |
| `npm run test:rls` | PASS | Simulator: 8 files / 24 tests. pgTAP: 3 files / 133 tests after local Supabase reset applied migrations through F-004. |
| `npm run test:component` | PASS | 13 files / 42 tests. |
| `npm run test:e2e` | PASS | 67 passed / 2 skipped after stabilizing cold desktop accessibility timeout and focus assertion. |
| `npm run secret:scan` | PASS | No high-confidence secrets found; SQL files are included. |
| `npm run build` | PASS | Next.js production build completed successfully. |

## Verification Notes

- The first `npm run test:rls` attempt found the local Supabase database was stale and missing F-004 migration objects. Docker Desktop was started locally, then `npx supabase@2.107.0 db reset --local --no-seed` replayed migrations through F-004. The final `npm run test:rls` passed.
- The first full `npm run test:e2e` attempt exposed existing desktop accessibility test instability: a cold `/portfolio` route compile exceeded the default 30s test timeout, and one focus assertion pressed Tab after the input was already focused. The test was stabilized without product changes, then targeted accessibility and full E2E runs passed.
- The R-005 seed was applied locally through Docker `psql` after the successful local reset. No hosted Supabase project was mutated.

## Hosted UAT Status

| Item | Status | Notes |
|---|---:|---|
| Hosted staging target `sharik-internal-trial-staging` | PREPARED | Documented only; no hosted mutation was performed in this PR. |
| R-005 seed applied to hosted staging | NOT RUN | Requires owner-approved non-production staging target and out-of-band credentials. |
| Temporary credential delivery | NOT RUN | Must happen outside GitHub. |
| UAT checklist execution | NOT RUN | To be run after hosted staging is approved, seeded, and credentials are delivered. |
