# R-008 Owner Approval Request Template

Use this template before any R-008 scope expansion beyond local-only hardening.

## Requested Path

- Requested path: local-only implementation / hosted read-only UAT / hosted UAT mutation / deploy or promotion / Production acceptance package.
- Request owner:
- Requested window:
- Reason for request:

## Boundary

- Environment:
- Data boundary:
- Allowed role categories:
- Allowed route or workflow categories:
- Mutation type or read-only scope:
- Duration:
- Evidence rules:
- Rollback owner:
- Communication owner:

## Required Confirmations

| Confirmation | Owner response |
|---|---|
| Hosted database mutation is explicitly allowed or blocked. |  |
| Hosted deploy or promotion is explicitly allowed or blocked. |  |
| Non-Hadna customer data is explicitly allowed or blocked. |  |
| Evidence may only include safe summaries unless separately approved. |  |
| Rollback plan is accepted before hosted action. |  |
| Production acceptance is separate unless explicitly granted here. |  |

## Rollback Plan Summary

- Code rollback:
- Hosted configuration rollback:
- Hosted data rollback:
- File visibility rollback:
- Permission/account rollback:
- UAT communication rollback:
- Post-rollback verification:

## Decision

- Decision: approved / rejected / needs changes.
- Accepted residual risks:
- Expiration or review date:

Production acceptance must be stated explicitly. Approval of hosted UAT or local hardening does not grant Production acceptance.
