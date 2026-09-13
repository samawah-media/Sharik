# R-009 Hosted Target Requirements

Date: 2026-07-08

## Status

Status: PREFLIGHT PASSED; PHASE 5 TARGET USED BY CATEGORY ONLY

Owner approval is recorded for an existing hosted read-only UAT target category. Exact target values remain out-of-band and are not committed.

## Target Requirements

| Requirement | Status | Safe rule |
|---|---:|---|
| Existing hosted target | PASS | Owner approved existing hosted UAT target category; no target URL or secret value recorded. |
| No deploy or promotion | PASS | No deploy, promotion, alias change, or configuration change is authorized or required for this pass. |
| Approved data boundary | PASS | Hadna-only. Non-Hadna data remains blocked. |
| Approved persona categories | PASS | Persona categories are approved by category only. |
| Out-of-band credentials | OWNER-DEFERRED | Credential categories were available for management/project admin, assigned internal/account manager, client viewer, and unassigned/unauthorized client; client approver exact reason: credential category unavailable. |
| Read-only route categories | PASS | Route categories are approved by category only; no route links or direct object identifiers recorded. |
| Stop conditions | PASS | Stop conditions remain active for write-required, credential, data-scope, file-content, and prohibited-evidence blockers. |
| Evidence redaction | PASS | Evidence follows R-009 redaction rules. |

## Metadata Preflight Result

| Preflight item | Status | Safe result |
|---|---:|---|
| Target label/environment | PASS | Existing hosted read-only UAT target category recorded without URL or secret value. |
| Secret values | PASS | No secret, token, credential, or environment variable value was printed or committed. |
| Hosted config changes | PASS | No hosted configuration was changed. |
| Deploy/promote | PASS | No deploy, promotion, or alias change was performed. |
| Account creation | PASS | No account, invitation, role, membership, or password action was performed. |
| Hosted route opening | OWNER-DEFERRED | Read-only route-category inspection ran for available approved credential categories without recording target values or route URLs; unavailable route/data categories were not executed. |

## Rejection Conditions

Reject the target if it requires:

- Deploy or promotion.
- Alias or hosted configuration change.
- Account creation or invitation.
- Role or membership change.
- Database mutation.
- File mutation or content opening.
- Non-Hadna data without separate approval.
- Recording prohibited evidence.
