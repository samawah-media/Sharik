import { describe, expect, it } from "vitest";
import { createPackageLineSchema } from "@/server/commands/packages/package-schemas";

describe("package line quantity validation", () => {
  it("rejects fractional quantities for count units", () => {
    expect(
      createPackageLineSchema.safeParse({
        serviceLabel: "منشورات",
        unitLabel: "منشور",
        committedQuantity: 11.93,
      }).success,
    ).toBe(false);
  });

  it("accepts fractional quantities for divisible service units", () => {
    expect(
      createPackageLineSchema.safeParse({
        serviceLabel: "استشارات",
        unitLabel: "ساعة",
        committedQuantity: 11.5,
      }).success,
    ).toBe(true);
  });
});
