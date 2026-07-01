# Research: R-006 Internal Online Trial Readiness

## Decision: Use Post-F-005 `main` As Baseline

**Rationale**: PR #29 made F-005 the official UI baseline at `1bc9e74af87959a053937e373d1d34ffcc6e2b65`. R-006 must verify this exact baseline before any online trial readiness decision.

**Alternatives considered**:

- Start from PR #29 branch: rejected because it is already merged and the owner requested post-F-005 `main`.
- Start from project-control documentation branch: rejected because R-006 must be based on product `main`, not the control branch.

## Decision: Readiness Only, No Hosted Mutation

**Rationale**: The user explicitly prohibited starting the online trial, production, real data, features, dependencies, files/comments/approvals, and drag/drop. Therefore R-006 may only produce docs, checklists, evidence, and a synthetic data plan.

**Alternatives considered**:

- Deploy a hosted preview: rejected because it would start execution beyond readiness.
- Link or inspect a hosted Supabase project: rejected because the task does not provide a target and prohibits production/real-data risk.

## Decision: Synthetic Data Plan Without Seed

**Rationale**: R-005 already introduced a guarded synthetic seed. R-006 needs a plan for a later online trial, but not an executable data mutation. A plan avoids accidental database changes and keeps this PR documentation-only.

**Alternatives considered**:

- Add `supabase/seeds/r006_internal_online_trial_readiness.sql`: rejected as trial execution creep.
- Reuse live R-004/R-005 hosted data: rejected because R-006 must not use real or uncontrolled data and should not rely on historical trial state.

## Decision: Non-Production Vercel Preview/Staging Boundary

**Rationale**: Earlier phases allowed production-hosting-only for a UAT context, but the R-006 prompt says no production. R-006 therefore requires a non-production Vercel preview/staging boundary and does not authorize `vercel --prod`.

**Alternatives considered**:

- Use existing production alias as hosting-only: rejected for this task because it says no production.
- Skip Vercel boundary docs: rejected because the user explicitly requested Supabase/Vercel boundaries.

## Decision: Full Baseline Quality Gate Is Required Evidence

**Rationale**: R-006 readiness depends on knowing whether the post-F-005 baseline passes all agreed local gates before any hosted go/no-go.

**Alternatives considered**:

- Use only PR #29 GitHub checks: rejected because the user requested a full baseline quality gate.
- Run only docs checks: rejected because R-006 explicitly validates readiness from product `main`.
