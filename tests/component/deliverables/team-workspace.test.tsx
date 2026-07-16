import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { TeamWorkspace } from "@/ui/management/team-workspace";

afterEach(() => cleanup());

const waitingDeliverable: DeliverableSafeSummary = {
  id: "deliverable_waiting",
  tenantId: "tenant_a",
  clientId: "client_a",
  name: "أدوات التسويق",
  type: "marketing_coordination",
  status: "waiting_client_approval",
  priority: "normal",
  contributorUserIds: [],
  clientDueDate: "2026-07-20",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 80,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

describe("team workspace", () => {
  it("localizes hosted UAT deliverable metadata without exposing enum values", () => {
    render(
      <TeamWorkspace
        clientNames={{ client_a: "جلاس" }}
        deliverables={[waitingDeliverable]}
        now="2026-07-16T10:00:00.000Z"
        workspaces={{}}
      />,
    );

    const workList = within(screen.getByTestId("team-work-list"));
    expect(workList.getByText("تنسيق تسويقي")).toBeInTheDocument();
    expect(workList.getByText("بانتظار اعتماد العميل")).toBeInTheDocument();
    expect(workList.getByText("متوقف بانتظار العميل")).toBeInTheDocument();
    expect(workList.getByText("عادية")).toBeInTheDocument();
    expect(workList.queryByText("marketing_coordination")).not.toBeInTheDocument();
    expect(workList.queryByText("waiting_client_approval")).not.toBeInTheDocument();
    expect(workList.queryByText("paused_waiting_client")).not.toBeInTheDocument();
  });
});
