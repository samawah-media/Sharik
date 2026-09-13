# Contract: R-008 Pilot Execution Boundary

## Purpose

This contract defines what R-008 may plan, what it may implement later, and what remains blocked until explicit owner approval.

## Baseline

- R-007 is accepted for owner readiness review.
- R-007 is not Production acceptance.
- R-007 does not authorize hosted database mutation.
- R-007 does not authorize non-Hadna customer data use.
- R-008 starts as planning-only.

## Allowed Now

- Create R-008 Spec Kit planning artifacts.
- Define controlled pilot execution gates.
- Define tenant/client isolation proof requirements.
- Define production-candidate security checklist requirements.
- Define hosted UAT authorization boundaries.
- Define client approval, file/final-delivery, audit, SLA, rollback, and owner evidence requirements.
- Update AGENTS.md Spec Kit plan pointer to the R-008 plan.

## Not Allowed Now

- Hosted database mutation.
- Hosted deployment or promotion.
- Non-Hadna customer data use.
- Production acceptance.
- New dependencies.
- Code changes, except a later explicit documentation/evidence inconsistency fix or approved implementation phase.

## Later Explicit Owner Approval Required

Before any hosted UAT action, the owner approval must name:

- Environment
- Data boundary
- Mutation type or read-only scope
- Allowed users or role categories
- Duration
- Rollback owner and steps
- Evidence rules
- Communication plan

Before any Production acceptance, the owner approval must state that it is Production acceptance and identify any accepted residual risks.

## Evidence Rules

R-008 evidence may record:

- Counts
- Role categories
- Route categories
- Pass/fail/blocked status
- Non-sensitive status names
- Test command names
- Safe risk summaries

R-008 evidence must not record:

- Credentials
- Emails
- Screenshots
- Workbook content
- External links
- Captions
- Deliverable titles
- Tokens
- Secret values
