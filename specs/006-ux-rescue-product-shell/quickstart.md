# Quickstart: F-005 UX Rescue Product Shell

## Prerequisites

- Node.js supported by the repo (`>=20.9.0`).
- Existing dependencies installed with `npm install`.
- Use synthetic local/test fixtures only.
- Do not connect to Production Supabase.

## Local UX Smoke

1. Start the app:

   ```bash
   npm run dev
   ```

2. Open these fixture routes:

   ```text
   /clients?as=tenant_admin_a
   /clients/client_a?as=tenant_admin_a
   /clients/client_a/contracts?as=tenant_admin_a
   /clients/client_a/contracts/contract_a/packages?as=tenant_admin_a
   /clients/client_a/deliverables?as=tenant_admin_a
   /clients/client_a/deliverables/board?as=tenant_admin_a
   /clients/client_a/deliverables/board?as=client_viewer_a
   ```

3. Expected outcomes:
   - Internal pages share the same RTL shell, sidebar, top header, breadcrumbs, and content spacing.
   - Client viewer cannot see the internal Kanban board or card data.
   - Kanban columns scroll horizontally and stay at least 320px wide.
   - Cards do not overflow their columns.
   - The status action control is compact and existing invalid options stay disabled.

## Required Verification Commands

Run before PR creation:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:component
npm run test:e2e
npm run secret:scan
npm run build
```

## Evidence

- Save before/after screenshot notes in `specs/006-ux-rescue-product-shell/evidence/verification.md`.
- Summarize evidence in `docs/08-release/F-005-ux-rescue-product-shell.md`.
