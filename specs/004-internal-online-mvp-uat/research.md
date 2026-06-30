# Research: Internal Online MVP UAT

Date: 2026-06-30

## Decision: Treat this as a release/UAT gate, not a product feature

**Rationale**: The user requested an internal online UAT after PR #17, with strict limits against expanding into Kanban, files, comments, approvals, social scheduling, AI, new dependencies, role changes, Production Supabase, or real client data. A release/UAT gate lets the team validate accepted surfaces without product drift.

**Alternatives considered**:

- Add new UAT-only product screens: rejected because it would create product scope.
- Add a staging smoke harness: deferred unless owner approves a separate narrow implementation.

## Decision: Use owner-approved Vercel Hobby/free for online access

**Rationale**: Owner clarified on 2026-06-30 that a paid Vercel Team scope is not required and approved Vercel Hobby/free. Owner also approved Vercel Production target as a hosting target only. This keeps the online path free while preserving the boundary that Production Supabase, real data, and Production acceptance are not authorized.

**Alternatives considered**:

- Paid Vercel Team scope: rejected for now because the owner wants a free path.
- Treat Vercel Production target as Production acceptance: rejected; this is hosting-only until data-backed checks pass and owner accepts separately.
- Public deployment without noting exposure: rejected; protection/public exposure status must be recorded.
- Local-only UAT: rejected for the online UAT goal, but local checks remain prerequisites.

## Decision: Hosted Supabase migration is an explicit approval gate

**Rationale**: The owner clarified that no new Sharik Supabase project exists yet. Hosted Supabase migration therefore remains deferred until a Supabase UAT project exists and receives clear approval. The AGENTS.md security gates require tenant/client isolation, RLS respect, and no Production data.

**Alternatives considered**:

- Run hosted migration immediately: rejected without explicit approval.
- Treat local DB evidence as hosted evidence: rejected because it would misrepresent environment coverage.
- Use Production Supabase temporarily: rejected because it would violate the data boundary.

## Decision: Synthetic Client A/B data is the minimum data set

**Rationale**: Tenant/client isolation is the highest priority. Client A/B synthetic data enables positive and negative checks without real client data.

**Alternatives considered**:

- Single synthetic client: rejected because it cannot prove cross-client denial.
- Real pilot client data: rejected by user request and AGENTS.md priorities.

## Decision: No ADR is required for this branch

**Rationale**: This branch does not change stack, hosting strategy, tenancy model, RLS model, SLA calculation, approval workflow, dependencies, or V1 scope. It uses existing accepted stack decisions and adds release/UAT documentation only.

**Alternatives considered**:

- Add a new deployment ADR: rejected because ADR-011 already covers deployment/hosting strategy and this branch does not change it.
