# Owner Manual UAT Notes — 2026-07-26

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

| # | Observation | Disposition | Evidence |
|---|---|---|---|
| A1 | Image-only client review was blocked (circular guard) | fixed; S015-P1-099 / X009-D | real image renders, management stages, secrecy until send, delivery promotes |
| A2 | Uploads did not expose dependable name/type/size/progress/terminal state | fixed; X010-A durable attempts | `202607290002`; persistent E2E |
| A3 | Client send lacked a final exact-version summary | fixed; X010-A | `deliverable-actions.tsx` confirmation |
| A4 | Delivery could skip explicit management preparation | fixed; X010-A `ready_for_delivery` mandatory | `202607290001` |
| A5 | Final delivery lacked exact version/file confirmation | fixed; X010-A | confirmation section |
| A6 | Deliverable not directly openable from the list | fixed; X010-A `فتح العمل` | deliverables page |
| A7 | Kanban post-approval mapping incorrect | fixed; X010-A macro lanes | `deliverable-board.tsx` |
| A8 | Count inputs exposed spinners and fractional quantities | fixed; X010-A | integer-only count units |
| A9 | Raw technical enums in the universal drawer | fixed; S015-P1-073 | `domain-labels.ts` |
| A10 | Client viewer instructed to approve | fixed; S015-P1-074 | role-aware copy |
| A11 | Hosted-UAT synthetic seed visible in normal views | fixed; S015-P1-075 | `human-trial-visibility.ts` |
| A12 | Uppy upload surface was English | fixed; S015-P2-076 | Arabic locale |
| A13 | Cancel cleanup trusted browser path / false success | fixed; S015-P1-111/112 code + CI; hosted recheck pending | `202607300001`/`202607300002` |

#### B. Fixed technically (X010-B-1 — this slice)

| # | Observation | Disposition | Evidence |
|---|---|---|---|
| B1 | Interface density: oversized headings/cards/spacing at 100% zoom | fixed; X010-B-1 | shared core tokens tightened; component regression |
| B2 | Non-clickable cards and recent-decision rows | fixed; X010-B-1 | exception-dashboard recent items are links |
| B3 | Raw technical English status in management dashboard | fixed; X010-B-1 | `deliverableStatusLabel` applied |
| B4 | Kanban page-level overflow risk | fixed; X010-B-1 | board scroll contained; no page overflow |

#### C. Needs manual recheck (owner visual QA on Preview)

| # | Observation | Why recheck |
|---|---|---|
| C1 | Density and visual hierarchy at 100% zoom on desktop 1440×900 | owner must confirm readability after token tightening |
| C2 | Mobile Chromium density and no horizontal page overflow | owner must confirm stacked layout |
| C3 | Kanban horizontal mouse/touch/keyboard navigation | owner must confirm scroll and full-card reach |
| C4 | Arabic states everywhere (no raw enum leak) | owner must scan all surfaces |

#### D. Still open (future X010-B slices)

| # | Observation | Target slice |
|---|---|---|
| D1 | Onboarding journey difficulty (client/contract/package/deliverable) | X010-B-2 |
| D2 | Company name vs contact person confusion | X010-B-2 |
| D3 | Phone/WhatsApp missing from client entity | X010-B-2 |
| D4 | Contract reference unexplained | X010-B-2 |
| D5 | Package lines inconsistent across entry paths | X010-B-2 |
| D6 | Correction/recovery unclear after input error | X010-B-2 |
| D7 | Team assignment terminology unclear | X010-B-2 |
| D8 | Hard terminology like "مخرجاتي" and English technical states in copy | X010-B-3 |
| D9 | Client work disappears after change request; should stay visible as "عاد لفريق سماوة — قيد التعديل" | X010-B-3 |
| D10 | Empty optional fields shown; needs progressive disclosure | X010-B-3 |
| D11 | No understandable in-app notifications center (approval/change-request) | X010-B-4 |
| D12 | Files not organized as a Drive-like experience (folders/classification/previews/Arabic names) | X010-B-5 |
| D13 | "تنزيل آمن" should be simplified to "تنزيل" | X010-B-5 |
| D14 | Upload progress/failure/retry/cancel clarity for images and video | X010-B-5 (refine) |
| D15 | Universal drawer long and crowded; needs logical sections/tabs | X010-B-6 |
| D16 | Internal quality not explained; no default editable checklist | X010-B-6 |
| D17 | Owner/contributor/role display clarity; no `tenant_administrator` or synthetic data leak | X010-B-6 |
| D18 | Client profile, admin dashboard, team dashboard visual improvement | X010-B-1 partial + X010-B-6 |

### Counts

- Fixed technically: 17 (A1–A13 prior, B1–B4 this slice).
- Needs manual recheck: 4 (C1–C4).
- Still open: 18 (D1–D18), distributed across X010-B-2 through X010-B-6.

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
