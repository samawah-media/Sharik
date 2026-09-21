# UI3 — internal drawer presentation

Status: LOCAL PASS, 2026-09-08; [verification evidence](ui3-checkpoint.md).
Baseline: 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21 plus existing dirty work.
Authority: Spec015, AGENTS.md and the owner-approved research handoff/model.

## Scope and acceptance

Keep the existing drawer, seven role-filtered tabs, all mounted form panels,
keyboard RTL arrows/Home/End, Escape/focus return, and upload close protection.
No server, permission, workflow, media-selection, dependency or data changes.
Human-written content must not be rewritten. No commit/push/deploy.

1. Rename the static eyebrow to «مساحة المخرج».
2. Use three mobile tab columns (four from sm); wrapping labels, minimum 44px
   targets, no fixed label height or horizontal tab scrolling. Seven tabs occupy
   three rows at375px, not four. Verify all labels/counts remain readable.
3. Replace the current-version missing-media tall placeholder with a compact
   icon/text row: «لا توجد صورة أو فيديو في النسخة الحالية». Retain actual
   image/video selection, contain rendering and no-version behavior.
4. In the real VersionContentForm use «مؤشر النجاح» and the explicit action
   «حفظ وإرسال للمراجعة الداخلية». Preserve draft submit=false and review
   submit=true, all fields, feedback and editability conditions.

## Task 1: Bounded production and component patch

Worker owns only src/ui/deliverables/universal-deliverable-drawer.tsx,
src/ui/deliverables/workspace-forms.tsx,
tests/component/deliverables/universal-deliverable-drawer.test.tsx and a new
tests/component/deliverables/version-content-form.test.tsx. Preserve existing
dirty changes. Add component regressions before production edits; run targeted
RED then minimal GREEN. Render the real VersionContentForm; mock only action
and router boundaries. Exercise draft/review and failure feedback with retained
input, not merely static text constants. Do not run browser/build/typecheck.
Return exact tests/results and changed files. No recursive delegation.

## Task 2: Lead browser acceptance and integration

Lead owns docs and a new tests/e2e/management/drawer-presentation.spec.ts.
Check real app375/1440: tab wrapping/targets/overflow, RTL keyboard selection,
mounted values after tab changes, compact missing-media state where fixture
permits, Escape and focus return. Reuse existing fixture routes/harness; do not
weaken old regressions. Run existing drawer-task-density regression with the
new cases, inspect screenshots and run full components/typecheck/scoped lint.
Any unexercised state remains explicitly pending, never inferred PASS.

## Coordination and rulings

| Task/interface | Check |
| --- | --- |
| 1 production/component | Disjoint from lead docs/browser; copy changes match actions |
| 2 browser consumes1 | Run after worker completes; only lead owns browser ports |

Ruling: reuse the approved design and current dirty feature checkout rather than
restart design or isolate from unfinished dependencies. Limit to the four listed
presentation changes; wrong visual density costs reversible CSS rework.
Ruling: retain evidence and do not commit/delete scratch; project handoff and
user authorization override generic skill commit/cleanup defaults.

Owner20 requirements-quality checks, real-role/hosted/CI and UI4 remain pending.
No new ADR: stack, architecture and protected behavior are unchanged.

Task1 complete: delegated bounded source/component changes; source review accepted.
Task2 complete locally: browser12PASS, component303PASS, TypeScript/lint exit0,
lead screenshot review. Owner and hosted gates are deliberately not included.
