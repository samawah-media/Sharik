# Planning Baseline Review

## Files Reviewed

- `AGENTS.md`
- `docs/00-product/*`
- `docs/01-operating-model/*`
- `docs/02-users-and-permissions/*`
- `docs/03-core-domain-model/*`
- `docs/04-ux-and-user-flows/*`
- `docs/05-architecture-and-security/*`
- `docs/06-decisions/*`
- `demo/*` as UX reference only

## Confirmed Decisions

- V1 core is agreed deliverables, SLA, internal Kanban, internal approval, client approval, files, permissions, and multi-client isolation.
- Next.js, TypeScript, Tailwind, shadcn/ui, Radix, Lucide, Supabase, PostgreSQL, RLS, Supabase Auth/Storage, TanStack Query/Table, dnd-kit, Zod, React Hook Form, Uppy, Tiptap, Vitest, and Playwright are the planned stack.
- Modular monolith, shared database/shared schema multitenancy, RLS plus server-side authorization, server-only sensitive commands, Supabase Storage, SLA jobs, append-only audit/ledger, limited realtime, and Vercel/Supabase deployment are accepted ADR directions.
- The client must not see internal comments, QA notes, internal files, internal audit, or unapproved deliverable versions.
- SLA pauses while waiting for the client and resumes when the work returns to Samawah.
- Package accounting must be ledger-based, not a mutable counter.

## Assumed Decisions

- V1 client approval needs one required approver per approval policy; multiple reviewers/commenters can exist.
- Multi-step/parallel client approval is deferred.
- Client rejection maps to changes requested or management escalation, not automatic cancellation.
- Reopening a consumed deliverable starts a new revision/correction cycle and does not automatically reverse package consumption.
- Delay owner is internal; the client sees simplified status language.
- Audit log viewing is V1 by role; audit export is deferred.
- Extra deliverables outside package require explicit approval.

## Open Questions

- Exact policy for SLA after reopening delivered/consumed work.
- Whether client viewers may add non-decision comments.
- Whether bulk client approval is V1 or pilot-only.
- Owner approval needed for final Tiptap versus Markdown fallback decision.
- Exact audit-log visibility for client external history.
- Staging and backup/restore operational targets before pilot.

## Conflicts

| Severity | Conflict | Recommended handling |
|---|---|---|
| Medium | AGENTS.md older structure differs from current `docs/01..06` folder names. | Treat current folders as latest baseline; do not rename during this phase. |
| Medium | AGENTS.md names Tiptap as default while architecture assessment keeps fallback open. | Require ADR if fallback chosen. |
| Low | Demo shows rich UI patterns before security foundations. | Keep demo as UX reference only. |
| Documentation Only | Some open questions from earlier product docs are already narrowed by later operating/security docs. | Mark superseded in decision register. |

## Gaps and Orphans

- Permissions not yet tied to feature IDs: delegation lifecycle, audit view/export, offboarding, SLA override, package ledger adjustment.
- UX flows needing stronger domain-rule linkage: bulk approval, report opening from files, action center notifications, reopening UX.
- Domain events needing feature ownership: offboarding, delegation expiry, audit retention/archive, backup restore, realtime subscription changes.
- Security requirements needing feature ownership: background job tenant scoping, no public file URLs, service-role confinement, view/RLS bypass checks.
- ADRs do not need immediate replacement, but owner should accept/defer open questions before the affected specs.
