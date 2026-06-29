# Quickstart Validation Guide: Internal Online MVP UAT

Date: 2026-06-29

This guide describes how to prepare and validate a protected internal online UAT for Sharik after PR #17. It includes no secrets, no Production usage, and no real client data.

## Preconditions

- PR #17 is merged into `main`.
- Branch `codex/internal-online-mvp-uat` starts from `origin/main` after PR #17.
- This Spec Kit package has been reviewed.
- Hosted Supabase migration has explicit approval before it runs.
- Vercel account/scope is confirmed as the approved Sharik/Samawah scope before deployment.
- Preview protection is enabled before sharing any URL.
- All data is synthetic.

## Explicit Approval Required For Hosted Supabase

Do not run hosted non-production Supabase migration until the owner provides an explicit approval in this exact shape, with a real Supabase project ref replacing `<PROJECT_REF>`:

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
vercel teams ls
```

Expected result:

- The account/scope is the approved Sharik/Samawah deployment scope.
- If the CLI is authenticated to the wrong account, do not deploy.

For Supabase, use approved project metadata only after H1 approval. Do not print service role keys or database passwords.

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

## Protected Preview Deploy

Deploy only after docs and environment checks are complete:

```powershell
vercel link --yes --project <approved-project> --scope <approved-scope>
vercel env ls --scope <approved-scope>
vercel deploy --target=preview --scope <approved-scope>
vercel inspect <preview-url-or-deployment-id> --scope <approved-scope>
```

Expected result:

- Target is Preview, not Production.
- Protection is enabled.
- Preview env vars are scoped to Preview/non-production.
- Production env vars are not touched.

If the first deployment unexpectedly lands as Production, delete it immediately, record the incident, and do not continue until the target behavior is corrected.

## Smoke Checks

| ID | Check | Expected |
|---|---|---|
| SM-001 | Open Preview URL unauthenticated | Protected access blocks the page |
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
| SEC-004 | Preview env review | No Production Supabase URL or Production secrets |
| SEC-005 | Secret scan | `npm run secret:scan` passes |

## UAT Checks

Only run after hosted migration and synthetic seed are explicitly approved and complete.

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

Hosted checks must not be marked `PASS` unless they were run against the hosted non-production environment.

## Rollback

If deploy or migration must be rolled back:

```powershell
vercel remove <deployment-id> --yes --scope <approved-scope>
```

For Supabase, do not delete the project or mutate hosted data without owner approval. Record whether rollback is a deployment removal, synthetic data reset, migration reversal, or project recreation.
