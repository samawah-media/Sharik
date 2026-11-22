# Team files before text — hosted activation

Owner requested activation for the existing team Preview on 2026-10-05.
Bounded targets: Vercel `samawahs-projects/shrik`, current rollback deployment
`dpl_6WS6bPRhcTymLJNPADiFfqEHU6Uc`, Supabase `sharik-uat`
(`jnvuccapgsabrwwkxnbh`, linked and ACTIVE_HEALTHY).

Local implementation prepares an audited internal draft only when no current
version exists. Row locking reuses the existing pointer on retries/concurrent
requests. No text, status transition, approval, SLA adjustment, new member,
public file or client publication is created by preparation. Later content
editing adopts the same draft identity without clearing entered text.

Local checks: component 24/24, TypeScript, production build, integration 115/115,
RLS simulator 25/25 PASS. Unit initial runs hit dynamic-import timeouts while
building; after build ended, unchanged default timeouts with maxWorkers=2
passed all 596 tests. Local PostgreSQL is unavailable, so database acceptance
requires exact-source CI before hosted migration application.

Deployment access remains blocked: available Vercel CLI account does not have
the target scope. In-app browser cannot open Vercel because its saved browser
permissions could not be verified. Owner agreed to log in; the official CLI
device authentication request ended without completing login. No credentials
or device codes are stored in this evidence. Sharing/protection is unchanged.

At the initial checkpoint, no hosted migration or publication had been performed. The supplied URL is an
immutable historical deployment, so any replacement Preview URL must be
verified and handed off explicitly; never claim the old artifact was updated.

## Final activation checkpoint (supersedes the initial access blocker)

Owner completed official Vercel authentication and explicitly authorized team
access without Vercel accounts. Project protection remains enabled; a shareable
link is scoped to the new Preview and still requires platform authentication.
The share secret is excluded from source and evidence.

Reviewed application source: `8964cbde380c70e662086c87e149384ada403983`.
Exact-source GitHub CI [37303107311](https://github.com/samawah-media/Sharik/actions/runs/37303107311)
passed, including clean migrations, pgTAP/RLS, unit, integration, components,
fixture and persistent E2E, secret scan and build. Draft PR:
[39](https://github.com/samawah-media/Sharik/pull/39).

Applied additive migration `202610050001` only to linked `sharik-uat`;
remote migration inventory matches local. Published READY Preview deployment
`dpl_7o1NyCBkBLdnNHAKeipvzk8X9XrF` at
`https://shrik-45csp1m04-samawahs-projects.vercel.app`, with verified reviewed SHA
metadata. The original immutable deployment remains available for rollback.

Hosted backend smoke passed ten checks using separate synthetic QA actors:
writer/designer permissions, concurrent draft reuse, empty text, unchanged
status/progress, unassigned/client/cross-client denial, real Storage upload and
registration, client file secrecy/download denial, authorized byte persistence,
later text using the same version, and exactly one preparation audit event.

Fresh browser reached application sign-in using the authorized share, without
Vercel login. Signed-in QA writer uploaded a file through the card Files tab
before text, and the persisted file was registered ready in Storage/database.
Synthetic UI cards are hidden after testing; audit/file records are retained.

Hosted browser continuation PASS: later text saved on the existing file version,
and after reload/reopening the card the uploaded file remained visible. The
initial continuation timeouts were test selector errors: populated tab names
include count badges, and reloading closes the drawer so the test must reopen
it. Corrected selectors and reopening passed; no application code change was
needed. Combined hosted UI checks: seven PASS.

No production deployment, global protection change, actual team account/role
mutation, client publication, workflow/SLA change, or PR merge was performed.
No new technology or architecture decision was introduced; no ADR is required.
Specs/plan/tasks and security documentation cover the change. Human team
acceptance remains an operational follow-up, not a substitute for the automated
checks above.
