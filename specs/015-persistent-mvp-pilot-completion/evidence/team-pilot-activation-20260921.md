# Team pilot activation — 2026-09-21

## Authorized outcome and scope

Owner explicitly authorizes completing all prerequisites for a new team trial, including Preview publication and the five named accounts in the private owner guide. This is a bounded continuation of Spec015, not Production release. Use existing Next.js/Supabase architecture. Auth administrative key may be obtained and consumed in memory only, never saved or printed.

## Requirements and acceptance

- Create one isolated run-scoped UAT tenant and a clearly synthetic Alhussam training client. Do not expose legacy UAT/customer rows or consume any real contract.
- Provision the five exact owner-listed emails with individual passwords and active scoped memberships; one identity for Bashayer. Give the writer/designer/client only training-client access. Account existence, password authentication, application entry and authorization must each be verified.
- Complete the existing project_manager role in the application catalog, consistent with existing database authority. Project manager manages work, reviews internally and sends to client; it must not gain tenant ownership or user-access administration. Record the exact capability boundary before implementation.
- Use the existing audited workflow for training deliverables, versions, tasks, approvals, SLA and delivery. Preserve internal/client separation and cross-tenant denial.
- Reviewed source must pass local relevant tests and exact-source CI (including real DB/RLS and persistent browser) before migrations and Preview publication.
- Verify new Preview, all five role sessions, assignment, persistence/reload, client secrecy and a synthetic full lifecycle. Hand off a clean training work item, owner-only credentials and separate role guides with accurate result status.
- Human usability acceptance is reserved for the actual team; never claim it was performed by automation.

## Execution plan

1. Inspect source/CI, UAT identity/migration inventory and exact email existence (read-only).
2. Test-first complete bounded project-manager support and review the permission delta.
3. Run relevant local regression, commit/push reviewed files; await full CI.
4. Apply only reviewed pending forward migrations on sharik-uat, publish Preview from tested source.
5. Provision isolated training records and five accounts with auditable, idempotent run bindings; store only member passwords in ignored owner-only handoff, never the service key.
6. Authenticate each account through Auth and the application, exercise positive/negative workflow boundaries, inspect desktop/mobile.
7. Update guides, gate evidence and private credential handoff. Retain exact blockers if any.

## Rollback and stop boundary

Owner is rollback/stop authority; rollback window is this preparation and initial trial. Rollback disables only memberships created for this run and removes/reverts only its Preview alias. Preserve append-only audit and ledger; no legacy business deletion, no schema down migration. Stop on target mismatch, cross-tenant/internal leakage or uncertain partial mutation; report exact state. No emails or external invitations are sent by this task.

## Preflight evidence

- Source 598dec83950a4f1377adde8b8cddb7f2633c0a87 has successful full CI run35505897129.
- Supabase linked project sharik-uat is ACTIVE_HEALTHY, with four pending reviewed-source migrations (202609100003, 202609100004, 202609150001, 202609200001).
- Auth read confirms none of the five intended email identities currently exist.
- Existing working tree has only unrelated untracked .delegate_runs; preserve it.

## Ledger

Pending execution; no account provision, password delivery, migration, deployment or readiness is claimed by this plan.

## PM capability ruling — 2026-09-21

Use active tenant membership plus client-scoped project_manager. Permit assigned-client/commercial reads, ordinary deliverable creation/cancellation, status/version execution, task assignment, internal review/approval, send and delivery, and SLA summaries. Deny tenant-wide client discovery/creation, commercial setup/adjustment, approved-extra creation, client decisions, user invitations/role changes/suspension. Bashayer retains tenant administration. Existing admin may assign/invite a client-scoped PM; PM cannot administer users. Align foundational RLS and member-profile reads in one forward migration and document ADR014. Unknown DB roles fail closed instead of throwing. This follows existing operational management authority without changing workflow/SLA or tenancy model.

### Execution checkpoint — 2026-09-21

- Preflight Auth inventory PASS (exit0): five requested identities and three supplemental synthetic QA identities are absent. No accounts or hosted records mutated yet.
- PM local unit/integration/RLS-simulator 734 PASS, component418 PASS, TypeScript PASS, secret scan PASS. Independent source review found no production defect; authenticated PM workflow pgTAP coverage is being completed before CI.
- Normal local ESLint enumerated unrelated ignored `.superpowers` worktree copies (all 176 reported file paths under that directory); rerun against current source excluding only `.superpowers/**` and `.delegate_runs/**`. This is a local workspace verification adjustment, not an ESLint product-rule change. CI checkout does not contain those ignored copies.
- Vercel CLI is logged into a different personal account; browser session samawahpod-2242 has verified access to the existing samawahs-projects/shrik Preview. Existing Preview598dec8 is Ready. Publish only after new-source CI via a dedicated Preview branch in the already connected repository; do not change Production or the main work branch deployment hold.
- Operational provisioning reviewed and corrected: Auth preparation separated from single-transaction membership/profile/audit activation; exact run-owned rollback disables tenant/client memberships and roles, preserves Auth identities and append-only history. Credential manifest uses atomic writes in a private ignored directory with ACL limited to owner and sandbox identity. Administrative keys remain in stdin/process memory only. Rollback is terminal for this run; no automatic reactivation.

### TP21-2 local implementation and review

Project-manager catalog, scoped reads, ordinary creation, invitation and role-edit alignment are implemented with ADR014 and forward migration202609210001. Independent review compared all seven replaced SQL functions to latest prior bodies: only intended allowlist/scope deltas; no production defect found. Review requested authenticated PM workflow coverage, now present (36 pgTAP assertions including review/send/delivery and client-decision denial), still awaiting real database CI.

Final local checks: unit/integration/RLS simulator736 PASS, component418 PASS, TypeScript PASS, source ESLint PASS (excluding only unrelated ignored local worktree folders), secret scan PASS, production build PASS, diff check PASS. Hosted five-role access smoke authored and linted but NOT EXECUTED. No hosted account or data mutation, new migration application or new deployment yet.
