# R-008 Rollback Plan Evidence

Date: 2026-07-08

## Scope

This rollback plan is explicit before any later hosted UAT or production-candidate step. It is a local readiness artifact only and does not authorize hosted action.

## Rollback Matrix

| Area | Status | Trigger | Owner | Safe rollback steps | Verification |
|---|---:|---|---|---|---|
| Code | DOCUMENTED | Local or hosted candidate introduces a blocking regression. | release_owner | Return to last accepted branch or commit; rerun local verification; record safe summary. | Local checks pass or blocker is recorded. |
| Hosted configuration | BLOCKED UNTIL OWNER APPROVAL | Hosted configuration is changed during later approved UAT. | release_owner | Restore previous configuration; remove temporary UAT settings; verify safe route state. | Hosted smoke only if separately approved. |
| Hosted data mutation | BLOCKED UNTIL OWNER APPROVAL | Later approved hosted mutation must be reversed. | data_owner | Use owner-approved mutation log; apply reversal or compensating records; verify tenant/client scope. | Scope reconciled and audit evidence preserved. |
| File visibility | DOCUMENTED | File visibility or final-delivery flag is incorrect. | release_owner | Revoke client-visible or final flag; verify internal files remain hidden; record audit summary. | Internal-file hidden and final-file authorization checks pass. |
| Permissions/accounts | DOCUMENTED | Role or account scope is broader than approved. | security_reviewer | Remove or disable excess role scope; verify viewer and unassigned denials; record denial audit summary. | Role negative checks pass and safe denial state remains visible. |
| UAT communication | DOCUMENTED | UAT participant needs correction after rollback. | communication_owner | Notify only approved categories; state corrected safe scope; record owner-visible status. | Communication is limited to allowed categories. |
| Post-rollback verification | DOCUMENTED | Rollback steps finish. | release_owner | Run targeted local checks; run secret scan; run redaction review; record blockers. | Targeted checks pass or blockers are safely recorded. |

## Hosted Readiness Decision

| Check | Status | Safe result |
|---|---:|---|
| Rollback plan completeness | PASS | All rollback areas have owner, trigger, steps, and verification. |
| Hosted owner approval | BLOCKED | No hosted action may proceed without later explicit owner approval. |
| Production acceptance | BLOCKED | Rollback readiness does not grant Production acceptance. |

## Boundary Confirmation

- No hosted database mutation occurred.
- No deploy or promotion occurred.
- No non-Hadna customer data was used.
- No dependency was added.
- Production acceptance remains blocked and requires a separate explicit owner decision.
