# Implementation Risk Register

| ID | Risk | Probability | Impact | Trigger | Mitigation | Detection | Owner | Blocking gate | Residual |
|---|---|---|---|---|---|---|---|---|---|
| R-001 | Specs become huge | Medium | High | one spec spans many slices | split by vertical outcome | spec review | PM | Ready for Plan | Medium |
| R-002 | Overlapping specs | Medium | High | same aggregate in parallel | dependency map | task review | PM/Architect | Ready for Build | Medium |
| R-003 | Duplicate sources of truth | Medium | Medium | docs conflict | decision register | baseline review | PM | Spec | Low |
| R-004 | Planning all V1 before feedback | Medium | Medium | exhaustive detail beyond first slice | first feature only | roadmap review | Owner | Spec | Medium |
| R-005 | Demo treated as architecture | Low | High | copying demo patterns | ADR gate | code review | Architect | Build | Low |
| R-006 | UI before isolation | Medium | Critical | app shell exposes data | C1 first | security tests | Architect | Build | Low |
| R-007 | RLS before permission matrix | Medium | Critical | policies without permissions | matrix required | RLS review | Backend | Plan | Low |
| R-008 | Giant workflow | Medium | High | all approvals/SLA in one feature | slice map | spec review | PM | Spec | Medium |
| R-009 | Kanban state mixed with deliverable state | Medium | High | inconsistent cards | state machine | domain tests | Backend | Plan | Medium |
| R-010 | Ledger as counter | Medium | Critical | mutable balance field | append-only rule | tests/review | Backend | Build | Low |
| R-011 | SLA as due date only | Medium | Critical | no pause segments | timeline model | SLA tests | Backend | Plan | Low |
| R-012 | Public file URLs | Medium | Critical | direct storage links | signed auth path | file tests | Backend | Build | Low |
| R-013 | Tests deferred | Medium | High | UI done no evidence | DoD gate | CI/checklist | QA | Verified | Medium |
| R-014 | Parallel features hit same aggregate | Medium | High | merge conflicts/logic drift | branch coordination | dependency review | Tech lead | Build | Medium |
| R-015 | Scope creep | High | Medium | social/AI/CRM asks | V1 gate | backlog review | Owner | Spec | Medium |
| R-016 | Dependency drift | Medium | Medium | install new libs | dependency review | lockfile review | Architect | Build | Low |
| R-017 | Agent context overload | Medium | Medium | long prompts ignore rules | standards/index | review | PM | Spec | Medium |
| R-018 | Code before approved spec | Low | Critical | implementation command used early | constitution | git review | Owner | Build | Low |
| R-019 | No Git baseline | Resolved | High | missing repo | baseline commit/tag | git status | Owner | Implementation | Low |
| R-020 | No staging | Medium | High | pilot on local/prod | staging plan | release gate | DevOps | Pilot | Medium |
