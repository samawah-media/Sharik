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
| Vercel deployment URL | `https://sharik-platform-75fkv7kjc-omarhussien2s-projects.vercel.app` |
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
| audit_events | 56 |

No existing UAT data was deleted.

## Implementation Notes

- Added scoped RLS read policies for client-portal commercial data.
- Added a database test proving client users need both active client membership and active client-scoped role assignment.
- Applied hosted migrations to UAT, including the new F006 commercial read policy migration.
- Generated credentials only for internal smoke use; credentials are not stored in GitHub/docs/logs/chat/screenshots.

## Smoke Results

| Check | Status | Result |
|---|---:|---|
| Tenant admin login | PASS | Management route loaded. |
| Management client/package/deliverables visible | PASS | Groups `[3, 1, 5, 52]`. |
| Client viewer A login | PASS | Client commercial route loaded. |
| Client viewer A package/deliverables visible | PASS | Groups `[1, 5, 52]`. |
| Client viewer B login | PASS | Client portal route loaded. |
| Basic client isolation | PASS | Viewer B saw safe state and zero data articles. |
| RTL | PASS | `dir=rtl`, `lang=ar-SA`. |
| Mobile quick check | PASS | 390px viewport, no horizontal overflow, visible groups retained. |
| Supabase API/RLS smoke | PASS | Admin and viewer A saw scoped Hadna rows; viewer B saw zero clients. |

No screenshots were taken.

## Required Checks

| Check | Status |
|---|---:|
| `npm run secret:scan` | PASS |
| `git diff --check` | PASS with CRLF working-copy warnings only |

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
