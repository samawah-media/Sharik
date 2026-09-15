# Evidence Redaction And No-Op Contract: R-011

Date: 2026-07-09

## Purpose

Define the only evidence forms allowed for R-011 and future hosted-readiness packages unless a later owner decision narrows the boundary further.

## Allowed Evidence Forms

Evidence may record:

- Pass, fail, blocked, pending, owner-deferred, accepted-risk, no-go, or no-op status.
- Role categories and route categories.
- Aggregate counts.
- Safe state labels.
- Command names.
- Elapsed time ranges.
- Non-sensitive risk summaries.
- No-op and rollback status.

## Prohibited Evidence

Evidence must not record:

- Credentials.
- Emails.
- Screenshots.
- Workbook content.
- Links or route values.
- Captions.
- Deliverable titles.
- Tokens.
- Secrets.
- Hosted target values.
- Direct identifiers.
- File contents.
- Row-level customer content.

## No-Op Contract

R-011 must keep the following at zero:

- Hosted checks.
- Hosted DB reads or mutations by this agent.
- Account creation, invitation, membership, role, password, or session repair operations.
- Hosted file upload, download, open, delete, replacement, visibility mutation, or content access.
- Approval, rejection, change request, internal approval, send-to-client, delivery, or status transition.
- Deploy, promotion, alias change, environment change, scheduled job change, or hosted configuration change.
- Non-Hadna data use.
- Product code implementation.
- Dependency changes.
- Production acceptance.

## Verification Contract

R-011 closure requires:

- `git diff --check`.
- `npm run secret:scan`.
- Scoped count-only redaction scan over new R-011 docs.
- Manual review that any keyword matches are redaction vocabulary or prohibited-category labels.
- Lint/typecheck only if code changed.
