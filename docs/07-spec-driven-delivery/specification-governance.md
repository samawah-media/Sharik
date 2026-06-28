# Specification Governance

## Lifecycle

Draft -> Clarification -> Product Review -> Architecture Review -> Security Review -> Approved for Planning -> Planned -> Tasks Ready -> Ready for Build -> In Build -> Verified -> Released -> Superseded.

## Ownership

- Spec writer: PM/agent under owner direction.
- Product reviewer: owner/PM.
- Architecture reviewer: architect/tech lead.
- Security reviewer: security/architect.
- Final approval for build: owner or delegated project lead.

## Spec Kit Usage

- `/speckit.constitution`: allowed in this phase and used to establish `.specify/memory/constitution.md`.
- `/speckit.specify`: only after owner approves `first-feature-brief.md`.
- `/speckit.clarify`: when spec has unresolved business/security/UX ambiguity.
- `/speckit.checklist`: before plan to validate requirements quality.
- `/speckit.plan`: after Approved for Planning.
- `/speckit.tasks`: after plan review.
- `/speckit.analyze`: after tasks, before implementation.
- `/speckit.implement`: forbidden until Ready for Build.

## Change Control

- Scope change before build: update spec and traceability, rerun checklist if material.
- Scope change during build: stop affected tasks, document change, decide whether to supersede spec.
- ADR link required for architecture/security/stack/workflow changes listed in AGENTS.md.
- Cancelled specs become Superseded with reason and replacement link if any.

## Naming

- Product/brand English spelling: `Sharik`.
- Package/project slug: `sharik-platform`.
- Worktree root for active feature work: `D:\code - projects\sharik-worktrees\`.
- Do not create new active worktrees using legacy spellings `shrek`, `sherk`, or `sharek`.
- Historical evidence, hosted URLs, old branch names, and already-recorded paths should not be rewritten unless a document is explicitly being superseded.
- Feature IDs: `F-###`.
- Vertical slices: `VS-###`.
- Specs: `features/<feature-slug>/spec.md` only after approval.
- Branches: `feature/F-###-short-slug`, `feat/f###-short-slug`, or Spec Kit numeric branch `###-short-slug` when required by local scripts.
- Commits: conventional prefix such as `docs:`, `feat:`, `test:`, `fix:` with feature ID when applicable.

Spec Kit owns requirements, acceptance criteria, technical plan, tasks, and cross-artifact analysis. Implementation agents later own isolated execution, TDD, code review, verification, and branch completion. There must not be two conflicting implementation plans.
