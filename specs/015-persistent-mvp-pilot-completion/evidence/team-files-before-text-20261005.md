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

No hosted migration or publication has been performed. The supplied URL is an
immutable historical deployment, so any replacement Preview URL must be
verified and handed off explicitly; never claim the old artifact was updated.
