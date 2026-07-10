# Local quickstart

1. Start local Supabase/PostgreSQL using the repository's existing local tooling.
2. Apply migrations from a clean database.
3. Run `npm run test:rls:db` and retain blocked output if infrastructure is unavailable.
4. Run `npm run test:e2e:persistent` to exercise real browser sign-in, local Supabase Auth/API, route fixtures disabled under `APP_ENV=test-persistent`, and DB-backed lifecycle assertions.
5. Run the full command matrix from `tasks.md`.
6. Use Hadna synthetic seed data only. Never use hosted or customer values.

Persistent E2E safety rules:

- The persistent Playwright webserver must refuse non-local Supabase URLs.
- Hosted/Vercel environment values and service-role credentials must not be passed into the Next.js browser app process.
- Service-role access is allowed only in Node test setup/assertion code for synthetic local data.
- Generated passwords, tokens, cookies, traces, and reports must not be committed.
