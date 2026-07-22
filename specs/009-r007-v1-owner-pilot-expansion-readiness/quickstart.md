# Quickstart: R-007 Readiness Validation

This guide is for validating R-007 readiness work without printing sensitive data.

## Preconditions

- Read `AGENTS.md`.
- Read `specs/009-r007-v1-owner-pilot-expansion-readiness/spec.md`.
- Read `specs/009-r007-v1-owner-pilot-expansion-readiness/plan.md`.
- Treat R-006 as accepted Hadna-only internal UAT.
- Do not use non-Hadna data or mutate hosted DB without a new explicit owner decision.
- Do not print credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.

## Local Validation Commands

Run these after implementation tasks change code:

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:rls:simulator
npm run test:e2e
npm run secret:scan
git diff --check
npm run build
```

Run database pgTAP tests only when the local Supabase stack is available and the task requires database/RLS verification:

```powershell
npm run test:rls:db
```

If the local database is unavailable or stale, restore the local-only stack before rerunning pgTAP:

```powershell
docker desktop start
npx supabase@2.107.0 db reset --local --no-seed
npm run test:rls:db
```

Do not replace this with hosted database checks unless a new explicit owner decision authorizes hosted mutation and scope.

## Required Scenario Validation

Record only pass/fail status and safe summaries for:

- Management/project admin can review the scoped pilot readiness surfaces.
- Assigned internal user can see assigned client scope without management-only powers.
- Client approver can act only on allowed waiting approval items.
- Client viewer can view allowed client data but cannot approve.
- Unassigned client user sees no assigned-client data.
- Client cannot see internal comments.
- Client cannot download internal files.
- Deliverable cannot be sent to client before internal approval.
- Stale deliverable version cannot be approved.
- SLA pauses while waiting for client and resumes on client change request.
- Audit evidence exists for sensitive state changes and denials.
- Mobile client portal has no horizontal overflow and no management chrome.

## Evidence Rules

Evidence may include:

- Counts
- Role categories
- Route categories
- Pass/fail status
- Non-sensitive status names
- Test command names
- Commit hashes when needed
- Safe risk summaries

Evidence must not include:

- Credentials
- Emails
- Screenshots
- Workbook row content
- External links
- Captions
- Deliverable titles
- Tokens
- Secret values

## Completion Gate

R-007 is ready for owner review only when:

- All selected tasks are complete.
- Required tests pass or blockers are documented.
- Release evidence identifies residual risks and out-of-scope items.
- The next owner decision is stated clearly.
- Production acceptance remains separate unless explicitly granted later.
