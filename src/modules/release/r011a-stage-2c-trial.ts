import type { R008ApprovalJourneySummary } from "@/modules/approvals/r008-approval-journey";
import type { R008AuditCompletenessSummary } from "@/modules/audit/r008-audit-completeness";
import type { R008FinalDeliveryReadinessSummary } from "@/modules/files/r008-final-delivery-readiness";
import type { R008IsolationProofMatrix } from "@/modules/release/r008-isolation-proof";
import type { R008SlaReportingSummary } from "@/modules/sla/r008-sla-reporting";

export const R011A_STAGE_2C_ROLE_CATEGORIES = [
  "management_admin",
  "project_manager",
  "account_manager",
  "assigned_team",
  "client_viewer",
  "client_approver",
  "unauthorized_client",
] as const;

export const R011A_STAGE_2C_LIFECYCLE_STEPS = [
  "creation",
  "assignment",
  "execution",
  "internal_review",
  "internal_approval",
  "client_approval",
  "delivery",
  "closure",
] as const;

export const R011A_STAGE_2C_SLA_STATES = [
  "start",
  "at_risk",
  "overdue",
  "paused_waiting_client",
  "resume",
  "completed",
] as const;

export type R011AStage2CDefectSeverity = "P0" | "P1" | "P2" | "P3";
export type R011AStage2CDefectStatus =
  | "open"
  | "fixed"
  | "retested"
  | "deferred"
  | "accepted_for_internal_trial_only";

export type R011AStage2CDefect = {
  id: string;
  severity: R011AStage2CDefectSeverity;
  status: R011AStage2CDefectStatus;
  productionImpact:
    | "blocks_production"
    | "blocks_trial"
    | "trial_limitation"
    | "no_blocker";
};

export type R011AStage2CEvidenceStatus =
  | "passed"
  | "blocked"
  | "failed"
  | "skipped";

export type R011AStage2CRoleFinding = {
  category: (typeof R011A_STAGE_2C_ROLE_CATEGORIES)[number];
  status: R011AStage2CEvidenceStatus;
};

export type R011AStage2CInput = {
  roleFindings: readonly R011AStage2CRoleFinding[];
  lifecycleSteps: readonly (typeof R011A_STAGE_2C_LIFECYCLE_STEPS)[number][];
  slaStates: readonly (typeof R011A_STAGE_2C_SLA_STATES)[number][];
  approval: R008ApprovalJourneySummary;
  audit: R008AuditCompletenessSummary;
  finalDelivery: R008FinalDeliveryReadinessSummary;
  isolation: R008IsolationProofMatrix;
  sla: R008SlaReportingSummary;
  defects: readonly R011AStage2CDefect[];
  evidenceRedactionPassed: boolean;
  localVerificationPassed: boolean;
  localVerificationBlocked: readonly string[];
  hostedActions: {
    mutations: number;
    fileContentOperations: number;
    deployments: number;
    accessConfigurationChanges: number;
  };
  hostedCompletionApproved: boolean;
  productionAcceptanceApproved: boolean;
};

export type R011AStage2CGateStatus =
  | "green"
  | "yellow"
  | "red"
  | "blocked"
  | "not_authorized";

export type R011AStage2CGate = {
  gate: "roles" | "workflow" | "sla" | "files_comments" | "audit" | "evidence" | "verification" | "hosted" | "production";
  status: R011AStage2CGateStatus;
  blockers: string[];
};

export type R011AStage2CTrialResult = {
  gates: R011AStage2CGate[];
  defectCounts: Record<R011AStage2CDefectSeverity, number>;
  openP0P1Count: number;
  localInternalTrialReady: boolean;
  productionCandidateReady: false;
  productionAcceptanceGranted: false;
  hostedMutationCount: number;
  customerDataExposed: boolean;
};

const requiredSet = <T extends string>(values: readonly T[]) =>
  new Set<T>(values);

const countOpenDefects = (
  defects: readonly R011AStage2CDefect[],
  severity: R011AStage2CDefectSeverity,
) =>
  defects.filter(
    (defect) =>
      defect.severity === severity &&
      (defect.status === "open" || defect.status === "deferred"),
  ).length;

const greenOrBlocked = (
  gate: R011AStage2CGate["gate"],
  passed: boolean,
  blockers: string[],
): R011AStage2CGate => ({
  gate,
  status: passed ? "green" : "blocked",
  blockers: passed ? [] : blockers,
});

export const buildR011AStage2CTrialResult = (
  input: R011AStage2CInput,
): R011AStage2CTrialResult => {
  const missingRoles = R011A_STAGE_2C_ROLE_CATEGORIES.filter(
    (category) =>
      !input.roleFindings.some(
        (finding) =>
          finding.category === category && finding.status === "passed",
      ),
  );
  const coveredLifecycle = requiredSet(input.lifecycleSteps);
  const missingLifecycle = R011A_STAGE_2C_LIFECYCLE_STEPS.filter(
    (step) => !coveredLifecycle.has(step),
  );
  const coveredSla = requiredSet(input.slaStates);
  const missingSla = R011A_STAGE_2C_SLA_STATES.filter(
    (state) => !coveredSla.has(state),
  );
  const openP0P1Count =
    countOpenDefects(input.defects, "P0") +
    countOpenDefects(input.defects, "P1");
  const hostedMutationCount =
    input.hostedActions.mutations +
    input.hostedActions.fileContentOperations +
    input.hostedActions.deployments +
    input.hostedActions.accessConfigurationChanges;
  const isolationEvidenceComplete =
    input.isolation.scenarios.length > 0 &&
    input.isolation.scenarios.every((scenario) => {
      const visible = new Set(scenario.visibleClientIds);
      return (
        scenario.deniedClientIds.every((clientId) => !visible.has(clientId)) &&
        !(scenario.persona === "unassigned_client_user" && visible.size > 0)
      );
    });
  const customerDataExposed =
    !isolationEvidenceComplete || !input.isolation.clientDataLeakagePrevented;

  const gates: R011AStage2CGate[] = [
    greenOrBlocked(
      "roles",
      missingRoles.length === 0 &&
        isolationEvidenceComplete &&
        !customerDataExposed,
      missingRoles.length > 0
        ? ["role_category_evidence_missing"]
        : ["client_data_leakage_not_prevented"],
    ),
    greenOrBlocked(
      "workflow",
      missingLifecycle.length === 0 &&
        input.approval.currentVersionApprovalAllowed &&
        input.approval.staleVersionDenied &&
        input.approval.viewerDenied &&
        input.approval.approverScopeDenied,
      missingLifecycle.length > 0
        ? ["lifecycle_evidence_missing"]
        : ["approval_integrity_gap"],
    ),
    greenOrBlocked(
      "sla",
      missingSla.length === 0 &&
        input.sla.clientWaitingSeparated &&
        input.sla.atRiskCovered &&
        input.sla.overdueCovered &&
        input.sla.completedCovered,
      missingSla.length > 0 ? ["sla_state_missing"] : ["sla_summary_gap"],
    ),
    greenOrBlocked(
      "files_comments",
      input.finalDelivery.ready &&
        input.finalDelivery.hiddenInternalFileCount > 0 &&
        input.finalDelivery.authorizedFinalFileCount > 0,
      ["file_or_internal_content_visibility_gap"],
    ),
    greenOrBlocked("audit", input.audit.complete, ["audit_gap"]),
    greenOrBlocked("evidence", input.evidenceRedactionPassed, [
      "evidence_redaction_gap",
    ]),
    {
      gate: "verification",
      status:
        input.localVerificationPassed && input.localVerificationBlocked.length === 0
          ? "green"
          : input.localVerificationPassed
            ? "yellow"
            : "blocked",
      blockers: [...input.localVerificationBlocked],
    },
    {
      gate: "hosted",
      status:
        input.hostedCompletionApproved && hostedMutationCount === 0
          ? "green"
          : "not_authorized",
      blockers: input.hostedCompletionApproved
        ? []
        : ["hosted_completion_not_approved_for_stage_2c"],
    },
    {
      gate: "production",
      status: input.productionAcceptanceApproved ? "green" : "not_authorized",
      blockers: input.productionAcceptanceApproved
        ? []
        : ["production_acceptance_not_approved"],
    },
  ];

  const localInternalTrialReady =
    openP0P1Count === 0 &&
    hostedMutationCount === 0 &&
    gates
      .filter((gate) => gate.gate !== "hosted" && gate.gate !== "production")
      .every((gate) => gate.status === "green" || gate.status === "yellow");

  return {
    gates,
    defectCounts: {
      P0: countOpenDefects(input.defects, "P0"),
      P1: countOpenDefects(input.defects, "P1"),
      P2: countOpenDefects(input.defects, "P2"),
      P3: countOpenDefects(input.defects, "P3"),
    },
    openP0P1Count,
    localInternalTrialReady,
    productionCandidateReady: false,
    productionAcceptanceGranted: false,
    hostedMutationCount,
    customerDataExposed,
  };
};
