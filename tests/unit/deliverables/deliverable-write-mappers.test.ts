import { describe, expect, it } from "vitest";
import { deliverableValuesFromFormData } from "@/server/actions/deliverable-write-mappers";

describe("deliverableValuesFromFormData", () => {
  it("preserves repeated contributor selections as one normalized form value", () => {
    const formData = new FormData();
    formData.append("contributorUserIds", "member-a");
    formData.append("contributorUserIds", "member-b");

    expect(deliverableValuesFromFormData(formData).contributorUserIds).toBe(
      "member-a,member-b",
    );
  });

  it("continues to normalize a legacy comma-separated contributor value", () => {
    const formData = new FormData();
    formData.set("contributorUserIds", "member-a, member-b");

    expect(deliverableValuesFromFormData(formData).contributorUserIds).toBe(
      "member-a,member-b",
    );
  });
});
