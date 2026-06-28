import type { PackageFormValues } from "@/modules/packages/package-form-state";

export const packageValuesFromFormData = (
  formData: FormData,
): PackageFormValues => ({
  clientId: String(formData.get("clientId") ?? ""),
  contractId: String(formData.get("contractId") ?? ""),
  name: String(formData.get("name") ?? ""),
  periodStart: String(formData.get("periodStart") ?? ""),
  periodEnd: String(formData.get("periodEnd") ?? ""),
  status: String(formData.get("status") ?? "draft"),
  lineServiceLabel: String(formData.get("lineServiceLabel") ?? ""),
  lineDeliverableTypeHint: String(
    formData.get("lineDeliverableTypeHint") ?? "",
  ),
  lineUnitLabel: String(formData.get("lineUnitLabel") ?? ""),
  lineCommittedQuantity: String(
    formData.get("lineCommittedQuantity") ?? "",
  ),
  idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
});

export const nullableFormValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};
