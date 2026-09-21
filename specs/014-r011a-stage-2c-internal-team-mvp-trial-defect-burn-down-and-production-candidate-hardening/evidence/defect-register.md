# Evidence: Stage 2C Defect Register

**Date**: 2026-07-10
**Boundary**: Local Hadna-only synthetic/local evidence only. No hosted mutation, hosted file content operation, deployment, promotion, access configuration change, real customer data, or Production acceptance.

## Severity Model

- P0: Security, tenant leakage, client data leakage, internal comment/file exposure, or uncontrolled hosted/Production action.
- P1: Workflow or approval bypass, stale-version approval accepted, SLA pause/resume break, audit omission, or role permission bypass.
- P2: Major usability, accessibility, mobile RTL, data integrity, verification blocker, or release-readiness issue that blocks realistic internal trial hardening or production-candidate confidence.
- P3: Cosmetic, duplicated-check, or minor test-environment issue that does not block local trial execution or security/business correctness.

## Completion Rules

- Any open P0 or P1 blocks Stage 2C completion.
- P2 defects require explicit disposition and must not be silently counted as passed.
- P3 defects may be deferred only with explicit rationale.
- Fixed defects require a regression test and evidence reference.
- Blocked or skipped verification is never counted as passed.

## Burn-down Summary

| Severity | Open | Blocked | Fixed | Retested | Deferred/Accepted |
| --- | ---: | ---: | ---: | ---: | ---: |
| P0 | 0 | 0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 | 0 | 0 |
| P2 | 0 | 2 | 1 | 1 | 0 |
| P3 | 0 | 0 | 0 | 0 | 1 |

## Defects And Verification Limitations

### STAGE2C-P2-001 - Kanban Hydration Warning

- **Severity**: P2
- **Affected role**: management/admin, project manager, account manager
- **Affected workflow**: management Kanban board status disclosure in RTL project
- **Reproduction steps**:
  1. Run `npm run test:e2e`.
  2. Observe the `rtl-arabic` Kanban board scenario before the fix.
  3. The scenario passes, but React reports a hydration mismatch on a `details` disclosure with restored `open` state.
- **Security/data impact**: No tenant, client, file, approval, or internal comment leakage observed. UX/accessibility confidence was reduced because hydration warnings can hide real client/server mismatches.
- **Owner**: Stage 2C implementation owner
- **Fix status**: Fixed and retested. Added scoped `suppressHydrationWarning` to the existing disclosure without changing user-visible behavior.
- **Owner disposition**: Burned down; no deferral requested.
- **Regression test**: `node node_modules/@playwright/test/cli.js test tests/e2e/management/kanban-board.spec.ts --project=rtl-arabic`; full `npm run test:e2e`; `npm run test:component`; `npm run build`.
- **Evidence reference**: `evidence/execution-log.md` command results; `docs/PROJECT_PROGRESS.md` Stage 2C section; `src/ui/management/deliverable-board.tsx`.

### STAGE2C-P3-002 - Six Configured E2E Skips

- **Severity**: P3
- **Affected role**: client viewer, client approver
- **Affected workflow**: mobile-only portal/navigation/approval viewport assertions
- **Reproduction steps**:
  1. Run `npm run test:e2e`.
  2. Observe 6 skipped cases.
  3. The skipped cases are mobile-only assertions guarded by `test.skip(!isMobile, "mobile assertion runs in the mobile Playwright project")`.
- **Security/data impact**: No security/data impact found. The same three mobile assertions run and pass under the `mobile-chromium` project; they are skipped only in non-mobile projects.
- **Owner**: Stage 2C QA owner
- **Fix status**: Deferred with rationale; not counted as pass.
- **Owner disposition**: Deferred as existing Playwright matrix behavior because duplicate non-mobile execution would not add coverage.
- **Regression test**: `npm run test:e2e` confirms `105 passed / 6 skipped`; mobile project passes the corresponding mobile assertions.
- **Evidence reference**: `tests/e2e/accessibility/rtl-mobile.spec.ts`; `tests/e2e/client/r007-client-portal-readiness.spec.ts`; `tests/e2e/client/r008-client-approval-delivery.spec.ts`; `evidence/execution-log.md`.

### STAGE2C-P2-003 - Local RLS DB Verification Blocked

- **Severity**: P2
- **Affected role**: all tenant/client-scoped roles
- **Affected workflow**: database-backed RLS verification
- **Reproduction steps**:
  1. Run `npm run test:rls:db`.
  2. The local DB connection fails before pgTAP execution with `LegacyDbConnectError`.
  3. No hosted DB is used as a substitute.
- **Security/data impact**: Local simulator coverage passed, but database-backed RLS proof remains blocked. This does not prove a leakage; it limits confidence until local infrastructure is available.
- **Owner**: Stage 2C QA owner / local infrastructure owner
- **Fix status**: Blocked by unavailable local database connectivity.
- **Owner disposition**: Not accepted as Production evidence. Allowed only as a recorded local trial limitation until local DB infrastructure is restored and `npm run test:rls:db` passes.
- **Regression test**: Pending local infrastructure. Required retest command: `npm run test:rls:db`.
- **Evidence reference**: `evidence/execution-log.md`; `docs/PROJECT_PROGRESS.md`; `scripts/supabase-rls-db-test.mjs`.

### STAGE2C-P2-004 - Hosted Executor/UAT Deployment Limitation

- **Severity**: P2
- **Affected role**: management/admin, assigned team, client viewer, client approver, unauthorized client
- **Affected workflow**: hosted R-011A T032 completion, hosted UAT deployment, hosted team-access configuration
- **Reproduction steps**:
  1. Review R-011A Stage 2B and Stage 2C evidence.
  2. Confirm `apply_hosted` remains blocked without a reviewed hosted executor and separate owner approval.
  3. Confirm Stage 2C did not deploy, promote, mutate hosted data, or configure hosted access.
- **Security/data impact**: No hosted data was touched, so no hosted leakage occurred. Hosted acceptance remains unproven, so Production readiness cannot be claimed.
- **Owner**: Product owner / hosted execution owner
- **Fix status**: Blocked outside Stage 2C authority.
- **Owner disposition**: Preserved as R-011A T032 open blocker requiring a separately approved hosted/UAT package.
- **Regression test**: Not applicable inside Stage 2C. Future evidence must include reviewed hosted executor, bounded Hadna-only hosted run, audit evidence, rollback/no-op result, and isolation checks.
- **Evidence reference**: `evidence/execution-log.md`; `docs/08-release/R-011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness.md`; `specs/013-r011-production-candidate-residual-risk-treatment-and-hosted-acceptance-readiness/evidence/r011a-stage-2b-execution-and-next-prompts.md`.

## UX And Accessibility Reconciliation

- Fixed UX/accessibility issue: `STAGE2C-P2-001`.
- Remaining UX/accessibility skipped cases: `STAGE2C-P3-002`, deferred because they are mobile-only duplicates skipped in non-mobile projects and covered in the mobile project.
- No open P0/P1 UX/accessibility defects are recorded.

## Production Boundary

Stage 2C does not authorize Production readiness or Production acceptance. The blocked P2 entries above must remain visible in any production-candidate review.
