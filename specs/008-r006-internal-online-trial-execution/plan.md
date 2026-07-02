# Implementation Plan: R-006 Internal Online Trial Execution

**Branch**: `codex/r006-internal-online-trial-execution` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-r006-internal-online-trial-execution/spec.md`

## Summary

Start the owner-approved R-006 internal online trial execution package under strict non-production boundaries. The execution verifies the PR #32 `main` baseline, reads R-006 readiness artifacts, checks candidate Supabase and Vercel targets, prepares a synthetic roster, and stops before any mutation/deployment because the current targets are not fully confirmed as safe for R-006 execution.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React, Supabase/PostgreSQL project artifacts, Vercel project metadata.

**Primary Dependencies**: Existing dependencies only. No dependency addition is allowed.

**Storage**: Existing hosted Supabase candidate only for read-only preflight. No hosted migration, hosted seed, or account mutation was run.

**Testing**: Operational preflight plus existing local checks as needed: `npm run secret:scan`, `git diff --check`, and future smoke checks only after preview/staging target confirmation.

**Target Platform**: Candidate Supabase project `sharik-uat` and candidate Vercel project `sharik-platform`, both requiring additional confirmation before execution.

**Project Type**: Full-stack modular monolith plus release execution documentation.

**Performance Goals**: Smoke checks should cover current accepted trial surfaces once deployment is unblocked; no runtime performance changes are introduced.

**Constraints**:

- Owner GO is only for non-production internal online trial.
- No Production Supabase.
- No Vercel production deployment or production alias.
- No real client data.
- No public signup.
- No seed/migration on hosted target without explicit preflight and owner confirmation.
- Synthetic accounts only using `@r006.example.test`.
- Credentials generated only after target preflight passes and delivered outside GitHub/docs/logs.
- No product feature expansion, dependency addition, schema migration, or seed file.

## Constitution Check

### Pre-Execution Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | This package creates `specs/008-r006-internal-online-trial-execution/` before any product change. |
| Tenant/client isolation | PASS | Preflight and smoke plan include tenant/client isolation; no data path is changed. |
| Deny by default | PASS | Missing target confirmation blocks execution. |
| Server-side sensitive commands | PASS | No sensitive command was added; hosted mutation is blocked. |
| RLS defense in depth | PASS | No RLS changes; target data preflight did not complete. |
| No internal content to client | PASS | No client-visible feature/content added. |
| Append-only auditability | PASS | Smoke plan requires audit evidence; no audit mutation occurred. |
| SLA timeline principles | PASS | Smoke plan requires SLA display; no SLA behavior changed. |
| No secrets in repo/browser | PASS | Docs contain no secret values; no credentials generated. |
| No unreviewed dependency | PASS | Package manifests are unchanged. |
| No social scheduling in V1 | PASS | Explicitly out of scope. |

No constitution violation is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation

```text
specs/008-r006-internal-online-trial-execution/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- execution-boundary.md
`-- evidence/
    `-- verification.md

docs/08-release/
`-- R-006-internal-online-trial-execution.md
```

### Source Code

```text
No product source code changes.
No schema migrations.
No seed files.
No dependency manifests.
No credentials.
```

**Structure Decision**: R-006 execution is represented as a separate Spec Kit package and release execution doc. The current run stops at target preflight and records non-secret evidence.

## Design Decisions

| Decision | Rationale | Alternatives |
|---|---|---|
| Use `specs/008-r006-internal-online-trial-execution/` | Separates execution from the readiness-only `007` package and reflects the new owner GO decision. | Mutate the readiness package; rejected because the owner requested a separate package. |
| Treat `sharik-uat` as candidate, not approved | The project name and metadata imply UAT, but data/auth preflight is incomplete without DB password access. | Assume name is sufficient; rejected because R-006 requires explicit preflight. |
| Treat current Vercel project as blocked | Vercel currently has Production environment variables and Production deployments only. | Use production hosting as in earlier UAT; rejected because R-006 forbids production. |
| Prepare account roster only | Credentials must not be generated until target preflight passes. | Generate passwords now; rejected as credential leakage risk and target safety violation. |
| Do not deploy | Preview/staging target is not confirmed and preview env vars are not configured. | Deploy without env or use production URL; rejected. |

## Post-Execution Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | Only docs/evidence/context were changed. |
| Tenant/client isolation | PASS | No customer data was added or exposed; smoke checks remain blocked. |
| Audit required | PASS | No approval/status mutation was performed; audit evidence remains a planned smoke check. |
| SLA pause/resume | PASS | No SLA behavior changed. |
| No new dependency | PASS | Package manifests unchanged. |
| Review before merge | PASS | Work remains on isolated execution branch. |
