# Spec 015 defect register

| ID | Severity | Role/workflow | Owner | Status | Disposition/evidence |
|---|---|---|---|---|---|
| S015-P2-001 | P2 | Local DB RLS verification | Platform/Infrastructure | blocked | Install/start Docker-compatible PostgreSQL and Supabase CLI, then run `npm run test:rls:db`; not PASS. |
| S015-P2-002 | P2 | Hosted T032/UAT | Owner/Release | blocked | Outside authorization; remains separate from local acceptance. |
| S015-P2-003 | P2 | Kanban disclosure hydration/E2E | Frontend | fixed | Native deterministic disclosure; targeted Playwright 6/6 desktop/mobile/RTL. |
| S015-P1-004 | P1 | Account manager internal approval/send/delivery | Database authorization | fixed, DB retest blocked | Removed `account_manager` from management authority; behavioral pgTAP requires local DB. |
| S015-P1-005 | P1 | Persistent workflow state-machine bypass | Database workflow | fixed, DB retest blocked | Terminal/status guards added and `request_internal_changes` implemented. |
| S015-P1-006 | P1 | Cross-deliverable version binding | Database integrity | fixed, DB retest blocked | Composite FKs now include version, deliverable, tenant, and client. |
| S015-P1-007 | P1 | System/internal comment exposure | Database visibility | fixed, DB retest blocked | Independent comment `visibility` added; client RLS requires `client_visible`. |
| S015-P2-008 | P2 | Behavioral DB coverage | QA/Database | implemented, execution blocked | Added role-negative, terminal-state, cross-deliverable, comment secrecy, and same-tenant isolation pgTAP. |
| S015-P2-009 | P2 | Approved V1 UI/file dependencies | Owner/Architecture | awaiting owner decision | No dependency was added without explicit approval; Uppy/Tiptap/dnd-kit/TanStack/RHF remain open. |
