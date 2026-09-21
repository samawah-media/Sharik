# Research: R-011 Residual Risk Treatment And Hosted Acceptance Readiness

Date: 2026-07-09

## Decision 1: Treat R-010 Residual Risks As Readiness Inputs, Not Acceptance Evidence

**Decision**: R-011 carries client approver, waiting approval, and final delivery/file-list gaps as readiness inputs. They may be accepted only as explicit non-Production residual risks and cannot become hosted completion or Production acceptance evidence.

**Rationale**: R-009 closed as PARTIAL OWNER-DEFERRED and R-010 Path B accepted those gaps only for planning. Reclassifying them as pass evidence would violate the R-009/R-010 owner boundary.

**Alternatives considered**:

- Treat R-009/R-010 as sufficient for hosted completion: rejected because deferred categories remain unproven.
- Stop all planning until hosted evidence exists: retained as R-011C, but not selected by this planning pass.

## Decision 2: Define Hosted Acceptance Readiness Without Executing Hosted Checks

**Decision**: R-011 defines owner gates and evidence criteria only. It performs no hosted route checks, hosted DB reads, hosted mutation, account/role changes, hosted file operations, deploy/promotion, non-Hadna data use, or Production acceptance.

**Rationale**: The owner explicitly requested planning first and forbade hosted execution. The missing categories may require owner approval before any hosted prep.

**Alternatives considered**:

- Run read-only hosted checks for available categories: rejected because R-011 boundaries forbid hosted checks.
- Attempt a completion retry under R-009: rejected because R-009 is closed and no more R-009 hosted checks are authorized.

## Decision 3: Separate Owner-Acceptable Risk From Hard Blockers

**Decision**: R-011 separates risks the owner can accept for non-Production production-candidate planning from hard blockers that stop review entirely.

**Rationale**: The owner needs to know whether the next package can proceed with risk acceptance or must stop for missing UAT categories. Tenant/client leakage, prohibited evidence, unapproved mutation, non-Hadna data, and Production acceptance claims remain hard blockers.

**Alternatives considered**:

- Treat every residual risk as a blocker: rejected because R-010 Path B allows production-candidate planning with explicit residual risk.
- Treat every residual risk as acceptable: rejected because Production acceptance and security gates cannot be bypassed.

## Decision 4: Require Explicit Mutation Approval For Any Hosted Prep

**Decision**: Any future hosted prep mutation requires explicit owner approval with environment, Hadna-only scope, exact category, maximum count, operator, window, rollback/no-op owner, evidence rules, and stop conditions.

**Rationale**: Client approver, waiting approval, and final delivery/file-list gaps may require account/category/data exposure changes. AGENTS.md requires audit, tenant isolation, and explicit approval for sensitive workflow actions.

**Alternatives considered**:

- Allow implicit prep during validation: rejected because it would mutate hosted state without owner approval.
- Ban all future mutation: retained as R-011C when owner will not authorize bounded prep.

## Decision 5: Use Value-Free Evidence Rules

**Decision**: Future evidence may record only status, category names, counts, safe state labels, command names, no-op/rollback summaries, and non-sensitive risk summaries.

**Rationale**: R-009/R-010 evidence rules prohibit sensitive values and row-level customer content. R-011 must preserve that evidence boundary.

**Alternatives considered**:

- Record screenshots or route links as proof: rejected by owner boundary.
- Record row-level examples: rejected by redaction and customer-data boundaries.

## Decision 6: Recommend R-011A When Proof Is Required Before Production-Candidate Review

**Decision**: If the owner wants the residual risks reduced before production-candidate review, the recommended next implementation package is R-011A: limited hosted completion with explicit mutation approval.

**Rationale**: R-011B allows planning with residual risk, but it does not produce the hosted evidence needed for later Production acceptance. R-011A is the cleanest route to close or reduce the three missing hosted categories under bounded approval.

**Alternatives considered**:

- R-011B as default: acceptable only if the owner explicitly accepts residual risk for non-Production planning.
- R-011C as default: safer but blocks progress until missing UAT categories are supplied.
