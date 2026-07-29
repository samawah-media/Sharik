# Owner Manual UAT Notes — 2026-07-26

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
