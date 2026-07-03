# R-006 Internal Online Trial Execution

## Status

EXECUTED FOR OWNER-AUTHORIZED INTERNAL UAT.

This run used the owner-authorized Hadna workbook, `sharik-uat` Supabase UAT, and Vercel as temporary internal UAT hosting. This is not Production acceptance, not PR merge approval, and not approval to use non-Hadna customer data.

## Targets

| Area | Value |
|---|---|
| Branch | `codex/r006-internal-online-trial-execution` |
| PR | `#33` |
| Supabase project | `sharik-uat` |
| Supabase ref | `jnvuccapgsabrwwkxnbh` |
| Vercel deployment URL | `https://sharik-platform-785s4i5xd-omarhussien2s-projects.vercel.app` |
| Smoke URL | `https://sharik-platform.vercel.app` |

The direct deployment URL was protected by Vercel SSO. The public project alias was promoted to the same deployment for temporary UAT smoke testing.

## Hadna Data Created

The 52-row forward Hadna block was imported without recording workbook row content, captions, links, or sensitive approval notes.

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

The audit count includes one later `ClientUpdated` event for the Hadna Arabic display-name correction.

No existing UAT data was deleted.

## Implementation Notes

- Added scoped RLS read policies for client-portal commercial data.
- Added a database test proving client users need both active client membership and active client-scoped role assignment.
- Applied hosted migrations to UAT, including the new F006 commercial read policy migration.
- Generated credentials only for internal smoke use; credentials are not stored in GitHub/docs/logs/chat/screenshots.

## Access Fix Pass - 2026-07-02

Owner-reported account-manager safe-denial behavior was traced to the `/clients` route guard, not missing Hadna data scope:

| Check | Status | Result |
|---|---:|---|
| Account manager linked to Hadna | PASS | Active `account_manager` role scoped to Hadna client `b0060000-0000-4000-8000-000000000301`. |
| Client viewer A linked to Hadna | PASS | Active client membership plus active `client_viewer` role scoped to Hadna. |
| Viewer B isolation | PASS | No active Hadna client membership; safe no-assigned-client state and no Hadna data rendered. |
| Hadna linkage | PASS | 1 contract, 1 package, 5 package lines, and 52 deliverables linked in the Hadna tenant/client scope. |

Fix applied: `/clients` now allows non-client internal users with at least one assigned client-scoped `CLIENT_VIEW`, while client-portal-only users remain out of the management clients index.

No hosted DB correction was needed or applied in this pass. No unrelated client data was changed and no rows were deleted.

## Hadna Visibility First Fix - 2026-07-02

Focused fix after owner UAT feedback:

- Hid UUID-like client/contract route segments from management breadcrumbs.
- Replaced client-unavailable states on client-scoped management routes with: `لا يمكنك الوصول لهذا العميل`, `تأكد من اختيار عميل مسند لك.`, and `العودة للعملاء`.
- Removed the no-longer-true shell phrase `تجربة داخلية آمنة بدون بيانات عملاء حقيقية`.
- Deployed `https://sharik-platform-gq8tjtxyj-omarhussien2s-projects.vercel.app` and promoted `https://sharik-platform.vercel.app`.
- No hosted DB mutation was applied. Current hosted client display name remains `Hadna`; Arabic rename to `هدنة` remains open because this pass avoided hosted data changes unless needed for linkage.

## Arabic UX UAT Fix Pass - 2026-07-03

Follow-up pass after the owner asked to continue the UAT polish:

- Corrected the scoped Hadna hosted client display name from `Hadna` to `هدنة`.
- Added one `ClientUpdated` audit event for the display-name correction; R-006 audit count is now 57.
- Kept the Hadna client id, slug, contract/package linkage, and 52 deliverables unchanged.
- `/clients` now shows a simple Hadna card without slug/UUID, with buttons: `عرض العميل`, `المخرجات`, `العقد والباقة`, `ملخص المتابعة`.
- Hadna detail and touched breadcrumbs now use `العقد والباقة`, `ملخص المتابعة`, and `لوحة المتابعة` instead of technical wording.
- Deployed `https://sharik-platform-785s4i5xd-omarhussien2s-projects.vercel.app` and promoted `https://sharik-platform.vercel.app`.

## Three-Role UAT Navigation Polish - 2026-07-03

Follow-up pass to make the first UAT step clearer for the three tested views:

- Account manager / team portfolio cards now include direct actions: `عرض العميل`, `المخرجات`, and `ملخص المتابعة`.
- Client portal home now includes a primary `عرض ملخص المتابعة` action and a simple `المخرجات والمتابعة` card, so the client can move from the home page to the package/deliverables summary without guessing.
- No hosted DB mutation, credential generation, workbook row disclosure, or permission broadening was performed.
- Deployed `https://sharik-platform-16z047sh3-omarhussien2s-projects.vercel.app` and promoted `https://sharik-platform.vercel.app`.
- Public alias unauthenticated check redirects to `/sign-in`; authenticated account checks still require the out-of-band UAT credentials.

## Smoke Results

| Check | Status | Result |
|---|---:|---|
| Tenant admin login | PASS | Management route loaded. |
| Management client/package/deliverables visible | PASS | Groups `[3, 1, 5, 52]`. |
| Account manager `/clients` access | PASS | Loaded 1 Hadna client card on the public UAT URL. |
| Account manager Hadna deliverables | PASS | Loaded 52 deliverable cards. |
| Account manager UUID visibility | PASS | `/clients`, Hadna detail, and Hadna deliverables did not render the Hadna UUID in page text. |
| Arabic Hadna card | PASS | `/clients` renders `هدنة`, not `Hadna`, and shows the requested four buttons. |
| Arabic Hadna detail | PASS | Hadna detail renders `هدنة` with `المخرجات`, `العقد والباقة`, `ملخص المتابعة`, and `لوحة المتابعة`. |
| Client viewer A login | PASS | Client commercial route loaded. |
| Client viewer A package/deliverables visible | PASS | Groups `[1, 5, 52]`. |
| Client viewer B login | PASS | Client portal route loaded. |
| Basic client isolation | PASS | Viewer B saw safe no-assigned-client state, zero data articles, and no Hadna name/slug. |
| RTL | PASS | `dir=rtl`, `lang=ar-SA`. |
| Mobile quick check | PASS | 390px viewport, no horizontal overflow, visible groups retained. |
| Supabase API/RLS smoke | PASS | Admin and viewer A saw scoped Hadna rows; viewer B saw zero clients. |

No screenshots were taken.

## Required Checks

| Check | Status |
|---|---:|
| `npm run secret:scan` | PASS |
| `git diff --check` | PASS with CRLF working-copy warnings only |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS, 24 files / 83 tests |
| `npm run test:component` | PASS, 15 files / 48 tests |
| Targeted component tests | PASS, client home and assigned-client action links |
| `npm run build` | PASS |

## Remaining Risks

- Vercel Production target/alias was used as temporary internal UAT hosting per owner authorization; this is not Production acceptance.
- `sharik-uat` had previous non-R-006 data; owner accepted this for internal UAT and no cleanup was performed.
- Supabase public signup disabled status still lacks a safe read-only confirmation.
- Credential handoff remains out-of-band.
- PR #33 must remain unmerged until separately authorized.

## Evidence

Detailed evidence is recorded in:

```text
specs/008-r006-internal-online-trial-execution/evidence/verification.md
```
