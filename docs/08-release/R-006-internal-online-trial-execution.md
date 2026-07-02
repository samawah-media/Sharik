# R-006 Internal Online Trial Execution

## Status

OWNER-AUTHORIZED INTERNAL UAT TARGET - MAPPING PREPARED - NO TRIAL URL ISSUED - NO HOSTED MUTATION - NO CREDENTIALS GENERATED

The owner updated the R-006 decision on 2026-07-02: `sharik-uat` / `jnvuccapgsabrwwkxnbh` is authorized as the internal trial Supabase target despite previous users/data, the local workbook `خطة محتوى هدنة - العدد الثاني (1)` is authorized as internal source input, and Vercel deployment is authorized for internal testing only. This is not Production acceptance.

Execution is still paused before hosted mutation because the workbook-to-Sharik mapping must be reviewed first and any hosted insertion must use a minimum-scope plan without printing sensitive workbook content.

## Draft PR Handoff

| Item | Value |
|---|---|
| PR | [#33 R-006 Internal Online Trial Execution - Preflight Blocked](https://github.com/samawah-media/Sharik/pull/33) |
| PR status | Draft / Open / Preflight Blocked |
| GitHub live status | Mergeable, not merged |
| Branch | `codex/r006-internal-online-trial-execution` |
| Draft PR creation HEAD | `2e3fe7e830336e24b56ce078da4af23d8bf98734` |
| Live HEAD checked before this refresh | `ea3512f4be0164bb13c5e711936251c8d4f1deb7` |
| Trial URL | None issued |
| Credentials | None generated or recorded |

## Baseline

- Execution branch: `codex/r006-internal-online-trial-execution`
- Baseline: `origin/main`
- Draft PR creation HEAD: `2e3fe7e830336e24b56ce078da4af23d8bf98734`
- Required merge commit: `10fc4a3b4c8f717d284d177906d1f32f5f61976c`
- Baseline commit message: `Merge pull request #32 from samawah-media/codex/r006-internal-online-trial-readiness`
- Readiness package reviewed: `specs/007-r006-internal-online-trial-readiness/`
- Execution package: `specs/008-r006-internal-online-trial-execution/`

## What Was Confirmed

| Area | Result |
|---|---:|
| Execution branch created from PR #32 baseline | PASS |
| R-006 readiness docs read before operational action | PASS |
| Supabase candidate metadata visible | PASS |
| Vercel linked project visible | PASS |
| PR #33 live status checked | PASS |
| No production deploy/promotion/alias run | PASS |
| No hosted migration or seed run | PASS |
| No credentials generated | PASS |
| No hosted source workbook data added | PASS |

## Follow-up Gate Refresh - 2026-07-02

| Area | Result |
|---|---|
| PR #33 | Open / Draft / Mergeable at HEAD `ea3512f4be0164bb13c5e711936251c8d4f1deb7` |
| CI | `quality` passed |
| CodeRabbit | Status passed; review was skipped because PR #33 is Draft. No GitHub reviews or inline comments were present; one CodeRabbit issue comment exists as metadata only. |
| PR changed files | 13 files, limited to Spec Kit/release/governance artifacts; this refresh updates only release/progress/evidence docs. No product code, dependency, env, migration, seed, or app config change appeared in the current working tree. |
| Supabase read-only count preflight | BLOCKED: aggregate counts found 5 auth users outside `@r006.example.test` plus existing public operational data. |
| Supabase public signup status | BLOCKED: no safe read-only status surface was available; no signup attempt was made. |
| Supabase target update | OWNER-AUTHORIZED: `sharik-uat` may be used for internal R-006 despite existing users/data. Hosted mutation remains NOT_RUN pending mapping review and exact insertion plan approval. |
| Supabase local linked ref | `jnvuccapgsabrwwkxnbh` |
| Vercel env scope | BLOCKED: preview envs are empty, branch preview envs are empty, custom `staging` is not found, and listed envs are Production-only. |
| Vercel deployments | BLOCKED: preview deployments are empty; listed deployments are Production-only. |
| Vercel target update | OWNER-AUTHORIZED for internal testing only; no deploy was run and no Production acceptance is implied. |
| Gate decision | HOLD: keep PR #33 Draft, review mapping, and do not start hosted insertion/deploy until the exact execution plan is approved. |

## Owner Decision Update - 2026-07-02

Supersedes the earlier clean-target-only blocker:

| Area | Updated decision | Still prohibited until separately approved |
|---|---|---|
| Supabase | Use `sharik-uat` as internal R-006 target despite existing users/data. | Cleanup/deletion, broad mutation, public signup, credentials in docs/logs/chat. |
| Source workbook | Use the named local workbook as internal trial input. | Printing row content, captions, links, or sensitive values in GitHub/docs/comments/screenshots/logs/chat. |
| Vercel | Deploy for internal testing only. | Production acceptance, Ready conversion, merge, or promotion. |

Any hosted insertion, deployment, credential generation, or trial execution still requires the exact mapping/execution plan to be reviewed first.

## Supabase Target Status

Candidate:

```text
name: sharik-uat
ref: jnvuccapgsabrwwkxnbh
region: eu-west-1
status: ACTIVE_HEALTHY
```

This target is owner-authorized for internal R-006 use despite existing users/data. It is not approved for broad mutation; hosted insertion remains blocked until mapping review and exact execution-plan approval.

The follow-up gate refresh ran read-only aggregate hosted queries. No row values, emails, hosted migration, seed, account creation, signup attempt, credential generation, or secret values were printed or recorded.

Blocked checks:

- auth users count: 5 users
- non-R006 auth users count: 5 users outside `@r006.example.test`
- clients count: 2 clients
- non-approved fixture data: 1 tenant, 2 contracts, 2 packages, 2 package lines, 7 deliverables, and 3 audit events
- public signup disabled: not verified through a safe read-only surface

Decision note:

```text
The target contains existing non-R-006 hosted users and public operational data.
The owner accepted this risk for internal R-006 only.
Public signup status still needs safe read-only confirmation.
```

## Source Workbook Mapping Status

The workbook was inspected locally without printing row content. Structural findings:

| Workbook area | Convertible rows | Date evidence | Suggested use |
|---|---:|---|---|
| Sheet index 3 | 20 | 2026-02-12 to 2026-03-08, plus one undated row | Historical/reference block. |
| Sheet index 8 | 40 | 2026-03-16 to 2026-07-24, plus undated rows | Mixed current/status-spread block. |
| Sheet index 9 | 52 | 2026-07-25 to 2026-09-29, plus undated rows | Best forward-plan candidate for import. |

Proposed mapping is source headers to Sharik entities only:

- `المرحلة`, `المنصة/القناة`, `الهدف الرئيسي`: internal deliverable context.
- `اليوم`: deliverable due dates and derived SLA dates.
- `قالب المحتوى`: deliverable type and package-line type hint.
- `وصف المحتوى`: deliverable name source, with values kept out of docs/logs.
- `كاتب المحتوى`: owner lookup only if a matching internal user exists.
- `تعميد المحتوى`, `تعميد التصميم`, `تم الجدولة`, `تم النشر`: initial status hints only; no approval decision is created without audited hosted action.
- Reference/link/result columns: excluded from first insertion unless a separate file/link visibility plan is approved.

## Vercel Target Status

Candidate:

```text
project: sharik-platform
```

Blocked checks:

- Preview env vars are not configured.
- Branch-scoped preview env vars for `codex/r006-internal-online-trial-execution` are not configured.
- Custom `staging` environment is not found.
- Current env names are scoped to Production only.
- Preview deployments are empty.
- Listed deployments are Production environment only.
- No preview/staging trial URL exists.

No Vercel deployment command was run.

The follow-up gate refresh rechecked Vercel read-only metadata. The project is linked, but no Preview/Staging target is confirmed for R-006.

## Synthetic Account Preparation

Prepared roster only:

| Persona | Email |
|---|---|
| Tenant admin | `tenant-admin@r006.example.test` |
| Account manager | `account-manager@r006.example.test` |
| Client viewer A | `client-viewer-a@r006.example.test` |
| Client viewer B | `client-viewer-b@r006.example.test` |

Credentials were not generated because target preflight is blocked. Credential delivery remains outside GitHub, docs, logs, screenshots, and PR text.

## Smoke Check Status

All requested smoke checks are blocked:

- sign-in
- product shell
- clients
- client detail
- contracts
- packages
- deliverables list
- Kanban board
- status transition behavior
- audit evidence
- SLA display
- tenant/client isolation
- denied client viewer access
- RTL
- mobile

Reason: there is no confirmed preview/staging deployment URL and no generated credentials.

## Stop Conditions Preserved

- No Production Supabase.
- No Vercel production deployment, production alias, or production promotion.
- No real client data.
- No public signup.
- No hosted seed.
- No hosted migration.
- No product feature expansion.
- No dependency change.
- No credentials in GitHub/docs/logs/screenshots.

## Required Next Step

Before hosted insertion or deployment:

1. Review and approve the mapping and exact row subset.
2. Confirm whether to create a new isolated internal-trial client/contract/package or attach to existing UAT records.
3. Prepare a minimum hosted insertion/seed plan using existing scoped/audited write paths.
4. Confirm Vercel internal-test deployment path and env boundary.
5. Generate credentials only after the above, and deliver them outside GitHub/docs/logs/chat/screenshots.

Evidence is recorded in:

```text
specs/008-r006-internal-online-trial-execution/evidence/verification.md
```
