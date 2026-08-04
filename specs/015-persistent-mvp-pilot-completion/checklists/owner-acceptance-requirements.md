# Owner Acceptance Requirements Checklist: Spec 015

**Purpose**: Validate that the written B6B and B7 owner-acceptance requirements are complete, unambiguous, measurable, and safe before implementation and final UAT.
**Created**: 2026-08-04
**Feature**: [Spec 015](../spec.md)

**Note**: This checklist evaluates the quality of the requirements, not whether the implementation works.

## Requirement Completeness

- [ ] CHK001 Are the permitted source states, target state, actors, reason, audit event, SLA effect, client visibility, and version effect specified for post-approval internal reopen? [Completeness, Gap, S015-P2-124]
- [ ] CHK002 Are the Kanban transitions that may use drag, the transitions that require explicit commands, and the disabled-state explanation all documented? [Completeness, S015-P2-125]
- [ ] CHK003 Are invitation requirements defined for email, Arabic role, tenant scope, optional client scope, pending/resend/revoke states, duplicate invitation, and disabled membership? [Completeness, S015-P2-126]
- [ ] CHK004 Are UAT-data cleanup requirements defined for every mutable operational entity while explicitly preserving audit events and package ledger entries? [Completeness, S015-P2-128]
- [ ] CHK005 Are requirements for a trustworthy client-decision timestamp tied to the exact approval decision and version, with client-safe RLS reads? [Gap, S015-P2-117]

## Requirement Clarity and Consistency

- [ ] CHK006 Is “إعادة للتعديل الداخلي” distinguished clearly from client change requests, cancellation, archive, and cosmetic Kanban movement? [Clarity, S015-P2-124/125]
- [ ] CHK007 Are role names and invitation permissions consistent with the existing role/permission matrix and AGENTS.md least-privilege rules? [Consistency, S015-P2-126]
- [ ] CHK008 Is the decision to keep email outside V1, or the exact bounded email scope if approved, recorded without conflicting with the in-app notification requirement? [Decision, S015-P2-127]
- [ ] CHK009 Are the latest owner-note counts and statuses consistent across tasks, defect register, gate status, progress, and the walkthrough guide? [Consistency, Traceability]

## Acceptance Criteria Quality

- [ ] CHK010 Can owner acceptance be recorded independently for management, account manager, assigned team, client viewer, and client approver? [Measurability, X010-B-7]
- [ ] CHK011 Are PASS criteria measurable at 100% desktop zoom, mobile viewport, Arabic RTL, keyboard navigation, and intentional Kanban-only horizontal scrolling? [Acceptance Criteria, C1–C4]
- [ ] CHK012 Are P0/P1 stop conditions and P2 disposition rules explicitly defined for the owner walkthrough? [Acceptance Criteria, Defect policy]
- [ ] CHK013 Is final acceptance explicitly conditioned on the approved non-Production target, required migrations, exact reviewed HEAD, and real UAT Auth sessions? [Dependency, X010-B-7]

## Scenario and Edge-Case Coverage

- [ ] CHK014 Are success, denial, duplicate, stale-state, lost-response retry, and rollback/no-op scenarios documented for reopen and invitation commands? [Coverage, Recovery, S015-P2-124/126]
- [ ] CHK015 Are viewer/approver differences, Client A/B isolation, disabled membership, and internal comment/file/quality secrecy included in the written acceptance scope? [Coverage, Security]
- [ ] CHK016 Are upload success, failure, retry, cancel, reload recovery, image preview, video preview, and final-file download included in owner acceptance? [Coverage, Files]
- [ ] CHK017 Are empty, loading, read-failure, stale-data, and retry states required for the dashboard, client work, notifications, files, and Drawer? [Coverage, Exception Flow]
- [ ] CHK018 Are package reservation, delivery consumption, SLA pause/resume/completion, and idempotent replay included in the end-to-end acceptance criteria? [Coverage, Business Integrity]

## Dependencies and Boundaries

- [ ] CHK019 Are required UAT credentials and migrations identified without placing secrets, service-role keys, or real client data in the repo or browser? [Dependency, Security]
- [ ] CHK020 Are merge, Production promotion, public signup, external invitations, and real client data explicitly excluded until owner PASS? [Boundary, X010-B-7]

## Notes

- Check items off only when the associated requirement is explicit in Spec 015 or its approved evidence.
- Record unresolved wording as a defect or task before implementation.
