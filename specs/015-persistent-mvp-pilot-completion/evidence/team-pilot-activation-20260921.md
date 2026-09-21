# Team pilot activation — 2026-09-21

## Authorized outcome and scope

Owner explicitly authorizes completing all prerequisites for a new team trial, including Preview publication and the five named accounts in the private owner guide. This is a bounded continuation of Spec015, not Production release. Use existing Next.js/Supabase architecture. Auth administrative key may be obtained and consumed in memory only, never saved or printed.

## Requirements and acceptance

- Create one isolated run-scoped UAT tenant and a clearly synthetic Alhussam training client. Do not expose legacy UAT/customer rows or consume any real contract.
- Provision the five exact owner-listed emails with individual passwords and active scoped memberships; one identity for Bashayer. Give the writer/designer/client only training-client access. Account existence, password authentication, application entry and authorization must each be verified.
- Complete the existing project_manager role in the application catalog, consistent with existing database authority. Project manager manages work, reviews internally and sends to client; it must not gain tenant ownership or user-access administration. Record the exact capability boundary before implementation.
- Use the existing audited workflow for training deliverables, versions, tasks, approvals, SLA and delivery. Preserve internal/client separation and cross-tenant denial.
- Reviewed source must pass local relevant tests and exact-source CI (including real DB/RLS and persistent browser) before migrations and Preview publication.
- Verify new Preview, all five role sessions, assignment, persistence/reload, client secrecy and a synthetic full lifecycle. Hand off a clean training work item, owner-only credentials and separate role guides with accurate result status.
- Human usability acceptance is reserved for the actual team; never claim it was performed by automation.

## Execution plan

1. Inspect source/CI, UAT identity/migration inventory and exact email existence (read-only).
2. Test-first complete bounded project-manager support and review the permission delta.
3. Run relevant local regression, commit/push reviewed files; await full CI.
4. Apply only reviewed pending forward migrations on sharik-uat, publish Preview from tested source.
5. Provision isolated training records and five accounts with auditable, idempotent run bindings; store only member passwords in ignored owner-only handoff, never the service key.
6. Authenticate each account through Auth and the application, exercise positive/negative workflow boundaries, inspect desktop/mobile.
7. Update guides, gate evidence and private credential handoff. Retain exact blockers if any.

## Rollback and stop boundary

Owner is rollback/stop authority; rollback window is this preparation and initial trial. Rollback disables only memberships created for this run and removes/reverts only its Preview alias. Preserve append-only audit and ledger; no legacy business deletion, no schema down migration. Stop on target mismatch, cross-tenant/internal leakage or uncertain partial mutation; report exact state. No emails or external invitations are sent by this task.

## Preflight evidence

- Source 598dec83950a4f1377adde8b8cddb7f2633c0a87 has successful full CI run35505897129.
- Supabase linked project sharik-uat is ACTIVE_HEALTHY, with four pending reviewed-source migrations (202609100003, 202609100004, 202609150001, 202609200001).
- Auth read confirms none of the five intended email identities currently exist.
- Existing working tree has only unrelated untracked .delegate_runs; preserve it.

## Ledger

The initial plan was executed through the dated checkpoints below. Final readiness is determined by the latest verification checkpoint, not the historical pending notes.

## PM capability ruling — 2026-09-21

Use active tenant membership plus client-scoped project_manager. Permit assigned-client/commercial reads, ordinary deliverable creation/cancellation, status/version execution, task assignment, internal review/approval, send and delivery, and SLA summaries. Deny tenant-wide client discovery/creation, commercial setup/adjustment, approved-extra creation, client decisions, user invitations/role changes/suspension. Bashayer retains tenant administration. Existing admin may assign/invite a client-scoped PM; PM cannot administer users. Align foundational RLS and member-profile reads in one forward migration and document ADR014. Unknown DB roles fail closed instead of throwing. This follows existing operational management authority without changing workflow/SLA or tenancy model.

### Execution checkpoint — 2026-09-21

- Preflight Auth inventory PASS (exit0): five requested identities and three supplemental synthetic QA identities are absent. No accounts or hosted records mutated yet.
- PM local unit/integration/RLS-simulator 734 PASS, component418 PASS, TypeScript PASS, secret scan PASS. Independent source review found no production defect; authenticated PM workflow pgTAP coverage is being completed before CI.
- Normal local ESLint enumerated unrelated ignored `.superpowers` worktree copies (all 176 reported file paths under that directory); rerun against current source excluding only `.superpowers/**` and `.delegate_runs/**`. This is a local workspace verification adjustment, not an ESLint product-rule change. CI checkout does not contain those ignored copies.
- Vercel CLI is logged into a different personal account; browser session samawahpod-2242 has verified access to the existing samawahs-projects/shrik Preview. Existing Preview598dec8 is Ready. Publish only after new-source CI via a dedicated Preview branch in the already connected repository; do not change Production or the main work branch deployment hold.
- Operational provisioning reviewed and corrected: Auth preparation separated from single-transaction membership/profile/audit activation; exact run-owned rollback disables tenant/client memberships and roles, preserves Auth identities and append-only history. Credential manifest uses atomic writes in a private ignored directory with ACL limited to owner and sandbox identity. Administrative keys remain in stdin/process memory only. Rollback is terminal for this run; no automatic reactivation.

### TP21-2 local implementation and review

Project-manager catalog, scoped reads, ordinary creation, invitation and role-edit alignment are implemented with ADR014 and forward migration202609210001. Independent review compared all seven replaced SQL functions to latest prior bodies: only intended allowlist/scope deltas; no production defect found. Review requested authenticated PM workflow coverage, now present (36 pgTAP assertions including review/send/delivery and client-decision denial), still awaiting real database CI.

Final local checks: unit/integration/RLS simulator736 PASS, component418 PASS, TypeScript PASS, source ESLint PASS (excluding only unrelated ignored local worktree folders), secret scan PASS, production build PASS, diff check PASS. Hosted five-role access smoke authored and linted but NOT EXECUTED. No hosted account or data mutation, new migration application or new deployment yet.

### CI correction and identity preparation

Full CI on f722669 exposed fixture mistakes in the new pgTAP workflow: task creation passed an ID (selecting update), the selected tenant-owner-only assignee was ineligible, and delivery used an older RPC bypassing the required preparation trigger. Test-only commit f731812 follows current application RPCs, adds an eligible client-scoped designer, checks persisted assignment/preparation, and asserts unprepared delivery denial (40 assertions). Run35575600400 passed real DB/RLS and is continuing browser gates; no migration or publication yet.

Auth-only preparation completed successfully while browser CI runs: five owner-authorized identities plus three synthetic QA identities created in sharik-uat; password authentication verified for each. No application membership/role grants were performed. Passwords reside only in the ignored ACL-restricted private manifest and member environment file. Service key consumed through stdin/process memory, never persisted or logged. Credential-free transactional activation and exact run rollback SQL generated and reviewed. A dry run shows exactly five pending reviewed migrations, including202609210001.

### Hosted activation and Preview

- Full exact-source CI PASS: f7318122f64a847e30c34eac1f09658b4cd322cf, run35575600400. Real PostgreSQL1085 assertions; component418; fixture browser284 passed/37 skipped; persistent browser24 passed; lint/types/unit/integration/secret scan/build all passed.
- Five reviewed UAT migrations applied successfully. Follow-up dry run reports upToDate=true and no pending migrations.
- Transactional activation completed for the isolated tenant/client. All eight identities passed password sign-in, exact active membership/role/client-assignment checks, expected client read and zero foreign-client reads. This includes the five human participants; three extra accounts are synthetic QA only.
- Prepared synthetic contract/package (three count units), two ordinary deliverables and four assigned tasks through authenticated admin/PM RPCs. Writer submitted training content; PM internally approved and sent the second item. Result: first in_progress, second waiting_client_approval. Re-execution PASS without duplication; run-bound date anchor and submission reconciliation are verified.
- Git push alone did not start a Vercel build. Browser-authenticated Create Preview Deployment used codex/preview-team-pilot-20260921 and displayed the exact tested SHA. Deployment dpl_6WS6bPRhcTymLJNPADiFfqEHU6Uc Ready; immutable URL https://shrik-a5et0qaoa-samawahs-projects.vercel.app and branch URL https://shrik-git-codex-preview-team-pilot-20260921-samawahs-projects.vercel.app. No Production promotion.
- Existing in-app browser session reaches the new sign-in page. This did not prove anonymous access: independent Playwright later reached Vercel login. Initial local hosted test run did not launch because Playwright chromium-headless-shell1228 was missing; official matching browser installed successfully. These launch failures are not application-login results.

### External-access gate — pending owner decision

- Independent desktop browser was redirected to Vercel login before the application's email field. Stopped the 15-role/device run after the first confirmed infrastructure failure; no successful hosted application-login or lifecycle claim is made.
- Prepared the deployment Share menu. Current setting is Only people with access; proposed Anyone with the link is limited to this Preview, with application authentication/RLS retained. Browser tool policy requires action-time confirmation for changing an authentication barrier; requested owner decision asynchronously. No sharing change performed while pending.
- Corrected hosted test password locator to exact accessible label: password inputs do not have an implicit textbox role. Test helper only; deployed application source remains f731812. Scoped ESLint PASS.
- Authenticated training read verification PASS for all five real participants: internal actors see two training items and four tasks (two assigned to each writer/designer), client sees only the sent item and no internal comment. PM confirms active SLA segment paused_waiting_client. This is API/data evidence, not a substitute for pending hosted browser lifecycle.
- Owner-only password table and five individual credential cards generated in ACL-restricted ignored directory. No invitation email or password email sent. Human usability acceptance remains pending actual team use.

### Approved sharing and role-browser checkpoint — 2026-09-21

- Owner explicitly approved the pending Vercel sharing action. Enabled Anyone with the link for the immutable Preview deployment dpl_6WS6bPRhcTymLJNPADiFfqEHU6Uc at source f731812. The newly generated share URL replaces the older share link and is kept only in ignored handoff files. Application authentication remains required.
- Fresh Playwright browser contexts reached the app through the share URL, without Vercel account login. Five real participants × desktop/mobile/Arabic RTL = 15 PASS in 1.9 minutes, including reload, authorized landing, no horizontal overflow and restricted route checks.
- Internal roles display their expected account label. Client identity is verified through exact Auth credentials; its UI verifies the intended client scope and redirects from management routes. The client shell does not display the internal account-identity component.
- Role test corrected to follow the existing client shell and redirect behavior; no application behavior changed. Hosted lifecycle test selects all authorized work explicitly instead of relying on the action-required default, including the unassigned negative check. It waits for version-save feedback and workflow redirects before ending a session.
- Full hosted lifecycle remains in progress at this checkpoint. Role HTML report retained under ignored tmp/team-pilot-20260920/role-access-passed-20260921. No email or password message has been sent.

### Final verification and handoff — 2026-09-21

- Hosted full lifecycle PASS (1 test, 3.1 minutes) on the shared immutable f731812 Preview: assigned task update, version submissions, internal correction/quality approval, internal comment/file secrecy, failed upload recovery, client revision request, SLA pause/resume, processed stale-version decision denial, current-version approval, prepare/deliver and exactly-once audit/ledger, terminal-state denial, authorized final-video preview metadata and viewport checks.
- Updated only hosted test mechanics: wait for persistence before closing each actor session, observe the actual stale-version POST regardless of transport headers, select authorized-work scope, and locate the current client-file preview dialog after hydration. A generated 32x32 WebM replaces fake text bytes for the final media fixture. Preview assertion proves loaded dimensions, not human playback acceptance. Independent test review found no blocking regression; scoped ESLint and diff checks PASS.
- Report retained at ignored tmp/team-pilot-20260920/lifecycle-passed-20260921. Earlier failed runs are historical diagnostics, not successful evidence.
- One interrupted test fixture was hidden with the same run-tag transition as test teardown; no business history deleted. Original two training items, four assignments, client secrecy and waiting-client SLA reverified PASS for all five real participants after tests.
- Owner credential table and five individual cards match the approved share URL and exact credentials; passwords are excluded from guide sources and Git. Guides include owner/team/client instructions, verification report, human-session checklist, two sample text files and a generated sample video. Human checklist stays uncompleted until actual team use.
- Ready for the bounded team trial. No invitation or password message sent, no Production deployment, no merge. Existing QA commercial contexts are explicitly distinguished from the named three-unit training package. No claim about inbox delivery or legacy UAT investigation closure.
