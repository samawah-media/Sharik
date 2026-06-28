import type { ContractFormValues } from "@/modules/contracts/contract-form-state";

export const contractValuesFromFormData = (
  formData: FormData,
): ContractFormValues => ({
  clientId: String(formData.get("clientId") ?? ""),
  name: String(formData.get("name") ?? ""),
  reference: String(formData.get("reference") ?? ""),
  summary: String(formData.get("summary") ?? ""),
  periodStart: String(formData.get("periodStart") ?? ""),
  periodEnd: String(formData.get("periodEnd") ?? ""),
  status: String(formData.get("status") ?? "draft"),
  idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
});

export const nullableFormValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};
