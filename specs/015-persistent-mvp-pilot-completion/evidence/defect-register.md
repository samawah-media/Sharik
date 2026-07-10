# Spec 015 defect register

| ID | Severity | Role/workflow | Owner | Status | Disposition/evidence |
|---|---|---|---|---|---|
| S015-P2-001 | P2 | Local DB RLS verification | Platform/Infrastructure | blocked | Install/start Docker-compatible PostgreSQL and Supabase CLI, then run `npm run test:rls:db`; not PASS. |
| S015-P2-002 | P2 | Hosted T032/UAT | Owner/Release | blocked | Outside authorization; remains separate from local acceptance. |
| S015-P2-003 | P2 | Kanban disclosure hydration/E2E | Frontend | fixed | Native deterministic disclosure; targeted Playwright 6/6 desktop/mobile/RTL. |
