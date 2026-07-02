# Quickstart: R-006 Internal Online Trial Execution

> 2026-07-02 execution update: R-006 Hadna UAT has already been inserted, deployed, and smoke-tested. Use this file only as historical resume context; use `evidence/verification.md` for the current state and remaining risks.

This quickstart is the safe resume guide for R-006 execution. The current run is blocked before hosted mutation, deployment, credentials, and smoke checks.

## 1. Verify Baseline

```powershell
git fetch origin
git rev-parse origin/main
git status --short --branch
```

Expected:

```text
10fc4a3b4c8f717d284d177906d1f32f5f61976c
codex/r006-internal-online-trial-execution
```

## 2. Review Boundaries

Read:

```text
docs/08-release/R-006-internal-online-trial-readiness.md
specs/007-r006-internal-online-trial-readiness/
specs/008-r006-internal-online-trial-execution/contracts/execution-boundary.md
```

Confirm:

- Supabase target is explicitly non-production.
- Vercel target is preview/staging only.
- Public signup is disabled.
- Synthetic users use `@r006.example.test` only.
- No credentials are written to GitHub, docs, logs, screenshots, or PR text.

## 3. Required Supabase Unblock

Provide secure operator access outside GitHub/docs/logs so count-only preflight can verify:

```text
auth users count
non-R006 auth users count
clients count
non-R006 clients count
public signup disabled
```

Do not run hosted migration, seed, or account creation until these checks pass and owner confirms the exact target.

## 4. Required Vercel Unblock

Configure or confirm Preview/Staging environment variables only:

```text
APP_ENV=preview or staging
NEXT_PUBLIC_SUPABASE_URL=<confirmed non-production Supabase URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<confirmed non-production publishable key>
```

Do not configure service-role keys in Vercel.

Do not run:

```powershell
vercel --prod
vercel deploy --prod
vercel promote
```

## 5. Trial Smoke Checks After Unblocked

Run only against preview/staging URL:

```text
sign-in
product shell
clients
client detail
contracts
packages
deliverables list
Kanban board
status transition behavior
audit evidence
SLA display
tenant/client isolation
denied client viewer access
RTL
mobile
```

Record only non-secret evidence in `specs/008-r006-internal-online-trial-execution/evidence/verification.md`.

## Current Result

No trial URL is issued in this run. Execution is blocked until Supabase preflight and Vercel preview/staging target confirmation are complete.
