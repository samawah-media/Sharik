# F-001B Cycle 1 Evidence - Real Auth and Read-Only Hosted UAT

Date: 2026-06-25

Branch: `feat/f001b-staging-uat-enablement`

Base: `origin/main` at `6e8c4b0662ff362983866c49970f01d74f3576e5`

## Scope Completed

- Added Supabase SSR browser/server clients using the publishable key only.
- Added `proxy.ts` session refresh with `getClaims()` and cookie write-through.
- Added email/password sign-in, sign-out client controls, safe Arabic errors, and safe local redirects.
- Derived runtime tenant/client authorization actor from Supabase Auth claims plus database membership, client membership, role assignment, and client rows.
- Kept `?as=` route actors available for local/test only; disabled them for `preview`, `staging`, and `production`.
- Wired read-only management/client routes to runtime data while preserving local fixture-only tests.
- Updated UAT seed to Samawah tenant, Hudna client, and the three required roles without passwords.
- Archived legacy `demo-*` staging clients in the seed while preserving history; hosted read-only runtime returns active clients only.
- Added read-only runtime Data API grants with RLS still enforcing tenant/client scope.
- Applied the F-001B migration to Supabase staging project `kbntdgjzsfuqqdythmrn`.
- Applied the idempotent UAT seed to staging; verified Samawah is active, Hudna is active, and the three dummy UAT role accounts exist.
- Confirmed Vercel Preview env names are scoped to Preview and reset `APP_ENV` to `preview`.

## Quality Evidence

- `npm ci`: PASS, 478 packages installed, 2 moderate audit findings.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run test:unit`: PASS, 17 files / 46 tests.
- `npm run test:integration`: PASS, 13 files / 44 tests.
- `npm run test:component`: PASS, 7 files / 19 tests.
- `npm run test:rls:simulator`: PASS, 5 files / 16 tests.
- `npm run test:rls:db`: PASS, 1 file / 29 tests.
- `npm run test:rls`: PASS, simulator + database.
- `npm run test:e2e`: PASS, 52 passed / 2 existing mobile-only skips.
- `npm run secret:scan`: PASS, no high-confidence secrets found.
- `npm run build`: PASS.
- `npm audit --audit-level=high`: PASS, no high or critical findings; 2 moderate PostCSS findings remain transitive through Next.js.
- Post-seed fix checks: `npm run lint`, `npm run typecheck`, `npm run test:unit -- tests/unit/auth/runtime-context.test.ts`, `npm run secret:scan`, and `npm run build`: PASS.

## Out of Scope Confirmed

- No create/update client hosted workflow.
- No invitation acceptance or write mutations for hosted UAT.
- No role mutation, disable membership mutation, or F-002 work.
- No credentials, passwords, service-role keys, screenshots, traces, or production data added to Git.
