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

  it("matches contract fields when the typed query omits harakat or tatweel", () => {
    // Production break: contract names saved with harakat or stretched
    // tatweel ("عقد الحُضور الرقمي") become unfindable when a manager
    // types "الحضور" on a standard keyboard.
    const result = paginateCommercialItems({
      items: [
        { name: "عقد الحُضور الرقمي", status: "active" },
        { name: "عقد حمـــلة موسمية", status: "active" },
      ],
      query: "الحضور",
      status: "all",
      page: 1,
      pageSize: 6,
      getSearchText: (item) => item.name,
      getStatus: (item) => item.status,
    });

    expect(result.totalItems).toBe(1);
    expect(result.items).toEqual([
      { name: "عقد الحُضور الرقمي", status: "active" },
    ]);
  });

  it("matches contract fields across alef and hamza spelling differences", () => {
    // Production break: "أعمال إضافية" never matches a query typed
    // "اعمال" because the bare-alef keyboard spelling differs from the
    // stored hamza carriers.
    const result = paginateCommercialItems({
      items: [
        { name: "أعمال إضافية", status: "active" },
        { name: "عقد تشغيل شهري", status: "active" },
      ],
      query: "اعمال اضافية",
      status: "all",
      page: 1,
      pageSize: 6,
      getSearchText: (item) => item.name,
      getStatus: (item) => item.status,
    });

    expect(result.totalItems).toBe(1);
    expect(result.items).toEqual([
      { name: "أعمال إضافية", status: "active" },
    ]);
  });

  it("matches package service labels with normalized Arabic search", () => {
    // Production break: package lines carry service labels like
    // "إدارة حسابات"; searching "ادارة حسابات" without hamza returns an
    // empty package list for the client.
    const result = paginateCommercialItems({
      items: [
        {
          name: "باقة الذهب",
          search: "باقة الذهب إدارة حسابات إعلانات",
          status: "active",
        },
        { name: "باقة الفضة", search: "باقة الفضة منشورات", status: "active" },
      ],
      query: "ادارة حسابات",
      status: "all",
      page: 1,
      pageSize: 6,
      getSearchText: (item) => item.search,
      getStatus: (item) => item.status,
    });

    expect(result.totalItems).toBe(1);
    expect(result.items).toEqual([
      {
        name: "باقة الذهب",
        search: "باقة الذهب إدارة حسابات إعلانات",
        status: "active",
      },
    ]);
  });

  it("keeps a whitespace-only query equivalent to an empty query", () => {
    // Production break: pasting stray spaces into the search box must not
    // hide every contract from the account manager.
    const result = paginateCommercialItems({
      items: [{ name: "عقد تشغيل شهري", status: "active" }],
      query: "   ",
      status: "all",
      page: 1,
      pageSize: 6,
      getSearchText: (item) => item.name,
      getStatus: (item) => item.status,
    });

    expect(result.totalItems).toBe(1);
  });
});
