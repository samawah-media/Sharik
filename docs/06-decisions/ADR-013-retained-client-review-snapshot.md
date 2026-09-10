# ADR-013: Retain the Last Sent Client Review Snapshot

## Status

Accepted for the owner-approved SIL-52 correction design, 2026-09-10. Database implementation and deployment require regression and security gates; this status is not migration approval.

## Context

Saving a new internal draft updates `deliverables.current_version_id`. Existing client read policies and application readers require that pointer and a client-visible status, so work previously sent to the client disappears during rework. Broadening the existing helper would also broaden comment/upload mutation checks, which is not acceptable.

## Decision

Preserve the internal working pointer and current-only mutation helper. Preserve its existing exact-current, client-visible/final read path for compatibility. Add a separate authenticated client-readable-version boundary whose retained fallback selects exactly the last version explicitly published by the authoritative `DeliverableVersionSentToClient` audit event. Reuse active tenant/client membership and role checks with uniform denial. During internal rework allow that snapshot read-only; expose no draft or internal review content. Replace the snapshot only on explicit resend. Keep final-delivery behavior and all existing file visibility/readiness checks. Use this boundary consistently for deliverable/version/comment/file SELECT, Storage reads, author display and client application readers. Exclude cancelled/archived work unless a later explicit product decision changes that behavior.

Client decision, upload and comment commands retain exact current-version, workflow and scoped role checks. UI hides mutation controls on the retained historical snapshot. This does not change who can approve or when SLA pauses/resumes.

Security review found that the existing authenticated direct audit INSERT policy only checks tenant membership. Because retained reads now depend on send-event authenticity, narrowly exclude `DeliverableVersionSentToClient` from direct authenticated inserts. Trusted SECURITY DEFINER workflow RPCs continue emitting that event. Require both forged-event denial and successful real send-RPC regression before publication. This is a necessary part of the SIL-52 authorization boundary, not a general audit redesign; historical records are not rewritten.

Accounts may hold both client and team roles, so permissive team SELECT policies can expose multiple versions to the same authenticated connection. Client presentation must not assume RLS returns one row. Use a scoped authenticated read-only `s015_client_readable_versions` RPC returning only work/version ID pairs selected by the dedicated client-read predicate. Detail and summary readers consume that explicit mapping; never use unordered limit-one or batch truncation as publication selection. Preserve management access and test mixed-role accounts independently.

## Alternatives considered

- Keep disappearing work: breaks the client follow-up journey.
- Relax the current-version helper globally: risks granting historical writes.
- Expose the newest version by number: can disclose unsent drafts.
- Add a second mutable publication pointer: duplicates existing authoritative send history and needs backfill/synchronization; not necessary for this bounded correction.

## Consequences

Read and mutation authorization become distinct contracts. SQL and application readers must agree and need authenticated regression across rework/resend, stale decisions, files, comments, viewer and revoked/cross-scope access. Existing audit data is not rewritten. A missing valid send event fails closed for retained historical reads; compatibility must be checked before publication. The existing current-visible path is not retroactively made dependent on audit backfill.

## Rollback plan

If verification fails, do not publish. After any future approved deployment, restore previous application readers and read policies via a reviewed forward migration; retain all audit/ledger data. This may restore the known disappearance defect temporarily but must never relax mutation or tenant isolation checks.
