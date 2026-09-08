# Spec 015: Persistent MVP Pilot Completion

## Owner-approved verification location exception — 2026-09-08

Docker-dependent clean reset, real database/RLS and persistent journey gates may
run on disposable GitHub runner-local Supabase after a reviewed source push.
All other verification and privacy requirements remain. Automatic Vercel Git
deployment of the Spec015 branch must be held until deliberate publication after
CI and UAT compatibility checks. This is not permission to transfer hosted data,
skip tests, change Production, or close pending human acceptance.

## Approved visual implementation — 2026-09-08

Owner approved the three-screen direction and asked to start delegated execution.
First slice X010-B-7C-21 / UI1 establishes the calm light shell for management
and client surfaces. Preserve all navigation destinations, role-provided items,
notification props, sign-out behavior, compact mobile geometry and focus reveal.
White sidebar, dark readable text, pale-purple active link and purple focus;
background #f7f8fc, accent #6340df. No new font/library, fake data or charts.
Keep current spacing and 44px targets; do not rewrite nested content/cards yet.
Application roles, mutations, database, approvals and SLA are out of this slice.
Later approved design slices (dashboard, drawer, client approval and copy) need
their own detailed implementation/test boundaries before source changes.

## Approved design research — 2026-09-08

Research-only deliverables: references from three Saudi platforms, proposed
short Saudi Arabic copy, and standalone admin/work/client-approval mockups.
Acceptance for this phase: source limitations explicit, sample data labeled,
responsive RTL, protected workflow unchanged, and owner review before app code.
No platform implementation, new library, architecture or deployment is included.
See [research package](evidence/ui-research-20260908/README.md).

## Approved density continuation — 2026-09-07

Additional owner-approved D17/D18: client approval decisions retain visible
reason input, natural 44–56px buttons, mobile action order and all protected
decision bindings. Compact only the panel layout; normal summary-free panel
targets <=270px mobile / <=210px desktop, with unrestricted long-text growth.
Collapsed execution-task rows remove redundant nested chrome while preserving
outer grouping, all task fields/status, >=44px native disclosure, full editing
form, error focus, retry values and permission variants. Normal collapsed row
targets <=160px mobile / <=120px desktop; long text grows rather than clips.
Browser RED precedes layout edits. No workflow, server, data or dependency
change. These local slices cannot close deferred real-DB/hosted/owner gates.

Owner approved two bounded slices after read-only D15/D16 audits. Mobile
shells reduce stacked spacing and group existing account/sign-out/notification
controls, preserving every navigation destination, role label and accessible
breadcrumb. Desktop layout stays unchanged; no new navigation system.
InternalTeamDirectory becomes aligned full-width responsive rows retaining
all names, roles, client scopes, statuses, count/order and empty/admin states.
No row actions are invented. Geometry is measured against the real components;
fixture-only directory data stays behind the existing fixture/runtime guard.
Normal mobile shell target ≤200px and sticky utility ≤112px; ordinary member
row targets ≤120px desktop / ≤200px mobile. Long text may grow, never clip.
All controls retain ≥44px targets; no unintended page overflow or permission,
data-query, dependency, schema, invitation workflow or hosted change.

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

### X010-B-6B protected workflow matrix

| Area                                                    | Source state / input                                                                                          |                                                                         Actor | Allowed? | Resulting state                                     | Version effect                                                                                     | SLA effect                                                                      | Client visibility                                                       | Audit / notifications                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------: | -------: | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internal rework after approval                          | `internally_approved` with exact current version and current revision                                         | Tenant owner/admin, project manager, marketing manager in tenant/client scope |      Yes | `internal_changes_requested`                        | Current version returns to `internal_only`; a new version must be submitted before any client send | Ends any open segment and starts `resumed` with reason `return_internal_rework` | Not visible to client until a later internal approval and explicit send | `DeliverableReturnedToInternalRework`; in-app notification fan-out follows audit-event triggers when configured                                                              |
| Internal rework before delivery without client approval | `ready_for_delivery` only when `requires_client_approval = false`, exact current version and current revision | Tenant owner/admin, project manager, marketing manager in tenant/client scope |      Yes | `internal_changes_requested`                        | Current version returns to `internal_only`                                                         | Ends any open segment and starts `resumed`                                      | Not visible to client                                                   | `DeliverableReturnedToInternalRework`                                                                                                                                        |
| Internal rework after client exposure                   | `waiting_client_approval`, `client_approved`, or `ready_for_delivery` when client approval was required       |                                                                     Any actor | No in V1 | No change                                           | No change                                                                                          | No change                                                                       | Existing client visibility and decisions are never silently recalled    | Denied by RPC; the supported return path is an explicit client change request. A future withdrawal feature is separate out-of-scope work, not an implicit status transition. |
| Terminal reopen                                         | `delivered`, `cancelled`, `archived`                                                                          |                                                                     Any actor |       No | No change                                           | No change                                                                                          | No change                                                                       | No change                                                               | Denied by RPC                                                                                                                                                                |
| Stale version/revision                                  | Non-current `version_id` or mismatched `expected_revision`                                                    |                                                                     Any actor |       No | No change                                           | No change                                                                                          | No change                                                                       | No change                                                               | Denied by RPC; idempotent replay with the same key returns the original result                                                                                               |
| Kanban drag                                             | Drag to `not_started` or `in_progress` where the state machine allows it                                      |                                                Authorized internal board user |      Yes | `not_started` or `in_progress`                      | No approval/version mutation                                                                       | Existing status command behavior                                                | No client exposure change                                               | Existing audited status command                                                                                                                                              |
| Kanban protected move                                   | Drag to review, approval, client-send, client-decision, delivery, or terminal state                           |                                                                     Any actor |       No | No change with optimistic rollback                  | No change                                                                                          | No change                                                                       | No change                                                               | UI explains Arabic denial; workflow buttons remain the only path                                                                                                             |
| Team invitation                                         | Valid name/email, Arabic internal role, active tenant scope, active client scope, one-time link               |                                                       Tenant owner/admin only |      Yes | Pending, then accepted by the exact signed-in email | Acceptance activates only the invited client-scoped role and human profile                         | No SLA effect                                                                   | No cross-client/member leakage                                          | Create/resend/revoke/accept are audited and idempotent; old draft RPCs are non-executable                                                                                    |
| Duplicate/expanding invitation                          | Same pending email with any repeated/different role or client scope                                           |                                                                     Any actor |       No | No change                                           | No duplicate or permission expansion                                                               | No SLA effect                                                                   | No extra visibility                                                     | Denied by RPC; management must revoke or regenerate the existing pending invitation                                                                                          |

The owner request asked for a path after a deliverable was “already sent to the client”. V1 deliberately does not implement a silent internal recall from client-visible states. After exposure, the existing audited client change-request flow is the only supported return path. Any future agency-initiated withdrawal must be a separately specified client-visible feature covering notice, approval invalidation, visible history, and SLA ownership.

## Out of scope

Hosted UAT execution, deployment/promotion, team access, real customer data, social scheduling, billing, mobile apps, microservices, new dependencies, and Production acceptance.

## Owner-Authorized Hosted Team UAT Amendment

Historical status below applies only to its previously reviewed revision.
It is superseded for the current dirty continuation by evidence/gate-status.md;
real-DB, exact-HEAD CI, hosted/Preview and all 20 owner checks remain pending.

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

Owner continued the previously listed next corrections after X010-B-7C-13:
mobile My Work filters keep search full-width and place priority/SLA together
without losing 44px targets; the row's primary hit area opens its existing
drawer with valid keyboard semantics and focus return. Shared inline media
must show an honest fallback for image/video load failure or unavailable
preview, and must not show a previous file's URL/failure while a new file is
pending. Ignore stale async completions; no public storage URL fallback.
No change to authorization, Kanban, schema, dependencies or hosted gates.

Bounded design approved by the owner on 2026-09-07 (X010-B-7C-13): the
default “مهامي” list becomes compact operational rows with a small authorized
thumbnail or honest type fallback, one title/client/type/channel hierarchy,
owner, Arabic due date, priority, state, SLA, counts and next action. Full
caption/media detail belongs in the existing drawer, not each list row.
Preserve filters, visible result counts, scoped payloads, drawer actions and
Kanban behavior. Typical fixture rows should fit within 220px on desktop and
400px on mobile without fixed-height clipping; long content must still wrap.
Verify 44px targets, keyboard opening/focus return and RTL overflow. This
approval is not permission for external code transfer, hosted writes or final
owner acceptance of implemented visuals.

This additive amendment remains inside Spec 015 and is the canonical execution scope for the Preview/UAT rescue. Management needs exception-first work and scoped clients; assigned team members need clear assigned work, human-readable ownership, internal collaboration, version submission, and review; clients need a calm read-only portal and a real exact-version approval journey.

Acceptance additions: `/client/pending` is a real role-correct route; home, summary, and pending use one server-side visibility definition; a pending client review requires meaningful caption/body text or a non-empty client-visible file, and placeholder-only values do not qualify; `client_viewer` is read-only at both UI and database boundaries; client payloads exclude unsent/unapproved deliverables, internal comments, quality notes, internal files, private activity, and raw IDs; the client shell exposes home, pending, contract/follow-up, profile, and sign-out; team cards never render raw assignee identifiers; Arabic RTL, mobile, keyboard focus, 44px targets, reduced motion, and honest content fallbacks are covered by the shared `DESIGN.md` contract.

Owner-UAT continuation acceptance additions (2026-09-01): the synthetic owner-review item must include a real ready current-version visual file, stage that exact file for client review before send, and let the authorized client preview it during review and find it as a final delivery after the normal delivery transition. An assigned internal team member must be able to open the client deliverables surface and see counts derived only from deliverables allowed by existing RLS; lack of contract/package permission must not turn assigned work into zero, and must not expose commercial balances or another member's unassigned work.

Second owner-feedback correction-batch acceptance additions (2026-09-01): a card with one primary destination must expose that destination across the card surface and by keyboard, while cards with secondary actions must keep valid non-nested links. The universal deliverable drawer must not require horizontal tab scrolling at supported desktop/mobile widths; its responsive section navigation remains visible during long forms and preserves RTL arrow/Home/End navigation, focus return, and entered values. Corrected drawer/content-card surfaces must present known content formats/channels and dates in calm Arabic labels, and unknown technical tokens must not be rendered verbatim.

Third owner-feedback correction-batch acceptance additions (2026-09-01): contract and package counts must derive from the same tenant/client-scoped, human-trial-visible rows used by their detailed lists. Commercial summaries and package details show committed, reserved, delivered, and remaining quantities consistently. Fractional values in count-based units and negative computed availability are not rounded or presented as trustworthy balances; the UI identifies the affected service and requires the existing audited adjustment path. Contract/package periods use one Arabic Gregorian formatter and explicit start-to-end order in RTL. Management can search and status-filter contracts/packages and page through bounded results without deleting or mutating synthetic UAT history; known run-scoped hosted contracts remain quarantined through the existing visibility predicate.

Fourth owner-feedback correction-batch acceptance additions (2026-09-01): the
internal-team invitation form starts with no role or client selected and blocks
submission until management explicitly chooses one role and at least one active
client. One invitation may carry the same internal role across multiple active
clients in the authorized tenant; acceptance activates only those exact
client-scoped role assignments, records an audit event for every assigned
client, and remains idempotent. Pending invitations are the primary actionable
list with explicit renew/revoke lifecycle actions. Accepted invitations are not
rendered again beside the resulting active member; revoked/superseded records,
when retained for operational reference, appear only in a compact closed-history
disclosure. Team/member cards show human names, Arabic roles, and all assigned
client names without exposing identifiers or widening management, tenant, or
client permissions.

Fifth owner-feedback correction-batch acceptance additions (2026-09-02): the
guided first-client final review must present, using human Arabic labels and
never raw identifiers or enum values, the client contact details, the contract
name/reference/period, the package services with quantities and units, the
primary owner by human name and Arabic role, every selected contributor with
name and role, and the first deliverable's name, description when present,
type, priority, every provided date in one Arabic Gregorian formatter, and the
internal/client approval settings; empty optional values are omitted rather
than rendered as placeholders, and the review stays compact, RTL, and
mobile-safe. Step validation is field-addressable: advancing with invalid input
keeps the user on the same step, moves keyboard focus to the first
actually-invalid field (the company name before the optional phone on step
one), renders an inline message bound to that exact field through stable
`aria-invalid`/`aria-describedby` wiring instead of a generic message alone,
and correcting a field clears only its own error without discarding other
entered values or resetting the journey. If the invalid field belongs to a
collapsed optional disclosure, the wizard opens that disclosure before moving
focus so the inline error and its correction path remain visible.

Sixth owner-feedback correction-batch acceptance additions (2026-09-03):
resetting the owner trial after repeated synthetic runs is a reversible
workspace rollover, not row cleanup. The currently shared active UAT workspace
becomes the quarantined source only after a new deterministic empty
non-Production workspace, internal memberships, and reviewed tenant-scoped
roles have been provisioned and verified. Source clients, contracts, packages,
deliverables, versions, tasks, comments, approvals, file metadata and Storage
objects remain unchanged; `audit_events` and `package_ledger_entries` remain
append-only. Client-only personas are never copied automatically. The existing
clean-workspace tool must support one exact shared active source even when each
persona already has multiple historical inactive workspace memberships, and
must retain guarded `--dry-run`, `--status`, idempotent `--apply`, and exact
`--rollback` behavior. Before source quarantine, one deterministic append-only
audit binding records the exact source tenant and membership set for the run;
later processes use that binding for status, replay, and rollback, and any
mismatch fails closed. Target identity, UAT category, owner-supplied run ID,
explicit apply/rollback confirmations, compensation on partial failure, and
category/count-only output are mandatory. A local implementation batch does
not authorize hosted apply, deployment, invitation, merge, or Production.

The existing persistent version, approval, file, comment, audit, SLA, idempotency, and RLS contracts remain authoritative. The generic run-ID-scoped Glass/Hadna import and automated hosted lifecycle are retained as technical evidence. They do not establish representative content presentation or human usability. The owner human trial reopened H008-H010, X007, and T032; X008 must correct the role experience, data presentation, and acceptance governance before any controlled team trial. Production remains explicitly out of scope.

### Client-facing date display continuation

Continuation acceptance (2026-09-07): client deliverable comment dates and file
dates use the shared explicit Arabic Gregorian/Riyadh display formatter. Raw
date values remain unchanged in persistence; already-human due-date labels must
not be reparsed as ISO strings. Missing/invalid dates show calm Arabic fallback
copy. This bounded localization slice preserves client visibility and approval
capabilities and is verified with focused display regressions.
The same policy applies to approval-panel due-date labels and visible dates
in client/management work lists and shared deliverable cards. Date input
serialization remains ISO; localization is display-only. Existing priority
between internal/client/final/planned date sources is preserved.

### Execution-task form feedback continuation

The existing drawer task form must explain invalid input in Arabic next to the
affected title, description, or due-date field, link errors accessibly, and
focus the first invalid visible input. Rejected or interrupted saves preserve
the user's entries and show a retryable Arabic message rather than an unhandled
failure or false success. Existing server capabilities, assignment eligibility,
status transitions, and validation constraints remain unchanged.
Empty optional date/assignee controls map to the existing nullable contract.
An unchanged retry after a lost save response keeps the same idempotency key;
a confirmed successful save followed by a new task is a new logical operation.
Changed payloads must not accidentally replay a previous successful operation.

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
## UI4 execution clarification — 2026-09-08

UI4 continuation: owner requested client approval presentation per
[UI4 plan](evidence/ui4-plan.md): full review text, explicit version at the
decision, preview-first mobile/two-column desktop presentation. All version,
revision, permission and protected-command contracts stay unchanged.

## UI3 execution clarification — 2026-09-08

Apply the owner-approved internal-workspace visual direction inside the existing
drawer per [UI3 plan](evidence/ui3-plan.md). Compact wrapping tabs and missing-media
presentation; clarify static copy and the internal-review submit action. Preserve
all fields, capabilities, mounted panels, focus behavior and protected commands.
This does not approve owner UAT, hosted acceptance or deployment.

## UI2 execution clarification — 2026-09-08

Owner explicitly requested implementing the next dashboard slice before machine
restart, deferring integrated browser verification. Apply [UI2 plan](evidence/ui2-plan.md):
source-backed current-status and per-client delivery bars, concise Saudi static
copy, and truthful unavailable summaries on partial/failed scoped reads. Keep
the installed stack, scoped reads/guards and operational calculations unchanged.
No UI1/owner/hosted acceptance is implied by this execution-order decision.
