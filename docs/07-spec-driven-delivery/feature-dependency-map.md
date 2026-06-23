# Feature Dependency Map

## Mermaid Graph

```mermaid
flowchart TD
  F001["F-001 Secure Tenant and Client Onboarding"] --> F002["F-002 Role-Scoped Navigation"]
  F001 --> F003["F-003 Contract and Package Setup"]
  F003 --> F004["F-004 Package Ledger Reservation"]
  F003 --> F005["F-005 Deliverable Creation"]
  F005 --> F006["F-006 Deliverable Templates"]
  F005 --> F007["F-007 Team Task Assignment"]
  F007 --> F008["F-008 Internal Kanban"]
  F005 --> F009["F-009 Internal Comments"]
  F005 --> F010["F-010 Files and Versions"]
  F010 --> F011["F-011 Internal Review"]
  F011 --> F012["F-012 Internal Approval"]
  F012 --> F013["F-013 Client Submission"]
  F013 --> F014["F-014 Client Review and Approval"]
  F005 --> F015["F-015 SLA Timeline Tracking"]
  F013 --> F015
  F014 --> F015
  F014 --> F016["F-016 Delivery and Consumption"]
  F015 --> F016
  F016 --> F017["F-017 Client Portal Summary"]
  F015 --> F018["F-018 Management Monitoring"]
  F013 --> F019["F-019 Notifications and Action Center"]
  F001 --> F020["F-020 Audit Viewer"]
  F016 --> F021["F-021 Reopen/Correction Cycle"]
  F001 --> F022["F-022 Pilot Hardening"]
  F016 --> F022
```

## Dependency Classes

- Technical foundation: F-001, F-002, F-020.
- Hard dependencies: F-003 before F-005; F-012 before F-013; F-013 before F-014; F-014 before F-016.
- Security dependencies: all client-visible features depend on F-001 authorization model and visibility rules.
- Business dependencies: package ledger depends on contracts/packages and affects deliverable delivery.
- UX dependencies: client portal summary depends on client approval/delivery read models.
- Optional dependencies: notifications can begin in-app only before email hardening.

## Analysis

- No cyclic dependency found in the proposed order.
- Overly central features: F-001, F-005, F-015, F-016.
- Features to split if too large: F-001 invitations vs memberships; F-015 SLA timeline vs escalation jobs; F-017 dashboard cards vs file access.
- Parallel candidates after F-005: F-007/F-008 and F-009/F-010, but both touch deliverable detail UX and should coordinate.
- Do not implement in parallel without coordination: F-012/F-013/F-014 approval chain; F-015/F-016 SLA-ledger-delivery transactions.
