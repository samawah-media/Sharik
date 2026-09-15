# SIL-44 — client workspace selection checkpoint

## Latest continuation — 2026-09-10

The implementation checkpoint below is historical. Subsequent verification passed 915 unique local tests, actual desktop keyboard switching and selector geometry at 1440/375 pixels. The separate extended browser navigation run timed out; full mobile acceptance remains open. Actual Madar text-only lifecycle reached delivered/100% and version3 final, with read-only database verification of decisions, replay protection, audit and SLA pause/resume/completion. This does not cover valid final files, viewer, all negative authorization cases or initial SLA timing. See [canonical walkthrough](owner-acceptance-walkthrough-ar.md) for evidence and remaining checks.

Acceptance remains HOLD: newly reproduced P1 SIL-52 (previously sent work unavailable during a new internal draft) and SIL-54 (reserved/consumed double counting in package balance) need fixes and fresh regression. SIL-44 is still local and not published. No production code changes, commit, deployment or migration were made in the continuation; authorized UI business writes were restricted to the fictional Madar case.

Owner approved on 2026-09-10. Baseline HEAD: `8f719715e2b6c53e88c4530c81520c3807a5ab71`.

Existing changes preserved: progress/execution/walkthrough/gate/preflight evidence, next-env.d.ts and operational Madar grant SQL. No commit, push, deployment or database mutation in this implementation round.

## Work ownership

| Slice | Owner | Write scope | Evidence/state |
| --- | --- | --- | --- |
| Scope resolver and preference action | Lead | new auth/navigation/action helpers, helper unit tests, fixture membership mapping | Completed; 8 core + 18 session tests included in combined green run |
| Selector UI | Native worker Noether | new selector and its component test only | Completed; 11 component tests independently rerun. Wrong selected ID mutation caused an assertion failure; restored implementation passed |
| Route integration | Native worker Nietzsche | client portal routes/layout and route unit test | Completed; 25 route tests included in combined run; worker observed 13 failing tests before integration |
| Security review | Native worker Erdos | Read-only | Final source review: spec-compliant, no blocking finding. Five requested failure-path regressions added and reviewed; browser/backend acceptance not inferred from source review |

Native workers use inherited model and medium reasoning, fresh bounded context. Actual usage/cost unavailable. Project-delegate's disjoint parallel ownership and canonical evidence convention are used; no separate user tasks, external provider dispatch or credential payloads. Lead owns shared interfaces and combined verification. Existing requested parallelism takes precedence over generic sequential-worker guidance.

## Accepted implementation boundaries

- Preference is a user/tenant-bound, HTTP-only session cookie, never authorization.
- New scope mutation requires current active tenant/client membership, active client and scoped client-view role; failure does not write preference.
- All list surfaces read the shared selection. Explicit switch reloads client home to discard old forms/cache.
- Detail authorization resolves the actual deliverable client independently of cookie and retains the existing scoped detail/decision checks.
- No RLS, membership grants, approval workflow or SLA changes; no ADR needed for this bounded UI preference within the existing stack.

## Verification — 2026-09-10

- Coordinator combined run: 33 files, 216 tests passed (unit auth/approvals/navigation, two RLS simulator suites, client components). Simulators and mocked route boundaries are not hosted database isolation proof.
- Targeted ESLint passed with zero warnings. TypeScript no-emit check, production build and secret scan passed. Diff whitespace check passed; Git emitted only line-ending conversion warnings.
- Local production build served at `http://127.0.0.1:3377`, using the existing hosted UAT database and real test-approver authentication, not fixture mode. Browser switched Jidei to Madar and retained Madar after reload. Home showed zero visible work and three package lines; commercial page showed the Madar contract. Work and pending pages correctly remained empty before sending the internally approved deliverable.
- Visual desktop inspection found the selector and explicit open button usable in the sidebar. Dedicated mobile, keyboard-only and long-name acceptance remain unexecuted.
- Madar files page also showed no available files; no download or business-state write was performed. The temporary local server was stopped after the browser checks.
- Build-generated next-env.d.ts was restored to its pre-existing local dev-types reference to preserve the owner's unrelated change.

## Pending acceptance

Preview publication and verification on the hosted application remain pending: the local-browser check does not update the owner's existing Vercel link. No commit, push or deploy performed. Real backend forged-action/isolation tests, cross-tab/open-form acceptance, mobile checks, full client send/change/approval/SLA lifecycle and old owner tests are not passed by this slice. Overall UAT remains HOLD. SIL-45–48 are not fixed by this slice.
