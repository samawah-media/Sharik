# Tasks

- [x] Implement illustrated Saudi role cards and the scoped preview with Arabic copy and accessible selection.
- [x] Connect the existing invitation and member assignment forms.
- [x] Update the affected component, browser and persistent interaction selectors. Verify invitation and assignment form submissions at the component boundary.
- [x] Run local build and application checks and inspect desktop and mobile presentation.

Local verification: 602 unit tests, 424 component tests, 25 simulated row-security tests, and 22 browser tests passed. Two desktop variants intentionally skip a phone-only case. The browser run covered Arabic RTL and keyboard selection, and direct 1440px and 375px checks confirmed that the Saudi artwork loads and the preview updates.

Production build, TypeScript, secret scan and lint passed. Lint excluded the generated local Floorplan export.

The persistent browser scenario has updated selectors. Running it requires the separate disposable local Supabase test environment.

The mixed-portrait revision passed a fresh production build, lint, secret scan, 15 invitation and membership component tests, and six focused desktop/mobile browser tests against a locally started fixture server. Visual verification checked the exact four portrait assignments at 1440px and 375px. The persistent Supabase acceptance test remains pending a disposable fixture database.
