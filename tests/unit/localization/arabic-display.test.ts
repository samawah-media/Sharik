import { describe, expect, it } from "vitest";
import {
  formatArabicDate,
  formatArabicDateRange,
  formatArabicDateTime,
} from "@/modules/localization/arabic-display";

describe("Arabic display formatting", () => {
  it("formats valid dates consistently with the Gregorian calendar", () => {
    expect(formatArabicDate("2026-07-03")).toContain("يوليو");
    expect(formatArabicDate("2026-07-03")).not.toContain("2026-07-03");
    expect(formatArabicDateTime("2026-07-03T01:00:00.000Z")).toContain("يوليو");
  });

  it("returns calm Arabic copy for missing or invalid values", () => {
    expect(formatArabicDate()).toBe("غير محدد");
    expect(formatArabicDate("not-a-date")).toBe("تاريخ غير صالح");
    expect(formatArabicDateTime("not-a-date")).toBe("تاريخ غير صالح");
  });

  it("renders an explicit start-to-end Gregorian range for RTL surfaces", () => {
    const period = formatArabicDateRange("2026-07-01", "2026-07-31");

    expect(period).toContain("يوليو");
    expect(period).toContain("إلى");
    expect(period).not.toContain("2026-07-01");
  });
});
