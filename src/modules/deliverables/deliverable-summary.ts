import type { DeliverableLifecycleStatus } from "./deliverable-rules";
import type { DeliverableSafeSummary } from "./deliverable-repository";

export type DeliverableClientSafeSummary = {
  name: string;
  description?: string;
  type: string;
  status: DeliverableLifecycleStatus;
  progressPercentage: number;
  reservation?: {
    reservedQuantity: number;
  };
};

export const toClientDeliverableSummary = (
  deliverable: DeliverableSafeSummary,
): DeliverableClientSafeSummary => ({
  name: deliverable.name,
  description: deliverable.description,
  type: deliverable.type,
  status: deliverable.status,
  progressPercentage: deliverable.progressPercentage,
  reservation: deliverable.reservation
    ? { reservedQuantity: deliverable.reservation.reservedQuantity }
    : undefined,
});

export const toManagementDeliverableSummary = (
  deliverable: DeliverableSafeSummary,
): DeliverableSafeSummary => ({ ...deliverable });
