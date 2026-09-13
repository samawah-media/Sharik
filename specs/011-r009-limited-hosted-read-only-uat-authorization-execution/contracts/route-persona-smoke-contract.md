# Contract: R-009 Route And Persona Smoke Categories

## Purpose

This contract defines the route and persona categories that may be included in a later approved hosted read-only smoke.

## Persona Categories

The owner approval record may approve one or more of these categories:

- Management or project admin.
- Assigned internal user or account manager.
- Client approver.
- Client viewer.
- Unassigned or unauthorized client category for negative isolation checks.

No account identifiers, emails, or credential values may be committed.

## Route Categories

The owner approval record may approve one or more of these categories:

- Sign-in and authenticated landing.
- Management dashboard or readiness summary.
- Client list or client detail summary.
- Deliverables list or board summary.
- Client portal home.
- Client deliverable detail read-only view.
- Package or contract summary.
- Waiting approval summary without action.
- Files list or final delivery summary without opening content.
- SLA or audit summary using safe counts/categories only.

## Device And Layout Categories

The owner approval record may approve:

- Desktop viewport.
- Mobile viewport.
- Arabic RTL rendering.

Screenshots must not be committed as evidence.

## Read-Only Expectations

For every route/persona category, the reviewer may record:

- Route category loaded or blocked.
- Expected shell category present or absent.
- Management-only chrome present only for approved management categories.
- Client portal scope shows only approved client category.
- Mutation controls visible or hidden, without activating them.
- Safe empty or denied state for unauthorized category.
- No horizontal overflow summary for mobile if checked.

## Forbidden Route Behavior

If a route requires any of the following, execution must stop for that route:

- Creating or changing data.
- Creating an account or invitation.
- Downloading or opening file content.
- Submitting approval, rejection, change request, delivery, or status transition.
- Viewing non-Hadna data without separate approval.
- Recording prohibited evidence values.
