# SIL-52 / SIL-54 correction checkpoint — 2026-09-10

Baseline HEAD `8f719715e2b6c53e88c4530c81520c3807a5ab71`; no staged changes. Dirty/untracked hashes captured before writers. [Plan](sil52-sil54-plan.md) and canonical Spec015 govern this round.

| Task | Worker | Mode / state | Actual evidence |
| --- | --- | --- | --- |
| SIL-52 database read/mutation boundary | Erdos | Diagnosis complete; test preparation | Current pointer replaced by draft; SELECT and storage use current-only helper |
| SIL-52 application projection | Nietzsche | Test preparation | Existing readers exclude internal states and bind content to current pointer |
| SIL-54 package transfer | Noether | Diagnosis complete; test preparation | TS and SQL both retain consumed quantity in active reservation |
| Integration / docs / acceptance | Lead | In progress | Preserved dirty baseline, approved spec amendment and ADR-013 |

Model routes: native Codex existing workers, inherited model; actual usage/cost unknown. No recursive or external dispatch. Coordinator owns test/build outputs. One focused revision before reevaluating worker scope.

Docker read-only probe: installed CLI, missing daemon pipe; no reset/reinstall performed. Actual DB/CI/browser gates are pending. Existing UAT defects remain open until evidence supports closure. No hosted mutations/deployment in this correction round.

## Central verification update

- Owner explicitly approved lead commit/push of the reviewed trial branch and GitHub disposable-database tests. This is not Production deployment authorization. Hosted database changes/deployment remain held until the database gate succeeds.
- SIL-54 pre-fix unit RED: 7 expected failures / 4 passes.
- SIL-52 pre-fix reader/component RED: 8 expected failures / 16 passes; the additional missing-helper import error is not behavioral proof.
- Combined post-fix focused GREEN: **52 tests / 4 files passed**, exit 0 (12:41 local runner timestamp). This covers application projection/UI and ledger units, not actual RLS.
- Application and ledger workers finished implementation; independent cross-review and full local regression are in progress. Database worker is completing the additive read-policy migration and pgTAP cases.
- GitHub database tests, hosted rework replay, and owner acceptance are still **NOT RUN** for these fixes. Prior UAT defects are not closed.

## Independent review follow-up

- Initial full local regression: **960 tests / 157 files PASS**; lint, typecheck, secret scan, whitespace check and production build PASS. Later review amendments require fresh verification; this is not the final-source result.
- Decimal capacity regression: actual RED **1 failed / 11 passed**, then GREEN **12 passed** after integer-hundredths arithmetic matching persisted `numeric(12,2)`.
- Mixed team/client roles can broaden table RLS; initial reader assumption was unsafe. Actual additional RED **7 failed / 20 passed**, including obsolete-version content and missing summary work. Explicit client-readable mapping RPC and reader integration are being corrected under ADR-013.
- Direct authenticated audit INSERT could forge send history (source-derived finding). Narrow authoritative-send restriction and real send-RPC regression added to DB work; runtime proof still pending.
- GitHub credentials work outside sandbox networking. Active `Omarhussien2` has repository read-only permissions (`push:false`). Existing `samawah-media` login is available; owner approval to use that identity was requested. No account switch, commit, push, CI dispatch, hosted migration or deployment yet.
- Build-generated `next-env.d.ts` was restored to its pre-turn content; SHA256 matches baseline `83A6738771334A63124C8ACF38250ECCD39FD0ABA62846BB0815D952A7936205`. Exclude this pre-existing local change from commit.

## Final-source local regression

## GitHub execution — owner-authorized

### Final result: SUCCESS

Run34464403517 completed SUCCESS in22m49s on exact SHA `2236507f08209c1a9ecdfc8e5f49a322e2be559d`. Unit499, integration112, RLS simulator24, components331 (966 total); real PostgreSQL pgTAP **993 assertions / 18 files PASS**; fixture browser **263 PASS / 37 SKIP**; persistent browser **24 PASS**. Lint, typecheck, clean no-seed database reset, secret scan and build all passed. The37 skipped checks remain skipped, not accepted; prior conditional notification-proof gap and owner/manual/mobile/files/isolation acceptance remain open. SQL baseline-before-migration RED was not separately executed; actual prior UAT reproduction and local behavioral RED are documented separately. No hosted migration/deployment or business-data change occurred.

Next bounded stage: verify linked non-Production UAT and exactly the two reviewed migration checksums, then apply only within the approved hosted window; verify no-op dry-run, publish exact tested source to Preview, and rerun a fresh fictional retained-version/file/capacity journey. Do not reuse old delivered Madar as proof of new behavior. Do not call the fixes deployed or owner-accepted based on CI.

### Final result: SUCCESS

Run34464403517 completed SUCCESS in22m49s on exact SHA `2236507f08209c1a9ecdfc8e5f49a322e2be559d`. Unit499, integration112, RLS simulator24, components331 (966 total); real PostgreSQL pgTAP **993 assertions / 18 files PASS**; fixture browser **263 PASS / 37 SKIP**; persistent browser **24 PASS**. Lint, typecheck, clean no-seed database reset, secret scan and build all passed. The37 skipped checks remain skipped, not accepted; prior conditional notification-proof gap and owner/manual/mobile/files/isolation acceptance remain open. SQL baseline-before-migration RED was not separately executed; actual prior UAT reproduction and local behavioral RED are documented separately. No hosted migration/deployment or business-data change occurred.

Next bounded stage: verify linked non-Production UAT and exactly the two reviewed migration checksums, then apply only within the approved hosted window; verify no-op dry-run, publish exact tested source to Preview, and rerun a fresh fictional retained-version/file/capacity journey. Do not reuse old delivered Madar as proof of new behavior. Do not call the fixes deployed or owner-accepted based on CI.

Second exact-source run: https://github.com/samawah-media/Sharik/actions/runs/34464403517 at `2236507` (fixture-only correction plus evidence). Database reset and full RLS step **SUCCESS**; browser E2E currently running. Overall quality result still pending. This supersedes earlier NOT RUN statements for disposable SQL only, not hosted acceptance.

- `samawah-media` active identity verified with repository push permission.
- Reviewed candidate committed and pushed: `7abaf9ae946851f6ac031e827d624c7cd45a2d4c`.
- Disposable full quality run started: https://github.com/samawah-media/Sharik/actions/runs/34463859953 . Result pending, not a pass.
- Result: **FAIL** at SQL test fixture line282, not a migration failure. Supabase start/reset succeeded; SIL52 completed150 passing assertions before `not_started` with progress30 violated `deliverables_initial_progress_status`. SIL54 and every other SQL file returned ok. Corrected that fixture to progress0; no policy, assertion or production constraint weakened. Full rerun required; later browser/build steps were skipped by failed gate.
- Only pre-existing `next-env.d.ts` remained dirty after commit. No secrets/environment file committed. Vercel automatic deployment remains disabled; no hosted migration or deployment occurred.

### Local evidence before that push

Owner subsequently approved using the existing `samawah-media` GitHub login. Account switch succeeded. Prior waiting-for-identity entries below are historical. Fresh local repeat passed **966 tests / 157 files** (40.08s). Reviewed source push and disposable CI are authorized; automatic Vercel deployment remains disabled.

- After decimal and explicit mapping corrections: **966 tests / 157 files PASS**, exit 0, 57.28 seconds. Command: `node node_modules/vitest/vitest.mjs run --project unit --project component --project integration --project rls-simulator`.
- Final-source lint, TypeScript, secret scan and production rebuild PASS (exit 0). Build-generated next-env was restored again to its pre-turn content.
- Independent SQL review found no concrete remaining source finding after audit authenticity and mixed-role RPC corrections. This does not substitute for real pgTAP execution.
- Owner account-switch approval still pending. No commit/push or GitHub run has occurred; no hosted migration or deployment. Work remains a local candidate and UAT remains HOLD.

Independent application re-review confirmed the mixed-role finding resolved: exact mapped detail version, non-truncated batch summary and missing/error mapping denial. No further source findings reported. Added/updated tests and ADR/spec boundaries are listed in the three worker reports; no new dependencies, technology, lifecycle permissions or SLA changes. Existing client-workspace work is preserved. Outstanding SQL execution, hosted compatibility, browser acceptance and historical audit-data integrity are not inferred from local checks.
