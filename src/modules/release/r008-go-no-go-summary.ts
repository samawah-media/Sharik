import { R008_REQUIRED_HOSTED_OWNER_FIELDS } from "./r008-hosted-boundary";
import {
  buildR008RollbackPlan,
  validateR008RollbackPlan,
} from "./r008-rollback-plan";
import {
  buildR008SecurityChecklist,
  summarizeR008SecurityChecklist,
} from "./r008-security-checklist";

export const R008_GO_NO_GO_DECISION_OPTIONS = [
  "accept_r008_local_readiness_only",
  "request_fixes",
  "authorize_limited_hosted_read_only_uat",
  "authorize_limited_hosted_uat_mutation",
  "start_separate_production_candidate_package",
] as const;

export type R008GoNoGoDecisionOptionId =
  (typeof R008_GO_NO_GO_DECISION_OPTIONS)[number];

export type R008GoNoGoVerificationStatus =
  | "pending"
  | "passed"
  | "failed"
  | "blocked";

export type R008GoNoGoStatus =
  | "ready_for_owner_go_no_go_review"
  | "blocked_for_final_verification"
  | "blocked_for_fixes";

export type R008GoNoGoDecisionOption = {
  id: R008GoNoGoDecisionOptionId;
  label: string;
  ownerAction: string;
  allowedByCurrentPass: boolean;
  requiresHostedBoundary: boolean;
  grantsProductionAcceptance: false;
  requiredOwnerFields: readonly string[];
};

export type R008GoNoGoResidualRisk = {
  risk: string;
  status: "residual" | "blocked";
  ownerDecisionNeeded: string;
  blocksProductionAcceptance: true;
};

export type R008GoNoGoSummary = {
  status: R008GoNoGoStatus;
  safeEvidenceOnly: true;
  productionAcceptanceGranted: false;
  hostedMutationAuthorized: false;
  deployOrPromoteAuthorized: false;
  nonHadnaDataAuthorized: false;
  phase8VerificationStatus: R008GoNoGoVerificationStatus;
  passedEvidence: string[];
  blockedScope: string[];
  residualRisks: R008GoNoGoResidualRisk[];
  rollbackReady: boolean;
  securityControlsPassed: number;
  securityControlsBlocked: number;
  decisionOptions: R008GoNoGoDecisionOption[];
  exactNextOwnerDecisionRequired: string;
};

export const buildR008GoNoGoDecisionOptions =
  (): R008GoNoGoDecisionOption[] => [
    {
      id: "accept_r008_local_readiness_only",
      label: "accept R-008 local readiness only",
      ownerAction:
        "Confirm local readiness review only, with no hosted action or Production acceptance.",
      allowedByCurrentPass: true,
      requiresHostedBoundary: false,
      grantsProductionAcceptance: false,
      requiredOwnerFields: [],
    },
    {
      id: "request_fixes",
      label: "request fixes",
      ownerAction:
        "Name the local evidence gap or residual risk that must be fixed before another go/no-go review.",
      allowedByCurrentPass: true,
      requiresHostedBoundary: false,
      grantsProductionAcceptance: false,
      requiredOwnerFields: [],
    },
    {
      id: "authorize_limited_hosted_read_only_uat",
      label: "authorize limited hosted read-only UAT",
      ownerAction:
        "Approve a bounded read-only hosted UAT window with safe evidence rules.",
      allowedByCurrentPass: false,
      requiresHostedBoundary: true,
      grantsProductionAcceptance: false,
      requiredOwnerFields: R008_REQUIRED_HOSTED_OWNER_FIELDS,
    },
    {
      id: "authorize_limited_hosted_uat_mutation",
      label:
        "authorize limited hosted UAT mutation with named environment/data/rollback/duration/evidence",
      ownerAction:
        "Approve the exact hosted environment, data boundary, mutation plan, rollback, duration, and evidence rules.",
      allowedByCurrentPass: false,
      requiresHostedBoundary: true,
      grantsProductionAcceptance: false,
      requiredOwnerFields: R008_REQUIRED_HOSTED_OWNER_FIELDS,
    },
    {
      id: "start_separate_production_candidate_package",
      label: "start separate production-candidate package",
      ownerAction:
        "Open a new scoped package for production-candidate review; Production acceptance remains a later explicit decision.",
      allowedByCurrentPass: false,
      requiresHostedBoundary: false,
      grantsProductionAcceptance: false,
      requiredOwnerFields: [
        "separate_scope",
        "entry_criteria",
        "residual_risk_review",
      ],
    },
  ];

export const buildR008GoNoGoSummary = ({
  phase8VerificationStatus = "pending",
  blockedChecks = [],
}: {
  phase8VerificationStatus?: R008GoNoGoVerificationStatus;
  blockedChecks?: string[];
} = {}): R008GoNoGoSummary => {
  const rollbackValidation = validateR008RollbackPlan(buildR008RollbackPlan());
  const securitySummary = summarizeR008SecurityChecklist(
    buildR008SecurityChecklist(),
  );
  const finalVerificationBlocked =
    phase8VerificationStatus === "pending" ||
    phase8VerificationStatus === "blocked";
  const finalVerificationFailed = phase8VerificationStatus === "failed";

  return {
    status: finalVerificationFailed
      ? "blocked_for_fixes"
      : finalVerificationBlocked
        ? "blocked_for_final_verification"
        : "ready_for_owner_go_no_go_review",
    safeEvidenceOnly: true,
    productionAcceptanceGranted: false,
    hostedMutationAuthorized: false,
    deployOrPromoteAuthorized: false,
    nonHadnaDataAuthorized: false,
    phase8VerificationStatus,
    passedEvidence: [
      "controlled_pilot_execution_gates",
      "tenant_client_isolation_proof",
      "production_candidate_security_checklist",
      "hosted_uat_authorization_boundary",
      "client_approval_current_version_probe",
      "final_delivery_file_readiness",
      "audit_completeness_matrix",
      "sla_reporting_readiness",
      "rollback_plan",
      "safe_evidence_redaction_policy",
    ],
    blockedScope: [
      "hosted_database_mutation",
      "deploy_or_promote",
      "non_hadna_customer_data",
      "production_acceptance",
      ...blockedChecks,
    ],
    residualRisks: [
      {
        risk: "local_database_pgtap_not_required_unless_db_or_rls_changes_or_local_supabase_is_available",
        status: "residual",
        ownerDecisionNeeded:
          "review local DB evidence before any later hosted DB path",
        blocksProductionAcceptance: true,
      },
      {
        risk: "hosted_action_boundary_not_authorized",
        status: "blocked",
        ownerDecisionNeeded:
          "owner must name hosted environment, data boundary, scope, rollback, duration, and evidence rules",
        blocksProductionAcceptance: true,
      },
      {
        risk: "production_acceptance_not_granted",
        status: "blocked",
        ownerDecisionNeeded:
          "separate explicit Production acceptance decision required",
        blocksProductionAcceptance: true,
      },
    ],
    rollbackReady: rollbackValidation.complete,
    securityControlsPassed: securitySummary.passedCount,
    securityControlsBlocked: securitySummary.blockedCount,
    decisionOptions: buildR008GoNoGoDecisionOptions(),
    exactNextOwnerDecisionRequired:
      "Choose one R-008 outcome: accept local readiness only, request fixes, authorize limited hosted read-only UAT, authorize limited hosted UAT mutation with a complete boundary, or start a separate production-candidate package.",
  };
};
