# Research: R-008 Controlled V1 Pilot / Production-Candidate Readiness Execution

## Decision: Treat R-007 Acceptance as Readiness Only

**Rationale**: The owner accepted R-007 readiness review, but the accepted R-007 evidence explicitly says it is not Production acceptance and does not authorize hosted mutation or non-Hadna data.

**Alternatives considered**:

- Treat R-007 as production-candidate acceptance: rejected because it conflicts with R-007 release evidence and AGENTS.md gate rules.
- Reopen R-007 for additional execution: rejected because R-008 is the next package and should preserve R-007 as accepted readiness evidence.

## Decision: Start R-008 as Planning-Only

**Rationale**: The owner authorized starting R-008 as a new Spec Kit package, planning first. Planning can define gates, evidence, and future tasks without mutating hosted data or changing code.

**Alternatives considered**:

- Begin implementation immediately: rejected because the user requested planning first and the worktree already contains uncommitted R-007 changes.
- Request clarification before creating the package: rejected because the owner provided enough scope and boundaries for planning.

## Decision: Hosted UAT Requires a Separate Authorization Boundary

**Rationale**: Hosted actions can affect real environments and must name environment, data boundary, mutation type, duration, rollback plan, and evidence rules before execution.

**Alternatives considered**:

- Allow read-only hosted smoke by default: rejected because the user explicitly said no hosted mutation now, and the package should still make hosted boundaries explicit before any hosted action.
- Allow hosted mutation under R-008 tasks: rejected until a later owner approval is recorded.

## Decision: Tenant/Client Isolation Proof Is the First Production-Candidate Security Gate

**Rationale**: AGENTS.md prioritizes customer isolation, permissions, auditability, and SLA correctness above speed or UI polish. R-008 must prove isolation across data paths before any broader pilot.

**Alternatives considered**:

- Use only happy-path client portal smoke: rejected because it misses cross-client and unauthorized access risks.
- Delay isolation proof to Production acceptance: rejected because controlled pilot expansion itself can expose scope boundaries.

## Decision: Evidence Package Uses Safe Summaries Only

**Rationale**: R-007 established redaction rules. R-008 inherits them so evidence remains owner-readable without printing sensitive values or customer content.

**Alternatives considered**:

- Include screenshots or detailed workbook examples for owner confidence: rejected because R-007 and R-008 evidence rules prohibit those categories in committed evidence.
- Link to hosted artifacts from committed evidence: rejected unless a later owner decision allows specific hosted evidence handling.

## Decision: Rollback Plan Is a Required Gate, Not a Postscript

**Rationale**: Production-candidate readiness needs a recovery path for code, hosted configuration, hosted data mutation, file visibility changes, and UAT communication before hosted action is approved.

**Alternatives considered**:

- Write rollback only after implementation: rejected because hosted UAT approval must understand rollback before any mutation.
- Limit rollback to git revert: rejected because hosted data, files, and communication state need separate handling.
