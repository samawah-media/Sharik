# Spec 015 gate status

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed. |
| Persistent schema/RLS | verified with blocker | Migration and pgTAP exist; execution is blocked by missing local Supabase/PostgreSQL infrastructure. |
| Persistent workflow | partial | Persistent exact-version commands now cover submit, internal approval, client send/decision, SLA pause/resume, delivery, package consumption, closure, and audit. Team/management UI wiring and DB-backed E2E remain open. |
| Local MVP acceptance | blocked | Cannot claim without local DB-backed RLS and E2E evidence. |
| Hosted UAT | not authorized | Must remain separate and Hadna-only. |
| Production acceptance | not granted | Outside task boundary. |
