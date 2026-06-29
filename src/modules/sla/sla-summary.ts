import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { deriveSlaStatus, type SlaEvaluation } from "./sla-policy";

export type ManagementSlaSummary = {
  deliverableId: string;
  tenantId: string;
  clientId: string;
  name: string;
  deliverableStatus: DeliverableSafeSummary["status"];
  sla: SlaEvaluation;
};

export const toManagementSlaSummary = ({
  deliverable,
  now,
}: {
  deliverable: DeliverableSafeSummary;
  now: string | Date;
}): ManagementSlaSummary => ({
  deliverableId: deliverable.id,
  tenantId: deliverable.tenantId,
  clientId: deliverable.clientId,
  name: deliverable.name,
  deliverableStatus: deliverable.status,
  sla: deriveSlaStatus({
    status: deliverable.status,
    startDate: deliverable.startDate,
    internalDueDate: deliverable.internalDueDate,
    clientDueDate: deliverable.clientDueDate,
    finalDueDate: deliverable.finalDueDate,
    now,
  }),
});
