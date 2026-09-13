# R-011A Stage 2B Execution Result and Next-Agent Prompts

Date: 2026-07-10

## Hosted execution result

Stage 2B was owner-approved within the Hadna-only UAT boundary. The reviewed hosted executor was inspected before execution. The permitted hosted dry-run/no-op rehearsal path is safe and value-free. The `apply_hosted` path remains blocked because no reviewed hosted executor is configured. No real hosted route, hosted database, hosted account, hosted role, or hosted file operation was used.

Result: `HOSTED DRY-RUN REHEARSAL PASS / HOSTED GAP CLOSURE NOT APPLIED / UAT DEPLOYMENT NOT RUN`.

## Mutation, no-op, and rollback counts

| Evidence category | Count |
|---|---:|
| Hosted mutations | 0 |
| Hosted account/role changes | 0 |
| Hosted approval/status/delivery mutations | 0 |
| Hosted file-content operations | 0 |
| Deploy/promotion/config changes | 0 |
| Non-Hadna data uses | 0 |
| Production acceptance decisions | 0 |
| Hosted dry-run categories rehearsed locally | 3 |
| Requested item count | 3 |
| Local setup records created by dry-run | 0 |
| No-op results | 3 would-create previews; no records persisted |
| Rollback actions | 0 |
| Rollback required | false |
| Sensitive values recorded | 0 |

## Audit evidence

The local injected audit harness recorded the allowed dry-run rehearsal event and denial-path evidence using action/reason/count metadata only. The executor requires append-only audit behavior for any future mutation. No hosted mutation audit event exists because no hosted mutation occurred.

The `apply_hosted` stop path was verified to deny when approval is absent and to remain denied when a reviewed hosted executor is unavailable. Unsafe file-operation, non-Hadna, over-count, scope, and authorization denials were also verified locally.

## Isolation findings

Local synthetic validation passed for the required categories:

| Category | Finding |
|---|---|
| Management | Tenant-scoped management reads are allowed only inside authorized scope. |
| Assigned team | Assigned internal users are limited to assigned client scope and do not gain client approval powers. |
| Client viewer | Viewer access is read-only and client-scoped; internal comments/files remain hidden. |
| Client approver | Approval controls are limited to assigned visible approval items; cross-client and unauthorized decisions are denied. |
| Unauthorized | Unassigned, cross-tenant, cross-client, and unsafe direct-access cases return safe denial/empty states without enumeration. |

These are local/synthetic findings, not hosted acceptance evidence. Hosted client-approver, waiting-approval, final-delivery/file-list, and hosted isolation proof remain open.

## Verification evidence

- Hosted-readiness integration checks: 3 files / 16 tests passed.
- RLS simulator isolation checks: 5 files / 15 tests passed.
- Authorization, isolation-proof, setup-authorization, and file-visibility checks: 4 files / 18 tests passed.
- Secret scan: passed; no high-confidence secrets found.
- `git diff --check`: passed.

## Remaining blockers

- No reviewed hosted executor exists for bounded apply.
- No real hosted client-approver evidence.
- No safe non-empty hosted waiting-approval evidence.
- No hosted final-delivery/file-list evidence.
- Hosted isolation across all required personas remains unproven.
- No separately approved UAT deployment target or team-access configuration target was supplied; therefore neither was changed.

## Explicit Production boundary

Production acceptance is not performed, implied, or granted. Deployment, promotion, production configuration, broad repair, non-Hadna data, direct SQL, hosted file content operations, and unrelated account/role changes remain forbidden.

---

## NEXT_AGENT_PROMPT

You are the internal team MVP trial and defect burn-down agent for Samawah. Work only inside the approved UAT boundary and only with Hadna-authorized, value-free evidence. Do not use Production, non-Hadna data, hosted file content, screenshots, direct identifiers, credentials, emails, URLs, tokens, row content, deliverable titles, or internal customer values.

Run a role-based UAT covering management, assigned team, client viewer, client approver, and unauthorized access. For each role verify allowed navigation, denied navigation, tenant/client scope, safe empty/denied states, and no cross-client enumeration. Verify the approval workflow end to end: team submission, internal review, internal change request, internal approval, client exposure only after internal approval, client approval, client change request, version binding, final delivery, closure, and append-only audit evidence for every state-changing action. Verify that client viewers cannot approve and assigned team members cannot approve or send directly to the client.

Verify SLA behavior: start on work activation, pause while waiting for the client, exclude client waiting time from team delay, resume on client change request, calculate at-risk/overdue correctly, and record pause/resume reasons in audit evidence. Verify files and final delivery using metadata/list visibility only: internal files remain invisible to clients, client-uploaded files reach only authorized team members, final-file lists appear only after the correct approval/delivery state, downloads are permission-checked, and no hosted file is opened, downloaded, uploaded, deleted, replaced, or content-read during this trial.

Verify internal-comment secrecy across client viewer and client approver journeys, including direct URL, refresh, browser back/forward, empty state, error state, and mobile state. Verify mobile RTL and accessibility: logical RTL reading order, no horizontal clipping, keyboard-visible focus, labels and roles, sufficient target sizes, modal/drawer escape behavior, reduced-motion respect where implemented, and usable approval/file controls at narrow viewport sizes.

Classify every defect as P0 blocker, P1 critical, P2 major, P3 normal, or P4 polish. P0 includes tenant leakage, internal-comment/file leakage, unauthorized approval/delivery, credential exposure, or any Production access. P1 includes broken core approval/SLA/isolation flow. P2 includes a material role, mobile, RTL, accessibility, or evidence defect without direct leakage. P3/P4 cover lower-impact usability and polish. Record a redacted defect ID, severity, affected role/category, reproducible condition, expected behavior, actual safe summary, owner, fix status, retest result, and evidence reference. Maintain a burn-down table with opened, fixed, retested, deferred, and remaining counts by severity. Do not close a P0/P1 without retest evidence.

Redact evidence before storage: retain only test name, role/category, state label, pass/fail, counts, denial reason, audit action label, and timing bucket if needed. Stop immediately on any tenant/client leakage, internal-content exposure, unexpected mutation, missing audit event, broken SLA pause, file-content request, non-Hadna data, Production route, credential/value exposure, unexplained scope expansion, or evidence that cannot be safely redacted. Escalate to the owner and leave the environment unchanged.

The trial is green only when all required role, approval, SLA, file-list, secrecy, mobile RTL, accessibility, audit, redaction, and regression checks pass; all P0/P1 defects are zero; remaining P2+ defects have explicit owner disposition; and no stop condition was triggered. Green UAT is not Production acceptance.

---

## EXPERT_REVIEW_AGENT_PROMPT

Perform an independent, findings-first review of the Samawah MVP candidate after all MVP gates are green. Review only the approved UAT/Hadna boundary and use value-free redacted evidence. Do not perform Production acceptance, deployment, promotion, hosted file-content operations, broad repair, non-Hadna access, direct SQL, or unapproved mutations.

Report findings before narrative, ordered P0 through P4, with file/test/evidence references that contain no identifiers or customer content. Review security and tenancy: authentication boundaries, tenant/client isolation, deny-by-default behavior, cross-tenant and cross-client enumeration resistance, authorization decisions, role transitions, management scope, assigned-team scope, client viewer scope, client approver scope, unauthorized scope, and RLS/server-side enforcement. Review audit integrity: append-only behavior, coverage for approval, change request, status, delivery, file visibility, SLA pause/resume, and denied actions; check that audit records are value-safe and reconstruct the decision path.

Review the complete approval workflow, internal approval prerequisite, version binding, client approval/change request, final delivery, rollback/no-op behavior, and all stop conditions. Review SLA start, pause while waiting for client, resume on change request, team-vs-client time accounting, at-risk/overdue logic, and reporting consistency. Review files and final delivery for metadata/list visibility, permission checks, internal-file secrecy, client-upload handling, final-state gating, and absence of content operations in the evidence.

Review UX and product behavior across management, assigned team, client viewer, client approver, and unauthorized categories. Check Arabic RTL hierarchy, terminology, navigation, mobile layouts, drawers/modals, loading/empty/denied/error/success states, keyboard access, focus visibility, semantics, labels, target sizes, contrast, and screen-reader usability. Review performance for avoidable waterfalls, oversized payloads, unbounded lists, repeated queries, and slow critical journeys without exposing payload values. Review unit, integration, component, E2E, RLS simulator/DB availability, negative authorization, SLA, approval, files, comments, redaction, secret scan, build, and release-check evidence; distinguish PASS, SKIPPED, BLOCKED, and NOT APPLICABLE honestly.

Review documentation and release readiness: spec/plan/tasks alignment, ADR coverage, AGENTS.md compliance, threat/tenant model, audit policy, rollback plan, UAT boundary, evidence redaction, residual-risk register, and explicit Production blockers. Verify no document overclaims hosted completion or Production readiness. Verify every remaining defect has severity, owner, disposition, and retest status. Stop and report a blocker for any leakage, missing audit, unauthorized workflow transition, broken SLA pause, unsafe file handling, missing RLS proof, unexplained skipped critical test, secret/value exposure, or boundary violation.

Conclude with: severity-ranked findings, confirmed strengths, evidence gaps, unresolved risks, release recommendation of GO/NO-GO FOR FURTHER UAT ONLY, and a separate explicit statement that Production acceptance is outside this review unless a new owner-approved package authorizes it.
