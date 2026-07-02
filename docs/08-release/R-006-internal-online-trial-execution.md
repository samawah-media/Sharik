# R-006 Internal Online Trial Execution

## Status

BLOCKED AT TARGET PREFLIGHT - NO TRIAL URL ISSUED - NO HOSTED MUTATION - NO CREDENTIALS GENERATED

The owner decision is GO for a non-production internal online trial only. This package started the execution branch and preflight, then stopped because the candidate Supabase target is not clean for R-006 and the Vercel project still has no confirmed Preview/Staging env or deployment target.

## Draft PR Handoff

| Item | Value |
|---|---|
| PR | [#33 R-006 Internal Online Trial Execution - Preflight Blocked](https://github.com/samawah-media/Sharik/pull/33) |
| PR status | Draft / Open / Preflight Blocked |
| GitHub live status | Mergeable, not merged |
| Branch | `codex/r006-internal-online-trial-execution` |
| Draft PR creation HEAD | `2e3fe7e830336e24b56ce078da4af23d8bf98734` |
| Current live HEAD | `ea3512f4be0164bb13c5e711936251c8d4f1deb7` |
| Trial URL | None issued |
| Credentials | None generated or recorded |

## Baseline

- Execution branch: `codex/r006-internal-online-trial-execution`
- Baseline: `origin/main`
- Draft PR creation HEAD: `2e3fe7e830336e24b56ce078da4af23d8bf98734`
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
| PR #33 live status checked | PASS |
| No production deploy/promotion/alias run | PASS |
| No hosted migration or seed run | PASS |
| No credentials generated | PASS |
| No real client data added | PASS |

## Follow-up Gate Refresh - 2026-07-02

| Area | Result |
|---|---|
| PR #33 | Open / Draft / Mergeable at HEAD `ea3512f4be0164bb13c5e711936251c8d4f1deb7` |
| CI | `quality` passed |
| CodeRabbit | Status passed; review was skipped because PR #33 is Draft. No GitHub reviews or inline comments were present; one CodeRabbit issue comment exists as metadata only. |
| PR changed files | 13 files, limited to Spec Kit/release/governance artifacts; this refresh updates only release/progress/evidence docs. No product code, dependency, env, migration, seed, or app config change appeared in the current working tree. |
| Supabase read-only count preflight | BLOCKED: aggregate counts found 5 auth users outside `@r006.example.test` plus existing public operational data. |
| Supabase public signup status | BLOCKED: no safe read-only status surface was available; no signup attempt was made. |
| Supabase target update | BLOCKED: no fresh clean non-production Supabase target was provided in this mission; `sharik-uat` was not reused or cleaned. |
| Supabase local linked ref | `jnvuccapgsabrwwkxnbh` |
| Vercel env scope | BLOCKED: preview envs are empty, branch preview envs are empty, custom `staging` is not found, and listed envs are Production-only. |
| Vercel deployments | BLOCKED: preview deployments are empty; listed deployments are Production-only. |
| Vercel target update | BLOCKED: no confirmed Preview/Staging target was provided in this mission. |
| Gate decision | HOLD: keep PR #33 Draft and do not start trial. |

## Owner Decision Gate - 2026-07-02

PR #33 remains Draft/HOLD. The only safe next owner choices are:

| Option | Safe path | Still prohibited until separately approved |
|---|---|---|
| A | Provide a fresh, clean Supabase non-production target for R-006, then rerun count-only/public-signup preflight. | Hosted migration, seed, account creation, credential generation, trial start. |
| B | Explicitly authorize cleanup/isolation of `sharik-uat` after confirming the existing hosted data is not real client data. | Cleanup or isolation without exact target-specific authorization and a no-real-client-data confirmation. |
| C | Keep PR #33 Draft/HOLD until both Supabase and Vercel targets are confirmed safe. | Ready-for-review conversion, merge, trial URL, credentials. |
| D | Prepare Vercel Preview/Staging target metadata/env boundary only. | Deploy, alias, production promotion, trial start, trial URL. |

Generic approval does not waive the exact-target gate. Any hosted cleanup, mutation, deployment, credential generation, or trial execution still requires a separate exact-target owner instruction.

## Supabase Target Status

Candidate:

```text
name: sharik-uat
ref: jnvuccapgsabrwwkxnbh
region: eu-west-1
status: ACTIVE_HEALTHY
```

This is a candidate only. It is not approved for R-006 mutation because hosted data/auth preflight found existing non-R-006 data.

The follow-up gate refresh ran read-only aggregate hosted queries. No row values, emails, hosted migration, seed, account creation, signup attempt, credential generation, or secret values were printed or recorded.

Blocked checks:

- auth users count: 5 users
- non-R006 auth users count: 5 users outside `@r006.example.test`
- clients count: 2 clients
- non-approved fixture data: 1 tenant, 2 contracts, 2 packages, 2 package lines, 7 deliverables, and 3 audit events
- public signup disabled: not verified through a safe read-only surface

Reason:

```text
The candidate contains existing non-R-006 hosted users and public operational data.
R-006 requires 0 real users, 0 real clients, and 0 non-approved fixture data before any mutation or trial.
Public signup status still needs safe read-only confirmation.
```

## Vercel Target Status

Candidate:

```text
project: sharik-platform
```

Blocked checks:

- Preview env vars are not configured.
- Branch-scoped preview env vars for `codex/r006-internal-online-trial-execution` are not configured.
- Custom `staging` environment is not found.
- Current env names are scoped to Production only.
- Preview deployments are empty.
- Listed deployments are Production environment only.
- No preview/staging trial URL exists.

No Vercel deployment command was run.

The follow-up gate refresh rechecked Vercel read-only metadata. The project is linked, but no Preview/Staging target is confirmed for R-006.

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

1. Provide or select a Supabase target whose count-only preflight proves 0 real users, 0 real clients, 0 non-approved fixture data, and disabled public signup.
2. Owner confirms the exact Supabase target after preflight passes.
3. Configure Vercel Preview/Staging env vars only for the confirmed non-production target.
4. Owner confirms the exact Vercel preview/staging target after env/deployment preflight passes.
5. Generate credentials only after the above, and deliver them outside GitHub/docs/logs/chat/screenshots.

Evidence is recorded in:

```text
specs/008-r006-internal-online-trial-execution/evidence/verification.md
```
