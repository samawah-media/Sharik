# Implementation Plan: R-006 Internal Online Trial Execution

**Branch**: `codex/r006-internal-online-trial-execution` | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-r006-internal-online-trial-execution/spec.md`

## Summary

Start the owner-approved R-006 internal online trial execution package under strict internal-trial boundaries. The execution verifies the PR #32 `main` baseline, reads R-006 readiness artifacts, checks candidate Supabase and Vercel targets, prepares a synthetic roster, records the owner update authorizing `sharik-uat` despite existing users/data, inspects the authorized local workbook structurally, prepares a workbook-to-Sharik mapping, and stops before hosted mutation/deployment until that mapping and a minimum-scope insertion/deploy plan are reviewed.

## Technical Context

**Language/Version**: TypeScript, Next.js App Router, React, Supabase/PostgreSQL project artifacts, Vercel project metadata.

**Primary Dependencies**: Existing dependencies only. No dependency addition is allowed.

**Storage**: Existing hosted Supabase UAT target is owner-authorized for internal R-006 despite existing users/data. No hosted migration, hosted seed, hosted insertion, or account mutation was run.

**Testing**: Operational preflight plus existing local checks as needed: `npm run secret:scan`, `git diff --check`, and future smoke checks only after preview/staging target confirmation.

**Target Platform**: Supabase project `sharik-uat` / `jnvuccapgsabrwwkxnbh` for internal UAT by owner decision, and Vercel project `sharik-platform` for internal testing only. Neither implies Production acceptance.

**Project Type**: Full-stack modular monolith plus release execution documentation.

**Performance Goals**: Smoke checks should cover current accepted trial surfaces once deployment is unblocked; no runtime performance changes are introduced.

**Constraints**:

- Owner GO is only for non-production internal online trial.
- No Production Supabase.
- No Production acceptance, merge, promotion, or Ready conversion.
- No unauthorized real client data; the named workbook is allowed only as internal trial source input.
- No public signup.
- No seed/insertion on hosted target without reviewed mapping and explicit minimum-scope owner confirmation.
- Synthetic accounts only using `@r006.example.test`.
- Credentials generated only after execution-plan approval and delivered outside GitHub/docs/logs/chat/screenshots.
- No sensitive workbook row content in GitHub/docs/comments/screenshots/logs/chat.
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
| Accept `sharik-uat` for internal UAT by owner update | The owner explicitly authorized this UAT target despite existing users/data. | Require a fresh clean target; superseded by owner decision for internal trial only. |
| Treat Vercel deploy as internal-test only | The owner authorized Vercel deployment for internal testing, not Production acceptance. | Treat a deploy as release acceptance; rejected. |
| Prepare account roster only | Credentials must not be generated until target preflight passes. | Generate passwords now; rejected as credential leakage risk and target safety violation. |
| Do not deploy in this step | Mapping and hosted insertion/deploy plan must be reviewed first. | Deploy before mapping; rejected. |
| Do not create a migration for the workbook | Current client, contract, package line, deliverable, due-date, owner, status, progress, and audit tables cover the basic mapping. | Add source-specific tables; rejected as unnecessary V1 scope expansion. |

## Post-Execution Constitution Check

| Principle | Result | Evidence |
|---|---:|---|
| Scope control | PASS | Only docs/evidence/context were changed. |
| Tenant/client isolation | PASS | No customer data was added or exposed; smoke checks remain blocked. |
| Audit required | PASS | No approval/status mutation was performed; audit evidence remains a planned smoke check. |
| SLA pause/resume | PASS | No SLA behavior changed. |
| No new dependency | PASS | Package manifests unchanged. |
| Review before merge | PASS | Work remains on isolated execution branch. |
