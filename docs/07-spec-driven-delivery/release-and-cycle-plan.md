# Release and Cycle Plan

## Release Stages

| Stage | Goal | Exit condition |
|---|---|---|
| Foundation / Cycle 0 | Repository, Spec Kit, Agent OS, constitution, CI plan, environments. | Planning baseline accepted. |
| Internal Alpha | Core secure flows usable by Samawah internally. | VS-001 to VS-006 pass tests. |
| Samawah Pilot | Real team uses workflow with selected deliverables. | Approval/SLA/file risks resolved. |
| Four-Client Pilot | Client portal and approvals tested with around four clients. | No critical isolation defects. |
| Production V1 | Controlled production rollout. | Production readiness checklist passed. |
| Post-Pilot Hardening | Improve performance, backup, monitoring, support. | Pilot findings closed or accepted. |

## Cycles

| Cycle | Goal | Appetite | Included slices | Excluded | Demo | Exit/Security/Test/Docs gates | Target | Risks |
|---|---|---|---|---|---|---|---|---|
| C0 | Planning/tooling baseline | 0.5 cycle | none | feature code | Spec Kit + constitution + docs | baseline tag, no code/SQL | repo | Git/tool drift |
| C1 | Secure identity and client scope | 1 cycle | VS-001 | deliverables | scoped nav and denied cross-client | tenant/client tests, audit, docs | alpha | auth complexity |
| C2 | Contracts, packages, deliverables | 1 cycle | VS-002, VS-003 | Kanban | package and deliverable reservation | ledger/domain tests | alpha | ledger overbuild |
| C3 | Internal execution | 1 cycle | VS-004, VS-005 | client approval | Kanban + internal files/comments/review | internal visibility tests | alpha | UI before auth |
| C4 | Approval and SLA loop | 1 cycle | VS-006, VS-007, VS-008 | delivery consumption | client approve/change + SLA pause/resume | stale version, SLA tests | Samawah pilot | workflow coupling |
| C5 | Delivery and dashboards | 1 cycle | VS-009, VS-010, VS-011 | advanced analytics | final delivery + client/admin summary | ledger/file/portal tests | client pilot | dashboard scope |
| C6 | Pilot hardening | 1 cycle | VS-012 | new features | ASVS/a11y/backup/perf evidence | production readiness | production V1 | late security issues |
## Canonical execution update (2026-07-10)

## Hosted Team UAT amendment (2026-07-12)

The owner-authorized hosted Team UAT path remains inside Spec 015 as an amendment. It is Preview/UAT-only, Hadna-only, Team-only, and non-Production. The current state is `OWNER AUTHORIZED / PREFLIGHT IN PROGRESS`; PASS requires H001-H010 completion and T032 evidence.

Spec 015 (`specs/015-persistent-mvp-pilot-completion/`) is the only active execution package. Stage 2C and R-007–R-011A are historical evidence. No further Stage-letter, readiness, verification, defect, or handoff package may be created for this objective.
