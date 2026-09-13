import { describe, expect, it } from "vitest";
import {
  formatCommercialQuantity,
  getPackageBalanceIssues,
  paginateCommercialItems,
} from "@/modules/commercial/commercial-presentation";

describe("commercial presentation integrity", () => {
  it("flags fractional count units instead of presenting them as valid counts", () => {
    expect(formatCommercialQuantity(11.93, "منشور")).toEqual({
      text: "يحتاج تصحيحًا",
      issue: "fractional_count",
    });
    expect(formatCommercialQuantity(11.93, "ساعة").issue).toBeUndefined();
  });

  it("flags a negative remaining balance and preserves delivered quantity", () => {
    const balance = {
      committed: 4,
      reserved: 1,
      consumed: 5,
      released: 0,
      adjustments: 0,
      available: -2,
    };

    expect(getPackageBalanceIssues(balance, "منشور")).toEqual([
      "negative_available",
    ]);
    expect(formatCommercialQuantity(balance.consumed, "منشور").text).toBe("٥");
  });

  it("searches, filters, and bounds commercial list pages deterministically", () => {
    const result = paginateCommercialItems({
      items: [
        { name: "عقد الحضور الرقمي", status: "active" },
        { name: "عقد حملة موسمية", status: "completed" },
        { name: "عقد تشغيل شهري", status: "active" },
      ],
      query: "عقد",
      status: "active",
      page: 4,
      pageSize: 1,
      getSearchText: (item) => item.name,
      getStatus: (item) => item.status,
    });

    expect(result.totalItems).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(2);
    expect(result.items).toEqual([
      { name: "عقد تشغيل شهري", status: "active" },
    ]);
  });
});
