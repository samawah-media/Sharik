# R-011 Production-Candidate Residual Risk Treatment And Hosted Acceptance Readiness

## Status

Spec 015 hosted amendment update on 2026-07-12: OWNER AUTHORIZED / PREFLIGHT IN PROGRESS for a controlled Team-Only Hadna Preview/UAT run. This update extends Spec 015 only and does not reopen R-011 as the active execution package. Production acceptance remains blocked.

R-011A Stage 2A local consolidation started on 2026-07-10 on branch `codex/r011a-mvp-baseline-consolidation`.

This historical Stage 2C record covers local MVP baseline consolidation, Arabic RTL UX, SaaS guardrail review, synthetic negative coverage, and honest local verification. It is `Verified with blockers / superseded for execution by Spec 015`; it does not close hosted T032 or grant any hosted/Production acceptance.

Stage 2A local verification: lint, typecheck, unit, integration, component, RLS simulator, secret scan, diff check, build, and E2E passed; local Postgres RLS verification is blocked by unavailable local database connectivity, and six configured E2E cases remain skipped. No hosted state was accessed.

R-011 planning package created on 2026-07-09.

This release document records planning/readiness scope only. It does not authorize hosted checks, hosted mutation, deploy/promotion, account or role changes, hosted file operations, non-Hadna data use, dependency changes, product code implementation, or Production acceptance.

R-011A owner approval was later recorded on 2026-07-09 with strict Hadna-only mutation limits for the three unresolved categories. Stage 1 preflight completed and Stage 2 initially stopped before hosted mutation because safe scoped hosted paths were unavailable.

A later R-011A local implementation pass added safe, scoped, auditable app/server setup paths for the three unresolved categories. Hosted mutation still did not run.

A hosted-execution readiness pass later added no-op hosted dry-run wiring, hosted apply denial gates, value-free evidence summary building, runbook evidence, and stop-condition docs. Hosted dry-run against real hosted access and hosted apply did not run.

The approved R-011A hosted dry-run/no-op readiness wrapper was later executed locally through the focused in-memory harness on 2026-07-09. It passed with category/count-only evidence. Real hosted access, hosted DB reads/writes, hosted route checks, hosted file operations, deploy/promotion, account creation, approval/status/delivery mutation, non-Hadna data use, `apply_hosted`, and Production acceptance remained untouched.

R-011A Stage 2C later created a local internal team MVP trial and hardening package under `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/`. The initial local trial verification passed, but a corrective completion audit found the Stage 2C defect register and handoff prompts were incomplete. The correction added a traceable defect register and required internal/expert review prompts.

Stage 2C corrective status: LOCAL TRIAL EVIDENCE RECORDED / DEFECT REGISTER CORRECTED / HOSTED AND PRODUCTION STILL BLOCKED.

Corrective defect reconciliation:

- P0 open: 0.
- P1 open: 0.
- P2 fixed/retested: Kanban hydration warning on the RTL management board.
- P2 blocked/dispositioned: local RLS DB verification remains blocked by local database connectivity; hosted executor/UAT deployment limitation remains outside Stage 2C authority and tied to open R-011A T032.
- P3 deferred with rationale: 6 configured E2E skips are mobile-only duplicate assertions skipped in non-mobile projects and covered by the mobile project; they are not counted as pass.

Stage 2C documentation reconciliation:

- UX documentation beyond Stage 2C evidence was not changed because the Kanban disclosure user behavior did not change; only a hydration-warning suppression was added to preserve existing behavior.
- Security/RLS documentation beyond Stage 2C evidence was not changed because no RLS policy, security rule, or database behavior changed; local RLS DB remains blocked.
- Audit/SLA/approval/files documentation beyond Stage 2C evidence was not changed because no audit, SLA, approval, or file behavior changed in this corrective pass.
- Stage 2C tasks and evidence now explicitly distinguish passed, skipped, blocked, hosted boundary, Production boundary, and remaining R-011A T032 status.

## Scope

R-011 treats the residual risks carried from R-010 Path B:

- Client approver auth, portal, approval controls, shell/navigation, and isolation remain unproven in hosted evidence.
- Waiting approval remains empty-state and lacks safe non-empty hosted evidence.
- Final delivery/file-list category remains unproven in hosted evidence.

R-011 defines:

- What blocks production-candidate readiness.
- What can be owner-accepted only as non-Production residual risk.
- What must be proven before any future Production acceptance package.
- Owner gates for client approver, waiting approval, final delivery/file-list, tenant/client isolation, approval workflow, SLA reporting, audit completeness, and rollback/no-op readiness.
- Future routes R-011A, R-011B, and R-011C.

## Production-Candidate Readiness Result

R-011 does not grant production-candidate readiness by itself. It prepares the owner decision.

Production-candidate review is blocked unless the owner either:

- Selects R-011A and later proves the unresolved categories through an owner-approved bounded package.
- Selects R-011B and explicitly accepts the unresolved categories as non-Production residual risk.
- Selects R-011C and stops until missing UAT data/categories are supplied.

## Production Acceptance Boundary

Production acceptance remains blocked. R-011 cannot claim:

- Full hosted completion.
- Client approver hosted acceptance.
- Waiting-approval hosted acceptance.
- Final-delivery hosted acceptance.
- Hosted file-list readiness.
- Production readiness.
- Production acceptance.

## R-011A Preflight Result

R-011A preflight status: PARTIALLY COMPLETED / BLOCKED BEFORE STAGE 2.

Completed:

- Owner approval recorded with strict category limits.
- Mutation plan, rollback/no-op plan, test data boundary, and execution log created.
- Existing code/server/schema paths inspected for safe scoped execution.

Not executed:

- No client approver account/category mutation.
- No waiting approval item/category mutation.
- No final delivery/file-list mutation.
- No hosted route check or hosted DB read query by this agent.
- No hosted file operation.

Unresolved categories:

- Client approver hosted auth, portal, approval controls, and isolation.
- Waiting approval safe non-empty item/category.
- Final delivery/file-list category.

## R-011A Safe Local Setup Paths

R-011A local implementation status: LOCAL SAFE PATHS IMPLEMENTED / HOSTED STAGE 2 NOT RUN.

Implemented:

- Domain/service validation at `src/modules/release/r011a-gap-setup-plan.ts`.
- Local setup repository contract at `src/modules/release/r011a-gap-setup-repository.ts`.
- Management-only server command at `src/server/commands/release/r011a-gap-setup.ts`.
- Dry-run preview, local apply, idempotent no-op, denial audit, and rollback-summary modes.
- Unit, integration, and authorization tests for approved paths and negative cases.

Preserved boundaries:

- No hosted mutation.
- No hosted DB read query.
- No hosted route check.
- No real hosted account creation.
- No hosted file operation.
- No deploy or promotion.
- No non-Hadna data.
- No Production acceptance.

Later hosted Stage 2 is not automatically ready or accepted. It still requires owner-approved execution timing, safe hosted persistence/execution wiring, value-free evidence collection, and stop-condition review.

## R-011A Hosted Execution Readiness

R-011A hosted readiness status: HOSTED DRY-RUN WIRING PREPARED / HOSTED APPLY BLOCKED / HOSTED STAGE 2 NOT RUN.

Implemented:

- Hosted-readiness wrapper at `src/server/commands/release/r011a-hosted-gap-setup-readiness.ts`.
- Explicit hosted execution modes: `hosted_dry_run` and `apply_hosted`.
- `hosted_dry_run` approval gate using `r011a_hosted_dry_run_noop_rehearsal`.
- `apply_hosted` denial gate requiring future `r011a_apply_hosted_bounded_mutation` approval and a reviewed hosted executor.
- Value-free evidence summary builder with category/status labels and counts only.
- Hosted execution runbook, hosted dry-run plan, hosted stop conditions, and hosted evidence policy.
- Integration tests for hosted dry-run approval, hosted apply denial, Hadna/count/file denials, value-free summary, and rollback no-op before apply.

Current hosted execution result:

- Hosted dry-run/no-op readiness wrapper: passed locally through the focused in-memory harness.
- Real hosted access during dry-run: not used; no hosted DB read/query or hosted route check occurred.
- Category readiness summary: client approver category, waiting approval category, and final delivery/file-list category were ready for no-op rehearsal only with `would_create` status labels.
- Hosted evidence status: client approver, waiting approval, and final delivery/file-list remain unresolved as hosted evidence.
- Hosted apply: not executed; blocked pending explicit owner apply approval and reviewed hosted executor.
- T032 hosted completion checks: still open.
- Hosted mutation count: 0.
- Hosted file operation count: 0.
- Production acceptance count: 0.

## Owner Decisions Required

The next owner decision must choose one:

- **R-011A**: Start a later limited hosted completion package with explicit mutation approval.
- **R-011B**: Continue production-candidate planning with explicit accepted residual risk.
- **R-011C**: Stop and request missing UAT data/categories.

If R-011A is selected, owner approval must name environment, Hadna-only scope, exact mutation categories, maximum item counts, operator, approval window, rollback/no-op owner, rollback plan, evidence rules, and stop conditions.

## Evidence Rules

R-011 evidence may record only status, categories, counts, safe state labels, command names, non-sensitive risk summaries, and no-op/rollback status.

R-011 evidence must not record credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, secrets, hosted target values, direct identifiers, file contents, or row-level customer content.

## Verification

Local verification passed for this planning package:

- `git diff --check`: passed with existing Windows line-ending warnings from the broader dirty worktree and no whitespace errors.
- `npm run secret:scan`: passed with no high-confidence secrets found.
- Scoped redaction scan over 16 new R-011 docs/release files: 0 link matches, 0 email matches, 0 image-reference matches, and 123 prohibited-vocabulary matches reviewed as redaction vocabulary or prohibited-category labels.

Lint/typecheck were not run because this package changes documentation only.

R-011A preflight verification also passed:

- `npm run secret:scan`: passed with no high-confidence secrets found.
- `git diff --check`: passed with existing broader dirty-worktree line-ending warnings only and no whitespace errors.
- Scoped R-011A evidence/release redaction scan: 0 URL, 0 email, 0 image-reference, and 95 keyword matches in R-011A evidence/release/task/R-010 traceability files; keyword matches reviewed as redaction vocabulary or prohibited-category labels.
- New R-011A project progress section scan: 0 URL, 0 email, 0 image-reference, and 6 keyword matches reviewed as redaction vocabulary or prohibited-category labels.
- Lint/typecheck and targeted tests were not run because R-011A changed documentation/evidence only.

R-011A safe local setup path verification started:

- Targeted unit tests for setup planning and authorization passed.
- Targeted integration tests for setup command behavior and audit requirements passed.
- Targeted hosted-readiness integration tests passed.
- Focused hosted dry-run/no-op wrapper execution passed: one `hosted_dry_run` rehearsal case ran locally and `apply_hosted` was not invoked.
- `npm run typecheck` passed.
- Full local verification passed: lint, typecheck, unit, integration, secret scan, whitespace check, scoped redaction scan, and production build.
- Full unit suite passed: 45 files / 159 tests.
- Full integration suite passed: 28 files / 112 tests.
- Scoped R-011A redaction scan passed/reviewed: 12 scoped docs/sections, 0 URL, 0 email, 0 image-reference matches, and 126 redaction-vocabulary matches reviewed as category/prohibition wording.
- RLS tests were not run because this pass does not change database migrations, RLS policies, or hosted DB paths.

Current dry-run handoff verification passed:

- Focused hosted dry-run/no-op wrapper test passed; `apply_hosted` was not invoked.
- `npm run secret:scan` passed with no high-confidence secrets found.
- `git diff --check` passed with existing broader dirty-worktree CRLF warnings only and no whitespace errors.
- Scoped redaction scan over touched R-011A dry-run docs and the new project-progress section found 0 URL, 0 email, and 0 image-reference matches.
- Redaction-vocabulary keyword matches were reviewed as safe policy/category wording.
- Lint/typecheck were not run because no product code changed in this dry-run docs/evidence update.

Stage 2C corrective completion audit verification passed:

- Targeted unit check passed: `tests/unit/release/r011a-stage-2c-trial.test.ts`, 1 file / 4 tests.
- Targeted component check passed: `tests/component/deliverables/deliverable-board.test.tsx`, 1 file / 4 tests.
- `npm run secret:scan` passed with no high-confidence secrets found.
- `git diff --check` passed with LF-to-CRLF warnings only and no whitespace errors.
- Spec Kit prerequisite/consistency analysis resolved the Stage 2C feature directory and found 12/12 functional requirements mapped to tasks. One medium residual remains: local RLS DB verification is blocked and must not be counted as pass.
- Scoped redaction scan passed for the Stage 2C package, this release document, and the new Stage 2C project-progress section.
- `npm run build` passed.

## Final Boundary Confirmation

- The active hosted path is now the Owner-Authorized Hosted Team UAT Amendment in `specs/015-persistent-mvp-pilot-completion/`.
- R-011 remains historical readiness and residual-risk evidence.
- A local no-op hosted dry-run wrapper rehearsal was performed by this pass.
- No real hosted access, hosted route check, hosted DB read/write, or hosted completion check was performed by this pass.
- No hosted mutation is performed by R-011/R-011A.
- No deploy or promotion is performed by R-011.
- No account or role changes are performed by R-011.
- No hosted file operation is performed by R-011.
- No non-Hadna data is used by R-011.
- R-011A introduced safe local/readiness code only; no dependency change was introduced.
- No Production acceptance is granted or implied by R-011.
