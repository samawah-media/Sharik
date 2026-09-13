# R-008 Tenant/Client Isolation Proof

Date: 2026-07-08

## Scope

This evidence is local-only and uses synthetic fixture categories. It does not use hosted data, does not mutate a hosted database, does not deploy or promote, does not use non-Hadna customer data, and does not grant Production acceptance.

## Persona Matrix

| Persona category | Expected scope | Result | Safe evidence |
|---|---|---:|---|
| management_project_admin | Tenant management can review both local client categories. | PASS | Management category sees both synthetic client scopes and no Production acceptance is implied. |
| assigned_internal_user | Assigned internal user can review only assigned client scope. | PASS | Assigned internal category sees 1 assigned client scope and is denied the comparison client scope. |
| client_viewer | Client viewer can inspect visible client data only. | PASS | Viewer category sees assigned client-visible items and has no approval action. |
| client_approver | Client approver can approve only assigned current visible client items. | PASS | Approver category can act on assigned current visible approval items only. |
| unassigned_client_user | Unassigned client user receives safe empty/denied state. | PASS | Unassigned category sees 0 client scopes and exposes no customer data. |

## Data Path Matrix

| Data path | Proof result | Safe evidence |
|---|---:|---|
| Deliverables | PASS | Client A category cannot see Client B category deliverables. |
| Files | PASS | Internal files are hidden from client readers; client-visible and final files require assigned scope. |
| Approval items | PASS | Client viewer cannot approve; client approver is limited to assigned current visible items. |
| Comments | PASS | Internal comments are hidden from client portal readers and visible only to authorized internal audience for assigned scope. |
| Audit evidence | PASS | US2 proof uses safe denial/result categories only and does not print sensitive identifiers. |
| SLA reporting category | PASS | Isolation proof keeps SLA/report categories client-scoped for later reporting readiness. |

## Local Verification

| Command | Status | Safe result |
|---|---:|---|
| `npm run test:unit -- tests/unit/release/r008-pilot-gates.test.ts tests/unit/release/r008-hosted-boundary.test.ts tests/unit/release/r008-owner-decision.test.ts tests/unit/authorization/r008-isolation-proof.test.ts tests/unit/authorization/r008-role-negative.test.ts` | PASS | 5 files / 18 tests passed after tightening approval visibility to current visible items only. |
| `npm run test:integration -- tests/integration/security/r008-client-scope-visibility.test.ts` | PASS | 1 file / 4 tests passed for file, comment, and approval item scope visibility. |
| `npm run test:e2e -- tests/e2e/client/r008-client-isolation.spec.ts` | PASS | 9 tests passed across desktop, mobile, and RTL projects for viewer, approver, and unassigned client categories. |
| `npm run test:e2e` | PASS | Full browser suite passed with 98 passed / 4 skipped; R-008 isolation scenarios passed in all browser projects. |

## Boundary Confirmation

- No hosted database mutation occurred.
- No deploy or promotion occurred.
- No non-Hadna customer data was used.
- No credentials, emails, screenshots, workbook content, external evidence references, captions, deliverable titles, tokens, or secret values were added.
- Production acceptance remains blocked and requires a separate explicit owner decision.
