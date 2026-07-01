import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  DeliverableBoard,
  DeliverableBoardEmptyState,
} from "@/ui/management/deliverable-board";

afterEach(() => cleanup());

const deliverables: DeliverableSafeSummary[] = [
  {
    id: "deliverable_a",
    tenantId: "tenant_a",
    clientId: "client_a",
    name: "منشور إطلاق الحملة",
    type: "post",
    status: "not_started",
    priority: "normal",
    ownerUserId: "assigned_internal_a",
    contributorUserIds: [],
    internalDueDate: "2026-07-03",
    clientDueDate: "2026-07-05",
    finalDueDate: "2026-07-07",
    requiresInternalApproval: true,
    requiresClientApproval: true,
    progressPercentage: 0,
    approvedExtra: false,
    revision: 1,
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:00:00.000Z",
  },
  {
    id: "deliverable_ready",
    tenantId: "tenant_a",
    clientId: "client_a",
    name: "تصميم إعلان المنتج",
    type: "design",
    status: "internally_approved",
    priority: "high",
    ownerUserId: "assigned_internal_a",
    contributorUserIds: ["designer_a"],
    internalDueDate: "2026-07-02",
    clientDueDate: "2026-07-04",
    finalDueDate: "2026-07-06",
    requiresInternalApproval: true,
    requiresClientApproval: true,
    progressPercentage: 70,
    approvedExtra: false,
    revision: 2,
    createdAt: "2026-06-29T00:00:00.000Z",
    updatedAt: "2026-06-30T00:00:00.000Z",
  },
];

describe("internal deliverable Kanban board", () => {
  it("renders active columns, scoped cards, SLA, due dates, and status update forms", () => {
    render(
      <DeliverableBoard
        deliverables={deliverables}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    const board = screen.getByRole("region", { name: "لوحة Kanban الداخلية" });
    expect(screen.getByTestId("kanban-board-scroll")).toHaveClass(
      "overflow-x-auto",
    );
    expect(screen.getAllByTestId("kanban-column")).toHaveLength(10);
    expect(screen.getAllByTestId("kanban-column")[0]).toHaveClass("min-w-80");
    expect(
      within(board).getByRole("region", { name: "لم يبدأ" }),
    ).toBeInTheDocument();
    expect(
      within(board).getByRole("region", { name: "معتمد داخليًا" }),
    ).toBeInTheDocument();
    expect(within(board).getByText("منشور إطلاق الحملة")).toBeInTheDocument();
    expect(within(board).getByText("تصميم إعلان المنتج")).toBeInTheDocument();
    expect(within(board).getByText("assigned_internal_a")).toBeInTheDocument();
    expect(within(board).getByText(/designer_a/)).toBeInTheDocument();
    expect(within(board).getByText("07-03")).toBeInTheDocument();
    expect(within(board).getByText("0%")).toBeInTheDocument();
    expect(within(board).getByText("70%")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("تغيير الحالة")[0]);

    const firstForm = screen.getByRole("form", {
      name: "تغيير حالة منشور إطلاق الحملة",
    });
    expect(within(firstForm).getByLabelText("الحالة")).toHaveValue(
      "not_started",
    );
    expect(within(firstForm).getByLabelText("سبب التغيير")).toHaveAttribute(
      "name",
      "reason",
    );
    expect(
      document.querySelector('input[name="expectedRevision"]'),
    ).toHaveValue("1");
    expect(screen.queryByText("client_b")).not.toBeInTheDocument();
    expect(screen.queryByText("approval log")).not.toBeInTheDocument();
  });

  it("disables direct waiting-client transition until internal approval exists", () => {
    render(
      <DeliverableBoard
        deliverables={[deliverables[0]]}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    fireEvent.click(screen.getByText("تغيير الحالة"));

    const waitingOption = screen.getByRole("option", {
      name: "بانتظار اعتماد العميل",
    });
    expect(waitingOption).toBeDisabled();
  });

  it("keeps empty columns readable without stretching cards", () => {
    render(
      <DeliverableBoard
        deliverables={[deliverables[0]]}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    const inProgressColumn = screen.getByRole("region", {
      name: "قيد التنفيذ",
    });
    expect(
      within(inProgressColumn).getByText("ما فيه مخرجات في هذه المرحلة."),
    ).toBeInTheDocument();
  });

  it("renders a safe empty state", () => {
    render(<DeliverableBoardEmptyState />);

    expect(
      screen.getByRole("heading", { name: "لا توجد مخرجات على اللوحة بعد" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("tenant_a")).not.toBeInTheDocument();
  });
});
