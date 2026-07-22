# R-009 Allowed Read-Only Checks

Date: 2026-07-08

## Status

Status: PLANNED ONLY

These checks may run only after owner approval is recorded.

## Allowed Check Matrix

| Check category | Allowed after approval | Evidence form |
|---|---:|---|
| Sign-in using approved out-of-band credentials | YES | Persona category and pass/fail status only. |
| Route load smoke | YES | Route category and status only. |
| Navigation visibility | YES | Role shell category and status only. |
| Client portal scope visibility | YES | Scope category and safe count/status only. |
| Tenant/client negative isolation | YES | Safe denied/empty state category only. |
| Approval control visibility | YES | Control present/absent category only; no action. |
| File list visibility | YES | File category and count/status only; no content access. |
| SLA/package/audit summary visibility | YES | Safe summary categories/counts only. |
| Mobile rendering | YES | Pass/fail status only; no screenshots. |
| RTL rendering | YES | Pass/fail status only; no screenshots. |

## Disallowed During Allowed Checks

- Do not submit forms.
- Do not activate approval or status controls.
- Do not upload, delete, download, or open files.
- Do not create accounts or invitations.
- Do not use direct database tools.
- Do not record prohibited evidence values.
