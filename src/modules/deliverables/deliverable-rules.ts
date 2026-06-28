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

export type CancellationDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "deliverable_already_cancelled" | "deliverable_already_progressed";
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

export const getProgressForDeliverableStatus = (
  status: DeliverableLifecycleStatus,
) => progressByStatus[status];

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

