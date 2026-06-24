# A2 - Client Foundation Checkpoint

## Status

Complete and verified.

## Scope Guard

- Implemented only A2 Client Foundation tasks T028-T036.
- Invitation lifecycle was not started.
- Internal invitations were not started.
- Client invitations were not started.
- Membership lifecycle changes were not started.
- No production Supabase project was used.
- No real customer data was used.

## Implemented A2 Surface

- `public.clients` table with `tenant_id`, unique tenant-scoped slug, status, contact summary fields, created/updated timestamps, and RLS enabled.
- RLS helper/policies for tenant-management client read/insert/update and scoped client basics read.
- Tenant-scoped in-memory client repository for command and UI tests.
- Server-side create/update client commands with Zod validation, permission checks, tenant-scope derivation from actor context, and audit events.
- Authorized assigned-client listing query.
- Arabic RTL management clients list, create form, edit form placeholder, empty state, and safe denied state.

## A2 Audit Events

- `ClientCreated`
- `ClientUpdated`
- `AuthorizationDenied`
- `ClientUpdateDenied`

## Verification Evidence

Commands run so far on 2026-06-24:

```powershell
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:rls:simulator
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npx supabase@2.107.0 db reset --local --no-seed
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY='docker.io'; npm run test:rls:db
npm run lint
npm run test:rls
npm run secret:scan
npm run build
```

Current results:

- `npm run typecheck`: passed.
- `npm run test:unit`: passed, 5 files and 15 tests.
- `npm run test:integration`: passed, 3 files and 8 tests.
- `npm run test:component`: passed, 3 files and 6 tests.
- `npm run test:rls:simulator`: passed, 3 files and 10 tests.
- `npx supabase@2.107.0 db reset --local --no-seed`: passed with Docker Hub registry override.
- `npm run test:rls:db`: passed, 1 pgTAP file and 20 tests.
- `npm run lint`: passed.
- `npm run test:rls`: passed; simulator 3 files / 10 tests and pgTAP 1 file / 20 tests.
- `npm run secret:scan`: passed, no high-confidence secrets found.
- `npm run build`: passed; Next.js production build completed.

## Verification Note

One early `npm run test:rls:db` attempt timed out while it was run in parallel with `npm run test:rls`. The database test was rerun sequentially and passed, and the full `npm run test:rls` gate also passed.

## Risks / Assumptions

- A2 does not connect the UI form to a live Server Action yet; command behavior is covered by integration tests and the UI surface is covered by component/E2E specs.
- `PERM.CLIENT.UPDATE` is deferred by the C-003 contract; update uses the same tenant-management authority as client creation for A2.
- Data API grants remain test-local in pgTAP and rolled back, matching the A1R pattern.

## Stop Condition

Stop after A2 completion. Do not begin A3 or any invitation lifecycle work without explicit owner approval.
