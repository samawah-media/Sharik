# UI4 — client approval presentation

Status: LOCAL PASS,2026-09-08. [Verification](ui4-checkpoint.md).
Owner requested UI4 after UI3 LOCAL PASS; owner/hosted acceptance still pending.
Authority: Spec015 and approved three-screen prototype/voice-guide/handoff.
Baseline HEAD115fb9af plus existing dirty work. Preserve all prior changes.

## Requirements and scope

- Client detail shows preview before decision in mobile DOM/visual order; at
  desktop lg use a two-column review area with preview on RTL right and decision
  on left, aligned at the top. Files/comments/metadata remain available below.
- Client review shows full title/caption instead of line-clamping the decision
  material. Add one explicit shared ContentPreviewCard presentation prop with
  existing compact behavior as default; only client detail opts into full text.
  Do not change source selection, user text, media, scopes or data reads.
- Approval button becomes «اعتماد النسخة». The existing versionLabel is visible
  beside the decision heading even when showSummary=false. No parsing version
  numbers or inventing a version when a human label is provided.
- Keep reason label «سبب التعديل», add placeholder «وش التعديل المطلوب على النسخة؟».
  Technical missing-server-action copy becomes «إجراءات الموافقة غير متاحة الآن.».
  Summary eyebrow must not tell a viewer/nonactionable item «بانتظار قرارك».
- Preserve all hidden fields, revision/idempotency keys, action bindings,
  required500-character reason, permission/actionability/missing-payload guards,
  viewer read-only state, comments/files and honest unavailable states.
- No new dependency, server/auth/RLS/SQL/SLA/ledger/workflow changes, commit,
  push/deploy or invitations. No owner acceptance implied;20checks stay pending.

## Task1 — delegated implementation/component tests

Allowed production: src/ui/client/client-approval-panel.tsx,
src/ui/client/client-deliverable-detail.tsx,
src/ui/deliverables/content-preview-card.tsx.
Allowed tests: tests/component/client/*.test.tsx and
tests/component/deliverables/content-preview-card.test.tsx, only directly affected
assertions or bounded new behavior tests. Test before code; preserve all existing
guards/assertions except intentional label updates. Verify actual FormData and
action wiring, viewer/nonactionable/missing-server boundaries, full-text opt-in.
Only focused component commands allowed to worker; lead owns shared browser,
typecheck/lint, docs. No recursive delegation or broad refactor.

## Task2 — lead integration/browser evidence

Lead owns tests/e2e/client: change approval-button locators only in old tests,
retain geometry/guard assertions. Extend existing density test to verify preview
before decision on mobile and beside it on desktop, visible version at decision,
unclipped long review text, keyboard/reason retention and no overflow. Existing
viewer/approver fixture regression must run. No fixture persistence claim.
Run full components, typecheck, scoped lint and browser profiles; inspect images.
Document any failed/unexecuted gates in the canonical owner walkthrough.

## Coordination

Additional isolated visual check: real ContentPreviewCard rendered with compiled
project CSS at375/1440, full and default modes, long title/caption. Separate
worker may own only tests/visual/content-preview-review.test.tsx and update the
visual config include list; no application fixture or runtime-harness changes.

Task1 writes source/components; Task2 writes browser/docs. Disjoint writes;
browser starts after implementation, shared outputs remain lead-owned.
Native Astra medium selected for cross-component review/decision semantics;
no external provider retry. Usage/cost unknown. Same dirty feature checkout is
required to retain prior UI1–UI3 dependencies. No new ADR needed.
