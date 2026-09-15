import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { DeliverableContentCard } from "@/ui/deliverables/deliverable-content-card";

afterEach(cleanup);

const baseDeliverable: DeliverableSafeSummary = {
  id: "d1",
  tenantId: "t1",
  clientId: "c1",
  name: "مخرج اختبار",
  type: "post",
  status: "in_progress",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 30,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

type DueDates = Pick<
  DeliverableSafeSummary,
  "internalDueDate" | "clientDueDate" | "finalDueDate" | "plannedPublishDate"
>;

describe("S015-P2-136 deliverable card date display", () => {
  it.each<{ scenario: string; dates: DueDates; expected: string }>([
    {
      scenario: "internal precedes client, final and planned",
      dates: {
        internalDueDate: "2026-07-03",
        clientDueDate: "2026-07-04",
        finalDueDate: "2026-07-05",
        plannedPublishDate: "2026-07-06",
      },
      expected: "٣ يوليو ٢٠٢٦",
    },
    {
      scenario: "client precedes final and planned",
      dates: {
        clientDueDate: "2026-07-04",
        finalDueDate: "2026-07-05",
        plannedPublishDate: "2026-07-06",
      },
      expected: "٤ يوليو ٢٠٢٦",
    },
    {
      scenario: "final precedes planned",
      dates: { finalDueDate: "2026-07-05", plannedPublishDate: "2026-07-06" },
      expected: "٥ يوليو ٢٠٢٦",
    },
    {
      scenario: "planned is the last date source",
      dates: { plannedPublishDate: "2026-07-06" },
      expected: "٦ يوليو ٢٠٢٦",
    },
    {
      scenario: "timestamp crosses midnight in Riyadh",
      dates: { internalDueDate: "2026-07-03T21:00:00Z" },
      expected: "٤ يوليو ٢٠٢٦",
    },
    {
      scenario: "missing dates",
      dates: {},
      expected: "غير محدد",
    },
    {
      scenario:
        "invalid preferred date does not select a lower priority source",
      dates: { internalDueDate: "invalid-date", clientDueDate: "2026-07-04" },
      expected: "تاريخ غير صالح",
    },
    {
      scenario: "empty preferred date preserves nullish source precedence",
      dates: { internalDueDate: "", clientDueDate: "2026-07-04" },
      expected: "غير محدد",
    },
  ])("shows Arabic Gregorian date: $scenario", ({ dates, expected }) => {
    const deliverable = { ...baseDeliverable, ...dates };
    const original = structuredClone(deliverable);

    render(
      <DeliverableContentCard
        deliverable={deliverable}
        statusLabel="قيد التنفيذ"
        typeLabel="منشور"
      />,
    );

    expect(screen.getByText(expected, { selector: "dd" })).toBeVisible();
    expect(deliverable).toEqual(original);
  });
});

describe("shared deliverable card footer localization", () => {
  it.each<[string | undefined, string | undefined, string, string]>([
    ["Instagram", "Post", "منشور", "إنستغرام · منشور"],
    ["future_network", "future_format", "منشور", "قناة رقمية · صيغة مخصصة"],
    [undefined, "Post", "منشور", "منشور"],
    ["", "Post", "منشور", "منشور"],
    ["Instagram", undefined, "تقرير", "إنستغرام · تقرير"],
    [undefined, undefined, "تقرير", "تقرير"],
  ])(
    "localizes footer channel %s and format %s with type fallback %s",
    (channel, format, typeLabel, expected) => {
      render(
        <DeliverableContentCard
          deliverable={baseDeliverable}
          statusLabel="قيد التنفيذ"
          typeLabel={typeLabel}
          summary={{
            deliverableId: baseDeliverable.id,
            currentVersion: { id: "v1", versionNumber: 1, channel, format },
            counts: { versions: 1, tasks: 0, files: 0, comments: 0 },
          }}
        />,
      );

      expect(screen.getByText(expected, { selector: "dd" })).toBeVisible();
      expect(
        screen.queryByText(/Instagram|Post|future_network|future_format/),
      ).not.toBeInTheDocument();
    },
  );
});
