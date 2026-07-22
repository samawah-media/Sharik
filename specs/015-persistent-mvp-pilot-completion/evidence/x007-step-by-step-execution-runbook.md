# X007 Step-by-Step Execution Runbook

## Purpose and authority

This document is the subordinate execution runbook for the remaining work in
Spec 015. Give this file to the next coding agent and tell it to start at the
first incomplete checkpoint.

This is **not** a new Spec, plan, stage, roadmap, or source of truth. It does not
authorize Spec 016 and it must not create a parallel task register. Authority is
resolved in this order:

1. explicit owner decisions and `AGENTS.md`;
2. `.specify/memory/constitution.md`;
3. Spec 015 `spec.md`, `plan.md`, and `tasks.md`;
4. `evidence/owner-authorized-product-experience-rescue-agent-prompt.md`;
5. this runbook.

If this runbook conflicts with a higher source, stop the conflicting action,
follow the higher source, and record the discrepancy in the existing Spec 015
evidence. `tasks.md` remains the only authoritative next-work checklist. This
runbook defines how to execute X007, H008, H009, H010, and T032 safely.

## Agent mandate

Continue the existing branch and Draft PR from the repository's current state.
Do not restart the project, repeat X006, create another audit package, or replace
the existing Spec Kit artifacts. Work checkpoint by checkpoint until one of the
approved completion states or a real stop condition is reached.

Before acting, read in full:

- `AGENTS.md`;
- `.specify/memory/constitution.md`;
- `specs/015-persistent-mvp-pilot-completion/spec.md`;
- `specs/015-persistent-mvp-pilot-completion/plan.md`;
- `specs/015-persistent-mvp-pilot-completion/tasks.md`;
- `specs/015-persistent-mvp-pilot-completion/evidence/owner-authorized-product-experience-rescue-agent-prompt.md`;
- `DESIGN.md`;
- the existing gate status, execution log, defect register, and relevant UX,
  permissions, RLS, files, audit, SLA, release, and rollback documentation.

Use the established Spec Kit workflow and the approved V1 stack. Do not create
another master prompt. Do not ask the owner to repeat decisions already recorded
in Spec 015. Ask only when missing authority, missing approved identities, an
ambiguous hosted target, or another stop condition makes safe progress
impossible.

## Current baseline to re-verify

At the time this runbook was written:

- X006 was closed by exact-HEAD local/CI evidence.
- H001-H007 were checked complete in `tasks.md`.
- X007, H008, H009, H010, and T032 remained open.
- the existing PR was Draft and unmerged;
- Preview/UAT existed, while Production remained untouched;
- the hosted Playwright suite contained boundary and persona smoke coverage,
  but not the complete persistent hosted lifecycle;
- `dnd-kit`, Uppy, Tiptap, React Hook Form, and Zod were pinned in the project;
- TanStack Query, TanStack Table, and Radix were not pinned in `package.json`;
- the universal deliverable drawer displayed execution tasks and quality checks,
  but the current server action surface did not provide task/checklist mutation;
- the client route set did not contain a dedicated files route;
- the owner-provided Glass workbook existed locally and had to remain outside
  Git.

These are observations, not permanent truth. Re-verify them from the current
HEAD before relying on them. Never reopen a closed task merely because its
historical evidence uses an older commit; reopen only for a reproducible
regression or a false closure.

## Operating rules

1. Execute one checkpoint at a time in dependency order.
2. Keep each checkpoint small enough to finish, verify, document, commit, and
   push safely in roughly 30-45 minutes when practical.
3. Do not leave more than one checkpoint's implementation uncommitted.
4. Preserve all user changes. Never reset, clean, rewrite history, force push,
   merge the PR, or stage unrelated/untracked/ignored files.
5. Keep the Glass workbook, extracted content, credentials, URLs, emails,
   identifiers, screenshots containing client content, and local handoff files
   outside Git.
6. Use real browser/Auth/server/RPC/PostgreSQL/RLS/Storage paths for persistent
   and hosted acceptance. Fixture impersonation does not prove hosted UAT.
7. Treat `tasks.md` as current work, `execution-log.md` as append-only history,
   `gate-status.md` as the current snapshot, and `defect-register.md` as the only
   defect register.
8. Keep `docs/PROJECT_PROGRESS.md` concise and current. Do not rewrite or erase
   unrelated local changes.
9. Update evidence once per meaningful checkpoint. Do not create an endless
   evidence-only commit/CI loop solely to write the latest CI run number.
10. A code or migration change is not verified until its relevant local, DB,
    browser, and exact-HEAD CI gates pass.

## Approved stack rule

Use the stack required by `AGENTS.md`, but do not add packages ceremonially.

- Keep using the currently pinned dnd-kit, Uppy, Tiptap, React Hook Form, Zod,
  Supabase, Vitest, Testing Library, and Playwright paths where they already own
  the responsibility.
- Add Radix/shadcn primitives only if the implementation genuinely needs their
  accessible dialog, sheet, tabs, menu, or related behavior and the dependency
  review is recorded.
- Add TanStack Query only when client-side caching, invalidation, optimistic
  mutation, or lazy detail loading materially requires it.
- Add TanStack Table only for an actual sortable/filterable/paginated data table,
  not for static cards or lists.
- Any dependency addition requires version pinning, license/security review,
  lockfile update, focused tests, and documentation. An approved V1 dependency
  does not by itself require an ADR. A change in architecture, tenancy, workflow,
  storage model, or approved technology does require an ADR.
- Do not replace existing working code merely to claim library adoption.

## Checkpoint 0 - Resume and reconcile current truth

Objective: resume safely without repeating previous work.

Actions:

1. Inspect `git status`, branch, HEAD, recent commits, upstream divergence, Draft
   PR state, exact-HEAD checks, migration inventory, and Preview/UAT check state.
2. Identify local modified, untracked, and ignored files. Preserve them. Confirm
   that the Glass workbook and secure UAT environment files are ignored and not
   staged; do not print their contents.
3. Read X007/H008-H010/T032 plus their current evidence. Compare `spec.md`,
   `plan.md`, `tasks.md`, `gate-status.md`, `defect-register.md`, and the Draft PR
   summary for stale or contradictory current-state claims.
4. Reconcile the existing hosted completion-label drift: `spec.md` currently
   names three hosted result labels, while the more specific canonical rescue
   prompt requires `HOSTED_TEAM_UAT_READY` or `HOSTED_TEAM_UAT_BLOCKED`. Amend
   the existing Spec 015 artifacts to one vocabulary without weakening any gate.
   Until that correction is committed, `HOSTED_TEAM_UAT_BLOCKED` is the only
   common label and must be used.
5. Inspect the implementation and tests for each trial-critical capability in
   Checkpoint 1. Do not assume a capability exists because a drawer tab or test
   fixture exists.
6. Amend Spec 015 acceptance/plan/tasks only when the verified gap is inside the
   owner-authorized rescue. Do not create a new Spec. Keep historical evidence
   intact.

Exit gate:

- current HEAD and open tasks are unambiguous;
- no user file is at risk;
- the next implementation gap is evidence-backed;
- no hosted mutation has occurred during reconciliation.

Checkpoint record:

- update the existing evidence only if current truth materially changed;
- do not close X007 or H008-H010.

## Checkpoint 1 - Close trial-critical product gaps

Objective: make the online trial genuinely usable by management, assigned team,
client viewer, and client approver, rather than merely navigable.

Work in the following order. For each item, first reproduce the gap on the
current implementation, then amend the existing Spec 015 requirements/tasks if
needed, implement the smallest complete vertical slice, add regressions, and
verify the real permission boundary.

### 1A. Team execution tasks

Provide authorized team/management task creation, assignment, status update,
completion, and useful ordering from the shared deliverable surface. Enforce
tenant, client, active membership, role, deliverable scope, and assignment on
the server and in PostgreSQL/RLS. Sensitive writes must be validated,
idempotent, audited, and covered by positive and negative tests. Client payloads
must not contain internal task details or internal task counts.

### 1B. Internal quality checklist

Provide authorized management review/checklist mutation tied to the exact
deliverable version. Prevent team or client personas from modifying quality
decisions. Make internal approval respect the required checklist rule documented
by Spec 015, and record the decision in audit evidence. Keep quality data absent
from client payloads and markup.

### 1C. Team workload usability and performance

Default normal work surfaces to active/actionable work, with a deliberate way to
show completed work. Add bounded pagination/load-more or equivalent query
limits where the current dataset makes full rendering impractical. Load heavy
workspace details when a deliverable is opened instead of fetching every
deliverable's versions, tasks, files, comments, quality, approvals, SLA, and
activity up front. Preserve shared scoped truth between List and Board.

Verify loading, empty, error, no-assignment, permission-denied, and retry states.
Measure the before/after request/query/render behavior with repository-verifiable
evidence; do not make unsupported performance claims.

### 1D. Universal drawer accessibility

Prove keyboard entry, initial focus, focus containment, Escape close, focus
return, labelled title/description, background interaction blocking, reduced
motion, mobile layout, and Arabic RTL. Fix any missing dialog behavior. Use an
approved accessible primitive only when it materially improves the contract and
after the dependency rule above is satisfied.

### 1E. Client files and account truth

Add a real client files experience for only authorized client-visible/final
assets, with scoped filtering, safe preview/download, permission errors, and no
internal metadata leakage. Add only the truthful minimum account/profile surface
needed for the trial. Do not create pretend settings. Defer nonessential settings
with an explicit P2/P3 disposition if they are not trial-critical.

### 1F. Honest brand and rich content presentation

Use only owner-authorized logo, Arabic font, images, video, PDFs, captions, and
content. If a real asset is unavailable, use a deliberate text wordmark,
monogram, or content-type/channel fallback. Never invent client content or imply
that a placeholder is a delivered asset. Keep client media outside Git unless it
is explicitly approved, synthetic, and redacted.

Exit gate:

- management can review and control the required workflow;
- assigned team members can perform their ordinary work without hidden routes or
  database intervention;
- unassigned and unauthorized roles are denied;
- client viewer and approver receive only their safe client context;
- no P0/P1 product, isolation, approval, audit, file, or accessibility defect is
  open;
- affected local tests pass.

If a verified capability is already complete, record the evidence and skip its
implementation. Do not rewrite it.

## Checkpoint 2 - Prepare Hadna and Glass UAT data

Objective: make the trial representative while preserving privacy and rollback.

Actions:

1. Inspect the owner-provided workbook read-only and keep it untracked/ignored.
2. Generate a unique non-sensitive run ID. Run the repository importer in dry-run
   mode first and validate headers, row categories, dates, text encoding,
   relationships, and category/count totals without printing row content.
3. Treat legacy spreadsheet approval columns as source notes only. Never create
   platform approval decisions from them.
4. Import only meaningful non-empty fields into the correct Hadna/Glass tenant,
   client, contract/package, deliverable, version, and internal task scope.
5. Use only authorized media. Validate links before use; do not fetch private
   links without authority. Missing assets remain honest fallbacks.
6. Prove that the import is tenant/client scoped, idempotent on rerun, reversible
   only by its run ID, and unable to alter unrelated rows.
7. Ensure normal product surfaces show the intended Hadna/Glass work. Keep test
   negative controls out of ordinary persona views.

Required evidence:

- source category, run-ID category, expected/created/updated/skipped counts, and
  rollback/no-op counts only;
- no workbook content, direct IDs, names, emails, URLs, captions, or file paths in
  committed evidence.

Exit gate:

- local dry-run and local import verification pass;
- rerun is a proven no-op or deterministic update according to the documented
  contract;
- run-scoped cleanup is proven locally;
- no actual UAT mutation occurs until Checkpoints 0-3 pass.

## Checkpoint 3 - Complete local and exact-HEAD verification

Objective: establish a trustworthy pre-hosted gate after the last implementation
or import-code change.

First verify every script against `package.json`. Run the closest current matrix,
including at least:

```powershell
npx supabase@2.107.0 db reset --local --no-seed
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:rls:simulator
npm run test:rls:db
npm run test:e2e
npm run test:e2e:persistent
npm run secret:scan
git diff --check
npm run build
```

Also run focused visual QA for representative Arabic RTL desktop/mobile and
keyboard-only flows. Inspect screenshots rather than relying only on Playwright
exit codes. Keep screenshots containing Hadna/Glass content outside Git.

Required regressions include:

- Tenant A/B, same-tenant Client A/B, assigned/unassigned, and role-negative
  isolation;
- exact-current-version approval, stale-version denial, duplicate submission,
  terminal state, idempotency, and atomic rollback;
- internal comment/file/task/quality/activity secrecy at query, payload, markup,
  and storage/download boundaries;
- SLA start, pause waiting client, resume, complete, and client-wait exclusion;
- audit append-only behavior and package ledger single consumption;
- task and quality mutations from Checkpoint 1;
- client files and universal drawer accessibility;
- Hadna/Glass import dry-run, rerun, scope, and rollback.

After the matrix passes:

1. review the complete diff and migrations;
2. make an intentional checkpoint commit, excluding all owner/private/ignored
   files;
3. push the existing branch normally to the existing Draft PR;
4. wait for the required quality workflow on that exact commit;
5. fix only in-scope failures and rerun the affected plus mandatory final gates.

Do not commit a second evidence-only change solely to record the exact-HEAD run
ID, because that would create a new unverified HEAD. Record the final run ID in
the owner-facing response and in external PR evidence when appropriate.

Exit gate:

- clean local reset and full matrix pass;
- exact-HEAD CI passes;
- Draft PR remains unmerged;
- no secret or private artifact is in the diff.

## Checkpoint 4 - Re-verify hosted boundary and apply reviewed changes

Objective: mutate only the already approved non-Production UAT boundary.

Actions:

1. Positively identify Vercel Preview/UAT and Supabase UAT using redacted
   category/fingerprint evidence. Confirm neither is Production and that the app
   points to the intended UAT project.
2. Compare local and hosted migration inventories. Review generated SQL,
   affected tables, functions, policies, grants, and Storage changes.
3. Confirm executor, window, rollback owner, stop authority, expected category
   counts, and run ID before mutation.
4. Apply only pending reviewed repository migrations. Stop on unexpected drift,
   destructive SQL, partial application, or target ambiguity.
5. Sync only approved UAT member profiles/roles. Do not send guessed invitations
   and do not expose credentials.
6. Run the reviewed Hadna/Glass import using its run ID and record redacted
   category/count evidence.
7. Update only the Preview/UAT deployment from the reviewed branch. Do not merge,
   promote an alias to Production, change Production variables, or access a
   Production database.
8. Run post-apply schema/RLS/RPC/Storage/auth smoke and verify fixture mode and
   impersonation are disabled.

Exit gate:

- migrations, role mapping, import, and deployment match the reviewed commit;
- UAT is reachable by approved individual persona sessions;
- post-apply checks pass;
- rollback remains possible within the approved run scope.

## Checkpoint 5 - Execute the complete hosted persona lifecycle (H008)

Objective: prove the real online product, not just route access.

Extend the repository-native hosted suite with a complete lifecycle test, such
as `tests/e2e-hosted/hosted-lifecycle.spec.ts`, or an equivalent clearly named
spec. Keep existing boundary and persona smoke tests. The test must use actual
UAT Auth sessions and the Browser -> Next.js -> server command/RPC ->
PostgreSQL/RLS/Storage path. Service-role use, if needed for setup/assertion,
stays in the trusted Node harness and never reaches the app or browser.

Run these persona sessions:

- management/authorized internal approver;
- account manager according to the verified role matrix;
- assigned writer;
- assigned designer;
- unassigned internal negative user;
- client viewer;
- client approver;
- second-client or second-tenant negative persona when configured.

Prove this lifecycle from the visible UI:

1. locate the correct assigned Hadna/Glass deliverable;
2. create/update/complete an execution task where authorized;
3. edit content and submit the exact version for internal review;
4. complete/check the internal quality gate where required;
5. request internal changes and resubmit a newer version;
6. approve the exact current version internally;
7. deny client send before approval and permit it after approval;
8. pause SLA while waiting for the client;
9. prove client viewer is read-only and sees no internal data;
10. have the client approver request changes with a comment;
11. resume SLA and submit/approve/send the next exact version;
12. deny stale-version approval and cross-scope/direct-ID access;
13. approve the final version as the client;
14. deliver the final asset and close the deliverable;
15. verify the final file is available while internal files remain hidden;
16. verify audit, approval version binding, SLA segments, package ledger, and
    terminal state;
17. replay a sensitive UI action and prove no duplicate delivery, audit, ledger,
    or decision record.

Run representative desktop Chromium, mobile Chromium, Arabic RTL, and
keyboard-only paths. Verify no hydration error, sensitive console output,
unexpected page-level horizontal overflow, inaccessible focus, or hidden
developer knowledge is required.

Use UI actions for behavior and scoped read-only assertions for evidence. Never
use database writes to make a browser step appear to pass.

H008 exit gate:

- the full lifecycle and negative boundaries pass on the reviewed hosted build;
- the team can perform ordinary work through discoverable UI;
- no P0/P1 defect is open;
- hosted evidence is redacted and tied to the reviewed commit/run category.

Only then mark H008 complete in `tasks.md`.

## Checkpoint 6 - Run the controlled team trial and burn down defects (H009)

Objective: validate comprehension and daily usability with the approved team,
not merely automation.

Use the existing team onboarding/UAT script or update it in Spec 015. Keep it
short: role, sign-in handoff method, starting page, one assigned scenario,
expected result, and safe defect-reporting channel. Do not include credentials or
direct sensitive URLs in Git.

Observe at least management, assigned team, client viewer, and client approver
performing their critical path. Record findings in the single existing defect
register with:

- ID;
- severity;
- affected role and workflow;
- reproduction;
- security/data impact;
- owner;
- fix status;
- regression test;
- evidence reference.

Rules:

- P0/P1 blocks completion and must be fixed and verified;
- P2 needs explicit owner disposition;
- P3 may be deferred only with rationale;
- `implemented` is not `verified`;
- local PASS is not hosted PASS;
- hiding a control is not authorization;
- a visual workaround is not a security fix.

For each fix, rerun the focused regression plus the affected isolation, hosted
lifecycle, and final smoke gates. If code changes, return to Checkpoint 3 before
closing hosted gates.

## Checkpoint 7 - Prove rollback/no-op and close T032

Objective: demonstrate safe repeatability and recoverability.

Actions:

1. Rerun the same importer/run contract and prove the documented no-op or
   deterministic idempotent outcome.
2. Rehearse rollback against only rows, role assignments, and Preview resources
   created by the controlled run, or use the approved no-op path when deleting
   accepted UAT data is not appropriate.
3. Verify unrelated Hadna/Glass and negative-control data are unchanged.
4. Record before/after category counts, expected effects, duration category,
   executor category, rollback owner, and verification result without direct
   data.
5. Record T032 outcome using the existing traceability/evidence location. Do not
   close it from local-only or smoke-only evidence.

H009 exit gate:

- defect policy is satisfied;
- rollback/no-op is evidence-backed;
- T032 has direct hosted evidence;
- no mandatory blocker remains.

Only then mark H009 and T032 complete.

## Checkpoint 8 - Final handoff (H010 and X007)

Objective: produce one truthful current-state handoff without claiming
Production readiness.

Before closure:

1. reconcile `spec.md`, `plan.md`, `tasks.md`, `gate-status.md`,
   `defect-register.md`, `execution-log.md`, `docs/PROJECT_PROGRESS.md`, the Draft
   PR summary, and behaviorally affected UX/security/RLS/files/audit/SLA/release/
   rollback docs;
2. keep historical logs append-only and correct stale current snapshots instead
   of rewriting history;
3. run the final secret scan and diff check;
4. keep the PR Draft and unmerged for independent findings-first review;
5. request that independent review using the existing expert-review prompt and
   cover security, tenancy, roles, RLS/Storage, audit, SLA, exact-version
   approvals, files, comments, UX, RTL, accessibility, performance, tests,
   documentation, migration/rollback, and release boundaries.

Close H010 and parent X007 only when H008, H009, T032, and every mandatory gate
are evidence-backed. Otherwise leave them open and report the exact blocker.

## Stop conditions

Stop before mutation, or stop immediately during execution, if any of these is
true:

- Production or an ambiguous target is detected;
- the deployment and database target do not match;
- a secret, credential, signed URL, direct identifier, private workbook value,
  or client content may enter Git, logs, screenshots, PR text, or evidence;
- real, unknown, unrelated, or out-of-run data may be affected;
- a destructive/unreviewed migration, partial application, or unavailable
  rollback is detected;
- tenant/client/assignment isolation fails;
- an unauthorized approval, send, decision, download, or delivery succeeds;
- internal comments, tasks, quality notes, files, or activity reach a client;
- stale-version approval succeeds;
- audit, SLA, approval, package ledger, idempotency, or final-delivery writes are
  partial or duplicated;
- public signup or shared accounts are required;
- a P0/P1 defect is found;
- continued work requires a new architecture, technology, Production action,
  external client invitation, or owner authority not already granted.

For a stop condition, preserve evidence safely, roll back only the current run's
authorized changes when required, update the existing task/evidence files, and
return `HOSTED_TEAM_UAT_BLOCKED`. Do not broaden scope to work around the block.

## Disconnect and resumption protocol

If the machine, task, terminal, or agent disconnects:

1. inspect `git status`, branch, HEAD, recent commits, upstream status, and the
   open checkboxes in `tasks.md`;
2. inspect the last relevant entry in `execution-log.md` and current
   `gate-status.md`;
3. preserve all existing edits and ignored files;
4. resume the first incomplete checkpoint from its last verified substep;
5. do not rerun a completed checkpoint unless its output is invalidated by a
   later code, migration, environment, or target change;
6. never use reset/clean/rebase/force push to recover;
7. if a hosted mutation may have been interrupted, verify target state with
   count/category-only reads before any retry and use the same idempotency/run
   contract.

## Final response contract

After Checkpoint 0 has unified the canonical vocabulary, lead with exactly one
state required by the corrected Spec 015 artifacts. The canonical rescue prompt
currently requires:

- `HOSTED_TEAM_UAT_READY` only when H008-H010, T032, and X007 are all genuinely
  closed;
- `HOSTED_TEAM_UAT_BLOCKED` for every other incomplete or failed mandatory gate,
  including missing approved team access.

Do not introduce a third label in the final response. If the existing canonical
label drift has not been corrected, use `HOSTED_TEAM_UAT_BLOCKED` and report the
documentation conflict.

Then include:

- summary and outcome for management, assigned team, client viewer, and client
  approver;
- exact branch, HEAD, commits, Draft PR, CI, and Preview/UAT state;
- files changed and Spec/plan/tasks/docs updated;
- dependencies added/changed and why;
- ADRs added/updated, or explicitly none;
- migrations, RLS, Storage, and hosted actions performed;
- Hadna/Glass import run category and category/count summary only;
- tests added/updated and exact verification results;
- defect register summary by severity and state;
- tenancy/client/assignment, approval, secrecy, files, audit, SLA, ledger, and
  idempotency findings;
- UX, Arabic RTL, mobile, keyboard, accessibility, and performance findings;
- rollback/no-op result;
- remaining risks, owner-dispositioned P2/P3 items, and out-of-scope work;
- Production boundary;
- `AGENTS.md` compliance checklist;
- short team onboarding path without credentials or sensitive URLs.

Never claim MVP completion, Production-candidate readiness, Production
acceptance, or a live customer release from this runbook. Keep Production,
external customer access, public signup, PR merge, and Production alias promotion
explicitly out of scope.
