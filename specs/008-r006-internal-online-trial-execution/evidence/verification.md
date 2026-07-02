# Verification Evidence: R-006 Internal Online Trial Execution

Date: 2026-07-02

## Baseline

| Item | Value |
|---|---|
| Owner decision | GO for non-production internal online trial only |
| Source branch | `origin/main` |
| Required baseline | `10fc4a3b4c8f717d284d177906d1f32f5f61976c` |
| Baseline commit message | `Merge pull request #32 from samawah-media/codex/r006-internal-online-trial-readiness` |
| Execution branch | `codex/r006-internal-online-trial-execution` |
| Draft PR | [#33 R-006 Internal Online Trial Execution - Preflight Blocked](https://github.com/samawah-media/Sharik/pull/33) |
| PR status | Draft / Open / Preflight Blocked; GitHub live check reports mergeable and not merged. |
| Draft PR creation HEAD | `2e3fe7e830336e24b56ce078da4af23d8bf98734` |

## Owner Decision Update - 2026-07-02

Project Control Mode owner update supersedes the earlier clean-target-only blocker:

| Decision Area | Updated Decision | Guardrail |
|---|---|---|
| Supabase UAT target | `sharik-uat` / `jnvuccapgsabrwwkxnbh` is authorized as the internal R-006 target despite previous users/data. | Internal trial only; not Production. |
| Source workbook | Local workbook `خطة محتوى هدنة - العدد الثاني (1)` is authorized as internal trial input. | Do not print sensitive row content in GitHub, docs, comments, screenshots, logs, or chat. |
| Vercel | Deployment is authorized for internal testing only. | Not Production acceptance; no merge/promotion implied. |
| Hosted mutation | Still NOT_RUN. | Show mapping and risks before any hosted insertion/seed. |
| Credentials/secrets | Still NOT_GENERATED. | No credentials in docs/chat/logs/screenshots/comments. |

## Readiness Documents Reviewed

| Artifact | Status |
|---|---:|
| `docs/08-release/R-006-internal-online-trial-readiness.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/spec.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/plan.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/tasks.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/research.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/data-model.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/contracts/readiness-boundary.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/quickstart.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/checklists/requirements.md` | PASS |
| `specs/007-r006-internal-online-trial-readiness/evidence/verification.md` | PASS |

## Command Evidence

| ID | Command | Status | Non-secret Result |
|---|---|---:|---|
| EXEC-001 | `git fetch origin` | PASS | Remote refs updated. |
| EXEC-002 | `git rev-parse origin/main` | PASS | Returned `10fc4a3b4c8f717d284d177906d1f32f5f61976c`. |
| EXEC-003 | `git switch -c codex/r006-internal-online-trial-execution origin/main` | PASS | Branch created and tracks `origin/main`. |
| EXEC-004 | Safe env inspection | PASS | `.env.local` is labeled `APP_ENV=production` and `VERCEL_ENV=production`; it is not valid for R-006. |
| EXEC-005 | `npx supabase projects list -o json` | PASS | Candidate project `sharik-uat`, ref `jnvuccapgsabrwwkxnbh`, region `eu-west-1`, status `ACTIVE_HEALTHY`. |
| EXEC-006 | `npx supabase db query --linked` table-name query | PASS | Listed public/auth table names only; no row values printed. |
| EXEC-007 | `npx supabase db query --linked` deeper metadata query | BLOCKED | CLI requested `SUPABASE_DB_PASSWORD`; no password was available or printed. |
| EXEC-008 | `vercel env ls` | PASS | Linked `sharik-platform` has env names only in Production scope. |
| EXEC-009 | `vercel ls` | PASS | Listed Ready deployments, all in Production environment. |
| EXEC-010 | `npx supabase --help` / relevant subcommand help | PASS | CLI capabilities reviewed before use. |
| EXEC-011 | `vercel --help` / env/list commands | PASS | CLI capabilities reviewed before use. |
| EXEC-012 | `npm run secret:scan` | PASS | No high-confidence secrets found. |
| EXEC-013 | `git diff --check` | PASS | No whitespace errors; CRLF working-copy warnings only. |
| EXEC-014 | GitHub PR #33 live check | PASS | PR #33 was Open, Draft, mergeable, and pointed to draft-creation HEAD `2e3fe7e830336e24b56ce078da4af23d8bf98734` before this handoff update. |
| EXEC-015 | GitHub PR #33 follow-up live check | PASS | PR #33 remained Open, Draft, and mergeable at HEAD `8a85bb7fbb67355b0edbd38dd221e3393a4ffd30` before this decision-gate documentation refresh. `quality` passed. CodeRabbit status passed, but `gh pr checks` reports `Review skipped: draft pull request`; no GitHub review or inline comments were present. |
| EXEC-016 | CodeRabbit comment marker check | PASS | One CodeRabbit issue comment was present; no blocker/actionable marker was detected without printing the comment body. |
| EXEC-017 | Secure Supabase access presence check | BLOCKED | Secure DB preflight access was not present in the Codex process; no secret values were printed. |
| EXEC-018 | Supabase local link check | PASS | Local linked ref is `jnvuccapgsabrwwkxnbh`. |
| EXEC-019 | `vercel env ls` follow-up | BLOCKED | Vercel env names remain Production-only. |
| EXEC-020 | `vercel ls` follow-up | BLOCKED | Listed deployments remain Production-only; no Preview/Staging target is confirmed. |
| EXEC-021 | `npx supabase@2.107.0 projects list --output-format json` refresh | PASS | Candidate project remains `sharik-uat`, ref `jnvuccapgsabrwwkxnbh`, region `eu-west-1`, status `ACTIVE_HEALTHY`, and linked. |
| EXEC-022 | `npx supabase@2.107.0 db query --linked` auth count preflight | BLOCKED | Read-only aggregate query returned 5 auth users and 5 auth users outside `@r006.example.test`; no row values or emails were printed. |
| EXEC-023 | `npx supabase@2.107.0 db query --linked` public aggregate counts | BLOCKED | Read-only aggregate query returned existing public data: 1 tenant, 2 clients, 2 contracts, 2 packages, 2 package lines, 7 deliverables, and 3 audit events. |
| EXEC-024 | Supabase auth config read-only surface check | BLOCKED | Current CLI/help and database metadata did not expose a safe public-signup status read; signup was not tested by attempting signup because that could create an account. |
| EXEC-025 | `vercel env ls preview --format json` | BLOCKED | Preview env list is empty. |
| EXEC-026 | `vercel env ls preview codex/r006-internal-online-trial-execution --format json` | BLOCKED | Branch-scoped preview env list is empty. |
| EXEC-027 | `vercel env ls staging --format json` | BLOCKED | Custom `staging` environment was not found. |
| EXEC-028 | `vercel env ls --format json` | BLOCKED | All listed env names are scoped to Production only. |
| EXEC-029 | `vercel ls sharik-platform --environment preview --format json` | BLOCKED | Preview deployment list is empty. |
| EXEC-030 | `vercel ls sharik-platform --environment production --format json` | PASS | Production deployments exist, but no production deploy, alias, promotion, or trial use was run. |
| EXEC-031 | GitHub PR #33 project-control live check | PASS | PR #33 remains Open, Draft, and MERGEABLE at HEAD `ea3512f4be0164bb13c5e711936251c8d4f1deb7`. `quality` passed. CodeRabbit passed with `Review skipped: draft pull request`. No GitHub reviews or inline comments were present; one CodeRabbit issue comment exists as metadata only. |
| EXEC-032 | Scope guard | PASS | Local working tree and staged diff were clean before this evidence update. No product code, dependency, env file, migration, seed, or app config change appeared. |
| EXEC-033 | Target owner-input check | BLOCKED | No fresh clean Supabase non-production target and no confirmed Vercel Preview/Staging target were provided in this mission. `sharik-uat` was not reused or cleaned. No deploy, alias, promotion, hosted migration, hosted seed, account creation, credential generation, or trial URL issuance was run. |
| EXEC-034 | Owner decision update | PASS | Owner authorized `sharik-uat` for internal R-006 despite existing users/data, authorized the named workbook as internal source input, and authorized Vercel deployment for internal testing only. |
| EXEC-035 | Workbook structural analysis | PASS | Local analysis read workbook structure only: 15 sheets; main convertible blocks contain 20, 40, and 52 candidate rows with date ranges recorded below. No row content, captions, links, or sensitive values were printed. |
| EXEC-036 | Mapping gate | PASS | Hosted mutation remains NOT_RUN until this mapping and a minimum-scope insertion plan are reviewed. |

## Draft PR Handoff

| Item | Status |
|---|---:|
| PR #33 URL recorded | PASS |
| PR #33 Draft/Open status recorded | PASS |
| Preflight Blocked status recorded | PASS |
| Draft PR creation HEAD recorded | PASS |
| No trial URL | PASS |
| No credentials | PASS |
| Required owner action recorded | PASS |

## Supabase Preflight

| Check | Expected | Status | Evidence |
|---|---|---:|---|
| Candidate target exists | Non-production candidate | PASS | `sharik-uat` metadata is visible. |
| Production Supabase not used | No production target | PASS | No production-labeled Supabase target was selected. |
| Real users count | 0 or approved R-006 synthetic only | BLOCKED | Aggregate auth count returned 5 users, all outside `@r006.example.test`. |
| Real clients count | 0 | BLOCKED | Aggregate public count returned 2 clients. |
| Non-approved fixture data | 0 | BLOCKED | Aggregate public counts returned existing tenant/client/contract/package/deliverable/audit data, so the target is not clean for R-006. |
| Public signup | Disabled | BLOCKED | Not verified through a safe read-only surface; no signup attempt was made because it could create an account. |
| Service role exposure | Not visible in browser/docs/logs | BLOCKED | Browser exposure check requires a confirmed non-production deployment URL; no trial URL exists. Docs/logs were kept free of secret values. |
| Hosted migration | Not run | PASS | No migration command was run. |
| Hosted seed | Not run | PASS | No seed command was run. |
| Account creation | Not run | PASS | No users were created. |

Owner update: the existing users/data counts above remain factual evidence, but the owner has accepted using this UAT target for internal R-006 only. This does not authorize broad cleanup, broad seed, public signup, credential disclosure, or Production acceptance.

## Source Workbook Structural Review

No sensitive row content was recorded. Only structural counts, headers, and date ranges were reviewed.

| Workbook area | Convertible rows | Date evidence | Initial status signal, by rule |
|---|---:|---|---|
| Sheet index 3 | 20 | 19 dated rows, 2026-02-12 to 2026-03-08 | Historical/mixed review states; avoid bulk importing unless needed for status-spread smoke data. |
| Sheet index 8 | 40 | 30 dated rows, 2026-03-16 to 2026-07-24 | Mixed current/past/future states; useful for a small status-spread sample. |
| Sheet index 9 | 52 | 50 dated rows, 2026-07-25 to 2026-09-29 | Forward plan; best candidate for clean package/deliverable import. |

Structural source columns observed:

| Source header | Proposed Sharik use |
|---|---|
| `المرحلة` | Optional deliverable context, not client-visible evidence. |
| `اليوم` | `client_due_date` / `final_due_date`; derive `internal_due_date`. |
| `المنصة/القناة` | Deliverable context or optional package-line grouping. |
| `قالب المحتوى` | Deliverable `type` and package-line `deliverable_type_hint`. |
| `وصف المحتوى` | Deliverable `name` source; do not print values in docs/logs. |
| `الهدف الرئيسي` | Internal description context after privacy review. |
| `كاتب المحتوى` | Owner lookup only if a matching internal user exists; otherwise leave owner empty. |
| `المحتوى النصي للتصميم` / `الكابشن` | Exclude from evidence; optional internal-only description after privacy review. |
| `تعميد المحتوى` / `تعميد التصميم` / `تم الجدولة` / `تم النشر` | Initial status hints only; no approval decision without audited hosted action. |
| Reference/link/result columns | Exclude from initial R-006 insertion unless a separate file/link visibility plan is approved. |

## Vercel Preflight

| Check | Expected | Status | Evidence |
|---|---|---:|---|
| Candidate project exists | `sharik-platform` | PASS | `.vercel/project.json` and CLI metadata available. |
| Preview/staging env vars | Present | BLOCKED | Preview envs are empty, branch-scoped preview envs are empty, custom `staging` does not exist, and all listed env names are Production-only. |
| Preview/staging deployment | Available or deployable after safe env | BLOCKED | Preview deployments are empty; listed deployments remain Production target only. |
| Production deploy | Not run | PASS | No `vercel --prod` or deploy command was run. |
| Production alias | Not created/used | PASS | No alias command was run. |
| Trial URL | Preview/staging URL | BLOCKED | No trial URL issued. |

## Follow-up Gate Decision

PR #33 remains Draft. The earlier clean-target blocker is superseded by the owner decision, but execution remains paused before hosted mutation:

- Supabase read-only counts ran and found existing users/data; owner accepted this target for internal R-006 only.
- Supabase public-signup status was not verified through a safe read-only surface.
- Vercel deployment is owner-authorized for internal testing only, but no deployment was run in this step.
- Workbook mapping has been prepared only as a proposal; no hosted insertion/seed ran.
- The current project-control refresh confirmed PR #33 is still Draft/Open/MERGEABLE at HEAD `ea3512f4be0164bb13c5e711936251c8d4f1deb7`; no reviews or inline comments were present.

The online trial did not start.

## Owner Decision Gate

PR #33 remains Draft/HOLD. The current safe path is:

| Step | Next safe action | Not authorized by this evidence |
|---|---|---|
| 1 | Review the workbook-to-Sharik mapping and choose the row subset. | Bulk import of all rows without selection. |
| 2 | Prepare a minimum-scope hosted insertion/seed plan using existing audited commands/tables. | Direct unsafe table writes, public signup, credentials in docs/logs/chat. |
| 3 | Confirm whether to use existing client/contract/package rows or create a new isolated internal-trial client/package under `sharik-uat`. | Cleanup/deletion of existing UAT data. |
| 4 | Configure/run Vercel deployment only as internal testing evidence. | Production acceptance, merge, promotion, or Ready conversion. |

No trial URL, credentials, hosted seed, hosted migration, hosted cleanup, account creation, Vercel deploy, alias, promotion, Ready-for-review conversion, or merge request was performed.

## Synthetic Account Preparation

| Persona | Email | Status |
|---|---|---:|
| Tenant admin | `tenant-admin@r006.example.test` | Roster only |
| Account manager | `account-manager@r006.example.test` | Roster only |
| Client viewer A | `client-viewer-a@r006.example.test` | Roster only |
| Client viewer B | `client-viewer-b@r006.example.test` | Roster only |

No credentials were generated. No passwords, hashes, tokens, service-role keys, database passwords, magic links, or reset links were recorded.

## Smoke Checks

| Area | Status | Reason |
|---|---:|---|
| Sign-in | BLOCKED | No deployment URL and no credentials. |
| Product shell | BLOCKED | No deployment URL. |
| Clients | BLOCKED | No deployment URL or insertion plan approval. |
| Client detail | BLOCKED | No deployment URL or insertion plan approval. |
| Contracts | BLOCKED | No deployment URL or insertion plan approval. |
| Packages | BLOCKED | No deployment URL or insertion plan approval. |
| Deliverables list | BLOCKED | No deployment URL or insertion plan approval. |
| Kanban board | BLOCKED | No deployment URL or insertion plan approval. |
| Status transition behavior | BLOCKED | No deployment URL, insertion plan approval, or credentials. |
| Audit evidence | BLOCKED | No status transition was executed. |
| SLA display | BLOCKED | No deployment URL or insertion plan approval. |
| Tenant/client isolation | BLOCKED | No deployment URL, insertion plan approval, or credentials. |
| Denied client viewer access | BLOCKED | No deployment URL or credentials. |
| RTL | BLOCKED | No deployment URL. |
| Mobile | BLOCKED | No deployment URL. |

## Stop Decision

Execution stopped before hosted mutation, deployment, credential generation, and smoke checks.

Next execution requirements:

1. Review and approve the workbook-to-Sharik mapping and the exact row subset.
2. Confirm whether insertion should create a new internal-trial client/contract/package or attach to existing UAT records.
3. Prepare the minimum hosted insertion/seed plan using existing scoped/audited write paths.
4. Confirm Vercel internal-test deployment path and env boundary.
5. Generate credentials only after the above and deliver them outside GitHub/docs/logs/chat/screenshots.

## Result

No production promotion, production deployment, production alias, hosted seed, hosted migration, real client data, public signup enablement, or credential disclosure occurred.
