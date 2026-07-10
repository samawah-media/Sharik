# Spec 015 gate status

| Gate | Status | Reason |
|---|---|---|
| Baseline integrity | green | Corrected locally and committed. |
| Persistent schema/RLS | blocked | Expanded migration and pgTAP exist, but no DB claim is verified until local PostgreSQL executes them. |
| Persistent workflow | blocked | Generic protected-status bypass and assigned-team submission corrections are implemented; P1 regression execution and persistent DB-backed E2E remain open. |
| Local MVP acceptance | blocked | Cannot claim without local DB-backed RLS and E2E evidence. |
| Hosted UAT | not authorized | Must remain separate and Hadna-only. |
| Production acceptance | not granted | Outside task boundary. |
