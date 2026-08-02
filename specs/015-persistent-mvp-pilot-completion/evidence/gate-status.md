# Spec 015 gate status

## X010-B-5 file experience local complete — 2026-08-02

`X010_B5_CI_GREEN_UAT_PENDING`. Final application HEAD
`e47c810d57bb0346dcd975ef76bdc0f9075ea70b` on
`codex/015-persistent-mvp-pilot-completion`. Bounded to Spec 015 only; no new
Spec/ADR/dependency/migration; no workflow/RLS/permission/audit change — B5 is
presentation only, and every file read path keeps its existing tenant/client
scope + visibility filters. **GREEN / TEAM_UAT_READY NOT declared.**

Exact-HEAD verification on `e47c810`: F-001 Quality run `30743491402` SUCCESS —
lint, typecheck, unit 67/342, integration 28/112, clean Supabase start + reset
(all migrations through `202608010002`), RLS simulator 8/24, **pgTAP 12 files /
673 tests**, component 30/125, **fixture E2E 178** (incl. the new
`client-files-experience` desktop/mobile/RTL/keyboard + Client A≠B spec),
**persistent E2E 18/18**, secret scan, build. Vercel
`2JGvwkkjYc4QRfH6JVFUeeN5aMSR` Ready in `samawahs-projects/shrik`; CodeRabbit
SUCCESS. File isolation/visibility/download remain covered by the existing
pgTAP (`s015_persistent_mvp_behavior`, `s015_upload_authorization_hardening`);
the deliverable-name join inherits `deliverables` RLS.

Scope delivered (S015-P2-120 → `technical-fixed; CI-verified; final-owner-UAT-pending`):
- Client files `/client/files` retitled «ملفاتي» and rebuilt as grouped folders
  (final / review / uploaded / contract) with counters, empty states, image
  thumbnails, safe inline video/PDF preview, honest fallback, keyboard-
  openable cards, and «تنزيل» via a short-lived server-signed URL. No
  Storage/bucket/UUID/visibility-enum leak.
- Team/admin drawer files grouped by visibility context (internal / sent /
  client-uploaded / final). Internal secrecy + final-delivery authorization +
  stage-for-client unchanged.
- Upload Arabic states incl. «أُلغي»; retry + audited cancel + X010-A durable
  behavior preserved. «تنزيل آمن» → «تنزيل» everywhere.
- Tests: unit `file-groups`, component `client-files-board`, fixture E2E
  `client-files-experience`.

Boundary: no Production/merge/hosted-migration/team-invitation. X010-A-9 /
S015-P1-111 / S015-P1-112 remain `code-fixed + CI-green + hosted-blocked`.

## X010-B-4 exact-HEAD CI GREEN — 2026-08-02

`X010_B4_CI_GREEN_UAT_PENDING`. The first exact-HEAD CI run on the consolidated
B2/B3/B4 head (`c79a2e1`) exposed a chain of pre-existing DB-test/migration
defects that had never reached CI before (B2 and B3 were local-complete only).
Each was root-caused and fixed inside Spec 015 without weakening any security
or correctness expectation; no P0/P1 was papered over. Final application HEAD
`b4726cfa1b4c9f5a7d507d97549ac781af056777` on
`codex/015-persistent-mvp-pilot-completion`.

Exact-HEAD verification on `b4726cf`:
- GitHub `F-001 Quality` run `30741184814` — SUCCESS. Full matrix: npm ci,
  lint, typecheck, unit 66/333, integration 28/112, clean Supabase start +
  `db reset --local` (all migrations through `202608010002` applied), RLS
  simulator 8/24, **pgTAP 12 files / 673 tests** (incl.
  `s015_x010b4_in_app_notifications`, `s015_x010b2_client_contact_phone`,
  `s015_x010b3_client_change_request_visibility`, and the corrected
  `a1r_rls_foundation`), component 29/119, fixture E2E, **persistent E2E
  18/18** (incl. the `s015-notifications-journey` send-to-client + task
  scenarios and the `s015-deliverable-creation-journey`), secret scan, build.
- Vercel deployment `5fEXUfcYWVJREfMFE2eHmATJ8Fpd` — Ready/SUCCESS in the
  correct `samawahs-projects/shrik` Preview project.
- CodeRabbit — SUCCESS.

CI specifically proves the B4 acceptance points the task required: migrations
apply through `202608010002`; full pgTAP including
`s015_x010b4_in_app_notifications`; the persistent notifications journey
(real browser → PostgreSQL); tenant/client A/B isolation; revocation denial
through the list/count/mark RPCs after client-scope revocation; and
viewer/approver recipient copy/route separation.

Corrective commits layered on top of `c79a2e1` (each pushed and re-verified on
exact HEAD): `93fb737` (pgTAP drift: a1r 8-param signature, B2 expectations,
B2 cross-tenant 42501, B4 review-payload fixture), `925416d` (ambiguous column
qualification + B4 pgTAP errmsg), `2cc75a7`/`7986b96` (pgTAP errmsg
exact-match), `2375ca3` (service_role SELECT grant on `public.notifications`),
`bf44edf` (persistent creation journey opens the B3 progressive-disclosure
`<details>`), `8be9182`/`b4726cf` (persistent notifications journey uses the
proven assigned-writer-submits + management-approves-and-sends workflowStep
flow with the `راجعت النسخة والملفات` confirmation gate).

Boundary: no Production, no merge, no hosted migration apply, no team
invitation, no `TEAM_UAT_READY` or Hosted-UAT claim. The approved non-
Production UAT credentials remain unavailable in this workstation, so the B4
corrective hosted UAT and X010-A-9 / S015-P1-111 / S015-P1-112 hosted closure
remain `code-fixed + CI-green + hosted-blocked`. **GREEN for the corrective
hosted slice is NOT declared.**



`X010_B4_CORRECTIVE_LOCAL_COMPLETE_DB_CI_UAT_PENDING`. Started from mandatory HEAD
`fc5b414397e730bc32f4a59c392195457ee819df`; clean worktree confirmed before
work. Bounded to Spec 015 only; **no** new Spec/ADR/dependency, **no** email /
WhatsApp / push / cron in this slice, **no** push/deploy/Production/hosted
migration/merge/invitation. **GREEN / TEAM_UAT_READY are NOT declared.**

Corrective review closed the local implementation defects S015-P1-129/130/131
and S015-P2-129/130 in code and expanded regression coverage. Client recipients
are now resolved from each candidate's active membership and role; one
current-user scope predicate protects RLS plus all SECURITY DEFINER read/mark
RPCs after client-scope revocation; the migration's invalid loop terminator was
fixed; viewer/approver copy and management/execution action links are role-safe;
legitimate repeated task reassignment is not suppressed; and relative times use
one server render snapshot so hydration is stable. These P1 fixes remain
`code-fixed; DB/CI verification pending` because local Supabase/pgTAP is blocked.

Scope delivered (S015-P2-119 → `technical-fixed; final-owner-UAT-pending`):
- Additive migration `202608010002_s015_x010b4_in_app_notifications.sql` (after
  `202608010001`) — does not edit any historical migration file.
- `public.notifications` table: `id, tenant_id, client_id (nullable),
  recipient_user_id, event_type, title, message, action_href,
  source_audit_event_id, source_task_id, dedupe_key, read_at, created_at`;
  unique `(recipient_user_id, dedupe_key)`; CHECK-enforced `action_href`
  allowlist (`s015_notification_href_is_allowed`); read-only-except-read_at
  guard trigger; RLS recipient-only + active-tenant-member + client-scope
  defense-in-depth; **no** authenticated INSERT/DELETE grant.
- Atomic emission with the existing audited workflow: SECURITY DEFINER
  `AFTER INSERT` trigger on `audit_events` fans out `DeliverableVersionSubmitted`
  → management; `DeliverableInternalChangesRequested` → owner + execution
  contributors; `DeliverableVersionSentToClient` → client approver/viewer
  (client-safe copy, `/client/pending`); `ClientVersionDecision`
  approved/changes_requested → management + account manager (+ execution team
  on change request); `DeliverablePreparedForDelivery` → management;
  `DeliverableFinalDelivered` → internal + client (`/client/files`).
  SECURITY DEFINER `AFTER INSERT/UPDATE of assignee_user_id` trigger on
  `deliverable_tasks` covers assignment/reassignment → assignee. Both call a
  shared `s015_enqueue_notification` with `ON CONFLICT DO NOTHING`. The actor is
  never a recipient unless follow-up is genuinely required.
- Scoped RPCs only for read/mark: `s015_notification_unread_count`,
  `s015_list_notifications(filter, limit, offset)`,
  `s015_mark_notification_read(id)`, `s015_mark_all_notifications_read()`. No
  service role in browser or Next.js runtime.
- UI: bell + unread badge + popover (keyboard + RTL + click-outside + Escape)
  wired into `ProductShell` (management/team) and `ClientShell` (client);
  unified `/notifications` route with All/Unread filters, Arabic human copy
  (no enums/UUIDs/technical terms), real loading/error/empty states,
  per-item + mark-all-read. `action_href` is generated server-side from the
  allowlist only.

Isolation / RLS / dedupe (asserted by pgTAP `s015_x010b4_in_app_notifications.test.sql`,
DB-blocked locally): recipient-only SELECT/UPDATE; tenant + Client A/B
isolation (a Client B user cannot read a Client A notification even if one
existed); client never receives an internal notification; disabled-membership
denial (zero rows + zero unread); dedupe via `(recipient_user_id, dedupe_key)`;
mark-own-read only (cross-recipient returns false, no mutation); CHECK rejects
non-allowlisted href; read_at cannot be reverted; authenticated cannot INSERT
directly.

Local non-DB matrix PASS: lint; typecheck; unit 66/333 (new `notification-labels`
+ `notifications-read`); integration 28/112; component 29/119 (new
`notification-bell` + `notification-list`); RLS simulator 8/24; fixture E2E
12/12 new (`notifications-center.spec.ts`) + 17/17 regression
(app-shell/client-work/pending-inbox/visual-qa); secret scan; `git diff --check`
(LF/CRLF warnings only); production build (`/notifications` present).

Corrective verification also PASS: focused notification components 13/13 and
desktop notification E2E 4/4 after the hydration fix, with no hydration warning.

DB-backed gates BLOCKED locally (`LegacyDbConnectError`, Docker daemon down —
same class as prior slices): pgTAP `s015_x010b4_in_app_notifications.test.sql`
and persistent `s015-notifications-journey.spec.ts`. They run in exact-HEAD CI
and are **not** converted to PASS.

Decision recorded: email notifications are **deferred** to a separate owner
decision (S015-P2-127); X010-B-4 implements in-app only. No email dependency or
ADR was introduced.

Boundary: no push/deploy/Production/hosted-migration/merge/invitation.
X010-A-9 / S015-P1-111 / S015-P1-112 remain `code-fixed + CI-green +
hosted-blocked`.

## X010-B-3 corrective pass — 2026-07-31

`X010_B3_CORRECTIVE_LOCAL_COMPLETE_CI_UAT_PENDING`. Corrective pass from B3 HEAD
`351f370`, inside Spec 015 only; no new Spec/ADR/dependency/migration. Local
non-DB gates green; exact-HEAD CI, DB-backed gates, Preview, and owner final UAT
pending. **GREEN / TEAM_UAT_READY are NOT declared.**

Corrections delivered (no workflow/permissions/RLS change):
- **Decision date removed.** The approximate `lastDecisionAt` (from
  `deliverable.updated_at`) was deleted; no date is shown. A reliable
  client-decision timestamp needs a scoped `approval_decisions` query + client
  RLS read verification, so it is **deferred** (no approximate dates).
- **Real work detail route** `/client/work/[deliverableId]` + new
  `readPersistentClientWorkDetail` (tenant/client guard + RLS; client-visible
  statuses only; client-visible version/files/comments only; no internal data;
  approver decision buttons only at `waiting_client_approval`; viewer
  read-only; deliverable ID in href/key only, never as text).
- **Role-aware copy:** next-action depends on `canApprove`; viewer never sees
  «بانتظار قرارك» (uses «قيد المراجعة»); «تم اعتمادك» → «تم اعتماد العمل».
- **Form split** into البيانات الأساسية / تفاصيل إضافية اختيارية / إعدادات
  سير العمل (the two approval flags are now a visible fieldset with impact
  explanations, not hidden as unimportant).
- **Error vs empty:** `/client/work` shows an ErrorState on read failure and an
  EmptyState on a successful empty read; errors are not converted to empty.

Local non-DB matrix PASS: lint; typecheck; unit 64/303; integration 28/112;
component 27/106; RLS simulator 8/24; fixture E2E 154 passed / 8 skipped;
secret scan; `git diff --check`; build (`/client/work` + `/client/work/
[deliverableId]`). DB-backed gates (pgTAP, persistent E2E) environment-blocked
locally (`LegacyDbConnectError`) → exact-HEAD CI; **not** converted to PASS.

Defects: S015-P2-116/117/118 remain `technical-fixed; final-owner-UAT-pending`
(the decision-date sub-item of 117 is **deferred**, not approximated).

Boundary: no push/deploy/Production/hosted-migration/merge/invitation.
X010-A-9 / S015-P1-111 / S015-P1-112 remain `code-fixed + CI-green +
hosted-blocked`.

## X010-B-3 client terminology + أعمالي + change-request visibility + progressive disclosure — 2026-07-31

`X010_B3_LOCAL_COMPLETE_CI_UAT_PENDING`. Local non-DB gates are green on the
reviewed changes; exact-HEAD CI, DB-backed gates, Preview, and owner final UAT
remain pending. **GREEN and TEAM_UAT_READY are NOT declared.** No migration was
added or applied (no schema change), so there is no UAT-migration blocker as
with B2; the hosted boundary is unchanged.

Scope (Spec 015 only; no new Spec/ADR/dependency): a central client status
mapper (`client-labels.ts`); a new `/client/work` «أعمالي» page with clickable,
keyboard-accessible, role-aware work cards; change-requested work now **stays
visible** in أعمالي (root-cause fix: `client_changes_requested` added to the
client-visible status set) while leaving بانتظار موافقتي; clickable home
sections with CTAs/empty states; progressive disclosure in the deliverable form
(essential fields first, optional behind `<details>`); and a terminology sweep
replacing «المخرجات»/«مخرجاتي» with «الأعمال»/«أعمالي» on client surfaces.
Workflow, RLS, permissions, and audit boundaries are unchanged.

Local non-DB matrix PASS: lint; typecheck; unit 64/303; integration 28/112;
component 27/105; RLS simulator 8/24; fixture E2E 144 passed / 8 skipped (one
mobile visual-QA case was flaky and passed on isolated re-run); secret scan;
`git diff --check` (LF/CRLF warnings only); production build (`/client/work`
route present). DB-backed gates (pgTAP, persistent E2E) are environment-blocked
locally (`LegacyDbConnectError`) and run in exact-HEAD CI; the environmental
block is **not** treated as a PASS.

Defects dispositioned: S015-P2-116 (hard terminology), S015-P2-117 (work
vanishes after change request), S015-P2-118 (empty optional fields) →
`technical-fixed; final-owner-UAT-pending (X010-B-3)`. Owner notes D8/D9/D10
mirror the same state.

Boundary: no push, no deploy, no Production, no hosted migration apply, no
merge, no team invitation. X010-A-9 / S015-P1-111 / S015-P1-112 remain
`code-fixed + CI-green + hosted-blocked`.

## X010-B-2 onboarding journey simplification — corrective pass — 2026-07-31

`X010_B2_CORRECTIVE_IN_PROGRESS`. The first draft set the state to
`X010_B2_TECHNICAL_GREEN`, which was **not** accurate: the corrective changes are
**committed locally at `0e6b64d`** but had not passed exact-HEAD CI, the
pgTAP/persistent-DB gates were environment-blocked, and the Preview migration
`202607310001` had not been applied to UAT. The state stays
`CORRECTIVE_IN_PROGRESS` until the gates actually pass. **X010_B2_GREEN is NOT
declared.**

Two real defects found in self-review and fixed in this corrective pass (no new
migration; the uncommitted `202607310001` was edited in place, then committed):

1. **PostgreSQL function signature.** `client_contact_phone_input` (a defaulted
   parameter) was declared before mandatory parameters of
   `s015_onboard_first_client`. It is moved to the **end** of the parameter list
   (after `reserved_quantity_input`), still with `default null` for backward
   compatibility with named-notation callers. DROP/CREATE/REVOKE/GRANT
   signatures and the pgTAP `regprocedure` assertion are updated to the
   40-param signature (trailing `text`).
2. **Phone normalization corrupted legitimate numbers.** The prior `00`-replace
   matched `00` after any digit, corrupting numbers like `01000012345`.
   `normalizeContactPhone` now converts **only** a leading `00` prefix (`/^00/`)
   to `+`, leaves `00` elsewhere untouched, and `isValidContactPhone` uses
   `^\+?[0-9]{7,15}$`. A DB `CHECK` constraint
   (`clients_primary_contact_phone_format`) enforces the same shape at the
   column level and is covered by pgTAP (direct-insert rejection and audited-RPC
   rejection of invalid phones).

Value-preservation accuracy: the wizard preserves entered values **within the
current in-memory session** after a validation error (React state + hidden
inputs). This is **not** a durable draft that survives a page refresh; no PII is
written to localStorage.

Local non-DB matrix (run after the corrective edits): lint, typecheck, unit,
integration, component, RLS simulator, secret scan, diff check, build — see the
report below for exact counts. DB-backed gates (pgTAP, persistent E2E) remain
environment-blocked locally (`LegacyDbConnectError` / no Docker daemon) and must
run in exact-HEAD CI before any GREEN claim.

Hosted boundary: `202607310001` has **not** been applied to the approved
non-Production UAT, so the Preview is **not** asserted green against the new
schema. No Production access, no merge, no push, no deploy, no team invitation,
no `TEAM_UAT_READY`. Pushing before applying the migration to UAT would break
the Preview; the commit stays local until UAT migration + CI pass.

## X010-B-2 onboarding journey simplification — 2026-07-31 (initial draft)

`X010_B2_CORRECTIVE_IN_PROGRESS` (corrected from the initial `TECHNICAL_GREEN`).
on `codex/015-persistent-mvp-pilot-completion`. Implements the bounded onboarding
simplification inside Spec 015 only; does not touch X010-A-9, the corrective
hosted UAT, or any Production boundary.

Scope delivered:
- One primary CTA «إضافة عميل جديد» on `/clients` → the unified wizard at
  `/clients/onboard`. The competing secondary «إضافة عميل» header button is
  removed. The standalone `/clients/new` route remains for direct edit/access
  but is not the primary journey.
- Explicit Arabic labels: «اسم الشركة أو الجهة», «اسم مسؤول التواصل»,
  «البريد الإلكتروني», «رقم الهاتف / واتساب», «اسم العقد», «مرجع العقد —
  اختياري» (with helper copy), «تاريخ بداية/نهاية العقد». No technical names
  or UUIDs.
- Phone/WhatsApp: additive migration `202607310001_s015_x010b2_client_contact_phone.sql`
  adds `primary_contact_phone text` to `public.clients` and recreates
  `f001_create_client_write` (7-param), `f001_update_client_write` (8-param),
  and `s015_onboard_first_client` (with `client_contact_phone_input`) to thread
  the phone through the audited, atomic, tenant-scoped, idempotent write path.
  RLS already protects `public.clients`, so the new column inherits isolation.
  Zod normalization + validation; phone is never stored in localStorage/logs.
- Package: multiple services in one package (add/remove); integer-only for
  count units, fractional allowed for divisible units; helper copy distinguishes
  committed/reserved/consumed/remaining.
- Team: «المسؤول الرئيسي عن العمل» and «أعضاء الفريق المشاركون» with Arabic
  role labels + helper text; exact tenant/client eligibility preserved.
- Progressive disclosure: optional contract/package details behind a toggle;
  review hides empty optionals; values preserved across validation errors with
  focus on the invalid field.

Verification (local, non-DB): lint PASS; typecheck PASS; unit 63 files / 293
tests PASS; integration 28 files / 112 tests PASS; component 26 files / 97 tests
PASS; RLS simulator 8 files / 24 tests PASS; secret scan PASS; `git diff --check`
(LF/CRLF warnings only); production build PASS.

DB-backed gates (pgTAP `s015_x010b2_client_contact_phone.test.sql` and the
persistent onboarding E2E with multi-line package + phone + edit/reload) are
environment-blocked locally by `LegacyDbConnectError` / failed local PostgreSQL
connection and run in exact-HEAD CI (same class as prior slices).

Hosted boundary: no Preview migration apply, no Production access, no merge, no
team invitation, and no `TEAM_UAT_READY`. The Preview cannot be asserted green
for the new migration until `202607310001` is applied to the approved
non-Production UAT; the Preview will not be claimed green against an old schema.
Parent disposition unchanged: X010-A-9 / S015-P1-111 / S015-P1-112 remain
`code-fixed + CI-green + hosted-blocked`.

## X010-B-1 global density + navigation + clickability — 2026-07-31

`X010_B1_TECHNICAL_GREEN_OWNER_FINAL_UAT_PENDING`. B1 is **not** owner-accepted;
it is `technical-green + owner-final-UAT-pending`. Exact-HEAD F-001 CI run
`30552777038` passed and the Vercel Preview deployment
`7LXuPgu2MUb8RJNbhXigi4ZipQhK` is Ready in the correct `samawahs-projects/shrik`
project.

CodeRabbit showed `skipped` because the PR is a **Draft** — that is a skipped
review, not a review pass. No CodeRabbit review approval is claimed.

The whole exception-dashboard recent-decision row is now a single clickable link
to the scoped deliverables page (`/clients/{clientId}/deliverables`). There is
no URL deep-link that opens a specific deliverable drawer yet, so the closest
honest link is used; no claim is made that the row opens a specific deliverable
directly.

Local non-DB matrix PASS: lint, typecheck, unit 62/284, integration 28/112,
component 26/97, RLS simulator 8/24, secret scan, diff check, build. Hosted
corrective UAT remains blocked by missing approved UAT credentials; no GREEN is
declared for the corrective hosted slice.

## X010-B-1 global density + navigation + clickability — 2026-07-30

`X010_B1_LOCAL_GREEN_CI_PENDING`. First implementation slice of the Owner
Experience Rescue (X010-B), inside Spec 015 only. Started from HEAD `47b11e9`.

Phase 1 consolidated all owner notes into one triaged source-of-truth list,
corrected the HEAD/CI/hosted/X010-A-parent documentation conflict, created
X010-B + sub-tasks, and registered defects S015-P2-111 through S015-P2-123.

Phase 2 (X010-B-1) tightened shared core density tokens, made dashboard cards
clickable, fixed the raw technical status leak, contained the Kanban scroll
region, and tightened the client workspace. Local non-DB matrix PASS: lint,
typecheck, unit 62/284, integration 28/112, component 26/92, RLS simulator
8/24, secret scan, diff check, and build. Exact-head CI, Preview, and owner
visual QA remain pending.

Parent disposition unchanged: X010-A-9 / S015-P1-111 / S015-P1-112 remain
`code-fixed + CI-green + hosted-blocked`. No GREEN is declared for the
corrective hosted UAT. No hosted mutation, Production access, merge, team
invitation, or `TEAM_UAT_READY`.

## X010-A final hosted UAT closure attempt — 2026-07-30

`X010_A_CORRECTIVE_HOSTED_BLOCKED`. Final-head `6c0386dac8e474ffe6d56cacf754bc0e6d1bc939`
on `codex/015-persistent-mvp-pilot-completion`. Code review, exact-HEAD CI
(`30552777038`), Vercel Preview
(`https://vercel.com/samawahs-projects/shrik/7LXuPgu2MUb8RJNbhXigi4ZipQhK`), and
CodeRabbit were approved before the hosted closure attempt.

Hosted closure BLOCKED. Verified HEAD/branch/clean tree and probed the secure env
file through the project's read-only clean-workspace dry-run, which enforces the
owner-approved UAT hostname allowlist and target-category guard. The required
credentials are unavailable in this workstation environment (names only, no
values): `SUPABASE_ACCESS_TOKEN`, `S015_UAT_SETUP_DATABASE_URL`,
`S015_UAT_SERVICE_ROLE_KEY`, `S015_UAT_SUPABASE_URL`,
`S015_UAT_SUPABASE_HOSTNAME`, and `VERCEL_TOKEN`. No hosted migration was applied,
no hosted cancel regression ran, and no Production action occurred. S015-P1-111
and S015-P1-112 remain open; GREEN is not declared.

## X010-A corrective security checkpoint — 2026-07-30

`X010_A_CORRECTIVE_HOSTED_BLOCKED`. Follow-up correction is in progress on top
of the earlier bounded corrective slice for S015-P1-111
(durable upload authorization matrix) and S015-P1-112 (unsafe browser-supplied
Storage cleanup on cancel). Mandatory starting HEAD was
`ead81c6a4c3490281c709d5672b3333f9a824540`; final HEAD
`b6462a3449093cfd8d53622add162712ed29e679`.

Follow-up local code changes add `202607300002_s015_x010a_cancel_authorization_followup.sql`,
which narrows cancel authorization to management-in-scope or original non-management
attempt actor with fresh visibility/is_final authorization. The server action now
fails cleanup for invalid RPC-returned coordinates and never falls back to a bucket;
both UI cancel paths surface cleanup-failure feedback. Local non-DB verification
passed: lint, typecheck, unit 62/284, integration 28/112, component 25/90, RLS
simulator 8/24, secret scan, diff check, and production build. Local pgTAP/DB
verification was attempted but blocked by failed local PostgreSQL connection
(`LegacyDbConnectError`). Exact-head CI, Preview, and hosted UAT remain pending,
so the recorded gate state does not advance beyond `X010_A_CORRECTIVE_HOSTED_BLOCKED`.

Exact-head follow-up evidence: commit `c95cc0cab22ade90d879000c64827365ffbb1a92`
passed F-001 Quality run `30550689619` (`https://github.com/samawah-media/Sharik/actions/runs/30550689619`).
The run applied `202607300002_s015_x010a_cancel_authorization_followup.sql` during
clean reset, pgTAP passed 9 files / 589 tests including the hardened upload test,
and persistent E2E also replayed the new migration during its resets. PR #37 shows
CodeRabbit success and Vercel success for
`https://vercel.com/samawahs-projects/shrik/9h5w8wib3e4Cf4cDSjc5XMyNb78m`.
Hosted UAT remains blocked because approved non-Production setup credentials and
allowlist access are unavailable in this workstation; no hosted mutation or
Production action occurred.

Local non-DB matrix PASS (typecheck, lint, unit 61/279, integration 28/112,
component 24/88, RLS simulator 8/24, secret scan, `git diff --check`, build).
Exact-HEAD F-001 Quality run `30531382182` PASS on `b6462a3`: pgTAP 9 files /
578 tests (incl. the new `s015_upload_authorization_hardening` matrix and the
corrected durable scenario), persistent E2E, fixture E2E, RLS simulator, unit,
integration, component, lint, typecheck, secret scan, and build. Vercel
Preview deployment completed Ready in the correct `samawahs-projects/shrik`
project. The browser and Next.js runtime contain no service-role credential.

Authorization matrix now enforced in PostgreSQL at begin, retry, and complete
(re-checked at completion) via centralized `s015_upload_actor_kind` +
`s015_upload_visibility_allowed` + `s015_assert_upload_authorized`:
client_viewer denied all; clients limited to `client_uploaded`/`is_final=false`
on the exact visible current version; execution members limited to
`internal_only`; management-only `client_visible` (client_visible/client_approved/
final versions) and `final_delivery` (`is_final=true` + client_approved/final);
any non-`final_delivery` visibility can never be marked final. Cancel returns
the attempt's true `bucket_id`+`storage_path` from the DB row after
authorization; the server action deletes only that path, inspects `remove`, and
returns `cleanup: "completed"|"failed"` without reverting the audited cancel.

Hosted close condition BLOCKED: the corrective hosted UAT required by section 9
(apply the corrective migration to the approved non-Production UAT, run the
failed-upload/cancel/retry hosted regression, and exercise the negative role
matrix with real hosted Auth) could not be executed because the Supabase UAT
setup credential and protected Preview access are not available in this
workstation environment (same class as S015-P1-078 / S015-P2-078). Per the
task's explicit rule, no GREEN is declared and S015-P1-111/112 remain open
until the corrective hosted UAT passes. Recorded state:
`X010_A_CORRECTIVE_HOSTED_BLOCKED`.

Production, real data, merge, external invitations, public signup, and alias
promotion remain outside the boundary. No Production action occurred.

## X010-A final gate — 2026-07-29


`X010_A_GREEN`.

All X010-A-1/2/8 gates pass. Mandatory starting HEAD was
`2f72f175b41f23b753deef5f701dab481a9a7c11`. Application HEAD
`f8b363d0ac6ff86290fc025fdb7b1a220cc2ddc0` passed exact-HEAD F-001
`30479343344`; correct `samawahs-projects/shrik` Preview deployment
`dpl_8FsJYiCoiULPi9HJ7swZurXqZEW8` was Ready. Additive migration
`202607290002` is applied to healthy non-Production UAT and inventories match.

Shared hosted run `s015-hosted-lifecycle-6998e30147` proved durable failed
upload recovery after reload, server-backed send blocking, audited cancel, no
old-file substitution, exact version/file confirmation, internal secrecy,
viewer read-only, approver change request and approval, prepare delivery, final
delivery, SLA pause/resume/completion, ledger, and idempotent replay.
Persona-scope run `x010a-scope-20260729-f8b363d` rolled back and replayed to 0
active target client memberships and 0 target roles. The terminal fixture
remains hidden by its run marker because audit/ledger evidence is append-only.

Local matrix: lint, typecheck, unit 61/279 after the fixture-tool correction, integration 28/112, component
24/88, RLS simulator 8/24, clean reset, pgTAP 8/535, fixture Playwright 126
pass/6 configured skips, persistent Playwright 16/16, secret scan, diff check,
and production build. S015-P1-100/101 and X010-A-1/2/8 are closed. No open P0
or P1 remains in X010-A. Production, real data, external invitations, public
signup, Production promotion, merge, and automatic correction of `11.93`
remain outside the boundary.

## Durable upload correction checkpoint — 2026-07-29

`X010_A_LOCAL_GREEN_HOSTED_HOLD`.

Checkpoint 1 now passes locally. Additive migration `202607290002` persists
the exact upload attempt before transport, restores pending/failed attempts
after reload, audits retry/cancel, verifies the Storage object, registers only
the exact current version, and blocks send, prepare delivery, and final
delivery in PostgreSQL until the attempt is ready or explicitly cancelled.
The browser and Next.js runtime contain no service-role credential.

Complete local evidence passes: lint; typecheck; unit 275; integration 112;
component 88; RLS simulator 24; clean reset; pgTAP 535; fixture E2E 126 with
6 configured skips; persistent E2E 16/16; secret scan; diff check; and build.
The persistent journey includes failed replacement upload, durable reload
recovery, blocked send, audited explicit cancel, exact-file confirmation and
client view, approval, prepare, and final delivery.

This checkpoint started from mandatory local HEAD
`2f72f175b41f23b753deef5f701dab481a9a7c11`. X010-A-1/2/8 and
S015-P1-100/101 deliberately remain open until the new commit passes
exact-HEAD CI, the correct `samawahs-projects/shrik` Preview, the shared
synthetic hosted lifecycle, and rollback/no-op proof. No GREEN is declared;
Production and real data remain outside the boundary.

## Current X010-A checkpoint — 2026-07-29

`X010_A_BLOCKED_DURABLE_UPLOAD_AND_HOSTED_CLIENT_FIXTURE`.

Reviewer verification reopened S015-P1-100: failed/unregistered upload state is
kept only in the current browser component, so a reload or second session can
lose that intent while an older ready file remains eligible. The database gate
correctly blocks persisted `pending`/`failed` file rows, but the current upload
flow creates no row until storage upload succeeds. X010-A-1 and X010-A-2 cannot
be closed until upload attempts are durable and reload-safe.

The review also corrected the quantity implementation so only count units are
integer-only; fractional service units remain supported by the existing
numeric model. Repeated audited package corrections now receive a fresh
idempotency key, and account managers no longer receive management-only
approval/client-publication controls from the deliverables list. Targeted
typecheck and 37 unit/component tests pass; exact-head CI is still required.

Before this review, the complete local matrix passed: lint, typecheck, unit
265, integration 112, component 87, RLS simulator 24, clean reset, pgTAP 499,
fixture E2E 126 with 6 configured skips, persistent E2E 16/16, secret scan,
diff check, and build. Exact application head
`096a90e98a1664053d499e08d7a15fbbdf85a449` passed F-001 run
`30455939860`, Preview deployment `dpl_DhXioTQggg9ggAt9vJXKi5usqkvm` is
Ready in `samawahs-projects/shrik`, and additive migration `202607290001`
matches healthy non-Production UAT.

The gate remains blocked on hosted client evidence. After Vercel protection was
correctly bypassed, the bounded desktop Preview smoke passed 7/9 checks
(boundary, admin, account manager, writer, designer, and unassigned denial).
Both client personas authenticated, but their current scopes contain no pending
approval detail, so the approver/viewer assertions cannot exercise an exact
client payload. The mutation lifecycle harness also failed closed before seed
because the current internal and client personas do not share one approved
client scope. No UAT role, membership, owner record, or existing data was
rewritten to manufacture a pass. X010-A-1, X010-A-2, and X010-A-8 remain open and no GREEN or
team-readiness claim is made.

Production, merge, Production promotion, public signup, external invitations,
real-data smoke, deletion of UAT history, and automatic rewriting of the
existing `11.93` value remain outside the authorized boundary.

## Authoritative current decision — 2026-07-26

`X009_D_GREEN_OWNER_CORE_LIFECYCLE_COMPLETE`. The owner's image-only deliverable completed the full protected Preview/UAT journey: management rendered the real 1600x1600 current-version image, staged the exact file through an audited idempotent command, proved both client personas could not read it before send, sent it to the client, verified approver/viewer role separation and internal-data secrecy, recorded exact-version client approval, delivered it, and verified the client final-files route exposes one `final_delivery` file with preview/download while the approval inbox is empty. Client UAT personas were attached only to the owner-created client through a guarded run-ID-scoped UAT tool with dry-run, idempotent replay, status, rollback, audit, target-category, hostname, and Production refusal controls.

- Exact code head `fbee205bf9dddb0ebd9594127729f63c94de2efd` passed F-001 run `30214571221`: install, lint, typecheck, unit 263, integration, clean Supabase reset, RLS simulator, pgTAP 494, component, fixture E2E, persistent E2E, secret scan, and build.
- Vercel deployment `dpl_7sqY7k4FM79JDUSrbA57kUvFjR9p` is Ready on the correct `samawahs-projects/shrik` Preview project and exact commit.
- Additive migrations `202607260001` and `202607260002` are applied to healthy non-Production `sharik-uat`; local and remote migration inventories match.
- S015-P1-099 is fixed. X009-D is closed. S015-P2-098 remains openly dispositioned for onboarding/navigation simplification.
- Formal wider-team invitation remains gated only by the owner's explicit human acceptance of the remaining UX disposition under S015-P1-063/X008-H. Production, PR merge, public signup, external-client invitation, and Production acceptance remain untouched.

All status sections below are chronological evidence. Where they conflict, this decision and the current `tasks.md` X009-D state govern.

## Previous authoritative decision — 2026-07-22

`X009_C_GREEN_OWNER_CAN_CREATE_FIRST_CLIENT`. S015-P1-097 is fixed and verified. The first-client wizard now commits client, contract, package, selected-team client scope, and first deliverable in one PostgreSQL transaction; failure rolls back the complete graph, and replay is bound to stable business payload. Exact code head `1547621454620c0eebb0343ed94ba91b2a53b122` passed F-001 run `29907779138`: unit 259, integration 112, RLS simulator 24, pgTAP 476, component 79, fixture E2E 126, persistent E2E 16, secret scan, and build. Migration `202607220001` is applied to healthy non-Production `sharik-uat`; the protected official Preview is Ready, the owner's partial attempt was completed forward with one audited deliverable/reservation/ledger entry, management sign-in/data/wizard/team-directory checks passed, and hosted invalid-assignment rollback left zero partial rows.

- Branch: `codex/015-persistent-mvp-pilot-completion`; X009-C adds the onboarding schema, orchestrating server action, wizard component, wizard page, member directory helper, and full test coverage on top of the X009-B head.
- Wizard model: 5 input steps (client info, contract, package lines, team assignment, first deliverable + SLA) + review/submit, all in a single `<form>` with hidden inputs; per-step client-side validation; single server action submission; idempotent replay via run-ID-derived keys.
- All mutations are tenant-scoped, RLS-protected, payload-idempotent, and audited inside one onboarding transaction that composes the existing client, contract, package, and deliverable RPCs.
- One additive migration; no new dependency or ADR.
- Production boundary: no Production deployment, alias, environment change, merge, public signup, external-client invitation, real customer data, or audit/ledger deletion occurred.

All status sections below are chronological evidence. Where they conflict, this authoritative decision and the current `tasks.md` X009-C state govern.

## Authoritative decision before X009-B — 2026-07-21

`X009_A_GREEN_READY_FOR_NEXT_CHECKPOINT`. Product/database/hosted verification is green. Corrective exact-head CI run `29837663256` passed the complete matrix, including all seven persistent scenarios followed by the final production build, and verifies S015-P1-092.

- Branch: `codex/015-persistent-mvp-pilot-completion`; application correction `9c8af15` is pushed to the official GitHub repository.
- Root cause: the new-deliverable form's free-text `ownerUserId` and `contributorUserIds` inputs forwarded non-UUID values (for example a person's name) to the audited RPCs; PostgREST rejected the uuid cast with `22P02` and the action mapped every non-23505/42501/P0001 code to the generic fallback. No partial row, authorization bypass, or RLS weakening was involved.
- Corrective fix: retain safe Arabic error mapping, replace raw UUID fields with scoped names/roles, and add migration `202607210001` to deny owner/contributor values that are not active eligible internal members in the exact tenant/client scope. No dependency or architecture change.
- Corrected local matrix PASS: lint; typecheck; unit 56 files / 230 tests; integration 28 files / 112 tests; component 21 files / 72 tests; RLS simulator 8 files / 24 tests; clean local Supabase reset; pgTAP 6 files / 436 tests; persistent creation 3/3; secret scan; diff check; and build.
- Hosted status: non-Production guard passed; migration `202607210001` applied and remote inventory matched local. Preview `shrik-qfr3bpyw3-samawahs-projects.vercel.app` is Ready/Preview. Real Auth/browser creation produced one correctly assigned deliverable, one allocation/reservation, and audit evidence; audited cancellation released the reservation and left zero active run-scoped records.
- Owner-approved Spec 015 clarifications are incorporated into the canonical spec; no parallel plan or Spec was created.
- Credential hygiene: the temporary UAT administrator credential surfaced in a private browser diagnostic, was immediately rotated, and was not committed or recorded in project evidence.
- Production boundary: no Production deployment, alias, environment change, merge, public signup, external-client invitation, real customer data, or workbook tracking occurred.
- Remaining gate: none inside X009-A. H008-H010/X007/T032/X008-H remain unchanged.

All status sections below are chronological evidence. Where they conflict, this authoritative decision and the current `tasks.md` X009-A state govern.

## Authoritative decision before X009-A — 2026-07-20

`HOSTED_TEAM_UAT_READY_FOR_OWNER_TRIAL`.

- Corrected application and test-harness head: `220ec0ce90888de6c14c67f67e2bb4ca2758eb08` on Draft PR #37, unmerged.
- Exact-head CI: GitHub Actions `F-001 Quality` run `29781410549`, job `88483268401`, SUCCESS in 16m32s. It passed npm ci, lint, typecheck, unit 54 files/208 tests, integration 28 files/112 tests, clean Supabase start/reset, RLS simulator 8 files/24 tests, pgTAP 6 files/427 tests, component 21 files/72 tests, fixture E2E 126, persistent E2E 4, secret scan, and build.
- Hosted owner-trial evidence: the corrected protected non-Production UAT Preview passed read-only boundary/persona smoke 27/27 across desktop, mobile, and Arabic RTL. Seven role categories reached only their allowed surfaces; each pending card independently exposed a semantic caption/body, real media, or a non-empty client-visible file. Viewer decision/comment/upload controls were absent, approver controls were present, and internal-data, UUID, secret, and mojibake leakage checks passed. A separate visual owner-review matrix passed 9/9.
- Data preparation: corrected workbook inspection found 16 deliverables/versions, 7 imported tasks, zero approvals/files, zero meaningful caption/body values, and one existing meaningful suggestion. That suggestion was promoted unchanged through an audited real-Auth version command. Eight assignments remain across four deliverables; exactly one semantic current version is pending owner review. Two placeholder-only pending items were safely retired after the guarded command proved no prior client activity. No approval, media/file asset, customer decision, or new content was fabricated.
- Defect decision: S015-P1-078, S015-P1-079, S015-P1-084, S015-P1-085, and the governance defect S015-P1-068 are fixed/verified. No P0/P1 is open in the corrective technical slice. S015-P1-063 remains the single owner-human-acceptance blocker. S015-P2-078 and S015-P2-082 remain dispositioned; S015-P2-086 is fixed; S015-P2-087 records the source-content limitation and keeps non-semantic items internal.
- Remaining gate: X008-H is open solely for explicit owner human PASS. Until that PASS, H008-H010, X007, and T032 remain open and no formal team or external-client invitation is authorized.
- Production boundary: no Production deployment, alias/environment change, merge, public signup, external-client invitation, or real customer data action occurred.

All status sections below are chronological evidence. Where they conflict, this authoritative decision and the current `tasks.md` X008-H state govern.

## Historical corrective decision before final verification — 2026-07-20

`HOLD / HOSTED_TEAM_UAT_BLOCKED`. The 2026-07-20 corrective code slice closed the rescue's product-code gaps (raw enums, viewer copy, synthetic-UAT visibility, Uppy English) plus three rescue build/CI defects, and the complete exact-HEAD quality matrix is green on PR #37 quality run `29725841355` for head `0d7e8886f9ea975def04cf2405ef8555d04feda5`, with the exact-HEAD Vercel Preview Ready. Two hosted/data blockers remain open and keep H008-H010/X007/T032 closed: the setup-only service credential required for the bounded UAT data correction (defects C/F → S015-P1-078 / S015-P2-078) is unavailable on this workstation, and the hosted role walkthrough (S015-P1-079) cannot be driven without protected Preview access and the approved UAT persona accounts. No hosted data was mutated and no secret was printed or requested.

## Exact-HEAD quality matrix — 2026-07-20 (green)

- Branch: `codex/015-persistent-mvp-pilot-completion`. Final HEAD: `0d7e8886f9ea975def04cf2405ef8555d04feda5`. Draft PR #37: open, unmerged.
- CI: GitHub Actions `F-001 Quality` run `29725841355`, job `88298622704`, SUCCESS in 16m19s.
- Result: npm ci PASS; lint PASS; typecheck PASS; unit 53 files / 191 tests PASS; integration 28 files / 112 tests PASS; clean local Supabase start PASS; clean `db reset --local` PASS; RLS simulator 8 files / 24 tests PASS; pgTAP 6 files / 404 tests PASS; component 21 files / 69 tests PASS; fixture E2E 126 passed (6 configured mobile-only skips); persistent E2E 4 passed; secret scan PASS; build PASS.
- Vercel: deployment `8LLCzASyKbKZBatUGHRyHFw2mBZh` completed for the exact head; target Preview; Ready. No Production alias or environment was changed.
- Local cross-check on the same head: lint, typecheck, secret scan, `git diff --check`, unit 191, integration 112, component 69, RLS simulator 24, pgTAP 404, build, and the two corrected E2E specs (18 runs across desktop/mobile/RTL) all passed. Persistent E2E could not be completed locally because of the known post-reset auth-recovery race; the retry hardening lets the authoritative exact-HEAD CI run pass it.
- Defects S015-P1-073 through S015-P1-077 and S015-P2-076/S015-P2-077 are reconciled as fixed/CI-verified. S015-P1-078, S015-P2-078, and S015-P1-079 remain open hosted/data blockers.


`HOLD / HOSTED_TEAM_UAT_BLOCKED`. The first owner human trial rejected the product experience. Automated Auth/RLS/lifecycle evidence remains useful technical evidence, but it did not prove representative data, comprehensible navigation, actionable client approvals, or professional role-specific UX. H008-H010, X007, and T032 are reopened until X008 passes and the owner explicitly accepts the corrected Preview.

Historical correction update: X008-A through X008-G were implemented and role smoke passed 21/21, but the contemporaneous two-item/real-caption data claim was later disproved because placeholder dashes were counted as content. The authoritative decision at the top records the corrected semantic data and current 27/27 smoke. Status remains owner-trial-only until X008-H receives explicit human PASS.

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed before this continuation. |
| Persistent schema/RLS | green | Additive migration `202607150001` replayed from a clean reset in PR #37 quality run `29404575276` for head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`; pgTAP passed 6 files / 404 tests, including non-recursive RLS, active-role task mutation, eligible-assignee scope, and direct-helper denials. |
| Persistent workflow | green | Internal review, internal approval, client submission, client decision, delivery, closure, exact-version binding, audit, SLA, ledger, idempotency, terminal-state, and rollback paths are covered by local DB-backed tests. |
| Fixture boundary | green | Production routes use scoped persistent reads outside local/test actor-fixture mode; persistent read failures do not silently instantiate fixture repositories. `APP_ENV=test-persistent` is denied by the fixture predicate and verified by the persistent E2E helper. |
| Role and secrecy boundary | green locally and hosted | Exact-HEAD CI run `29490121433` passed the complete local matrix. Direct hosted smoke passed 27/27 and the persistent hosted lifecycle passed 1/1 with real UAT Auth sessions, assigned/unassigned denial, client read-only/approval separation, and internal comment/file secrecy. |
| RTL/mobile/keyboard UX | green locally and hosted | Repository visual QA remains green; exact-HEAD hosted smoke passed across desktop, mobile Chromium, and Arabic RTL. The hosted lifecycle also verified keyboard/focus-critical surfaces and no page-level horizontal overflow. |
| Persistent browser E2E | green | PR #37 quality run `29404575276` passed the full persistent suite on head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`: original lifecycle, mobile/RTL smokes, and real-Auth assignment journey covering management create/reassign, assignee status updates, old-assignee denial, and unrelated/client persona secrecy. |
| Local MVP acceptance | green for Checkpoint 1A | Checkpoint 1A is locally accepted for the exact corrective commit after PR #37 quality run `29404575276` passed npm ci, lint, typecheck, unit 182, integration 112, clean Supabase start/reset, RLS simulator 24, pgTAP 6 files / 404 tests, component 65, fixture E2E 123, persistent E2E 4, secret scan, and build; local `git diff --check` also passed. No P0/P1 remains open for Checkpoint 1A. |
| Hosted UAT | amber / corrected Preview verified | New real-Auth role smoke passed 21/21 across desktop/mobile/RTL after representative Glass preparation. The setup-only service credential needed for a fresh synthetic mutation lifecycle is unavailable; historical lifecycle evidence remains technical context only. |
| Human product acceptance | red / HOLD | X008-A through X008-G are complete, but no team invitation or formal trial may begin until the owner explicitly passes management, assigned-team, client-viewer, and client-approver journeys under X008-H. |
| Production acceptance | not granted | Outside task boundary. Existing actions are limited to the authorized Draft PR and Preview/UAT target; no Production deployment, promotion, merge, public signup, external-client invitation, or real customer data is authorized. |

## 2026-07-15 Checkpoint 1A exact-HEAD closure

- Branch: `codex/015-persistent-mvp-pilot-completion`.
- Corrective commit verified: `98a6e6745cf5e6c13e76e672a44883ec0bd51201`.
- Draft PR: #37, unmerged.
- CI evidence: GitHub Actions `F-001 Quality` run `29404575276`, job `87316811754`, SUCCESS.
- Matrix result: npm ci PASS; lint PASS; typecheck PASS; unit 51 files / 182 tests PASS; integration 28 files / 112 tests PASS; clean local Supabase start/reset PASS; RLS simulator 8 files / 24 tests PASS; pgTAP 6 files / 404 tests PASS; component 19 files / 65 tests PASS; fixture E2E 123 PASS; persistent E2E 4 PASS; secret scan PASS; build PASS. Local exact-head `git diff --check` PASS.
- Mandatory evidence checks pass: persona assertions use real Supabase Auth clients or browser sessions; service-role is limited to synthetic setup/teardown and post-action assertions; no `length >= 0` always-true assertion remains; management task create/assign/edit/reassign is covered; writer/designer task-assignee discovery through `/work` is covered; assignee status mutation is exact-owner-only; old assignee loses task/deliverable access after reassignment; unassigned internal and client personas see no internal tasks; disabled former assignee cannot invoke task mutation; deliverable/task RLS has no recursive-policy failure; eligible-assignee listing is management-only and same-tenant/same-client; internal comments, quality data, and task data remain hidden from clients.
- Defects S015-P1-049, S015-P1-050, S015-P1-051, S015-P1-052, S015-P1-054, S015-P2-053, S015-P2-055, and S015-P2-056 are reconciled as fixed/CI-verified.
- X007 hosted work, H008-H010, T032, and Production acceptance remain open and outside this closure.

## Owner-Authorized Hosted Team UAT gate additions

| Gate | Status | Reason |
|---|---|---|
| Branch/PR preflight | green | `git fetch origin --prune` completed; current branch is `codex/015-persistent-mvp-pilot-completion`; merge base with `origin/main` is `37027d458145dbf8a7e6d8d4e63a0eecd12a9328`; branch commit list and full diff/name-status were inspected. Hosted mutations were limited to the owner-authorized UAT migration, seed, Preview env, and Preview deployment. |
| Draft PR and CI | green | Branch pushed to origin and Draft PR #37 opened against `main`. GitHub `quality` check passed after lint, typecheck, unit, integration, local Supabase start/reset, RLS, component, E2E, secret scan, and build. CodeRabbit status passed/skipped. PR remains draft and unmerged. |
| Hosted target verification | green | Supabase linked target is UAT and ACTIVE_HEALTHY. The Vercel project is GitHub-connected, the reviewed branch deployment is Ready as Preview rather than Production, and the owner-configured public UAT alias was assigned to that deployment. Normal browser requests reach the Arabic sign-in shell without Deployment Protection. |
| Rollback approval | green | Owner-authorized amendment remains bounded to Team-Only Hadna Preview/UAT. Rollback owner and stop authority: project owner. Executor: Codex in this session. Window: current 2026-07-12 preflight/hosted attempt. Deployment rollback: disable/remove only this run's Preview alias/deployment. Database rollback: prefer forward fixes; remove only run-ID-scoped synthetic rows. Access rollback: revoke/disable only accounts/role assignments created by this run. Expected rollback verification: count/category-only checks plus Preview access check. |
| Migration gate | green for current Supabase UAT inventory | Six reviewed additive migrations `202607140001` through `202607150001` were applied only to the verified non-Production Supabase UAT target. A post-apply inventory confirms every local/remote timestamp matches. No table/column drop, TRUNCATE, Storage mutation, or Production access occurred. |
| Synthetic Hadna seed | green | Idempotent S015 hosted seed now scopes to an active client-viewer role assignment through tenant membership and created one synthetic contract, package, package line, deliverable, version, file metadata row, client-visible comment, and SLA segment. Evidence is count/category-only. |
| Team access | green: seven approved categories | The ignored secure persona store contains management, account manager, assigned writer, assigned designer, unassigned internal negative tester, client approver, and client viewer. Seven scoped `member_profiles` were synchronized with a run-ID-scoped tool and verified before the lifecycle. All seven categories authenticated and reached only their allowed hosted surfaces. |
| Preview deployment | green on exact reviewed head | A non-Production Preview was built from `3266d6fae0f4792da3ba7ceff4ce3d84b8362924`, with `/work`, `/client/pending`, and `/client/files` present in the route manifest. The UAT-only alias was reassigned to that deployment; its protection-bypass configuration remained enabled. No Production alias or environment was changed. |
| Hosted workflow/UX UAT | green | Boundary and persona smoke passed 27/27 across desktop, mobile, and Arabic RTL. The one-worker persistent hosted lifecycle passed 1/1 using real UAT Auth and UI actions for task assignment, three versions, internal changes/approval, client changes/approval, stale-version denial, final delivery, files, comments, SLA, audit, ledger, idempotency, and terminal-state denial. |
| T032 hosted evidence | green / closed | R-011A T032 is closed by direct bounded Preview/UAT evidence. Four failed synthetic lifecycle runs were retired using real authorized actors and audited RPCs; allocations were released and immediate replay returned no-op. No unrelated scope or Production system was touched. |
| Glass/Hadna workbook importer | green for controlled UAT apply/replay/rollback dry-run | A management-authenticated audited RPC created the minimal Glass UAT client/contract/package scope because only Hadna existed. The new run dry-run and apply produced 16 deliverables / 16 versions / 7 internal tasks, with 0 approval decisions and 0 file assets. Same-run replay stayed 16/16/7, unrelated scope counts stayed stable, and rollback dry-run proved 16/16/7 removable by run ID. Workbook content, paths, IDs, URLs, and credentials remain uncommitted. |
| Local import apply/rollback validation | green locally | Clean local Supabase was available after Docker recovery. Repository importer local apply/replay/rollback passed with category-only counts: first apply 16 deliverables / 16 versions / 7 tasks; same-run replay unchanged; rollback dry-run 16 / 16 / 7; rollback 16 / 16 / 7; imported remaining 0; unrelated client scope stable. No hosted mutation occurred. |

## Product Experience Rescue amendment status (2026-07-13)

| Gate | Status | Evidence |
|---|---|---|
| Spec/design amendment | green locally | Spec 015 `spec.md`, `plan.md`, and `tasks.md` amended; root `DESIGN.md` added. |
| Client pending entry point | green locally and hosted | `/client/pending` is present in the exact-HEAD route manifest; client viewer and approver hosted sessions reached it across desktop/mobile/RTL, and the approver completed exact-version decisions in the hosted lifecycle. |
| Raw assignee secrecy | green locally and hosted | Board maps known scoped members to human labels and unknown members to a generic team label. Hosted member-profile preflight and management task assignment passed without exposing raw identifiers. |
| Local UX rescue verification | green / X006 closed | Exact-head run `29490121433` passed the complete matrix after all X006/X007 changes; earlier partial run `29239615839` remains historical evidence only. |
| Hosted team workflow | green for controlled internal trial | H008-H010 and X007 are closed by direct Preview/UAT evidence recorded in `hosted-team-uat-final-handoff.md`. Production remains blocked. |
| Client E2E navigation regression | green locally and hosted | Initial duplicate-landmark failure was fixed; client viewer/approver navigation passed hosted desktop/mobile/RTL smoke and the exact-version lifecycle. |
| X007 product gaps | green locally and hosted / closed | Team task mutation, quality gate, lazy drawer details, focus containment, client files, and honest content fallbacks passed local CI and direct hosted lifecycle verification. |

## 2026-07-14 X007 Checkpoint 3 local matrix
This section is historical checkpoint evidence and is superseded for current hosted status by the `HOSTED_TEAM_UAT_READY` rows above.
- Clean local reset applied all migrations through `202607140002_s015_task_quality_idempotency_hardening.sql`.
- Local matrix passed: lint, typecheck, unit 50/179, integration 28/112, component 18/57, RLS simulator 8/24, pgTAP 6 files / 329 tests, fixture E2E 123 passed / 6 configured skips, persistent E2E 3/3, secret scan, diff check, and build.
- Visual QA is included in fixture E2E across desktop, mobile, and RTL. A mobile hydration wait was increased after a timeout-only failure; focused mobile visual QA and the full fixture suite passed afterward.
- Exact-HEAD PR quality run `29324709845` failed only on persistent mobile client approval detail width; the surface was fixed and exact-HEAD PR quality run `29329914612` passed for commit `f1690dc`.
- A corrective review found P1 gaps in task read isolation and assignee validation; corrective migrations `202607140003` and `202607140004` and expanded pgTAP coverage were added. Exact-HEAD PR quality run `29334543580` passed for commit `efa307e` after the first corrective slice. A second corrective slice (`202607140004`) adds team-member assignee authority and expanded negative pgTAP; exact-HEAD CI is pending after push.
- A third corrective slice (`202607140005`) reopens Checkpoint 1A to fix task assignment authority: removes `created_by` permanent grant, narrows deliverables SELECT for team to owner/contributor/task-assignee, restructures update authority (management/owner-contributor/assignee), adds explicit server capabilities, and fixes active-role-to-active-membership linkage. Local typecheck/unit/integration/component/secret-scan PASS; Docker-backed DB/persistent-E2E/build verification deferred to exact-HEAD CI. Checkpoint 1A is not green while P1 defects S015-P1-044 through S015-P1-047 are open pending exact-HEAD CI.
- Hosted H008/H009/H010/T032 remain open. No hosted mutation, Production action, PR merge, or workbook tracking occurred.

Continuation evidence correction: CI run `29239615839` is valid database evidence for migrations 202607130001/002 (RLS 228/228) and fixture evidence (E2E 108). Later X006 closure is instead backed by exact-HEAD PR #37 quality run `29263587871` attempt 2 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`. X007, H008-H010, and T032 remain open.

Latest X006 evidence: local lint, typecheck, unit 50/174, integration 28/112, component 18/57, RLS simulator 8/24, fixture E2E 123 passed / 6 configured skips, visual QA, secret scan, diff check, production build, and workbook dry-run (15 content deliverables + 1 coordination deliverable + 16 draft versions + 7 tasks; 0 approvals/files). Exact-HEAD PR #37 quality run `29263587871` attempt 2 additionally passed Supabase start/reset, RLS, fixture E2E, persistent E2E, secret scan, and build.

## 2026-07-13 reconciliation
- Latest owner-provided quality CI `29248954232` remains historical evidence for X006-A through X006-G.
- X006-H and parent X006 are closed by exact-HEAD PR #37 quality run `29263587871` attempt 2 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`.
- X007, H008-H010, UAT migration/import, rollback/no-op rehearsal, and T032 remain open.

## 2026-07-13 local visual QA continuation
- X006-H visual tooling now runs through the repository Playwright CLI, not the abandoned temporary ESM harness.
- Local synthetic visual QA passed 12/12 across desktop, mobile, and Arabic RTL, with direct screenshot inspection.
- Hosted UAT Playwright tooling now requires a secure local env with an explicit hostname allowlist and accepted non-Production target category; without them it fails closed before navigation.
- X006-H is closed by exact-HEAD PR #37 quality run `29263587871` attempt 2 for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`.
- X007, H008-H010, T032, hosted UAT workflow, UAT import/rollback evidence, and Production acceptance remain open/not granted.
