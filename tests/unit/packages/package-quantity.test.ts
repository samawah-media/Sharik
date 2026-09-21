import { describe, expect, it } from "vitest";
import { isCountUnitLabel } from "@/modules/packages/package-quantity";

describe("package quantity units", () => {
  it.each(["منشور", "منشورات", "video", "Reports"])(
    "recognizes %s as a count unit",
    (unitLabel) => {
      expect(isCountUnitLabel(unitLabel)).toBe(true);
    },
  );

  it.each(["ساعة", "كيلومتر", "GB"])(
    "keeps %s available for fractional quantities",
    (unitLabel) => {
      expect(isCountUnitLabel(unitLabel)).toBe(false);
    },
  );
});
