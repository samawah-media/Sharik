# Data Model: R-006 Internal Online Trial Execution

R-006 execution introduces no application data model, no migration, and no seed. The entities below describe execution records and planned synthetic accounts only.

## Execution Target

| Field | Description |
|---|---|
| `service` | `supabase` or `vercel`. |
| `name` | Non-secret project name or candidate name. |
| `ref_or_project` | Non-secret project ref/name where applicable. |
| `environment_class` | `candidate_non_production`, `confirmed_non_production`, `production`, or `blocked`. |
| `preflight_status` | `PASS`, `BLOCKED`, `FAIL`, or `NOT_RUN`. |
| `mutation_allowed` | `true` only after exact non-production confirmation and owner confirmation. |

Current records:

| Service | Name | Ref/Project | Environment Class | Preflight Status | Mutation Allowed |
|---|---|---|---|---:|---:|
| Supabase | `sharik-uat` | `jnvuccapgsabrwwkxnbh` | `candidate_non_production` | BLOCKED | false |
| Vercel | `sharik-platform` | linked project | `blocked` | BLOCKED | false |

## Preflight Check

| Field | Description |
|---|---|
| `id` | Stable check identifier. |
| `target` | Related execution target. |
| `check` | What was checked. |
| `expected` | Required result. |
| `actual` | Non-secret observed result. |
| `status` | `PASS`, `BLOCKED`, `FAIL`, or `NOT_RUN`. |

Validation rules:

- Any blocked preflight prevents migration, seed, account creation, credential generation, deployment, and smoke checks.
- Preflight evidence must not include row values, real names, emails, keys, tokens, passwords, or hashes.

## Synthetic Trial Account Roster

| Persona | Email | Role Intent | Credential Status |
|---|---|---|---|
| Tenant admin | `tenant-admin@r006.example.test` | Internal tenant/admin smoke checks | Not generated |
| Account manager | `account-manager@r006.example.test` | Scoped internal management smoke checks | Not generated |
| Client viewer A | `client-viewer-a@r006.example.test` | Client portal and denied Kanban access smoke checks | Not generated |
| Client viewer B | `client-viewer-b@r006.example.test` | Tenant/client isolation negative checks | Not generated |

Validation rules:

- All emails must use `@r006.example.test`.
- No password values, password hashes, reset links, magic links, tokens, or service-role keys may be documented.
- Credentials can be generated only after Supabase and Vercel targets pass preflight.

## Smoke Check Result

| Field | Description |
|---|---|
| `area` | Sign-in, shell, clients, client detail, contracts, packages, deliverables, Kanban, audit, SLA, isolation, denial, RTL, or mobile. |
| `status` | `PASS`, `FAIL`, `BLOCKED`, or `NOT_RUN`. |
| `evidence` | Non-secret proof, such as HTTP status or assertion summary. |

Current status: all smoke checks are `BLOCKED` because no preview/staging deployment URL and no temporary credentials exist.

## Execution Blocker

| Blocker | Impact |
|---|---|
| Supabase hosted data/auth preflight cannot complete without secure DB password access | No hosted mutation, seed, account creation, or credential generation. |
| Vercel project has only Production env vars and Production deployments | No preview/staging deployment and no trial URL. |
| `.env.local` is labeled production | It must not be used for R-006 execution. |
