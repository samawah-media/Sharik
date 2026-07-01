# Quickstart Validation Guide: R-005 Internal Online Trial Readiness

Date: 2026-07-01

This guide prepares and validates an internal online trial for the current Sharik platform state after PR #26. It is staging-only, synthetic-only, and not Production acceptance.

## Preconditions

- PR #26 is merged into `main`.
- Branch is `codex/r-005-internal-online-trial-readiness`.
- Hosted staging target is named exactly `sharik-internal-trial-staging`.
- No Production Supabase project is used.
- No real client data is imported.
- Public signup is disabled in the staging Supabase Auth settings.
- Temporary password values are never committed, printed, pasted into GitHub, or included in screenshots.

## Local Verification Before Hosted Work

Run from the repository root:

```powershell
git status --short --branch
gh pr view 26 --json number,state,mergedAt,title,url
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

Expected:

- PR #26 is `MERGED`.
- Current branch is `codex/r-005-internal-online-trial-readiness`.
- All requested checks pass or any blocker is recorded before PR creation.

## Hosted Staging Setup Gate

Use only an owner-approved hosted staging target named:

```text
sharik-internal-trial-staging
```

Allowed public runtime env names:

```text
APP_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=<staging public URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging publishable key>
```

Rules:

- Do not set a browser-visible service role key.
- Do not print env values.
- Do not use a Production Supabase project.
- Do not use the old R-004 hosted target.
- Record only non-secret metadata in GitHub.

## Supabase Staging Gate

Before applying migrations or seed to hosted staging:

1. Confirm the project is named or documented as `sharik-internal-trial-staging`.
2. Confirm it is not a Production Supabase project.
3. Confirm public signup is disabled.
4. Confirm it contains no real clients and no real auth users.
5. Confirm any existing users/clients are either absent or approved R-005 synthetic fixtures.

Do not paste database passwords, access tokens, or service role keys into docs, PR text, screenshots, chat, or terminal output.

## Hosted Migration

If the staging project is new and has not received the current schema, apply migrations only after the staging gate passes:

```powershell
npx supabase@2.107.0 --version
npx supabase@2.107.0 link --project-ref <R005_STAGING_PROJECT_REF>
npx supabase@2.107.0 migration list --linked
npx supabase@2.107.0 db push --linked --dry-run
npx supabase@2.107.0 db push --linked
npx supabase@2.107.0 migration list --linked
```

If a database password is required, provide it through a local environment variable and clear it after the command. Do not print the value.

## Synthetic Seed

Approved R-005 seed file:

```text
supabase/seeds/r005_internal_online_trial_readiness.sql
```

Apply it only to the approved, empty, non-production staging target:

```powershell
psql "$env:R005_STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seeds/r005_internal_online_trial_readiness.sql
```

Rules:

- The seed refuses targets with auth/client data outside the R-005 fixture set.
- The seed creates no password value or password hash.
- Do not use `supabase/seed.sql`.
- Do not use R-004 seed files for R-005.

Expected seeded data:

| Type | Expected |
|---|---|
| Tenant | `Samawah Demo` |
| Clients | 2 synthetic clients |
| Contracts | 1 per client |
| Packages | 1 per client |
| Deliverables | 5 to 8 varied statuses |
| Users | tenant admin, account manager, client viewer |
| Email domain | `@r005.example.test` only |

## Temporary Credential Delivery

Seeded users have no committed password. The project owner should receive temporary login credentials outside GitHub through an existing private channel or password manager controlled by the owner.

Allowed delivery pattern:

1. Generate unique temporary passwords locally without printing them.
2. Set or reset each R-005 synthetic user's password in the staging Supabase project.
3. Deliver the account list and temporary passwords to the project owner outside GitHub.
4. Record only that delivery occurred, not the values.
5. Clear or rotate temporary passwords after UAT is complete.

Forbidden:

- PR comments with passwords.
- GitHub issues/discussions with passwords.
- Committed `.env` files.
- Terminal logs that echo passwords.
- Screenshots containing passwords.

## UAT Checklist

| ID | Check | Expected |
|---|---|---|
| UAT-001 | Sign in | A synthetic R-005 user can sign in with out-of-GitHub temporary credentials |
| UAT-002 | Open clients page | Tenant admin sees two synthetic clients |
| UAT-003 | Open a client | Client details load with synthetic-only data |
| UAT-004 | View contract/package/deliverables | Contract, package, package balance, and deliverables are visible |
| UAT-005 | Open Kanban board | Internal board loads for authorized internal roles |
| UAT-006 | Change allowed deliverable status | Allowed transition succeeds and progress updates |
| UAT-007 | Prevent forbidden transition | Forbidden transition is denied |
| UAT-008 | Deny client viewer board access | Client viewer cannot see or open the internal board |
| UAT-009 | Verify Audit Log | Allowed and denied transition events are recorded |
| UAT-010 | Verify SLA display | SLA statuses display for on-track/at-risk/overdue/waiting/completed examples |
| UAT-011 | RTL/mobile basic | Core pages remain usable on mobile and RTL |

## Out Of Scope

- Production Supabase.
- Real client data.
- Public signup.
- Open permissions.
- Product features beyond current state.
- AI.
- Social scheduling.
- Billing.
- Drag/drop.
- Files.
- Comments.
- Full approval workflow.

## Rollback

If the trial must be retired:

1. Remove or disable the hosted staging deployment.
2. Revoke/rotate temporary credentials.
3. Clear synthetic R-005 users or disable sign-in.
4. Do not delete the Supabase project without owner approval.
5. Record only non-secret rollback evidence.
