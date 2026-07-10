# Implementation Plan: R-011A Stage 2C - Internal Team MVP Trial, Defect Burn-down, And Production-Candidate Hardening

**Branch**: `codex/r011a-mvp-baseline-consolidation`
**Date**: 2026-07-10
**Spec**: `specs/014-r011a-stage-2c-internal-team-mvp-trial-defect-burn-down-and-production-candidate-hardening/spec.md`
**Boundary**: Local Hadna-only synthetic trial and hardening. No hosted mutation, deployment, access configuration, hosted file content operation, real customer data, new dependency, or Production acceptance.

## Technical Context

**Language/Version**: TypeScript with existing project Node toolchain
**Primary Dependencies**: Existing Next.js, React, Tailwind, shadcn/Radix, Supabase-facing guards, Vitest, Testing Library, Playwright, local RLS simulators
**Storage**: Existing local synthetic fixtures only for this pass
**Testing**: `npm run lint`, `npm run typecheck`, unit, integration, component, RLS simulator, RLS DB when local infrastructure is available, E2E, secret scan, diff check, build
**Target Platform**: Local development and local automated test environment
**Project Type**: Next.js SaaS application with role-scoped client/team/admin surfaces
**Performance Goal**: No new broad performance target; avoid adding slow global setup and keep trial checks deterministic
**Constraints**: Tenant/client isolation, deny-by-default, internal content separation, audit completeness, SLA pause/resume integrity, Arabic RTL and keyboard accessibility, value-free evidence
**Scale/Scope**: Internal team MVP trial package covering required roles and workflows using Hadna-only synthetic/local data

## Constitution Check

- Spec before implementation: PASS. Stage 2C spec, plan, and tasks precede product/test code changes.
- V1 core alignment: PASS. Work is limited to deliverables, SLA, Kanban/workflow, approvals, files, comments, audit, roles, and client portal readiness.
- Tenant/client isolation: REQUIRED. Every touched path must validate scope and deny-by-default behavior.
- Internal secrecy: REQUIRED. Internal comments and files must remain hidden from client roles.
- Approval/audit integrity: REQUIRED. Internal/client approvals, change requests, denials, status changes, SLA pause/resume, and final delivery must have audit expectations.
- SLA waiting-client rule: REQUIRED. Waiting client state pauses Samawah SLA and resumes on change request/return to team.
- Arabic RTL/accessibility: REQUIRED. Mobile RTL, keyboard, visible focus, semantic controls, dialogs/forms/buttons, stale/error/empty/denied states must be covered.
- No new dependencies: PASS unless an ADR and owner approval are added; none planned.
- No Production or hosted action: PASS. Stage 2C is local only unless separately approved.

## Workstreams

### A. Spec And Planning

- Create Stage 2C `spec.md`, `plan.md`, `tasks.md`, checklist, and evidence files.
- Reconcile open R-011A tasks and preserve T032 hosted blocker.
- Define measurable acceptance criteria, out-of-scope items, severity model, stop conditions, and Production boundary.

### B. Internal MVP Trial

- Build or extend value-free local trial evidence for management/admin, project manager, account manager, assigned team, client viewer, client approver, and unauthorized client categories.
- Validate complete deliverable lifecycle and deny unsafe transitions.
- Capture mutation/no-op counts and audit expectations for each local synthetic operation.

### C. UX And Accessibility

- Review sign-in, dashboards, clients, client detail, deliverables, Kanban, detail, SLA, internal approval, client approval, files/final delivery, waiting approval, portal, and stateful UX.
- Improve narrowly scoped issues found during trial, prioritizing P0/P1/P2.
- Validate desktop/mobile RTL, keyboard, visible focus, labels, dialogs/forms/buttons, responsive overflow, and hydration warnings.

### D. SaaS/Security Audit

- Audit every touched query, server action, command, route guard, file guard, approval path, status transition, and audit event.
- Confirm tenant/client scope, deny-by-default, internal separation, version-aware approvals, audit completeness, SLA integrity, idempotency, safe errors, and no sensitive browser/evidence exposure.

### E. Tests And Verification

- Add or update focused tests for role-negative paths, tenant isolation, approvals, SLA, files, comments, audit, mobile RTL/accessibility, and stale/denied UX.
- Run required command matrix or record blocked/skipped status honestly.
- Maintain value-free evidence and update defect register through burn-down.

## Design Artifacts

- `research.md`: Stage 2C decisions and no-new-dependency rationale.
- `data-model.md`: Trial/evidence/defect model, not a database schema change.
- `contracts/internal-trial-matrix.md`: Required role/scenario/gate contract.
- `contracts/evidence-redaction-contract.md`: Value-free evidence rules.
- `quickstart.md`: Local validation and required command runbook.
- `evidence/internal-mvp-trial-matrix.md`: Role and scenario evidence matrix.
- `evidence/defect-register.md`: Severity, burn-down, and retest register.
- `evidence/execution-log.md`: Stage 2C execution, commands, blockers, Production boundary.

## Risk Register

- RISK-001: Existing hosted blocker T032 may be mistaken for Stage 2C failure. Treatment: keep hosted gap explicitly open and separate.
- RISK-002: Evidence may accidentally include sensitive values. Treatment: use value-free summaries and redaction scans.
- RISK-003: Local tests may pass while hosted evidence remains missing. Treatment: no Production readiness claim without hosted gates.
- RISK-004: UX/accessibility issues may require broader product edits. Treatment: classify defects and only fix scoped P0/P1/P2 issues inside Stage 2C authority.

## Gate Decision

Stage 2C can produce an internal MVP trial/hardening result. It cannot produce Production acceptance. Production remains blocked unless every required local and hosted gate is green under separately approved hosted execution.
