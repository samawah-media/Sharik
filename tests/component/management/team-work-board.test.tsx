import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { DeliverableBoard } from "@/ui/management/deliverable-board";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const { moveDeliverableOnBoard } = vi.hoisted(() => ({
  moveDeliverableOnBoard: vi.fn(),
}));

vi.mock(
  "@/server/actions/deliverable-workspace-actions",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/server/actions/deliverable-workspace-actions")
    >()),
    moveDeliverableOnBoard,
  }),
);

// dnd-kit is the interaction boundary here. The controlled test trigger calls
// the board's real onDragEnd callback while keeping JSDOM geometry out of scope.
vi.mock("@dnd-kit/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@dnd-kit/core")>()),
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd: (event: {
      active: { id: string };
      over: { id: string };
    }) => void | Promise<void>;
  }) => (
    <>
      <button
        aria-label="اختبار النقل إلى التنفيذ"
        onClick={() =>
          void onDragEnd({
            active: { id: "del-1" },
            over: { id: "execution" },
          })
        }
        type="button"
      />
      <button
        aria-label="اختبار الإرجاع إلى لم يبدأ"
        onClick={() =>
          void onDragEnd({
            active: { id: "del-1" },
            over: { id: "planning" },
          })
        }
        type="button"
      />
      {children}
    </>
  ),
  useDraggable: () => ({
    attributes: {},
    isDragging: false,
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  }),
  useDroppable: () => ({ isOver: false, setNodeRef: vi.fn() }),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

const mockDeliverable: DeliverableSafeSummary = {
  id: "del-1",
  tenantId: "tenant_a",
  clientId: "client_a",
  name: "مخرج للتجربة",
  type: "post",
  status: "not_started",
  priority: "normal",
  contributorUserIds: [],
  ownerUserId: "actor-1",
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 0,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const capabilities = {
  canApproveInternally: false,
  canManageDelivery: false,
  canSendToClient: false,
  canSubmitVersion: true,
  canUpdateStatus: true,
};

const renderBoard = () =>
  render(
    <DeliverableBoard
      action={vi.fn()}
      actorUserId="actor-1"
      capabilitiesByDeliverable={{ "del-1": capabilities }}
      deliverables={[mockDeliverable]}
      now="2026-09-15T10:00:00Z"
    />,
  );

describe("team work board optimistic updates", () => {
  it("updates actor guidance and sends the exact optimistic move payload", async () => {
    moveDeliverableOnBoard.mockResolvedValueOnce({ ok: true });
    renderBoard();

    fireEvent.click(
      screen.getByRole("button", { name: "اختبار النقل إلى التنفيذ" }),
    );

    await waitFor(() =>
      expect(screen.getByText(/تم حفظ الحركة/)).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /فتح مساحة المخرج/ }),
    );
    expect(screen.getByText(/أكمل العمل/)).toBeInTheDocument();
    expect(moveDeliverableOnBoard).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client_a",
        deliverableId: "del-1",
        expectedRevision: 1,
        toStatus: "in_progress",
      }),
    );
  });

  it("restores actor guidance when the optimistic move is rejected", async () => {
    moveDeliverableOnBoard.mockResolvedValueOnce({ ok: false });
    renderBoard();

    fireEvent.click(
      screen.getByRole("button", { name: "اختبار النقل إلى التنفيذ" }),
    );

    await waitFor(() =>
      expect(screen.getByText(/تعذر حفظ الحركة/)).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /فتح مساحة المخرج/ }),
    );
    expect(screen.getByText(/ابدأ العمل/)).toBeInTheDocument();
  });

  it("fails closed when a deliverable is missing from the capability map", () => {
    const deniedDeliverable = {
      ...mockDeliverable,
      id: "del-2",
      clientId: "client_b",
      name: "مخرج خارج الصلاحية",
    };

    render(
      <DeliverableBoard
        action={vi.fn()}
        actorUserId="actor-1"
        capabilitiesByDeliverable={{
          "del-1": capabilities,
        }}
        deliverables={[mockDeliverable, deniedDeliverable]}
        now="2026-09-15T10:00:00Z"
      />,
    );

    const allowedCard = screen.getByText("مخرج للتجربة").closest("article");
    const deniedCard = screen
      .getByText("مخرج خارج الصلاحية")
      .closest("article");
    expect(allowedCard).not.toBeNull();
    expect(deniedCard).not.toBeNull();
    expect(
      within(allowedCard!).getByRole("button", {
        name: "تغيير الحالة مخرج للتجربة",
      }),
    ).toBeInTheDocument();
    expect(
      within(deniedCard!).queryByRole("button", {
        name: "تغيير الحالة مخرج خارج الصلاحية",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /سحب مخرج خارج الصلاحية/ }),
    ).not.toBeInTheDocument();
  });

  it("ignores a second move while the first save is pending", async () => {
    let resolveMove: ((value: { ok: true }) => void) | undefined;
    moveDeliverableOnBoard.mockImplementationOnce(
      () =>
        new Promise<{ ok: true }>((resolve) => {
          resolveMove = resolve;
        }),
    );
    renderBoard();

    const move = screen.getByRole("button", {
      name: "اختبار النقل إلى التنفيذ",
    });
    fireEvent.click(move);
    await waitFor(() =>
      expect(screen.getByText(/جارٍ حفظ الحركة/)).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "اختبار الإرجاع إلى لم يبدأ" }),
    );

    expect(moveDeliverableOnBoard).toHaveBeenCalledTimes(1);
    resolveMove?.({ ok: true });
    await waitFor(() =>
      expect(screen.getByText(/تم حفظ الحركة/)).toBeInTheDocument(),
    );
  });
});
