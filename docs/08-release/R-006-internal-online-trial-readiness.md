# R-006 Internal Online Trial Readiness

## Status

R-006 BASELINE READY FOR OWNER REVIEW - ONLINE TRIAL NOT STARTED - SYNTHETIC PLAN ONLY

This release-readiness package prepares the go/no-go material for a later internal online trial after F-005 became the official UI baseline. It does not authorize Production Supabase, production deployment, production acceptance, real client data, hosted mutation, public signup, temporary credentials, or product feature expansion.

## Baseline

- F-005 PR: https://github.com/samawah-media/Sharik/pull/29
- F-005 status: merged into `main`
- F-005 merge commit: `1bc9e74af87959a053937e373d1d34ffcc6e2b65`
- R-006 branch: `codex/r006-internal-online-trial-readiness`
- Spec Kit package: `specs/007-r006-internal-online-trial-readiness/`

## Goal

Prepare a safe readiness package for the next owner decision:

- verify the post-F-005 baseline with the full local quality gate;
- define non-production Supabase boundaries;
- define non-production Vercel boundaries;
- define a synthetic data plan only;
- provide a readiness checklist for a later internal online trial.

## Non-Negotiable Constraints

- No online trial execution.
- No Production Supabase.
- No production Vercel deployment or production acceptance.
- No real client data.
- No public signup.
- No broad/open permissions.
- No temporary passwords in GitHub, docs, logs, screenshots, or PR text.
- No hosted migration.
- No hosted seed.
- No new product features.
- No new dependencies.
- No AI, social scheduling, billing, drag/drop, files, comments, or approvals.

## Non-Production Supabase Boundary

Any future Supabase target must pass these checks before migration, seed, or trial execution:

| Check | Expected |
|---|---|
| Target type | Non-production only |
| Real users | 0, unless explicitly approved synthetic trial users |
| Real clients | 0 |
| Non-approved fixture data | 0 |
| Public signup | Disabled |
| Service role in browser | Forbidden |
| Secrets in docs/logs/screenshots | Forbidden |
| Owner go/no-go | Required before mutation |

R-006 does not link, inspect, migrate, seed, or mutate any hosted Supabase target.

## Non-Production Vercel Boundary

Any future Vercel target must be preview/staging only for R-006 follow-up:

| Check | Expected |
|---|---|
| Deployment during R-006 | Not performed |
| Future deployment target | Preview/staging only |
| `vercel --prod` | Forbidden |
| Production alias | Forbidden for R-006 readiness |
| Production acceptance | Not authorized |
| Team URL sharing | Blocked until owner go/no-go |

## Synthetic Data Plan

R-006 defines this plan only. It does not add a seed file and does not apply data.

| Planned Item | Required Shape |
|---|---|
| Tenant | Fake tenant, recommended `Samawah R006 Demo` |
| Clients | Two fake clients with non-real names |
| Contracts | One fake contract per fake client |
| Packages | One fake package per fake client |
| Deliverables | Current accepted workflow states, enough for shell, lists, Kanban, SLA display, and audit review |
| Users | Tenant admin, account manager, client viewer |
| Email domain | `@r006.example.test` only |
| Passwords/hashes | None committed or printed |

## Readiness Checklist

| ID | Check | Expected |
|---|---|---|
| R006-001 | Post-F-005 baseline | `origin/main` is `1bc9e74af87959a053937e373d1d34ffcc6e2b65` |
| R006-002 | Full baseline quality gate | lint, typecheck, unit, integration, RLS, component, E2E, secret scan, and build are recorded |
| R006-003 | Scope diff | No product code, dependency, seed, migration, files/comments/approvals/drag-drop changes |
| R006-004 | Supabase target | Future target is non-production and owner-approved |
| R006-005 | Supabase data | Future target has no real users, real clients, or non-approved fixture data |
| R006-006 | Supabase auth | Public signup disabled |
| R006-007 | Vercel target | Future target is preview/staging only |
| R006-008 | Secret handling | No secrets, passwords, tokens, hashes, or database passwords in GitHub/logs/screenshots |
| R006-009 | Synthetic plan | Uses fake names and `@r006.example.test` only |
| R006-010 | Current UAT scope | Sign-in, product shell, clients, contracts, packages, deliverables, Kanban, audit, SLA, RTL/mobile only |
| R006-011 | Client denial | Client viewer cannot access internal Kanban |
| R006-012 | Rollback | Future trial includes credential revocation and fixture cleanup |

## Verification Evidence

Command-by-command evidence is recorded in:

```text
specs/007-r006-internal-online-trial-readiness/evidence/verification.md
```

Summary:

| Command | Result |
|---|---:|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS, 24 files / 81 tests |
| `npm run test:integration` | PASS, 20 files / 83 tests |
| `npm run test:rls` | PASS, simulator 8 files / 24 tests and pgTAP 3 files / 133 tests |
| `npm run test:component` | PASS, 15 files / 47 tests |
| `npm run test:e2e` | PASS, 67 passed / 2 skipped |
| `npm run secret:scan` | PASS, no high-confidence secrets found |
| `npm run build` | PASS |
| `git diff --check` | PASS, CRLF working-copy warnings only |
| final `npm run secret:scan` | PASS, no high-confidence secrets found |

This evidence supports owner review of readiness only. It does not authorize trial execution.

## Out Of Scope

- Online trial execution.
- Hosted deployment.
- Hosted Supabase migration or seed.
- Production acceptance.
- Production Supabase.
- Production Vercel deployment.
- Real client data.
- New dependencies.
- Product feature expansion.
- Database schema changes.
- Seed files.
- Drag/drop.
- Files.
- Comments.
- Internal/client approvals workflow.
- Social scheduling.
- AI.
- Billing.
