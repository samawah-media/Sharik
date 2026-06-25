# F-001A Phase 6 Stabilization and Owner Gate Reconciliation

Date: 2026-06-24

## Verdict

PASS for stabilization gate.

Owner approval is still required before final acceptance of T037-T083 or any start of T084-T103 / Phase 7.

## Preflight

Commands recorded before implementation:

| Command | Result |
|---|---|
| `git status --short` | ` M next-env.d.ts` |
| `git rev-parse HEAD` | `1f3fecb00879cfaa4d11a0f17e48991ffdff9bc0` |
| `git branch --show-current` | `feat/f001a-secure-client-foundation` |
| `git worktree list` | Primary: `D:/code - projects/shrek.platform` at `229ceb3` on `001-secure-tenant-client-onboarding`; implementation worktree: `D:/code - projects/shrek-platform-f001a` at `1f3fecb` on `feat/f001a-secure-client-foundation` |

Expected branch and HEAD matched. Work continued only in `D:\code - projects\shrek-platform-f001a`.

## `next-env.d.ts` Evidence

Initial diff:

```diff
-import "./.next/types/routes.d.ts";
+import "./.next/dev/types/routes.d.ts";
```

Classification: generated-only Next.js build/dev artifact.

Action: restored to HEAD before any implementation changes. The final git status shows no `next-env.d.ts` modification.

## Local Supabase and Data Boundary

Supabase configuration and test commands used local-only endpoints:

- `.env.example`: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `supabase/config.toml`: local DB port `54322`, local auth site URL `http://127.0.0.1:3000`
- RLS DB tests: `npx supabase@2.107.0 test db --local supabase/tests/database`

No production Supabase project, remote database, or real customer data was used.

Local reset workflow:

```powershell
npx supabase@2.107.0 db reset --local
npx supabase@2.107.0 db reset --local
```

Both resets completed with local migration replay. Output included local migration application and `Finished supabase db reset on branch main`; this is Supabase CLI's local database branch label, not a Git merge or Git branch switch.

## E2E Reproduction

Initial `npm run test:e2e` result:

- Exit code: 1
- Total: 30 tests
- Passed: 24
- Failed: 6

Failed set:

- `tests/e2e/invitations/internal-invite.spec.ts` across desktop, mobile, RTL.
- `tests/e2e/management/create-client.spec.ts` across desktop, mobile, RTL.

Observed failure:

```text
page.goto: net::ERR_ABORTED; maybe frame was detached?
navigating to "http://127.0.0.1:3000/clients", waiting until "load"
navigating to "http://127.0.0.1:3000/invitations/internal", waiting until "load"
```

Trace evidence was generated under `test-results/.../trace.zip` for the failing runs.

## Root Cause Classification

### Failure Group A: HMR Origin Mismatch

Classification: Test environment/configuration.

Evidence:

```text
Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "127.0.0.1".
Cross-origin access to Next.js dev resources is blocked by default for safety.
```

Cause:

- Playwright `baseURL` and `webServer.url` used `http://127.0.0.1:3000`.
- Next dev server announced `http://localhost:3000`.
- Next 16 blocked dev HMR resources for `127.0.0.1` until explicitly allowed.

Fix:

- `next.config.ts` now allows only `127.0.0.1` and only when `NODE_ENV === "development"`.
- No production allowed origin was added.
- No broad wildcard or host expansion was added.

### Failure Group B: Turbopack Dev Cold Compilation Hang

Classification: Test environment/configuration.

Evidence:

- Direct HTTP requests to both `http://127.0.0.1:3000/clients` and `http://localhost:3000/clients` timed out while Next logged `Compiling /clients ...`.
- Direct HTTP requests to `/invitations/internal` timed out while Next logged `Compiling /invitations/internal ...`.
- Running Next dev with Webpack on `127.0.0.1` returned:
  - `/clients`: HTTP 200
  - `/invitations/internal`: HTTP 200
- Production `npm run build` using Next/Turbopack completed successfully and generated both routes.

Cause:

- Local Next 16 Turbopack dev route compilation was not reliable for this E2E run.
- Webpack dev compiled the same routes successfully.
- Production build was unaffected.

Fix:

- Playwright webServer now uses a local wrapper script: `node scripts/playwright-webserver.mjs`.
- The wrapper starts Next dev with `--webpack -H 127.0.0.1`.
- The wrapper prewarms the E2E route set and exposes readiness only after warmup on `http://127.0.0.1:3210/ready`.
- Playwright `baseURL` remains `http://127.0.0.1:3000`.

### Failure Group C: Cold Compile Consuming Test Timeout

Classification: Test environment/configuration.

Evidence:

- After switching to Webpack dev without prewarm, early desktop tests still failed because cold route compilation consumed the per-test time budget.
- Later mobile/RTL tests passed once routes were warm.

Fix:

- The readiness wrapper warms these routes before Playwright starts:
  - `/`
  - `/client`
  - `/clients`
  - `/clients/new`
  - `/invitations/internal`
  - `/members`
  - `/portfolio`
  - `/invite/expired`

No retries, test timeouts, or assertions were weakened.

## Test Defects

No test defect was identified or changed.

No `skip`, `todo`, or `only` was added.

## Application Defects

No application defect inside T001-T083 required a product behavior change in this round.

Production build and application routes passed after the E2E environment/readiness fixes.

## Files Modified

| File | Reason |
|---|---|
| `next.config.ts` | Add development-only `allowedDevOrigins: ["127.0.0.1"]` for Playwright/Next dev HMR consistency. |
| `playwright.config.ts` | Point Playwright `webServer` to the local readiness wrapper while keeping app `baseURL` on `127.0.0.1:3000`. |
| `scripts/playwright-webserver.mjs` | Start local Next dev with Webpack on `127.0.0.1`, prewarm E2E routes, and expose readiness only after warmup. |
| `docs/PROJECT_PROGRESS.md` | Reconcile owner gate status to `STABILIZED — PENDING OWNER APPROVAL`. |
| `evidence/f001a/owner-gate-2026-06-24.md` | Record dated owner gate and T037-T083 classification. |
| `evidence/f001a/phase-6-stabilization-report-2026-06-24.md` | Record stabilization evidence and verification results. |

## Commands and Results

| Command | Exit | Result |
|---|---:|---|
| `npm ci` | 0 | Added/audited 476/477 packages; 2 moderate vulnerabilities reported by npm. |
| `npx supabase@2.107.0 db reset --local` | 0 | Local reset passed. |
| `npx supabase@2.107.0 db reset --local` | 0 | Local reset passed again. |
| `rg -n "\.(skip\|todo\|only)\(...` | 1 | No matches; no `skip/todo/only` found. |
| `npm run lint` | 0 | Passed. |
| `npm run typecheck` | 0 | Passed. |
| `npm run test:unit` | 0 | 10 files passed; 30 tests passed. |
| `npm run test:integration` | 0 | 13 files passed; 32 tests passed. |
| `npm run test:component` | 0 | 6 files passed; 16 tests passed. |
| `npm run test:rls` | 0 | Simulator: 5 files / 16 tests passed. DB pgTAP: 1 file / 29 tests passed. Result: PASS. |
| `npm run test:e2e` | 0 | 30 tests passed. |
| `npm run secret:scan` | 0 | No high-confidence secrets found. |
| `npm run build` | 0 | Production build passed; 10 app routes generated. |
| `npm audit --audit-level=high` | 0 | Zero high/critical findings; 2 moderate PostCSS findings remain deferred. |

## Security and Test Integrity Review

- Tenant/client leakage checks remained intact in E2E assertions: `Client B`, `tenant_b`, and management surface denials are still asserted where applicable.
- RLS simulator and real pgTAP RLS tests passed.
- No security assertions were weakened.
- No test retries or timeouts were increased.
- No production or remote Supabase connection was used.
- No secrets were detected by the project secret scan.
- `allowedDevOrigins` is development-only and contains only `127.0.0.1`.
- Playwright readiness uses local-only `127.0.0.1` ports.

## T037-T083 Review Scope

T037-T083 remain:

```text
EXECUTED — PENDING OWNER REVIEW
```

This round reviewed their changed behavior only to the extent needed for stabilization and Full E2E:

- No tenant/client leakage was observed in the passing E2E, RLS simulator, or pgTAP tests.
- No enumeration regression was observed in invitation lifecycle denial states.
- No owner acceptance was recorded.
- No deletion or rollback of T037-T083 was performed.

## Deferred Notes

- npm audit reported 2 moderate PostCSS findings through Next's dependency tree. They are not high/critical and are deferred per owner instruction not to clean dependencies in this round.
- Unused dependency cleanup, if any, is deferred and was not performed.

## Out of Scope

- T084-T103.
- Phase 7.
- Spec, ADR, or contract changes.
- New dependencies.
- Production Supabase, deployment, or real customer data.
- Merge to `main`.
