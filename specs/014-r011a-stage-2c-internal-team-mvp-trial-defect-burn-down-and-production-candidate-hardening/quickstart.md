# Quickstart: R-011A Stage 2C Local Trial Validation

## Boundary

Run only against the local workspace with Hadna-only synthetic/local data. Do not run hosted mutation, hosted route checks, hosted file content operations, deployment, promotion, domain, environment, or access configuration commands.

## Required Commands

Run or record blocked/skipped status:

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:rls:simulator
npm run test:rls:db
npm run test:e2e
npm run secret:scan
git diff --check
npm run build
```

`npm run test:rls:db` is required only when local infrastructure is available. If local Postgres/Supabase is unavailable, record the exact local blocker and do not use hosted infrastructure as a substitute.

## Evidence Procedure

1. Record all command results in `evidence/execution-log.md`.
2. Record role/scenario findings in `evidence/internal-mvp-trial-matrix.md`.
3. Record defects and retest outcomes in `evidence/defect-register.md`.
4. Run a scoped redaction scan over Stage 2C evidence.
5. Keep the Production boundary explicit in the final result.
