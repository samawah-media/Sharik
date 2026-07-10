export const R008_SECURITY_CONTROL_AREAS = [
  "permissions",
  "rls_server_authorization",
  "deny_by_default",
  "secret_handling",
  "evidence_redaction",
  "audit_completeness",
  "file_access",
  "approval_integrity",
  "rollback_readiness",
  "hosted_uat_boundary",
  "production_acceptance_boundary",
] as const;

export type R008SecurityControlArea =
  (typeof R008_SECURITY_CONTROL_AREAS)[number];

export type R008SecurityChecklistStatus =
  | "passed"
  | "blocked"
  | "failed"
  | "accepted_with_risk";

export type R008ResidualRiskSeverity = "low" | "medium" | "high" | "critical";

export type R008ResidualRisk = {
  severity: R008ResidualRiskSeverity;
  impact: string;
  scope: string;
  ownerDecisionNeeded: string;
  blocksProductionCandidate: boolean;
};

export type R008SecurityChecklistItem = {
  area: R008SecurityControlArea;
  control: string;
  status: R008SecurityChecklistStatus;
  evidence: string[];
  blockers: string[];
  residualRisks: R008ResidualRisk[];
  ownerDecisionNeeded?: string;
  safeEvidenceOnly: true;
};

export type R008SecurityChecklist = {
  items: R008SecurityChecklistItem[];
  safeEvidenceOnly: true;
  productionAcceptanceGranted: false;
};

export type R008SecurityChecklistSummary = {
  passedCount: number;
  blockedCount: number;
  failedCount: number;
  acceptedWithRiskCount: number;
  residualRiskCount: number;
  blockingAreas: R008SecurityControlArea[];
  productionCandidateReady: boolean;
  productionAcceptanceGranted: false;
};

const residualRisk = ({
  severity,
  impact,
  scope,
  ownerDecisionNeeded,
  blocksProductionCandidate,
}: R008ResidualRisk): R008ResidualRisk => ({
  severity,
  impact,
  scope,
  ownerDecisionNeeded,
  blocksProductionCandidate,
});

export const buildR008SecurityChecklist = (): R008SecurityChecklist => ({
  safeEvidenceOnly: true,
  productionAcceptanceGranted: false,
  items: [
    {
      area: "permissions",
      control:
        "Role permissions stay least-privilege across management, assigned internal, client approver, and client viewer categories.",
      status: "passed",
      evidence: [
        "r008_role_negative_tests",
        "r008_persona_scope_matrix",
      ],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "rls_server_authorization",
      control:
        "Sensitive paths retain server-side authorization with tenant/client scope and RLS as defense in depth.",
      status: "passed",
      evidence: [
        "r008_isolation_proof",
        "existing_command_authorization_review",
      ],
      blockers: [],
      residualRisks: [
        residualRisk({
          severity: "medium",
          impact: "Local pgTAP repeatability risk remains inherited from R-007.",
          scope: "local_database_verification_repeatability",
          ownerDecisionNeeded: "review_before_hosted_db_path",
          blocksProductionCandidate: false,
        }),
      ],
      safeEvidenceOnly: true,
    },
    {
      area: "deny_by_default",
      control:
        "Missing permission, wrong scope, stale version, or hidden content denies safely.",
      status: "passed",
      evidence: [
        "client_viewer_denial",
        "stale_version_denial",
        "unassigned_client_safe_state",
      ],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "secret_handling",
      control:
        "Evidence and verification avoid credentials, secret values, tokens, emails, screenshots, workbook content, links, captions, and deliverable titles.",
      status: "passed",
      evidence: ["secret_scan", "safe_evidence_policy"],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "evidence_redaction",
      control:
        "R-008 evidence is limited to safe categories, counts, statuses, role categories, route categories, command names, and non-sensitive summaries.",
      status: "passed",
      evidence: ["r008_evidence_policy_tests", "redaction_scan"],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "audit_completeness",
      control:
        "Sensitive approval, file, SLA, delivery, package-affecting, and denial transitions have audit evidence.",
      status: "passed",
      evidence: ["r008_audit_completeness_matrix"],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "file_access",
      control:
        "Internal files remain hidden and final delivery files require authorized client scope and final visibility.",
      status: "passed",
      evidence: ["r008_final_delivery_readiness"],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "approval_integrity",
      control:
        "Client approval is role-limited, current-version bound, stale-version denied, and audited.",
      status: "passed",
      evidence: ["r008_approval_journey_probe"],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "rollback_readiness",
      control:
        "Rollback covers code, hosted configuration, hosted data, file visibility, permissions/accounts, UAT communication, and post-rollback verification.",
      status: "passed",
      evidence: ["r008_rollback_plan"],
      blockers: [],
      residualRisks: [],
      safeEvidenceOnly: true,
    },
    {
      area: "hosted_uat_boundary",
      control:
        "Any hosted UAT action requires owner approval with environment, data boundary, action scope, rollback, duration, and evidence rules.",
      status: "blocked",
      evidence: ["owner_approval_template", "hosted_boundary_classifier"],
      blockers: [
        "hosted_database_mutation_blocked",
        "deploy_or_promote_blocked",
        "non_hadna_data_blocked",
      ],
      residualRisks: [
        residualRisk({
          severity: "high",
          impact: "Hosted action cannot proceed until the owner records the exact boundary and rollback acceptance.",
          scope: "hosted_uat_or_mutation",
          ownerDecisionNeeded: "owner_approval_for_hosted_uat_boundary",
          blocksProductionCandidate: true,
        }),
      ],
      ownerDecisionNeeded: "owner_approval_for_hosted_uat_boundary",
      safeEvidenceOnly: true,
    },
    {
      area: "production_acceptance_boundary",
      control:
        "Production acceptance remains separate from R-008 completion and requires an explicit owner decision.",
      status: "blocked",
      evidence: ["r008_owner_decision_evidence"],
      blockers: ["production_acceptance_not_granted"],
      residualRisks: [
        residualRisk({
          severity: "critical",
          impact: "R-008 evidence must not be interpreted as Production acceptance.",
          scope: "production_acceptance",
          ownerDecisionNeeded:
            "separate_production_acceptance_owner_decision",
          blocksProductionCandidate: true,
        }),
      ],
      ownerDecisionNeeded: "separate_production_acceptance_owner_decision",
      safeEvidenceOnly: true,
    },
  ],
});

export const summarizeR008SecurityChecklist = (
  checklist: R008SecurityChecklist,
): R008SecurityChecklistSummary => {
  const blockingAreas = checklist.items
    .filter(
      (item) =>
        item.status === "blocked" ||
        item.status === "failed" ||
        item.residualRisks.some((risk) => risk.blocksProductionCandidate),
    )
    .map((item) => item.area);

  return {
    passedCount: checklist.items.filter((item) => item.status === "passed")
      .length,
    blockedCount: checklist.items.filter((item) => item.status === "blocked")
      .length,
    failedCount: checklist.items.filter((item) => item.status === "failed")
      .length,
    acceptedWithRiskCount: checklist.items.filter(
      (item) => item.status === "accepted_with_risk",
    ).length,
    residualRiskCount: checklist.items.reduce(
      (count, item) => count + item.residualRisks.length,
      0,
    ),
    blockingAreas,
    productionCandidateReady: blockingAreas.length === 0,
    productionAcceptanceGranted: false,
  };
};
