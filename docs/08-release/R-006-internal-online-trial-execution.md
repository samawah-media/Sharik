# R-006 Internal Online Trial Execution

## Status

BLOCKED AT TARGET PREFLIGHT - NO TRIAL URL ISSUED - NO HOSTED MUTATION - NO CREDENTIALS GENERATED

The owner decision is GO for a non-production internal online trial only. This package started the execution branch and preflight, then stopped because the exact non-production Supabase and Vercel targets are not fully confirmed.

## Baseline

- Execution branch: `codex/r006-internal-online-trial-execution`
- Baseline: `origin/main`
- Required merge commit: `10fc4a3b4c8f717d284d177906d1f32f5f61976c`
- Baseline commit message: `Merge pull request #32 from samawah-media/codex/r006-internal-online-trial-readiness`
- Readiness package reviewed: `specs/007-r006-internal-online-trial-readiness/`
- Execution package: `specs/008-r006-internal-online-trial-execution/`

## What Was Confirmed

| Area | Result |
|---|---:|
| Execution branch created from PR #32 baseline | PASS |
| R-006 readiness docs read before operational action | PASS |
| Supabase candidate metadata visible | PASS |
| Vercel linked project visible | PASS |
| No production deploy/promotion/alias run | PASS |
| No hosted migration or seed run | PASS |
| No credentials generated | PASS |
| No real client data added | PASS |

## Supabase Target Status

Candidate:

```text
name: sharik-uat
ref: jnvuccapgsabrwwkxnbh
region: eu-west-1
status: ACTIVE_HEALTHY
```

This is a candidate only. It is not approved for R-006 mutation because hosted data/auth preflight did not complete.

Blocked checks:

- auth users count
- non-R006 auth users count
- clients count
- non-R006 clients count
- public signup disabled

Reason:

```text
Supabase hosted count query requested SUPABASE_DB_PASSWORD.
No database password was available or printed.
```

## Vercel Target Status

Candidate:

```text
project: sharik-platform
```

Blocked checks:

- Preview/Staging env vars are not configured.
- Current env names are scoped to Production only.
- Listed deployments are Production environment only.
- No preview/staging trial URL exists.

No Vercel deployment command was run.

## Synthetic Account Preparation

Prepared roster only:

| Persona | Email |
|---|---|
| Tenant admin | `tenant-admin@r006.example.test` |
| Account manager | `account-manager@r006.example.test` |
| Client viewer A | `client-viewer-a@r006.example.test` |
| Client viewer B | `client-viewer-b@r006.example.test` |

Credentials were not generated because target preflight is blocked. Credential delivery remains outside GitHub, docs, logs, screenshots, and PR text.

## Smoke Check Status

All requested smoke checks are blocked:

- sign-in
- product shell
- clients
- client detail
- contracts
- packages
- deliverables list
- Kanban board
- status transition behavior
- audit evidence
- SLA display
- tenant/client isolation
- denied client viewer access
- RTL
- mobile

Reason: there is no confirmed preview/staging deployment URL and no generated credentials.

## Stop Conditions Preserved

- No Production Supabase.
- No Vercel production deployment, production alias, or production promotion.
- No real client data.
- No public signup.
- No hosted seed.
- No hosted migration.
- No product feature expansion.
- No dependency change.
- No credentials in GitHub/docs/logs/screenshots.

## Required Unblock

Before resuming R-006 execution:

1. Provide secure Supabase DB preflight access outside GitHub/docs/logs.
2. Verify count-only preflight and public signup disabled.
3. Owner confirms the exact Supabase target after preflight passes.
4. Configure Vercel Preview/Staging env vars only for the confirmed non-production target.
5. Owner confirms the exact Vercel preview/staging target.
6. Generate credentials only after the above, and deliver them outside GitHub/docs/logs.

Evidence is recorded in:

```text
specs/008-r006-internal-online-trial-execution/evidence/verification.md
```
