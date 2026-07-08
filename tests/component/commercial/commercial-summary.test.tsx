import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type {
  ClientCommercialSummary,
  ManagementCommercialSummary,
} from "@/modules/commercial/commercial-summary";
import { ClientCommercialSummaryCards } from "@/ui/client/commercial-summary";
import { ManagementCommercialSummaryCards } from "@/ui/management/commercial-summary";

afterEach(() => cleanup());

const managementSummary: ManagementCommercialSummary = {
  audience: "management",
  clientId: "client_a",
  contracts: [
    {
      id: "contract_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      name: "عقد إدارة المحتوى",
      summary: "ملخص آمن.",
      status: "active",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
    },
  ],
  packages: [
    {
      id: "package_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      contractId: "contract_a",
      name: "باقة المحتوى",
      status: "active",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
      lines: [
        {
          id: "package_line_posts_a",
          tenantId: "tenant_a",
          clientId: "client_a",
          packageId: "package_a",
          serviceLabel: "منشورات",
          unitLabel: "منشور",
          committedQuantity: 4,
          status: "active",
          createdAt: "2026-06-28T00:00:00.000Z",
          updatedAt: "2026-06-28T00:00:00.000Z",
          balance: {
            committed: 4,
            reserved: 1,
            consumed: 0,
            released: 0,
            adjustments: 0,
            available: 3,
          },
        },
      ],
      balances: [
        {
          packageLineId: "package_line_posts_a",
          committed: 4,
          reserved: 1,
          consumed: 0,
          released: 0,
          adjustments: 0,
          available: 3,
        },
      ],
    },
  ],
  deliverables: [
    {
      id: "deliverable_a",
      tenantId: "tenant_a",
      clientId: "client_a",
      name: "منشور إطلاق الحملة",
      type: "post",
      status: "not_started",
      priority: "normal",
      contributorUserIds: [],
      clientDueDate: "2026-07-05",
      requiresInternalApproval: true,
      requiresClientApproval: true,
      progressPercentage: 0,
      approvedExtra: false,
      revision: 1,
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z",
      reservation: {
        packageLineId: "package_line_posts_a",
        reservedQuantity: 1,
      },
    },
  ],
};

const clientSummary: ClientCommercialSummary = {
  audience: "client",
  contracts: [
    {
      name: "عقد إدارة المحتوى",
      summary: "ملخص آمن.",
      status: "active",
    },
  ],
  packages: [
    {
      name: "باقة المحتوى",
      status: "active",
      lines: [
        {
          serviceLabel: "منشورات",
          unitLabel: "منشور",
          balance: {
            committed: 4,
            reserved: 1,
            consumed: 0,
            released: 0,
            adjustments: 0,
            available: 3,
          },
        },
      ],
    },
  ],
  deliverables: [
    {
      name: "منشور إطلاق الحملة",
      type: "post",
      status: "not_started",
      progressPercentage: 0,
      clientDueDate: "2026-07-05",
      reservation: {
        reservedQuantity: 1,
      },
    },
  ],
};

describe("commercial summary cards", () => {
  it("renders Arabic RTL management commercial summary cards", () => {
    render(<ManagementCommercialSummaryCards summary={managementSummary} />);

    const region = screen.getByRole("region", { name: "ملخص المتابعة للإدارة" });
    expect(region).toHaveAttribute("dir", "rtl");
    expect(within(region).getByText("عقد إدارة المحتوى")).toBeInTheDocument();
    expect(within(region).getAllByText("قيد العمل: 1")).toHaveLength(2);
    expect(within(region).getByText("المتبقي: 3")).toBeInTheDocument();
    expect(within(region).getByText("منشور إطلاق الحملة")).toBeInTheDocument();
    expect(within(region).getByText("التاريخ: 2026-07-05")).toBeInTheDocument();
    expect(within(region).queryByText("internal")).not.toBeInTheDocument();
    expect(within(region).queryByText("audit")).not.toBeInTheDocument();
  });

  it("renders client commercial summary cards without internal terminology or identifiers", () => {
    render(<ClientCommercialSummaryCards summary={clientSummary} />);

    const region = screen.getByRole("region", { name: "ملخص بوابة العميل" });
    expect(region).toHaveAttribute("dir", "rtl");
    expect(within(region).getByText("الباقة والمتبقي")).toBeInTheDocument();
    expect(within(region).getByText("المتبقي: 3")).toBeInTheDocument();
    expect(within(region).getByText("منشور إطلاق الحملة")).toBeInTheDocument();
    expect(within(region).getByText("2026-07-05")).toBeInTheDocument();
    expect(within(region).queryByText("tenant_a")).not.toBeInTheDocument();
    expect(within(region).queryByText("client_b")).not.toBeInTheDocument();
    expect(within(region).queryByText("ملاحظات داخلية")).not.toBeInTheDocument();
    expect(within(region).queryByText("سجل التدقيق")).not.toBeInTheDocument();
  });
});
