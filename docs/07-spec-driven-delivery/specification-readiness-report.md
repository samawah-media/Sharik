# Specification Readiness Report

| Area | Status | Evidence | Missing work | Blocking questions | Recommended action |
|---|---|---|---|---|---|
| Product Readiness | Ready | PRD, vision, AGENTS, roadmap | none for first feature | none | Proceed to first spec after owner approval. |
| Business Rule Readiness | Conditionally Ready | operating/domain docs | reopen/SLA details | reopen policy | Defer until affected spec. |
| Permission Readiness | Ready for first feature | permission catalog/matrix | offboarding details | client admin invite scope | Clarify in first spec. |
| Domain Readiness | Ready for first feature | tenancy/membership/domain docs | exact schemas later | none | Use conceptual model in spec. |
| UX Readiness | Ready | IA, role nav, screen inventory | detailed wireframes later | none blocking | Keep client simple/mobile. |
| Architecture Readiness | Ready | ADR-001..012, C4/arc42 | sequence diagrams later | staging target | Add during plan. |
| Security Readiness | Ready | threat model, ASVS, RLS matrix | exact policy tests later | none for first feature | Make negative tests mandatory. |
| NFR Readiness | Conditionally Ready | NFR docs | performance targets | staging/backup targets | Define before pilot. |
| Test Readiness | Conditionally Ready | test strategy in this phase | CI harness not built | none for spec | Plan tests in first feature. |
| Repository Readiness | Ready | git init, baseline commit/tag | untracked ZIPs remain | include/exclude archives? | Leave archives untracked unless owner asks. |
| Tooling Readiness | Ready | Spec Kit 0.9.5 codex, Agent OS standards | CI not installed | none | Do not run implement. |
| First Feature Readiness | Conditionally Ready | first-feature-brief.md | invite expiry/client-admin policy | 2 questions | Owner approval then `/speckit.specify`. |
