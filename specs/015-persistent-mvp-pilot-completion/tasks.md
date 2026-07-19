# Tasks: Persistent MVP Pilot Completion

## Milestone 0–1: consolidation

- [x] T001 Correct Stage 2C gate integrity and hydration regression.
- [x] T002 Commit corrected Stage 2C baseline locally.
- [x] T003 Create canonical Spec 015 package and execution spine.
- [x] T004 Run Spec Kit checklist/consistency analysis and record evidence.

## Milestone 2: persistent foundation

- [x] T005 Apply and review persistent MVP migration.
- [x] T006 Add and execute schema/RLS tests for tenant, same-tenant client, role-negative, composite-FK, append-only, atomicity, and idempotency behavior.
- [x] T007 Add persistent repository contracts for versions, approvals, comments, files, and SLA segments.
- [x] T008 Add audited server commands for internal review, internal approval, client submission, client decision, delivery, and closure.

## Milestone 3: workflow wiring

- [x] T009 Replace production route fixture reads with scoped persistent reads.
- [x] T010 Wire and DB-verify account_manager/content_writer/designer assigned-team submission and internal review UI.
- [x] T011 Wire client approval/change-request UI with exact-version and scope checks.
- [x] T012 Persist SLA pause/resume and package consumption in the same audited workflow.
- [x] T013 Add complete persistent role-based E2E journey and secrecy assertions.

## Milestone 4: local acceptance

- [x] T014 Run lint, typecheck, unit, integration, component, RLS simulator, RLS DB, E2E, secret scan, diff check, and build.
- [x] T015 Run manual RTL/mobile/keyboard matrix and record evidence.
- [x] T016 Burn down P0/P1 and disposition every P2.
- [x] T017 Record local acceptance only if DB-backed checks are green.

## Milestone 5: handoff preparation only

- [x] T018 Prepare bounded Hadna-only hosted UAT prompt, approvals, stop conditions, rollback owner, and T032 closure evidence requirements.
- [x] T019 Confirm hosted actions performed: zero; Production acceptance: not granted.

## Owner-Authorized Hosted Team UAT Amendment

Status: `HOSTED_TEAM_UAT_BLOCKED` after the owner's first human product trial rejected the Preview experience on 2026-07-19. The earlier automated hosted lifecycle remains valid technical evidence, but it is not human product acceptance. Production acceptance remains not granted.

The following hosted tasks extend Spec 015 only. They do not reopen or invalidate completed local tasks T001-T019.

- [x] H001 Hosted target and branch preflight: confirm clean worktree, fetch origin, inspect merge base, commit list, full diff/stat, migrations, generated files, secrets, and unrelated historical work.
- [x] H002 Rollback and stop-condition approval: record deployment, database, access rollback, rollback owner, executor, execution window, stop authority, expected rollback time, and verification steps before hosted mutation.
- [x] H003 Draft PR and CI: run full local verification, push the safe reviewed branch, create a Draft PR, inspect CI, and fix only in-scope failures. Do not merge.
- [x] H004 Supabase UAT migration gate: the originally reviewed set and later additive Spec 015 migrations were inventoried, reviewed, applied to non-Production UAT, and revalidated before hosted lifecycle acceptance.
- [x] H005 Synthetic Hadna UAT seed: create minimal idempotent run-ID-scoped Hadna tenant/client/contract/package/deliverable/file metadata records and record category/count-only evidence.
- [x] H006 Team account/access setup: configure only approved individual Samawah team testers and team-controlled client personas; if approved email mapping is unavailable, stop with `TEAM_ACCESS_INPUT_REQUIRED`. Owner-approved synthetic UAT accounts now cover management, account manager, assigned writer, assigned designer, unassigned internal negative tester, client approver, and client viewer; Auth, membership, and role checks pass for all categories.
- [x] H007 Vercel Preview deployment: configure Preview/UAT env only, deploy the reviewed branch to Preview/UAT, verify Supabase UAT binding, sign-in, Arabic RTL shell, no fixture actor support, non-local `APP_ENV`, and no service-role key in client bundles/logs. The protected UAT alias targets the exact reviewed Preview and owner-distributed protected access passed hosted smoke.
- [ ] H008 Hosted team workflow UAT: automated real-Auth route/lifecycle evidence passed historically, but owner human acceptance is reopened. Current Glass client/team surfaces are not usable for a formal team trial.
- [ ] H009 Defect burn-down and T032 evidence: reopened because the owner trial found blocking product/data defects S015-P1-063 through S015-P1-068 and related P2 defects.
- [ ] H010 Hosted handoff and boundary record: reopen until the corrected exact Preview passes owner human acceptance for management, assigned team, client viewer, and client approver.

Hosted amendment correction: H001-H007 remain accepted technical/environment evidence. H008-H010 are reopened by the 2026-07-19 owner trial. Automated route success must never be used as a substitute for understandable, representative human product acceptance.

## Product Experience Rescue Amendment — same Spec 015

- [x] X001 Amend Spec 015 with role outcomes, UX/security acceptance, hosted gates, and explicit boundaries.
- [x] X002 Establish the Samawah design contract and shared RTL/accessibility tokens.
- [x] X003 Make client pending approval navigation real and add a discoverable client shell/profile/sign-out path.
- [x] X004 Remove raw assignee identifiers from normal management card UI.
- [x] X005 Add persistent regression coverage for client pending/home/summary consistency and raw-ID secrecy. CI run `29239615839` passed RLS 228/228 and fixture E2E 108 for migrations 202607130001/002; later X006 migrations and persistent browser rerun remain open.
- [x] X006 Complete universal role-aware deliverable detail, persistent content/file/comment execution, and team board/list UAT. Exact-HEAD PR #37 quality run `29263587871` attempt 2 passed for commit `65191fdaf9319bc3b85a2d49d8c951c9c21e93ae`, including Supabase start/reset, RLS, fixture E2E, persistent E2E, secret scan, and build.
  - [x] X006-A Harden exact-current-version RPC invocation and scoped member-profile reads/sync with direct RPC and RLS tests.
  - [x] X006-B Implement the shared keyboard-accessible role-filtered deliverable drawer and persistent execution read model.
  - [x] X006-C Implement Zod/React Hook Form content editing, version submission, internal review/change/approval, and exact-version client send.
  - [x] X006-D Implement Uppy + Supabase Storage upload, metadata, cleanup, previews, signed access, and Storage/RLS tests.
  - [x] X006-E Implement persistent Tiptap comments with explicit visibility and client payload/markup secrecy tests.
  - [x] X006-F Implement assigned-work List/Board views, filters, five-to-six macro lanes, and governed dnd-kit interaction.
  - [x] X006-G Complete exception-first management and scannable client portal experiences.
  - [x] X006-H Execute DESIGN.md RTL/mobile/keyboard/reduced-motion/state visual QA and close all local gates.
- [ ] X007 Execute generic run-ID-scoped Glass/Hadna import, hosted persona UAT, defect burn-down, rollback/no-op evidence, and H008-H010 handoff. Import mechanics and automated lifecycle passed historically; representative data presentation and human acceptance are reopened under X008.
  - Execution sequence (subordinate runbook, not a second task source): [X007 Step-by-Step Execution Runbook](evidence/x007-step-by-step-execution-runbook.md).

## Owner Human Trial Rescue — same Spec 015

- [ ] X008 Correct the owner-rejected Preview experience without creating a new Spec or parallel plan.
  - [x] X008-A Remove duplicate navigation/actions and every client-name-specific hardcode from shared surfaces.
  - [x] X008-B Enforce understandable role entry/route boundaries and add a discoverable sign-out/profile control for every role shell.
  - [x] X008-C Quarantine synthetic lifecycle records from normal human-trial views without deleting their historical evidence.
  - [x] X008-D Present imported Glass/Hadna content as professional, reusable content cards with thumbnail or honest branded fallback, platform/format, caption excerpt, owner, status, SLA, and next action.
  - [x] X008-E Prepare a bounded representative Glass workflow so assigned team work is discoverable and at least one exact current version is genuinely waiting for the client approver; do not manufacture approval history.
  - [x] X008-F Fix corrupted display names and validate the imported field mapping using category/count/field evidence only.
  - [x] X008-G Add negative route/role checks, content-quality regressions, pending-count/action consistency checks, and desktop/mobile/RTL visual acceptance.
  - [ ] X008-H Deploy only the corrected reviewed Preview, obtain explicit owner PASS for all three experiences, then close H008-H010, X007, and T032 if no P0/P1 remains.

X008-A through X008-G are implemented and verified locally and on the corrected protected Preview. The bounded Glass setup contains 16 imported deliverables, 9 current versions with a real caption/body, 8 assignments across four representative deliverables, and 2 genuine current versions waiting for the client; no workbook approval or file was manufactured. Real-Auth role smoke passed 21/21 across desktop, mobile, and Arabic RTL. X008-H and the parent remain open because explicit owner human PASS has not been recorded; the hosted synthetic mutation lifecycle also cannot be rerun from this workstation because the required setup-only service credential is absent. H008-H010, X007, and T032 remain open.

## Correction note: task assignment authority (2026-07-15)

Checkpoint 1A was reopened for a third corrective slice. Five defects (S015-P1-044 through S015-P1-047, S015-P2-048) were registered and addressed by additive migration `202607140005_s015_task_assignment_authority_correction.sql`: (1) `created_by` is no longer a permanent task-read grant; (2) deliverables SELECT RLS is narrowed so team roles see only owner/contributor/task-assignee deliverables while management sees all; (3) `s015_upsert_deliverable_task` restructures update authority into management/owner-contributor/assignee tiers with server-side protected-field preservation; (4) `s015_validate_task_assignee` links active role to active membership; (5) explicit server capabilities replace implicit UI inference. The canonical assignment model is documented in `defect-register.md`. This slice was superseded by the fourth bounded review correction below and remains part of the accepted Checkpoint 1A evidence.

Independent review reopened Checkpoint 1A for a fourth bounded corrective slice. Defects S015-P1-049 through S015-P1-052, S015-P1-054, and S015-P2-053/S015-P2-055/S015-P2-056 cover false service-role persona evidence, mutually recursive deliverable/task RLS, actor-unscoped capability calculation plus an invalid eligible-assignee query, task-only `/work` filtering, inactive-former-assignee RPC access, unwired/fail-open or actor-mismatched task controls, and late-table persistent harness grants. Additive migration `202607150001_s015_task_assignment_review_corrections.sql`, real-Auth persistent browser coverage, management task edit/reassign UI, exact-assignee status controls, and fail-closed capabilities passed the complete exact-HEAD PR #37 quality matrix in run `29404575276` for head SHA `98a6e6745cf5e6c13e76e672a44883ec0bd51201`. Checkpoint 1A is locally accepted with no open P0/P1. The later X007 hosted work, H008-H010, and T032 are now closed by `evidence/hosted-team-uat-final-handoff.md`; Production acceptance remains open and outside this task.

## Correction note: persistent browser verification

On 2026-07-11, T013, T016, and T017 were reopened after defect `S015-P1-019` identified that the prior Playwright path used route actor fixtures under `APP_ENV=test` and therefore did not prove a real browser-to-persistent-database journey. They were closed again only after `npm run test:e2e:persistent` passed against the local Supabase API/Auth stack with `APP_ENV=test-persistent`, route fixtures disabled, synthetic Auth users, and DB assertions for version binding, role boundaries, comments/files secrecy, SLA, audit, package ledger, and delivery.
