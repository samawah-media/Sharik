# Verification Evidence: R-006 Internal Online Trial Execution

Date: 2026-07-02

## Baseline

| Item | Value |
|---|---|
| Owner decision | GO for non-production internal online trial only |
| Source branch | `origin/main` |
| Required baseline | `10fc4a3b4c8f717d284d177906d1f32f5f61976c` |
| Baseline commit message | `Merge pull request #32 from samawah-media/codex/r006-internal-online-trial-readiness` |
| Execution branch | `codex/r006-internal-online-trial-execution` |
| Draft PR | [#33 R-006 Internal Online Trial Execution - Preflight Blocked](https://github.com/samawah-media/Sharik/pull/33) |
| PR status | Draft / Open / Preflight Blocked; GitHub live check reports mergeable and not merged. |
| Draft PR creation HEAD | `2e3fe7e830336e24b56ce078da4af23d8bf98734` |

## Readiness Documents Reviewed

| Artifact | Status |
|---|---:|
| `docs/08-release/R-006-internal-online-trial-readiness.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/spec.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/plan.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/tasks.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/research.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/data-model.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/quickstart.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/checklists/requirements.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/evidence/verification.md` | PASS |

## Command Evidence

| ID | Command | Status | Non-secret Result |
|---|---|---:|---|
| EXEC-001 | `git fetch origin` | PASS | Remote refs updated. |
| EXEC-002 | `git rev-parse origin/main` | PASS | Returned `10fc4a3b4c8f717d284d177906d1f32f5f61976c`. |
| EXEC-003 | `git switch -c codex/r006-internal-online-trial-execution origin/main` | PASS | Branch created and tracks `origin/main`. |
| EXEC-004 | Safe env inspection | PASS | `.env.local` is labeled `APP_ENV=production` and `VERCEL_ENV=production`; it is not valid for R-006. |
| EXEC-005 | `npx supabase projects list -o json` | PASS | Candidate project `sharik-uat`, ref `jnvuccapgsabrwwkxnbh`, region `eu-west-1`, status `ACTIVE_HEALTHY`. |
| EXEC-006 | `npx supabase db query --linked` table-name query | PASS | Listed public/auth table names only; no row values printed. |
| EXEC-007 | `npx supabase db query --linked` deeper metadata query | BLOCKED | CLI requested `SUPABASE_DB_PASSWORD`; no password was available or printed. |
| EXEC-008 | `vercel env ls` | PASS | Linked `sharik-platform` has env names only in Production scope. |
| EXEC-009 | `vercel ls` | PASS | Listed Ready deployments, all in Production environment. |
| EXEC-010 | `npx supabase --help` / relevant subcommand help | PASS | CLI capabilities reviewed before use. |
| EXEC-011 | `vercel --help` / env/list commands | PASS | CLI capabilities reviewed before use. |
| EXEC-012 | `npm run secret:scan` | PASS | No high-confidence secrets found. |
| EXEC-013 | `git diff --check` | PASS | No whitespace errors; CRLF working-copy warnings only. |
| EXEC-014 | GitHub PR #33 live check | PASS | PR #33 was Open, Draft, mergeable, and pointed to draft-creation HEAD `2e3fe7e830336e24b56ce078da4af23d8bf98734` before this handoff update. |
| EXEC-015 | GitHub PR #33 follow-up live check | PASS | PR #33 remained Open, Draft, and mergeable at HEAD `8a85bb7fbb67355b0edbd38dd221e3393a4ffd30` before this decision-gate documentation refresh. `quality` passed. CodeRabbit status passed, but `gh pr checks` reports `Review skipped: draft pull request`; no GitHub review or inline comments were present. |
| EXEC-016 | CodeRabbit comment marker check | PASS | One CodeRabbit issue comment was present; no blocker/actionable marker was detected without printing the comment body. |
| EXEC-017 | Secure Supabase access presence check | BLOCKED | Secure DB preflight access was not present in the Codex process; no secret values were printed. |
| EXEC-018 | Supabase local link check | PASS | Local linked ref is `jnvuccapgsabrwwkxnbh`. |
| EXEC-019 | `vercel env ls` follow-up | BLOCKED | Vercel env names remain Production-only. |
| EXEC-020 | `vercel ls` follow-up | BLOCKED | Listed deployments remain Production-only; no Preview/Staging target is confirmed. |
| EXEC-021 | `npx supabase@2.107.0 projects list --output-format json` refresh | PASS | Candidate project remains `sharik-uat`, ref `jnvuccapgsabrwwkxnbh`, region `eu-west-1`, status `ACTIVE_HEALTHY`, and linked. |
| EXEC-022 | `npx supabase@2.107.0 db query --linked` auth count preflight | BLOCKED | Read-only aggregate query returned 5 auth users and 5 auth users outside `@r006.example.test`; no row values or emails were printed. |
| EXEC-023 | `npx supabase@2.107.0 db query --linked` public aggregate counts | BLOCKED | Read-only aggregate query returned existing public data: 1 tenant, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, and 3 audit events. |
| EXEC-024 | Supabase auth config read-only surface check | BLOCKED | Current CLI/help and database metadata did not expose a safe public-signup status read; signup was not tested by attempting signup because that could create an account. |
| EXEC-025 | `vercel env ls preview --format json` | BLOCKED | Preview env list is empty. |
| EXEC-026 | `vercel env ls preview codex/r006-internal-online-trial-execution --format json` | BLOCKED | Branch-scoped preview env list is empty. |
| EXEC-027 | `vercel env ls staging --format json` | BLOCKED | Custom `staging` environment was not found. |
| EXEC-028 | `vercel env ls --format json` | BLOCKED | All listed env names are scoped to Production only. |
| EXEC-029 | `vercel ls sharik-platform --environment preview --format json` | BLOCKED | Preview deployment list is empty. |
| EXEC-030 | `vercel ls sharik-platform --environment production --format json` | PASS | Production deployments exist, but no production deploy, alias, promotion, or trial use was run. |

## Draft PR Handoff

| Item | Status |
|---|---:|
| PR #33 URL recorded | PASS |
| PR #33 Draft/Open status recorded | PASS |
| Preflight Blocked status recorded | PASS |
| Draft PR creation HEAD recorded | PASS |
| No trial URL | PASS |
| No credentials | PASS |
| Required owner action recorded | PASS |

## Supabase Preflight

| Check | Expected | Status | Evidence |
|---|---|---:|---|
| Candidate target exists | Non-production candidate | PASS | `sharik-uat` metadata is visible. |
| Production Supabase not used | No production target | PASS | No production-labeled Supabase target was selected. |
| Real users count | 0 or approved R-006 synthetic only | BLOCKED | Aggregate auth count returned 5 users, all outside `@r006.example.test`. |
| Real clients count | 0 | BLOCKED | Aggregate public count returned 2 clients. |
| Non-approved fixture data | 0 | BLOCKED | Aggregate public counts returned existing tenant/client/contract/package/deliverable/audit data, so the target is not clean for R-006. |
| Public signup | Disabled | BLOCKED | Not verified through a safe read-only surface; no signup attempt was made because it could create an account. |
| Service role exposure | Not visible in browser/docs/logs | BLOCKED | Browser exposure check requires a confirmed non-production deployment URL; no trial URL exists. Docs/logs were kept free of secret values. |
| Hosted migration | Not run | PASS | No migration command was run. |
| Hosted seed | Not run | PASS | No seed command was run. |
| Account creation | Not run | PASS | No users were created. |

## Vercel Preflight

| Check | Expected | Status | Evidence |
|---|---|---:|---|
| Candidate project exists | `sharik-platform` | PASS | `.vercel/project.json` and CLI metadata available. |
| Preview/staging env vars | Present | BLOCKED | Preview envs are empty, branch-scoped preview envs are empty, custom `staging` does not exist, and all listed env names are Production-only. |
| Preview/staging deployment | Available or deployable after safe env | BLOCKED | Preview deployments are empty; listed deployments remain Production target only. |
| Production deploy | Not run | PASS | No `vercel --prod` or deploy command was run. |
| Production alias | Not created/used | PASS | No alias command was run. |
| Trial URL | Preview/staging URL | BLOCKED | No trial URL issued. |

## Follow-up Gate Decision

PR #33 remains HOLD / Draft because target preflight remains blocked:

- Supabase read-only counts ran, but the target contains non-R-006 auth users and existing public operational data.
- Supabase public-signup status was not verified through a safe read-only surface.
- Vercel has no confirmed Preview/Staging env or deployment target; environment variables and deployments remain Production-only.

The online trial did not start.

## Owner Decision Gate

PR #33 remains Draft/HOLD until the owner selects one safe blocker-resolution path and any required preflight passes:

| Option | Decision | Next safe action | Not authorized by this evidence |
|---|---|---|---|
| A | Fresh Supabase target | Provide a new clean non-production Supabase project/ref, then rerun read-only count/public-signup preflight. | Hosted migration, seed, account creation, credentials, trial start. |
| B | Authorized cleanup/isolation | Confirm the current `sharik-uat` data is not real client data and provide exact authorization for cleanup or isolation. | Any cleanup/isolation without exact target-specific approval. |
| C | Hold | Keep PR #33 Draft/HOLD until Supabase and Vercel targets are both safe. | Ready-for-review conversion, merge, trial URL, credentials. |
| D | Vercel target only | Configure or identify Preview/Staging target metadata/env boundary only. | Deploy, alias, production promotion, trial start, trial URL. |

No trial URL, credentials, hosted seed, hosted migration, hosted cleanup, account creation, Vercel deploy, alias, promotion, Ready-for-review conversion, or merge request was performed.

## Synthetic Account Preparation

| Persona | Email | Status |
|---|---|---:|
| Tenant admin | `tenant-admin@r006.example.test` | Roster only |
| Account manager | `account-manager@r006.example.test` | Roster only |
| Client viewer A | `client-viewer-a@r006.example.test` | Roster only |
| Client viewer B | `client-viewer-b@r006.example.test` | Roster only |

No credentials were generated. No passwords, hashes, tokens, service-role keys, database passwords, magic links, or reset links were recorded.

## Smoke Checks

| Area | Status | Reason |
|---|---:|---|
| Sign-in | BLOCKED | No confirmed target, no preview/staging URL, no credentials. |
| Product shell | BLOCKED | No preview/staging URL. |
| Clients | BLOCKED | No preview/staging URL. |
| Client detail | BLOCKED | No preview/staging URL. |
| Contracts | BLOCKED | No preview/staging URL. |
| Packages | BLOCKED | No preview/staging URL. |
| Deliverables list | BLOCKED | No preview/staging URL. |
| Kanban board | BLOCKED | No preview/staging URL. |
| Status transition behavior | BLOCKED | No preview/staging URL or credentials. |
| Audit evidence | BLOCKED | No status transition was executed. |
| SLA display | BLOCKED | No preview/staging URL. |
| Tenant/client isolation | BLOCKED | No preview/staging URL or credentials. |
| Denied client viewer access | BLOCKED | No preview/staging URL or credentials. |
| RTL | BLOCKED | No preview/staging URL. |
| Mobile | BLOCKED | No preview/staging URL. |

## Stop Decision

Execution stopped before hosted mutation, deployment, credential generation, and smoke checks.

Unblock requirements:

1. Owner provides or selects a Supabase target whose count-only preflight proves 0 real users, 0 real clients, 0 non-approved fixture data, and disabled public signup.
2. Owner confirms the exact Supabase target after those checks pass.
3. Vercel Preview/Staging environment variables are configured for the confirmed non-production Supabase target.
4. Owner confirms the exact Vercel preview/staging target after read-only env/deployment preflight passes.

## Result

No production promotion, production deployment, production alias, hosted seed, hosted migration, real client data, public signup enablement, or credential disclosure occurred.
