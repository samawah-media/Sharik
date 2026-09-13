export const r007PilotScopeFixture = {
  id: "r007_scope_local_fixture",
  baseline: "r006_hadna_internal_uat",
  dataBoundary: "synthetic_local_only",
  environmentBoundary: "local_or_fixture_only",
  status: "draft_readiness",
  blockedWithoutOwnerDecision: [
    "hosted_database_mutation",
    "non_hadna_customer_data",
    "production_candidate_review",
    "production_acceptance",
  ],
} as const;

export const r007ReadinessGateFixtures = [
  "deliverables",
  "sla",
  "approvals",
  "files",
  "permissions",
  "audit_logs",
  "client_portal",
  "release_evidence",
] as const;

export const r007PersonaFixtures = [
  "management_project_admin",
  "assigned_internal_user",
  "client_approver",
  "client_viewer",
  "unassigned_client_user",
] as const;

export const r007SafeWorkflowFixture = {
  deliverableStatus: "waiting_client_approval",
  slaStatus: "paused_waiting_client",
  approvalVersionState: "current_client_visible_version",
  fileVisibility: "client_visible",
  commentVisibility: "client_comment",
  auditRequired: true,
} as const;

