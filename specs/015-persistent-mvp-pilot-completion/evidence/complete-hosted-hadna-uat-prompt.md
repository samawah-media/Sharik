# Hosted Hadna Team UAT prompt

Status: OWNER AUTHORIZED / PREFLIGHT IN PROGRESS.

This prompt belongs to the Owner-Authorized Hosted Team UAT Amendment inside Spec 015. It remains Hadna-only, Team-only, Preview/UAT-only, and non-Production. Historical local acceptance evidence remains unchanged.

## Execute only inside these boundaries

- Use a reviewed branch and Draft PR.
- Use Vercel Preview/UAT only; do not promote or modify Production domains or aliases.
- Use only the verified Supabase UAT project; do not access Production Supabase.
- Configure Preview/UAT environment variables only.
- Apply only reviewed pending repository migrations after local reset, RLS DB, persistent E2E, migration inventory, UAT migration comparison, and rollback gate pass.
- Seed only minimal run-ID-scoped synthetic Hadna data.
- Invite or create only explicitly approved individual Samawah team test users.
- Use team-controlled client viewer and client approver personas; do not invite an external client.
- Keep hosted URLs, project refs, emails, credentials, tokens, direct identifiers, row contents, file paths, comments, deliverable titles, and screenshots out of Git, PR text, logs, and evidence.

## Required run ID

Use a unique run identifier of the form `s015-team-uat-<timestamp-or-uuid>`. Every synthetic row and test artifact must be attributable to that run and safe to roll back by run ID.

## Required hosted journey

Run the full online UI journey using actual UAT Auth sessions: management sign-in, assigned team sign-in, unassigned team negative check, assigned version submission, internal changes, replacement submission, exact-version internal approval, send-to-client, waiting-client SLA pause, client viewer read-only/secrecy checks, client approver change request, SLA resume, final replacement, stale-version rejection, final client approval, management delivery, audit/SLA/ledger/idempotency assertions, final client-visible file verification, internal comments/files hidden, delivered terminal state, and tenant/client/assignment isolation.

## Stop and rollback

Stop immediately on any Production target, ambiguous target, real/unknown data risk, Non-Hadna data, migration failure/partial apply, unavailable rollback, isolation failure, unauthorized approval/send/delivery, internal content leakage, stale-version success, partial audit/SLA/ledger/idempotency write, service-role exposure, public signup, P0/P1 defect, wrong Supabase target, or need for Production configuration.

When safe, roll back only deployment/access/synthetic data created by this UAT run and preserve redacted evidence for defect review.
