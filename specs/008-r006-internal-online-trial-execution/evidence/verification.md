# Verification Evidence: R-006 Internal Online Trial Execution

Date: 2026-07-02

## Result

R-006 was executed against the owner-authorized UAT target.

| Area | Status | Evidence |
|---|---:|---|
| Owner authorization | PASS | Owner explicitly authorized the Hadna workbook as internal source data, `sharik-uat` as UAT target, and Vercel deployment for internal UAT. |
| Source workbook inspection | PASS | Local workbook inspected without recording row content, captions, links, or sensitive fields. |
| Hosted Supabase insertion | PASS | Inserted scoped Hadna UAT records into `sharik-uat` / `jnvuccapgsabrwwkxnbh`. |
| RLS gap remediation | PASS | Added scoped client-portal commercial read policies and a database test for membership plus role checks. |
| Vercel deployment | PASS | Deployed and promoted the current build for temporary internal UAT. |
| Web smoke | PASS | Login, visibility, isolation, RTL, and mobile checks passed on the promoted Vercel alias. |
| Secret handling | PASS | No passwords, tokens, service keys, workbook links, row content, or sensitive values were recorded in docs, GitHub text, screenshots, or chat. |
| Final checks | PASS | `npm run secret:scan` passed; `git diff --check` passed with CRLF working-copy warnings only. |

This is not Production acceptance, Ready conversion, PR merge approval, or approval to reuse non-Hadna customer data.

## MVP Productization Sprint Evidence - 2026-07-03

PR #34 was merged before this pass. Current branch: `codex/r006-mvp-productization`.

## Owner Merge Gate Evidence - 2026-07-08

Owner explicitly approved merging PR #35 (`R-006 MVP Productization Sprint`). PR #35 was merged into `main` with merge commit `4a7b2d1dd6aa2e5230bbf2863abfd62307e8f748`, and local `main` was fast-forwarded to `origin/main`.

Pre-merge live status for PR #35 was `OPEN`, not draft, `MERGEABLE`, `CLEAN`, with `quality` success and CodeRabbit status success. The CodeRabbit PR comment noted a review-limit condition, but the status context was successful and no actionable review findings were present.

Post-merge smoke on `https://sharik-platform.vercel.app`:

| Route | Status | Non-sensitive result |
|---|---:|---|
| `/` | PASS | 307 redirect to `/sign-in`; final page returned 200. |
| `/sign-in` | PASS | 200 and Arabic sign-in shell. |
| `/portfolio` | PASS | Safe sign-in/session state; no Hadna UUID rendered. |
| `/clients` | PASS | Safe sign-in/session state; no Hadna UUID rendered. |
| `/client` | PASS | Safe sign-in/session state; no Hadna UUID rendered. |
| `/client/commercial` | PASS | Safe sign-in/session state; no Hadna UUID rendered. |

No hosted DB mutation, credential output, non-Hadna data use, screenshots, or Production acceptance was introduced by this merge gate.

## Owner UAT On Merged MVP Productization Main - 2026-07-08

Scope: hosted owner UAT on `https://sharik-platform.vercel.app` using only Hadna R-006 UAT accounts and out-of-band credentials. The run used separate browser contexts per persona and did not record passwords, tokens, screenshots, workbook row content, captions, links, or deliverable titles.

No application data mutation was performed. Authenticated browser sign-in was necessary to verify the requested views; no hosted clients, deliverables, packages, files, comments, approvals, policies, or audit rows were changed.

Hosted UAT result:

| View | Status | Classification | Non-sensitive evidence |
|---|---:|---|---|
| Management / project admin | PASS | Product / UX | Hadna-first landing, Arabic RTL, Hadna clients path, 52 management deliverable cards, safe MVP deliverable labels, no console errors. |
| Account manager | FOLLOW-UP NEEDED | UX | Hadna data was safe and scoped, with 52 deliverable cards and no forbidden identifiers; however the page chrome showed 3 admin-only labels on the account-manager landing. |
| Client viewer A | PASS | Product / UX / Security | Client home and package summary loaded, 52 client deliverable cards rendered, no management labels, no forbidden identifiers, no console errors. |
| Client viewer B | PASS | Security | Safe no-assigned-client state, 0 data cards, Hadna hidden, no forbidden identifiers, no console errors. |
| Client viewer A mobile portal | PASS | UX | 390px portal check showed Hadna package summary and 52 deliverable cards with no horizontal overflow. |

Feedback classification:

| ID | Classification | Finding | Follow-up |
|---|---|---|---|
| UX-001 | UX | Account manager saw admin-oriented shell/page-chrome labels (`لوحة الإدارة`, `الفريق`, `الدعوات`) while the role-specific body navigation was correctly scoped to `عملائي`, Hadna, deliverables, and summary. | Prepared a focused display-only fix on `codex/r006-owner-uat-shell-nav-fix`; no permission, RLS, Supabase data, or workflow mutation was required. |

Focused follow-up fix prepared:

- `ProductShell` can now receive role-aware shell navigation and role-specific breadcrumb/home labels instead of always rendering static admin navigation.
- The management layout supplies authenticated runtime navigation on hosted builds and uses a neutral shell fallback for fixture/unauthenticated states.
- The management layout also skips runtime Supabase context resolution when public Supabase env vars are unavailable, matching the GitHub build environment while preserving hosted runtime navigation.
- The account-manager MVP E2E path now asserts the admin-only shell labels are absent.
- Local targeted verification passed: component shell tests and the three-role MVP Playwright matrix across desktop, mobile, and RTL.

## PR #36 Owner Merge And Post-Merge Smoke - 2026-07-08

Owner explicitly approved merging PR #36 (`fix(R-006): scope account manager shell navigation`). PR #36 was marked ready for review and merged into `main` with merge commit `ce57bd103d585d8d18cbb5273e5120dc6cab7b7e`.

Review conclusion before merge: approved as a UX-only follow-up for UX-001. The changed files were limited to product shell/navigation rendering, targeted component/E2E coverage, and R-006 evidence/tasks/progress documentation. No Supabase migration, RLS policy, server action, permission model, hosted data script, package dependency, or workflow-state mutation was changed.

Because the Vercel alias did not auto-update immediately after the merge, the merged `main` build was deployed and promoted for UAT smoke:

| Deployment item | Value |
|---|---|
| Merged deployment | `https://sharik-platform-qhhotsd0e-omarhussien2s-projects.vercel.app` |
| UAT alias | `https://sharik-platform.vercel.app` |
| Scope | Internal UAT smoke only; not Production acceptance. |
| Hosted DB mutation | None. |

Post-merge authenticated smoke on `https://sharik-platform.vercel.app` used only the Hadna R-006 UAT accounts and out-of-band credentials. The run used separate browser contexts and did not record emails, passwords, tokens, screenshots, workbook row content, captions, links, deliverable titles, or secret values.

| Account view | Status | Non-sensitive result |
|---|---:|---|
| Management / project admin | PASS | `/portfolio` loaded Hadna context, admin shell was present for the admin role, no Viewer B identifier was rendered, and 5 safe article cards were present. |
| Account manager | PASS | `/portfolio` loaded Hadna context with role shell labels, admin-only labels were absent, no Viewer B identifier was rendered, and 5 safe article cards were present. |
| Client viewer A | PASS | `/client/commercial` loaded Hadna package/deliverables context, management chrome was absent, no Viewer B identifier was rendered, and 62 safe article cards were present. |
| Console errors | PASS | 0 browser console errors were observed during the three-account smoke. |

UX-001 is resolved on the promoted alias for the tested account-manager path. No hosted application data was mutated by this merge/deploy/smoke pass.

## Final R-006 Owner Acceptance Smoke - 2026-07-08

Scope: final owner acceptance smoke on the current promoted main alias after PR #36 merge, using only Hadna R-006 UAT accounts and out-of-band credentials. The run used separate browser contexts per persona, plus a separate mobile client context. No hosted database mutation was performed, and no credentials, emails, screenshots, workbook row content, links, captions, deliverable titles, tokens, or secret values were recorded.

Smoke result:

| Check | Status | Classification | Non-sensitive evidence |
|---|---:|---|---|
| Management / project admin | PASS | Product / UX | Hadna context loaded, the management shell was present, and the admin shell labels were visible for the admin role. |
| Account manager | PASS | UX | Role shell labels were visible for the account-manager role, admin-only shell labels were absent, and scoped Hadna content loaded. |
| Client viewer A | PASS | Product / UX / Security | Client portal and package/deliverables scope loaded without management chrome or management-only links. |
| Viewer B isolation | PASS | Security / Data | The unassigned viewer saw no Hadna context and no client data cards. |
| Mobile client portal | PASS | UX / Security | The mobile client portal had no horizontal overflow and no management chrome. |

Final owner acceptance smoke conclusion: no Product, UX, Security, or Data issue was found in the requested scope. R-006 is ready for owner acceptance review on the tested alias. This remains internal UAT evidence only and is not Production acceptance.

## Owner Acceptance Decision - 2026-07-08

Owner explicitly accepted R-006 after the final owner acceptance smoke passed. The accepted scope is the Hadna-only internal UAT/MVP evaluation flow on the promoted alias after PR #36 merge.

Acceptance boundary:

| Item | Status |
|---|---:|
| R-006 internal UAT owner acceptance | ACCEPTED |
| Production acceptance | NOT GRANTED |
| Non-Hadna customer data use | NOT GRANTED |
| Hosted DB mutation in this decision step | NONE |
| New code or dependency change in this decision step | NONE |

Recommended next step: start the next larger workstream with a new Spec Kit package and explicit scope before code. The next workstream should build on the accepted R-006 baseline rather than reopen the completed acceptance smoke.

### Product/UX Audit

Scoring: 1 = confusing or unsafe, 5 = clear enough for MVP evaluation.

| Page | Before | After | Notes |
|---|---:|---:|---|
| `/sign-in` | 3 | 4 | Changed from admin-only wording to Sharik UAT login for all roles. |
| `/portfolio` | 2 | 4 | Became the role landing page with Hadna MVP snapshot and direct CTAs. |
| `/clients` | 3 | 4 | Hadna is first-class with snapshot and no slug/UUID display. |
| `/clients/{hadnaId}` | 3 | 4 | Added Hadna snapshot and clear paths to deliverables, package, and work board. |
| `/clients/{hadnaId}/deliverables` | 2 | 4 | Now shows name, type/channel, date, status, and progress without full captions/descriptions. |
| `/clients/{hadnaId}/commercial` | 2 | 4 | User-facing label is now `المتابعة / SLA`; package and deliverables are readable. |
| `/client` | 2 | 4 | Client sees Hadna, package/deliverable CTAs, and no management concepts. |
| `/client/commercial` | 2 | 4 | User-facing label is now package/deliverables summary; client-safe fields only. |

Remaining reason no page is scored 5: files/final delivery and approval decision actions remain out of MVP scope for this pass.

### Implemented MVP Navigation Model

| Role | Navigation model |
|---|---|
| Management / project manager | `لوحة الإدارة`, `العملاء`, `هدنة`, `المخرجات`, `المتابعة / SLA` |
| Account manager | `عملائي`, `هدنة`, `مخرجات هدنة`, `ملخص المتابعة` |
| Client viewer / approver | `الرئيسية`, `مخرجاتي`, `الباقة والمتبقي`, `بانتظار موافقتي` later for approval workflow |

### Terminology Replacement

| Before | After |
|---|---|
| `تسجيل الدخول الإداري` | `تسجيل الدخول إلى شريك` |
| `لوحة المتابعة` for internal board | `لوحة العمل` |
| `commercial` / commercial summary | `المتابعة / SLA`, `الباقة والمتبقي` |
| `portfolio` as visible idea | `لوحة الإدارة` or `عملائي` |
| `Kanban` in user-facing copy | `لوحة العمل` |
| generic unavailable resource wording | safe Arabic access guidance |

### Local Verification Before Full Release Checks

| Check | Status | Notes |
|---|---:|---|
| `npm run typecheck` | PASS | TypeScript passed after MVP summary/data-shape updates. |
| `npm run test:unit` | PASS | 24 files / 84 tests. |
| `npm run test:component` | PASS | 16 files / 51 tests. |
| `npm run lint` | PASS | Full ESLint pass. |
| Targeted Playwright MVP set | PASS | 39 tests across desktop/mobile/RTL. |

No hosted DB mutation, credential generation, workbook row disclosure, screenshots, or secret values were introduced by this pass.

### Full Release Verification and Deployment - 2026-07-03

| Check | Status | Notes |
|---|---:|---|
| `npm run lint` | PASS | Full ESLint pass with `--max-warnings=0`. |
| `npm run typecheck` | PASS | `tsc --noEmit`. |
| `npm run test:unit` | PASS | 24 files / 84 tests. |
| `npm run test:component` | PASS | 16 files / 51 tests. |
| `npm run test:e2e` | PASS | 79 passed / 2 skipped across desktop, mobile, and RTL projects. |
| `npm run secret:scan` | PASS | No high-confidence secrets found. |
| `git diff --check` | PASS | CRLF working-copy warnings only; no whitespace errors. |
| `npm run build` | PASS | Local Next.js production build compiled, typechecked, and generated static pages. |
| Vercel remote build | PASS | Built and aliased the deployment below. |

| Deployment item | Value |
|---|---|
| Pull request | [#35 R-006 MVP Productization Sprint](https://github.com/samawah-media/Sharik/pull/35) |
| Direct deployment | `https://sharik-platform-ao0fjvrwn-omarhussien2s-projects.vercel.app` |
| UAT alias | `https://sharik-platform.vercel.app` |
| Scope | Internal UAT only; not Production acceptance. |
| Hosted DB mutation | None in this MVP Productization pass. |

Post-deploy smoke on `https://sharik-platform.vercel.app`:

| Route | Status | Non-sensitive result |
|---|---:|---|
| `/` | PASS | 307 redirect to `/sign-in`. |
| `/sign-in` | PASS | 200 and Arabic Sharik sign-in shell. |
| `/portfolio` unauthenticated | PASS | Safe sign-in/session state; no Hadna scoped data rendered. |
| `/clients` unauthenticated | PASS | Safe sign-in/session state; no Hadna scoped data rendered. |
| `/client` unauthenticated | PASS | Safe sign-in/session state; no Hadna scoped data rendered. |
| `/client/commercial` unauthenticated | PASS | Safe sign-in/session state; no Hadna scoped data rendered. |

Authenticated role smoke for the deployed alias requires the out-of-band UAT credentials. Local E2E covered account manager, management/project admin, client viewer A, and viewer B isolation with route fixtures; hosted route fixtures remain disabled by design outside local/test runtimes.

## Targets

| Target | Value |
|---|---|
| Execution branch | `codex/r006-internal-online-trial-execution` |
| PR | `#33` |
| Supabase project | `sharik-uat` |
| Supabase ref | `jnvuccapgsabrwwkxnbh` |
| Vercel project | `sharik-platform` |
| Vercel deployment URL | `https://sharik-platform-785s4i5xd-omarhussien2s-projects.vercel.app` |
| Smoke URL | `https://sharik-platform.vercel.app` |

Note: the direct deployment URL initially redirected through Vercel SSO. The public project alias was promoted to the same deployment and used for smoke testing.

## Hadna Source Mapping

The authorized local Hadna workbook was inspected locally. The import used the 52-row forward-looking block as the start point.

| Source area | Imported rows | Date evidence | Notes |
|---|---:|---|---|
| Forward block, zero-based sheet index 8 | 52 | 50 dated rows from 2026-07-25 through 2026-09-29, plus 2 undated rows | Row content was not printed or committed. |

Mapping used:

| Sharik entity | Source mapping |
|---|---|
| `client` | One Hadna client under the R-006 UAT tenant scope. |
| `contract` | One Hadna UAT contract. |
| `package` | One Hadna UAT package. |
| `package_lines` | Grouped from content/service type signals into 5 package lines. |
| `deliverables` | One deliverable per imported forward-row item, 52 total. |

Excluded from docs/evidence: workbook row content, captions, links, reference URLs, credentials, and sensitive approval notes.

## Created Data

Hosted aggregate verification returned the following scoped R-006 counts:

| Entity | Count |
|---|---:|
| tenants | 1 |
| synthetic auth users | 4 |
| clients | 1 |
| contracts | 1 |
| packages | 1 |
| package_lines | 5 |
| deliverables | 52 |
| audit_events | 57 |

The audit count includes the original R-006 import audit events plus one later `ClientUpdated` audit event for the Hadna Arabic display-name correction.

No existing UAT rows were deleted.

## Hosted Changes

| Change | Status | Notes |
|---|---:|---|
| Hadna UAT insertion | PASS | Inserted only the owner-authorized Hadna trial scope. |
| Synthetic users | PASS | Created for R-006 smoke only; credentials remain outside GitHub/docs/logs/chat/screenshots. |
| Migration push | PASS | Applied pending hosted migrations, including the new F006 commercial read policy migration. |
| Database RLS test | PASS | Hosted pgtap execution exited successfully for `f006_client_portal_commercial_read_policies.test.sql`. |

The new policy requires both active client membership and an active client-scoped role before client users can read commercial rows.

## Access Fix Pass - 2026-07-02

Owner-reported symptom: account manager saw the safe denial/session-safe state when opening the management clients route.

### Hosted DB Read-Only Audit

Read-only hosted inspection found the R-006 Hadna scope intact:

| Check | Status | Non-sensitive result |
|---|---:|---|
| R-006 synthetic users | PASS | 4 users with `@r006.example.test`. |
| Hadna client id | PASS | `b0060000-0000-4000-8000-000000000301`. |
| Hadna linkage | PASS | 1 contract, 1 package, 5 package lines, 52 deliverables; all 52 deliverables have contract/package linkage in the Hadna tenant/client scope. |
| Account manager scope | PASS | Active tenant membership and active `account_manager` role scoped to the Hadna client. |
| Client viewer A scope | PASS | Active tenant membership, active client membership for Hadna, and active `client_viewer` role scoped to Hadna. |
| Viewer B isolation | PASS | No active client membership for Hadna; hosted RLS/client portal smoke returns no Hadna data. |

No hosted DB correction was applied in this pass because the required account manager and viewer A scopes already existed. No unrelated client data was changed and no rows were deleted.

### Root Cause

The hosted data was correctly scoped. The failing surface was the management `/clients` route guard: it required tenant-wide `CLIENT_VIEW_ALL_IN_TENANT`, while the account manager correctly has client-scoped `CLIENT_VIEW` for Hadna. Direct account-manager access to `/clients/b0060000-0000-4000-8000-000000000301` and its deliverables already worked before the code fix.

### Fix

The management clients index now permits non-client internal users who have at least one visible client-scoped `CLIENT_VIEW`, while client-portal-only users remain denied from the management clients index and continue to use `/client`.

Targeted unit coverage was added for:

| Check | Status |
|---|---:|
| Assigned internal user can open clients index for scoped clients | PASS |
| Client viewer cannot open management clients index | PASS |

## Smoke Results

### Web Smoke

The web smoke ran on `https://sharik-platform.vercel.app`, which was promoted to the current deployment.

| Check | Status | Non-sensitive result |
|---|---:|---|
| Tenant admin login | PASS | Landed on management commercial summary. |
| Management client/package/deliverables visible | PASS | Article groups were `[3, 1, 5, 52]`: summary cards, contract, package lines, deliverables. |
| Client viewer A login | PASS | Landed on client commercial summary. |
| Client viewer A package/deliverables visible | PASS | Article groups were `[1, 5, 52]`: contract, package lines, deliverables. |
| Client viewer B login | PASS | Landed on client portal path. |
| Basic client isolation | PASS | Viewer B received safe state and zero data articles. |
| RTL | PASS | `dir=rtl`, `lang=ar-SA`. |
| Mobile quick check | PASS | 390px viewport had no horizontal overflow and retained `[1, 5, 52]` groups. |

No screenshots were taken.

### Access Fix Web Smoke

After deploying and promoting `https://sharik-platform-3cjhh722s-omarhussien2s-projects.vercel.app`, the public smoke URL `https://sharik-platform.vercel.app` returned:

| Check | Status | Non-sensitive result |
|---|---:|---|
| Account manager root | PASS | Redirected to `/portfolio`; 1 assigned Hadna client card. |
| Account manager `/clients` | PASS | Loaded `العملاء`; 1 Hadna client card; no access denied/session expired state. |
| Account manager Hadna page | PASS | Loaded `/clients/b0060000-0000-4000-8000-000000000301`; 4 operation cards. |
| Account manager Hadna deliverables | PASS | Loaded 52 deliverable cards. |
| Client viewer A `/client` | PASS | Loaded Hadna client portal. |
| Client viewer A `/client/commercial` | PASS | Loaded package summary with 58 article cards. |
| Viewer B root and client portal paths | PASS | Safe no-assigned-client state; 0 articles; no Hadna name or slug rendered. |
| RTL/lang | PASS | `dir=rtl`, `lang=ar-SA` across smoke pages. |

No screenshots, credentials, workbook row content, links, captions, tokens, or secret values were recorded.

### Hadna Visibility First Fix Smoke

After the owner reported seeing the Hadna client UUID and an unclear unavailable-resource state, a focused visibility pass was deployed and promoted to the public UAT smoke URL.

Root cause for the visible UUID in the product surface: the management product shell rendered unknown URL path segments as breadcrumb labels. UUID-like `clientId` and `contractId` segments now render as safe Arabic labels such as `العميل` and `العقد` instead of exposing raw IDs in the page chrome.

No hosted DB mutation was applied in this pass. Read-only hosted inspection still shows the Hadna linkage intact. The current hosted client display name remains `Hadna`; changing it to Arabic `هدنة` was not applied because this pass was constrained to visibility/linkage correction and the owner asked not to change hosted data unless needed for linkage.

| Check | Status | Non-sensitive result |
|---|---:|---|
| Vercel deploy | PASS | Built deployment `https://sharik-platform-gq8tjtxyj-omarhussien2s-projects.vercel.app`. |
| Vercel promote | PASS | `https://sharik-platform.vercel.app` points to the new deployment. |
| Account manager `/clients` | PASS | 1 client card; card title from DB is `Hadna`; no UUID visible in page text; no denial/session state. |
| Account manager Hadna detail | PASS | 4 operation cards; no UUID visible in page text; no denial/session state. |
| Account manager Hadna deliverables | PASS | 52 deliverable cards; no UUID visible in page text; no denial/session state. |
| Client viewer A `/client` | PASS | Client portal loaded for Hadna scope; no denial state. |
| Client viewer A `/client/commercial` | PASS | 58 safe summary article cards; no denial state. |
| Viewer B `/client` | PASS | Safe no-assigned-client state; 0 articles; no Hadna name or slug rendered. |
| Confusing copy removal | PASS | Removed `تجربة داخلية آمنة بدون بيانات عملاء حقيقية` from the management shell. |
| Client unavailable copy | PASS | Client-scoped management routes now show `لا يمكنك الوصول لهذا العميل`, `تأكد من اختيار عميل مسند لك.`, and `العودة للعملاء`. |

No screenshots were taken to avoid recording workbook-derived deliverable text. No credentials, tokens, workbook row content, links, captions, or secret values were recorded.

### Arabic UX UAT Fix Pass - 2026-07-03

After the visibility-first fix passed, the owner asked to continue the UAT polish. This pass stayed limited to the first Hadna UAT path and did not change workbook-derived deliverable content.

Hosted DB correction applied only to the R-006 Hadna client row:

| Check | Status | Non-sensitive result |
|---|---:|---|
| Hadna display name | PASS | `clients.name` changed from `Hadna` to `هدنة` for client `b0060000-0000-4000-8000-000000000301`. |
| Audit event | PASS | Added one `ClientUpdated` audit event for the Hadna display-name correction; scoped R-006 audit count is now 57. |
| Linkage preservation | PASS | Existing Hadna slug, client id, contract/package linkage, and 52 deliverables remained unchanged. |

UX changes applied:

| Surface | Status | Non-sensitive result |
|---|---:|---|
| `/clients` Hadna card | PASS | Card title renders `هدنة`; no slug or UUID is shown; buttons are `عرض العميل`, `المخرجات`, `العقد والباقة`, and `ملخص المتابعة`. |
| Hadna detail page | PASS | Page title renders `هدنة`; operation cards use `المخرجات`, `العقد والباقة`, `ملخص المتابعة`, and `لوحة المتابعة`. |
| Management navigation/breadcrumbs | PASS | Replaced technical labels such as `الملخص التجاري`, `لوحة Kanban`, and `المحفظة` on the touched path with `ملخص المتابعة` and `لوحة المتابعة`. |
| Hadna deliverables page | PASS | Link to the board renders as `لوحة المتابعة`; page still renders 52 deliverables. |

Deployment and smoke:

| Check | Status | Non-sensitive result |
|---|---:|---|
| Vercel deploy | PASS | Built deployment `https://sharik-platform-785s4i5xd-omarhussien2s-projects.vercel.app`. |
| Vercel promote | PASS | `https://sharik-platform.vercel.app` fetches the promoted deployment and reports `Ready`. |
| Account manager `/clients` | PASS | 1 card; Hadna renders as `هدنة`; no UUID, Latin `Hadna`, or denial text; card buttons match the requested four labels. |
| Account manager Hadna detail | PASS | 4 operation cards; `هدنة` visible; no UUID; required Arabic labels visible. |
| Account manager Hadna deliverables | PASS | 52 deliverable cards; `هدنة` visible; no UUID rendered. |
| Client viewer A `/client` | PASS | Hadna client portal loads and shows `هدنة`; no denial state. |
| Client viewer A `/client/commercial` | PASS | Client package summary loads with 58 safe summary article cards. |
| Viewer B `/client` | PASS | 0 article cards; no `هدنة` or `Hadna` rendered. |

No screenshots were taken to avoid recording workbook-derived deliverable text. No credentials, tokens, workbook row content, links, captions, or secret values were recorded.

### Three-Role UAT Navigation Polish - 2026-07-03

After the Arabic UX pass, the owner confirmed the next test should cover the three visible UAT views: client, account manager, and Samawah management/project administration. This polish pass kept the existing role and data model intact and only made the first navigation step clearer.

| Surface | Status | Non-sensitive result |
|---|---:|---|
| Account-manager/team portfolio | PASS | Assigned-client cards now link to `عرض العميل`, `المخرجات`, and `ملخص المتابعة` so the user can reach the Hadna scope without guessing from `/portfolio`. |
| Client portal home | PASS | Client home now includes a primary `عرض ملخص المتابعة` action and a `المخرجات والمتابعة` section. |
| Permission scope | PASS | No permission broadening, hosted DB mutation, credential generation, or workbook-content disclosure was performed. |
| Component coverage | PASS | Targeted client-home and assigned-client component tests passed, and full component suite passed. |

Deployment and public-route check:

| Check | Status | Non-sensitive result |
|---|---:|---|
| Vercel deploy | PASS | Built deployment `https://sharik-platform-16z047sh3-omarhussien2s-projects.vercel.app`. |
| Vercel promote | PASS | Promoted the deployment for temporary UAT smoke. |
| Public alias unauthenticated check | PASS | `https://sharik-platform.vercel.app` redirects unauthenticated visitors to `/sign-in`. |
| Direct deployment access check | BLOCKED BY SSO | The direct deployment URL redirects to Vercel SSO before authentication. |

Authenticated three-role smoke was not repeated in-chat because UAT credentials remain out-of-band and must not be recorded in GitHub/docs/logs/chat/screenshots.

### Supabase Data Smoke

| Check | Status | Non-sensitive result |
|---|---:|---|
| Tenant admin auth | PASS | Login succeeded. |
| Tenant admin scoped rows | PASS | 1 client, 1 package, 52 deliverables. |
| Client viewer A auth | PASS | Login succeeded. |
| Client viewer A scoped rows | PASS | 1 client, 1 package, 52 deliverables. |
| Client viewer B auth | PASS | Login succeeded. |
| Client viewer B isolation | PASS | 0 visible clients. |

## Vercel Evidence

| Command/action | Status | Notes |
|---|---:|---|
| `vercel deploy --target=production --skip-domain --yes` | PASS | Build completed and produced deployment `https://sharik-platform-75fkv7kjc-omarhussien2s-projects.vercel.app`. |
| Direct deployment access check | BLOCKED BY SSO | The deployment URL redirected to Vercel SSO before promotion. |
| `vercel promote ... --scope omarhussien2s-projects` | PASS | Promoted the deployment for temporary UAT smoke. |
| Public alias check | PASS | `https://sharik-platform.vercel.app` returned the current deployment and was used for smoke. |
| Access fix deploy | PASS | Build completed and produced deployment `https://sharik-platform-3cjhh722s-omarhussien2s-projects.vercel.app`. |
| Access fix promote | PASS | Public smoke URL was promoted to the access-fix deployment. |
| Hadna visibility deploy | PASS | Build completed and produced deployment `https://sharik-platform-gq8tjtxyj-omarhussien2s-projects.vercel.app`. |
| Hadna visibility promote | PASS | Public smoke URL was promoted to the visibility-fix deployment. |
| Arabic UX UAT deploy | PASS | Build completed and produced deployment `https://sharik-platform-785s4i5xd-omarhussien2s-projects.vercel.app`. |
| Arabic UX UAT promote | PASS | Public smoke URL was promoted to the Arabic UX UAT deployment. |
| Three-role navigation polish deploy | PASS | Build completed and produced deployment `https://sharik-platform-16z047sh3-omarhussien2s-projects.vercel.app`. |
| Three-role navigation polish promote | PASS | Public smoke URL was promoted to the navigation-polish deployment. |
| MVP Productization deploy | PASS | Build completed and aliased deployment `https://sharik-platform-ao0fjvrwn-omarhussien2s-projects.vercel.app` to `https://sharik-platform.vercel.app`. |

## Remaining Risks

| Risk | Status |
|---|---|
| Vercel target uses Production environment/alias for temporary UAT. | Accepted by owner for UAT only; not Production acceptance. |
| UAT target had previous non-R-006 data before insertion. | Accepted by owner; no cleanup/deletion performed. |
| Public signup disabled status was not safely confirmed through a read-only Supabase surface. | Open. No signup attempt was made. |
| Credentials require out-of-band handoff. | Open. Credentials were created only for internal smoke and not printed. |
| Hosted client display name is currently `Hadna`, not Arabic `هدنة`. | Resolved. Corrected to `هدنة` for the scoped Hadna UAT client only, with a `ClientUpdated` audit event. |
| R-006 PR merge control | PR #33, PR #34, and PR #35 were merged only after their respective owner gates. No further merge or Production acceptance is implied. |

## AGENTS Compliance

| Gate | Status |
|---|---:|
| Spec/plan/tasks existed before hosted execution | PASS |
| V1 scope respected | PASS |
| Tenant/client scoped queries and policies used | PASS |
| Client isolation verified | PASS |
| Internal-sensitive workbook content kept out of docs/logs/chat | PASS |
| Audit events inserted for hosted import and Hadna display correction | PASS |
| No unrelated UAT deletion | PASS |
| No PR merge | PASS |
