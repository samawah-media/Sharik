import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { ManagementExceptionDashboard } from "@/ui/management/exception-dashboard";

afterEach(() => cleanup());

const baseDeliverable = (
  overrides: Partial<DeliverableSafeSummary>,
): DeliverableSafeSummary => ({
  id: "d1",
  tenantId: "t1",
  clientId: "c1",
  name: "منشور الهوية",
  type: "post",
  status: "internally_approved",
  priority: "normal",
  ownerUserId: "u1",
  ownerDisplay: {
    userId: "u1",
    displayName: "أحمد العتيبي",
    roleLabel: "كاتب محتوى",
    initial: "أ",
  },
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 70,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-29T00:00:00.000Z",
  ...overrides,
});

describe("ManagementExceptionDashboard — X010-B-1", () => {
  it("renders Arabic status labels and never leaks raw technical enums", () => {
    const deliverables = [
      baseDeliverable({ id: "d1", status: "internally_approved" }),
      baseDeliverable({ id: "d2", status: "client_approved" }),
      baseDeliverable({ id: "d3", status: "delivered" }),
    ];

    render(
      <ManagementExceptionDashboard
        clientNames={{ c1: "شركة النور" }}
        deliverables={deliverables}
        now="2026-07-30T00:00:00.000Z"
      />,
    );

    const recent = screen.getByLabelText("أحدث القرارات والتسليمات");
    expect(within(recent).getByText(/معتمد داخليًا/)).toBeInTheDocument();
    expect(within(recent).getByText(/معتمد من العميل/)).toBeInTheDocument();
    expect(within(recent).getByText(/تم التسليم/)).toBeInTheDocument();

    expect(within(recent).queryByText(/^internally_approved$/)).not.toBeInTheDocument();
    expect(within(recent).queryByText(/^client_approved$/)).not.toBeInTheDocument();
    expect(within(recent).queryByText(/^delivered$/)).not.toBeInTheDocument();
  });

  it("makes recent-decision titles clickable links to the deliverables page", () => {
    const deliverables = [
      baseDeliverable({ id: "d1", name: "منشور الهوية", status: "delivered" }),
    ];

    render(
      <ManagementExceptionDashboard
        clientNames={{ c1: "شركة النور" }}
        deliverables={deliverables}
        now="2026-07-30T00:00:00.000Z"
      />,
    );

    const link = screen.getByRole("link", { name: "منشور الهوية" });
    expect(link).toHaveAttribute("href", "/clients/c1/deliverables");
  });
});
