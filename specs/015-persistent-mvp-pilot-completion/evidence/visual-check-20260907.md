# Local visual verification — 2026-09-07

## X010-B-7C-16/17 shell and directory — browser PASS (fixture only)

Lead browser RED confirmed header 115px >112px and desktop directory tall
paired cards. Initial GREEN attempt: 39 passed, 4 client-mobile keyboard
reveal failures, 20 intentional profile skips, exit 1 (9.9m). Two-second
polling with unchanged bounds still failed all four: the focused Files link
remained partially offscreen. A client-link focus handler now reveals it
using nearest alignment. Tests never force scrolling. Final shell plus
client-inbox run: 19 passed, 20 intentional skips, exit 0 (7.8m).
Screenshot calls retain initial caret styling; no caret hydration warning
was observed in that final run. Earlier diagnosis is retained in the queue.

Directory 12/12 includes real-component 1440/375px geometry and denied actor
cases across three projects. Normal rows <=120px desktop / <=200px mobile;
long names/scopes wrap naturally without clipping or zero-opacity hiding.
Shell checks require <=200px chrome, <=112px utility strip, 44px controls,
keyboard reveal, notifications Escape/focus return and no document overflow.
Management fixture navigation is absent: its preservation is component-only,
not live browser proof. Desktop right rail and real client navigation tested.

Lead inspected and saved [desktop directory](visual-20260907/team-directory-desktop-d16.png),
[mobile directory](visual-20260907/team-directory-mobile-d16.png),
[client shell](visual-20260907/client-mobile-shell-d15.png) and
[team shell](visual-20260907/team-mobile-shell-d15.png).
No hosted, real-DB, exact-HEAD CI or human acceptance is implied.

## X010-B-7C-14 mobile filters and row entry — PASS (fixture only)

Fresh visual suite: 15/15 PASS, 4.9m, exit 0. Desktop/mobile/RTL exercise
pointer activation outside the visible drawer button, Enter/Space and focus
return; mobile search spans the group and priority/SLA share a row. Controls
are at least 44px and mobile filter group is at most 190px. Existing overflow,
drawer and Kanban checks remain. Lead inspected saved [mobile filters](visual-20260907/team-list-mobile-filters-d13.png)
and [desktop rows](visual-20260907/team-list-row-entry-d13.png).
Global header density remains outside this slice. Media load errors are
component-simulated, not proven via real binary/expiry browser scenarios.
No hosted, real-DB, exact-HEAD CI or owner acceptance is implied.

## X010-B-7C-13 compact My Work — PASS (fixture only)

Owner approved the compact-row design before implementation. Fresh full
visual-qa: **15 passed (3.9m), exit 0**, with `.last-run.json` passed and no
failed tests. The extended first scenario measures the first normal row
(maximum 220px desktop / 400px mobile), requires a visible thumbnail no larger
than 96px, and verifies search/priority filtering plus Enter/Escape/close focus
return. Existing Kanban, 44px controls, RTL, overflow and role checks remain.
This is a representative fixture bound, not a guarantee that arbitrary long
content always fits that height. Rows are not fixed-height or text-clipped.

Lead inspected and saved [desktop](visual-20260907/team-list-compact-desktop.png)
and [mobile](visual-20260907/team-list-compact-mobile.png) viewport screenshots.
Desktop now exposes multiple compact rows; mobile row metadata and action fit
without horizontal overflow. Mobile filters/header still occupy substantial
vertical space; that and other surfaces remain under S015-P2-132. My Work
drawer entry remains explicit-button-only, not whole-row activation.

First attempt: a priority-select test locator timed out after the keyboard
drawer/search steps had completed. Error snapshot showed the actual combobox;
lead corrected the test to query its role and stopped the first run after
1 failed/3 passed. No production change was used to satisfy this locator.
The successful retry above supersedes that attempt. Local APP_ENV=test and
loopback public placeholders only; no real DB, hosted writes or owner PASS.
Inherited image binary-load errors remain separately open as S015-P2-140.

## Post-D07-D09 verification — PASS

After the card, approval-panel and work-list date changes, the full fixture
visual-qa suite was rerun with additional assertions rejecting raw ISO date
text in team and management list definitions. Result: **15 passed (4.1m),
exit 0** across desktop/mobile/Arabic RTL. Scoped test ESLint passed. Same
explicit localhost fixture settings and approved Windows process-cleanup
execution route; no hosted or real-DB work. This supersedes the prior note
that browser results predate D07-D09, but does not establish human design
acceptance or persistence. The known density problem remains open.

## Latest full fixture-suite result: PASS

Fresh `npm run test:e2e -- tests/e2e/visual-qa.spec.ts` under approved scoped
escalation completed **15 passed (2.8m), exit 0**. The fresh `.last-run.json`
reports `passed` with no failed tests. APP_ENV=test, localhost Supabase URL,
dummy public key and loopback app/readiness ports were explicitly set.
No hosted endpoint, valid task-save or real database workflow was exercised.

This supersedes the earlier interrupted full-suite outcome below: the same
five scenarios now complete across desktop Chromium, Pixel 7 and Arabic RTL.
Coverage includes management/team list and Kanban, drawer tabs/files/quality
and focus return, invalid-title TaskForm feedback, viewer/approver presentation,
and empty/denied surfaces. The successful test names do not prove additional
loading/error or valid-save flows absent from the actual assertions.

Visual density remains owner-rejected/open despite passing accessibility and
overflow assertions. The inspected before screenshots and pending compact-row
proposal remain valid. Valid-save/retry browser, PostgreSQL RLS/recovery,
Preview, exact-HEAD CI and all owner acceptance still require separate proof.
Read-only Docker log-tail inspection did not establish engine readiness or
the cause of its startup issue; no reset or settings change was made.

## Latest authoritative follow-up: focused TaskForm run PASS

Shutdown was isolated without a product/library patch. Installed Playwright
on Windows rejects graceful webServer shutdown, invokes synchronous
`taskkill /pid <owned-child> /T /F`, then awaits process cleanup. A disposable
Node-child probe returned status 1 / `ERROR: Access denied` under restricted
execution (86ms). The same probe under approved escalation returned status 0
(396ms). Each probe targeted only its own child and cleaned up afterward.

The unchanged focused command `npm run test:e2e -- tests/e2e/visual-qa.spec.ts
-g X010-B-7C-12` was run under approved escalation with APP_ENV=test and
explicit localhost/dummy public Supabase values: **3 passed (1.2m), exit 0**;
fresh `test-results/.last-run.json` status `passed`, no failed tests.
This supersedes interrupted-run status for the focused invalid-title cases
only, not the older complete visual suite, valid-save/retry, real-DB or owner
gates. No production, dependency, wrapper or compiler setting was changed.

Handoff: if this Windows host prints passing cases but never exits, inspect
process-cleanup permission before rerunning. Use normal approval for a scoped
local run; do not patch node_modules, disable checks, count an interrupted run
as PASS, or kill unrelated processes. The earlier generated dev-type corruption
has a separate unproven cause; do not attribute it to this finding.

Scope: existing `tests/e2e/visual-qa.spec.ts`, desktop Chromium, Pixel 7,
and Arabic/Riyadh desktop. The coordinator forced APP_ENV=test and the
Supabase URL to local loopback with a dummy publishable key. No hosted
Supabase, Preview, invitations, or Production operations were performed.

## Execution result

All 12 test cases reported `ok`: management/team list and board, drawer
navigation/focus return, viewer/approver pending states, and denied/empty
states. Assertions covered RTL, selected 44px targets, unexpected page
overflow, synthetic-label leakage, and observed browser errors.

The runner remained alive during shutdown and never produced its final
summary or fresh `.last-run.json`. After bounded observation, the coordinator
interrupted the test session (exit 1) and verified that the observed runner,
wrapper, and Next parent processes had exited. **This is 12 observed passing
cases, not a successful completed suite run.** Investigate local webserver
teardown before claiming a clean browser gate. Existing HTML report was old
and is not evidence for this run.

The agent-browser CLI was unavailable; existing Playwright coverage and an
independent viewport screenshot were used as the browser verification fallback.

## Visual findings

- **S015-P2-132 remains open.** The team-list fixture contains 52 deliverables.
  At 1280px desktop, its full-page screenshot measured 1280 × 26968 pixels.
  The first article alone occupies roughly the remainder of a 900px viewport.
  A large placeholder/content card and duplicated metadata dominate the list;
  passing RTL/overflow tests does not establish usable scanning density.
- The inspected mobile drawer uses wrapping two-column tabs and a visible
  close control, with localized dates. This screenshot shows the activity
  section, **not** the newly corrected TaskForm; that form still needs direct
  browser/visual verification.
- Proposed bounded density direction was presented to the owner: compact
  operational rows, small thumbnail, title/client/owner/date/status/SLA, and
  the existing drawer for large previews. Owner approval is pending; no
  density implementation was started.

Saved fixture-only images:

- [Team list, before](visual-20260907/team-list-before.png)
- [Mobile drawer](visual-20260907/mobile-drawer.png)

## Local database availability

Initial elevated `docker ps` failed because the Docker Desktop Linux engine
pipe was absent. Docker Desktop was launched normally with a hidden window,
without reset/deletion. The subsequent read-only `docker ps` remained
unresponsive and was interrupted; no ready engine/container state was
confirmed. Real-DB verification was not run and remains pending. Do not infer
the old dockerInference error is still the cause without fresh evidence.

Human acceptance remains deferred: all 20 owner checklist items are unchecked.
# TaskForm browser follow-up — 2026-09-07

Added one focused X010-B-7C-12 case to `tests/e2e/visual-qa.spec.ts`, run across
desktop, Pixel 7 and Arabic RTL. It opens the actual management drawer task
tab, submits a one-character invalid title, checks the Arabic accessible error,
focus, retained value, touch targets, horizontal overflow and browser errors.
It never submits valid data and is not a persistence test. Test Guard review
kept this bounded to the previously unvisited form rather than duplicating
component save/retry tests.

Two initial attempts were interrupted while correcting test locators (the
management button is `فتح العمل`; the form `has` locator must be relative).
They are not product-failure or TDD RED evidence. Fresh focused ESLint passed.
The corrected run reported all three cases passing (5.8s / 4.6s / 5.0s), then
again hung during shutdown without a final success summary. It was interrupted
(exit 1); the complete browser-run gate remains OPEN. No Next/Playwright CLI
or wrapper process remained in the scoped post-stop process check.

Saved `visual-20260907/task-form-mobile.png` and `task-form-desktop.png`.
Lead inspected the mobile screenshot: Arabic error is directly below the
focused title and readable, with no horizontal overflow. The large drawer
tab/header area remains a density concern, not closed by this validation test.
Valid-save, transport-failure retry, real-DB and owner/Preview verification are
still pending at browser scope. Component evidence remains separate.
