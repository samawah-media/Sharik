export const R008_REQUIRED_HOSTED_OWNER_FIELDS = [
  "environment",
  "data_boundary",
  "read_only_or_mutation_scope",
  "rollback_plan",
  "duration",
  "evidence_rules",
] as const;

export type R008HostedOwnerField =
  (typeof R008_REQUIRED_HOSTED_OWNER_FIELDS)[number];

export type R008HostedOwnerApproval = {
  environment?: string;
  dataBoundary?: string;
  readOnlyOrMutationScope?: string;
  rollbackPlan?: string;
  duration?: string;
  evidenceRules?: string;
};

export type R008HostedBoundaryRequest = {
  action: string;
  localOnly?: boolean;
  hostedReadOnlyUat?: boolean;
  hostedDatabaseMutation?: boolean;
  hostedDeployOrPromotion?: boolean;
  nonHadnaCustomerData?: boolean;
  productionCandidateReview?: boolean;
  productionAcceptance?: boolean;
  ownerApproval?: R008HostedOwnerApproval;
};

export type R008HostedBoundaryStatus =
  | "local_only_allowed"
  | "owner_boundary_incomplete"
  | "owner_boundary_complete"
  | "production_acceptance_separate_decision";

export type R008HostedBoundaryDecision = {
  allowed: boolean;
  status: R008HostedBoundaryStatus;
  requiredOwnerFields: readonly R008HostedOwnerField[];
  missingOwnerFields: R008HostedOwnerField[];
  mutationAllowed: boolean;
  productionAcceptanceGranted: boolean;
  reasons: string[];
};

const ownerFieldValue = (
  approval: R008HostedOwnerApproval | undefined,
  field: R008HostedOwnerField,
) => {
  if (!approval) {
    return undefined;
  }

  if (field === "environment") {
    return approval.environment;
  }

  if (field === "data_boundary") {
    return approval.dataBoundary;
  }

  if (field === "read_only_or_mutation_scope") {
    return approval.readOnlyOrMutationScope;
  }

  if (field === "rollback_plan") {
    return approval.rollbackPlan;
  }

  if (field === "duration") {
    return approval.duration;
  }

  return approval.evidenceRules;
};

const missingOwnerFieldsFor = (approval?: R008HostedOwnerApproval) =>
  R008_REQUIRED_HOSTED_OWNER_FIELDS.filter(
    (field) => !ownerFieldValue(approval, field),
  );

const requestsHostedBoundary = (request: R008HostedBoundaryRequest) =>
  Boolean(
    request.hostedReadOnlyUat ||
      request.hostedDatabaseMutation ||
      request.hostedDeployOrPromotion ||
      request.nonHadnaCustomerData ||
      request.productionCandidateReview,
  );

export const classifyR008HostedBoundary = (
  request: R008HostedBoundaryRequest,
): R008HostedBoundaryDecision => {
  if (request.productionAcceptance) {
    return {
      allowed: false,
      status: "production_acceptance_separate_decision",
      requiredOwnerFields: R008_REQUIRED_HOSTED_OWNER_FIELDS,
      missingOwnerFields: missingOwnerFieldsFor(request.ownerApproval),
      mutationAllowed: false,
      productionAcceptanceGranted: false,
      reasons: ["production_acceptance_requires_separate_owner_decision"],
    };
  }

  if (request.localOnly && !requestsHostedBoundary(request)) {
    return {
      allowed: true,
      status: "local_only_allowed",
      requiredOwnerFields: [],
      missingOwnerFields: [],
      mutationAllowed: false,
      productionAcceptanceGranted: false,
      reasons: ["local_only_within_r008_boundary"],
    };
  }

  const missingOwnerFields = missingOwnerFieldsFor(request.ownerApproval);

  if (missingOwnerFields.length > 0) {
    return {
      allowed: false,
      status: "owner_boundary_incomplete",
      requiredOwnerFields: R008_REQUIRED_HOSTED_OWNER_FIELDS,
      missingOwnerFields,
      mutationAllowed: false,
      productionAcceptanceGranted: false,
      reasons: ["explicit_owner_boundary_required_before_hosted_action"],
    };
  }

  return {
    allowed: true,
    status: "owner_boundary_complete",
    requiredOwnerFields: R008_REQUIRED_HOSTED_OWNER_FIELDS,
    missingOwnerFields: [],
    mutationAllowed: Boolean(request.hostedDatabaseMutation),
    productionAcceptanceGranted: false,
    reasons: ["owner_boundary_complete_without_production_acceptance"],
  };
};
