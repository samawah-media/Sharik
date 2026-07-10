# Samawah MVP execution spine

## Owner objective

End the repeated readiness-plan cycle and complete one persistent, database-backed Hadna-only MVP suitable for controlled local acceptance and later owner-approved hosted UAT.

## Canonical execution rule

`specs/015-persistent-mvp-pilot-completion/tasks.md` is the only next-work source. R-007 through R-011A and Stage 2C are historical evidence, not active plans. WIP limit: one active Spec Kit package.

## Stable milestones

0. Baseline consolidation; 1. canonical package; 2. persistent foundation; 3. persistent workflow wiring; 4. local internal acceptance; 5. hosted handoff preparation only.

No Stage letters follow Stage 2C. Do not create readiness, verification, defect, or handoff packages. A future Spec is allowed only when product scope materially changes, not for defect fixing or verification.

## Exit gates

Each milestone requires evidence, explicit blockers, tenant/client isolation, audit coverage, and truthful PASS/BLOCKED/SKIPPED status. Local MVP acceptance cannot be claimed while DB RLS is blocked. Hosted UAT and Production acceptance remain separate owner decisions.
