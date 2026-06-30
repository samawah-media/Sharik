# Quickstart Validation Guide: Internal Online MVP UAT

Date: 2026-06-30

This guide describes how to prepare and validate an internal online UAT for Sharik after PR #17. It includes no secrets, no Production Supabase usage, and no real client data. Owner decision on 2026-06-30 allows Vercel Hobby/free and allows Vercel Production target for hosting only.

## Preconditions

- PR #17 is merged into `main`.
- Branch `codex/internal-online-mvp-uat` starts from `origin/main` after PR #17.
- This Spec Kit package has been reviewed.
- Hosted Supabase migration is forbidden until a Supabase UAT project exists and has explicit approval before it runs.
- Vercel account is confirmed as the owner-approved Hobby/free account before deployment.
- Vercel Production target may be used for hosting only; it is not Production acceptance.
- Protection status is recorded before sharing any URL. If protection is unavailable on the free account, record the public exposure limitation.
- All data is synthetic.

## Current Hosted Result For This Run

As of 2026-06-30:

- Approved Supabase UAT project ref: `jnvuccapgsabrwwkxnbh`.
- Hosted non-production migration has been applied.
- Hosted R-004 synthetic seed has been applied using only `supabase/seeds/r004_internal_online_mvp_uat.sql`.
- Vercel Production target is deployed as hosting-only at `https://sharik-platform.vercel.app`.
- Full authenticated browser UAT remains blocked until synthetic users receive an approved temporary password/sign-in path.
- Do not use real client data and do not treat the Vercel Production target as Production acceptance.

## Explicit Approval Required For Hosted Supabase

Do not run hosted non-production Supabase migration until the owner creates a Supabase UAT project and provides an explicit approval in this exact shape, with a real Supabase project ref replacing `<PROJECT_REF>`:

```text
أوافق على تشغيل hosted non-production Supabase migration لـ Sharik Internal Online MVP UAT ضد project ref <PROJECT_REF>. Synthetic data only. No Production and no real client data.
```

If this approval is missing, ambiguous, or still contains the literal `<PROJECT_REF>` placeholder, mark hosted migration and data-backed hosted UAT as `BLOCKED`.

## Local Baseline Checks

Run from the repository root:

```powershell
git status --short --branch
git log --oneline -n 5 origin/main
gh pr view 17 --json number,state,mergedAt,mergeCommit,url,title
git diff --check
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:rls
npm run test:component
npm run test:e2e
npm run secret:scan
npm audit --audit-level=high
npm run build
```

Expected result:

- PR #17 is `MERGED`.
- Branch is `codex/internal-online-mvp-uat`.
- Local quality gates pass.
- If a gate fails, stop and record the failure before any hosted step.

## Hosted Environment Checks Before Migration Or Deploy

Use these checks without printing secrets:

```powershell
vercel --version
vercel whoami
vercel project list
```

Expected result:

- The account is the owner-approved Vercel Hobby/free account.
- If the CLI is authenticated to the wrong account, do not deploy.
- Team scope is not required for this free UAT path.

For Supabase, use approved project metadata only after H1 approval. Do not print service role keys or database passwords.

## Supabase Access Recovery If CLI Is Unauthorized

If `supabase link --project-ref <PROJECT_REF>` returns an access-control error, stop before migration and seed.

Allowed recovery paths:

1. Invite the Supabase account currently used by this machine to the UAT project organization with sufficient project/database privileges.
2. Or log this machine into the new Supabase account using a Personal Access Token:

```powershell
npx supabase@2.107.0 login --token <SUPABASE_ACCESS_TOKEN>
```

Do not commit or paste the token in docs, PR text, screenshots, or terminal logs. After login, rerun only non-secret verification first:

```powershell
npx supabase@2.107.0 projects list
npx supabase@2.107.0 link --project-ref <PROJECT_REF>
```

If linked database queries request a database password, provide it only through a local environment variable and clear it after the run:

```powershell
$env:SUPABASE_DB_PASSWORD = Read-Host "Paste Supabase DB password"
npx supabase@2.107.0 db query --linked --output json "select count(*)::int as auth_user_count from auth.users;"
Remove-Item Env:\SUPABASE_DB_PASSWORD
```

Do not paste the database password into chat, docs, screenshots, PR text, or committed files.

## Hosted Supabase Migration - Blocked Until Approval

After explicit approval only:

```powershell
npx supabase@2.107.0 --version
npx supabase@2.107.0 link --project-ref <PROJECT_REF>
npx supabase@2.107.0 migration list --linked
npx supabase@2.107.0 db push --linked --dry-run
# Apply only after the dry-run output, project identity, and no-real-data checks are reviewed.
npx supabase@2.107.0 db push --linked
npx supabase@2.107.0 migration list --linked
```

Evidence to record:

- Target project ref.
- Migration list before and after.
- Whether the target is non-production.
- Confirmation that no real data exists.
- Rollback plan.

Do not run this section without explicit approval.

## Synthetic Data Seed Requirements

The approved R-004 seed file is:

```text
supabase/seeds/r004_internal_online_mvp_uat.sql
```

Do not use `supabase/seed.sql` for R-004 hosted UAT. That older local seed is not sufficient for Client A/B isolation and accepted MVP surface checks.

After migration approval, target verification, and successful hosted migration only, apply the R-004 seed with an approved `psql` client or the Supabase SQL Editor. Do not print the database URL or password.

```powershell
psql "$env:R004_UAT_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seeds/r004_internal_online_mvp_uat.sql
```

Do not use `supabase db query --file` for this seed because Supabase CLI 2.107 executes SQL through a prepared statement path that rejects this multi-command seed file.

The seed has guards that refuse to run if the target contains client/auth data outside the approved synthetic R-004 fixture set.

Minimum data:

| Type | Required examples |
|---|---|
| Tenant | `Samawah UAT` |
| Clients | `Client Alpha UAT`, `Client Beta UAT` |
| Internal users | tenant administrator and account manager for Client Alpha |
| Client users | Client Alpha approver/viewer, Client Beta viewer |
| Contracts/packages | at least one active synthetic contract/package for Client Alpha |
| Deliverables | active, completed, cancelled examples |
| SLA cases | on track, at risk, overdue, paused waiting client, completed, cancelled |

Rules:

- Emails use `.example.test`.
- No real client names.
- No real client emails.
- No screenshots with secrets or real data.

`paused_waiting_internal_decision` is not currently seedable as hosted persisted data because the accepted F-003 MVP has no persisted SLA segment table. It remains covered by domain/unit evidence until a future approved schema change adds persisted SLA segments.

## Owner-Approved Vercel Deploy

Deploy only after docs and environment checks are complete:

```powershell
vercel link --yes --project <approved-project>
vercel env ls

# Preview-style deployment, if the owner wants preview first:
vercel deploy

# Production target is owner-approved for hosting only:
vercel deploy --prod

vercel inspect <deployment-url-or-deployment-id>
```

Expected result:

- Account is the owner-approved Vercel Hobby/free account.
- Deployment target is recorded as preview or production.
- If target is production, evidence must label it hosting-only, not Production acceptance.
- Env vars do not point to Production Supabase or real client data.
- Protection/public exposure status is recorded.

Do not treat a Vercel Production target as a complete UAT pass. If Supabase UAT migration/seed or synthetic sign-in credentials are not complete, affected data-backed smoke/security/UAT checks remain `BLOCKED`.

## Smoke Checks

| ID | Check | Expected |
|---|---|---|
| SM-001 | Open Vercel URL | Deployment responds and target/account are recorded |
| SM-002 | Sign-in surface | Sign-in page loads without exposing secrets |
| SM-003 | Hosted fixture actors | Query-selected route fixtures are disabled |
| SM-004 | Build/runtime health | No critical runtime error on accepted surfaces |
| SM-005 | Browser secret scan | No `service_role`, service key, or secret value in HTML |

## Security Checks

| ID | Check | Expected |
|---|---|---|
| SEC-001 | Client Alpha user opens Client Beta route | Denied/not found without Client Beta details |
| SEC-002 | Client user opens management route | Denied or redirected safely |
| SEC-003 | Unauthorized deliverable/SLA access | Denied without resource enumeration |
| SEC-004 | Vercel env review | No Production Supabase URL, real data, or secrets exposed |
| SEC-005 | Secret scan | `npm run secret:scan` passes |

## UAT Checks

Only run data-backed UAT after hosted migration and synthetic seed are explicitly approved and complete. Only mark authenticated browser UAT `PASS` after a secure synthetic sign-in path exists; otherwise mark those checks `BLOCKED`.

| ID | Surface | Expected |
|---|---|---|
| UAT-001 | Client management | Synthetic clients visible only to authorized users |
| UAT-002 | Contracts | Synthetic contract context works for authorized management users |
| UAT-003 | Packages | Synthetic package commitments and balance projection work |
| UAT-004 | Deliverables | Synthetic deliverable creation/list/release surfaces work within accepted MVP |
| UAT-005 | Commercial summaries | Management/client-safe summaries remain scoped |
| UAT-006 | SLA MVP summaries | Synthetic SLA statuses display/derive as expected for management scope |

Do not test Kanban, files, comments, approvals, social scheduling, AI, or Production.

## Evidence Recording

Update:

- `specs/004-internal-online-mvp-uat/evidence/uat-evidence-checklist.md`
- `docs/PROJECT_PROGRESS.md`

Use one of these statuses:

- `PASS`
- `FAIL`
- `BLOCKED`
- `SKIPPED`
- `NOT RUN`

Hosted checks must not be marked `PASS` unless they were actually run against the correct hosted environment. Data-backed checks must remain `BLOCKED` until Supabase UAT exists.

## Rollback

If deploy or migration must be rolled back:

```powershell
vercel remove <deployment-id> --yes
```

For Supabase, do not delete the project or mutate hosted data without owner approval. Record whether rollback is a deployment removal, synthetic data reset, migration reversal, or project recreation.
