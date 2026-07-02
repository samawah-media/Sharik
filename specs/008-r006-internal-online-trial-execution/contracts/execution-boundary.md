# R-006 Execution Boundary Contract

Date: 2026-07-02

## Owner Decision

| Field | Value |
|---|---|
| Decision | GO for non-production internal online trial only |
| Supabase UAT update | `sharik-uat` / `jnvuccapgsabrwwkxnbh` is owner-authorized as the internal R-006 trial target despite existing users/data. |
| Production Supabase | Forbidden |
| Vercel deployment update | Owner-authorized for internal testing only; it is not Production acceptance. |
| Real client data | Unauthorized real client data remains forbidden; the named source workbook is owner-authorized internal trial input only. |
| Public signup | Forbidden |
| Synthetic emails | `@r006.example.test` only |
| Credential storage | Outside GitHub/docs/logs/screenshots only |
| Source workbook content | Do not print sensitive row content in GitHub, docs, comments, screenshots, logs, or chat. |

## Baseline Contract

| Field | Required Value | Observed |
|---|---|---|
| Source baseline | `origin/main` | PASS |
| Baseline commit | `10fc4a3b4c8f717d284d177906d1f32f5f61976c` | PASS |
| Execution branch | `codex/r006-internal-online-trial-execution` | PASS |
| Readiness docs reviewed | R-006 release doc and Spec Kit package | PASS |

## Supabase Boundary

| Check | Required | Current Status |
|---|---|---:|
| Target class | Owner-authorized internal UAT | PASS |
| Candidate target | `sharik-uat` / `jnvuccapgsabrwwkxnbh` | PASS by owner decision |
| Production Supabase | Not used | PASS |
| Existing users/data | Accepted for internal trial only | OWNER_AUTHORIZED |
| Public signup | Disabled | BLOCKED |
| Hosted migration/seed | Not run until mapping plan is reviewed and exact insertion path is confirmed | PASS |
| Temporary credentials | Not generated until the exact hosted execution step is confirmed | PASS |

Mutation rule:

```text
Supabase mutation_allowed = false until the workbook-to-Sharik mapping is reviewed and a
minimum-scope hosted insertion/seed plan is explicitly approved.
```

## Vercel Boundary

| Check | Required | Current Status |
|---|---|---:|
| Target class | Internal testing deployment only; not Production acceptance | OWNER_AUTHORIZED |
| Linked project | `sharik-platform` | PASS as metadata only |
| Preview/staging env vars | Present and scoped to Preview/Staging | BLOCKED |
| Production acceptance | Not allowed | PASS |
| `vercel --prod` | Not run | PASS |
| Production alias | Not created or promoted for acceptance | PASS |
| Trial URL | Preview/staging URL only | BLOCKED |

Deployment rule:

```text
No Vercel deployment may run in this step. A later deploy must be internal-test only,
must not be treated as Production acceptance, and must avoid secret/client-content
exposure in logs, screenshots, comments, or docs.
```

## Credential Boundary

Allowed:

- Generate temporary credentials only after confirmed non-production targets pass preflight.
- Deliver credentials through an owner-approved secure channel outside GitHub/docs/logs/screenshots.

Forbidden:

```text
temporary password
password hash
database password
access token
service-role key
magic link
reset link
credential screenshot
credential in PR/comment/docs/logs
```

## Smoke Checklist Contract

| ID | Area | Required Result | Current Status |
|---|---|---|---:|
| R006-SMOKE-001 | Sign-in | Internal synthetic user can sign in | BLOCKED |
| R006-SMOKE-002 | Product shell | RTL shell loads on preview/staging | BLOCKED |
| R006-SMOKE-003 | Clients | Management client list loads scoped data | BLOCKED |
| R006-SMOKE-004 | Client detail | Client detail loads scoped data | BLOCKED |
| R006-SMOKE-005 | Contracts | Contract list/detail path loads | BLOCKED |
| R006-SMOKE-006 | Packages | Package path loads | BLOCKED |
| R006-SMOKE-007 | Deliverables list | Deliverables list loads | BLOCKED |
| R006-SMOKE-008 | Kanban board | Internal Kanban loads for authorized internal role | BLOCKED |
| R006-SMOKE-009 | Status transition | Allowed transition succeeds; denied transition fails safely | BLOCKED |
| R006-SMOKE-010 | Audit evidence | Status transition has audit evidence | BLOCKED |
| R006-SMOKE-011 | SLA display | SLA indicators display current status | BLOCKED |
| R006-SMOKE-012 | Tenant/client isolation | Cross-client data is not visible | BLOCKED |
| R006-SMOKE-013 | Client viewer denial | Client viewer cannot access internal Kanban | BLOCKED |
| R006-SMOKE-014 | RTL | Arabic RTL layout remains coherent | BLOCKED |
| R006-SMOKE-015 | Mobile | Mobile viewport remains usable | BLOCKED |

## Out Of Scope

- Production Supabase.
- Vercel Production acceptance, merge, or promotion.
- Unauthorized real client data.
- Public signup.
- Printing sensitive workbook row content in GitHub/docs/comments/screenshots/logs/chat.
- Hosted seed or insertion before mapping review and exact owner approval.
- Product feature expansion.
- Files, comments, approvals, drag/drop, AI, social scheduling, billing.
