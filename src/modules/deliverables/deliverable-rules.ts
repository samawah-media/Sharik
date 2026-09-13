export type DeliverableLifecycleStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_internal_review"
  | "internal_changes_requested"
  | "internally_approved"
  | "waiting_client_approval"
  | "client_changes_requested"
  | "client_approved"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled"
  | "archived";

export type InitialDeliverableState = {
  status: "not_started";
  progressPercentage: 0;
};

export const activeKanbanStatuses = [
  "not_started",
  "in_progress",
  "ready_for_internal_review",
  "internal_changes_requested",
  "internally_approved",
  "waiting_client_approval",
  "client_changes_requested",
  "client_approved",
  "ready_for_delivery",
  "delivered",
] as const;

export type ActiveKanbanStatus = (typeof activeKanbanStatuses)[number];

export type CancellationDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "deliverable_already_cancelled"
        | "deliverable_already_progressed"
        | "expected_state_mismatch"
        | "reservation_not_available";
    };

export type StatusTransitionDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "target_status_not_on_board"
        | "protected_status_requires_command"
        | "unsafe_operational_transition"
        | "terminal_status_locked"
        | "internal_approval_required_before_client_waiting"
        | "client_approval_required_before_delivery";
    };

const progressByStatus: Record<DeliverableLifecycleStatus, number> = {
  not_started: 0,
  in_progress: 30,
  ready_for_internal_review: 50,
  internal_changes_requested: 45,
  internally_approved: 70,
  waiting_client_approval: 80,
  client_changes_requested: 65,
  client_approved: 90,
  ready_for_delivery: 95,
  delivered: 100,
  cancelled: 0,
  archived: 100,
};

export const genericOperationalStatuses = ["not_started", "in_progress"] as const;

const protectedWorkflowStatuses = new Set<DeliverableLifecycleStatus>([
  "ready_for_internal_review",
  "internal_changes_requested",
  "internally_approved",
  "waiting_client_approval",
  "client_changes_requested",
  "client_approved",
  "ready_for_delivery",
  "delivered",
]);

export const getProgressForDeliverableStatus = (
  status: DeliverableLifecycleStatus,
) => progressByStatus[status];

export const isActiveKanbanStatus = (
  status: DeliverableLifecycleStatus | string,
): status is ActiveKanbanStatus =>
  activeKanbanStatuses.includes(status as ActiveKanbanStatus);

export const canChangeDeliverableStatus = ({
  currentStatus,
  targetStatus,
  requiresClientApproval,
}: {
  currentStatus: DeliverableLifecycleStatus;
  targetStatus: DeliverableLifecycleStatus;
  requiresClientApproval: boolean;
}): StatusTransitionDecision => {
  if (!isActiveKanbanStatus(targetStatus)) {
    return { allowed: false, reason: "target_status_not_on_board" };
  }

  if (
    currentStatus === "delivered" ||
    currentStatus === "cancelled" ||
    currentStatus === "archived"
  ) {
    return { allowed: false, reason: "terminal_status_locked" };
  }

  if (protectedWorkflowStatuses.has(targetStatus)) {
    return { allowed: false, reason: "protected_status_requires_command" };
  }

  if (
    targetStatus === "not_started" &&
    currentStatus !== "in_progress" &&
    currentStatus !== "not_started"
  ) {
    return { allowed: false, reason: "unsafe_operational_transition" };
  }

  if (
    targetStatus === "in_progress" &&
    ![
      "not_started",
      "in_progress",
      "internal_changes_requested",
      "client_changes_requested",
    ].includes(currentStatus)
  ) {
    return { allowed: false, reason: "unsafe_operational_transition" };
  }

  if (
    targetStatus === "waiting_client_approval" &&
    currentStatus !== "internally_approved"
  ) {
    return {
      allowed: false,
      reason: "internal_approval_required_before_client_waiting",
    };
  }

  if (
    targetStatus === "delivered" &&
    requiresClientApproval &&
    currentStatus !== "client_approved"
  ) {
    return {
      allowed: false,
      reason: "client_approval_required_before_delivery",
    };
  }

  return { allowed: true };
};

export const createInitialDeliverableState = (): InitialDeliverableState => ({
  status: "not_started",
  progressPercentage: 0,
});

export const shouldReservePackageCapacity = ({
  approvedExtra,
}: {
  approvedExtra: boolean;
}) => !approvedExtra;

export const canCancelDeliverableReservation = (
  status: DeliverableLifecycleStatus,
): CancellationDecision => {
  if (status === "not_started") {
    return { allowed: true };
  }

  if (status === "cancelled") {
    return { allowed: false, reason: "deliverable_already_cancelled" };
  }

  return { allowed: false, reason: "deliverable_already_progressed" };
};

