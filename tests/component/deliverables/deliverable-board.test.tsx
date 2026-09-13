import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    ownerDisplay: {
      userId: "assigned_internal_a",
      displayName: "أحمد العتيبي",
      roleLabel: "مدير مشروع",
      initial: "أ",
    },
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
    currentVersionId: "version_ready",
    tenantId: "tenant_a",
    clientId: "client_a",
    name: "تصميم إعلان المنتج",
    type: "design",
    status: "internally_approved",
    priority: "high",
    ownerUserId: "assigned_internal_a",
    ownerDisplay: {
      userId: "assigned_internal_a",
      displayName: "أحمد العتيبي",
      roleLabel: "مدير مشروع",
      initial: "أ",
    },
    contributorUserIds: ["designer_a"],
    contributorDisplays: [
      {
        userId: "designer_a",
        displayName: "رائد الحربي",
        roleLabel: "مصمم",
        initial: "ر",
      },
    ],
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

describe("internal deliverable work board", () => {
  const renderScrollableBoard = () => {
    render(
      <DeliverableBoard
        action={async () => undefined}
        deliverables={[deliverables[0]]}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    const board = screen.getByTestId("kanban-board-scroll");
    Object.defineProperties(board, {
      clientWidth: { configurable: true, value: 640 },
      scrollWidth: { configurable: true, value: 2240 },
    });
    return board;
  };

  it("owns bounded horizontal and vertical overflow inside the board", () => {
    const board = renderScrollableBoard();

    expect(board).toHaveClass(
      "h-[70dvh]",
      "lg:h-[calc(100dvh-16rem)]",
      "overflow-auto",
      "overscroll-contain",
    );
    expect(board).not.toHaveClass("overflow-x-auto");
  });

  it("translates a vertical wheel into RTL-aware horizontal movement", () => {
    const board = renderScrollableBoard();
    let logicalScrollLeft = 0;
    Object.defineProperty(board, "scrollLeft", {
      configurable: true,
      get: () => logicalScrollLeft,
      set: (value: number) => {
        logicalScrollLeft = value;
      },
    });
    const scrollBy = vi.fn(({ left }: ScrollToOptions) => {
      logicalScrollLeft = Math.max(
        -1600,
        Math.min(0, logicalScrollLeft + (left ?? 0)),
      );
    });
    board.scrollBy = scrollBy as HTMLElement["scrollBy"];
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });

    board.dispatchEvent(event);

    expect(scrollBy).toHaveBeenCalledWith({ behavior: "auto", left: -120 });
    expect(logicalScrollLeft).toBe(-120);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not prevent page scrolling when horizontal wheel translation cannot move", () => {
    const board = renderScrollableBoard();
    let logicalScrollLeft = -1600;
    Object.defineProperty(board, "scrollLeft", {
      configurable: true,
      get: () => logicalScrollLeft,
      set: (value: number) => {
        logicalScrollLeft = value;
      },
    });
    const scrollBy = vi.fn(({ left }: ScrollToOptions) => {
      logicalScrollLeft = Math.max(
        -1600,
        Math.min(0, logicalScrollLeft + (left ?? 0)),
      );
    });
    board.scrollBy = scrollBy as HTMLElement["scrollBy"];
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });

    board.dispatchEvent(event);

    expect(logicalScrollLeft).toBe(-1600);
    expect(event.defaultPrevented).toBe(false);
  });

  it("preserves vertical scrolling inside a long board column before translating horizontally", () => {
    const board = renderScrollableBoard();
    board.scrollBy = vi.fn();
    const dragHandle = screen.getByRole("button", {
      name: /سحب منشور إطلاق الحملة/,
    });
    Object.defineProperties(dragHandle, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 900 },
      scrollTop: { configurable: true, value: 100, writable: true },
    });
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    });

    dragHandle.dispatchEvent(event);

    expect(board.scrollBy).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("scrolls with arrows only while the board itself is focused", () => {
    const board = renderScrollableBoard();
    board.scrollBy = vi.fn();

    board.focus();
    fireEvent.keyDown(board, { key: "ArrowLeft" });
    expect(board.scrollBy).toHaveBeenCalledTimes(1);

    const dragHandle = screen.getByRole("button", {
      name: /سحب منشور إطلاق الحملة/,
    });
    dragHandle.focus();
    fireEvent.keyDown(dragHandle, { key: "ArrowRight" });
    expect(board.scrollBy).toHaveBeenCalledTimes(1);
  });

  it("renders active columns, scoped cards, SLA, due dates, and status update forms", () => {
    render(
      <DeliverableBoard
        action={async () => undefined}
        deliverables={deliverables}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    const board = screen.getByRole("region", { name: "لوحة العمل" });
    expect(screen.getByTestId("kanban-board-scroll")).toHaveClass(
      "overflow-auto",
    );
    expect(screen.getByTestId("kanban-board-scroll")).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(
      within(board).getByText(/السحب متاح فقط بين لم يبدأ وقيد التنفيذ/),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("kanban-column")).toHaveLength(7);
    expect(screen.getAllByTestId("kanban-column")[0]).toHaveClass(
      "min-w-[20rem]",
    );
    expect(
      within(board).getByRole("region", { name: "لم يبدأ" }),
    ).toBeInTheDocument();
    expect(
      within(board).getByRole("region", { name: "المراجعة الداخلية" }),
    ).toBeInTheDocument();
    expect(within(board).getAllByText("منشور إطلاق الحملة")).toHaveLength(1);
    expect(within(board).getAllByText("تصميم إعلان المنتج")).toHaveLength(1);
    expect(document.querySelectorAll("[data-content-card]")).toHaveLength(2);
    expect(within(board).getAllByText("أحمد العتيبي").length).toBeGreaterThan(
      0,
    );
    expect(within(board).getByText("٣ يوليو ٢٠٢٦")).toBeInTheDocument();
    expect(within(board).getByText("0%")).toBeInTheDocument();
    expect(within(board).getByText("70%")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/^تغيير الحالة/)[0]);

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

  it("does not offer protected workflow transitions in the generic status form", () => {
    render(
      <DeliverableBoard
        action={async () => undefined}
        deliverables={[deliverables[0]]}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    fireEvent.click(screen.getByText(/^تغيير الحالة/));

    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(
      screen.queryByRole("option", { name: "بانتظار اعتماد العميل" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText("إجراء محمي من مساحة المخرج.").length,
    ).toBeGreaterThan(0);
  });

  it("keeps empty columns readable without stretching cards", () => {
    render(
      <DeliverableBoard
        deliverables={[deliverables[0]]}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    const inProgressColumn = screen.getByRole("region", {
      name: "قيد التنفيذ والتعديلات",
    });
    expect(
      within(inProgressColumn).getByText("ما فيه مخرجات في هذه المرحلة."),
    ).toBeInTheDocument();
  });

  it("keeps duplicate workflow controls inside the single details drawer", () => {
    const action = async () => undefined;
    render(
      <DeliverableBoard
        approvalAction={action}
        deliverables={deliverables}
        now="2026-07-01T10:00:00.000Z"
      />,
    );

    expect(
      screen.queryByRole("form", { name: /رفع نسخة/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: /إرسال للعميل/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "فتح مساحة المخرج" }),
    ).toHaveLength(2);
  });

  it("renders a safe empty state", () => {
    render(<DeliverableBoardEmptyState />);

    expect(
      screen.getByRole("heading", { name: "لا توجد مخرجات على اللوحة بعد" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("tenant_a")).not.toBeInTheDocument();
  });
});
