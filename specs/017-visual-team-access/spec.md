# 017 — Visual team access

The Sharik administrator chooses an existing role and customer scope for an invitation or an existing internal assignment, and can review what that assignment means before submitting.

## Acceptance

- The team invitation uses four illustrated cards with keyboard-operable selection for the choices already accepted by the internal invitation action. The project and account manager cards use the Saudi portraits, and the writer and designer cards use the original studio portraits. Initially no role or client is selected.
- Selecting a role and one or more existing eligible clients updates an Arabic preview with the role, named scope and relevant capabilities. Submission still requires identity, one role and a nonempty scope.
- Existing member assignment editing uses the matching cards and preview, including workspace-scope assignments and the current handling of inactive client scopes. Update, removal, disabling, reason and audit behavior remain intact.
- The preview describes the selected assignment and its scope, including restrictions on work and transitions. It does not imply other assignments were evaluated or override any authorization check.
- Use Sharik's blue palette and existing icons with short selection feedback, a visible focus state, readable RTL cards on phones, and reduced-motion support.
- Keep existing action inputs, role keys, audited writes and database access policies. Use existing components and dependencies.
- Automated coverage checks role and scope selection, action payloads, and tablet or mobile layout and browser keyboard interaction.

## Out of scope

Custom permission grants, database changes, separately persisted job titles, and new onboarding flows for external customers or administrators. Existing roles and authorization rules continue to apply.
