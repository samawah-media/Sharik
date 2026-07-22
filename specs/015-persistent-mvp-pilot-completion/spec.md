# Spec 015: Persistent MVP Pilot Completion

## Objective

Move the Hadna-only local MVP from synthetic route fixtures to one persistent, tenant-scoped Supabase/PostgreSQL workflow:

`team version -> internal review -> internal approval -> client approval/change request -> SLA pause/resume -> delivery -> package closure -> audit`

## Clarifications

### Session 2026-07-21

- Q: How should the owner begin with clean online trial data? → A: Create a new empty non-Production UAT workspace, retain approved team users and roles, and quarantine legacy Hadna/Glass synthetic data outside the new workspace.
- Q: How should management enter a new client, contract, package, and initial deliverables? → A: Use one guided four-step setup flow with draft preservation, review-before-submit, and field-specific errors.
- Q: How should day-to-day client requests be recorded after setup? → A: Management or the account manager creates each request from the client's workspace, selecting a package item while seeing the remaining balance before saving.
- Q: How closely should the visual system follow the supplied Salla reference? → A: Match the reference as closely as practical in layout, density, color treatment, typography character, navigation, and component rhythm while retaining Samawah branding and using original code and assets.
- Q: How should each major product update reach the owner's online trial? → A: Pass local gates, deploy an isolated Preview, complete Codex review, then promote the exact reviewed commit to the stable non-Production UAT entry.

## Scope and boundaries

- Local Hadna synthetic data only. No hosted mutation, deployment, access configuration, real customer data, or Production acceptance.
- This is the only active execution package. Historical R-007–R-011A packages remain evidence and are superseded for execution.
- The owner-authorized Product Experience Rescue uses only the stack already
  approved by `AGENTS.md`: React Hook Form + Zod, dnd-kit, Uppy + Supabase
  Storage, Tiptap, TanStack Query/Table where needed. These are reviewed
  implementation dependencies inside Spec 015, not a new product architecture.

## Acceptance criteria

1. Core workflow reads and writes persistent local database records; production routes do not instantiate fixture repositories.
2. Every customer-scoped table carries `tenant_id` and `client_id` where applicable, with composite foreign keys and explicit RLS.
3. Internal comments/files are inaccessible to client roles; client exposure requires internal approval of the same version.
4. Approvals bind to `version_id`; stale, cross-client, replayed, and unauthorized decisions are denied and audited.
5. SLA timeline records running, paused-waiting-client, paused-internal, resumed, completed, and cancelled segments; client wait is excluded from Samawah time.
6. Final delivery requires the required approval, records an audit event, consumes package commitment append-only, and closes the deliverable.
7. Local DB RLS tests and complete role-based E2E pass. If the DB cannot start, acceptance remains blocked.
8. No open P0/P1 defects remain; every P2 has accountable owner disposition and evidence.

## Corrective workflow integrity requirements

- The generic status command permits only documented operational transitions between `not_started` and `in_progress`, plus resuming change-request work to `in_progress`.
- Approval-derived statuses and delivery require exact-version commands; `delivered`, `cancelled`, and `archived` are terminal.
- `account_manager`, `content_writer`, and `designer` may submit only assigned deliverables in their active client scope. They receive no approval, client-send, client-decision, or delivery authority.
- Database acceptance requires executed replay, append-only, atomicity, exact-version, assigned-team, Tenant A/B, and same-tenant Client A/B regressions.

## Out of scope

Hosted UAT execution, deployment/promotion, team access, real customer data, social scheduling, billing, mobile apps, microservices, new dependencies, and Production acceptance.

## Owner-Authorized Hosted Team UAT Amendment

Status: `HOSTED_TEAM_UAT_READY_FOR_OWNER_TRIAL`. The corrected non-Production Preview, one semantically review-ready Glass item, the exact-head quality matrix, and the automated hosted role matrix are green. The remaining imported Glass items stay internal until the team supplies real text or client-visible media/files. H008-H010, X007, T032, and Production acceptance remain open until the owner completes X008-H and records an explicit human PASS.

This amendment extends Spec 015 only. It does not create Spec 016, does not invalidate the completed local acceptance evidence, and does not convert local MVP acceptance into hosted or Production acceptance.

### Hosted objective

Publish the accepted local MVP as a controlled online Team-Only Hadna UAT environment so approved Samawah team testers can sign in remotely and exercise the complete workflow against a Preview/UAT deployment and Supabase UAT target.

This is not a customer trial, Production deployment, Production acceptance, public release, public signup, or external client invitation.

### Hosted authorization boundary

Allowed external actions are limited to fetching GitHub remote state, creating a safe reviewable branch if required, pushing the reviewed UAT branch, creating a Draft PR, inspecting CI, configuring only Preview/UAT environment variables, deploying only a Vercel Preview/UAT build from the reviewed branch, verifying only the reviewed Supabase UAT project, applying only reviewed pending repository migrations, creating run-ID-scoped synthetic Hadna data, creating or inviting only explicitly approved Samawah team test users, running bounded hosted route/auth/RLS/workflow/UX checks, and rolling back only deployment or synthetic data created by this hosted UAT run.

Forbidden actions remain Production deployment, Production alias/domain changes, Vercel Production environment changes, Production Supabase access, real customer data, external client invitations, public signup, shared accounts or committed passwords, destructive schema operations, deleting existing users or unrelated data, force push, PR merge, Production acceptance, unapproved product dependency additions, social scheduling, billing, AI, CRM, or other feature expansion. The owner-approved Glass UAT import and the approved dnd-kit/Uppy/Tiptap/TanStack/React Hook Form implementation are explicitly inside the Product Experience Rescue boundary.

### Hosted acceptance criteria

1. The branch and PR are reviewable, contain only required Samawah MVP changes, and expose no secrets, private artifacts, hosted URLs, direct identifiers, credentials, emails, tokens, or unexplained migrations.
2. Draft PR CI and the full local verification matrix pass before hosted mutation.
3. Vercel Preview/UAT target and Supabase UAT target are verified as non-Production before any hosted read or mutation.
4. Preview/UAT environment variables point only to Supabase UAT; Production variables remain untouched; no service-role key is exposed through `NEXT_PUBLIC_*`, browser bundles, logs, screenshots, Git, PR text, or evidence.
5. Hosted database preflight is count/category-only and confirms no real/unknown customer data will be touched, the synthetic Hadna namespace is isolated, migrations are compatible, and rollback is possible.
6. Pending repository migrations apply cleanly to Supabase UAT; migration error or partial application blocks PASS.
7. Synthetic Hadna UAT data is idempotent, run-ID scoped, tenant/client scoped, minimal, safe to rerun, safe to roll back, and unable to touch unrelated data.
8. Team-Only UAT uses individual approved accounts for management, account manager, assigned writer/designer, unassigned internal negative tester, team-controlled client viewer, and team-controlled client approver. No guessed invitations are sent.
9. Hosted UI journey passes for exact-version internal approval, send-to-client, waiting-client SLA pause, client viewer read-only secrecy (including no decision, comment, or upload mutation), client approver change request/approval, stale-version rejection, delivery, audit, ledger, idempotency, and terminal delivered state.
10. Desktop Chromium, mobile Chromium, Arabic RTL, and keyboard-only critical paths pass with no hydration errors, sensitive console/log output, page-level horizontal overflow, or client exposure of internal comments/files.
11. No open P0/P1 defects remain; every P2 is owner-dispositioned; rollback rehearsal or no-op validation is recorded.

### Stop conditions

Stop before mutation or stop immediately during execution if Production is detected, target identity is ambiguous, real or unknown customer data may be affected, data outside the explicitly approved Hadna/Glass UAT scopes enters scope, migration fails or partially applies, rollback is unavailable, tenant/client/assignment isolation fails, unauthorized approval/send/delivery succeeds, internal comment/file becomes client-visible, stale version approval succeeds, audit/SLA/ledger/idempotency partial write occurs, a service-role key or secret appears in browser/logs/evidence, public signup is available, a P0/P1 defect is found, deployment points to the wrong Supabase project, or the task would require Production configuration.

### Hosted completion states

Use only one hosted final state, matching the canonical rescue prompt vocabulary:

- `HOSTED_TEAM_UAT_READY_FOR_OWNER_TRIAL` — when the corrected Preview and all automated technical/data/role gates are green, but the owner human walkthrough is still pending; this authorizes only the owner-controlled walkthrough.
- `HOSTED_TEAM_UAT_READY` — only when H008, H009, H010, T032, and X007 are all genuinely closed by direct hosted evidence and explicit owner human PASS.
- `HOSTED_TEAM_UAT_BLOCKED` — for every other incomplete or failed mandatory gate, including missing approved team access.

Do not use Production ready, Production accepted, customer accepted, or live release for this amendment.

## Product Experience Rescue Amendment (owner-authorized)

This additive amendment remains inside Spec 015 and is the canonical execution scope for the Preview/UAT rescue. Management needs exception-first work and scoped clients; assigned team members need clear assigned work, human-readable ownership, internal collaboration, version submission, and review; clients need a calm read-only portal and a real exact-version approval journey.

Acceptance additions: `/client/pending` is a real role-correct route; home, summary, and pending use one server-side visibility definition; a pending client review requires meaningful caption/body text or a non-empty client-visible file, and placeholder-only values do not qualify; `client_viewer` is read-only at both UI and database boundaries; client payloads exclude unsent/unapproved deliverables, internal comments, quality notes, internal files, private activity, and raw IDs; the client shell exposes home, pending, contract/follow-up, profile, and sign-out; team cards never render raw assignee identifiers; Arabic RTL, mobile, keyboard focus, 44px targets, reduced motion, and honest content fallbacks are covered by the shared `DESIGN.md` contract.

The existing persistent version, approval, file, comment, audit, SLA, idempotency, and RLS contracts remain authoritative. The generic run-ID-scoped Glass/Hadna import and automated hosted lifecycle are retained as technical evidence. They do not establish representative content presentation or human usability. The owner human trial reopened H008-H010, X007, and T032; X008 must correct the role experience, data presentation, and acceptance governance before any controlled team trial. Production remains explicitly out of scope.

### Clean owner-entry UAT workspace

The next owner trial must use a new empty workspace inside the approved non-Production UAT environment. Approved team Auth identities and reviewed role assignments may be retained, but the workspace begins with no clients, contracts, packages, deliverables, versions, tasks, comments, approvals, or files. Legacy Hadna/Glass synthetic records remain isolated and hidden from the new workspace rather than being destructively deleted. Historical audit and package-ledger evidence remains append-only. Production and Production configuration remain untouched.

### Guided client setup

Management creates a client through one Arabic RTL guided flow with four explicit steps: client details; contract details; package and initial deliverables; team assignments and dates. The flow preserves an unfinished draft, shows a final review before submission, prevents duplicate submission, and reports actionable field-level or step-level errors instead of a generic safe-save failure. Successful submission atomically creates the scoped records and a corresponding audit trail; partial creation is not allowed.

### Client-scoped request capture

Management and the assigned account manager create day-to-day work from the client's workspace rather than from an unscoped global form. The request flow shows the active contract, package item, committed quantity, consumed quantity, remaining balance, request description or supplied content, due dates, assignees, and attachments before submission. It blocks exhausted or mismatched package items, prevents duplicate submission, creates the tenant/client-scoped deliverable and initial work context atomically, and records the actor and package relationship in the audit trail. Client roles remain view/approval-only for request capture in V1.

### Salla-aligned visual direction

The owner-selected visual target is a close practical match to the supplied Salla reference: a dark right-hand navigation rail, bright low-noise content canvas, restrained accent colors, compact Arabic information hierarchy, thin borders, subtle radii, consistent icon treatment, dense but readable tables and status summaries, and calm feedback states. The client, assigned-team, account-manager, and management experiences share this system while preserving role-specific information architecture. Samawah name, logo, content, and brand ownership remain explicit; implementation must be original and must not copy Salla code, protected assets, wording, or brand identifiers. Desktop, mobile, RTL, keyboard, contrast, and reduced-motion acceptance remain mandatory.

### Incremental online review cadence

Each major task must pass its scoped local verification before an isolated Vercel Preview is created from the reviewed branch. Codex reviews the implementation, security boundaries, tests, and visible role journeys on that exact Preview. Only the exact reviewed commit may then update the stable non-Production owner-UAT entry. A failed gate keeps the stable UAT entry unchanged. Production deployments, aliases, environment variables, and data remain outside this cadence and require separate owner authorization.
