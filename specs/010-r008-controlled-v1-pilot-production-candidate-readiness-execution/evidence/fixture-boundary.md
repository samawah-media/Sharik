# R-008 Fixture Boundary

Date: 2026-07-08

## Allowed Fixture Scope

R-008 Phase 1/2 may use local-only synthetic fixtures and Hadna-authorized boundaries. Fixture evidence must stay at category level and must not include customer content.

Allowed fixture categories:

- Tenant category: controlled pilot tenant.
- Client categories: authorized Hadna scope and synthetic comparison scope.
- Role categories: management/project admin, assigned internal user, client approver, client viewer, unassigned client user.
- Route categories: management readiness, team/assigned-client surface, client portal, client approval surface, safe-denial surface.
- State categories: not started, in progress, internally approved, waiting client approval, client changes requested, client approved, delivered, cancelled.
- Evidence categories: allowed result, denied result, audit present, SLA ownership classification, file/comment visibility classification.

## Blocked Fixture Scope

- No non-Hadna customer data.
- No hosted database mutation.
- No hosted deploy or promotion.
- No credentials or account identifiers in committed evidence.
- No screenshots or customer content.
- No captions or deliverable titles.
- No external evidence references.
- No token values or secret values.

## Fixture Rules

1. Use synthetic identifiers and category names for local tests.
2. Use counts instead of customer content.
3. Keep client-visible and internal-only examples abstract.
4. Record denial evidence as safe reason codes or category names.
5. Treat hosted UAT fixtures as blocked until the owner approves the exact environment, data boundary, action scope, rollback plan, duration, and evidence rules.

## Phase 2 Result

Fixture boundary is ready for later local-only R-008 user stories. No fixture data was inserted into a hosted database during this pass.
