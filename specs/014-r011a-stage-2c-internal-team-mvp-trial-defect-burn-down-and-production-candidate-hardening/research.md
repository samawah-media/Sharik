# Research: R-011A Stage 2C

## Decision: Reuse Existing Local Workflow And Security Test Surfaces

**Rationale**: R-007 through R-011A already define local deliverable lifecycle, SLA, approval, file visibility, comment visibility, audit, route guard, and RLS simulator coverage. Stage 2C should burn down gaps using those surfaces instead of introducing broad new abstractions.

**Alternatives considered**:
- New end-to-end trial harness: rejected for scope risk and duplicated coverage.
- Hosted UAT execution: rejected because hosted execution and UAT deployment are not separately approved for Stage 2C.

## Decision: No New Dependencies

**Rationale**: Existing Vitest, Testing Library, Playwright, and local scripts cover required verification. A new dependency would require ADR and owner approval, and is not needed for this pass.

**Alternatives considered**:
- Add an accessibility scanner dependency: rejected for this pass; use existing Playwright and semantic assertions.
- Add a reporting dependency: rejected; evidence is markdown and value-free.

## Decision: Evidence Is Value-free And Category-based

**Rationale**: The owner explicitly requires Hadna-only synthetic/local data and no sensitive evidence. Counts, categories, pass/fail states, and redacted command summaries are enough to validate Stage 2C without exposing customer values.

**Alternatives considered**:
- Screenshots or file-content evidence: rejected unless explicitly approved and redacted.
- Hosted URLs or account identifiers: rejected for this local pass.

## Decision: Production Readiness Remains Blocked Until Hosted Gates Are Green

**Rationale**: Stage 2C can validate local trial readiness and burn down defects, but R-011A T032 remains open and hosted evidence is still missing. Production acceptance would exceed current authority.

**Alternatives considered**:
- Production-candidate claim after local green tests: rejected because hosted execution and UAT deployment remain separately approved gates.
