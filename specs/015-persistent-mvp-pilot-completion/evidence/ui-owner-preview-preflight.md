# UI1–UI4 owner Preview preflight — 2026-09-08

Status: HOSTED_TEAM_UAT_BLOCKED. UI1–UI4 LOCAL PASS remains valid.
Owner authorized hands-on Preview publication, then explicitly requested
Production on2026-09-08. Production preparation is blocked on target configuration
and database choice; this request does not waive compatibility or acceptance gates.
Continue in Spec015; do not create another release roadmap.

## Latest remote checkpoint — 2026-09-08

Final CI result34231310152: FAIL, persistent23PASS/1FAIL in22.4m. Failure is
`locator.selectOption` waiting for the removed single-client label. Lead replaced
it with the current named checkbox plus exact client-ID assertion and updated
the member's client badge assertion. No application changes or removed security
assertions. Focused components13PASS, scoped lint and TypeScript PASS. A first
local typecheck accidentally included the lead-created source snapshot under
tmp; that disposable snapshot was removed and the unchanged typecheck passed.
A mistaken component config command failed before tests; the actual package
script then passed13. These are not hidden test successes.

Independent native Astra read-only review found no other confirmed blocking
selector mismatch. It found a separate coverage gap in the task-notification
journey: conditional obsolete task controls allow the test to pass without
creating a task or requiring a notification. Lead verified this against current
workspace-forms.tsx. Keep that journey's end-to-end notification proof OPEN;
its CI PASS must not imply complete notification acceptance. Do not waive owner
checks. No hosted mutation; corrected exact-source CI still required.

Owner accepted Preview-first publication for trying the new design. Production
remains out of this execution. Run ID: `s015-ui-preview-20260908-6ab50e2`.
Codex is executor; the owner retains stop/rollback authority. The execution window
is this owner-authorized session, after exact-head CI success only.
Read-only linked DB dry-run succeeded: only `202609010001` is pending.
Full fixture browser CI step passed; persistent browser, secret scan and build
are still pending at this checkpoint. No hosted migration applied yet.

Bounded migration gate: verify the linked UAT identity and migration SHA256
`B0CAFE57D7491908C3CE55CCD1E73E1EA0C78998A40F2E7E54FA03581CFEE7BB`;
stop on target drift, unexpected migrations, checksum drift or failed CI.
Apply without seed/import/role flags, then require a no-op dry-run.
Keep the old Preview available as deployment rollback. Database rollback is a
reviewed forward correction (or bounded restoration of the previous function
definition), never a reset, business-data deletion or automatic down migration.
Owner acceptance and hosted all-persona tests remain pending independently.

Owner explicitly approved the saved repository-owning account. Normal push of
6ab50e2 succeeded. Exact-head F-001 run34231310152 is in progress; checkout,
whitespace, install, lint, types, unit, integration, disposable Supabase start,
clean no-seed reset and RLS/DB step passed. Later steps are not yet accepted.
Vercel still lists the old Preview as latest; no automatic new deployment occurred.
Production env listing is empty; Preview has APP_ENV, Supabase public URL/key and
server-role key. No values copied or environments changed. No hosted migration.
Owner asked which target is preferable. Lead recommends updating Preview for
the owner/team trial, then independently configured Production after acceptance.
Production database selection, provisioning costs and any data transfer remain
unapproved/undefined. Do not copy UAT credentials into Production by inference.
All20 owner requirements remain pending, not waived by deployment authorization.

## Owner-approved recovery continuation

Historical account blocker: reviewed batch committed locally as0a69924. Normal push was
rejected403 because the default Git identity lacks repository permission. A
process-scoped attempt to use the existing organization-account credential was
blocked by automatic safety review before execution; do not work around it.
Explicit owner approval for that account identity is required before retrying.
No remote push, CI run, deployment or migration occurred. Working-tree generated
next-env.d.ts is retained outside the reviewed commit. Existing browser session
is usable for read-only management checks; saved persona credentials remain invalid.

After the Docker crash, the owner approved disposable GitHub CI as a substitute
for local Docker-dependent gates, not a waiver of verification or a data transfer.
Two socket-only directories were retained under timestamped backup names outside
the repository. Restart progressed to a Secrets Engine socket failure, then the
Inference socket failure recurred after the second restart. No data disk, container,
volume, credential content, factory reset or deletion was involved. Docker remains
unavailable; stop further workstation repairs in this publication task.

The CI recovery plan supersedes steps 1 and 3 ordering below: reviewed code may be
pushed for exact-source runner-local reset/DB/persistent checks. A branch-specific
`git.deploymentEnabled: false` rule in `vercel.json` holds automatic Git deployment.
The workflow checks out the PR head (or dispatched SHA), checks commit whitespace,
and resets local Supabase without seed before database tests. No hosted secrets
are added. CI success, UAT migration, hosted login and owner acceptance remain
unverified until actual results are recorded.

## Earlier preflight evidence

Recovery continuation: full ESLint exit0. Existing Chrome session opened the old
hosted management dashboard successfully, read-only; no login credentials,
cookies, account changes or customer data copied into repository evidence.
This confirms a usable existing session, not new-release or all-persona acceptance.
Intentional reviewed changes are staged; generated next-env.d.ts remains unstaged.
Staged whitespace check passes after formatting embedded diff evidence only.
First full browser attempt stopped at root warmup before tests; one unchanged
retry completed the 300-case matrix:260PASS/37SKIP/3FAIL,19.9m,exit1.
All failures are the old member-lifecycle partial-text locator matching both the
new pending-section heading and its status badge. The test now independently
checks the heading and the exact badge inside the named invitation article;
no production code, timeout, retry or expected behavior changed. First focused
run failed root warmup before cases; final unchanged attempt passed3/3 across
desktop/mobile/RTL in1.2m,exit0 with normal server teardown. Combined evidence is
the earlier260PASS/37SKIP plus corrected focused3PASS, not a new full-suite run.
No expanded local-gate exception is needed; GitHub will rerun the whole matrix.
Fresh build exit0 (29.4s compilation,44s TypeScript,11 static pages), scoped
test ESLint and both working/staged whitespace checks PASS. CI remains pending.
Playwright teardown hung with no worker remaining;
lead verified and stopped only its server descendant tree, preserving the runner
to produce the failing result. No assertion outcome was inferred from progress.

Recovery verification: combined unit/integration/RLS-simulator/component run
151files/853PASS,112.67s,exit0. TypeScript exit0; secret scan passed. Native Astra
read-only source audit found no confirmed regression in the bounded permission,
route and invitation/migration scope; real DB/replay/rollback remain unverified.
Independent privacy audit cleared151 text files/18,518 added or untracked lines;
ignored files, binary evidence and unchanged historical disclosures excluded.
No external model route used; worker cost/usage unknown. Initial formatting
check flagged workflow layout only; Prettier formatting applied without changing
test semantics. Other fresh gates and publication results still pending.

- HEAD115fb9af unchanged; existing dirty work preserved, nothing staged.
- Existing Vercel project/Preview identity verified through connector; CLI
  authentication succeeds. Latest READY Preview still points to the old HEAD.
- GitHub CLI authentication succeeds with network access. The earlier sandbox
  credential-validation failure was not an actual expired-token finding.
- Next production build exit0:19.8s compilation,13.7s TypeScript,11 static pages.
- Full unit/integration/RLS-simulator run:110files/536PASS,15.75s,exit0.
- Full ESLint max-warnings=0 exit0. Secret scan: no high-confidence secrets.
- Previous same-source UI4 checks:317 component tests,51 browser tests with
  9intentional profile skips,6 isolated visual tests; details in ui4-checkpoint.md.
- Linked non-Production UAT migration inventory read successfully: all entries
  match through202608040001;202609010001 is local only.
- Existing ignored S015 admin credentials rejected with invalid_credentials.
  No password value logged, credential reset, retry or invitation mutation.
- Docker Linux engine pipe unavailable both within and outside sandbox.
  This does not prove why Docker is unavailable or that another agent caused it.
- Located the existing per-user Docker Desktop installation and launched it
  hidden without changing configuration or deleting data. Launch success is not
  engine health or PostgreSQL test evidence.
- Owner supplied a new Docker crash screenshot after launch: Inference manager
  cannot remove/access its dockerInference listener path. Engine recovery failed;
  no factory reset, deletion, reinstall or OS configuration change was attempted.
  The pending docker-ps diagnostic was stopped. This error is outside app code.
- Owner replied approval to the credential question, but did not confirm an
  updated credential file or successful browser sign-in. Do not treat approval
  as valid credentials or silently reset the UAT account password.

## Compatibility blocker

Native Astra reviewer Boole confirmed current invitation actions require new
list/create/read RPCs from202609010001, with no old-RPC fallback. Existing links
can be shown as revoked when that RPC is absent. Publishing the entire dirty
tree without the migration would therefore not be a complete working trial.
UI1–UI4 themselves do not require a migration. Permission separation,
notification timestamp parsing and commercial presentation use existing schema.
Recovery/cleanup scripts are not deployment hooks and were not executed.

## Next safe sequence

1. Restore the approved local DB test runtime; pass clean migration/database
   tests, persistent regression and rollback/replay prerequisites.
2. Refresh the existing ignored persona credential handoff through the owner or
   approved secure account path; never request passwords in chat.
3. Review/stage intentional code and redacted evidence only; preserve the owner
   workbook and ignored secrets. Complete exact-commit CI/Preview gates.
4. Apply only the reviewed pending migration to the verified UAT target after
   its safety gates; no destructive cleanup or accepted-data replacement.
5. Publish isolated Preview, verify real Auth/persona/role routes and target;
   then hand off the verified owner trial URL. Do not promote Production.

No deployment, alias change, commit/push, migration apply, import, invitation,
business-data write or owner-PASS claim occurred. Authentication was attempted
only against the approved UAT. All20 owner requirements-quality boxes and hosted
acceptance remain open. Native read-only delegation used; cost/usage unknown.
