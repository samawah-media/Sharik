# Contracts: Internal Online MVP UAT Gates

Date: 2026-06-29

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

- Approval names the target non-production project ref by replacing `<PROJECT_REF>` with the real Supabase ref.
- Approval confirms synthetic data only.
- Rollback and evidence path are prepared.

Failure criteria:

- Approval is ambiguous.
- Approval still contains the literal `<PROJECT_REF>` placeholder.
- Target is Production.
- Real client data is requested.

## Gate H2 - Protected Preview Deployment

Required inputs:

- Correct Vercel account/scope confirmed.
- Preview target confirmed.
- Protection enabled.
- Preview env vars point only to non-production resources.
- Production env vars are not touched.

Pass criteria:

- Deployment URL is protected.
- Deployment target is Preview.
- No secret is exposed in browser response.

Failure criteria:

- Wrong account or scope.
- Production target.
- Missing protection.
- Production env mutation.

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
