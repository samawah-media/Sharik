# Remaining findings implementation plan

> Workers use project-delegate and subagent-driven-development with lead review.
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task. Workers do not commit, push, deploy, or mutate hosted data.

**Goal:** Reconcile every recorded finding, then implement bounded independent
correction waves without confusing source changes with owner acceptance.
**Architecture:** Existing UI and authorization contracts only in the first wave.
**Tech Stack:** Existing Next.js, TypeScript, React and Vitest.
**Spec:** `../spec.md`, X010-B-7C-23.

## Global constraints

- Preserve internal/client visibility, audit, SLA, payloads and permission checks.
- No hosted data edits, new dependency, migration, commit, push or deploy by workers.
- Preserve pre-existing dirty evidence and next-env.d.ts.
- Use canonical tasks/evidence, not a competing roadmap. Lead owns shared docs.
- No nested delegation. Short Saudi copy must remain precise about permissions.
- Baseline: `61da7985bcd1a00802e1846291cf769710cbccd1`.

## Task 1: complete inventory (read-only worker)

- [x] Reconcile defect-register.md, owner-acceptance-walkthrough-ar.md, tasks.md
  and implementation evidence, including old SIL and S015-P2 entries.
- [x] Return each unresolved ID as unimplemented, implementation pending checks,
  verified, or product/data decision; point to source evidence and duplicates.
- [x] Lead publishes the reconciled table in the existing delegation queue.

## Task 2: SIL-59 and SIL-63 copy (implementation worker)

Allowed source: `src/ui/deliverables/workspace-forms.tsx` and
`src/ui/client/client-home.tsx`. Allowed new tests:
`tests/component/deliverables/workspace-copy.test.tsx` and
`tests/component/client/client-home-copy.test.tsx`.
Interfaces: existing form props/save payload and ClientHome `canApprove` and
`pendingCount`; no interface changes or new cross-task shared helpers.

- [x] Add failing component tests for accessible descriptions and viewer copy.
  Assert `getByLabelText('الموجز').toHaveAccessibleDescription(...)` using:
  brief: `وش المطلوب؟ وضّح الفكرة والجمهور وأهم التفاصيل للفريق.`;
  content: `اكتب النص اللي بيظهر داخل التصميم أو الفيديو.`;
  caption: `اكتب النص اللي بينزل مع المنشور، مثل الدعوة للتفاعل والوسوم.`
  Use associated IDs/aria-describedby outside the label so its name is stable.
- [x] Test viewer and approver with pendingCount 0 and 2. Viewer text must not
  contain `قرارك`; viewer CTA: `2 أعمال قيد المراجعة` or `لا توجد أعمال قيد المراجعة`.
  Viewer works description: `تابع الأعمال قيد المراجعة والتعديل، والأعمال المسلّمة.`
  Approver retains existing decision wording and routes.
- [x] Run focused RED, implement only presentation copy, run focused GREEN:
  `npm run test:component -- tests/component/deliverables/workspace-copy.test.tsx tests/component/client/client-home-copy.test.tsx`.
- [x] Lead inspects actual diff and runs TypeScript/lint; independent review
  must approve spec compliance and code quality. Hosted acceptance stays pending.

## Task 3: SIL-06 client identity

- [x] Implementation worker owns only universal-deliverable-drawer.tsx and
  team-workspace.tsx under src/ui, and focused drawer/team-workspace component tests.
- [x] Add RED regression, then render existing authorized clientName in header;
  pass clientNames[deliverable.clientId] from My Tasks. Missing/blank fallback:
  `العميل غير متاح`. Wrap long RTL names; keep close control usable.
- [x] Lead reviews actual diff, runs focused tests, typecheck and scoped lint.
- [x] Documentation steward updates only delegation-queue.md after lead evidence.

No new fetch, dependencies, permission changes, commits or deployments by workers.
Lead owns this plan/spec/tasks and shared validation; docs steward owns only queue.

Task3 local evidence: worker RED5 failures/21 passes then GREEN26/26;
lead independently reran the two focused suites:26/26 PASS, TypeScript PASS,
scoped ESLint PASS. Actual three-file diff reviewed: existing authorized name
only, unchanged payloads/permissions. CSS wrapping is source-checked, not a
browser-layout acceptance result. Hosted, visual and owner checks remain open.


## Integration and follow-up

Local outcome: Task1 accepted; Task2 independent spec/quality review PASS;
focused7/7 and lead combined component28files/230tests PASS; TypeScript and
scoped lint PASS. Source changes are not published and owner checks remain open.

The inventory and copy slice share no write files or contracts. All further
implementation waves need explicit file ownership and acceptance criteria in
this plan before workers start. Sensitive permission/data findings remain
separate from copy fixes. CI for the preceding batch must be reconciled, not
cancelled or interpreted as coverage for these new changes.

## R23-C next wave — identity, Arabic search, and mobile containment

**Owner approval:** On 2026-09-14 the owner approved this batch, authorized
task-bounded use of Z.ai GLM and Spark/other approved models, and required all
changed product copy to use friendly, simple Saudi Arabic without weakening
permission or state precision.

**Baseline:** `cc0bc57e4c7ac8e72e487577b47c34e1c93ff4dd`, with the pre-existing
dirty `next-env.d.ts` and four evidence/task files preserved. The preceding
batch's hosted/owner checks stay deferred and open; they are not run or counted
as evidence for this wave.

**Architecture:** This is a UI/read-model wave on the existing Next.js and
Supabase architecture. It adds no dependency, migration, policy, workflow,
permission, SLA, audit, or tenancy change and therefore needs no ADR. Every
new query remains server-side and explicitly tenant/user scoped. No UUID, raw
role enum, or internal terminology may enter visible copy or serialized UI
solely to detect session changes.

**Saudi copy rubric:** Prefer one short, natural line; use the established
Saudi register (for example «عشان» where it improves clarity); reuse Arabic
role labels and the existing «الأعمال/أعمالي/بانتظار موافقتي» glossary; state
the user's role, current condition, and next step honestly; never expose raw
enums, UUIDs, tenant/RLS terms, internal comments, or permissions the user does
not have. Automated no-enum/no-UUID assertions accompany human copy review.

### Task 4: SIL-10 and SIL-16 — team identity and stale-tab clarity

**Worker route:** `zai-coding-plan/glm-5.3`, bounded implementation in an
isolated current-baseline copy. No recursive delegation.

**Files:**
- Create `src/server/auth/shell-identity.ts` for one fail-closed, tenant/user-
  scoped display projection.
- Create `src/ui/auth/session-change-notice.tsx` for browser-only cross-tab auth
  change detection and the refresh notice.
- Modify `src/app/(management)/layout.tsx`, `src/app/notifications/page.tsx`,
  and `src/ui/layout/product-shell.tsx`.
- Create `tests/unit/auth/shell-identity.test.ts` and
  `tests/component/auth/session-change-notice.test.tsx`.
- Modify `tests/component/product-shell.test.tsx`.

**Interfaces:**
- `ShellIdentity = { displayName: string; roleLabels: string[] }`.
- `readShellIdentity({ supabase, actor }): Promise<ShellIdentity>` scopes
  `member_profiles` by both `actor.tenantId` and `actor.userId`, applies the
  existing safe display-name helper, and derives unique Arabic labels only from
  active role assignments. Failure returns safe name/role fallbacks; it never
  exposes an email, user ID, raw enum, or another tenant's profile.
- `SessionChangeNotice` captures the initial browser session privately, ignores
  the initial auth event, and shows a notice only when a later auth event changes
  or removes that account. It must not serialize an expected user ID. Refresh is
  a full-page reload so the server authorization boundary is re-evaluated.
- `ProductShell` receives optional `accountIdentity` presentation data and
  renders a wrapping name plus Arabic role line instead of «حساب الفريق» alone.

- [x] Add failing unit tests for exact tenant/user query scope, safe fallback,
  multiple unique Arabic roles, and no raw identity leakage.
- [x] Add failing component tests for name/role presentation and the Saudi
  notice: «تغيّر الحساب في تبويب ثاني. حدّث الصفحة عشان تكمل بالحساب الصحيح.»
  with action «تحديث الصفحة».
- [x] Run only the new/focused RED command:
  `npm run test:unit -- tests/unit/auth/shell-identity.test.ts --maxWorkers=1`
  and `npm run test:component -- tests/component/auth/session-change-notice.test.tsx tests/component/product-shell.test.tsx --maxWorkers=1`.
- [x] Implement the minimal scoped read model, notice, and shell wiring.
- [x] Re-run the same focused commands to GREEN. Do not run preceding-batch
  hosted, persistent, database, full-suite, or owner checks.
- [x] Return exact files, RED/GREEN counts, risks, copy choices, and unrun gates.

### Task 5: SIL-11 — Arabic search normalization on existing fields

**Worker route:** `zai-coding-plan/glm-5.3-flash`, first bounded implementation
trial for this listed subscription model, in an isolated current-baseline copy.
Failure or weak review does not authorize a paid fallback.

**Files:**
- Create `src/modules/localization/arabic-search.ts` and
  `tests/unit/localization/arabic-search.test.ts`.
- Modify `src/modules/commercial/commercial-presentation.ts`,
  `src/ui/management/team-workspace.tsx`,
  `tests/unit/commercial/commercial-presentation.test.ts`, and
  `tests/component/deliverables/team-workspace.test.tsx`.
- Modify only the existing ContractList/PackageList component test files if
  repository discovery proves their current search coverage lives there; do
  not create a new search surface.

**Interfaces:**
- `normalizeArabicSearchText(value: string): string` performs Unicode
  normalization, strips Arabic combining marks and tatweel, normalizes composed
  alef/hamza forms through decomposition, collapses whitespace, lowercases with
  Arabic locale, and trims. It does not transliterate or add a dependency.
- `paginateCommercialItems` uses the helper on both query and the supplied
  search text. Its field sets remain unchanged: contract name/reference/summary
  and package name/service labels.
- TeamWorkspace searches only authorized rows already in memory: deliverable
  name, authorized client display name, and the existing Arabic deliverable-type
  label. It does not add or broaden a query.

- [x] Add failing unit cases for matching text with/without harakat, tatweel,
  composed hamza/alef variants, whitespace, mixed Arabic/Latin text, and empty
  input without over-normalizing unrelated characters.
- [x] Add failing component/unit cases for the three exact search surfaces and
  the Arabic deliverable-type label.
- [x] Run only the new/focused RED files with `test:unit` and
  `test:component -- --maxWorkers=1`; record genuine expected failures.
- [x] Implement the pure helper and minimal existing-surface wiring.
- [x] Re-run the same focused files to GREEN; run no previous-batch acceptance.
- [x] Return exact files, model identifier, checks, and any false-positive risk.

### Task 6: SIL-65 and SIL-67 — mobile navigation and notification containment

**Dependency:** Start after Task 4 is integrated so ClientShell may reuse the
accepted `SessionChangeNotice` without overlapping ownership.

**Worker route:** `zai-coding-plan/glm-5.3`, bounded implementation in an
isolated current-baseline copy. No recursive delegation.

**Files:**
- Modify `src/ui/client/client-shell.tsx`,
  `src/ui/notifications/notification-bell.tsx`,
  `src/app/(client)/client/layout.tsx`, and `src/app/notifications/page.tsx`.
- Modify `tests/component/product-shell.test.tsx` and
  `tests/component/notifications/notification-bell.test.tsx`.
- Create `tests/e2e/mobile-shell-containment.spec.ts`; do not modify shared
  visual suites or their historical assertions in this worker.

**Interfaces and visual decision:**
- Keep the existing horizontal client navigation, all five destinations, and
  `aria-current`. Add scroll-snap/edge affordance, the Saudi hint «مرّر عشان
  تشوف باقي الأقسام», and initial active-link reveal without changing routes.
- Keep NotificationBell as the quick `menu`. On mobile it becomes viewport-
  fixed with 16px horizontal insets, a bounded `dvh` height, and internal
  scrolling; at the existing desktop breakpoint it retains anchored popover
  behavior. Do not introduce a Sheet/dialog dependency or change unread data,
  routes, mark-read semantics, or notification copy.
- ClientShell reuses the accepted session-change notice; no account ID is passed
  into the client tree.

- [x] Add failing component tests for all five navigation destinations,
  affordance/hint semantics, current destination, menu interaction, Escape, and
  unchanged unread routes/counts.
- [x] Add failing Playwright geometry cases at 390x844 and 400px widths:
  document width never exceeds viewport; active client link is visible; every
  destination becomes reachable by scroll/focus; menu left >= 16, right <=
  viewport-16, top >= 0, bottom <= viewport, and long content scrolls inside it.
- [x] Observe focused component RED before production edits, then implement the smallest
  responsive correction.
- [ ] Run only the new component files and the new browser spec serially. Preserve
  keyboard focus, RTL direction, 44px targets, and existing desktop behavior.
- [ ] Return screenshots/measurements from this new spec, exact checks, Saudi
  copy review, and all unrun previous-batch/hosted gates.

### Lead integration and review

- [x] Before each external writer, capture tracked/untracked manifests and hashes;
  give each writer an isolated copy containing required current changes only.
- [x] Inspect each result.json, reported model, actual diff, and unexpected files.
  A worker report is not acceptance.
- [x] Review Task 4 before Task 6. Resolve `notifications/page.tsx` and
  `product-shell.test.tsx` ownership serially; never run overlapping writers.
- [x] Use a separate bounded read-only reviewer (prefer verified
  `zai-coding-plan/glm-4.7`; Spark is allowed when its context overhead is
  justified) for spec, security, Saudi copy, and regression review.
- [ ] After accepted integration, run only new-batch focused tests, TypeScript,
  scoped ESLint, diff check, and the new mobile browser spec. Full regression,
  persistent/database, prior-batch hosted checks, CI, Preview, and owner UAT
  remain deferred unless the owner separately resumes them.
- [x] Update canonical task/evidence state with actual results, provider/model,
  session/run reference, revisions, reported usage/cost, risks, and unrun gates.

### R23-C local integration outcome — 2026-09-14

Tasks 4 and 5 are locally accepted and integrated. Their implementer was
`zai-coding-plan/glm-5.3`; the independent reviewer was
`zai-coding-plan/glm-4.7`. Task 5 used the same GLM-5.3 session for one Unicode
fix round after the lead promoted rare Arabic combining-mark completeness to a
required correction. All reported ZAI runs reported `$0`; account ownership
remains user-confirmed rather than independently exposed by the credential.

Task 6 began in the same `zai-coding-plan/glm-5.3` session and produced genuine
component RED (4 failed / 24 passed), then two relay/browser attempts hit Windows
process and Next/Turbopack warm-up memory failures. A native `gpt-5.6-sol`
implementer preserved the GLM tests and completed the source. External export of
the review package to GLM-4.7 was rejected by platform safety review, so no Task 6
GLM review is claimed; native `gpt-6-astra` performed the independent review.
Two reviewed fix rounds removed mobile backdrop-filter containing blocks from
both shared shells and strengthened post-expansion/sticky-header geometry
assertions. Final source verdict: `SPEC APPROVED`, `QUALITY APPROVED`.

The final whole-batch review then found one Important management-shell risk: a
long single-token display name could retain intrinsic width and push mobile
account controls outside the viewport. A focused RED/GREEN correction added
shrink/wrap constraints while preserving the bell and sign-out controls. The
same independent `gpt-6-astra` reviewer rechecked the actual diff and returned
`ADDRESSED — APPROVE`, with no remaining Critical or Important finding. This is
source/component evidence; management-shell browser geometry is not claimed.

Lead-fresh combined new-batch evidence: unit 3 files / 21 tests PASS; component
4 files / 50 tests PASS; scoped ESLint, TypeScript and `git diff --check` PASS.
The new Playwright file collects 6 cases across `390×844` and `400×844`, but the
configured web server again aborted while warming `/` before any case began.
Therefore SIL-65/SIL-67 real geometry, measurements and screenshots remain
blocked and are not accepted. Full regression, persistent/database, prior-batch
hosted checks, CI, Preview, build and owner UAT remain explicitly deferred.

## R23-F next wave — internal labels and file UX

**Owner approval:** The owner's 2026-09-14 instruction to continue the recorded
improvement batches covers this bounded implementation wave. Workers may change
only the files listed per task and may not commit, push, deploy, mutate hosted
data, or broaden permissions.

**Architecture:** These are presentation/download corrections on the approved
Next.js, Supabase Storage and Uppy stack. They add no dependency, migration,
RLS, permission, workflow, audit, SLA or tenancy change, so no ADR is required.
SIL-60 and SIL-62 have disjoint ownership. SIL-64 starts only after SIL-62 is
accepted because both modify `workspace-files.tsx`.

### Task 7: SIL-60 — Arabic display for automatic internal workflow comments

**Files:**
- Modify `src/modules/deliverables/domain-labels.ts`.
- Modify `src/ui/deliverables/universal-deliverable-drawer.tsx`.
- Modify `tests/unit/deliverables/domain-labels.test.ts`.
- Modify `tests/component/deliverables/universal-deliverable-drawer.test.tsx`.

**Interface:** Add
`localizeInternalWorkflowCommentBody(body: string): string`. Exact-match only:
`internal_approval` → «تم الاعتماد الداخلي»،
`send_to_client_after_internal_approval` → «تم إرسال النسخة المعتمدة للعميل»،
`prepare_exact_approved_version_for_delivery` → «تم تجهيز النسخة المعتمدة
للتسليم»، and `delivery_after_exact_version_confirmation` → «تم تأكيد التسليم
النهائي». Unknown tokens and human-authored Arabic/multiline text return exactly
unchanged. The Drawer applies it only when `comment.type === "internal_comment"`.
Do not change stored bodies, hidden action defaults, RPCs, audit, visibility, or
the client renderer.

- [x] Add unit RED for all four exact tokens plus unknown and human text.
- [x] Add Drawer RED with the two hosted-reproduced internal-only tokens, a
  normal internal comment, Arabic visibility label and absence of raw tokens.
- [x] Run focused RED:
  `npm run test:unit -- tests/unit/deliverables/domain-labels.test.ts --maxWorkers=1`
  and `npm run test:component -- tests/component/deliverables/universal-deliverable-drawer.test.tsx --maxWorkers=1`.
- [x] Implement only the exact display projection and rerun both to GREEN.
- [x] Run scoped ESLint, TypeScript and diff check; independent reviewer must
  confirm internal/client separation and no durable-data semantic change.

### Task 8: SIL-62 — complete the visible Uppy Arabic drop-zone phrase

**Files:**
- Modify `src/ui/deliverables/workspace-files.tsx`.
- Modify `tests/component/deliverables/workspace-file-upload-cancel.test.tsx`.

**Interface:** In the existing project-local Uppy locale, replace the unused
`dropHereOr` entry with the installed Dashboard 5.1.1 key/value
`dropPasteFiles: "أفلِت الملفات هنا أو %{browseFiles}"`. Preserve
`browseFiles: "استعراض الملفات"`. Replace the unused `dashboardTitleV2` with
`dashboardTitle: "رفع الملفات"` so the inline Dashboard region also has the
Arabic accessible label. Preserve the `%{browseFiles}` placeholder exactly and
do not add `@uppy/locales` or change upload behavior.

- [x] Extend the existing Uppy boundary mock to retain constructor options.
- [x] Add focused RED proving both installed keys/Arabic values are present and
  the two stale keys are absent.
- [x] Run focused RED:
  `npm run test:component -- tests/component/deliverables/workspace-file-upload-cancel.test.tsx --maxWorkers=1`.
- [x] Apply the four locale-key edits and rerun the same file to GREEN.
- [x] Run scoped ESLint, TypeScript and diff check; independent reviewer must
  confirm accessibility and that no upload/storage behavior changed.

### Task 9: SIL-64 — preserve the authorized Arabic filename on download

**Dependency:** Start after Task 8 is integrated. The trusted filename is only
`file_name` returned by `s015_authorize_file_download`; never accept bucket,
path, name, tenant, client or visibility from the browser.

**Files:**
- Create `src/modules/files/download-filename.ts`.
- Create `src/ui/files/browser-file-download.ts`.
- Modify `src/server/actions/deliverable-workspace-actions.ts`.
- Modify `src/ui/client/client-files-board.tsx`.
- Modify `src/ui/deliverables/workspace-files.tsx`.
- Create `tests/unit/files/download-filename.test.ts`.
- Create `tests/unit/deliverables/workspace-file-download-action.test.ts`.
- Modify `tests/component/client/client-files-board.test.tsx`.
- Create `tests/component/deliverables/workspace-file-download.test.tsx`.
- Modify `tests/e2e-persistent/support/s015-persistent-local.ts` and
  `tests/e2e-persistent/s015-persistent-browser.spec.ts` only for the final
  real-browser filename assertion.

**Interfaces:**
- `sanitizeDownloadFilename(value: string | null | undefined): string`
  preserves ordinary Unicode/Arabic and the extension; removes CR/LF/NUL,
  `/`, `\\`, Windows-reserved filename characters, bidi override controls and
  trailing dots/spaces; empty output becomes «ملف». It never URI-decodes input.
- `createWorkspaceFileDownload(fileId)` keeps the exact UUID/RPC authorization,
  bucket/path and 60-second TTL, creates a plain signed object URL, and returns
  `{ ok: true, url, fileName }` where `fileName` is sanitized from the RPC row.
- `downloadBrowserFile({ url, fileName }): Promise<void>` fetches the signed
  object, rejects non-OK responses, creates one object URL, clicks one temporary
  anchor with the exact `download` name, removes it, and always revokes the URL.
  Both existing client/team controls use this helper and retain Arabic failure
  feedback; no `window.open` download path remains.

- [x] Add sanitizer RED for Arabic preservation, empty fallback, control/path/
  bidi/reserved characters, trailing dots/spaces and inert `%0D%0A`.
- [x] Add server-action RED for invalid/denied fail-closed behavior, exact RPC
  metadata name, ASCII storage path, plain signed URL and returned safe name.
- [x] Add client/team component RED for one fetch/click, exact Arabic download
  attribute, cleanup/revoke, non-OK failure feedback and no anchor on failure.
- [x] Run only those new/focused unit and component files to observe RED, then
  implement the minimal helper/action/control changes and rerun to GREEN.
- [x] Run TypeScript, scoped ESLint and diff check; independent review must check
  authorization, filename injection, CORS/memory cleanup and shared behavior.
- [x] Attempt the bounded persistent Chromium case once: use an Arabic metadata
  name with an ASCII storage path and assert
  `download.suggestedFilename() === "قالب الاراء.png"`. If local infrastructure
  blocks execution, record it as pending rather than weakening the assertion.

### R23-F lead integration

- [x] Capture each writer baseline and exact ownership; reject unexpected files.
- [x] Review Tasks 7 and 8 independently before integration; integrate Task 8
  before starting Task 9 because of shared `workspace-files.tsx` ownership.
- [x] After accepted integration, run the focused wave tests, TypeScript, scoped
  ESLint and diff check. Run no hosted mutation, commit, push or deployment.
- [x] Update tasks, defect register and delegation queue with exact evidence and
  keep persistent-browser, CI, Preview, hosted and owner gates distinct.

### R23-F local integration outcome — 2026-09-14

Task 7 used a native bounded implementer and independent reviewer. Initial RED
was unit 8 failed / 7 passed and component 1 failed / 18 passed; first GREEN was
unit 15/15 and component 19/19. Review HOLDed an inherited-object-key collision
for unknown bodies such as `constructor`; the correction replaced the lookup
with a `Map`, added genuine RED3/15, then GREEN18/18. Final review returned
`SPEC APPROVE` / `QUALITY APPROVE` with no findings. Stored comments, audit,
visibility and client rendering are unchanged.

Task 8 produced RED1/2 then GREEN3/3. Independent review verified the exact
installed Uppy Dashboard 5.1.1 keys and returned `SPEC APPROVE` /
`QUALITY APPROVE`; no dependency or upload/storage behavior changed.

Task 9 produced genuine action/sanitizer RED plus component RED4/6, then focused
unit 10/10 and component 10/10 GREEN. Independent `gpt-6-astra` review returned
`SPEC APPROVE` / `QUALITY APPROVE` with no Critical or Important finding. Its
only Minor cleanup-exception coverage gap was added; final component became
11/11 and re-review returned `ADDRESSED` with no remaining finding.

Lead-fresh combined R23-F evidence: unit 3 files / 28 tests PASS; component 4
files / 33 tests PASS; TypeScript, scoped ESLint and `git diff --check` PASS.
The persistent Playwright file collects one journey, but the one allowed runtime
attempt exited before any test because its web-server guard refused a non-local
Supabase URL. The exact Arabic `suggestedFilename` assertion remains intact and
pending. Real browser CORS/Blob behavior and up-to-100-MiB memory use, full
regression, database/RLS, build, CI, Preview, hosted and owner UAT are not
claimed.

A fresh read-only final combined `gpt-6-astra` review inspected Task 7–9
integration plus canonical claims and returned `APPROVE` with no Critical,
Important or Minor finding. It ran no tests and does not change the pending
runtime/publication gates above.

## R23-G next wave — team portfolio composition

**Architecture:** SIL-70 uses the existing role-aware navigation result to
compose `/portfolio` differently for management and assigned-team actors. It
changes no route guard, permission, query scope, RLS, workflow, SLA, audit or
dependency; no ADR is required.

### Task 10: SIL-70 — put assigned clients first for team actors

**Files:**
- Modify `src/app/(management)/portfolio/page.tsx`.
- Modify `src/ui/layout/product-shell.tsx`.
- Modify `tests/component/management/portfolio-page.test.tsx`.
- Modify `tests/component/product-shell.test.tsx`.
- Modify `tests/e2e/management/assigned-team-client-workspace.spec.ts` only for
  the bounded 400×844 role-composition assertion.

**Interface and copy:** Keep `isManagementPortfolio` derived from the existing
`management.clients` navigation item. Management retains its current dashboard,
reads and ordering. The team branch renders H1 «عملائي», description «العملاء
المسندون لك. افتح مساحة العميل لمتابعة المخرجات والمهام.», then
`AssignedClients` immediately, with no management exception dashboard or its
deliverable reads. Change the non-root `portfolio` breadcrumb segment to
«عملائي»; management `/portfolio` still uses its root override «لوحة الإدارة».
Team breadcrumb becomes exactly «مهامي > عملائي». Do not change authorized
clients or card destinations.

- [x] Add component RED proving the assigned-team branch omits dashboard/error,
  skips `listScopedDeliverables`, shows the exact copy and puts client cards first.
- [x] Add shell RED for team «مهامي > عملائي» and unchanged management root.
- [x] Run the two focused component files to observe RED, implement the minimal
  branch/label correction, then rerun to GREEN.
- [x] Run TypeScript, scoped ESLint and diff check; independent review must
  verify management parity and no authorization/data-scope change.
- [x] Attempt the bounded mobile browser assertion once: H1 and first assigned
  client visible initially, no management regions/breadcrumb, no body overflow,
  authorized card still opens. Record infrastructure failure without weakening.

### Owner decision before Task 11: SIL-58/SIL-69

Source/product audit confirmed `/work` currently mixes owner, contributor and
broader authorized client context under «مهامي», while next-action copy is based
on status alone. The recommended disposition is to preserve every authorized
row but default the UI to «يحتاج إجراء مني», add «المسند لي» and «كل العمل
المصرّح لي», show the relationship reason, and derive one actor-aware next action
from assignment plus executable capability for both row and Drawer. This needs
explicit owner approval because it changes the default work-list semantics and
ordering. SIL-68 task-edit authority and SIL-72 designer authoring remain
separate decisions and must not be changed incidentally.

### Task 10 local outcome — 2026-09-14

The bounded implementer produced genuine component RED2/27 and GREEN29/29.
TypeScript, scoped ESLint and diff check PASS. Independent `gpt-6-astra` review
returned `SPEC APPROVE` / `QUALITY APPROVE` with no Critical or Important
finding. The source keeps management composition/reads unchanged and returns the
team branch before deliverable reads. One browser attempt aborted during Next
warm-up before any case; the spec collects two cases, but 400×844 geometry and
hosted actor continuity remain pending. The fixture card link drops `?as`, so it
cannot prove continued writer identity after navigation; no such claim is made.

## R23-G2 owner-approved My Work semantics — 2026-09-14

Owner decision: **approved** the recommended default «يحتاج إجراء مني» while
preserving every already-authorized row through explicit filters. This is a
presentation/read-model correction for SIL-58/SIL-69, not an authorization,
RLS, workflow, SLA, audit, database-schema, or command change.

### Task 11 — actor-aware My Work projection

Acceptance contract:

1. Add one pure presentation module that derives, for each already-authorized
   deliverable, the actor relationship (`owner`, `contributor`,
   `open_assigned_task`, or `role_context`), whether the actor currently needs
   to act, and one Arabic next-action sentence shared by the list row and its
   Drawer.
2. Enrich the existing tenant/client-scoped workspace-summary read only with
   the minimum task facts needed to detect an open task assigned to the current
   actor. Keep other summary callers backward-compatible and do not broaden the
   selected clients, deliverables, fields exposed to the browser, or RLS scope.
3. `/work` passes actor identity and per-resource existing capability results
   into the pure projection. Capability display must never grant an action;
   server actions and existing authorization remain authoritative.
4. Default filter is `يحتاج إجراء مني`; add `المسند لي` and
   `كل العمل المصرّح لي`. The last filter must make every input row reachable.
   Relationship copy is exactly one of: `أنت المسؤول`, `أنت مشارك في المخرج`,
   `عندك مهمة داخل المخرج`, `ظاهر لك بحكم دورك`.
5. A status-only suggestion is not enough to mark work actionable. Work needs
   actor action only when an open assigned task exists or the actor relationship
   plus the existing per-resource capability supports the next workflow step.
   Otherwise show `بانتظار … — ما عليك إجراء الآن` or a terminal no-action
   message. Do not imply that a writer/designer can internally approve, send to
   the client, or deliver.
6. Sort visible work by: needs actor action first; overdue then at-risk SLA;
   nearest effective due date; priority (`urgent`, `high`, `normal`, `low`);
   newest `updatedAt`; stable `id`. Search, priority, SLA, list/board modes,
   authorized previews, Arabic normalization, and whole-row Drawer activation
   remain intact.
7. Pass the computed actor-aware next action into
   `UniversalDeliverableDrawer` for `/work`; keep the existing fallback copy for
   every other Drawer caller.
8. Test first: pure unit matrix and stable ordering; summary-query actor-task
   aggregation and scope; component default/all/assigned filters, relationship
   reasons, non-action waiting copy, list/Drawer parity, and existing filter
   regressions. Add/extend a browser fixture only if it can preserve actor
   identity without weakening production fixture guards.

Out of scope: SIL-68 task-authority changes, SIL-72 role-form controls, any new
permission, database migration, policy, action, dependency, hosted mutation,
invitation, deployment, commit, push, or Production work.

### Task 11 pause checkpoint — 2026-09-14

Owner paused execution during fix round 2. The initial actor-aware projection,
filters, scoped open-task summary and row/Drawer sharing are present locally.
Fix round 1 corrected delivery-authority presentation, `NaN` ordering, and
static list-to-board Drawer parity; lead-fresh unit21/21, component47/47,
TypeScript and scoped ESLint passed. Re-review found one remaining Important
case: optimistic Kanban status movement changes board-local items while the
passed next-action map remains based on parent deliverables, so Drawer guidance
can be stale after success or rollback. Resume with test-first success/failure
drag coverage and board-local projection, then re-review. Task 11 remains
**INCOMPLETE / HOLD**. No commit, push, deploy, hosted mutation, DB gate, build,
full regression, browser or owner acceptance occurred.
