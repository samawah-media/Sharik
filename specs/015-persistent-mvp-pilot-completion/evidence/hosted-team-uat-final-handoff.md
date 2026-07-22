# Spec 015 Hosted Team UAT Final Handoff

## Decision

`HOSTED_TEAM_UAT_READY`

The reviewed non-Production Preview/UAT environment is technically ready for
the controlled internal Samawah team trial. This decision does not grant
Production acceptance, merge approval, public release, public signup, or an
external client invitation. The human trial itself is the next activity and is
not represented as already completed.

## Reviewed source and delivery state

- Branch: `codex/015-persistent-mvp-pilot-completion`.
- Reviewed application head: `3266d6fae0f4792da3ba7ceff4ce3d84b8362924`.
- Draft PR: #37; still draft and unmerged.
- Exact-head GitHub quality run: `29490121433`, successful in 10m23s.
- Target category: `preview-uat`; protected access remains enabled.
- The UAT-only alias points to the exact reviewed Preview deployment.
- Production deployment, Production alias, and Production environment: untouched.

## Exact-head verification

The GitHub matrix passed npm install, lint, typecheck, unit, integration,
Supabase start/reset, RLS/pgTAP, component, fixture E2E, persistent E2E,
secret scan, and build. The Preview build manifest contains `/work`,
`/client/pending`, and `/client/files`.

Direct hosted verification then passed:

- route, protection, and persona smoke: 27/27 across desktop, mobile Chromium,
  and Arabic RTL;
- persistent team-to-client lifecycle: 1/1 with real UAT Auth sessions;
- fixture impersonation refusal and browser-side service-credential secrecy;
- management, account manager, assigned writer, assigned designer, unassigned
  internal negative, client viewer, and client approver categories.

## Hosted lifecycle evidence

- Synthetic run ID: `s015-hosted-lifecycle-0450b84082`.
- Final state: `delivered`.
- Persistent counts: 3 versions, 1 task, 9 comments, 2 file assets, 3 quality
  checks, 5 approval decisions, 5 SLA segments, 2 package-ledger entries, and
  19 idempotent command-request records.
- Allocation state: `consumed_later`.
- No active failed synthetic lifecycle run remained after verification.

The visible UI journey proved management assignment, assigned-team execution,
three version submissions, internal change request and approval, exact-version
send to client, client change request and final approval, stale-version denial,
SLA pause/resume/completion, final-file visibility, delivery replay
idempotency, append-only ledger behavior, required audit events, terminal-state
denial, and client secrecy for internal tasks, quality data, comments, and
files.

## Import, access, and rollback/no-op evidence

- The controlled Glass/Hadna importer evidence remains 16 deliverables,
  16 versions, and 7 tasks; replay was idempotent, rollback was run-ID scoped,
  and unrelated scope counts remained stable.
- Seven UAT member profiles were synchronized and verified with the opaque run
  ID `s015-hosted-profile-sync-20260716-ae6077e061`; no email or credential is
  recorded here.
- Four failed synthetic lifecycle runs were retired through existing audited
  workflow RPCs using authorized real Auth actors. Their allocations ended
  released and all four deliverables ended cancelled.
- Immediate retirement replay returned no-op: 0 additional retirements and 4
  already-retired records.

## Defect burn-down

- Open P0: 0.
- Open P1: 0.
- Every discovered P2 is fixed or dispositioned in `defect-register.md`.
- The stale-route blocker `S015-P1-057` is fixed by exact-head Preview
  deployment, protected UAT alias reassignment, and direct 27/27 plus 1/1
  hosted evidence.
- The missing hosted member-profile, protected-link evidence-redaction,
  lifecycle-harness false-negative, failed-run retirement, and CI lint issues
  are recorded with regression evidence.

## Security and data boundary

- Tenant/client/assignment boundaries passed in local RLS/pgTAP, persistent
  browser tests, hosted negative-persona checks, and post-action assertions.
- Service role was confined to synthetic setup and redacted post-action
  assertions; it did not enter the browser, Next.js public environment, Git,
  or this evidence.
- A protected share-link value that appeared in a temporary failure message was
  immediately revoked and regenerated. The setup now sanitizes navigation
  failures, and the replacement value is not committed or recorded.
- No real customer data, workbook content, credential, email, file content,
  hosted URL, or secret value is included in this handoff.

## Remaining boundary and next action

H008, H009, H010, X007, and R-011A T032 are closed. The next action is a
time-boxed internal human trial using owner-distributed protected access and
the approved seven role categories. Any new P0/P1 found during that human trial
reopens the hosted gate. Production remains a separate owner-approved release
decision after the human trial, defect review, PR review, and merge/release
gates.
