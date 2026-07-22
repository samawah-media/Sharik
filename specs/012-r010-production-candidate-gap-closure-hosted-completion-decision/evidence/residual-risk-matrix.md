# R-010 Residual-Risk Acceptance Matrix

Date: 2026-07-09

## Status

Path B is active for production-candidate planning only. The owner accepts the residual risks below as planning inputs, not as Production acceptance.

No hosted check, hosted mutation, account or role change, hosted file operation, deploy/promotion/config change, non-Hadna data use, code implementation, or Production acceptance is authorized by this matrix.

## Matrix

| Risk ID | Residual risk | Evidence basis | Owner Path B acceptance scope | Required treatment before Production acceptance | Trigger to return to Path A |
|---|---|---|---|---|---|
| RISK-001 | Client approver login, portal, approval controls, shell/navigation, and isolation remain unproven in hosted evidence. | R-009 final retry stayed on the authentication surface and did not reach client approver protected surfaces. | Accepted for production-candidate planning only. | Later proof of client approver flow and isolation, or a separate owner decision that explicitly handles the risk without weakening security gates. | Owner requires hosted client approver proof before R-011 can proceed, or proof requires bounded account/category correction. |
| RISK-002 | Waiting approval remains empty-state and has not been shown with a safe non-empty item/category. | R-009 route/category value was empty and no waiting item was created. | Accepted for production-candidate planning only. | Later proof of a safe non-empty waiting-approval category, with no direct identifiers in evidence. | Owner requires non-empty hosted evidence or a safe item must be created/exposed. |
| RISK-003 | Final-delivery list/category visibility remains unproven. | R-009 final-delivery route did not expose file-list/final-delivery markers and no file operation occurred. | Accepted for production-candidate planning only. | Later proof of final-delivery list/category visibility without hosted file content operations. | Owner requires hosted final-delivery list evidence or safe category exposure requires bounded prep. |
| RISK-004 | R-009 could be overclaimed as full hosted completion. | R-009 is closed as PARTIAL OWNER-DEFERRED with T038, T039, and T044 unchecked. | Accepted only if R-010/R-011 continue to label deferred categories as gaps. | Keep every production-candidate package explicit about accepted versus deferred evidence. | Any stakeholder asks to treat R-009 as PASS or Production-ready evidence. |
| RISK-005 | Production acceptance could be requested before required checks. | Path B is planning-only and cannot prove the deferred categories. | Not accepted for Production; blocked. | A separate Production acceptance package must pass required checks and record a new owner decision. | Owner asks for Production acceptance before residual risks are closed or formally handled. |
| RISK-006 | Evidence could accidentally expose prohibited values while explaining deferred gaps. | R-009/R-010 evidence uses redaction vocabulary and category-only summaries. | Accepted only with continued redaction scans and value-free evidence. | Continue count-only scans and manual review of sensitive-keyword matches as redaction vocabulary. | A route link, credential, email, screenshot, file content, caption, deliverable title, direct identifier, token, secret, or row-level customer content would need to be recorded. |
| RISK-007 | Future checks could require mutation or hosted file operations. | Current R-010 task is documentation-only; missing categories may need prep. | Not accepted inside R-010. | Use R-011 for local treatment or return to Path A for explicit bounded prep. | Any next step needs account/role change, data exposure, hosted file operation, workflow/status mutation, deploy, promotion, or configuration change. |

## Owner Acceptance Statement

The Path B owner decision accepts these risks only for production-candidate planning. It does not accept them for Production readiness, Production acceptance, hosted completion, client approver acceptance, waiting-approval acceptance, final-delivery acceptance, or hosted file-list readiness.

## Required Next Owner Decision

Approve R-011 as a separate Spec Kit package for production-candidate residual-risk treatment and hosted acceptance readiness, return to Path A with explicit mutation approval, or stop.
