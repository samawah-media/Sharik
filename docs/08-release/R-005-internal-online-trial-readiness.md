# R-005 Internal Online Trial Readiness

## Status

R-005 PR OPEN - STAGING ONLY - SYNTHETIC DATA ONLY

This release-readiness package prepares an internal online trial after PR #26. It does not authorize Production Supabase, real client data, public signup, open permissions, Production acceptance, or product feature expansion.

## Baseline

- PR #26: `[codex] F-004 internal kanban workflow MVP`
- PR #26 status: merged into `main`
- PR #26 merged at: `2026-07-01T06:33:02Z`
- R-005 branch: `codex/r-005-internal-online-trial-readiness`
- R-005 PR: https://github.com/samawah-media/Sharik/pull/27
- Spec Kit package: `specs/006-internal-online-trial-readiness/`
- Hosted staging environment name: `sharik-internal-trial-staging`

## Goal

Prepare a safe online internal trial for Samawah's team using only the current platform state:

- sign-in;
- clients page;
- client detail;
- contract/package/deliverables display;
- internal Kanban board;
- allowed and denied status transition checks;
- audit log evidence;
- SLA display;
- RTL/mobile basic check.

## Non-Negotiable Constraints

- No Production Supabase.
- No real client data.
- No public signup.
- No broad/open permissions.
- No temporary passwords in GitHub, docs, logs, screenshots, or PR text.
- No new product features.
- No AI.
- No social scheduling.
- No billing.
- No drag/drop.
- No files/comments/full approval workflow.

## Hosted Staging Definition

The only R-005 hosted staging target name is:

```text
sharik-internal-trial-staging
```

Allowed public runtime env names:

```text
APP_ENV
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Do not expose or configure a browser-visible service role key.

## Synthetic Seed

Approved seed file:

```text
supabase/seeds/r005_internal_online_trial_readiness.sql
```

Expected data:

| Type | Expected |
|---|---|
| Tenant | `Samawah Demo` |
| Clients | 2 synthetic clients |
| Contracts | 1 per client |
| Packages | 1 per client |
| Deliverables | 8 synthetic deliverables |
| Users | tenant admin, account manager, client viewer |
| Email domain | `@r005.example.test` only |
| Password hashes | none committed |

The seed refuses to run if the target contains client/auth data outside the approved R-005 fixture set.

## Credential Delivery

Seeded users intentionally have no committed password. Temporary login credentials must be generated and delivered to the project owner outside GitHub through an existing private channel or password manager.

Record only:

- delivery date;
- recipient role;
- accounts covered;
- confirmation that no values were posted to GitHub or logs.

Never record:

- temporary passwords;
- password hashes;
- database passwords;
- service role keys;
- access tokens.

## UAT Checklist

| ID | Check | Expected |
|---|---|---|
| UAT-001 | Sign in | A synthetic R-005 user can sign in with out-of-GitHub credentials |
| UAT-002 | Open clients page | Tenant admin sees two synthetic clients |
| UAT-003 | Open a client | Client details load with synthetic-only data |
| UAT-004 | View contract/package/deliverables | Contract, package, package balance, and deliverables are visible |
| UAT-005 | Open Kanban board | Internal board loads for authorized internal roles |
| UAT-006 | Change allowed deliverable status | Allowed transition succeeds and progress updates |
| UAT-007 | Prevent forbidden transition | Forbidden transition is denied |
| UAT-008 | Deny client viewer board access | Client viewer cannot see or open the internal board |
| UAT-009 | Verify Audit Log | Allowed and denied transition events are recorded |
| UAT-010 | Verify SLA display | SLA statuses display for seeded examples |
| UAT-011 | RTL/mobile basic | Core pages remain usable on mobile and RTL |

## Hosted Execution Gate

Before any hosted migration or seed:

1. Verify the target is `sharik-internal-trial-staging`.
2. Verify it is non-production.
3. Verify public signup is disabled.
4. Verify no real users or clients exist.
5. Verify no secrets will be printed.
6. Apply migrations only if the staging database is empty or explicitly approved for this trial.
7. Apply only the R-005 seed listed above.

## Verification Commands Before PR

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:rls
npm run test:component
npm run test:e2e
npm run secret:scan
npm run build
```

## Rollback

If the trial must be retired:

1. Disable or remove hosted staging deployment.
2. Revoke or rotate all temporary synthetic credentials.
3. Clear or disable R-005 synthetic auth users.
4. Preserve non-secret evidence.
5. Do not delete hosted Supabase project without owner approval.

## Out Of Scope

- Production acceptance.
- Production Supabase.
- Real client data.
- New dependencies.
- Product feature expansion.
- Database schema changes.
- Drag/drop.
- Files.
- Comments.
- Full internal/client approvals workflow.
- Social scheduling.
- AI.
- Billing.
