# R-006 Readiness Boundary Contract

Date: 2026-07-01

## Baseline Contract

| Field | Required Value |
|---|---|
| Source branch | `origin/main` |
| Baseline commit | `1bc9e74af87959a053937e373d1d34ffcc6e2b65` |
| Baseline meaning | Post-F-005 official UI baseline |
| R-006 branch | `codex/r006-internal-online-trial-readiness` |
| Online trial started | No |
| Product feature changes | Forbidden |

## Supabase Boundary

| Check | Required |
|---|---|
| Target class | Non-production only |
| Production Supabase | Forbidden |
| Real client data | Forbidden |
| Public signup | Disabled before any future trial |
| Browser-visible service role key | Forbidden |
| Hosted migration in R-006 | Not allowed |
| Hosted seed in R-006 | Not allowed |
| Owner approval before future mutation | Required |

Allowed future public runtime env names only:

```text
APP_ENV
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Forbidden in docs, PRs, logs, screenshots, and browser bundles:

```text
SUPABASE_SERVICE_ROLE_KEY
service_role
sb_secret
database password
access token
temporary password
password hash
```

## Vercel Boundary

| Check | Required |
|---|---|
| Deployment in this PR | Not allowed |
| Deployment target for future trial | Non-production preview/staging only |
| `vercel --prod` | Forbidden for R-006 readiness |
| Production alias | Not allowed for R-006 readiness |
| Production acceptance | Not authorized |
| Share URL with team | Blocked until owner go/no-go after R-006 |

## Synthetic Data Plan Contract

R-006 defines this plan only; it does not add or apply a seed.

| Planned Fixture | Required Shape |
|---|---|
| Tenant | Fake tenant, recommended `Samawah R006 Demo` |
| Clients | Two fake clients, no real names |
| Contracts | One fake contract per fake client |
| Packages | One fake package per fake client |
| Deliverables | Current accepted workflow states only, enough to review product shell, lists, Kanban, SLA display, and audit behavior |
| Users | Tenant admin, account manager, client viewer |
| Email domain | `@r006.example.test` only |
| Password values/hashes | Zero committed or printed |

## Readiness Checklist

| ID | Area | Check | Expected Result |
|---|---|---|---|
| R006-GATE-001 | Baseline | Verify `origin/main` commit | `1bc9e74af87959a053937e373d1d34ffcc6e2b65` is recorded as starting point |
| R006-GATE-002 | Baseline | Full quality gate | lint, typecheck, unit, integration, RLS, component, E2E, secret scan, and build have recorded outcomes |
| R006-GATE-003 | Scope | Product diff review | No product code, dependency, seed, migration, files/comments/approvals/drag-drop changes |
| R006-GATE-004 | Supabase | Target class | Future target is explicitly non-production |
| R006-GATE-005 | Supabase | Data preflight | Future target has no real users, real clients, or non-approved fixture data |
| R006-GATE-006 | Supabase | Auth settings | Public signup is disabled |
| R006-GATE-007 | Vercel | Deployment boundary | Future deployment is preview/staging only, not production |
| R006-GATE-008 | Secrets | Secret handling | No secrets, temporary passwords, tokens, or hashes in GitHub/logs/screenshots |
| R006-GATE-009 | Synthetic data | Fixture plan | Planned emails use `@r006.example.test` only and names are fake |
| R006-GATE-010 | UAT scope | Current surfaces only | Sign-in, shell, clients, contracts, packages, deliverables, Kanban, audit, SLA, RTL/mobile only |
| R006-GATE-011 | UAT denial | Client viewer board denial | Client viewer cannot access internal Kanban |
| R006-GATE-012 | Rollback | Cleanup plan | Future trial includes credential revocation and fixture cleanup steps |

## Out-Of-Scope Contract

R-006 must not validate, introduce, deploy, or start:

- Online trial execution.
- Production Supabase.
- Production Vercel deployment or production acceptance.
- Real client data.
- New dependencies.
- Product feature changes.
- Schema migrations.
- Seed files or hosted seed execution.
- Files.
- Comments.
- Internal or client approvals.
- Drag/drop.
- AI.
- Social scheduling.
- Billing.
