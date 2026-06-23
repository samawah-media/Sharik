# F-001 Local Development Strategy

F-001 development must use local-only or isolated development resources.

## Package Manager

Use npm in the repository root. The demo already uses `package-lock.json`, so
F-001 keeps the same lockfile family and does not introduce pnpm, yarn, or bun.

## Supabase

Use either:

- Supabase local CLI once installed and authenticated for local development, or
- an isolated Supabase development project with synthetic data only.

Production projects, production credentials, real client names, real emails, and
real files are forbidden for F-001 work.

## Data Rules

- Use `.example.test` emails.
- Use synthetic tenant and client names such as Tenant A, Tenant B, Client A,
  and Client B.
- Do not commit `.env.local`.
- Do not expose service-role credentials to browser imports.

## Verification

RLS behavior must be verified before A1/A2 can be claimed complete. If the
Supabase CLI remains unavailable, RLS tests may be written but must be reported
as blocked until a safe local or isolated development database is available.
