# Confirmed Decisions Register

| ID | Decision | Status | Gate | Source |
|---|---|---|---|---|
| DEC-001 | V1 is a delivery operations platform, not social scheduling, CRM, ERP, helpdesk, billing, or AI generation. | Confirmed | Product | AGENTS.md, PRD |
| DEC-002 | Deliverable is the core aggregate. | Confirmed | Product/Domain | AGENTS.md, core model |
| DEC-003 | Internal approval precedes client exposure. | Confirmed | Security/Workflow | AGENTS.md, approval docs |
| DEC-004 | Client approval decisions require audit log. | Confirmed | Security | AGENTS.md |
| DEC-005 | Tenant and client isolation are mandatory. | Confirmed | Security | ADR-004/005 |
| DEC-006 | RLS plus server-side authorization. | Confirmed | Architecture | ADR-005 |
| DEC-007 | SLA pauses while waiting for client. | Confirmed | Domain | SLA docs |
| DEC-008 | Package usage is ledger-based. | Confirmed | Domain | ADR-009 |
| DEC-009 | dnd-kit is Kanban library. | Confirmed | Implementation | AGENTS.md |
| DEC-010 | Supabase/PostgreSQL/Auth/Storage are V1 platform choices. | Confirmed | Architecture | ADR-003/007 |
| DEC-011 | Modular monolith for V1. | Confirmed | Architecture | ADR-001 |
| DEC-012 | BrightBean/Postiz/Planka are references only. | Confirmed | Product/Legal | AGENTS.md, ADR-012 |
| DEC-013 | One required client approver per policy. | Assumed | Blocking before affected spec | Phase 7 instruction |
| DEC-014 | Sequential/parallel multi-party approval deferred. | Assumed | Can be deferred | Phase 7 instruction |
| DEC-015 | Reopening consumed work starts revision/correction cycle. | Assumed | Blocking before delivery/ledger spec | Phase 7 instruction |
| DEC-016 | No automatic ledger reversal on reopen. | Assumed | Blocking before implementation | Phase 7 instruction |
| DEC-017 | Audit export deferred. | Assumed | Can be deferred | Phase 7 instruction |
| DEC-018 | Delay owner detail internal only. | Assumed | Blocking before client portal spec | Phase 7 instruction |
| DEC-019 | Exact SLA policy after reopening. | Open | Blocking before delivery/SLA implementation | Architecture risks |
| DEC-020 | Tiptap vs Markdown fallback. | Open | Blocking before comments implementation | AGENTS.md, tech assessment |
| DEC-021 | Official English product spelling is `Sharik`, from Arabic `شريك`. Use `sharik-platform` for package/project slugs. | Confirmed | Product/Implementation | Owner direction, 2026-06-28 |
| DEC-022 | Active feature worktrees should live under `D:\code - projects\sharik-worktrees\`; legacy `shrek`/`sherk` paths remain historical evidence only. | Confirmed | Delivery/Implementation | Owner direction, 2026-06-28 |
