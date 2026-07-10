# R-008 Core Workflow Readiness Evidence

Date: 2026-07-08

## Scope

This evidence covers the local-only US4 approval, final delivery, audit, SLA, and mobile/RTL readiness pass. It uses synthetic/local categories only and does not authorize hosted mutation, deploy or promotion, non-Hadna data use, or Production acceptance.

## Approval Journey

| Scenario | Status | Safe evidence |
|---|---:|---|
| Current-version approval | PASS | Client approver category can approve only the current client-visible version in assigned scope. |
| Stale-version denial | PASS | Stale version decision is denied and requires audit evidence. |
| Client viewer denial | PASS | Viewer category can inspect allowed content but cannot submit approval. |
| Approver scope denial | PASS | Approver category cannot approve another client scope. |

## Final Delivery Files

| Scenario | Status | Safe evidence |
|---|---:|---|
| Internal file hidden | PASS | Internal-only file category is excluded from client-visible final delivery readiness. |
| Final file authorized | PASS | Final delivery file category requires assigned client scope and final visibility. |
| Unfinished final file blocked | PASS | A final-delivery category that is not final blocks readiness. |
| Cross-client files excluded | PASS | Comparison client file categories are not exposed to assigned client readers. |

## Audit Completeness

| Category | Status | Safe evidence |
|---|---:|---|
| Internal approval | PASS | Success audit category covered. |
| Internal change request | PASS | Success audit category covered. |
| Send to client | PASS | Success and denial audit categories covered. |
| Client approval | PASS | Success and denial audit categories covered. |
| Client change request | PASS | Success audit category covered. |
| Delivery | PASS | Success and denial audit categories covered. |
| File visibility change | PASS | Success and denial audit categories covered. |
| File access denial | PASS | Denial audit category covered. |
| SLA pause/resume | PASS | Pause and resume audit categories covered. |
| Package-affecting change | PASS | Success and denial audit categories covered. |
| Security denial | PASS | Denial audit category covered. |

## SLA Reporting

| Scenario | Status | Safe evidence |
|---|---:|---|
| Running work | PASS | Samawah-owned running time is counted separately. |
| Waiting client pause | PASS | Client waiting time is classified as client-owned. |
| Resume after client change request | PASS | Work resumes to Samawah-owned time while preserving prior client-waiting duration. |
| Internal decision pause | PASS | Internal-decision waiting time is separated from client waiting. |
| At-risk and overdue | PASS | Risk states are classified locally. |
| Completed and cancelled | PASS | Terminal states are classified locally. |

## Mobile And RTL

| Scenario | Status | Safe evidence |
|---|---:|---|
| Client approver desktop/mobile/RTL | PASS | Approval controls and final file category render without internal content. |
| Client viewer desktop/mobile/RTL | PASS | Viewer sees current allowed item but no approval submit controls. |
| Mobile viewport | PASS | Mobile approval surface remains RTL and does not overflow horizontally. |

## Targeted Verification

| Command | Status | Safe result |
|---|---:|---|
| `npm run test:integration -- tests/integration/approvals/r008-client-approval-journey.test.ts tests/integration/audit/r008-audit-completeness.test.ts` | PASS | 2 files / 4 tests passed. |
| `npm run test:unit -- tests/unit/files/r008-final-delivery-readiness.test.ts tests/unit/sla/r008-sla-reporting.test.ts` | PASS | 2 files / 5 tests passed. |
| `npm run test:e2e -- tests/e2e/client/r008-client-approval-delivery.spec.ts` | PASS | 7 passed / 2 skipped across desktop, mobile, and RTL projects. |

## Boundary Confirmation

- No hosted database mutation occurred.
- No deploy or promotion occurred.
- No non-Hadna customer data was used.
- No dependency was added.
- Production acceptance remains blocked and requires a separate explicit owner decision.
