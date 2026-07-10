# Future Route Contract: R-011A / R-011B / R-011C

Date: 2026-07-09

This contract defines possible future owner routes. R-011 does not execute any route.

## R-011A: Limited Hosted Completion With Mutation Approval

Use when the owner wants to reduce or close the three unresolved hosted categories before production-candidate review.

Required before route starts:

- New Spec Kit package.
- Explicit owner mutation approval.
- Hosted environment label and Hadna-only scope.
- Exact mutation category and maximum item count.
- Operator and approval window.
- Rollback/no-op owner and rollback plan.
- Evidence redaction rules.
- Stop conditions.
- Confirmation that Production acceptance remains separate.

Still forbidden unless separately approved:

- Broad account or role repair.
- Direct unscoped SQL.
- Non-Hadna data.
- Hosted file content operations.
- Deploy/promotion/config changes.
- Production acceptance.

Recommended future package path:

`specs/014-r011a-limited-hosted-completion-with-mutation-approval/`

## R-011B: Production-Candidate Planning With Accepted Residual Risk

Use when the owner accepts client approver, waiting approval, and final delivery/file-list hosted gaps as explicit non-Production residual risks.

Required before route starts:

- Owner risk acceptance statement naming each accepted residual risk.
- Confirmation that accepted residual risk does not grant Production acceptance.
- Updated production-candidate checklist showing deferred categories remain unproven.
- Continued value-free evidence rules.

Still blocked:

- Production acceptance.
- Full hosted completion.
- Client approver hosted acceptance.
- Waiting-approval hosted acceptance.
- Final-delivery hosted acceptance.
- Hosted file-list readiness.

Recommended future package path:

`specs/014-r011b-production-candidate-planning-with-accepted-residual-risk/`

## R-011C: Stop And Request Missing UAT Data/Categories

Use when the owner does not accept residual risk and does not approve mutation/prep.

Required action:

- Stop implementation and hosted readiness work.
- Request safe missing UAT data/categories for client approver, waiting approval, and final delivery/file-list validation.
- Keep R-009 and R-010 partial/deferred statuses intact.

Recommended future state:

No implementation package starts until the owner supplies safe categories or chooses R-011A/R-011B.
