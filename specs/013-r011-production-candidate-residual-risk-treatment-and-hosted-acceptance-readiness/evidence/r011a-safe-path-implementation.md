# R-011A Safe Path Implementation Evidence

Date: 2026-07-09

## Status

Safe local R-011A UAT gap setup paths were implemented and tested.

This evidence records local code paths only. It does not grant hosted execution, hosted mutation, hosted file operations, deploy/promotion, non-Hadna data use, or Production acceptance.

## Files Added

| File | Purpose |
|---|---|
| `src/modules/release/r011a-gap-setup-plan.ts` | Domain/service layer for owner approval, Hadna scope, category count, operation, and boundary validation. |
| `src/modules/release/r011a-gap-setup-repository.ts` | Injected local setup repository contract and in-memory test implementation. |
| `src/server/commands/release/r011a-gap-setup.ts` | Server-side command for management-only dry-run, local apply, denial audit, idempotency, and rollback/no-op summary. |
| `src/server/commands/release/r011a-hosted-gap-setup-readiness.ts` | Hosted-readiness wrapper for explicit `hosted_dry_run` no-op rehearsal and blocked `apply_hosted` gating. |
| `tests/unit/release/r011a-gap-setup-plan.test.ts` | Unit coverage for plan validation and denial rules. |
| `tests/unit/authorization/r011a-gap-setup-authorization.test.ts` | Authorization coverage for management-only execution and scope denials. |
| `tests/integration/release/r011a-gap-setup-command.test.ts` | Integration coverage for dry-run, apply, idempotency, rollback summary, unsafe operations, and audit rollback. |
| `tests/integration/release/r011a-hosted-gap-setup-readiness.test.ts` | Integration coverage for hosted dry-run approval, hosted apply denial, Hadna/count/file denials, value-free summaries, and rollback no-op before apply. |

## Safety Properties

| Requirement | Implementation evidence |
|---|---|
| Tenant/client scoped | Command uses actor tenant and approved Hadna client scope; unrelated client and tenant mismatch are denied. |
| Management/admin only | Command requires active tenant-level `tenant_owner` or `tenant_administrator`; client users and client-scoped internal users are denied. |
| Hadna-only | Planner denies non-Hadna or unapproved scope. |
| Idempotent | Existing idempotency/category records become no-op results; duplicate category creation is prevented. |
| Audit events | Denials, previews, local applies, category preparations, and rollback summaries append audit events. |
| Dry-run preview | `dry_run` returns category counts and would-create/no-op statuses without setup records. |
| Rollback/no-op summary | `rollback_summary` returns category-level rollback/no-op status without mutation. |
| Unsafe file operation denial | File open/download/upload/delete operations are denied before setup. |
| Hosted mutation boundary | Hosted mutation and Production acceptance requests are denied in this pass. |
| Hosted dry-run readiness | `hosted_dry_run` requires a no-op approval category and returns category/count-only evidence. |
| Hosted apply boundary | `apply_hosted` is denied without explicit apply approval and remains blocked because no hosted executor is configured. |

## Tests Added

| Test area | Coverage |
|---|---|
| Unit plan validation | Approved path, non-Hadna denial, unrelated client denial, over-count denial, missing approval denial, unsafe file/hosted mutation denial. |
| Authorization | Tenant admin allowed; account manager denied; client viewer denied; unrelated client denied; missing approval denied. |
| Integration command behavior | Dry-run audit with no records, local apply, idempotent retry, rollback summary, unsafe hosted/file denial, audit failure rollback. |
| Hosted readiness command | Hosted dry-run allowed with no-op approval category; hosted apply denied without explicit apply approval; non-Hadna, over-count, and unsafe file operations denied; evidence summary contains no tenant/client/user values. |

## Hosted Boundary

The implementation is intentionally local/injected. A later hosted Stage 2 execution still needs a separately approved run window, safe persistence/execution wiring, and value-free evidence collection.

The hosted-readiness wrapper is also local/injected in this pass. It prepares a no-op hosted dry-run rehearsal surface, but it does not open hosted routes, read hosted data, configure hosted persistence, or apply hosted mutation.

The following remain forbidden in this pass:

- Hosted mutation.
- Hosted DB read query.
- Hosted route check.
- Real hosted account creation.
- Hosted file upload, download, open, delete, replace, content access, or broad visibility repair.
- Deploy or promotion.
- Non-Hadna data.
- Production acceptance.
