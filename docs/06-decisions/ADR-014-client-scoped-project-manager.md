# ADR-014: Client-scoped project manager capability completion

## Status
Accepted — owner-authorized Spec015 TP21-2, 2026-09-21.

## Context
The database operational workflow recognizes project_manager, but the application permission catalog throws for that role, and foundational client/commercial reads and invitations omit it. The team pilot needs consistent scoped authority.

## Decision
An active tenant membership may carry project_manager assignments for explicit clients. The role reads those clients, contracts and package ledger; creates and cancels ordinary deliverables; executes statuses, versions, task assignment, internal review/approval, send, delivery and SLA summaries through existing audited commands.

It cannot discover all clients, create clients, configure contracts/packages, adjust commitments, create approved extras, act as the client approver, or administer members/invitations. Existing tenant administrators/owners can invite or assign it. New PM assignment changes require client scope; historical tenant assignments are not rewritten. Unknown application role keys fail closed.

Apply one forward migration to existing policies, invitation constraint/RPCs, member assignment validation, profile visibility and ordinary-create authority. Preserve function grants, audit, idempotency, workflow transitions, SLA and other role behavior. No new technology or tenancy model. Marketing-manager completion is out of scope.

## Alternatives considered
- Tenant administrator grants expose unrelated clients and user administration: rejected.
- Database-only support leaves application/login guards inconsistent: rejected.
- Rewriting applied migrations loses deployed history: rejected.

## Consequences
PM sees work in its assigned clients without task ownership. Contract read does not confer commercial write authority. Existing historic tenant-scoped PM rows retain prior database behavior until separately reviewed; the pilot provisions client scope only.

## Rollback plan
Disable the pilot PM membership and withdraw Preview access if a gate fails. Preserve audit/ledger history. Correct schema only through another reviewed forward migration. Authenticated PostgreSQL and exact-source CI remain required before hosted application.
