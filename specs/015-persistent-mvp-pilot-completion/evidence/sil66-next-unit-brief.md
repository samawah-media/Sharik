# SIL-66 next-unit guidance — bounded implementation brief

## Objective

Make the existing one-count-unit-per-deliverable rule understandable and
actionable after creation. Do not introduce a bulk model or child items.

## Required behavior

1. On the management client deliverables page, a successful ordinary creation
   is bound to the exact newly persisted deliverable ID. It explains that one
   independent unit was created and shows that deliverable's selected package
   line ledger-derived remaining capacity. A generic/manual `saved=created`
   query must not show guidance for the first list item.
2. While count-unit capacity remains, an authorized manager can choose
   «إضافة المخرج التالي» and land on the existing create form with that exact
   active, current-client package and line preselected. A newer active package
   must not silently replace the requested package.
3. The form may suggest a short human name using the next ordinal and committed
   total, without trusting URL data for authorization or capacity.
4. Exhausted capacity exposes no next-unit action. Execution-only roles gain no
   create action. Historical multi-quantity rows are untouched.

## TDD and verification

- Add focused component/page regressions and prove they fail before production
  edits, then pass.
- Cover remaining capacity, exhausted capacity, invalid/foreign preselection
  fallback, and no permission expansion.
- Preserve server-side package-line/client/capacity validation and existing
  audit/idempotency behavior.

## Worker scope

The worker may edit only the minimum relevant files under:

- `src/app/(management)/clients/[clientId]/deliverables/`
- `src/ui/management/deliverable-form.tsx`
- focused tests under `tests/component/deliverables/`
- `src/server/actions/deliverables.ts` only for returning the exact created
  deliverable identity in the existing success redirect, plus a focused action
  regression if the current test architecture supports it.

Do not edit migrations, server actions, authorization, shared evidence files,
dependencies, or configuration. Report RED and GREEN commands and every file
changed. Do not commit, push, deploy, or mutate hosted data.
