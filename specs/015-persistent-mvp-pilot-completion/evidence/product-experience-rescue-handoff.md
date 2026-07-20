# Spec 015 product experience rescue handoff

## Decision

The corrected non-Production Preview is `HOSTED_TEAM_UAT_READY_FOR_OWNER_TRIAL`. The owner can now perform the final human walkthrough. It is not yet approved for a formal Samawah team or external-client invitation. X008-H, H008-H010, X007, and T032 remain open until the owner explicitly passes management, assigned-team, client-viewer, and client-approver journeys.

## Corrected experience

- Management and team use one short role-aware navigation with a visible profile and sign-out control. The team lands on `مهامي`; the board is optional.
- Each deliverable is rendered once through the shared content card. It shows a safe real preview when one exists, otherwise an explicit platform/type fallback, plus Samawah identity, client, channel, format, exact caption/body, version, status, owner, date, SLA, and next action.
- The universal drawer has one tabbed detail surface for content, versions, files, comments, quality, and activity.
- Client home, commercial summary, and pending inbox use the same persistent visibility definition. The viewer has no decision controls; the approver receives exact-version actions. Internal versions, tasks, quality checks, comments, and files remain hidden.
- Normal human-trial views filter Alpha/Beta, negative controls, and synthetic lifecycle residue. Raw UUIDs and technical scope names are not presented.

## Data evidence

The ignored local Glass workbook was inspected and imported without printing row contents, tracking the workbook, or inventing media, approvals, or files. Redacted category/count evidence: 16 deliverables, 16 versions, 15 content-plan deliverables, 1 coordination deliverable, 7 imported tasks, 0 workbook approvals, and 0 workbook files. Nine current versions contain a real caption/body. The bounded UAT preparation assigned 8 tasks across 4 representative Glass deliverables and staged 2 genuine current versions for client approval; at least one contains a real caption/body. Replays are idempotent.

## Verification evidence

- Local: lint, typecheck, unit 185, integration 112, component 67, RLS simulator 24, pgTAP 404, fixture E2E 126 passed with 6 configured skips, persistent E2E 4, secret scan, build, and `git diff --check` passed for the corrected application slice.
- Hosted read-only boundary/persona smoke: 27/27 passed across desktop Chromium, mobile Chromium, and Arabic RTL for management, account manager, writer, designer, unassigned negative user, client viewer, and client approver. The checks require real detail and caption/body, read-only viewer behavior, approver actions, no internal leakage, no raw UUID, and no visible mojibake.
- Read-only smoke and the mutation lifecycle are now separate commands. No mutation lifecycle rerun was required for this owner-readiness pass; historical bounded lifecycle evidence remains valid and does not replace owner human acceptance. The current representative preparation used audited real-Auth personas and did not require a service-role key.

## Visual walkthrough summary

- Management: compact portfolio/work entry, scoped Glass/Hadna content only, readable owners and SLA/next-action cues.
- Assigned team: `مهامي` list first, one professional card per deliverable, optional board, and one focused drawer instead of repeated actions.
- Client viewer: calm RTL pending inbox with exact visible versions, honest no-asset fallback, real caption where present, and no decision controls.
- Client approver: the same safe preview plus clear approve/request-change controls; no internal comments, quality notes, tasks, files, or stale versions.

## Remaining gate

The owner must open the reviewed protected UAT Preview, complete the four human walkthroughs, and explicitly record PASS or defects. Use only that reviewed UAT target; the Git-integrated PR Preview is attached to a different Vercel project/environment and is not UAT evidence. No Production promotion, merge, public signup, external-client invitation, or formal team invitation is authorized by this handoff.
