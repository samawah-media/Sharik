export const R011A_GAP_SETUP_CATEGORIES = [
  "client_approver_category",
  "waiting_approval_item",
  "final_delivery_file_list",
] as const;

export type R011AGapSetupCategory =
  (typeof R011A_GAP_SETUP_CATEGORIES)[number];

export const R011A_GAP_SETUP_MODES = [
  "dry_run",
  "apply_local",
  "rollback_summary",
] as const;

export type R011AGapSetupMode = (typeof R011A_GAP_SETUP_MODES)[number];

export type R011AGapSetupOperation =
  | "fix_or_create_client_approver_category"
  | "create_or_expose_waiting_approval_item"
  | "create_or_expose_final_delivery_file_list_marker"
  | "open_hosted_file"
  | "download_hosted_file"
  | "upload_hosted_file"
  | "delete_hosted_file"
  | "direct_sql"
  | "approval_decision"
  | "broad_account_repair";

export type R011AApprovedScope = {
  tenantId: string;
  clientId: string;
  customerKey: string;
  approvedForR011A: boolean;
};

export type R011AOwnerApproval = {
  approved: boolean;
  hadnaOnly: boolean;
  maxCounts: Record<R011AGapSetupCategory, number>;
  evidenceValueFree: boolean;
  rollbackPlanApproved: boolean;
  hostedMutationAllowedInThisPass: boolean;
  productionAcceptanceAllowed: boolean;
};

export type R011AGapSetupRequestCategory = {
  category: R011AGapSetupCategory;
  operation: R011AGapSetupOperation | string;
  requestedCount: number;
  idempotencyKey: string;
};

export type R011AGapSetupRequest = {
  tenantId?: string;
  clientId: string;
  mode: R011AGapSetupMode;
  categories: R011AGapSetupRequestCategory[];
  hostedMutationRequested?: boolean;
  productionAcceptanceRequested?: boolean;
  fileContentOperationRequested?: boolean;
  nonHadnaDataRequested?: boolean;
};

export type R011AGapSetupDeniedReason =
  | "owner_approval_missing"
  | "owner_approval_incomplete"
  | "tenant_scope_mismatch"
  | "client_scope_mismatch"
  | "non_hadna_scope_denied"
  | "category_required"
  | "duplicate_category_request"
  | "category_not_approved"
  | "category_count_required"
  | "approved_count_exceeded"
  | "category_operation_mismatch"
  | "unsafe_file_operation_denied"
  | "hosted_mutation_denied"
  | "production_acceptance_denied"
  | "file_content_operation_denied"
  | "non_hadna_data_denied";

export type R011AGapSetupPlanStatus =
  | "ready_for_local_setup_preview"
  | "ready_for_local_setup_apply"
  | "ready_for_rollback_summary"
  | "denied";

export type R011AGapSetupPlannedOperation = {
  category: R011AGapSetupCategory;
  operation: R011AGapSetupOperation;
  requestedCount: number;
  idempotencyKey: string;
  auditAction:
    | "R011AClientApproverCategoryPrepared"
    | "R011AWaitingApprovalItemPrepared"
    | "R011AFinalDeliveryFileListPrepared";
  rollbackSummary: string;
};

export type R011AGapSetupPlan = {
  allowed: boolean;
  status: R011AGapSetupPlanStatus;
  operations: R011AGapSetupPlannedOperation[];
  deniedReasons: R011AGapSetupDeniedReason[];
  productionAcceptanceGranted: false;
  hostedMutationPermitted: false;
  directFileOperationPermitted: false;
};

export type R011AGapSetupPlanSummary = {
  allowed: boolean;
  status: R011AGapSetupPlanStatus;
  requestedCategoryCount: number;
  requestedItemCount: number;
  deniedReasonCount: number;
  hostedMutationPermitted: false;
  productionAcceptanceGranted: false;
  directFileOperationPermitted: false;
};

const expectedOperationByCategory: Record<
  R011AGapSetupCategory,
  R011AGapSetupOperation
> = {
  client_approver_category: "fix_or_create_client_approver_category",
  waiting_approval_item: "create_or_expose_waiting_approval_item",
  final_delivery_file_list: "create_or_expose_final_delivery_file_list_marker",
};

const auditActionByCategory: Record<
  R011AGapSetupCategory,
  R011AGapSetupPlannedOperation["auditAction"]
> = {
  client_approver_category: "R011AClientApproverCategoryPrepared",
  waiting_approval_item: "R011AWaitingApprovalItemPrepared",
  final_delivery_file_list: "R011AFinalDeliveryFileListPrepared",
};

const rollbackSummaryByCategory: Record<R011AGapSetupCategory, string> = {
  client_approver_category:
    "disable_or_remove_client_approver_category_through_audited_path_or_retain_as_owner_approved_uat_category",
  waiting_approval_item:
    "restore_prior_workflow_state_through_normal_audited_path_or_retain_as_owner_approved_uat_item",
  final_delivery_file_list:
    "hide_archive_or_remove_list_marker_without_file_content_operation",
};

const unsafeFileOperations = new Set<string>([
  "open_hosted_file",
  "download_hosted_file",
  "upload_hosted_file",
  "delete_hosted_file",
]);

const addReason = (
  reasons: R011AGapSetupDeniedReason[],
  reason: R011AGapSetupDeniedReason,
) => {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
};

const planStatusForMode = (mode: R011AGapSetupMode): R011AGapSetupPlanStatus => {
  if (mode === "apply_local") {
    return "ready_for_local_setup_apply";
  }

  if (mode === "rollback_summary") {
    return "ready_for_rollback_summary";
  }

  return "ready_for_local_setup_preview";
};

const validateApproval = ({
  ownerApproval,
  deniedReasons,
}: {
  ownerApproval?: R011AOwnerApproval;
  deniedReasons: R011AGapSetupDeniedReason[];
}) => {
  if (!ownerApproval?.approved) {
    addReason(deniedReasons, "owner_approval_missing");
    return;
  }

  if (
    !ownerApproval.hadnaOnly ||
    !ownerApproval.evidenceValueFree ||
    !ownerApproval.rollbackPlanApproved
  ) {
    addReason(deniedReasons, "owner_approval_incomplete");
  }

  if (ownerApproval.hostedMutationAllowedInThisPass) {
    addReason(deniedReasons, "hosted_mutation_denied");
  }

  if (ownerApproval.productionAcceptanceAllowed) {
    addReason(deniedReasons, "production_acceptance_denied");
  }
};

const validateScope = ({
  approvedScope,
  request,
  deniedReasons,
}: {
  approvedScope: R011AApprovedScope;
  request: R011AGapSetupRequest;
  deniedReasons: R011AGapSetupDeniedReason[];
}) => {
  if (request.tenantId && request.tenantId !== approvedScope.tenantId) {
    addReason(deniedReasons, "tenant_scope_mismatch");
  }

  if (request.clientId !== approvedScope.clientId) {
    addReason(deniedReasons, "client_scope_mismatch");
  }

  if (
    !approvedScope.approvedForR011A ||
    approvedScope.customerKey.toLowerCase() !== "hadna"
  ) {
    addReason(deniedReasons, "non_hadna_scope_denied");
  }
};

const validateBoundaryFlags = ({
  request,
  deniedReasons,
}: {
  request: R011AGapSetupRequest;
  deniedReasons: R011AGapSetupDeniedReason[];
}) => {
  if (request.hostedMutationRequested) {
    addReason(deniedReasons, "hosted_mutation_denied");
  }

  if (request.productionAcceptanceRequested) {
    addReason(deniedReasons, "production_acceptance_denied");
  }

  if (request.fileContentOperationRequested) {
    addReason(deniedReasons, "file_content_operation_denied");
  }

  if (request.nonHadnaDataRequested) {
    addReason(deniedReasons, "non_hadna_data_denied");
  }
};

export const buildR011AGapSetupPlan = ({
  approvedScope,
  ownerApproval,
  request,
}: {
  approvedScope: R011AApprovedScope;
  ownerApproval?: R011AOwnerApproval;
  request: R011AGapSetupRequest;
}): R011AGapSetupPlan => {
  const deniedReasons: R011AGapSetupDeniedReason[] = [];
  const plannedOperations: R011AGapSetupPlannedOperation[] = [];
  const requestedCategories = new Set<R011AGapSetupCategory>();

  validateApproval({ ownerApproval, deniedReasons });
  validateScope({ approvedScope, request, deniedReasons });
  validateBoundaryFlags({ request, deniedReasons });

  if (request.categories.length === 0) {
    addReason(deniedReasons, "category_required");
  }

  for (const requestedCategory of request.categories) {
    if (requestedCategories.has(requestedCategory.category)) {
      addReason(deniedReasons, "duplicate_category_request");
    }

    requestedCategories.add(requestedCategory.category);

    if (ownerApproval?.approved) {
      const approvedMaximum = ownerApproval.maxCounts[requestedCategory.category];

      if (approvedMaximum < 1) {
        addReason(deniedReasons, "category_not_approved");
      }

      if (requestedCategory.requestedCount > approvedMaximum) {
        addReason(deniedReasons, "approved_count_exceeded");
      }
    }

    if (requestedCategory.requestedCount < 1) {
      addReason(deniedReasons, "category_count_required");
    }

    const expectedOperation =
      expectedOperationByCategory[requestedCategory.category];

    if (requestedCategory.operation !== expectedOperation) {
      if (unsafeFileOperations.has(requestedCategory.operation)) {
        addReason(deniedReasons, "unsafe_file_operation_denied");
      } else {
        addReason(deniedReasons, "category_operation_mismatch");
      }
    }

    plannedOperations.push({
      category: requestedCategory.category,
      operation: expectedOperation,
      requestedCount: requestedCategory.requestedCount,
      idempotencyKey: requestedCategory.idempotencyKey,
      auditAction: auditActionByCategory[requestedCategory.category],
      rollbackSummary: rollbackSummaryByCategory[requestedCategory.category],
    });
  }

  const allowed = deniedReasons.length === 0;

  return {
    allowed,
    status: allowed ? planStatusForMode(request.mode) : "denied",
    operations: allowed ? plannedOperations : [],
    deniedReasons,
    productionAcceptanceGranted: false,
    hostedMutationPermitted: false,
    directFileOperationPermitted: false,
  };
};

export const summarizeR011AGapSetupPlan = (
  plan: R011AGapSetupPlan,
): R011AGapSetupPlanSummary => ({
  allowed: plan.allowed,
  status: plan.status,
  requestedCategoryCount: plan.operations.length,
  requestedItemCount: plan.operations.reduce(
    (count, operation) => count + operation.requestedCount,
    0,
  ),
  deniedReasonCount: plan.deniedReasons.length,
  hostedMutationPermitted: false,
  productionAcceptanceGranted: false,
  directFileOperationPermitted: false,
});
