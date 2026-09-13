# Owner Manual UAT Notes — 2026-07-26

## Owner-feedback correction batch 6 (local) — 2026-09-03

This local batch implements X010-B-7C-9 for S015-P2-128 and S015-P2-139. The
workspace rollover now handles the repeated-trial reality: each approved
internal persona selects exactly one active source membership while every
historical inactive workspace is tolerated, so a second rollover no longer
fails as ambiguous. Apply provisions and verifies the new empty workspace
first, records one deterministic append-only binding to the exact source
tenant/membership set, and only then quarantines that set. Replay of an
applied run is a verified no-op; drifted or conflicting identity fails closed
without mutation; rollback restores exactly the recorded source and disables
only that run's target. No synthetic client, contract, package, deliverable,
file, Audit, or Ledger row is deleted or rewritten, and client-only personas
never receive automatic access.

Local verification passed: clean-workspace unit 21/21 (written failing
first); full unit 73/373; typecheck; lint; RLS simulator 8/24; local Supabase
reset; pgTAP 16/755; the persistent rollover journey 10/10 against real local
Supabase (apply/binding, empty states, client-persona denial, no-op replay,
rollback, re-apply after rollback, second rollover over historical
memberships, binding-exact second rollback, and fail-closed ambiguity and
tenant-mismatch denials without mutation); production build; secret scan; and
diff check.

Hosted execution was explicitly not performed: no Supabase/Vercel command, no
hosted migration, no invitation, no merge, no Production action. X010-B-7C-9E
(hosted rehearsal/apply/rollback after exact-HEAD CI), corrected Preview
persona verification, owner recheck, and all 20 owner acceptance items remain
pending. This entry is not `OWNER_UAT_PASS`, `TEAM_UAT_READY`, merge
approval, or release approval.

## Next correction batch — 2026-09-03

X010-B-7C-9 is specified but not started. It addresses S015-P2-128 and
S015-P2-139 by rolling approved internal personas into a new deterministic
empty UAT workspace and quarantining their exact current source memberships.
It will not delete the synthetic clients, contracts, packages, deliverables,
files, Audit, or Ledger evidence. Multiple historical inactive workspaces are
allowed; one deterministic append-only binding must identify the exact source
for replay, status, and rollback before that source can be disabled.

The implementation agent is authorized for local code and tests only. Hosted
dry-run/apply/rollback, deployment, invitations, merge, Production, and owner
acceptance remain pending. All 20 owner checks remain unchecked.

## Independent review correction for batch 5 — 2026-09-03

Before owner recheck, independent review found that a reversed optional package
period could be hidden after collapsing its disclosure, leaving the associated
inline error and focus target unavailable. The corrected wizard automatically
reopens that disclosure and focuses «نهاية فترة الباقة» with its accessible
inline message. Independent checks passed: lint, typecheck, unit 73/364,
component 31/152 (wizard 20/20), and the focused browser spec 10 passed / 2
intentional mobile-only skips after a successful retry. Owner UAT was not run;
all 20 owner checks remain unchecked.

## Owner-feedback correction batch 5 — 2026-09-03

This local batch addresses S015-P2-138 only. The onboarding final review now
summarizes the client, contract reference/period, package services with
quantities and units, the primary owner and every selected contributor by
human name and Arabic role, and the first deliverable's description, type,
priority, all provided dates (one Arabic Gregorian formatter), and the
internal/client approval settings as explicit «نعم/لا» rows. Empty optional
values are omitted and no raw identifiers or enum values render.

Empty or invalid submit no longer produces a generic message: the wizard
stays on the step, focus moves to the first actually-invalid field — the
company name on step one, never the optional phone — and an inline error
appears bound to that exact field through stable aria-invalid /
aria-describedby wiring for screen-reader users. Correcting a field clears
only its error, preserves every entered value, and never resets the journey.

Local verification passed: lint; typecheck; unit 73/364; integration 28/112;
component 31/152 (wizard 20/20 after independent correction); RLS simulator 8/24; pgTAP 16/744;
onboarding-review browser 10/10 across desktop 3, mobile 4 (no horizontal
overflow; desktop and mobile review screenshots captured), Arabic RTL 3; and
the persistent onboarding journey 4/4 against real local Supabase with the
new assertions. Docker Desktop recovered without destructive action during
this slice, which also let the previously blocked batch-4 pgTAP invitation
file execute locally and pass.

Owner recheck on a corrected Preview and exact-HEAD CI remain required. All
20 owner acceptance items stay unchecked. This entry is not `OWNER_UAT_PASS`,
`TEAM_UAT_READY`, merge approval, or release approval.

## Owner-feedback correction batch 4 — 2026-09-01

This local batch addresses S015-P2-137. The management invitation form now
starts with no role or client selected and does not enable creation until one
role and at least one active client are explicitly selected. A single invite
can assign the same supported role across multiple named clients, and the
acceptance screen explains those exact scopes before activation.

Pending links remain actionable. Accepted invitations are omitted from the
invitation lifecycle because the member already appears in the team directory;
revoked and superseded records are retained in a compact disclosure that works
by keyboard. Desktop, mobile, and RTL screenshots were manually inspected and
the browser measured no horizontal overflow.

Local verification passed: lint; typecheck; unit 73/364; component 31/144;
integration 28/112; RLS simulator 8/24; invitation browser 6/6 plus final
visual refresh 3/3; production build; secret scan; and diff check. The pgTAP
test for multi-client create/read/accept exists, but local PostgreSQL execution
is still pending because Docker Desktop 4.79.0 crashes while recreating its
stale `dockerInference` runtime socket after the power outage. The additive
migration was not applied to hosted UAT.

Owner recheck on a corrected Preview, exact-HEAD CI, and database-backed pgTAP
remain required. All 20 owner acceptance items stay unchecked. This entry is
not `OWNER_UAT_PASS`, `TEAM_UAT_READY`, merge approval, or release approval.

## Owner-feedback correction batch 3 — 2026-09-01

This local batch addresses S015-P2-135 and the commercial/date portion of
S015-P2-136. Management and client commercial summaries now use the same scoped
contract/package/deliverable read model, show «المسلّم» beside agreed,
in-progress, and remaining quantities, and render contract/package periods as
explicit Arabic Gregorian «من … إلى …» ranges. Fractional values for count
units and negative availability are not shown as valid balances: management is
directed to the existing audited correction path and the client sees calm
verification copy.

Management contract and package lists now support search, status filtering, and
bounded pagination. Known `S015-UAT-` hosted contracts remain in the database,
audit, and ledger history but are excluded from ordinary human-trial lists by
the existing visibility predicate; this batch did not delete or mutate UAT
records. Manual mobile QA also found a client-shell width regression (541px
document on a 390px viewport). The grid constraint was corrected and the final
measured width is 390px, with a browser regression preventing recurrence.

Local verification passed: lint plus exact-source targeted ESLint; typecheck;
unit 73/362; component 31/142; integration 28/112; commercial browser 9/9 on
desktop/mobile/Arabic RTL; final mobile overflow regression 1/1; manually
reviewed desktop and mobile screenshots; production build; secret scan; and
diff check. No migration, dependency, ADR, ledger/workflow/RLS/permission
change, hosted mutation, invitation, merge, or Production action occurred.

Owner recheck is still required on a corrected Preview. Safe UAT quarantine /
cleanup under S015-P2-139 is a separate pending task. All 20 owner acceptance
items remain unchecked. This entry is not `OWNER_UAT_PASS`, `TEAM_UAT_READY`,
merge approval, or release approval.

## Owner-feedback correction batch 2 — 2026-09-01

This local batch addresses the named card/Drawer/copy slice only. Whole-card
primary navigation is implemented for management client cards, client workspace
path cards, and assigned-client cards; the Drawer uses a sticky responsive tab
grid; corrected content-card/Drawer channel, format, and date values are Arabic.
Desktop, mobile, and Arabic RTL fixture browser checks pass and screenshots were
manually reviewed.

Owner recheck remains required on the corrected Preview. S015-P2-133 is not a
blanket closure for every row in the product, and S015-P2-136 still needs the
broader cross-surface date/bidi sweep. All 20 owner acceptance checklist items
remain deferred and unchecked. No Owner PASS, team invitation authorization,
`TEAM_UAT_READY`, merge, or Production acceptance is implied.

## Current reconciliation — 2026-08-04

This section supersedes the older counts below without deleting their historical
evidence. Current repository HEAD at reconciliation is `38f800c` on
`codex/015-persistent-mvp-pilot-completion`.

- **34 observations are technically fixed:** A1–A13, B1–B4, and D1–D17.
- **D18 is partially fixed:** density was tightened on the main management,
  client, team, board, and Drawer surfaces; final owner visual acceptance remains.
- **Four visual checks remain:** C1–C4 (desktop density, mobile density, Kanban
  navigation, and Arabic-state sweep).
- **Five owner notes remain open:** N1/S015-P2-124 post-approval internal reopen,
  N2/S015-P2-125 protected Kanban move clarity, N3/S015-P2-126 team invitation,
  N4/S015-P2-127 email-notification decision, and N5/S015-P2-128 bounded UAT-data
  cleanup preserving append-only audit and ledger history.
- The reliable last client-decision timestamp remains deferred under
  S015-P2-117; no approximate timestamp is shown.
- X010-B-6B and X010-B-7 remain open. Owner UAT, TEAM_UAT_READY, merge, and
  Production acceptance are not declared.
- S015-P1-111/S015-P1-112 remain code-fixed and CI-verified but require the
  approved hosted upload/cancel regression before final closure.

The owner walkthrough procedure is maintained in
`evidence/owner-acceptance-walkthrough-ar.md`.

## X010-B-4 corrective local close — 2026-08-01

B4 is **not** owner-accepted. It is recorded as
`X010_B4_CORRECTIVE_LOCAL_COMPLETE_DB_CI_UAT_PENDING`: local non-DB gates are green on the
reviewed changes; exact-HEAD CI, DB-backed gates (pgTAP, persistent E2E), the
corrected Preview, and owner final UAT remain pending. **GREEN / TEAM_UAT_READY
are NOT declared.** No email / WhatsApp / push / cron was added; email remains
deferred to a separate owner decision (N4 / S015-P2-127).

Before owner recheck, independent review corrected recipient qualification,
post-revocation RPC isolation, a migration syntax blocker, viewer-versus-approver
copy, team-versus-management links, repeated reassignment dedupe, and a
relative-time hydration mismatch. These corrections are locally complete, but
the database assertions still require exact-HEAD CI because local Supabase is
unavailable.

What B4 changed, mapped to the owner note it addresses:

- **D11 — no understandable in-app notifications.** A persistent in-app
  notification center now replaces raw technical event logs on dashboards. A
  bell with an unread badge sits in the management/team shell and the client
  shell; clicking it opens a short popover of the latest notifications with a
  «عرض كل الإشعارات» link, and the unified `/notifications` route lists them all
  with «الكل» / «غير المقروء» filters and «تعليم كمقروء» / «تعليم الكل كمقروء».
  Notifications are persistent (survive reload), person-scoped, and de-duplicated.
- **Routing by role (not a single global feed).** The client only ever receives
  client-safe notifications (a new version awaiting their review, or a final
  delivery) with Arabic copy such as «لديك نسخة جديدة بانتظار المراجعة» and a
  link to «/client/pending» or «/client/files». Management and the assigned
  account manager receive internal notifications (version submitted for review,
  client approval / change request, delivery readiness). The assigned owner and
  execution team receive internal change requests. The person who performed the
  action is never notified unless they genuinely need to follow up.
- **Secrecy preserved.** Client notifications never expose internal comments,
  internal files, quality notes, version states, event types, UUIDs, or
  administrative routes. `action_href` is generated server-side from a fixed
  allowlist enforced by a PostgreSQL CHECK; the browser never supplies it.
- **Atomic with the workflow.** Notifications are created in the same
  transaction as the audited workflow command (a trigger on `audit_events` and a
  trigger on `deliverable_tasks`), so an approval/change/send/delivery either
  records its notification or rolls back together — no partial/lost
  notifications, and replay is a no-op.

Owner recheck focus on the corrected Preview: open the bell as each role and
confirm the right notifications appear (client sees only client-safe items;
management sees decisions; assigned team sees change requests); confirm a Client
A user never sees a Client B notification; confirm «تعليم الكل كمقروء» clears
the badge; confirm no technical terms leak.

These open notes are **not** closed by X010-B-4 beyond the technical fix above;
D11 is `technical-fixed; final-owner-UAT-pending`, and N4 (email decision)
remains deferred to a separate owner decision.

## X010-B-3 corrective pass — 2026-07-31

A bounded corrective pass from B3 HEAD `351f370`, inside Spec 015 only. Status
`X010_B3_CORRECTIVE_LOCAL_COMPLETE_CI_UAT_PENDING` — **not** owner-accepted;
GREEN / TEAM_UAT_READY are **not** declared. Local non-DB gates green; exact-HEAD
CI, DB-backed gates, Preview, and owner final UAT pending.

Corrections (no workflow/permissions/RLS change):

- **Decision date honesty.** The approximate client-decision date (from
  `deliverable.updated_at`) was **removed**; `updated_at` is any update, not a
  decision. A reliable timestamp needs a scoped `approval_decisions` query + RLS
  read verification, so the date is **deferred**. No approximate date is shown.
- **Real work opening.** Each «أعمالي» card now opens the actual work at
  `/client/work/[deliverableId]` (not a general page): client-visible statuses
  only, client-visible version/files/comments only, no internal data, approver
  decision buttons only while waiting, viewer read-only, deliverable ID used in
  the link only (never shown as text).
- **Role copy.** Next action is role-aware (approver: «راجع النسخة ثم اعتمدها
  أو اطلب تعديلًا»; viewer: «يمكنك الاطلاع على النسخة، والقرار لدى المسؤول
  عن الاعتماد»); viewer never sees «بانتظار قرارك» (uses «قيد المراجعة»);
  «تم اعتمادك» → «تم اعتماد العمل».
- **Form clarity.** The create/edit form is split into البيانات الأساسية /
  تفاصيل إضافية اختيارية / إعدادات سير العمل; the approval flags are a
  visible fieldset with impact explanations (not hidden as unimportant).
- **Error vs empty.** «أعمالي» shows «تعذر تحميل أعمالك الآن. حاول مرة أخرى.»
  on read failure and a useful empty state when there is genuinely no work.

Owner recheck focus on the corrected Preview: open a work card to its own
detail; confirm the viewer sees read-only copy and no decision buttons; confirm
duplicate-named works open the correct one; confirm Client B cannot open
Client A work.

## X010-B-3 client terminology + أعمالي + change-request visibility + progressive disclosure — 2026-07-31

B3 is **not** owner-accepted. It is recorded as
`X010_B3_LOCAL_COMPLETE_CI_UAT_PENDING`: local non-DB gates are green on the
reviewed changes; exact-HEAD CI, DB-backed gates, the corrected Preview, and
owner final UAT remain pending. **GREEN / TEAM_UAT_READY are NOT declared.**
No migration was added (no schema change), so there is no UAT-migration blocker
as with B2.

What B3 changed, mapped to the owner notes it addresses:

- **D8 — hard terminology.** A central client mapper
  (`client-labels.ts`) now drives every client-facing status: `waiting_client_approval`
  → «بانتظار قرارك», `client_changes_requested` → «قيد التعديل لدى فريق سماوة»,
  `client_approved` → «تم اعتمادك», `ready_for_delivery` → «جارٍ تجهيز التسليم»,
  `delivered` → «تم التسليم». «المخرجات»/«مخرجاتي» became «الأعمال»/«أعمالي» on
  client surfaces and the shared summary cards. No raw enum, UUID, or internal
  term («التعميد الداخلي»/internal_only) reaches the client.
- **D9 — work vanishes after a change request.** Root cause was that
  `client_changes_requested` was excluded from the client-visible status set, so
  the item disappeared the moment the client asked for edits. It is now kept
  visible in the new «أعمالي» page (`/client/work`) with the message
  «استلم فريق سماوة ملاحظاتك، والعمل الآن قيد التعديل», while it correctly
  leaves «بانتظار موافقتي» (no decision is owed while the team edits). The
  client's last decision date («تاريخ آخر قرار لك») is shown on those cards
  when present. Only client-safe summary fields are exposed.
- **D10 — empty optional fields.** The deliverable create/edit form now shows
  essential fields first and moves optionals (priority, contributors, extra
  dates, approval flags) behind a disclosure «تفاصيل إضافية — اختيارية». No
  field, value, validation, or workflow was removed; values are preserved when
  the section is opened/closed.

Client journey before/after (what the owner should recheck on the corrected
Preview): the home page now has three clickable section cards (بانتظار
موافقتي / أعمالي / الباقة والمتبقي) with clear CTAs; a new «أعمالي» nav entry
opens all the client's work grouped by stage with keyboard-accessible cards;
after requesting a change the work no longer disappears — it shows as
«قيد التعديل لدى فريق سماوة» and returns to «بانتظار قرارك» once a new version
is sent.

These open notes are **not** closed by X010-B-3 beyond the technical fix above;
D8/D9/D10 are `technical-fixed; final-owner-UAT-pending`, and the remaining
D11–D18 (notifications, files, drawer, etc.) stay open for B4–B6.

## X010-B-2 onboarding journey simplification + B1 documented closure — 2026-07-31

B1 is **not** owner-accepted. It is recorded as `technical-green +
owner-final-UAT-pending`: exact-HEAD F-001 CI `30552777038` passed and the
Vercel Preview deployment `7LXuPgu2MUb8RJNbhXigi4ZipQhK` is Ready in
`samawahs-projects/shrik`. **CodeRabbit showed `skipped` because the PR is a
Draft — that is a skipped review, not a review pass; no review approval is
claimed.** The exception-dashboard recent-decision row is now a single
clickable link to the scoped deliverables page. There is no URL deep-link that
opens a specific deliverable drawer yet, so the closest honest link is used and
no claim is made that it opens a specific deliverable directly.

X010-B-2 implemented: one primary CTA «إضافة عميل جديد» → the unified wizard;
explicit Arabic company/contact/phone labels; additive `primary_contact_phone`
column; phone normalization + Zod validation; multi-service package lines with
integer/fractional semantics; «المسؤول الرئيسي عن العمل» / «أعضاء الفريق
المشاركون»; progressive disclosure; value preservation + focus-on-error. All
onboarding mutations remain atomic, tenant-scoped, audited, and idempotent.

### Newly registered open owner notes (technical-fixed for the B2 items; the

following remain open as explicit owner decisions / future slices)

| #   | Note                                                                                                                                            | Status             | Target                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| N1  | Ability to return a deliverable to internal correction after it was internally approved or already sent to the client (post-approval reopen)    | open — S015-P2-124 | X010-B-6/7                                                        |
| N2  | Clarity on protected drag-and-drop moves versus explicit status actions (which Kanban moves are protected workflow transitions vs. cosmetic)    | open — S015-P2-125 | X010-B-6                                                          |
| N3  | Adding and inviting team members to a tenant/client scope from inside the product shell                                                         | open — S015-P2-126 | X010-B-6                                                          |
| N4  | Decision on whether the platform sends email notifications for approvals/change-requests (owner decision required before any email integration) | open — S015-P2-127 | owner decision — X010-B-4 shipped **in-app only**; email deferred |
| N5  | Cleaning trial/pilot operational data before go-live without deleting append-only Audit/Ledger history                                          | open — S015-P2-128 | X010-B-7                                                          |

These open notes are **not** closed by X010-B-2. They are classified
`technical-fixed` only where B2 resolved them; the five above remain open and
will be rechecked in the final structured owner acceptance trial (X010-B-7)
after B3–B6.

## X010-B owner experience consolidation — 2026-07-30

This section consolidates every owner experience observation collected through
the manual walkthroughs into one authoritative triaged list. Each observation is
classified as: **fixed technically**, **needs manual recheck**, or **still open**.
The single source of truth for current HEAD/CI/hosted status is
`gate-status.md`; do not infer completion from any individual note below.

### Source of truth (current)

- Application HEAD: `6c0386dac8e474ffe6d56cacf754bc0e6d1bc939` (evidence HEAD
  `47b11e9`). Exact-HEAD F-001 Quality `30552777038` passed; Vercel Preview
  `https://vercel.com/samawahs-projects/shrik/7LXuPgu2MUb8RJNbhXigi4ZipQhK` is
  Ready; CodeRabbit is green.
- X010-A parent status: **not complete**. X010-A-9 remains open; S015-P1-111
  and S015-P1-112 are `code-fixed + CI-green + hosted-blocked`. No GREEN is
  declared for the corrective slice until the hosted UAT regression passes.
- Hosted UAT is blocked by missing approved credentials (see `gate-status.md`).
  Production, real data, merge, and external invitations remain outside the
  boundary.

### Consolidated observations

#### A. Fixed technically (prior slices)

| #   | Observation                                                              | Disposition                                              | Evidence                                                                     |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A1  | Image-only client review was blocked (circular guard)                    | fixed; S015-P1-099 / X009-D                              | real image renders, management stages, secrecy until send, delivery promotes |
| A2  | Uploads did not expose dependable name/type/size/progress/terminal state | fixed; X010-A durable attempts                           | `202607290002`; persistent E2E                                               |
| A3  | Client send lacked a final exact-version summary                         | fixed; X010-A                                            | `deliverable-actions.tsx` confirmation                                       |
| A4  | Delivery could skip explicit management preparation                      | fixed; X010-A `ready_for_delivery` mandatory             | `202607290001`                                                               |
| A5  | Final delivery lacked exact version/file confirmation                    | fixed; X010-A                                            | confirmation section                                                         |
| A6  | Deliverable not directly openable from the list                          | fixed; X010-A `فتح العمل`                                | deliverables page                                                            |
| A7  | Kanban post-approval mapping incorrect                                   | fixed; X010-A macro lanes                                | `deliverable-board.tsx`                                                      |
| A8  | Count inputs exposed spinners and fractional quantities                  | fixed; X010-A                                            | integer-only count units                                                     |
| A9  | Raw technical enums in the universal drawer                              | fixed; S015-P1-073                                       | `domain-labels.ts`                                                           |
| A10 | Client viewer instructed to approve                                      | fixed; S015-P1-074                                       | role-aware copy                                                              |
| A11 | Hosted-UAT synthetic seed visible in normal views                        | fixed; S015-P1-075                                       | `human-trial-visibility.ts`                                                  |
| A12 | Uppy upload surface was English                                          | fixed; S015-P2-076                                       | Arabic locale                                                                |
| A13 | Cancel cleanup trusted browser path / false success                      | fixed; S015-P1-111/112 code + CI; hosted recheck pending | `202607300001`/`202607300002`                                                |

#### B. Fixed technically (X010-B-1 — this slice)

| #   | Observation                                                      | Disposition     | Evidence                                           |
| --- | ---------------------------------------------------------------- | --------------- | -------------------------------------------------- |
| B1  | Interface density: oversized headings/cards/spacing at 100% zoom | fixed; X010-B-1 | shared core tokens tightened; component regression |
| B2  | Non-clickable cards and recent-decision rows                     | fixed; X010-B-1 | exception-dashboard recent items are links         |
| B3  | Raw technical English status in management dashboard             | fixed; X010-B-1 | `deliverableStatusLabel` applied                   |
| B4  | Kanban page-level overflow risk                                  | fixed; X010-B-1 | board scroll contained; no page overflow           |

#### C. Needs manual recheck (owner visual QA on Preview)

| #   | Observation                                                   | Why recheck                                           |
| --- | ------------------------------------------------------------- | ----------------------------------------------------- |
| C1  | Density and visual hierarchy at 100% zoom on desktop 1440×900 | owner must confirm readability after token tightening |
| C2  | Mobile Chromium density and no horizontal page overflow       | owner must confirm stacked layout                     |
| C3  | Kanban horizontal mouse/touch/keyboard navigation             | owner must confirm scroll and full-card reach         |
| C4  | Arabic states everywhere (no raw enum leak)                   | owner must scan all surfaces                          |

#### D. Still open (future X010-B slices)

| #   | Observation                                                                                         | Target slice                                            |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| D1  | Onboarding journey difficulty (client/contract/package/deliverable)                                 | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D2  | Company name vs contact person confusion                                                            | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D3  | Phone/WhatsApp missing from client entity                                                           | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D4  | Contract reference unexplained                                                                      | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D5  | Package lines inconsistent across entry paths                                                       | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D6  | Correction/recovery unclear after input error                                                       | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D7  | Team assignment terminology unclear                                                                 | X010-B-2 — **technical-fixed; final-owner-UAT-pending** |
| D8  | Hard terminology like "مخرجاتي" and English technical states in copy                                | X010-B-3 — **technical-fixed; final-owner-UAT-pending** |
| D9  | Client work disappears after change request; should stay visible as "عاد لفريق سماوة — قيد التعديل" | X010-B-3 — **technical-fixed; final-owner-UAT-pending** |
| D10 | Empty optional fields shown; needs progressive disclosure                                           | X010-B-3 — **technical-fixed; final-owner-UAT-pending** |
| D11 | No understandable in-app notifications center (approval/change-request)                             | X010-B-4 — **technical-fixed; final-owner-UAT-pending** |
| D12 | Files not organized as a Drive-like experience (folders/classification/previews/Arabic names)       | X010-B-5                                                |
| D13 | "تنزيل آمن" should be simplified to "تنزيل"                                                         | X010-B-5                                                |
| D14 | Upload progress/failure/retry/cancel clarity for images and video                                   | X010-B-5 (refine)                                       |
| D15 | Universal drawer long and crowded; needs logical sections/tabs                                      | X010-B-6                                                |
| D16 | Internal quality not explained; no default editable checklist                                       | X010-B-6                                                |
| D17 | Owner/contributor/role display clarity; no `tenant_administrator` or synthetic data leak            | X010-B-6                                                |
| D18 | Client profile, admin dashboard, team dashboard visual improvement                                  | X010-B-1 partial + X010-B-6                             |

### Counts

- Fixed technically: 27 (A1–A13 prior, B1–B4 density slice, D1–D7 onboarding slice, D8–D10 terminology/visibility/progressive-disclosure slice).
- Needs manual recheck: 4 (C1–C4) + owner final UAT for the onboarding labels/phone/multi-service flow and the B3 terminology/أعمالي/change-request flow.
- Still open: 8 (D11–D18), distributed across X010-B-4 through X010-B-6, plus 5 newly registered open notes (N1–N5 above).

### Boundary

- X010-B-1 implements only density + navigation + clickability + Arabic states +
  Kanban containment. It does **not** redesign business workflow, onboarding,
  notifications, or files in this round.
- No hosted mutation, no Production access, no merge, no team invitation, and no
  `TEAM_UAT_READY` declaration. X010-A-9 / S015-P1-111 / S015-P1-112 remain
  `code-fixed + CI-green + hosted-blocked`.

## Durable upload correction update — 2026-07-29

The local Spec 015 correction now persists every upload attempt before file
transport and restores pending/failed attempts after reload. A failed
replacement blocks client send, delivery preparation, and final delivery at
the PostgreSQL layer; Retry or an explicit audited cancellation is required.
The clean local matrix, including 535 pgTAP tests and 16/16 persistent browser
scenarios, passes. Owner/hosted acceptance is not claimed yet: X010-A-1/2/8
remain open pending exact-HEAD CI, the correct Preview, a single shared
synthetic UAT fixture across all required personas, and rollback/no-op proof.
No real UAT data, invitations, or Production state were changed by this local
checkpoint.

## X010-A hosted closure update — 2026-07-29

Status is `X010_A_GREEN` for the bounded workflow-safety scope. Exact-HEAD CI
`30479343344`, the correct `samawahs-projects/shrik` Preview, UAT migration
`202607290002`, and shared synthetic lifecycle
`s015-hosted-lifecycle-6998e30147` all passed. Viewer was read-only; approver
requested changes on version 1 and approved version 2; internal comment/file
were invisible to both; final client files contained only version-2 delivery
assets. Failed replacement upload survived reload and blocked send until an
explicit audited cancel. Persona scope `x010a-scope-20260729-f8b363d` was
rolled back and replayed with zero active target client memberships/roles.
Production, real customer data, invitations, and the owner's separate
onboarding observations below were not changed or reclassified.

## Status

Open observations from the owner's first-client onboarding walkthrough. These notes record the experience as observed; no product fix or readiness closure is claimed here.

## Source

- Owner-provided DOCX and six screenshots reviewed on 2026-07-26.
- Personal contact details shown in the screenshots are intentionally not reproduced.
- DOCX text and embedded images were inspected structurally. Visual DOCX page rendering was unavailable because LibreOffice was not installed.

## Observations

1. **Competing client-entry actions**
   - The clients page presents both "إضافة أول عميل" and "إضافة عميل".
   - The owner found the distinction unclear and the header crowded.
   - Desired direction: one obvious primary action, with any advanced/partial path moved out of the main journey.

2. **Client entity and contact person are easy to reverse**
   - "اسم العميل" was interpreted as the person's name.
   - "اسم جهة التواصل" was interpreted as the company/entity name.
   - Desired direction: use explicit labels such as "اسم الشركة أو الجهة" and "اسم مسؤول التواصل", and explain which name appears throughout the workspace.

3. **WhatsApp/phone is missing**
   - The onboarding flow collects a contact name and email but no phone/WhatsApp number.
   - The owner considers WhatsApp a required operational contact field.

4. **Contract reference is unexplained**
   - The owner could not tell what "مرجع العقد" means or why it is needed.
   - Desired direction: add concise helper copy and evaluate a reviewed contract-file or Drive-link field rather than requiring an unexplained code.

5. **Package lines are inconsistent across entry paths**
   - The first-client wizard supports adding package lines.
   - The standalone package form shows one package line and does not make adding the remaining services obvious.
   - The owner could not determine whether additional services require additional packages.

6. **Correction and recovery are unclear**
   - After an input mistake, the owner could not find an obvious way to edit the saved information or resume the same journey.
   - Desired direction: preserve entered values, identify the exact field requiring correction, and provide clear edit/resume actions without encouraging duplicate clients, contracts, or packages.

7. **Team assignment terminology is unclear**
   - "المسؤول" and "المساهمون" did not explain who should be selected or what each selection permits.
   - Desired direction: clarify "المسؤول الرئيسي عن المخرج" and "أعضاء الفريق المشاركون", with role labels and short helper text.

8. **Package quantity semantics are unclear**
   - The standalone package form allows decimal quantities and the walkthrough produced a decimal balance for a "منشور" unit.
   - Desired direction: explain that the entered value is the total contracted quantity, display remaining quantity separately, and review whether count-based units should accept whole numbers only.

9. **Image-only client review was blocked — resolved**
   - The actual uploaded image is available in the files section, but the drawer's primary current-version area shows only an icon placeholder.
   - After internal approval the file remains internal, and there is no explicit action to select and stage it for client review.
   - Technical review found a circular guard: registering a client-visible file requires a sent version, while sending an image-only version requires an already client-visible file.
   - Resolved under `S015-P1-099` / X009-D: the real image renders, management explicitly stages it, client secrecy holds until send, approver/viewer boundaries pass, and delivery promotes it to a final file.

## Current disposition

- Keep the owner walkthrough active so more usability findings can be collected in one pass.
- X009-D no longer blocks the owner walkthrough. Do not invite the wider team until the owner explicitly accepts the remaining onboarding/navigation usability disposition in `S015-P2-098`.
- Triage and implement the onboarding simplification as one bounded Spec 015 correction after the owner completes the core management journey.

## Next walkthrough checkpoint

Open the created client's workspace and verify:

1. The company/entity name is the primary visible name.
2. The contract and package can be found without returning to the clients list.
3. Every package service and its total/remaining quantity are understandable.
4. The first deliverable is visible with its responsible team member and next action.
5. Existing client, contract, package, and deliverable data can be corrected through an obvious route.

## X010-A critical workflow-safety observations — 2026-07-29

The following Owner UAT observations are recorded in Spec 015 and are treated as
P1 release blockers until exact-head CI and the bounded Preview smoke pass:

1. Uploads did not expose a dependable per-file name/type/size/progress/terminal
   state, and a failed replacement could leave the operator uncertain which file
   would be sent.
2. Client send did not provide a final summary of the exact current version,
   caption/body, and client-visible files.
3. Client approval flowed visually into the client-review lane and delivery could
   skip an explicit management preparation checkpoint.
4. Final delivery lacked an exact version/file/consequence confirmation at the
   protected action.
5. Deliverable details were discoverable from Kanban but not directly from the
   deliverables list.
6. Kanban needed corrected post-approval mapping and explicit horizontal
   mouse/touch/keyboard affordances without weakening protected commands.
7. Count inputs exposed browser number spinners and accepted fractional new
   quantities. The existing UAT value `11.93` is preserved as owner data requiring
   an explicit, reasoned, audited administrative correction; it is not rounded or
   rewritten automatically.

The bounded X010-A implementation addresses these observations without a broad
visual redesign. Owner acceptance remains pending until the exact-head CI and
non-Production Preview synthetic smoke evidence are attached.

### X010-A verification update — 2026-07-29

- Exact application head `096a90e98a1664053d499e08d7a15fbbdf85a449`
  passed the complete F-001 matrix in run `30455939860`.
- The correct `samawahs-projects/shrik` Preview is Ready and UAT contains only
  the additive X010-A migration; the existing `11.93` value was not changed.
- Protected desktop smoke passed the internal roles and isolation-negative
  checks. The two client personas signed in but currently have no pending
  approval item in their scopes, so exact client payload proof is still open.
- No existing UAT client, membership, role assignment, or business record was
  changed to force the fixture. The owner should create or explicitly nominate
  one synthetic pending approval shared with the two approved client personas,
  then rerun X010-A-8.

## Owner UAT continuation — 2026-09-01

Status: `OWNER_UAT_DEFERRED_FOR_DEFECT_BURN_DOWN`. The owner authorized
implementation to continue, but did not record PASS. Unexecuted scenarios remain
open and the wider team must not be invited until the owner resumes and closes
the structured walkthrough.

### P1 functional findings

1. Marking one notification as read decremented the badge, then the full center
   failed to load and the bell showed no recent notifications while a non-zero
   unread badge remained. Root cause: the UI row parser rejected PostgreSQL
   timezone-offset `read_at` values after the first read mutation.
2. Final client delivery/files were not consistently discoverable in the client
   experience even though internal preview and delivery state existed.
3. Assigned-team client workspaces showed zero work/package counts while the
   same user had real assigned deliverables in `مهماتي`; client-scoped entry
   points and commercial visibility were misleading or routed to generic work.

### P2 product and UX findings

1. The owner rejected the shared visual density at 100% zoom: oversized cards,
   excessive blank space, weak hierarchy, long pages, and inconsistent content
   widths remain across management, team, client, contract/package, and board
   views.
2. Important cards/rows usually require a small explicit button; the whole card
   is not keyboard/mouse clickable and the action is easy to miss.
3. The universal drawer is still crowded. Its tab strip requires horizontal
   scrolling, forms create a very long nested surface, and desktop/mobile
   hierarchy does not make the next action obvious.
4. Notifications expose the English breadcrumb `notifications`; several other
   routes expose `onboard`, `Post`, raw technical copy, or inconsistent date
   formatting.
5. Contract/package areas are polluted by repeated synthetic UAT contracts and
   lack search/filter/pagination. Counts differ between list and commercial
   summary; one synthetic package displayed an invalid negative remaining value.
6. Count-based package units display fractional values such as `11.93`; package
   summaries omit delivered quantity and RTL date ranges read backwards.
7. Team/invitation cards are oversized; accepted invitations duplicate active
   members; defaults preselect account-manager and a client; one member can be
   invited to only one client despite the product supporting multi-client work.
8. Onboarding final review does not clearly summarize contributors, all dates,
   or approval settings. Empty-submit validation focuses the phone field instead
   of the invalid company field and lacks an inline field error.
9. Client profiles omit practical contact/image information even for management.
10. Synthetic onboarding and lifecycle records created during UAT must later be
    archived/quarantined through an audited safe cleanup that preserves audit and
    package-ledger history; do not destructively delete them.

### Confirmed behavior and corrected observations

- Task assignee selection exists inside `مهام التنفيذ`; the owner successfully
  created `إعداد نسخة تجريبية` assigned to the designer. The earlier “no member
  choice” note is superseded, but the onboarding review still obscures the full
  participant selection.
- Protected Kanban movement and activity logging worked.
- Internal comments persisted and appeared in activity.
- Client viewer denial and client approver decision boundaries worked in the
  exercised path.

### Burn-down order

1. Notification read/list/badge consistency (`S015-P1-133`).
2. Client final-file discoverability and assigned-team scoped-work consistency.
3. Shared shell, density, typography, card clickability, and drawer navigation.
4. Commercial data presentation and safe UAT cleanup.
5. Team/invitation and onboarding refinements.
6. Resume every deferred owner-acceptance checklist scenario and record explicit
   per-role PASS/FAIL.

### Corrective implementation update — 2026-09-01

- Read-only UAT diagnosis confirmed the delivered owner-trial item
  `s015-owner-trial-e54d621cfe` has a valid final text version but no file row;
  the client files surface therefore reported the stored truth. The preparation
  harness now persists an audited durable-upload attempt, transfers a real
  current-version PNG as the assigned writer, completes registration atomically,
  stages it through the normal internal/client-review boundary, and checks
  client image/download visibility.
  The existing UAT item was not retroactively altered.
- The assigned-team zero state came from using `CONTRACT_VIEW` as the
  deliverables gate and from falling back to empty statistics when commercial
  access was denied. Scoped `DELIVERABLE_VIEW` is now explicit for execution
  roles, and the workspace falls back to counts from the existing RLS-filtered
  deliverable list only. Writer/designer commercial access remains denied.
- Local proof: lint, typecheck, unit 71/355, integration 28/112, component
  30/137, RLS simulator 8/24, assigned-writer browser 1/1, owner hosted-test
  transform/list, secret scan, diff check, and production build PASS.
  Preview/real-Auth owner recheck remains pending; these corrections do not
  change `OWNER_UAT_DEFERRED_FOR_DEFECT_BURN_DOWN`.
