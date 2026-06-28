export type DeliverableFormValues = {
  clientId: string;
  contractId: string;
  packageId: string;
  packageLineId: string;
  name: string;
  description: string;
  type: string;
  priority: string;
  ownerUserId: string;
  contributorUserIds: string;
  startDate: string;
  internalDueDate: string;
  clientDueDate: string;
  finalDueDate: string;
  reservedQuantity: string;
  requiresInternalApproval: string;
  requiresClientApproval: string;
  approvedExtra: string;
  extraReason: string;
  idempotencyKey: string;
};

export type DeliverableFormState =
  | { status: "idle"; message?: string; values?: Partial<DeliverableFormValues> }
  | { status: "error"; message: string; values?: Partial<DeliverableFormValues> };

export const initialDeliverableFormState: DeliverableFormState = {
  status: "idle",
};

export const deliverableFormError = ({
  message,
  values,
}: {
  message: string;
  values?: Partial<DeliverableFormValues>;
}): DeliverableFormState => ({
  status: "error",
  message,
  values,
});
