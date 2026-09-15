# Contract: V1 Workflow Readiness Surface

## Purpose

This contract defines the workflow behavior R-007 must make ready or verify before broader pilot or production-candidate review.

## Management and Team Surface

Management/project roles must be able to review:

- Client-scoped deliverables
- Current deliverable status and progress
- Work waiting for team
- Work waiting for management
- Work waiting for client
- SLA status and pause reason
- Approval state
- Client-visible/final file state
- Audit evidence for sensitive changes

Team roles must not gain management-only powers by default. Sending to client, final delivery, sensitive file visibility changes, SLA overrides, and package-affecting decisions require authorized server-side paths.

## Client Portal Surface

Client users must see only:

- Their assigned client scope
- Client-visible deliverables
- Client-visible comments
- Waiting approval items allowed for their role
- Package progress intended for client visibility
- Client-visible or final delivery files

Client users must not see:

- Internal comments
- Internal files
- Internal QA notes
- Management navigation
- Other clients
- Drafts or versions not approved for client visibility

## Approval Behavior

- Internal approval must happen before client exposure unless an owner-approved exception exists.
- Client approval must bind to a specific deliverable version.
- Stale or superseded versions must not be approved.
- Client viewer roles must not approve.
- Approval, changes requested, rejection, and delivery actions must create audit evidence.

## SLA Behavior

- SLA starts when the deliverable enters active work.
- SLA pauses when waiting for client approval.
- SLA resumes when the client requests changes or the item returns to the team.
- SLA completion/cancellation must be traceable.
- Client waiting time must not count against Samawah in readiness summaries.

## File Behavior

- Internal files remain internal-only regardless of deliverable visibility.
- Client-visible files require explicit visibility.
- Final delivery files require authorized final visibility.
- Downloads must be tenant/client scoped.
- File visibility changes must create audit evidence.

## Release Evidence Behavior

The final R-007 evidence package must include:

- Scope and baseline
- Tests run and pass/fail status
- Security and isolation outcomes
- Client portal mobile/RTL outcome
- Secret/evidence redaction confirmation
- Residual risks
- Out-of-scope items
- Next owner decision required
