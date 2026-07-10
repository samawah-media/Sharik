# R-010 Path B Rollback And No-Op Planning Note

Date: 2026-07-09

## Status

Path B is documentation/evidence planning only. There is no hosted state to roll back from this R-010 pass.

This note records the no-op boundary and the conditions that would require returning to Path A.

## No-Op Boundary

R-010 Path B performs only local documentation and evidence hardening. The following remain at zero for this pass:

- Hosted checks.
- Hosted DB reads or mutations by this agent.
- Account creation, invitation, membership, role, password, or session repair operations.
- Hosted file upload, download, open, delete, replacement, visibility mutation, or content access.
- Approval, rejection, change request, internal approval, send-to-client, delivery, or status transition.
- Deploy, promotion, alias change, environment change, scheduled job change, or hosted configuration change.
- Non-Hadna data use.
- Product code implementation.
- Production acceptance.

## Rollback Plan

Because Path B changes only local docs/evidence, rollback is limited to documentation correction:

1. If a Path B evidence statement overclaims R-009, correct the statement and keep R-009 partial owner-deferred.
2. If a residual risk is omitted, add it to the gap register and risk matrix.
3. If a Production acceptance implication appears, remove it and restate Production acceptance as blocked.
4. If evidence includes prohibited values, redact the value, rerun scoped redaction scan, and record the correction without repeating the value.
5. If the owner no longer accepts Path B planning risk, stop R-010 and return to Path A only through a new explicit owner decision.

No hosted rollback, storage rollback, database rollback, account rollback, role rollback, or deploy rollback is required because none is performed.

## Triggers To Return To Path A

Return to Path A only if the owner explicitly decides that one or more residual gaps must be fixed or exposed before the next package proceeds.

Path A is triggered by any of the following:

- Client approver proof requires fixing or creating a safe client approver account/category.
- Waiting-approval proof requires creating or exposing a safe waiting-approval item/category.
- Final-delivery proof requires creating or exposing a safe final-delivery list/category marker.
- The owner rejects carrying any deferred category as production-candidate planning risk.
- A future package cannot proceed without hosted evidence for a deferred category.
- Production acceptance is requested before the residual risks are closed or separately handled.

## Path A Reopen Requirements

Before any Path A action, the owner must approve all of the following in a later package:

- Named hosted environment.
- Hadna-only scope.
- Exact allowed mutation categories and maximum item counts.
- Operator and approval window.
- Rollback/no-op owner and rollback window.
- Evidence redaction rules.
- Stop conditions.
- Confirmation that Production acceptance remains separate.

## Next Owner Decision

Approve R-011 production-candidate residual-risk treatment, reopen Path A with explicit mutation approval, or stop.
