# Data Model: R-005 Internal Online Trial Readiness

Date: 2026-07-01

## Hosted Staging Environment

Represents the non-production internal online trial target.

Fields:

- `name`: `sharik-internal-trial-staging`
- `purpose`: internal Samawah trial only
- `status`: prepared, applied, blocked, or retired
- `supabase_project_ref`: recorded outside GitHub or documented as non-secret metadata only after owner approval
- `hosting_target`: staging/preview only; not Production acceptance
- `public_signup`: disabled
- `data_policy`: synthetic data only
- `credential_delivery`: outside GitHub

Validation:

- Must not point at Production Supabase.
- Must not contain real clients or real users before seed.
- Must not expose service role keys to browser/runtime env.

## Synthetic Tenant

Represents the single R-005 tenant.

Fields:

- `name`: `Samawah Demo`
- `status`: active
- `fixture`: `r005-internal-online-trial-readiness`

Validation:

- Seed must not create more than one R-005 tenant.

## Synthetic Client

Represents trial client records.

Fields:

- `name`: fake client name
- `slug`: `r005-client-alpha` or `r005-client-beta`
- `primary_contact_email`: fake `@r005.example.test` address
- `tenant`: `Samawah Demo`

Validation:

- Exactly two R-005 clients.
- No real client names or domains.

## Synthetic Contract

Represents one fake agreement per client.

Fields:

- `name`
- `reference`
- `period_start`
- `period_end`
- `status`
- `client`

Validation:

- One contract per synthetic client.

## Synthetic Package

Represents one fake package per client.

Fields:

- `name`
- `period_start`
- `period_end`
- `status`
- `client`
- `package_line`
- `committed_quantity`

Validation:

- One package and at least one package line per synthetic client.
- Ledger fixture entries must remain append-only.

## Synthetic Deliverable

Represents current deliverable/board/SLA trial data.

Fields:

- `name`
- `type`
- `status`
- `priority`
- `owner_user_id`
- `start_date`
- `internal_due_date`
- `client_due_date`
- `final_due_date`
- `progress_percentage`
- `requires_internal_approval`
- `requires_client_approval`

Validation:

- 5 to 8 deliverables total.
- Must include varied statuses covering active, review, waiting-client, approved, and delivered paths.
- Progress must match the accepted status mapping.

## Synthetic Trial User

Represents login personas.

Fields:

- `email`: must end with `@r005.example.test`
- `display_name`
- `role_key`
- `tenant_membership`
- `client_membership` where applicable
- `role_assignment`
- `encrypted_password`: null in committed seed

Validation:

- Must include tenant admin, account manager, and client viewer personas.
- Must not commit password values or hashes.

## UAT Checklist Item

Represents an internal trial verification step.

Fields:

- `id`
- `scenario`
- `persona`
- `expected_result`
- `evidence_status`
- `notes`

Validation:

- Must include every user-requested UAT item.
- Must mark deferred scope as out of scope, not failed product functionality.
