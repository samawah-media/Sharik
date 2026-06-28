# Operation Contracts: Deliverables Core

Date: 2026-06-28

These contracts describe server-side behavior for a full-stack web application. They are not public REST API specifications and do not define implementation code.

## Shared Requirements

- All operations require authenticated identity and active tenant membership.
- All target resources must resolve to the actor's allowed tenant/client scope.
- Browser-supplied identifiers identify intent only; they do not authorize access.
- Sensitive mutations require permission, state validation, idempotency/concurrency protection, audit, and ledger entries where applicable.
- Denials are safe and do not reveal whether an unauthorized resource exists.

## C-001: Create Contract

- Operation ID: `contract.create`
- Actor: tenant owner, tenant administrator, project manager.
- Scope: existing client in actor tenant/client authority.
- Input: client reference, contract name/reference, period, initial status, summary fields, idempotency key.
- Allow: actor has contract create authority for target client.
- Deny: missing scope, client outside actor scope, invalid period/status.
- Side effects: contract record, `ContractCreated` audit.
- Output: safe contract summary.
- Privacy: no other-client names or contract identifiers in errors.

## C-002: Create Package And Lines

- Operation ID: `package.create`
- Actor: tenant owner, tenant administrator, project manager.
- Scope: active/draft contract for target client.
- Input: package name/period, package line service labels, unit labels, committed quantities, idempotency key.
- Allow: actor has package create authority for target contract client.
- Deny: contract outside scope, archived/cancelled contract, negative quantity, missing package line.
- Side effects: package, package lines, commitment ledger entries, audit.
- Output: package summary and derived balance summary.
- Privacy: client users do not see internal creation notes.

## C-003: Adjust Package Commitment

- Operation ID: `package.adjust`
- Actor: tenant owner, tenant administrator, project manager.
- Scope: package line in actor client authority.
- Input: package line reference, adjustment quantity, reason, effective date, idempotency key.
- Allow: actor has adjustment authority and reason is present.
- Deny: adjustment would violate committed capacity policy or target is outside scope.
- Side effects: amendment/adjustment ledger entry and audit.
- Output: updated derived balance summary.
- Privacy: client summary may show adjusted totals but not internal reason unless marked client-visible.

## C-004: Create In-Package Deliverable

- Operation ID: `deliverable.create`
- Actor: tenant owner, tenant administrator, project manager, account manager.
- Scope: client, contract, package, and package line all in actor authority.
- Input: deliverable name, description, type, priority, owner, contributors, due dates, approval flags, package line, quantity, idempotency key.
- Allow: actor has deliverable create authority and selected package line has sufficient available capacity.
- Deny: insufficient capacity, inactive package/contract, cross-client package line, invalid owner scope.
- Side effects: deliverable, allocation, reservation ledger entry, audit.
- Output: deliverable summary with status `not_started`, progress `0%`, and reservation summary.
- Privacy: client-safe summary excludes internal fields and assignment internals not approved for display.

## C-005: Create Approved Extra Deliverable

- Operation ID: `deliverable.extra_create`
- Actor: tenant owner, tenant administrator, project manager.
- Scope: client in actor authority.
- Input: deliverable fields, extra reason, approval reference or decision note, idempotency key.
- Allow: actor has approved-extra authority and reason is present.
- Deny: missing approval reason, actor lacks authority, client outside scope.
- Side effects: deliverable marked approved extra, audit; no package reservation by default.
- Output: deliverable summary with approved-extra marker for management.
- Privacy: client summary may show the deliverable without internal overage reason.

## C-006: Cancel Not-Started Deliverable

- Operation ID: `deliverable.cancel_not_started`
- Actor: tenant owner, tenant administrator, project manager, account manager.
- Scope: deliverable in actor client authority.
- Input: deliverable reference, reason, expected revision/state, idempotency key.
- Allow: deliverable is `not_started` and actor has cancellation authority.
- Deny: deliverable already progressed, already cancelled, delivered, or outside scope.
- Side effects: deliverable cancelled, reservation release ledger entry when allocation exists, audit.
- Output: cancelled deliverable summary and updated balance summary.
- Idempotency: retry of an already-applied cancellation returns safe no-op or existing result without duplicate release.

## C-007: Read Commercial Summary

- Operation ID: `commercial.summary.read`
- Actor: management, assigned internal user, scoped client user.
- Scope: actor's allowed clients only.
- Input: optional client reference and filters.
- Allow: actor has view authority for the requested client scope.
- Deny: unauthorized client, missing membership, disabled membership.
- Output for management: contract/package/deliverable summaries plus internal-safe balance status.
- Output for client: simplified contract/package/deliverable summaries only.
- Privacy: no internal ledger reasons, internal audit, files, comments, approval internals, or other-client references.

## C-008: Read Deliverable Summary

- Operation ID: `deliverable.summary.read`
- Actor: management, assigned internal user, scoped client user.
- Scope: deliverable client scope.
- Input: deliverable reference.
- Allow: actor has view authority for deliverable's client.
- Deny: target outside scope or unauthorized resource.
- Output: role-filtered deliverable summary.
- Privacy: client users do not see internal tasks, comments, files, review/approval internals, or management-only actions.
