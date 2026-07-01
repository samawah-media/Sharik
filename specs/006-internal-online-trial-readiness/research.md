# Research: R-005 Internal Online Trial Readiness

Date: 2026-07-01

## Decision: Use A Separate Hosted Staging Name

**Decision**: The only named R-005 hosted trial target is `sharik-internal-trial-staging`.

**Rationale**: A distinct name prevents confusion with R-004's hosting-only production target and prevents accidental Production Supabase usage.

**Alternatives considered**:

- Reuse `sharik-platform`: rejected because it was used as a Vercel Production hosting-only target in R-004 and could confuse testers.
- Use an unnamed "UAT" target: rejected because the user explicitly requested a clear hosted staging name.

## Decision: Create R-005 Synthetic Seed With No Password Values

**Decision**: Add `supabase/seeds/r005_internal_online_trial_readiness.sql` with synthetic users, no password hashes, and guards that refuse targets containing non-R-005 auth/client data.

**Rationale**: The trial needs login personas and data, but Git must not contain temporary passwords or real client data.

**Alternatives considered**:

- Reuse R-004 seed: rejected because R-005 has its own tenant name, email domain, and post-Kanban checklist.
- Commit temporary hashes: rejected by user constraints and the no-secrets policy.

## Decision: Deliver Credentials Outside GitHub

**Decision**: Docs require credentials to be generated and delivered to the project owner through an existing private channel or password manager, never GitHub, logs, screenshots, or committed files.

**Rationale**: Login testing needs temporary secrets, but the repository and PR must remain secret-free.

**Alternatives considered**:

- Put temporary passwords in PR description: rejected.
- Store temporary passwords in `.env.example`: rejected.
- Print temporary passwords from scripts: rejected.

## Decision: No Schema Migration Or Product Surface

**Decision**: R-005 adds no migration, route, UI feature, dependency, drag/drop, files, comments, approval workflow, AI, social scheduling, or billing.

**Rationale**: The user requested readiness for the current product state only.

**Alternatives considered**:

- Add drag/drop to Kanban: rejected because drag/drop is explicitly forbidden.
- Add trial-only admin tooling: rejected as product surface expansion.

## Decision: Include SQL In Secret Scan

**Decision**: Extend the local secret scan file extension allowlist to include `.sql`.

**Rationale**: R-005's seed is a security-sensitive SQL artifact; `npm run secret:scan` should include it.

**Alternatives considered**:

- Add a separate seed secret scanner: rejected because the existing scanner is sufficient with a small extension addition.

## Supabase Changelog Note

Supabase has announced that new public-schema tables may need explicit grants for Data API exposure in new projects. R-005 creates no new tables or policies, so no grants are added. If future R-005 follow-up work creates schema objects, grants and RLS must be reviewed separately.
