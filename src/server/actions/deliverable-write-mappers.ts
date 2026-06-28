import type { DeliverableFormValues } from "@/modules/deliverables/deliverable-form-state";

export const deliverableValuesFromFormData = (
  formData: FormData,
): DeliverableFormValues => ({
  clientId: String(formData.get("clientId") ?? ""),
  contractId: String(formData.get("contractId") ?? ""),
  packageId: String(formData.get("packageId") ?? ""),
  packageLineId: String(formData.get("packageLineId") ?? ""),
  name: String(formData.get("name") ?? ""),
  description: String(formData.get("description") ?? ""),
  type: String(formData.get("type") ?? ""),
  priority: String(formData.get("priority") ?? "normal"),
  ownerUserId: String(formData.get("ownerUserId") ?? ""),
  contributorUserIds: String(formData.get("contributorUserIds") ?? ""),
  startDate: String(formData.get("startDate") ?? ""),
  internalDueDate: String(formData.get("internalDueDate") ?? ""),
  clientDueDate: String(formData.get("clientDueDate") ?? ""),
  finalDueDate: String(formData.get("finalDueDate") ?? ""),
  reservedQuantity: String(formData.get("reservedQuantity") ?? "1"),
  requiresInternalApproval: formData.get("requiresInternalApproval")
    ? "true"
    : "false",
  requiresClientApproval: formData.get("requiresClientApproval")
    ? "true"
    : "false",
  approvedExtra: String(formData.get("approvedExtra") ?? "false"),
  extraReason: String(formData.get("extraReason") ?? ""),
  idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
});

export const nullableFormValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

export const optionalFormValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
};

export const contributorIdsFromFormValue = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
