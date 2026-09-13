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

The ignored local Glass workbook was inspected and imported without printing row contents, tracking the workbook, or inventing media, approvals, files, or copy. Redacted category/count evidence: 16 deliverables, 16 versions, 15 content-plan deliverables, 1 coordination deliverable, 7 imported tasks, 0 workbook approvals, and 0 workbook files. The source caption/body/design-link cells contain no meaningful review payload; earlier evidence that counted nine values was counting placeholder dashes and is invalid. The workbook contains one existing meaningful long-form suggestion. That exact suggestion was promoted without rewriting through an audited real-Auth version command, and exactly one current version is now waiting for owner review. Eight tasks remain assigned across 4 representative Glass deliverables. Two placeholder-only pending records were retired only after the guarded maintenance command proved that neither had client activity. Replays are idempotent.

## Verification evidence

- Local: lint, typecheck, unit 208, integration 112, component 72, RLS simulator 24, pgTAP 427, fixture E2E 126 passed with 6 configured skips, persistent E2E 4, secret scan, build, and `git diff --check` passed for application head `220ec0c`.
- Hosted read-only boundary/persona smoke: 27/27 passed across desktop Chromium, mobile Chromium, and Arabic RTL for management, account manager, writer, designer, unassigned negative user, client viewer, and client approver. Every pending card is checked independently for meaningful text, real media, or a non-empty client-visible file. The viewer has no decision, comment, or upload path; the approver has the expected actions; internal leakage, raw UUID, secrets, and visible mojibake are rejected.
- Hosted visual owner-review matrix: 9/9 passed for the seven desktop personas plus writer and approver mobile views. The inspected screenshots showed one real Glass text item, honest no-asset fallbacks, no unexpected horizontal overflow, and role-correct actions.
- Read-only smoke and the mutation lifecycle are now separate commands. No mutation lifecycle rerun was required for this owner-readiness pass; historical bounded lifecycle evidence remains valid and does not replace owner human acceptance. The current representative preparation used audited real-Auth personas and did not require a service-role key.

## Visual walkthrough summary

- Management: compact portfolio/work entry, scoped Glass/Hadna content only, readable owners and SLA/next-action cues.
- Assigned team: `مهامي` list first, one professional card per deliverable, optional board, and one focused drawer instead of repeated actions.
- Client viewer: calm RTL pending inbox with exact visible versions, honest no-asset fallback, real caption where present, and no decision controls.
- Client approver: the same safe preview plus clear approve/request-change controls; no internal comments, quality notes, tasks, files, or stale versions.

## Remaining gate

The owner must open the reviewed protected UAT Preview, complete the four human walkthroughs, and explicitly record PASS or defects:

1. Management opens `/work`, confirms readable Glass work, assignments, SLA/next action, and the single genuine review item.
2. Assigned writer/designer open `/work`, confirm their tasks are understandable and editable only within their authority.
3. Client viewer opens `/client/pending` and `/client/files`, confirms the real text is readable and that no decision, comment, upload, internal note, or internal file is exposed.
4. Client approver opens `/client/pending`, confirms the exact review text and decision controls, but does not submit a real decision during the inspection-only owner pass.

Use only the separately communicated reviewed UAT target and the ignored local persona file `.env.s015-team-uat.local`; do not copy credentials into Git or evidence. The Git-integrated PR Preview is attached to a different Vercel project/environment and is not UAT evidence. No Production promotion, merge, public signup, external-client invitation, or formal team invitation is authorized by this handoff.
