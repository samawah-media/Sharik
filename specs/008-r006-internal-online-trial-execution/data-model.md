# Data Model: R-006 Internal Online Trial Execution

R-006 execution introduces no application data model, no migration, and no seed in this step. The entities below describe execution records, planned synthetic accounts, and the owner-authorized internal source workbook mapping boundary.

## Execution Target

| Field | Description |
|---|---|
| `service` | `supabase` or `vercel`. |
| `name` | Non-secret project name or candidate name. |
| `ref_or_project` | Non-secret project ref/name where applicable. |
| `environment_class` | `candidate_non_production`, `owner_authorized_internal_uat`, `confirmed_non_production`, `production`, or `blocked`. |
| `preflight_status` | `PASS`, `BLOCKED`, `FAIL`, or `NOT_RUN`. |
| `mutation_allowed` | `true` only after mapping review and exact minimum-scope hosted insertion approval. |

Current records:

| Service | Name | Ref/Project | Environment Class | Preflight Status | Mutation Allowed |
|---|---|---|---|---:|---:|
| Supabase | `sharik-uat` | `jnvuccapgsabrwwkxnbh` | `owner_authorized_internal_uat` | PASS for target selection; insertion NOT_RUN | false |
| Vercel | `sharik-platform` | linked project | `owner_authorized_internal_test` | deployment NOT_RUN | false |

## Source Workbook Mapping Boundary

Owner-authorized source: the local workbook named `خطة محتوى هدنة - العدد الثاني (1)` may be used as internal R-006 trial input only.

Sensitive-content rules:

- Do not print workbook row content, captions, design text, links, client details, or approval notes in GitHub, docs, comments, screenshots, logs, or chat.
- Store only structural evidence: sheet counts, row counts, date ranges, source column names, and mapping rules.
- Treat the workbook as an internal source, not Production acceptance data.

Observed structure, without row content:

| Workbook area | Convertible rows | Date range | Suggested use |
|---|---:|---|---|
| Sheet index 3 | 20 | 2026-02-12 to 2026-03-08, plus one undated row | Historical/reference block; use only if a status-spread sample is needed. |
| Sheet index 8 | 40 | 2026-03-16 to 2026-07-24, plus undated rows | Current/near-term block; can provide mixed status examples. |
| Sheet index 9 | 52 | 2026-07-25 to 2026-09-29, plus undated rows | Forward plan block; best candidate for a clean package/deliverable trial import. |

Source columns reviewed as structural headers only:

| Source column | Sharik target |
|---|---|
| `المرحلة` | Deliverable `description` context or optional source metadata in import notes. |
| `اليوم` | Deliverable `client_due_date` / `final_due_date`; derive `internal_due_date` before it. |
| `المنصة/القناة` | Deliverable `description` context; optional package-line grouping if needed. |
| `قالب المحتوى` | Deliverable `type`; package-line `deliverable_type_hint`. |
| `وصف المحتوى` | Deliverable `name` source, with sensitive text kept out of docs/logs. |
| `الهدف الرئيسي` | Deliverable `description` context, redacted from evidence. |
| `كاتب المحتوى` | Owner/contributor lookup only if it matches an existing internal user; otherwise leave owner empty. |
| `المحتوى النصي للتصميم` / `الكابشن` | Do not import into public docs; optionally summarize internally in deliverable `description` only after privacy review. |
| `تعميد المحتوى` / `تعميد التصميم` / `تم الجدولة` / `تم النشر` | Initial status derivation only; no approval decision is created without an audited hosted action. |
| Links/reference/result columns | Exclude from R-006 initial insertion unless a separate file/link permission plan is approved. |

## Preflight Check

| Field | Description |
|---|---|
| `id` | Stable check identifier. |
| `target` | Related execution target. |
| `check` | What was checked. |
| `expected` | Required result. |
| `actual` | Non-secret observed result. |
| `status` | `PASS`, `BLOCKED`, `FAIL`, or `NOT_RUN`. |

Validation rules:

- The previous non-clean target preflight is accepted by owner decision for internal trial only; it does not authorize broad mutation.
- Any hosted insertion must use tenant/client scope, audited write paths, idempotency keys, and the smallest selected row subset.
- Preflight evidence must not include row values, real names, emails, keys, tokens, passwords, or hashes.

## Synthetic Trial Account Roster

| Persona | Email | Role Intent | Credential Status |
|---|---|---|---|
| Tenant admin | `tenant-admin@r006.example.test` | Internal tenant/admin smoke checks | Not generated |
| Account manager | `account-manager@r006.example.test` | Scoped internal management smoke checks | Not generated |
| Client viewer A | `client-viewer-a@r006.example.test` | Client portal and denied Kanban access smoke checks | Not generated |
| Client viewer B | `client-viewer-b@r006.example.test` | Tenant/client isolation negative checks | Not generated |

Validation rules:

- All emails must use `@r006.example.test`.
- No password values, password hashes, reset links, magic links, tokens, or service-role keys may be documented.
- Credentials can be generated only after Supabase and Vercel targets pass preflight.

## Smoke Check Result

| Field | Description |
|---|---|
| `area` | Sign-in, shell, clients, client detail, contracts, packages, deliverables, Kanban, audit, SLA, isolation, denial, RTL, or mobile. |
| `status` | `PASS`, `FAIL`, `BLOCKED`, or `NOT_RUN`. |
| `evidence` | Non-secret proof, such as HTTP status or assertion summary. |

Current status: all smoke checks are `BLOCKED` because no deployment URL, insertion plan approval, and temporary credentials exist.

## Execution Blocker

| Blocker | Impact |
|---|---|
| Workbook mapping has not been approved for hosted insertion | No hosted mutation, seed, account creation, or credential generation. |
| Vercel deployment has owner authorization only for internal testing | No Production acceptance, merge, or promotion. |
| `.env.local` is labeled production | It must not be used for R-006 execution. |
