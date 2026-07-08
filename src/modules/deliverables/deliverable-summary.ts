import type { DeliverableLifecycleStatus } from "./deliverable-rules";
import type { DeliverableSafeSummary } from "./deliverable-repository";

export type DeliverableClientSafeSummary = {
  name: string;
  type: string;
  status: DeliverableLifecycleStatus;
  progressPercentage: number;
  clientDueDate?: string;
  finalDueDate?: string;
  reservation?: {
    reservedQuantity: number;
  };
};

export const toClientDeliverableSummary = (
  deliverable: DeliverableSafeSummary,
): DeliverableClientSafeSummary => ({
  name: deliverable.name,
  type: deliverable.type,
  status: deliverable.status,
  progressPercentage: deliverable.progressPercentage,
  clientDueDate: deliverable.clientDueDate,
  finalDueDate: deliverable.finalDueDate,
  reservation: deliverable.reservation
    ? { reservedQuantity: deliverable.reservation.reservedQuantity }
    : undefined,
});

export const toManagementDeliverableSummary = (
  deliverable: DeliverableSafeSummary,
): DeliverableSafeSummary => ({ ...deliverable });
