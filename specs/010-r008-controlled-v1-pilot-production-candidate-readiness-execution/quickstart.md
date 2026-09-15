# Quickstart: R-008 Planning and Readiness Validation

This guide validates R-008 planning without mutating hosted data or printing sensitive evidence.

## Preconditions

- Read `AGENTS.md`.
- Read `docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md`.
- Read `specs/009-r007-v1-owner-pilot-expansion-readiness/evidence/verification.md`.
- Treat R-007 as owner-accepted readiness review only.
- Do not use non-Hadna customer data.
- Do not mutate hosted DB.
- Do not deploy or promote.
- Do not print credentials, emails, screenshots, workbook content, links, captions, deliverable titles, tokens, or secret values.

## Planning Validation Commands

Use these lightweight checks after planning docs change:

```powershell
git status --short
rg -n "https?://|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|!\[|service_role|SUPABASE_SERVICE_ROLE|sb_secret|password|token" specs/010-r008-controlled-v1-pilot-production-candidate-readiness-execution docs/08-release/R-007-v1-owner-pilot-expansion-readiness.md docs/PROJECT_PROGRESS.md
```

Review matches manually. Redaction rule names are allowed; actual secrets, external evidence links, emails, images, or customer content are not.

## Future Local Verification Commands

Run these only after a later owner-approved R-008 implementation phase changes code:

```powershell
npm run test:unit -- tests/unit/release/r008-go-no-go-evidence.test.ts tests/unit/release/r008-release-boundary.test.ts
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

Run local pgTAP only when the local Supabase stack is available and the implementation scope requires database/RLS verification:

```powershell
npm run test:rls:db
```

Do not replace local pgTAP with hosted database checks unless a later owner approval authorizes the hosted environment and scope.

## Required Scenario Validation

Record only pass/fail/blocked status and safe summaries for:

- Owner gate separates planning, local implementation, hosted UAT, production-candidate review, and Production acceptance.
- Hosted mutation remains blocked without later explicit owner approval.
- Non-Hadna customer data remains blocked without later explicit owner approval.
- Tenant/client isolation proof covers management, assigned internal, client approver, client viewer, and unauthorized/unassigned categories.
- Client approver can act only on a current visible version.
- Client viewer cannot approve.
- Stale or superseded version approval is denied.
- Internal comments are hidden from client users.
- Internal files are hidden from client users.
- Client-visible/final files require scope and visibility authorization.
- Sensitive state changes create audit evidence.
- Security denials create audit evidence.
- SLA reporting separates client waiting time from Samawah-owned work time.
- Rollback plan covers code, hosted state, file visibility, permissions, and communication.
- Owner go/no-go package lists decision options and residual risks.
- Owner go/no-go package keeps Production acceptance separate from local readiness and hosted UAT options.

## Completion Gate

R-008 planning is ready for owner implementation approval only when:

- `spec.md`, `plan.md`, and `tasks.md` exist.
- All R-008 tasks are unchecked unless actually executed later.
- Planning artifacts state that hosted mutation, non-Hadna data, deploy/promote, and Production acceptance remain blocked.
- The next owner decision is stated clearly.

R-008 local readiness is ready for owner go/no-go review only when:

- US1 through US5 evidence is recorded with safe summaries only.
- Phase 8 local verification results are recorded.
- Local pgTAP is either run when local Docker/Supabase is available or blocked with a precise local-infra reason.
- The go/no-go package offers the final owner decision options without granting or implying Production acceptance.
