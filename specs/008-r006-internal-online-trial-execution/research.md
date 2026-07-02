# Research: R-006 Internal Online Trial Execution

## Decision: Use PR #32 `origin/main` As Execution Baseline

**Rationale**: The owner specified `main` includes PR #32 merge commit `10fc4a3b4c8f717d284d177906d1f32f5f61976c`. The execution branch was created from that exact remote baseline.

**Alternatives considered**:

- Continue from the previous F-005 branch: rejected because it predates R-006 readiness.
- Continue from the R-006 readiness branch: rejected because the owner requested a separate execution branch from current `main`.

## Decision: Block Hosted Mutation Until Supabase Preflight Completes

**Rationale**: The linked Supabase project is `sharik-uat`, ref `jnvuccapgsabrwwkxnbh`, region `eu-west-1`, status `ACTIVE_HEALTHY`. However, deeper data/auth preflight is blocked because the CLI requested `SUPABASE_DB_PASSWORD` for hosted count queries. The target cannot be treated as safe for mutation until counts and public signup are verified.

**Alternatives considered**:

- Infer non-production from the `sharik-uat` name: rejected because R-006 requires exact preflight and owner confirmation.
- Use production-labeled `.env.local`: rejected because it is explicitly not allowed for R-006.

## Decision: Block Vercel Deployment Until Preview/Staging Is Configured

**Rationale**: The linked Vercel project is `sharik-platform`, but `vercel env ls` showed only Production variables and `vercel ls` showed only Production deployments. R-006 forbids production deployment, production alias, and production acceptance.

**Alternatives considered**:

- Use existing Production deployment URLs: rejected because R-006 forbids production.
- Deploy without Preview env vars: rejected because sign-in and Supabase-backed pages require public Supabase runtime env vars.
- Add Preview env vars without completing Supabase preflight: rejected because the Supabase target is not confirmed safe.

## Decision: Prepare Synthetic Roster Without Credentials

**Rationale**: The smoke checklist requires sign-in across internal and client personas, but credentials must not be generated before target confirmation. A roster without passwords is safe and reviewable.

**Alternatives considered**:

- Generate temporary passwords now: rejected because no confirmed target exists and credentials must stay out of logs/docs.
- Reuse R-004/R-005 accounts: rejected because R-006 requires `@r006.example.test` only.

## Decision: Record Blocked Execution Evidence

**Rationale**: The owner asked to stop and report results. A blocked evidence package preserves what was verified and why no production/hosted mutation occurred.

**Alternatives considered**:

- Continue with partial deployment: rejected because it would violate non-production-only target confirmation.
- Leave no docs because execution is blocked: rejected because evidence is required.
