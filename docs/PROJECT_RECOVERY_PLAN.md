# Sharik Project Recovery Plan

**Mode**: Project Control Mode
**Date**: 2026-07-01
**Repository**: `samawah-media/Sharik`
**Control branch**: `codex/project-recovery-plan`
**Control worktree**: `D:\code - projects\sharik-worktrees\project-control-recovery-plan`
**Scope**: Documentation, status recovery, scope protection, and roadmap reset only.

This document freezes new feature development until the owner makes the next go/no-go decision. It does not start an online trial, add product code, add dependencies, touch production, use real client data, or authorize work from any `shrek` or `sherk` path.

## 1. Current Truth

### Main Branch

Latest checked `origin/main` commit:

```text
1bc9e74af87959a053937e373d1d34ffcc6e2b65
Merge pull request #29 from samawah-media/codex/f-005-ux-rescue-product-shell
Merged on 2026-07-01 16:04:03 +03:00
```

`main` includes R-005, PR #28, and F-005. F-005 is now the official UI baseline for Sharik.

### Latest Merged PRs

| PR | Title | Merged | Merge commit |
|---:|---|---|---|
| #29 | `fix(F-005): rescue product shell and kanban UX` | 2026-07-01 13:04:03Z | `1bc9e74af87959a053937e373d1d34ffcc6e2b65` |
| #28 | `feat(auth): add password visibility toggle` | 2026-07-01 08:24:35Z | `d17c5c732a1bce7cf38f625a35369ca4409b3f97` |
| #27 | `chore(R-005): prepare internal online trial` | 2026-07-01 07:58:08Z | `4c82cadd26ff30bebca65f45f405f542d35ba817` |
| #26 | `[codex] F-004 internal kanban workflow MVP` | 2026-07-01 06:33:02Z | `06444e76f7c6d0b2682364843c511310113cf7b1` |
| #25 | `[codex] R-004 expose management UAT routes` | 2026-07-01 03:34:53Z | `0872780d00799ec42e95d3ea889c686cce8b7bad` |
| #24 | `[codex] R-004 authenticated synthetic UAT` | 2026-06-30 16:13:11Z | `9d7d69e293000e479790958da4ed82641354f1a6` |
| #23 | `[codex] R-004 hosted UAT results` | 2026-06-30 13:18:37Z | `4559d14495f76af8596aad79c2afd53617855935` |

### Open PRs

| PR | Title | State | Checks | Decision |
|---:|---|---|---|---|
| #30 | `chore(project): add recovery plan and reset roadmap` | Open draft; mergeability recheck pending after PR #29 merge | `F-001 Quality` success on `efe35e7f73f83b3588e5978a90a4378613046324`; CodeRabbit skipped because draft PR | Control documentation PR only. |
| #31 | `chore(project): record F-005 gate decision` | Open draft, base `codex/project-recovery-plan`, merge state `CLEAN` | `F-001 Quality` success on `f393a010eddad4a8f6804a0cbfbdc0ecd427e5b4`; CodeRabbit skipped because draft PR | Records Gate 0 decision and post-merge baseline status. |

### Gate 0 F-005 Decision

Initial decision recorded on 2026-07-01 15:43 +03:00:

- Decision: `MERGE SAFE`.
- PR #29 pre-merge live state: open, not draft, `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`.
- PR #29 head: `0eb02a5d5f2f0f9c8606a1ded57ded93d53d51fd`.
- PR #29 base/main at review: `d17c5c732a1bce7cf38f625a35369ca4409b3f97`.
- CI: `quality` passed in workflow `F-001 Quality`, run `28515648127`.
- CodeRabbit: status context passed. The review is `COMMENTED`, with actionable/nitpick feedback but no `REQUEST_CHANGES` review and no blocker identified. The latest evidence-only commit also received a CodeRabbit rate-limit warning comment, but the GitHub status context remains successful.
- Scope: changed files remain limited to F-005 product shell, local UI primitives, current management pages, current Kanban UX, specs, evidence, and tests. No dependency, lockfile, production, real-data, files/comments/approvals, or drag/drop change was found.
- Owner authorization: received in the follow-up owner-authorized merge gate.
- Merge result: PR #29 was merged on 2026-07-01 16:04:03 +03:00.
- Baseline status: F-005 is now the official UI baseline on `main` at `1bc9e74af87959a053937e373d1d34ffcc6e2b65`.

### Latest CI Status

- Latest visible GitHub Actions run overall: PR #31, workflow `F-001 Quality`, success, run `28518496075`, updated 2026-07-01 12:49:50Z.
- Latest F-005 GitHub Actions run: PR #29, workflow `F-001 Quality`, success, run `28515648127`, updated 2026-07-01 12:00:05Z.
- Latest visible `main` branch Actions run: workflow `F-001 Quality`, success, run `28246249942`, on commit `27e035cda3d97aae1bda9829428053491b95305c`, created 2026-06-26.
- No fresh `main`-branch Actions run was visible for the current `origin/main` commit `1bc9e74`.

Interpretation: F-005 is the official UI baseline because PR #29 is merged. `main` should not be called trial-certified until R-006 runs and records the fresh full baseline quality gate.

### Current Worktrees

Official active work must use the Sharik worktree parent:

```text
D:\code - projects\sharik-worktrees\
```

This PR uses:

```text
D:\code - projects\sharik-worktrees\project-control-recovery-plan
```

Current Sharik worktrees under the official parent:

| Worktree | Branch |
|---|---|
| `D:\code - projects\sharik-worktrees\f002-deliverables-core` | `fix/f002-rls-db-gate-and-governance` |
| `D:\code - projects\sharik-worktrees\f002-post-evidence-progress` | `codex/f002-post-evidence-progress` |
| `D:\code - projects\sharik-worktrees\f002-rls-gate-follow-up` | `codex/f002-rls-gate-follow-up` |
| `D:\code - projects\sharik-worktrees\f002a-contract-context` | `codex/f002a-contract-context` |
| `D:\code - projects\sharik-worktrees\f002b-package-commitments` | `codex/f002b-package-commitments` |
| `D:\code - projects\sharik-worktrees\f002c-deliverable-reservation` | `codex/f002c-deliverable-reservation` |
| `D:\code - projects\sharik-worktrees\f003-sla-mvp-implementation` | `codex/f003-sla-mvp-implementation` |
| `D:\code - projects\sharik-worktrees\internal-online-mvp-uat` | `codex/r004-uat-gate-follow-up` |
| `D:\code - projects\sharik-worktrees\r004-hosted-uat` | `codex/r004-hosted-uat-results` |
| `D:\code - projects\sharik-worktrees\r004-typecheck-build-fix` | `codex/r004-typecheck-build-fix` |
| `D:\code - projects\sharik-worktrees\r004g-authenticated-uat` | `codex/r004-authenticated-synthetic-uat` |
| `D:\code - projects\sharik-worktrees\project-control-recovery-plan` | `codex/project-recovery-plan` |

Legacy or forbidden active-work paths detected:

| Worktree | Branch / state | Control decision |
|---|---|---|
| `D:\code - projects\shrek.platform` | `codex/f-005-ux-rescue-product-shell` | Do not use for new work. F-005 PR state must be handled through GitHub or a safe Sharik worktree. |
| `D:\code - projects\shrek.platform-f002-progress` | `codex/f002-progress-after-evidence` | Historical only. |
| `D:\code - projects\shrek.platform-f002d` | `codex/f002d-reservation-release-summaries` | Historical only. |
| `D:\code - projects\shrek.platform-f002e` | `codex/f002e-verification-evidence` | Historical only. |
| `D:\code - projects\shrek.platform-f003-sla-spec-prep` | `codex/f003-sla-spec-prep` | Historical only. |
| `D:\code - projects\shrek.platform-pr16-review` | detached | Historical only. |

## 2. What Works Now

The current `main` baseline has these accepted surfaces and controls:

- Auth, sign-in, invite acceptance, role-aware routing, and denial states.
- Tenant/client onboarding, internal member invitations, client member invitations, membership lifecycle, and scoped roles.
- Client management with server-side authorization and audit logging.
- Contracts, packages, package commitments, reservation/release summaries, and deliverable core records.
- Deliverable status/progress rules and SLA MVP policy/display coverage.
- Internal Kanban board route under `/clients/[clientId]/deliverables/board` using select/action status controls, not drag/drop.
- Audited allowed and denied deliverable status transitions.
- RLS simulator and pgTAP coverage for tenant/client isolation and key workflow boundaries.
- Hosted R-004 synthetic UAT was closed, temporary `@r004.example.test` password hashes were cleared, and no production acceptance was granted.
- R-005 readiness artifacts are on `main`: Spec Kit package, guarded synthetic seed, user guide, secret-scan SQL coverage, and staged-only constraints.
- F-005 product shell and Kanban visual rescue are on `main` and are the official UI baseline.

## 3. What Does Not Work Yet

The following are not complete or not authorized:

- No actual R-006 online trial has started.
- No production acceptance exists.
- No real client data may be used.
- No files MVP exists.
- No comments MVP exists.
- No internal approval MVP exists.
- No client approval MVP exists.
- No drag/drop exists or is authorized.
- No Uppy/Supabase Storage implementation exists for V1 files yet.
- No Tiptap implementation exists for comments yet.
- No full approval-coupled SLA pause/resume workflow exists.
- No production backup, monitoring, support, or incident process is ready for real clients.
- Current `main` has no fresh visible Actions run after PR #29; stability is based on the green PR #29 checks until R-006 records a fresh full baseline quality gate.

## 4. Remaining UI/UX Issues

- F-005 solved major internal shell and Kanban readability problems and is now part of `main`.
- F-005 visual QA used empty-state fixture views for clients/contracts/packages, so populated states still need review before team trial.
- F-005 records a minor mobile spacing note in the product shell.
- Client workspace UX is still minimal compared with the intended client portal: pending approvals, final files, comments, and simple client status are not ready.
- Current board interaction remains select/action based. This is intentional until drag/drop is explicitly authorized with ADR and dependency approval.
- Arabic RTL/browser rendering was verified in F-005 evidence, but must be rechecked after merge and deployment.
- Some historical evidence files contain stale wording, for example older F-004 evidence saying PR #26 is open even though GitHub and project progress show it merged.

## 5. Security, RLS, And Owner Gate Risks

- Tenant/client isolation is the top priority and remains non-negotiable.
- All queries, server actions, RPC calls, file access, comments, approval links, and audit reads must stay tenant/client scoped.
- RLS coverage exists, but every new feature must add or update negative tests for cross-client and client-role denial.
- R-005 seed data is synthetic only and uses `@r005.example.test`; no password values are committed.
- Public signup must remain disabled for any hosted staging trial.
- Temporary credentials must be generated and delivered outside GitHub, logs, PR text, screenshots, or docs.
- Vercel Production target was previously accepted as hosting-only, not production acceptance.
- A fresh owner gate is required before any hosted R-006 work touches a non-production Supabase target.
- Work from `shrek` or `sherk` paths is forbidden for new Sharik activity.

## 6. What Is Missing Before Team Online Trial

Before any internal online trial starts:

1. Start R-006 from the post-F-005 `origin/main` baseline in `D:\code - projects\sharik-worktrees\`.
2. Run and record a fresh full quality gate on the baseline: lint, typecheck, unit, integration, RLS, component, E2E, secret scan, and build.
3. Confirm the exact non-production Supabase target and Vercel deployment boundary.
4. Verify target has no real users, real clients, or non-approved fixture data.
5. Confirm public signup is disabled and no browser-visible service role key exists.
6. Apply only approved synthetic R-006 seed data after owner approval.
7. Generate temporary synthetic credentials and deliver them outside GitHub.
8. Recheck F-005 shell, Kanban, mobile, RTL, auth, denied routes, audit logs, and SLA display online.
9. Record rollback steps and cleanup process before sharing the URL with the team.

Until all items pass, the project is not online-trial ready.

## 7. Merge Rules From This Point

- No feature branch starts without `spec.md`, `plan.md`, and `tasks.md`.
- No dependency is added without ADR and owner approval.
- No PR merges without green GitHub checks or an explicitly documented owner waiver.
- No PR merges while CodeRabbit has blocker/requested-changes feedback.
- No direct push to `main`.
- One phase per PR. Do not combine readiness, UX, files, comments, and approvals in one branch.
- Every PR must state what is out of scope.
- Every data-sensitive PR must include tenant/client isolation tests.
- Every approval, rejection, change request, status transition, and SLA pause/resume path must write audit evidence.
- Documentation-only control PRs may run a reduced local check set, but CI must still be allowed to run.
- Work must be created under the Sharik official path, not under `shrek` or `sherk`.

## 8. Forbidden Until Explicitly Approved

- New product features during Project Control Mode.
- Online trial execution.
- Production Supabase.
- Real client data.
- Files, comments, approvals, drag/drop, AI, social scheduling, billing, or mobile apps.
- New dependencies.
- Use of BrightBean, Postiz, or Planka as base code.
- Work from `shrek` or `sherk` paths.
- Temporary passwords, hashes, tokens, database passwords, service role keys, or access tokens in GitHub/docs/logs/screenshots.
- Client access to internal comments, internal review data, or other clients' data.

## 9. Roadmap Reset

This reset preserves the earlier roadmap decisions:

- Trust and isolation first.
- Deliverables remain the operating core.
- Approval and SLA clarity remain V1 foundations.
- Client, team, and management workspaces must stay usable and role-specific.
- Social scheduling, AI, advanced billing, mobile apps, marketplace, and direct external platform publishing remain later.
- Spec Kit, Shape Up cycles, ADRs, RLS, audit logs, and owner gates remain mandatory.

### Gate 0 - Resolve F-005

**Goal**: Decide whether PR #29 becomes the UI baseline.
**Allowed**: Review, merge, or close/rework PR #29.
**Not allowed**: Any new feature.
**Exit**: Complete. `main` contains F-005 at `1bc9e74af87959a053937e373d1d34ffcc6e2b65`.
**Current decision**: PR #29 was owner-authorized and merged. F-005 is the official UI baseline. R-006 may be prepared next as readiness-only work, but no online trial or feature work has started.

### R-006 - Internal Online Trial Readiness

**Goal**: Prepare a safe go/no-go package for the team online trial after the F-005 decision.
**Allowed**: Readiness docs, environment checklist, synthetic-data plan, verification evidence, and owner gate.
**Not allowed**: Starting the online trial, adding product features, using real data, production usage, or new dependencies.
**Exit**: Owner-approved go/no-go decision for an internal online trial.

### F-006 - Client Workspace UX

**Goal**: Make the current client workspace understandable before adding new workflow capabilities.
**Allowed after spec approval**: Client dashboard/status UX, pending/remaining/done surfaces from existing data, safer empty/populated states, RTL/mobile review.
**Not allowed**: Files, comments, approvals, or real client data.
**Exit**: Client viewer can understand current status without seeing internal data.

### F-007 - Files And Comments MVP

**Goal**: Add the first safe collaboration layer after client workspace clarity.
**Allowed after spec/ADR checks**: File metadata/storage permissions, basic versioning, internal/client comment separation, audit events, tests for visibility denial.
**Not allowed**: Public file URLs, internal comments visible to clients, rich editor shortcuts without decision, or final delivery workflow creep.
**Exit**: Internal files/comments and client-visible files/comments are separated by permissions and tests.

### F-008 - Internal Approval MVP

**Goal**: Add the internal review and approval gate before anything reaches the client.
**Allowed after spec approval**: Submit for review, request internal changes, approve internally, approval audit logs, reviewer authority checks.
**Not allowed**: Client approval, external sharing, or bypassing maker/checker controls.
**Exit**: A deliverable cannot be sent to the client before internal approval.

### F-009 - Client Approval MVP

**Goal**: Add the client decision loop after internal approval exists.
**Allowed after spec approval**: Client approval view, approve/change request, version-specific decision log, SLA pause/resume integration, client-scoped comments.
**Not allowed**: Exposing internal comments, direct social publishing, final delivery automation beyond MVP.
**Exit**: Client can approve or request changes on the approved version only, with audit and SLA evidence.

## 10. Proposed Decision

Do not start any online trial or new feature. The only next safe phase is R-006 Internal Online Trial Readiness from the post-F-005 `origin/main` baseline.

Recommended next action:

1. Create R-006 from fresh post-F-005 `origin/main` under `D:\code - projects\sharik-worktrees\`.
2. R-006 produces a readiness decision only.
3. If R-006 passes, decide whether to run the internal online trial.
4. Only after the trial readiness decision should F-006 start.

This keeps scope protected and prevents files/comments/approvals/drag-drop from entering before the platform has a stable, reviewed shell and a safe trial gate.
