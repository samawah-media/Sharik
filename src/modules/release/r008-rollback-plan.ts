export const R008_ROLLBACK_AREAS = [
  "code",
  "hosted_configuration",
  "hosted_data_mutation",
  "file_visibility",
  "permissions_accounts",
  "uat_communication",
  "post_rollback_verification",
] as const;

export type R008RollbackArea = (typeof R008_ROLLBACK_AREAS)[number];

export type R008RollbackPlanItem = {
  area: R008RollbackArea;
  status: "documented" | "blocked_until_owner_approval";
  trigger: string;
  owner: string;
  steps: string[];
  verification: string[];
  communication?: string[];
};

export type R008RollbackPlan = {
  items: R008RollbackPlanItem[];
  hostedActionAllowed: false;
  productionAcceptanceGranted: false;
};

export type R008RollbackPlanValidation = {
  complete: boolean;
  missingAreas: R008RollbackArea[];
  incompleteAreas: R008RollbackArea[];
};

export type R008HostedRollbackReadinessDecision = {
  allowed: boolean;
  reason:
    | "ready_for_owner_approved_hosted_action"
    | "owner_approval_required_before_hosted_action"
    | "rollback_plan_incomplete";
  rollbackComplete: boolean;
};

export const buildR008RollbackPlan = (): R008RollbackPlan => ({
  hostedActionAllowed: false,
  productionAcceptanceGranted: false,
  items: [
    {
      area: "code",
      status: "documented",
      trigger: "A local or hosted candidate introduces a blocking regression.",
      owner: "release_owner",
      steps: [
        "return_to_last_accepted_branch_or_commit",
        "rerun_local_verification_gate",
        "record_safe_regression_summary",
      ],
      verification: ["lint_typecheck_tests_green", "no_production_acceptance"],
    },
    {
      area: "hosted_configuration",
      status: "blocked_until_owner_approval",
      trigger: "Hosted configuration is changed during a later approved UAT.",
      owner: "release_owner",
      steps: [
        "restore_previous_hosted_configuration",
        "remove_temporary_uat_settings",
        "verify_routes_return_to_prior_safe_state",
      ],
      verification: ["hosted_config_boundary_review", "safe_smoke_if_approved"],
    },
    {
      area: "hosted_data_mutation",
      status: "blocked_until_owner_approval",
      trigger: "Hosted data mutation is later approved and must be reversed.",
      owner: "data_owner",
      steps: [
        "use_owner_approved_mutation_log",
        "apply_reversal_or_compensating_records",
        "verify_tenant_client_scope_after_rollback",
      ],
      verification: [
        "mutation_scope_reconciled",
        "audit_evidence_preserved",
      ],
    },
    {
      area: "file_visibility",
      status: "documented",
      trigger: "A file visibility or final-delivery flag is incorrect.",
      owner: "release_owner",
      steps: [
        "revoke_client_visible_or_final_flag",
        "verify_internal_files_remain_hidden",
        "record_file_visibility_audit_summary",
      ],
      verification: [
        "internal_file_hidden",
        "final_file_authorization_rechecked",
      ],
    },
    {
      area: "permissions_accounts",
      status: "documented",
      trigger: "A role or account scope is broader than approved.",
      owner: "security_reviewer",
      steps: [
        "remove_or_disable_excess_role_scope",
        "verify_unassigned_and_viewer_denials",
        "record_security_denial_audit_summary",
      ],
      verification: ["role_negative_tests_green", "safe_denial_state_visible"],
    },
    {
      area: "uat_communication",
      status: "documented",
      trigger: "A UAT participant needs correction after rollback.",
      owner: "communication_owner",
      steps: [
        "notify_only_approved_uat_participants",
        "state_corrected_safe_scope_without_sensitive_values",
        "record_owner_visible_status",
      ],
      verification: ["communication_sent_to_allowed_categories"],
    },
    {
      area: "post_rollback_verification",
      status: "documented",
      trigger: "Rollback steps finish.",
      owner: "release_owner",
      steps: [
        "run_targeted_local_checks",
        "run_secret_scan",
        "run_redaction_review",
        "record_remaining_blockers",
      ],
      verification: [
        "targeted_checks_pass_or_blocked_recorded",
        "safe_evidence_only",
      ],
    },
  ],
});

const hasCompleteItemShape = (item: R008RollbackPlanItem) =>
  item.trigger.length > 0 &&
  item.owner.length > 0 &&
  item.steps.length > 0 &&
  item.verification.length > 0;

export const validateR008RollbackPlan = (
  plan: R008RollbackPlan,
): R008RollbackPlanValidation => {
  const areas = new Set(plan.items.map((item) => item.area));
  const missingAreas = R008_ROLLBACK_AREAS.filter((area) => !areas.has(area));
  const incompleteAreas = plan.items
    .filter((item) => !hasCompleteItemShape(item))
    .map((item) => item.area);

  return {
    complete: missingAreas.length === 0 && incompleteAreas.length === 0,
    missingAreas,
    incompleteAreas,
  };
};

export const evaluateR008HostedRollbackReadiness = ({
  plan,
  ownerApprovalRecorded,
}: {
  plan: R008RollbackPlan;
  ownerApprovalRecorded: boolean;
}): R008HostedRollbackReadinessDecision => {
  const validation = validateR008RollbackPlan(plan);

  if (!validation.complete) {
    return {
      allowed: false,
      reason: "rollback_plan_incomplete",
      rollbackComplete: false,
    };
  }

  if (!ownerApprovalRecorded) {
    return {
      allowed: false,
      reason: "owner_approval_required_before_hosted_action",
      rollbackComplete: true,
    };
  }

  return {
    allowed: true,
    reason: "ready_for_owner_approved_hosted_action",
    rollbackComplete: true,
  };
};
