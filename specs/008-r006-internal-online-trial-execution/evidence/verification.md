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

## Targets

| Target | Value |
|---|---|
| Execution branch | `codex/r006-internal-online-trial-execution` |
| PR | `#33` |
| Supabase project | `sharik-uat` |
| Supabase ref | `jnvuccapgsabrwwkxnbh` |
| Vercel project | `sharik-platform` |
| Vercel deployment URL | `https://sharik-platform-3cjhh722s-omarhussien2s-projects.vercel.app` |
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
| audit_events | 56 |

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

## Remaining Risks

| Risk | Status |
|---|---|
| Vercel target uses Production environment/alias for temporary UAT. | Accepted by owner for UAT only; not Production acceptance. |
| UAT target had previous non-R-006 data before insertion. | Accepted by owner; no cleanup/deletion performed. |
| Public signup disabled status was not safely confirmed through a read-only Supabase surface. | Open. No signup attempt was made. |
| Credentials require out-of-band handoff. | Open. Credentials were created only for internal smoke and not printed. |
| PR #33 remains Draft and must not be merged without separate authorization. | Open. |

## AGENTS Compliance

| Gate | Status |
|---|---:|
| Spec/plan/tasks existed before hosted execution | PASS |
| V1 scope respected | PASS |
| Tenant/client scoped queries and policies used | PASS |
| Client isolation verified | PASS |
| Internal-sensitive workbook content kept out of docs/logs/chat | PASS |
| Audit events inserted for hosted import | PASS |
| No unrelated UAT deletion | PASS |
| No PR merge | PASS |
