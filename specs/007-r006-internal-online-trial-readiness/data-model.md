# Data Model: R-006 Internal Online Trial Readiness

R-006 introduces no persisted application data model, no migration, and no seed. The entities below are documentation and evidence records only.

## Baseline Gate Result

| Field | Description |
|---|---|
| `command` | The exact local verification command. |
| `status` | `PASS`, `FAIL`, `BLOCKED`, or `NOT_RUN`. |
| `duration` | Human-readable runtime if observed. |
| `evidence` | Counts, summary, or blocker details from the command output. |
| `scope_note` | Confirmation that no production, hosted mutation, or real data was used. |

Validation rules:

- Every required command must have a recorded result before PR handoff.
- A failed or blocked security, RLS, build, or secret-scan command blocks online trial readiness.

## Non-Production Supabase Boundary

| Field | Required Value |
|---|---|
| `target_type` | Non-production only. |
| `real_data_allowed` | `false`. |
| `public_signup` | Disabled. |
| `service_role_browser_visible` | `false`. |
| `preflight_required` | Yes, before any future migration or seed. |
| `owner_approval_required` | Yes. |

Validation rules:

- The target must be verified to contain no real users, real clients, or non-approved fixture data before any future online trial.
- Database passwords, service role keys, access tokens, and temporary passwords must not be printed or committed.

## Non-Production Vercel Boundary

| Field | Required Value |
|---|---|
| `deployment_type` | Preview/staging only. |
| `production_alias` | Forbidden for R-006 readiness. |
| `production_acceptance` | Not authorized. |
| `allowed_public_env_names` | `APP_ENV`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. |
| `forbidden_env_values` | Service role key, database password, access token, temporary password. |

Validation rules:

- R-006 does not run a deployment.
- Any future deployment must be approved by owner go/no-go and must not expose secrets in browser bundles.

## Synthetic Data Plan

| Planned Item | Required Shape |
|---|---|
| Tenant | Fake tenant name such as `Samawah R006 Demo`. |
| Clients | Two fake clients with non-real names. |
| Contracts | One fake contract per fake client. |
| Packages | One fake package per fake client. |
| Deliverables | Synthetic deliverables covering current accepted statuses and SLA display cases. |
| Users | Tenant admin, account manager, and client viewer personas. |
| Emails | `@r006.example.test` only. |
| Passwords | None in repo, docs, logs, screenshots, or PR text. |

Validation rules:

- This is not a seed and must not be applied in R-006.
- All trial credentials must be generated and delivered outside GitHub after a future owner go/no-go.

## Readiness Checklist Item

| Field | Description |
|---|---|
| `id` | Stable checklist identifier such as `R006-GATE-001`. |
| `area` | Baseline, Supabase, Vercel, synthetic data, security, UAT, or rollback. |
| `check` | What must be confirmed. |
| `expected` | Required result. |
| `status` | `PENDING`, `PASS`, `FAIL`, or `BLOCKED`. |
| `evidence_location` | Where non-secret proof should be recorded later. |

Validation rules:

- No item may require real client data.
- Any `FAIL` or `BLOCKED` item prevents online trial execution.
