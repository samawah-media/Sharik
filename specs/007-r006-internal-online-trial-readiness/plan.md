# Implementation Plan: R-006 Internal Online Trial Readiness

**Branch**: `codex/r006-internal-online-trial-readiness` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-r006-internal-online-trial-readiness/spec.md`

## Summary

Prepare a readiness-only package from the post-F-005 UI baseline. R-006 records the full baseline quality gate, defines non-production Supabase and Vercel boundaries, provides a synthetic-only data plan, and creates a go/no-go checklist for a later internal online trial. It does not start the trial, deploy, mutate Supabase, add a seed, add dependencies, or change product behavior.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React, Supabase/PostgreSQL project artifacts.

**Primary Dependencies**: Existing dependencies only: Next.js, TypeScript, Supabase client, Zod, React, Lucide, Vitest, Testing Library, Playwright. No dependency addition is allowed.

**Storage**: Existing Supabase/PostgreSQL schema only. R-006 adds no migration, no seed, and no hosted data mutation.

**Testing**: Required baseline commands: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:rls`, `npm run test:component`, `npm run test:e2e`, `npm run secret:scan`, and `npm run build`.

**Target Platform**: Local verification and documentation only. Future hosted trial target must be non-production Supabase plus non-production Vercel preview/staging, approved after this readiness package.

**Project Type**: Full-stack modular monolith with release-readiness documentation.

**Performance Goals**: Current accepted trial surfaces should pass the existing E2E and build gates without adding runtime work.

**Constraints**:

- Start from post-F-005 `origin/main` commit `1bc9e74af87959a053937e373d1d34ffcc6e2b65`.
- No R-006 online trial execution.
- No production Supabase, production deployment, production acceptance, or real client data.
- No public signup, broad permissions, or browser-visible service role key.
- No temporary passwords in GitHub, docs, logs, screenshots, or PR text.
- No product feature additions: no files, comments, approvals, drag/drop, AI, social scheduling, billing, or mobile app work.
- No new dependencies and no ADR required because no technology or architecture decision changes.
- Synthetic data is a plan only and uses `@r006.example.test`; no seed is added or applied.

**Scale/Scope**: One readiness package, one full baseline quality gate, one synthetic data plan, and one release/readiness checklist.

## Constitution Check

### Pre-Design Gate

| Principle | Result | Evidence |
|---|---:|---|
| Spec before code | PASS | R-006 creates this Spec Kit package before any readiness documentation update. |
| Tenant/client isolation | PASS | Readiness checklist includes tenant/client isolation and client viewer denial; no data path is changed. |
| Deny by default | PASS | Boundaries require disabled public signup and no broad permissions. |
| Server-side sensitive commands | PASS | No sensitive command is added or modified. |
| RLS defense in depth | PASS | Full baseline gate includes RLS tests; no RLS policy changes are introduced. |
| No internal content to client | PASS | Checklist includes client viewer denial and no new client-visible content surface. |
| Append-only auditability | PASS | Checklist includes audit evidence for existing status transition behavior; no audit model change. |
| SLA timeline principles | PASS | Checklist includes SLA display and paused waiting-client visibility from current baseline. |
| No secrets in repo/browser | PASS | Secret scan is required and docs prohibit credentials/secrets in GitHub. |
| No unreviewed dependency | PASS | No dependency is added. |
| No social scheduling in V1 | PASS | Explicitly out of scope. |

No constitution violation is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Project Structure

### Documentation

```text
specs/007-r006-internal-online-trial-readiness/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- tasks.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   `-- readiness-boundary.md
`-- evidence/
    `-- verification.md

docs/08-release/
`-- R-006-internal-online-trial-readiness.md
```

### Source Code

```text
No product source code changes.
No schema migrations.
No seed files.
No dependency manifests.
```

**Structure Decision**: R-006 is readiness documentation and evidence only. It updates Spec Kit, release docs, project progress, and AGENTS plan context. It does not change application code, tests, dependencies, database schema, hosted environments, or seed data.

## Design Decisions

| Decision | Rationale | Alternatives |
|---|---|---|
| Use `specs/007-r006-internal-online-trial-readiness/` | Avoids the historical duplicate `006` directories and gives R-006 a clear post-F-005 package. | Reuse R-005 `006` package; rejected because R-006 has a new baseline and stricter no-execution scope. |
| Record full baseline gate before trial | Ensures F-005 UI baseline is verified before hosted readiness decisions. | Trust PR #29 checks only; rejected because user explicitly requested full baseline quality gate. |
| Define synthetic data as a plan only | Respects the prohibition on starting the online trial or mutating data. | Add a new seed file; rejected as execution creep. |
| Require non-production Vercel preview/staging only | The prompt forbids production. | Use Vercel Production hosting-only as in earlier UAT; rejected for R-006 because this task says no production. |
| Keep R-006 credentials outside GitHub | Prevents passwords or secrets from entering docs, logs, screenshots, or PR text. | Record temporary passwords in docs or PR comments; rejected. |

## Post-Design Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | Only readiness docs, checklists, evidence, and context pointers are changed. |
| Tenant/client isolation | PASS | Checklist requires tenant/client isolation verification; no data access path is changed. |
| Audit required | PASS | Checklist requires existing audit evidence for status transitions. |
| SLA pause/resume | PASS | Checklist covers current paused waiting-client SLA display. |
| No new dependency | PASS | Package manifests are unchanged. |
| Review before merge | PASS | Work is prepared on an isolated branch with PR review expected. |
