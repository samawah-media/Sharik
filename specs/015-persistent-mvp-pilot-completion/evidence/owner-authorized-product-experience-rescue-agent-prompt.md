# Owner-Authorized Product Experience Rescue and Real Team UAT — Master Agent Prompt

## How to use this file

Give the next implementation agent this exact instruction:

> Read and execute `specs/015-persistent-mvp-pilot-completion/evidence/owner-authorized-product-experience-rescue-agent-prompt.md` as the single canonical owner-authorized mandate. Continue autonomously through specification amendment, implementation, verification, Preview deployment, controlled hosted data setup, real team UAT, defect burn-down, and handoff. Do not stop after planning or return for routine decisions. Respect every stop condition and Production boundary in the file.

This file is the execution prompt. Do not create a parallel roadmap or a new feature package to restate it.

---

## 1. Role and terminal mandate

You are the senior product, UX, frontend, backend, security, data, and QA agent responsible for turning the current Samawah Preview/UAT into a genuinely usable Arabic SaaS experience for three audiences:

1. Samawah management.
2. The assigned Samawah delivery team.
3. A team-controlled client viewer and client approver.

The owner has inspected the current online platform and rejected its usability and visual quality. Local persistence and security test evidence are valuable, but they do not compensate for a confusing live product. Your mandate is to continue within the existing canonical Spec 015 until the team can perform the real online workflow smoothly with Hadna and Glass UAT data.

Do not stop after an audit, plan, design document, component mockup, local-only implementation, or partial test pass. Continue through the safe in-scope sequence until the terminal success conditions in this prompt are met or a genuine stop condition is reached.

## 2. Owner decisions and authorization

The following decisions are already made. Do not ask the owner to repeat them.

- Keep `specs/015-persistent-mvp-pilot-completion/` as the one canonical package. Do **not** create Spec 016 or another competing master plan.
- Amend the existing Spec 015 `spec.md`, `plan.md`, and `tasks.md` before implementation. Add a clearly bounded Product Experience Rescue amendment and dependency-ordered tasks beneath the existing hosted amendment.
- Treat the failed live product experience as evidence that H008 is not yet a PASS. H008, H009, H010, and the hosted T032 outcome remain open until this prompt's acceptance gates pass.
- The existing local MVP persistence evidence remains valid unless a regression invalidates it. Do not rewrite history or claim that earlier local passes proved the current hosted UX.
- Use the current approved stack and the V1 libraries named in `AGENTS.md`.
- Adding a dependency already explicitly approved by `AGENTS.md` is owner-authorized when it is necessary for this rescue, compatible with the current stack, minimally scoped, pinned through the repository lockfile, and covered by tests. Record the reason in the plan and dependency inventory. It does not require an ADR unless it changes architecture or substitutes a different technology.
- Any technology not approved by `AGENTS.md`, any architecture change, any tenancy/RLS model change, or any workflow/SLA rule change requires an ADR and remains subject to the existing project rules.
- Study [awesome-design-md](https://github.com/voltagent/awesome-design-md) as a design-system reference. It is inspiration and process guidance, not a runtime dependency and not permission to copy another product's identity or code.
- Use the existing `demo/` only as a UX anatomy and content-density reference. Reuse valid product concepts, not fixture architecture, fake authorization, unsafe code, or stock imagery presented as client work.
- The owner authorizes UAT-only use of the existing Hadna data and the supplied Glass workbook for the controlled team trial.
- The Glass source workbook is `جلاس الموسم 4.xlsx` at the repository root. Read it locally, but keep it untracked. Never edit, move, delete, stage, commit, upload as a whole, or quote its full contents in Git evidence.
- Controlled mutations are authorized only against the verified Supabase UAT target and Vercel Preview/UAT deployment already associated with Spec 015, and only with a reviewed migration/import, a run ID, a rollback owner, stop conditions, and redacted evidence.
- Updating the existing branch, Draft PR, CI, and Preview deployment is authorized. Do not merge the PR, promote to Production, change Production, enable public signup, or force-push.
- Use only team-controlled UAT client personas during this task. Do not invite a real external client yet.
- Do not fabricate client images, official logos, approvals, or missing business content. Use supplied assets when available. Otherwise use a polished content-type/channel thumbnail fallback and an honest brand monogram until an official asset is supplied.
- Continue without asking routine implementation or design questions. Make the smallest coherent decision consistent with `AGENTS.md`, document it in Spec 015, and proceed.

## 3. Sources of truth to read first

Read these before editing anything:

- `AGENTS.md` in full.
- `specs/015-persistent-mvp-pilot-completion/spec.md`.
- `specs/015-persistent-mvp-pilot-completion/plan.md`.
- `specs/015-persistent-mvp-pilot-completion/tasks.md`.
- Every file in `specs/015-persistent-mvp-pilot-completion/evidence/` relevant to gates, defects, execution, hosted UAT, rollback, and expert review.
- `docs/PROJECT_PROGRESS.md` and the relevant product, UX, permissions, security, RLS, release, and deployment documents.
- Current production source, migrations, tests, route map, package manifest, lockfile, and repository agent instructions.
- Relevant `demo/` components and data structures, especially the deliverable drawer, team workspace, client workspace, cards, previews, files, comments, quality checklist, and activity concepts.
- The local Glass workbook, read-only. Inspect sheet names, headers, row counts, value types, formulas, links, and blank values without exposing its contents in logs or evidence.

Before relying on any path, script, route, environment variable, package, table, column, policy, RPC, or behavioral claim in this prompt, verify it against the current repository. Where reality has changed, update the Spec 015 amendment with the verified finding and use the current source of truth.

## 4. Known live findings to reproduce and register

An earlier read-only live review found the following. Reproduce each against current code and Preview/UAT before marking it confirmed, fixed, or obsolete:

1. The client navigation links to `/client/pending`, but that path returned a 404.
2. The client commercial summary appeared to include deliverables without an adequate visibility/state filter. A client approver could see an `in_progress` negative-control deliverable before internal approval.
3. A deliverable in `waiting_client_approval` appeared in a commercial view while the client home page claimed there was nothing awaiting approval and offered no complete preview/decision journey.
4. Team Kanban cards were text-only and exposed little more than status. They lacked a useful preview, caption/content context, file/version/comment counts, actionable details, and a clear drawer.
5. Raw UUID-like values appeared as assignees instead of scoped member names or avatars.
6. Deliverable list cards were not a coherent entry point into work details.
7. Production source did not expose a complete file upload/storage workflow or an internal comment workflow even though both are core V1 requirements.
8. A sign-out component existed but was not discoverable in the main product shell.
9. Normal team surfaces showed synthetic Alpha/Beta or negative-control data and called the experience Hadna, making the UAT context misleading.
10. Existing Hadna hosted records were imported without the full caption/description/media context needed for a realistic media workflow.
11. The live experience was far behind the richer deliverable anatomy represented in the approved demo: content preview, versions, files, comments, quality, and activity.

Record confirmed findings in the existing defect register. A security or visibility leak is P0/P1 according to impact. A broken required client approval route, a workflow that prevents the team from completing the hosted trial, or exposure of synthetic controls in normal UAT must not be dismissed as visual polish.

## 5. Product outcome and non-negotiable success definition

The task succeeds only when all of the following are true on the controlled online Preview/UAT:

- Management can understand what needs attention across allowed clients without decoding a raw board.
- Assigned team members can open `مهماتي`, understand priority and SLA, open a deliverable, inspect the brief/content/files/comments/history, upload a version, collaborate internally, and submit it for internal review.
- Management can request internal changes or approve the exact version, then send the exact approved version to the client.
- A client viewer sees a calm read-only portal containing only client-visible, internally approved material.
- A client approver sees a clear `بانتظار موافقتي` inbox, previews the exact visible version with its caption and allowed files, and can approve or request changes with an audited comment.
- Client waiting pauses SLA, client change request resumes it, and the final delivery completes it without duplicate audit or ledger effects.
- The team can complete the workflow using meaningful Hadna and Glass UAT data rather than synthetic Alpha/Beta controls.
- No raw user ID is shown in product UI.
- No client can see another client, an unapproved deliverable, an internal comment, an internal file, a quality note, or an internal activity detail.
- Desktop Arabic RTL, mobile, keyboard, focus, empty/loading/error states, and expected content overflow are usable and visually coherent.
- No required P0/P1 defect remains open. Every P2 has an owner disposition. P3 deferral includes a rationale.
- The full local and persistent verification matrix passes after the final code change.
- Draft PR, CI, Preview/UAT deployment, controlled hosted data setup, hosted persona UAT, rollback/no-op evidence, and documentation are current.
- H008, H009, and H010 are closed only by direct evidence. T032 is closed only if its actual hosted acceptance requirements pass.
- Production acceptance is still explicitly not granted.

Passing tests without the live product journey above is not completion. Attractive screenshots without correct persistence, RLS, audit, SLA, and role behavior are also not completion.

## 6. Non-negotiable boundaries

- No new canonical Spec package.
- No Production deployment, Production database access, Production environment change, promotion, or acceptance claim.
- No PR merge, force push, destructive Git reset, deletion of user files, or staging unrelated files.
- Never stage `جلاس الموسم 4.xlsx`.
- No real external client invitation, public signup, or real client decision during this task.
- No fixture actor impersonation, service-role key, or test bypass in the browser or Next.js runtime.
- Keep service-role use, if required, inside a local or CI setup/assertion/import harness. It must never enter `NEXT_PUBLIC_*`, a client bundle, app logs, browser storage, or committed evidence.
- No client content or identifiers in public logs, screenshots committed to Git, PR comments, test fixtures, or evidence. Evidence must use categories, counts, hashes where appropriate, and redacted references.
- No fake approval records derived from spreadsheet approval columns. Legacy approval-like values are source metadata or import notes only; actual platform approvals must be performed by authorized personas and written through the audited workflow.
- No internal comments or files exposed to clients.
- No query, Server Action, route handler, RPC, storage path, or policy that omits tenant/client scope.
- No status bypass through direct mutation or drag-and-drop.
- No random stock photo presented as a real Hadna or Glass deliverable. A decorative fallback must be clearly generic and content-type based.
- No wholesale clone of `awesome-design-md`, Linear, Airtable, ClickUp, Monday, Trello, Planka, BrightBean, or the demo.
- No social scheduling, publishing, AI content generation, CRM expansion, billing expansion, advanced analytics, or other post-V1 work.
- Do not expose direct Preview URLs, Supabase references, email addresses, tokens, passwords, or source row content in committed evidence.

## 7. Autonomous execution protocol

Work in small, reviewable commits on the existing Spec 015 branch. Preserve all unrelated work and inspect the worktree before each commit. Keep the existing PR as Draft.

Do not ask for permission for normal in-scope choices such as component composition, token names, responsive breakpoints, task ordering, test organization, or how to map exact states into fewer visual columns. Choose, document, implement, and verify.

Use bounded retries. When a check fails, diagnose the root cause and fix an in-scope defect; do not rerun blindly and do not weaken the test. Never change evidence from FAIL/BLOCKED to PASS without executing the required check.

You may stop only when continuing would require one of these:

- touching Production or an unverified hosted target;
- applying a destructive or ambiguous hosted migration without a tested rollback;
- exposing or guessing sensitive client data;
- inviting a real external client;
- using an unapproved technology without the required ADR/owner decision;
- proceeding without any valid UAT access path after exhausting existing ignored local configuration and approved team-controlled personas;
- proceeding after target identity, tenancy, or rollback verification fails.

If a stop condition occurs, leave the system safe, preserve evidence, mark the exact task/defect BLOCKED, and report the smallest owner action needed. Continue all other independent work first.

## 8. Required execution sequence

### Phase A — Preserve, reproduce, and amend Spec 015

1. Inspect branch, worktree, upstream, existing Draft PR, CI, Preview/UAT, migration inventory, and untracked files.
2. Preserve the Glass workbook as an untracked owner file.
3. Reproduce the known live findings read-only across management, account manager, assigned team, unassigned negative, client viewer, and client approver personas.
4. Save no secrets or client content in terminal transcripts or Git evidence.
5. Update the existing defect register with evidence-backed severity and workflow impact.
6. Amend Spec 015 `spec.md`, `plan.md`, and `tasks.md` with:
   - the three role outcomes;
   - user journeys and acceptance criteria;
   - the information architecture;
   - visual and interaction requirements;
   - content/version/file/comment/task model requirements;
   - migration, RLS, storage, audit, SLA, and rollback requirements;
   - Hadna/Glass controlled data plan;
   - dependency inventory and ADR decisions;
   - desktop/mobile/RTL/accessibility acceptance;
   - hosted UAT and defect gates;
   - explicit out-of-scope boundaries.
7. Keep H008 open or mark it failed/blocked until direct hosted evidence passes. Do not close H009/H010 early.

Spec amendment and acceptance criteria must be complete before production code changes.

### Phase B — Establish a Samawah design contract

Study only the relevant design references in `awesome-design-md`, then create a project-owned root `DESIGN.md` that fits Samawah. Use a synthesis of:

- structured, calm workflow clarity similar to Airtable-style information organization;
- precise hierarchy, density, and interaction discipline associated with modern Linear-style SaaS;
- a custom Arabic media-first deliverable experience for Samawah.

The design contract must define:

- product personality and principles;
- Arabic-first RTL behavior and bidirectional content rules;
- typography using an approved Arabic-capable font already available or added through the approved frontend approach;
- semantic color tokens, including status, SLA, danger, warning, success, focus, and muted surfaces;
- spacing, radii, shadows, borders, density, and elevation;
- application shell, sidebar, top bar, client switcher, breadcrumbs, and user menu;
- dashboard, metric card, data list, board, lane, deliverable card, drawer, tabs, badges, avatars, comments, upload, preview, approval action bar, toast, dialog, skeleton, empty, error, and permission-denied patterns;
- imagery and thumbnail rules, including honest generic fallbacks;
- responsive behavior and mobile priorities;
- keyboard/focus/touch behavior with at least 44px touch targets;
- WCAG AA contrast intent and reduced-motion behavior;
- do/don't examples specific to Samawah.

Create or update the relevant `docs/03-ux/` information architecture and role flows. The implementation must use shared tokens and primitives rather than page-specific arbitrary styling.

### Phase C — Close client-visibility and navigation P1s first

Before expanding the UI, close any confirmed client data exposure and broken approval entry point:

- make every visible client navigation destination real, role-correct, and tested;
- build or correctly route the `بانتظار موافقتي` inbox;
- ensure counts, home cards, commercial summary, and inbox use one consistent visibility definition;
- return only the client's allowed scope and only versions explicitly eligible for client visibility after internal approval/send;
- enforce the rule server-side and through RLS/storage policy where applicable, not only by hiding UI;
- ensure client viewers are read-only and client approvers can act only on the exact currently visible version;
- add a discoverable profile/user menu with sign out;
- remove raw IDs and resolve scoped display names safely;
- exclude synthetic negative-control clients and records from normal UAT navigation while preserving them for isolated tests.

Add regression tests before calling these fixed.

### Phase D — Build the minimum persistent content execution model

Review the existing schema before choosing exact names. Extend it only as needed to represent real V1 execution without turning the platform into a CRM or social scheduler.

At minimum, the current exact deliverable version must be able to represent or relate to:

- brief/description;
- content or copy body;
- caption;
- platform/channel metadata;
- content format/type;
- optional objective and KPI/source metadata when present;
- publish/due timing relevant to the contract;
- submitted version metadata;
- client-visible preview/final file relationships;
- version-specific approval decisions.

Mutable review content belongs to the exact version or a clearly versioned related record, not only to the parent deliverable.

Add a small internal execution checklist/task model only if the existing model cannot represent the Glass marketing-tool rows and the card-level work needed by the team. Keep it deliverable/client scoped, assignee-aware, auditable where state changes matter, and deliberately short of a general project-management or CRM subsystem.

Complete real file handling using the approved V1 stack:

- Uppy for upload interaction;
- Supabase Storage for object storage;
- file metadata, visibility, version, owner, tenant/client, deliverable/contract relationship, and final-delivery status;
- short-lived signed or authenticated access;
- image/video/PDF preview when safe and a clear fallback for other types;
- size/type validation and actionable error states;
- internal-only, client-visible, client-uploaded, final-delivery, contract, report, and brand-asset semantics as required by `AGENTS.md`;
- RLS/storage tests for cross-client access and visibility.

Complete persistent comments with the approved editor path:

- use Tiptap unless an explicit accepted ADR documents the permitted fallback;
- default team comments to internal visibility;
- require an explicit action for client-visible comments;
- render system and approval comments according to role;
- include author, timestamp, visibility, and context without exposing raw IDs;
- test that internal/system-private content never reaches client queries or markup.

Use Zod and React Hook Form for changed non-trivial forms as required by the project. Use TanStack Query/Table where their approved responsibilities materially apply. Avoid dependency ceremony for static server-rendered content.

For every migration:

- use composite tenant/client relationships where needed;
- maintain exact-version integrity;
- add or update RLS and grants;
- include audit and idempotency behavior for sensitive commands;
- prove clean replay from reset;
- test rollback/no-op behavior locally;
- review hosted safety before application.

### Phase E — Build one universal role-aware deliverable drawer

Every meaningful deliverable card/list row must open a shared drawer or equivalent focused surface by mouse and keyboard. Avoid a maze of separate pages.

The drawer must support role-aware versions of these areas:

1. Overview: client, title, type, status, priority, assignees, dates, progress, SLA, brief, and next action.
2. Content: version-specific content body/caption, channels, objective/KPI metadata when available, and copy-friendly presentation.
3. Preview and versions: current version, safe media/file preview, version history, submitted-by display name, and exact-version state.
4. Execution: compact checklist/tasks, owners, and status for authorized team users.
5. Files: upload, visibility, versions, preview/download, final-delivery marker, and errors.
6. Comments: internal/client/system/approval visibility and editor according to role.
7. Quality: internal checklist and decision controls for authorized management only.
8. Activity: a human-readable audit timeline scoped and filtered by role.

Client users must never receive internal tabs, internal fields, internal counts, internal comments, internal files, or internal activity data in the response payload. Do not rely solely on conditional rendering.

Keep approval actions sticky and obvious where appropriate. Destructive or irreversible actions need clear confirmation. All commands must preserve state-machine rules, idempotency, audit, SLA effects, and exact-version integrity.

### Phase F — Rebuild the team workspace around real work

The team default experience should answer: what do I need to do now, for whom, by when, and what is blocking me?

Implement:

- a useful `مهماتي` default view for assigned work;
- Board and List views sharing the same scoped source of truth;
- search and practical filters for client, assignee, type, status group, priority, SLA, and due range;
- a compact summary of due soon, at risk, overdue, awaiting internal review, and waiting on client;
- persistent filter/view behavior where safe and appropriate;
- honest empty, loading, error, permission, and no-assignment states.

The Board should use approximately five or six visual macro-lanes instead of forcing users to scan every exact lifecycle state as an empty column. Preserve the full database state machine. Define and document a deterministic mapping such as:

- `للبدء`;
- `قيد التنفيذ والتعديلات`;
- `المراجعة الداخلية`;
- `جاهز أو مرسل للعميل`;
- `التسليم والمكتمل`.

Choose the exact grouping from the verified states, document how each exact state maps to a visual lane, and define the one valid command/target state for each permitted drop. Never let visual grouping create a state bypass.

Use dnd-kit for accessible drag-and-drop as approved by `AGENTS.md`:

- optimistic feedback with rollback on failed persistence;
- keyboard alternative and non-drag status action;
- RTL-correct movement;
- mobile-safe interaction;
- clear unavailable targets and actionable denial messages;
- audit/SLA updates through the same server command used by non-drag actions.

Each card must be scannable and include, where available and authorized:

- real client identity or safe monogram fallback;
- honest media thumbnail or content-type/channel fallback;
- deliverable title and format/channel;
- real assignee names/avatars;
- priority, due date, and SLA status;
- current workflow state and next action;
- file, comment, task/checklist, and version counts;
- blocked/waiting reason;
- keyboard-focusable entry to the universal drawer.

Do not overload the card with full content; place detail in the drawer.

### Phase G — Make the client portal calm and obvious

The client portal is not the internal Kanban. It should expose the minimum mental model:

- `الرئيسية`;
- `بانتظار موافقتي` with a clear count and primary call to action;
- `العقد والمتابعة` showing progress and remaining package in plain language;
- `الملفات` for allowed/final files;
- user settings/profile and sign out.

The home page should answer:

- What needs my action now?
- What is being worked on?
- What was recently delivered?
- What remains in the agreement?

The approval journey must show only the exact internally approved/client-sent version and include:

- clear title, status, SLA/waiting context, caption/content, media/files, and version label;
- approve and request-changes actions only for a client approver;
- required or clearly prompted comment for change request;
- safe confirmation and duplicate-submit protection;
- human-readable success/error feedback;
- audit record tied to user, time, deliverable, tenant/client, and exact version.

The viewer receives the same safe context without mutation controls. Internal terminology must be translated into client language.

### Phase H — Give management an exception-first control surface

Do not make management decode the whole operation from the Board. Build a concise dashboard that prioritizes:

- overdue and at-risk SLA;
- work awaiting internal decision;
- work waiting on the client;
- due-soon items;
- team workload/assignment pressure;
- client/package progress;
- recent approvals, deliveries, and meaningful audit activity.

Provide a scoped client switcher and client profile with identity, contract/package progress, deliverables, allowed files, and activity. All aggregates must respect the same tenant/client/role scope as detail queries.

Management must be able to enter the same universal deliverable drawer and perform only the actions granted by the verified role matrix.

### Phase I — Prepare meaningful Hadna and Glass UAT data

#### Hadna

- Preserve the existing online Hadna records unless a reviewed import correction is required.
- Verify the current count and relationships instead of hard-coding an assumed count.
- If an authorized richer Hadna source is available locally or through the existing controlled UAT materials, map its content/caption/channel/media metadata idempotently.
- Do not invent missing Hadna captions, images, approvals, or decisions.
- Where media is missing, use the designed generic content-type/channel fallback.

#### Glass

Inspect the workbook read-only. The prior audit observed:

- a first sheet containing fifteen content/deliverable rows with phase, date, channel, format, description, goal, KPI, content, caption, approval-like source columns, design link, suggestions, and readiness information;
- a second sheet containing seven internal marketing-tool/acquisition rows with timing, target/actual values, and status.

Verify these observations against the workbook before import.

- Import valid first-sheet rows as Glass UAT deliverables/content versions under the correct tenant/client and contract/package scope.
- Map only meaningful non-empty values. Preserve Arabic text and dates. Record source-row identity through a non-sensitive deterministic import key so reruns are idempotent.
- Treat spreadsheet approval columns as legacy source notes only. Never create platform approval decisions from them.
- Validate design links and files before use. Do not fetch or expose a private link without authorization. A blank or hyphen remains no asset.
- Represent valid second-sheet rows as team-only execution checklist/tasks or scoped internal work associated with Glass. Do not expose them to the client and do not create a new marketing analytics/CRM module.
- Use a generic import implementation that does not embed workbook content, client captions, emails, hosted IDs, or credentials in committed source.
- Run a local dry-run first, then local import/verification, then a reviewed UAT import with a unique run ID and tested rollback.
- Commit only import code, schemas, tests, redacted field mappings, and category/count evidence. Keep the workbook and extracted content out of Git.

#### UAT account and navigation cleanup

- Map the approved management, account manager, assigned writer, assigned designer, unassigned negative tester, client viewer, and client approver personas to meaningful Hadna/Glass scopes.
- Normal product surfaces should show Hadna and Glass, not Alpha/Beta negative controls.
- Keep negative-control data isolated for tests and explicit negative UAT only.
- Prepare concise team onboarding instructions and role mapping without credentials or direct hosted URLs in Git.

### Phase J — Security, credential, and hosted preflight

Treat any UAT credential previously printed into a browser/tool transcript as compromised.

Before continued hosted workflow UAT:

1. Identify the affected UAT-only account category without reproducing its secret.
2. Rotate the credential using the approved UAT Auth path.
3. Update only the existing Git-ignored local UAT credential file or another already approved secure local store.
4. Never print the new value, place it in shell history, commit it, include it in evidence, or send it to a browser log.
5. Validate sign-in and role scope after rotation.
6. If no safe local store exists, create an ignored owner-readable local credential handoff file, verify ignore rules before writing, and mention only its path/category in the final handoff.

Before any hosted database or storage mutation:

- positively identify the Supabase UAT target through redacted fingerprints;
- prove it is not Production;
- compare migration state;
- inspect generated SQL and affected tables/policies/functions;
- run clean local reset and full database tests;
- rehearse rollback or compensating cleanup;
- define run ID, executor, rollback owner, window, stop authority, expected effect, and verification query categories;
- abort on unexpected target, destructive drift, policy regression, cross-scope result, or unredacted secret/client data.

### Phase K — Verification and visual QA

After the final implementation change, run the repository's actual scripts and record exact results. The expected matrix currently includes:

```powershell
npx supabase@2.107.0 db reset --local --no-seed
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:rls:simulator
npm run test:rls:db
npm run test:e2e
npm run test:e2e:persistent
npm run secret:scan
git diff --check
npm run build
```

Verify every command against `package.json` before use. Do not silently omit a failed or unavailable gate.

Required automated regression coverage includes:

- Client A cannot read Client B deliverables, files, comments, approval links, aggregates, or storage objects.
- A client cannot read an `in_progress`, internal-review, internally rejected, or otherwise unsent deliverable/version.
- Client home, pending count, pending inbox, commercial summary, and direct detail access agree.
- A client viewer cannot approve or request changes.
- A client approver can decide only the exact currently visible version.
- A stale version, old link, direct endpoint, duplicate submit, and cross-scope ID are rejected safely.
- An assigned team member can execute permitted actions; an unassigned member cannot.
- Writers/designers cannot internally approve, send to client, make client decisions, or deliver unless the role matrix explicitly grants it.
- Internal comments, quality notes, internal tasks, internal files, and private activity are absent from client payloads and markup.
- File upload, metadata, visibility, preview/download, versioning, signed access expiry, invalid type/size, and cross-client denial work.
- State transitions, terminal states, idempotency, audit append-only behavior, exact-version integrity, package ledger, and rollback behavior work.
- SLA starts, pauses while waiting for client, resumes on requested changes, and completes on delivery.
- Board grouping and drag/drop cannot bypass the state machine and roll back on persistence failure.
- Raw IDs never render as user-facing assignees.
- Hadna/Glass imports are idempotent, scoped, count-verified, and reversible by run ID.

Run live Preview/UAT acceptance with real Auth cookies and the full persona matrix:

- management;
- account manager;
- assigned writer;
- assigned designer;
- unassigned internal negative user;
- client viewer;
- client approver;
- second-client/tenant negative user where configured.

Exercise the complete Browser → Auth → Next.js → server command/RPC → PostgreSQL/RLS/Storage path. Fixture mode and impersonation must be off.

Perform visual QA on representative Arabic RTL desktop and mobile viewports for:

- sign in and sign out;
- shell/sidebar/header/user menu;
- management dashboard;
- client switcher/profile;
- team `مهماتي`, List, and Board;
- all card variants and macro-lanes;
- universal drawer tabs;
- caption/content with long Arabic text and mixed Latin links/numbers;
- image/video/PDF/generic previews;
- upload progress/failure/success;
- comments and visibility selection;
- approval inbox and decision bar;
- empty, loading, skeleton, error, permission-denied, at-risk, overdue, waiting-client, and delivered states;
- keyboard traversal, visible focus, drawer focus trap/return, drag alternative, and reduced motion;
- touch targets and unexpected horizontal overflow.

Use browser screenshots for comparison and defect discovery. Commit only synthetic/redacted images. Keep screenshots containing Hadna/Glass content outside Git and record category-level evidence instead.

### Phase L — Preview deployment and real team-only UAT

When all pre-push gates pass:

1. Review the complete branch diff and migration inventory.
2. Make intentional incremental commits; exclude the Glass workbook and all local secret/handoff files.
3. Push the existing branch normally.
4. Update the existing Draft PR; do not merge.
5. Inspect CI and fix only in-scope failures.
6. Apply reviewed pending migrations only to the verified Supabase UAT target.
7. Run the reviewed Hadna/Glass UAT imports with run IDs and count/category verification.
8. Deploy or update Vercel Preview/UAT only.
9. Verify the Preview is bound to UAT, not Production, and has no fixture/service-role exposure.
10. Run the full hosted persona journey and negative isolation matrix.
11. Rehearse the no-op/rollback path and verify cleanup boundaries without destroying accepted UAT data unless rollback is required.
12. Burn down defects and rerun the affected regression plus the final smoke matrix.

The team trial is ready only when the workflow is understandable without developer guidance beyond a short onboarding note. If users need to know hidden test concepts, raw states, database IDs, or direct URLs to complete ordinary work, the UX gate is not a PASS.

## 9. Defect burn-down rules

Maintain one defect register with:

- ID;
- severity;
- affected role;
- affected workflow;
- reproduction;
- security/data impact;
- owner;
- fix status;
- regression test;
- evidence reference.

Rules:

- P0/P1 defects block completion and H008/H009/H010 closure.
- P2 defects require an explicit owner disposition.
- P3 defects may be deferred with an explicit rationale.
- `implemented` is not `verified`.
- Local PASS is not hosted PASS.
- A visual workaround is not a security fix.
- A hidden UI element is not an authorization policy.
- Do not change a blocked result to pass because a different test passed.

## 10. Documentation and handoff

Update all behaviorally affected documents, including:

- `docs/PROJECT_PROGRESS.md`;
- relevant release and deployment documents;
- product and role journeys;
- `docs/03-ux/` and root `DESIGN.md`;
- roles/permissions and client portal permissions;
- schema/data model and RLS/storage policy matrix;
- file, comment, audit, SLA, approval, package, and rollback documentation;
- Spec 015 traceability, tasks, gate status, execution log, and defect register;
- internal team onboarding/UAT script;
- independent expert-review prompt.

Do not generate another master plan as the next step. The handoff should describe the ready team trial, exact remaining boundary, and how to report defects.

The independent review must be findings-first and cover security, tenancy, roles, RLS/storage, audit, SLA, exact-version approvals, files, comments, UX, Arabic RTL, accessibility, performance, tests, documentation, migration/rollback, hosted evidence, and release readiness.

## 11. Required final response

The final response must lead with one of these exact states:

- `HOSTED_TEAM_UAT_READY`
- `HOSTED_TEAM_UAT_BLOCKED`

Then include:

- Summary.
- Outcome for management, team, client viewer, and client approver.
- Files changed.
- Specs/plans/tasks updated.
- Design system and UX changes.
- Dependencies added/changed and why.
- ADRs added/updated, or explicitly none.
- Migrations/RLS/storage changes.
- Hadna/Glass import result using categories, counts, and run-ID references only.
- Hosted actions performed.
- Branch, commits, Draft PR, CI, and Preview status without exposing sensitive URLs when evidence policy forbids it.
- Tests added/updated.
- Exact verification results.
- Defect register summary by severity and state.
- SaaS/tenant/client/assignment isolation findings.
- File/comment/approval/audit/SLA/idempotency findings.
- UX/RTL/mobile/keyboard/accessibility findings.
- Credential rotation outcome by category only.
- Rollback/no-op result.
- Remaining risks and owner-dispositioned P2/P3 items.
- Out-of-scope work.
- Production boundary.
- `AGENTS.md` compliance checklist.
- A short team onboarding path and trial scenario, without credentials or direct secrets.

Do not claim MVP completion, Production-candidate readiness, Production acceptance, or hosted PASS while any required P0/P1 issue, client visibility gap, isolation gap, approval bypass, audit gap, file-access gap, mandatory verification blocker, or incomplete H008/H009/H010 gate remains open.

## 12. Final reminder

The target is not “a better-looking board.” The target is a coherent operating product:

```text
Meaningful Hadna and Glass work
→ assigned team execution
→ internal collaboration and version upload
→ internal review and exact-version approval
→ safe client preview and decision
→ SLA-aware delivery
→ files, audit, package usage, and closure
```

It must feel deliberate and professional at every role boundary while remaining secure, persistent, auditable, accessible, and inside Samawah V1.
