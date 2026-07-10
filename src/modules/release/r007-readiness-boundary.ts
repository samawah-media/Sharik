export const R007_READINESS_AREAS = [
  "deliverables",
  "sla",
  "approvals",
  "files",
  "permissions",
  "audit_logs",
  "client_portal",
  "release_evidence",
] as const;

export type R007ReadinessArea = (typeof R007_READINESS_AREAS)[number];

export type R007BoundaryStatus =
  | "allowed"
  | "blocked"
  | "owner_decision_required"
  | "adr_required"
  | "separate_production_decision_required";

export type R007ReadinessGate = {
  area: R007ReadinessArea;
  status: "in_scope";
  requiredEvidence: string[];
};

export type R007BoundaryRequest = {
  activity: string;
  usesOnlySafeLocalFixtures?: boolean;
  reopensR006BugfixPhase?: boolean;
  hostedDatabaseMutation?: boolean;
  nonHadnaCustomerData?: boolean;
  broaderPilotExpansion?: boolean;
  productionCandidateReview?: boolean;
  productionAcceptance?: boolean;
  newDependency?: boolean;
  approvalWorkflowChange?: boolean;
  slaCalculationChange?: boolean;
  rlsModelChange?: boolean;
  ownerApprovalRecorded?: boolean;
  specKitScopeRecorded?: boolean;
  adrRecorded?: boolean;
};

export type R007BoundaryDecision = {
  allowed: boolean;
  status: R007BoundaryStatus;
  reasons: string[];
  requiredDecisions: string[];
  requiredEvidence: string[];
};

export const R007_BASELINE_BOUNDARY = {
  acceptedBaseline: "r006_hadna_internal_uat",
  r006Acceptance: "owner_accepted_internal_uat_only",
  reopensR006BugfixPhase: false,
  productionAcceptanceGranted: false,
  nonHadnaDataAuthorized: false,
  hostedMutationAuthorized: false,
} as const;

const gateEvidence: Record<R007ReadinessArea, string[]> = {
  deliverables: [
    "status_progress_mapping",
    "internal_approval_before_client_exposure",
  ],
  sla: ["client_waiting_pause", "resume_on_client_change_request"],
  approvals: ["version_bound_decisions", "stale_version_denial"],
  files: ["internal_file_hidden", "client_visible_file_authorization"],
  permissions: ["tenant_client_isolation", "role_negative_tests"],
  audit_logs: ["sensitive_transition_audit", "security_denial_audit"],
  client_portal: ["client_rtl_mobile", "assigned_and_unassigned_personas"],
  release_evidence: [
    "safe_summary_bundle",
    "secret_scan_outcome",
    "blocked_checks_and_residual_risks",
    "next_owner_decision",
    "production_acceptance_separate_owner_decision",
  ],
};

export const buildR007OwnerReadinessSummary = () => ({
  baseline: R007_BASELINE_BOUNDARY,
  gates: R007_READINESS_AREAS.map<R007ReadinessGate>((area) => ({
    area,
    status: "in_scope",
    requiredEvidence: gateEvidence[area],
  })),
  blockedScope: [
    "hosted_database_mutation_without_new_owner_approval",
    "non_hadna_data_without_new_owner_approval",
    "production_acceptance_without_separate_owner_decision",
  ],
  nextOwnerDecisions: [
    "confirm_r007_readiness_boundary",
    "decide_whether_to_authorize_broader_pilot_scope",
    "keep_production_acceptance_separate",
  ],
});

const unique = (values: string[]) => [...new Set(values)];

const boundaryReasonsFor = (request: R007BoundaryRequest) =>
  request.reopensR006BugfixPhase
    ? ["r006_is_accepted_baseline_not_bugfix_phase"]
    : [];

const ownerDecisionsFor = (request: R007BoundaryRequest) => {
  const requiredDecisions: string[] = [];

  if (request.hostedDatabaseMutation && !request.ownerApprovalRecorded) {
    requiredDecisions.push("owner_approval_for_hosted_database_mutation");
  }

  if (request.nonHadnaCustomerData && !request.ownerApprovalRecorded) {
    requiredDecisions.push("owner_approval_for_non_hadna_customer_data");
  }

  if (request.broaderPilotExpansion && !request.ownerApprovalRecorded) {
    requiredDecisions.push("owner_approval_for_broader_pilot_expansion");
  }

  if (request.productionCandidateReview && !request.ownerApprovalRecorded) {
    requiredDecisions.push("owner_approval_for_production_candidate_review");
  }

  return requiredDecisions;
};

const scopeEvidenceFor = (request: R007BoundaryRequest) => {
  const requiredEvidence: string[] = [];

  if (request.hostedDatabaseMutation && !request.specKitScopeRecorded) {
    requiredEvidence.push("spec_kit_scope_for_hosted_database_mutation");
  }

  if (request.nonHadnaCustomerData && !request.specKitScopeRecorded) {
    requiredEvidence.push("spec_kit_scope_for_non_hadna_customer_data");
  }

  return requiredEvidence;
};

const adrEvidenceFor = (request: R007BoundaryRequest) => {
  const requiredEvidence: string[] = [];

  if (request.newDependency && !request.adrRecorded) {
    requiredEvidence.push("adr_for_new_dependency");
  }

  if (request.approvalWorkflowChange && !request.adrRecorded) {
    requiredEvidence.push("adr_for_approval_workflow_change");
  }

  if (request.slaCalculationChange && !request.adrRecorded) {
    requiredEvidence.push("adr_for_sla_calculation_change");
  }

  if (request.rlsModelChange && !request.adrRecorded) {
    requiredEvidence.push("adr_for_rls_model_change");
  }

  return requiredEvidence;
};

const allowedDecisionFor = (
  request: R007BoundaryRequest,
  requiredEvidence: string[],
): R007BoundaryDecision => ({
  allowed: true,
  status: "allowed",
  reasons: [
    request.usesOnlySafeLocalFixtures
      ? "within_r007_readiness_boundary"
      : "requires_story_level_evidence_before_completion",
  ],
  requiredDecisions: [],
  requiredEvidence: unique(requiredEvidence),
});

export const evaluateR007ReadinessBoundary = (
  request: R007BoundaryRequest,
): R007BoundaryDecision => {
  const reasons = boundaryReasonsFor(request);
  const requiredDecisions = ownerDecisionsFor(request);
  const scopeEvidence = scopeEvidenceFor(request);
  const adrEvidence = adrEvidenceFor(request);
  const requiredEvidence = [...scopeEvidence, ...adrEvidence];

  if (request.productionAcceptance) {
    return {
      allowed: false,
      status: "separate_production_decision_required",
      reasons: unique([
        ...reasons,
        "r007_readiness_is_not_production_acceptance",
      ]),
      requiredDecisions: unique([
        ...requiredDecisions,
        "separate_production_acceptance_owner_decision",
      ]),
      requiredEvidence: unique(requiredEvidence),
    };
  }

  if (requiredDecisions.length > 0) {
    return {
      allowed: false,
      status: "owner_decision_required",
      reasons: unique(reasons),
      requiredDecisions: unique(requiredDecisions),
      requiredEvidence: unique(requiredEvidence),
    };
  }

  if (adrEvidence.length > 0) {
    return {
      allowed: false,
      status: "adr_required",
      reasons: unique(reasons),
      requiredDecisions: [],
      requiredEvidence: unique(adrEvidence),
    };
  }

  if (reasons.length > 0) {
    return {
      allowed: false,
      status: "blocked",
      reasons: unique(reasons),
      requiredDecisions: [],
      requiredEvidence: unique(requiredEvidence),
    };
  }

  return allowedDecisionFor(request, requiredEvidence);
};
