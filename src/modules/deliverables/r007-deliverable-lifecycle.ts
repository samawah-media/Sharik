import type { DeliverableLifecycleStatus } from "./deliverable-rules";

export const r007WorkflowStepTargets = {
  approve_internally: "internally_approved",
  request_internal_changes: "internal_changes_requested",
  send_to_client: "waiting_client_approval",
  approve_as_client: "client_approved",
  request_client_changes: "client_changes_requested",
  deliver_after_client_approval: "delivered",
} as const satisfies Record<string, DeliverableLifecycleStatus>;

export type R007WorkflowStep = keyof typeof r007WorkflowStepTargets;
export type R007VersionState =
  | "draft"
  | "ready_for_internal_review"
  | "internally_approved"
  | "client_visible"
  | "superseded";
export type R007InternalApprovalState =
  | "pending"
  | "approved"
  | "changes_requested";
export type R007ClientApprovalState =
  | "not_sent"
  | "pending"
  | "approved"
  | "changes_requested";

export type R007WorkflowVersion = {
  id: string;
  state: R007VersionState;
  internalApprovalState: R007InternalApprovalState;
  clientApprovalState: R007ClientApprovalState;
  superseded: boolean;
};

export type R007WorkflowDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "version_superseded"
        | "internal_review_required"
        | "internal_approval_required_before_client_exposure"
        | "client_waiting_state_required"
        | "client_visible_version_required"
        | "client_decision_not_pending"
        | "client_approval_required_before_delivery";
    };

export const canPerformR007WorkflowStep = ({
  step,
  status,
  requiresClientApproval,
  version,
}: {
  step: R007WorkflowStep;
  status: DeliverableLifecycleStatus;
  requiresClientApproval: boolean;
  version: R007WorkflowVersion;
}): R007WorkflowDecision => {
  if (version.superseded || version.state === "superseded") {
    return { allowed: false, reason: "version_superseded" };
  }

  if (
    step === "approve_internally" ||
    step === "request_internal_changes"
  ) {
    return status === "ready_for_internal_review" &&
      version.state === "ready_for_internal_review"
      ? { allowed: true }
      : { allowed: false, reason: "internal_review_required" };
  }

  if (step === "send_to_client") {
    return status === "internally_approved" &&
      version.internalApprovalState === "approved"
      ? { allowed: true }
      : {
          allowed: false,
          reason: "internal_approval_required_before_client_exposure",
        };
  }

  if (step === "deliver_after_client_approval") {
    return !requiresClientApproval || status === "client_approved"
      ? { allowed: true }
      : { allowed: false, reason: "client_approval_required_before_delivery" };
  }

  if (status !== "waiting_client_approval") {
    return { allowed: false, reason: "client_waiting_state_required" };
  }

  if (version.state !== "client_visible") {
    return { allowed: false, reason: "client_visible_version_required" };
  }

  return version.clientApprovalState === "pending"
    ? { allowed: true }
    : { allowed: false, reason: "client_decision_not_pending" };
};

