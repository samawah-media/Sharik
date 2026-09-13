# X010-B-7C-22 CI checkpoint — 2026-09-12

## Scope and authority

Kanban scrolling/density, member lifecycle, and single-count-unit outputs.
The owner-approved CI recovery in `../plan.md` permits normal commits and
pushes to the current experiment branch for disposable database verification.
Automatic Vercel deployment remains disabled for that branch. No live database
migration, Preview publication, Production promotion, or owner acceptance is
established by this checkpoint.

## Runs

- Source `5aee71304d34cabedf72578994a7e3f5cd9ea86d`:
  [run 34693090582](https://github.com/samawah-media/Sharik/actions/runs/34693090582)
  failed in pgTAP after a successful clean database reset. The member-lifecycle
  CHECK assertion expected one column instead of the actual four-column CHECK;
  the older team-directory assertion expected an empty result rather than the
  explicit `42501` denial. The denial itself was retained.
- Source `5e1e2839bb2fd35f780068284bb7816f0e261eb7`:
  [run 34693396735](https://github.com/samawah-media/Sharik/actions/runs/34693396735)
  passed lint, TypeScript, unit/integration, clean database reset, RLS/pgTAP,
  and component gates. Browser result: 256 passed, 37 profile skips, 7 failed.
  Six failures were the older directory-density assertion expecting no controls;
  one was the mobile Kanban extending below the viewport. Later gates were skipped.
  It also fixes the Kanban nested-scroll test probe geometry and
  explicitly initializes pgTAP in the standalone single-count-unit test.

Follow-up: the lead caps board height using its actual viewport offset and
recomputes after resize/layout changes; the original mobile boundary assertion
is retained. A native Astra worker updated only the stale directory test to
exercise member-management disclosures and disabled-member read-only behavior,
retaining all density checks. Focused board component tests passed 10/10 locally.
The follow-up browser run remains required.

Source `4e77e8e`, [run 34694216356](https://github.com/samawah-media/Sharik/actions/runs/34694216356),
stopped at TypeScript because the delegated test used `toBeRequired`, which is
not a Playwright matcher. The lead replaced it with the actual required-attribute
assertion and reran full local TypeScript successfully. No browser result is
claimed for that run.

## Remaining gates

Local release gate on 2026-09-12 for the combined R22 assertion correction and
R23 copy/identity slice: ESLint PASS; unit79 files/501 tests PASS;
integration28/113 PASS; component45/350 PASS; secret scan found no
high-confidence secrets; production build and its TypeScript phase PASS. The
closed-details browser assertion still requires fresh CI execution. These local
results do not establish hosted or owner acceptance.

Latest source: `61da7985bcd1a00802e1846291cf769710cbccd1`,
[run 34694447510](https://github.com/samawah-media/Sharik/actions/runs/34694447510),
FAILED: 257 browser cases passed, 37 profile skips, six directory clipping
assertions failed on text inside a closed management disclosure. Kanban passed
all three profiles. A closed-details-specific filter is now prepared locally;
the zero-size check alone did not exclude retained layout boxes. Runtime rerun
and later persistent/build gates remain required. Run 34694342618 was deliberately cancelled after the
lead found that hidden text in collapsed controls also needed exclusion from
visible-row clipping measurements. Visible identity/scope assertions and density
limits are unchanged. Do not mark this source green.

Lead isolated Chromium reproduction (installed Chrome, no application/server):
after closing a details element, its hidden paragraph retained width1264 and
height18 while `closest('details:not([open])')` was true. This confirms why the
zero-size filter failed; the new filter targets closed-disclosure descendants.
This diagnostic is not a replacement for the full application browser suite.

- Successful complete CI, including PostgreSQL and runtime browser tests.
- Deliberate reviewed publication and applicable hosted verification.
- Owner role walkthrough, visual/UX acceptance, and unresolved older checks.

Local Docker remains unavailable at an update-recovery dialog. Local Playwright
aborted during server warm-up, before scenarios; neither attempt is a test pass.
