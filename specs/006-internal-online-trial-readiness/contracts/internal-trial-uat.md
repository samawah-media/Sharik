# R-005 Internal Trial UAT Contract

Date: 2026-07-01

## Environment Contract

| Field | Required Value |
|---|---|
| Hosted staging name | `sharik-internal-trial-staging` |
| Supabase target | Non-production staging only |
| Data | Synthetic only |
| Email domain | `@r005.example.test` |
| Public signup | Disabled |
| Production acceptance | Not authorized |
| Secrets in GitHub | Forbidden |
| Temporary password printing | Forbidden |

## Synthetic Seed Contract

| Item | Required |
|---|---:|
| Tenant `Samawah Demo` | Yes |
| Synthetic clients | 2 |
| Contracts | 1 per client |
| Packages | 1 per client |
| Deliverables | 5 to 8 |
| Tenant admin user | At least 1 |
| Account manager user | At least 1 |
| Client viewer user | At least 1 |
| Emails ending `@r005.example.test` | 100% |
| Committed password values/hashes | 0 |

## UAT Checklist

| ID | Persona | Check | Expected Result |
|---|---|---|---|
| UAT-001 | Tenant admin | Sign in | Login succeeds only for a synthetic account with out-of-GitHub temporary credentials |
| UAT-002 | Tenant admin | Open clients page | Two synthetic clients are visible |
| UAT-003 | Tenant admin | Open a client detail page | Client detail loads without real data |
| UAT-004 | Tenant admin | View contract/package/deliverables | The synthetic contract, package, package summary, and deliverables are visible |
| UAT-005 | Tenant admin or account manager | Open Kanban board | Internal board loads with current seeded deliverables |
| UAT-006 | Tenant admin or account manager | Change an allowed deliverable status | Status changes, progress derives from status, and audit records an allowed event |
| UAT-007 | Tenant admin or account manager | Attempt a forbidden transition | Transition is denied and audit records a denied event |
| UAT-008 | Client viewer | Attempt internal board access | Board link is hidden and direct route access is denied or redirected safely |
| UAT-009 | Tenant admin | Verify audit log evidence | Allowed and denied status transitions have audit records |
| UAT-010 | Tenant admin or account manager | Verify SLA display | On track, at risk/overdue, paused waiting client, completed examples display as expected |
| UAT-011 | Any synthetic tester | RTL/mobile basic | Core pages remain usable on a mobile viewport and RTL layout |

## Out-Of-Scope Contract

The trial must not validate or introduce:

- Production Supabase.
- Real client data.
- Public signup.
- New open permissions.
- AI.
- Social scheduling.
- Billing.
- Drag/drop.
- Files.
- Comments.
- Full approval workflow.
