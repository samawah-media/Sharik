# Data Model: Internal Online MVP UAT

Date: 2026-06-30

This feature introduces no new production data model, no migration, and no schema changes. The entities below describe UAT planning and evidence records only.

## UAT Environment

Represents the approved non-production online environment.

Fields:

- `name`: human-readable environment name.
- `host_provider`: approved online host.
- `deployment_target`: preview or Vercel production target.
- `deployment_target_meaning`: hosting_only or production_acceptance; R-004 allows hosting_only only.
- `protection_status`: enabled, missing, public_with_owner_acceptance, or unknown.
- `database_project_ref`: Supabase UAT project ref when approved.
- `app_env`: preview, staging, or production-hosting-only.
- `status`: planned, blocked, deployed, verified, failed, rolled_back.

Validation:

- `deployment_target` may be Vercel production only when `deployment_target_meaning` is hosting_only.
- `database_project_ref` must not be a Production Supabase ref.
- Public exposure limitations must be recorded if protection is unavailable on the free Vercel account.

## Synthetic Data Set

Represents the minimum fake data used for UAT.

Fields:

- `tenant_name`: non-real tenant display name.
- `clients`: at least Client Alpha UAT and Client Beta UAT.
- `users`: internal and client users using reserved fake domains.
- `contracts`: synthetic contract examples.
- `packages`: synthetic package examples.
- `deliverables`: synthetic deliverables covering accepted statuses.
- `sla_cases`: on track, at risk, overdue, paused waiting client, completed, cancelled.

Validation:

- No real client names.
- No real client emails.
- No production credentials.
- Client A/B records must support isolation checks.
- The seed must refuse to run if the target contains client/auth data outside the approved synthetic R-004 fixture set.
- `paused_waiting_internal_decision` remains domain/unit evidence only until a future approved persisted SLA segment model exists.

## Hosted Migration Gate

Represents the approval boundary for hosted Supabase migration.

Fields:

- `approval_status`: blocked, approved, run, failed.
- `approved_by`: owner or explicit approver reference.
- `approved_at`: timestamp if approved.
- `target_project_ref`: non-production Supabase ref.
- `data_policy`: synthetic only.
- `rollback_plan`: documented rollback path.
- `evidence_path`: path to evidence record.

Validation:

- Must remain blocked without explicit approval.
- Approval must name or confirm target project and synthetic-only data.
- Production Supabase target is invalid.
- Vercel Production target is valid only as hosting_only.

## Evidence Record

Represents one smoke/security/UAT result.

Fields:

- `check_id`: stable checklist id.
- `category`: smoke, security, UAT, deploy, migration, rollback, local.
- `environment`: local, preview, staging, or blocked.
- `status`: pass, fail, blocked, skipped, not_run.
- `command_or_method`: command, URL check, manual test, or reviewer note.
- `result_summary`: short observed result.
- `evidence_location`: log path, doc section, or PR note.
- `recorded_at`: timestamp.

Validation:

- Hosted checks cannot be marked pass unless run against the correct hosted environment.
- Data-backed hosted checks cannot be marked pass until a Supabase UAT project exists and is seeded with synthetic data.
- Secret values must never be stored in evidence.
- Blocked checks must state the blocker.
