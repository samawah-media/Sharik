# Quickstart: R-006 Internal Online Trial Readiness

This quickstart validates readiness documentation and the post-F-005 baseline. It does not start an online trial, deploy, link hosted Supabase, apply migrations, apply seed data, or create credentials.

## Baseline

```powershell
git fetch origin main
git rev-parse origin/main
git log -1 --format="%H %ad %s" --date=iso-strict origin/main
```

Expected baseline:

```text
1bc9e74af87959a053937e373d1d34ffcc6e2b65
Merge pull request #29 from samawah-media/codex/f-005-ux-rescue-product-shell
```

## Full Baseline Quality Gate

Run from the repository root. To confirm the current root:

```powershell
git rev-parse --show-toplevel
```

Commands:

```powershell
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:rls
npm run test:component
npm run test:e2e
npm run secret:scan
npm run build
git diff --check
```

Record results in:

```text
specs/007-r006-internal-online-trial-readiness/evidence/verification.md
```

## Required Boundary Review

Before any future internal online trial, review:

```text
specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md
docs/08-release/R-006-internal-online-trial-readiness.md
```

Confirm:

- Supabase target is non-production only.
- Vercel target is preview/staging only.
- No `vercel --prod`.
- No real client data.
- Public signup disabled.
- No browser-visible service role key.
- No secrets, tokens, passwords, or hashes in GitHub, logs, docs, screenshots, or PR text.
- Synthetic fixture plan uses `@r006.example.test` only.

## Explicit Non-Actions

Do not run:

```powershell
vercel --prod
supabase link --project-ref <production>
supabase db push --linked
supabase db reset --linked
psql <hosted-target>
```

Do not create or apply:

```text
supabase/seeds/r006_*.sql
temporary passwords in docs
hosted users
real clients
new dependencies
product feature code
```
