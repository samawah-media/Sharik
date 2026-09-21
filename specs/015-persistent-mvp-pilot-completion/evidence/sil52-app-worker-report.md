# SIL-52 app worker — ready for central GREEN

## Scope and implementation

Implemented the approved retained-review application slice under Spec 015 and
ADR-013. No migration, authorization helper, mutation command, route, environment,
or pre-existing SIL-44 change was edited by this slice.

- Added `deriveClientReadableVersion` in
  `src/modules/approvals/client-readable-version.ts`. The five rework states are
  `in_progress`, `ready_for_internal_review`, `internal_changes_requested`,
  `internally_approved`, and `client_changes_requested`. Retained snapshots show
  `client_changes_requested` / 65%, without decision or comment authority.
- `persistent-client-approval.ts` resolves publication through the authenticated
  `s015_client_readable_versions` RPC, scoped to tenant/client/work, then selects
  content using the returned exact version ID and the same tenant/client/work scopes. It
  reads files and comments against that resolved version. It no longer uses the
  internal current-version pointer as the version-read filter. Returned read
  errors deny detail access. Decision eligibility still requires waiting status,
  current/readable version equality, and meaningful review payload.
- `commercial-summary-read.ts` requires an RLS-readable public version before
  including client work, and projects retained rework to the same safe status
  and progress. One authenticated publication RPC is tenant/client/work-set scoped,
  without a row limit that could truncate the mapping. Read errors fail the summary; duplicate
  version rows in the returned batch also fail closed. Management reads are unchanged.
- `client-deliverable-detail.tsx` receives optional `canComment`. Explicit false
  hides the comment form even for an approver. Existing current-version comment
  eligibility and callers without the new field retain their prior behavior.
  Existing decision controls consume the server-derived `isActionable` value.

## Tests and evidence

Tests changed only in:

- `tests/unit/approvals/client-readable-version.test.ts` (new pure projection cases).
- `tests/unit/approvals/s015-persistent-client-approval.test.ts` (retained reads,
  exact scopes, resend, read errors, never-sent summary exclusion; existing RPC
  decision tests preserved).
- `tests/component/client/client-retained-version.test.tsx` (real detail component,
  retained content and hidden writes; current-version controls after resend).

Lead reported the pre-implementation reader/component RED as 8 expected failures
and 16 passes. The missing pure-helper module caused one import-error suite,
which is not claimed as behavioral RED. The helper now exists. The worker ran no
test, typecheck, build, browser, or shared-output process. Scoped `git diff --check`
passed before this report; central GREEN and broader regression remain pending.
Source/test guard review kept mocks at the authenticated backend/Next boundary;
real projection/readers/components remain under test. Documentation claims were
checked against the owned source diff.

## Required integration boundary and remaining gates

Publication authority remains in the separate DB migration: its authenticated
read helper and RPC must identify the last explicitly sent snapshot during rework,
not newest-number/newest-submitted content. General table RLS is not assumed to
return one version: mixed client/team roles can see additional versions. These
application tests supply the scoped RPC response; they do not prove send-history,
policy, storage, or authenticated DB
security. No audit history is fetched or interpreted in JavaScript, and no
service client is introduced. Retained access must not be deployed independently
of the reviewed DB read-boundary change.

Exact-current mutation RPC contracts, comment/upload commands, SLA, internal
working-version pointers, and file visibility/readiness rules are unchanged.
Specs and ADRs were read, not edited. SIL-54 ledger correction is out of this
worker's scope. No network, credentials, delegation, commit, push, hosted change,
or deployment occurred. All unrelated dirty files were preserved.

## Mixed-role correction — awaiting central GREEN

Independent review found that the original table-RLS-only lookup could select
obsolete content or truncate summary work when a caller also held a team role.
Five mixed-role regression cases were added before this correction. Lead reported
central RED: 7 failed / 20 passed. The worker did not execute that run.

Detail now resolves the scoped RPC mapping before any version/content/file/comment
read; empty, failed, duplicate, or wrong-work mapping denies detail. The summary
uses one RPC for its candidate work IDs; absent mappings exclude work and RPC
errors fail the summary. Decision commands and version-bound files/comments remain
unchanged. No build or test was run by the worker after this correction; central
GREEN remains pending. The earlier diff-check evidence predates this correction.
