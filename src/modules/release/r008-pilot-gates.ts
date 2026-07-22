import { R008_REQUIRED_HOSTED_OWNER_FIELDS } from "./r008-hosted-boundary";

export const R008_PILOT_GATE_AREAS = [
  "r007_readiness_boundary",
  "local_owner_controlled_hardening",
  "tenant_client_isolation_proof",
  "hosted_database_mutation",
  "deploy_or_promote",
  "non_hadna_data",
  "production_candidate_review",
  "production_acceptance",
] as const;

export type R008PilotGateArea = (typeof R008_PILOT_GATE_AREAS)[number];

export type R008PilotGateStatus =
  | "passed"
  | "allowed"
  | "in_progress"
  | "blocked"
  | "owner_approval_required"
  | "separate_owner_decision_required";

export type R008PilotGate = {
  area: R008PilotGateArea;
  status: R008PilotGateStatus;
  safeSummary: string;
  requiredEvidence: string[];
  requiredOwnerApproval?: string;
};

export type R008PilotActionRequest = {
  action: string;
  localOnly?: boolean;
  dataBoundary?: "synthetic_or_hadna_authorized" | "non_hadna_customer_data";
  hostedDatabaseMutation?: boolean;
  hostedDeployOrPromotion?: boolean;
  nonHadnaCustomerData?: boolean;
  productionCandidateReview?: boolean;
  productionAcceptance?: boolean;
  ownerApprovalRecorded?: boolean;
  productionAcceptanceExplicitlyGranted?: boolean;
  preservesR006AcceptedInternalUat?: boolean;
  preservesR007ReadinessOnly?: boolean;
};

export type R008PilotActionDecision = {
  allowed: boolean;
  status:
    | "allowed"
    | "owner_approval_required"
    | "blocked"
    | "separate_production_acceptance_required";
  reasons: string[];
  requiredOwnerApprovals: string[];
  requiredEvidence: string[];
};

export type R008OwnerApprovalRecord = {
  requestedPath:
    | "local_only_hardening"
    | "hosted_read_only_uat"
    | "hosted_uat_mutation"
    | "deploy_or_promotion"
    | "production_acceptance_package";
  hostedDatabaseMutationAllowed: boolean;
  deployOrPromoteAllowed: boolean;
  nonHadnaCustomerDataAllowed: boolean;
  productionAcceptanceExplicit: boolean;
  environment?: string;
  dataBoundary?: string;
  readOnlyOrMutationScope?: string;
  rollbackPlan?: string;
  duration?: string;
  evidenceRules?: string;
};

export type R008OwnerApprovalEvaluation = {
  valid: boolean;
  missingFields: string[];
  productionAcceptanceGranted: boolean;
};

const gateEvidence: Record<R008PilotGateArea, string[]> = {
  r007_readiness_boundary: [
    "r007_readiness_only_acceptance",
    "r006_internal_uat_boundary_preserved",
  ],
  local_owner_controlled_hardening: [
    "local_only_scope",
    "synthetic_or_hadna_authorized_boundary",
  ],
  tenant_client_isolation_proof: [
    "client_a_cannot_see_client_b",
    "role_negative_checks",
    "safe_empty_denial",
  ],
  hosted_database_mutation: [
    "environment",
    "data_boundary",
    "mutation_plan",
    "rollback_plan",
  ],
  deploy_or_promote: ["owner_approval", "rollback_plan", "duration"],
  non_hadna_data: ["owner_approval", "data_boundary", "evidence_rules"],
  production_candidate_review: [
    "owner_approval",
    "security_checklist",
    "residual_risks",
  ],
  production_acceptance: [
    "separate_explicit_owner_decision",
    "accepted_residual_risks",
  ],
};

export const buildR008InternalGateReview = () => {
  const gates: R008PilotGate[] = [
    {
      area: "r007_readiness_boundary",
      status: "passed",
      safeSummary: "R-007 remains readiness-only and not Production acceptance.",
      requiredEvidence: gateEvidence.r007_readiness_boundary,
    },
    {
      area: "local_owner_controlled_hardening",
      status: "allowed",
      safeSummary: "Local-only implementation and safe evidence are allowed.",
      requiredEvidence: gateEvidence.local_owner_controlled_hardening,
    },
    {
      area: "tenant_client_isolation_proof",
      status: "in_progress",
      safeSummary: "US2 local synthetic isolation proof is the active scope.",
      requiredEvidence: gateEvidence.tenant_client_isolation_proof,
    },
    {
      area: "hosted_database_mutation",
      status: "blocked",
      safeSummary: "Hosted mutation is blocked without later owner approval.",
      requiredEvidence: gateEvidence.hosted_database_mutation,
      requiredOwnerApproval: "owner_approval_for_hosted_database_mutation",
    },
    {
      area: "deploy_or_promote",
      status: "blocked",
      safeSummary: "Deploy or promotion is blocked in this local-only pass.",
      requiredEvidence: gateEvidence.deploy_or_promote,
      requiredOwnerApproval: "owner_approval_for_deploy_or_promote",
    },
    {
      area: "non_hadna_data",
      status: "blocked",
      safeSummary: "Non-Hadna customer data remains unauthorized.",
      requiredEvidence: gateEvidence.non_hadna_data,
      requiredOwnerApproval: "owner_approval_for_non_hadna_customer_data",
    },
    {
      area: "production_candidate_review",
      status: "owner_approval_required",
      safeSummary: "Production-candidate review requires a later owner gate.",
      requiredEvidence: gateEvidence.production_candidate_review,
      requiredOwnerApproval: "owner_approval_for_production_candidate_review",
    },
    {
      area: "production_acceptance",
      status: "separate_owner_decision_required",
      safeSummary: "Production acceptance is a separate explicit decision.",
      requiredEvidence: gateEvidence.production_acceptance,
      requiredOwnerApproval:
        "separate_explicit_production_acceptance_owner_decision",
    },
  ];

  return {
    productionAcceptanceGranted: false,
    blockedGateCount: gates.filter((gate) =>
      ["blocked", "owner_approval_required", "separate_owner_decision_required"].includes(
        gate.status,
      ),
    ).length,
    gates,
  };
};

const unique = (values: string[]) => [...new Set(values)];

const ownerApprovalsFor = (request: R008PilotActionRequest) => {
  const approvals: string[] = [];

  if (request.hostedDatabaseMutation && !request.ownerApprovalRecorded) {
    approvals.push("owner_approval_for_hosted_database_mutation");
  }

  if (request.hostedDeployOrPromotion && !request.ownerApprovalRecorded) {
    approvals.push("owner_approval_for_deploy_or_promote");
  }

  if (request.nonHadnaCustomerData && !request.ownerApprovalRecorded) {
    approvals.push("owner_approval_for_non_hadna_customer_data");
  }

  if (request.productionCandidateReview && !request.ownerApprovalRecorded) {
    approvals.push("owner_approval_for_production_candidate_review");
  }

  return approvals;
};

const evidenceFor = (request: R008PilotActionRequest) => {
  const evidence: string[] = [];

  if (
    request.hostedDatabaseMutation ||
    request.hostedDeployOrPromotion ||
    request.nonHadnaCustomerData ||
    request.productionCandidateReview
  ) {
    evidence.push(...R008_REQUIRED_HOSTED_OWNER_FIELDS);
  }

  return evidence;
};

export const classifyR008PilotAction = (
  request: R008PilotActionRequest,
): R008PilotActionDecision => {
  const requiredOwnerApprovals = ownerApprovalsFor(request);
  const requiredEvidence = evidenceFor(request);

  if (request.productionAcceptance) {
    return {
      allowed: false,
      status: "separate_production_acceptance_required",
      reasons: ["r008_completion_is_not_production_acceptance"],
      requiredOwnerApprovals: unique([
        ...requiredOwnerApprovals,
        "separate_explicit_production_acceptance_owner_decision",
      ]),
      requiredEvidence: unique([
        ...requiredEvidence,
        "accepted_residual_risks",
      ]),
    };
  }

  if (requiredOwnerApprovals.length > 0) {
    return {
      allowed: false,
      status: "owner_approval_required",
      reasons: ["explicit_owner_approval_required_before_scope_expansion"],
      requiredOwnerApprovals: unique(requiredOwnerApprovals),
      requiredEvidence: unique(requiredEvidence),
    };
  }

  if (
    request.nonHadnaCustomerData ||
    request.dataBoundary === "non_hadna_customer_data"
  ) {
    return {
      allowed: false,
      status: "blocked",
      reasons: ["non_hadna_customer_data_not_authorized_for_current_pass"],
      requiredOwnerApprovals: ["owner_approval_for_non_hadna_customer_data"],
      requiredEvidence: unique(requiredEvidence),
    };
  }

  return {
    allowed: true,
    status: "allowed",
    reasons: [
      request.localOnly
        ? "local_only_within_r008_boundary"
        : "requires_story_level_evidence_before_completion",
      request.preservesR006AcceptedInternalUat
        ? "r006_internal_uat_acceptance_preserved"
        : "r006_boundary_must_remain_preserved",
      request.preservesR007ReadinessOnly
        ? "r007_readiness_only_boundary_preserved"
        : "r007_boundary_must_remain_readiness_only",
    ],
    requiredOwnerApprovals: [],
    requiredEvidence: unique(requiredEvidence),
  };
};

export const buildR008OwnerDecisionEvidence = () => ({
  currentApprovedPath: "local_only_hardening",
  safeEvidenceOnly: true,
  productionAcceptanceGranted: false,
  blockedBoundaries: [
    "hosted_database_mutation",
    "deploy_or_promote",
    "non_hadna_customer_data",
    "production_candidate_claim",
    "production_acceptance",
  ],
  nextDecisionOptions: [
    "continue_local_internal_pilot",
    "authorize_limited_hosted_uat",
    "request_fixes",
    "start_separate_production_acceptance_package",
  ],
} as const);

export const evaluateR008OwnerApprovalRecord = (
  record: R008OwnerApprovalRecord,
): R008OwnerApprovalEvaluation => {
  const requiresHostedBoundary =
    record.requestedPath !== "local_only_hardening" ||
    record.hostedDatabaseMutationAllowed ||
    record.deployOrPromoteAllowed ||
    record.nonHadnaCustomerDataAllowed;
  const missingFields: string[] = [];

  if (requiresHostedBoundary) {
    for (const [field, value] of [
      ["environment", record.environment],
      ["dataBoundary", record.dataBoundary],
      ["readOnlyOrMutationScope", record.readOnlyOrMutationScope],
      ["rollbackPlan", record.rollbackPlan],
      ["duration", record.duration],
      ["evidenceRules", record.evidenceRules],
    ] as const) {
      if (!value) {
        missingFields.push(field);
      }
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    productionAcceptanceGranted:
      record.requestedPath === "production_acceptance_package" &&
      record.productionAcceptanceExplicit,
  };
};
