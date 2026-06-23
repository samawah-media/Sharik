# Project Constitution: Sharik / Samawah Platform

Version: 1.0.0
Status: Accepted for planning baseline
Adopted: 2026-06-23
Source of authority: AGENTS.md, accepted ADRs in docs/06-decisions, product/operating/security docs, confirmed owner decisions.

## Authority and Scope

This constitution governs all feature specifications, plans, tasks, code, tests, and release decisions for V1. It is subordinate only to explicit owner/management decisions and accepted replacement ADRs. It overrides generated agent suggestions, demo code, and convenience shortcuts.

## Mandatory Principles

| # | Principle | Binding rule | Rationale | Verification | Exceptions | Approver | Related docs |
|---|---|---|---|---|---|---|---|
| 1 | Spec Before Code | No production feature code before an approved feature spec. | Prevents drift from product truth. | Spec status checked before build branch. | Emergency documentation-only fixes. | Owner/PM. | AGENTS.md, specification-governance.md |
| 2 | Approved Acceptance Criteria | Implementation requires testable acceptance criteria. | Makes done observable. | Each AC maps to evidence in traceability. | None for business/security logic. | Owner/PM + QA. | quality-gates-and-definitions.md |
| 3 | Tenant Isolation by Default | Every customer data path is tenant-scoped. | Cross-tenant leakage is critical failure. | RLS/server tests and query review. | Public marketing pages with no customer data. | Architect + owner. | ADR-004, tenancy docs |
| 4 | Client Isolation Within Tenant | Client users and scoped team members see only allowed clients. | Samawah has multiple clients in one tenant. | Client A/B access tests. | Management roles with documented scope. | Owner/PM. | visibility-and-data-boundaries.md |
| 5 | Deny by Default | Missing permission, scope, state, or version denies access. | Safer than implicit allow. | Permission matrix and negative tests. | Explicit temporary delegation. | Admin/PM with audit. | permission-catalog.md |
| 6 | Least Privilege | Roles grant only the minimum required actions. | Reduces blast radius. | Role-permission matrix review. | Time-bound escalation. | Tenant admin/owner. | role-permission-matrix.md |
| 7 | Server-Side Sensitive Commands | Approvals, sends, delivery, ledger, SLA overrides, and file visibility changes run server-side. | UI checks are not security. | Server command review and tests. | None. | Architect. | ADR-006 |
| 8 | RLS Defense in Depth | RLS is required where exposed, but not the only authorization layer. | RLS misconfiguration remains possible. | RLS plus command authorization tests. | Private server-only tables with documented guards. | Architect/security. | ADR-005 |
| 9 | No Internal Content to Client | Internal comments, QA notes, drafts, and internal files never enter client scope. | Core trust boundary. | E2E tests for client visibility. | Explicit client-visible conversion by management. | PM/MM with audit. | comments/files docs |
| 10 | Internal Approval Before Client Exposure | Deliverables and versions require internal approval before client submission unless a documented policy says otherwise. | Protects quality and workflow. | State transition tests. | Approved bypass policy. | Owner/PM. | approval docs |
| 11 | Version-Aware Approvals | Approvals bind to a specific deliverable version. | Prevents approval of stale work. | Superseded-version negative test. | None. | Architect/QA. | runtime-scenarios.md |
| 12 | Append-Only Auditability | Audit log and package ledger are append-only; corrections are explicit reversal/adjustment events. | Preserves accountability. | Mutation review and audit tests. | Data retention/archive after ADR. | Owner + architect. | ADR-009 |
| 13 | Ledger-Based Package Accounting | Package usage is not a mutable counter. | Reopen/reversal needs traceability. | Ledger entries and balance projections. | None for package-affecting features. | PM/finance owner. | package-balance-and-usage-ledger.md |
| 14 | SLA Timeline, Not Counters | SLA uses timeline segments for running/paused/completed states. | Client waiting time must not count against Samawah. | Pause/resume timeline tests. | Manual override with reason. | PM/MM. | ADR-008, sla-flow.md |
| 15 | No Silent State Transitions | Every business state change records actor, reason, scope, and event. | Debugging and auditability. | Audit event matrix. | System projections from existing events. | Architect. | domain-events-and-audit-model.md |
| 16 | Idempotent Sensitive Operations | Approval, send, delivery, ledger, SLA, and invitation commands tolerate retry. | Avoids duplicate decisions and charges. | Idempotency tests. | None. | Architect/QA. | logical boundaries docs |
| 17 | Accessibility and RTL by Default | Arabic RTL, keyboard access, and WCAG 2.2 AA planning are default. | Primary audience and usability. | UI checklist and Playwright/a11y tests. | Internal admin prototype only, time-boxed. | UX lead/owner. | responsive-rtl-and-accessibility.md |
| 18 | Mobile Client Actions | Critical client actions work on mobile. | Client approvals often happen away from desktop. | Mobile viewport E2E. | Complex admin operations. | UX lead/PM. | client portal UX |
| 19 | Security/Business Tests Required | Tenant, permission, approval, SLA, ledger, comments, and files need automated tests. | V1 risk is mostly logic/security. | Test strategy mapping. | Exploratory-only for non-sensitive copy. | QA + architect. | test strategy docs |
| 20 | TDD for Domain/Security Logic | Domain and security logic starts with tests or documented test cases. | Prevents regression in invariants. | Test-first evidence or reviewed exception. | Spike branches with no production merge. | Architect/QA. | quality gates |
| 21 | Verification Evidence Required | No feature is complete without evidence from tests/review/demo. | Done is more than UI working. | Definition of Verified. | Documentation-only updates. | QA/PM. | quality gates |
| 22 | No Secrets in Repo/Browser | No env secrets, service role keys, or real client data in repo/browser bundles. | Prevents credential leakage. | secret scan and bundle review. | `.env.example` placeholders only. | Security owner. | deployment secrets docs |
| 23 | No Unreviewed Dependency | New app dependencies require license/security/version review and ADR if strategic. | Avoids dependency drift. | dependency review record. | Dev-only transient tooling by owner approval. | Architect. | technology-stack-assessment.md |
| 24 | No Social Scheduling in V1 | Social publishing/scheduling remains outside V1. | Keeps focus on delivery operations. | Scope gate. | New accepted ADR and owner approval. | Owner. | ADR-012 |
| 25 | No Microservices Without ADR | V1 remains modular monolith unless ADR supersedes. | Reduces operational complexity. | Architecture review. | None. | Owner + architect. | ADR-001 |
| 26 | Do Not Modify Confirmed Decisions Silently | Confirmed product decisions require documented conflict and owner approval to change. | Protects source-of-truth stability. | decision register review. | Typo/format corrections only. | Owner. | confirmed-decisions-register.md |
| 27 | Traceability Requirement to Test | Requirements must map to feature, slice, policy, and test. | Prevents orphan requirements. | master traceability index. | Early discovery notes marked open. | PM/QA. | master-traceability-index.md |
| 28 | Branch/Worktree Isolation | Implementation happens on isolated branch/worktree after spec approval. | Protects baseline and reviewability. | branch naming and git status checks. | Planning-only doc edits on main before build starts. | Owner/PM. | specification-governance.md |

## Governance

- Amendments require a change note in `docs/07-spec-driven-delivery/specification-governance.md`.
- Amendments that alter architecture, tenancy, RLS, SLA calculation, approval workflow, file security, stack, or V1 scope require a new or superseding ADR.
- Conflict order: owner confirmed decisions, AGENTS.md, accepted ADRs, this constitution, product/operating docs, permission/domain docs, UX docs, architecture/security docs, demo code, agent assumptions.
- When conflict is business-facing, document it as a gap and stop before implementation.
- Versioning follows semantic versioning: major for principle changes, minor for added rules, patch for clarifications.
- This constitution was adopted for the planning baseline on 2026-06-23 and must be reviewed before the first `/speckit.specify` run.
