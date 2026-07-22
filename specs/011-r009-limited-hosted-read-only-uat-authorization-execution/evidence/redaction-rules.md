# R-009 Redaction Rules

Date: 2026-07-08

## Status

Status: ACTIVE

## Allowed Evidence

- Pass/fail/blocked/pending/reviewed status.
- Role or persona categories.
- Route categories.
- Data-path categories.
- Counts.
- Safe state names.
- Command names.
- Non-sensitive blocker summaries.
- Non-sensitive residual risk summaries.

## Prohibited Evidence

- Credentials.
- Emails.
- Screenshots.
- Workbook content.
- External evidence links.
- Captions.
- Deliverable titles.
- Token values.
- Secret values.
- File contents.
- Direct customer identifiers.

## Scan Rule

Run count-only scans. Do not print matched values.

Redaction vocabulary matches are acceptable only when they are clearly policy labels, not actual sensitive values.
