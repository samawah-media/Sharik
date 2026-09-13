# Remaining findings implementation plan

> Workers use project-delegate and subagent-driven-development with lead review.

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
