# Owner-requested empty start

The owner supersedes the seeded handoff and explicitly requests removal of
existing clients and synthetic business data so the team starts by adding a client.

Scope: only tenant `0e167152-300e-4904-b9c3-65b04242a46e` on sharik-uat,
currently containing the one synthetic team-training client. Preserve Auth
identities/passwords, tenant memberships, member profiles and the administrator.
Preserve the append-only security audit and existing role records so members
remain available for reassignment in the current team UI. Their old client scope
points to a deleted client and grants no access to newly created clients.
Delete old client-membership links. Bashayer creates the first client and assigns
members before their client-scoped work can resume.

Plan: inventory exact scope/dependencies; take an owner-private snapshot and
storage backup; transactionally remove scoped business rows in dependency order,
temporarily lifting only the two append-only business-table delete guards and
the current-version payload guard within the locked transaction; restore every
guard before commit. Keep all foreign keys enforced. Delete only backed-up
storage objects belonging to these rows. Verify zero business rows, preserved
accounts/audit/guards and the administrator's empty-state/create-client UI.
Update the handoff to begin at client creation. No application/schema changes,
new technology, Production reset or changes to unrelated tenants.

Status: COMPLETE — database reset, storage cleanup, fresh authentication and
hosted empty-start UI verified. Five real participants remain active; three
supplemental example.test QA memberships/roles are removed (Auth history retained).

## Evidence

- Pre-reset snapshot: 1 client, 8 deliverables, 7 contracts/packages, 9 tasks,
  8 file assets and dependent versions/reviews/ledger. Eight objects backed up;
  four failed-upload paths already absent. Private snapshot/blobs stay ignored.
- Transaction rehearsal rolled back successfully; committed reset passed all
  before/after hashes for other tenants and preserved account/audit/profile/role
  rows. Foreign keys stayed enabled; all three temporary business guards restored.
- Audit retained (187 original events plus reset and QA-removal events). No
  security audit deletion. Supplemental QA membership removal is a separate
  audited, exact-identity operation; real participant credentials are untouched.
- Final counts: clients/contracts/packages/deliverables/notifications/storage = 0;
  active real participants = 5; disabled business guards = 0.
- Exact five email/password pairs authenticate, and all five read empty scoped
  business data. Client access awaits linkage to the newly created client.
- Hosted empty-start browser PASS: 1 test, 11.8 seconds. Admin sees zero client
  cards, opens the blank onboarding form and reloads it, sees PM/writer/designer
  in the member directory, and sees no QA member headings. No client was created.
- Scoped ESLint PASS. Existing seeded-lifecycle evidence remains historical;
  the current pilot state is empty and must not be reseeded without owner request.
- Owner/team/client guides, verification report, checklist and credential-card
  context updated. Link and passwords unchanged. No new ADR, app change, merge,
  Production operation or outbound message. AGENTS.md isolation/audit preserved.
