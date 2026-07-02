# R-006 Execution Boundary Contract

Date: 2026-07-02

## Owner Decision

| Field | Value |
|---|---|
| Decision | GO for non-production internal online trial only |
| Production Supabase | Forbidden |
| Vercel production deployment/alias | Forbidden |
| Real client data | Forbidden |
| Public signup | Forbidden |
| Synthetic emails | `@r006.example.test` only |
| Credential storage | Outside GitHub/docs/logs/screenshots only |

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
| Target class | Confirmed non-production | BLOCKED |
| Candidate target | `sharik-uat` / `jnvuccapgsabrwwkxnbh` | PASS as metadata only |
| Production Supabase | Not used | PASS |
| Real users | 0 or approved synthetic R-006 only | BLOCKED |
| Real clients | 0 | BLOCKED |
| Non-approved fixture data | 0 | BLOCKED |
| Public signup | Disabled | BLOCKED |
| Hosted migration/seed | Not run until preflight + owner confirmation | PASS |
| Temporary credentials | Not generated until preflight passes | PASS |

Mutation rule:

```text
Supabase mutation_allowed = false until all Supabase checks pass and owner confirms the exact target.
```

## Vercel Boundary

| Check | Required | Current Status |
|---|---|---:|
| Target class | Preview/staging only | BLOCKED |
| Linked project | `sharik-platform` | PASS as metadata only |
| Preview/staging env vars | Present and scoped to Preview/Staging | BLOCKED |
| Production env/deployments | Not used for R-006 | PASS |
| `vercel --prod` | Not run | PASS |
| Production alias | Not created or used | PASS |
| Trial URL | Preview/staging URL only | BLOCKED |

Deployment rule:

```text
No Vercel deployment may run for R-006 until preview/staging env vars are configured and Supabase target preflight passes.
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
- Vercel production deployment, alias, or promotion.
- Real client data.
- Public signup.
- Hosted seed or migration before preflight and owner confirmation.
- Product feature expansion.
- Files, comments, approvals, drag/drop, AI, social scheduling, billing.
