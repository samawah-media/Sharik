import type { ClientFormValues } from "@/modules/clients/client-form-state";

export const clientValuesFromFormData = (
  formData: FormData,
): ClientFormValues => ({
  name: String(formData.get("name") ?? ""),
  primaryContactName: String(formData.get("primaryContactName") ?? ""),
  primaryContactEmail: String(formData.get("primaryContactEmail") ?? ""),
  primaryContactPhone: String(formData.get("primaryContactPhone") ?? ""),
});

export const optionalFormValue = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

export const expectedRevisionFromFormData = (formData: FormData) => {
  const rawRevision = formData.get("expectedRevision");
  const revision =
    typeof rawRevision === "string" && rawRevision.trim().length > 0
      ? Number(rawRevision)
      : NaN;

  return Number.isInteger(revision) && revision > 0 ? revision : undefined;
};
