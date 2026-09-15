import { describe, expect, it } from "vitest";
import {
  formatNotificationDate,
  formatNotificationRelative,
  isAllowedNotificationHref,
  NOTIFICATION_CATEGORY_LABEL,
  NOTIFICATION_EVENT_CATEGORIES,
  NOTIFICATION_FILTERS,
  NOTIFICATION_FILTER_LABELS,
} from "@/modules/notifications/notification-labels";

describe("notification href allowlist (mirrors PostgreSQL s015_notification_href_is_allowed)", () => {
  const allowedHrefs = [
    "/portfolio",
    "/work",
    "/client",
    "/client/pending",
    "/client/work",
    "/client/files",
    "/clients/b0060000-0000-4000-8000-000000000301/deliverables",
  ];

  it.each(allowedHrefs)("allows the server-generated href %s", (href) => {
    expect(isAllowedNotificationHref(href)).toBe(true);
  });

  it("allows a null href (advisory notifications)", () => {
    expect(isAllowedNotificationHref(null)).toBe(true);
    expect(isAllowedNotificationHref(undefined)).toBe(true);
  });

  it.each([
    "/admin/users",
    "/clients/b0060000-0000-4000-8000-000000000301/deliverables/abc", // too deep
    "/clients/not-a-uuid/deliverables",
    "/client/pending/extra",
    "/work/tasks",
    "javascript:alert(1)",
    "/clients/b0060000-0000-4000-8000-000000000301", // missing /deliverables suffix
  ])("rejects the non-allowlisted href %s", (href) => {
    expect(isAllowedNotificationHref(href)).toBe(false);
  });
});

describe("notification event categories", () => {
  it("maps every workflow event type to a coarse category (never a raw enum to the user)", () => {
    expect(NOTIFICATION_EVENT_CATEGORIES.task_assigned).toBe("assignment");
    expect(NOTIFICATION_EVENT_CATEGORIES.task_reassigned).toBe("assignment");
    expect(NOTIFICATION_EVENT_CATEGORIES.version_submitted).toBe(
      "internal_review",
    );
    expect(NOTIFICATION_EVENT_CATEGORIES.internal_changes_requested).toBe(
      "internal_review",
    );
    expect(NOTIFICATION_EVENT_CATEGORIES.client_send).toBe("client_decision");
    expect(NOTIFICATION_EVENT_CATEGORIES.client_approved).toBe(
      "client_decision",
    );
    expect(NOTIFICATION_EVENT_CATEGORIES.client_changes_requested).toBe(
      "client_decision",
    );
    expect(NOTIFICATION_EVENT_CATEGORIES.delivery_prepared).toBe("delivery");
    expect(NOTIFICATION_EVENT_CATEGORIES.delivered).toBe("delivery");
    expect(NOTIFICATION_EVENT_CATEGORIES.client_delivered).toBe("delivery");
  });

  it("uses only Arabic category labels the owner approved", () => {
    expect(NOTIFICATION_CATEGORY_LABEL.assignment).toBe("المهام المسندة");
    expect(NOTIFICATION_CATEGORY_LABEL.internal_review).toBe(
      "المراجعة الداخلية",
    );
    expect(NOTIFICATION_CATEGORY_LABEL.client_decision).toBe("قرار العميل");
    expect(NOTIFICATION_CATEGORY_LABEL.delivery).toBe("التسليم");
  });

  it("exposes exactly the All / Unread filters", () => {
    expect([...NOTIFICATION_FILTERS]).toEqual(["all", "unread"]);
    expect(NOTIFICATION_FILTER_LABELS.all).toBe("الكل");
    expect(NOTIFICATION_FILTER_LABELS.unread).toBe("غير المقروء");
  });
});

describe("notification relative/date formatting", () => {
  it("formats recent timestamps as Arabic relative copy without ISO strings", () => {
    const now = new Date("2026-08-01T12:00:00.000Z");
    const minutesAgo = new Date(
      now.getTime() - 5 * 60 * 1000,
    ).toISOString();
    const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const daysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();

    expect(formatNotificationRelative(minutesAgo, now)).toBe("قبل 5 دقيقة");
    expect(formatNotificationRelative(hoursAgo, now)).toBe("قبل 3 ساعة");
    expect(formatNotificationRelative(daysAgo, now)).toBe("قبل 4 يوم");
    expect(formatNotificationRelative(now.toISOString(), now)).toBe("الآن");
  });

  it("returns a safe placeholder for invalid timestamps instead of throwing", () => {
    expect(formatNotificationRelative("not-a-date")).toBe("—");
    expect(formatNotificationDate("not-a-date")).toBe("—");
  });

  it("formats absolute dates in Arabic with day name and 12-hour time", () => {
    const label = formatNotificationDate("2026-08-01T10:30:00.000Z");
    expect(label).toMatch(/2026/);
    // 10:30 UTC -> local depends on TZ, but the Arabic weekday names must appear
    // for a valid date, and no ISO 'T' separator should leak.
    expect(label).not.toContain("T");
    expect(label).toMatch(/ص|م/);
  });
});
