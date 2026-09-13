import { describe, expect, it } from "vitest";
import {
  clientValuesFromFormData,
  expectedRevisionFromFormData,
  optionalFormValue,
} from "@/server/actions/client-write-mappers";

describe("client write form mappers", () => {
  it("extracts only allowed client fields and ignores browser-supplied tenant scope", () => {
    const formData = new FormData();
    formData.set("name", " عميل جديد ");
    formData.set("primaryContactName", " مسؤولة التواصل ");
    formData.set("primaryContactEmail", "contact@example.test");
    formData.set("primaryContactPhone", "+966501234567");
    formData.set("tenantId", "tenant_b");

    expect(clientValuesFromFormData(formData)).toEqual({
      name: " عميل جديد ",
      primaryContactName: " مسؤولة التواصل ",
      primaryContactEmail: "contact@example.test",
      primaryContactPhone: "+966501234567",
    });
  });

  it("normalizes optional empty text to null for Supabase writes", () => {
    expect(optionalFormValue("   ")).toBeNull();
    expect(optionalFormValue(undefined)).toBeNull();
    expect(optionalFormValue("قيمة")).toBe("قيمة");
  });

  it("accepts only positive integer expected revisions", () => {
    const valid = new FormData();
    valid.set("expectedRevision", "3");

    const invalid = new FormData();
    invalid.set("expectedRevision", "0");

    expect(expectedRevisionFromFormData(valid)).toBe(3);
    expect(expectedRevisionFromFormData(invalid)).toBeUndefined();
  });
});
