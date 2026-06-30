# Contracts: Internal Online MVP UAT Gates

Date: 2026-06-30

These contracts define the gates for the UAT workflow. They are review contracts, not API contracts.

## Gate H0 - Documentation Ready

Required inputs:

- PR #17 merged on `main`.
- UAT branch created after PR #17.
- `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, and evidence checklist exist.
- Data risk plan exists.

Pass criteria:

- All required docs exist.
- Scope is limited to internal online UAT.
- Hosted Supabase migration is marked blocked pending explicit approval.

Failure criteria:

- Any hosted operation starts before docs.
- Product feature scope is added.

## Gate H1 - Hosted Supabase Approval

Required approval text:

```text
أوافق على تشغيل hosted non-production Supabase migration لـ Sharik Internal Online MVP UAT ضد project ref <PROJECT_REF>. Synthetic data only. No Production and no real client data.
```

Pass criteria:

- A Supabase UAT project exists.
- Approval names the target non-production project ref by replacing `<PROJECT_REF>` with the real Supabase ref.
- Approval confirms synthetic data only.
- Rollback and evidence path are prepared.

Failure criteria:

- Approval is ambiguous.
- Approval still contains the literal `<PROJECT_REF>` placeholder.
- Supabase target is Production.
- Real client data is requested.

## Gate H2 - Vercel Hobby/Production Hosting Deployment

Required inputs:

- Owner decision confirms Vercel Hobby/free is acceptable.
- Correct owner-approved Vercel account is confirmed with `vercel whoami`.
- Deployment target is recorded.
- Vercel Production target is allowed only as a hosting target, not as Production acceptance.
- Protection or public exposure status is recorded.
- Env vars do not point to Production Supabase or real client data.
- Rollback command and deployment id are ready.

Pass criteria:

- Deployment URL, target, account, and rollback path are recorded.
- If target is Production, evidence labels it hosting-only.
- No secret is exposed in browser response.
- Supabase-dependent checks remain blocked if Supabase UAT is deferred.

Failure criteria:

- Wrong Vercel account.
- Production target reported as Production acceptance.
- Missing protection/public exposure status.
- Env vars point to Production Supabase or real client data.

## Gate H3 - Smoke, Security, And UAT Evidence

Required checks:

- Protected access smoke.
- Sign-in surface smoke.
- Hosted fixture-disablement smoke.
- Secret exposure check.
- Client A/B isolation check.
- Role boundary check.
- Existing MVP surface check.
- SLA MVP summary/status check.

Pass criteria:

- All run checks pass.
- Any blocked checks are clearly recorded.
- `docs/PROJECT_PROGRESS.md` is updated.

Failure criteria:

- A blocked hosted check is reported as pass.
- Local evidence is reported as hosted evidence.
- Any real data or secret appears in evidence.
