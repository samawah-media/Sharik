# Persistent data model

| Entity | Scope | Integrity rule |
|---|---|---|
| `deliverable_versions` | tenant/client/deliverable | unique version number; same-scope composite FK |
| `approval_decisions` | tenant/client/deliverable/version | append-only; decision binds exact version |
| `comments` | tenant/client/deliverable/version | internal visibility denied to client roles |
| `file_assets` | tenant/client/deliverable/version | internal/client/final visibility policy |
| `sla_timeline_segments` | tenant/client/deliverable | append-only segment history; wait excluded |
| `mvp_command_requests` | tenant/client/deliverable | tenant-scoped idempotency key |

All records are protected by RLS. Cross-tenant and cross-client relationships are rejected by composite foreign keys.
