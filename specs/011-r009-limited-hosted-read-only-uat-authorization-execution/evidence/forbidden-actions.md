# R-009 Forbidden Actions

Date: 2026-07-08

## Status

Status: ACTIVE

These actions are forbidden unless a later separate owner approval changes scope.

## Forbidden Matrix

| Action category | Status | Required decision to change |
|---|---:|---|
| Insert/update/delete | FORBIDDEN | Separate mutation UAT approval/package. |
| Direct data repair | FORBIDDEN | Separate mutation UAT approval/package. |
| Seed/import/migration | FORBIDDEN | Separate migration or data package. |
| Mutating RPC | FORBIDDEN | Separate mutation UAT approval/package. |
| File upload/delete | FORBIDDEN | Separate file mutation approval/package. |
| File download/open content | FORBIDDEN | Separate evidence/content approval. |
| File visibility mutation | FORBIDDEN | Separate mutation UAT approval/package. |
| Account creation/invitation | FORBIDDEN | Separate account UAT approval/package. |
| Role/membership/password mutation | FORBIDDEN | Separate account/security approval/package. |
| Approval/rejection/change request | FORBIDDEN | Separate mutation UAT approval/package. |
| Internal approval/send/delivery/status transition | FORBIDDEN | Separate mutation UAT approval/package. |
| Deploy/promote/alias/config change | FORBIDDEN | Separate deploy approval/package. |
| Non-Hadna data use | FORBIDDEN | Separate data-boundary approval. |
| Production acceptance | FORBIDDEN | Separate explicit owner decision. |

## Stop Rule

If a planned read-only check requires a forbidden action, stop and record a blocked status only.
