# R-007 Fixture Boundary

## Purpose

R-007 local fixtures support readiness checks without using non-Hadna customer data, mutating hosted databases, or recording sensitive workbook-derived content.

## Allowed Fixture Data

- Synthetic tenant, client, role, deliverable, approval, file, comment, SLA, and audit records.
- Safe counts and status names.
- Generic labels that do not reveal real deliverable titles, captions, links, emails, credentials, or workbook rows.

## Disallowed Fixture Data

- Real non-Hadna customer data.
- Credentials, emails, tokens, secret values, screenshots, external links, captions, workbook content, or deliverable titles.
- Hosted UAT mutations without a new explicit owner approval and task scope.

## Fixture Personas

| Persona | Purpose |
|---|---|
| Management/project admin | Reviews readiness boundaries and management-visible workflow state. |
| Assigned internal user | Verifies client-scoped access without management-only powers. |
| Client approver | Verifies approval action boundaries. |
| Client viewer | Verifies read-only client portal behavior. |
| Unassigned client user | Verifies safe empty/no-assigned-client isolation. |

## Evidence Rule

Tests and docs may report only safe summaries, counts, role categories, route categories, and pass/fail outcomes.
