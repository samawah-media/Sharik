import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeliverableBoard } from "@/ui/management/deliverable-board";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";

afterEach(() => cleanup());

const { moveDeliverableOnBoard } = vi.hoisted(() => ({
  moveDeliverableOnBoard: vi.fn(),
}));

vi.mock("@/server/actions/deliverable-workspace-actions", () => ({
  moveDeliverableOnBoard,
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

describe("Team Work Board Optimistic Updates", () => {
  it("updates guidance optimistically on drag success", async () => {
    moveDeliverableOnBoard.mockResolvedValueOnce({ ok: true });

    render(
      <DeliverableBoard
        deliverables={[mockDeliverable]}
        action={vi.fn()}
        actorUserId="actor-1"
        capabilitiesByDeliverable={{ "del-1": capabilities }}
        now="2026-09-15T10:00:00Z"
      />
    );

    // Initial guidance: "not_started" -> action: "ابدأ العمل عندما تكون مستعدًا." (from presentation logic)
    fireEvent.click(screen.getByRole('button', { name: /فتح مساحة المخرج/ }));
    expect(screen.getByText(/ابدأ العمل/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));

    // Drag to "in_progress" (execution column)
    const cardDragHandle = screen.getByRole("button", { name: /سحب مخرج للتجربة/ });
    fireEvent.keyDown(cardDragHandle, { key: " ", code: "Space" }); // pickup
    fireEvent.keyDown(cardDragHandle, { key: "ArrowRight", code: "ArrowRight" }); // move to execution
    fireEvent.keyDown(cardDragHandle, { key: " ", code: "Space" }); // drop

    // Optimistic update should show guidance for "in_progress"
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /فتح مساحة المخرج/ }));
      expect(screen.getByText(/أكمل العمل/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));
    });

    expect(moveDeliverableOnBoard).toHaveBeenCalled();
  });

  it("reverts guidance on drag failure", async () => {
    moveDeliverableOnBoard.mockResolvedValueOnce({ ok: false });

    render(
      <DeliverableBoard
        deliverables={[mockDeliverable]}
        action={vi.fn()}
        actorUserId="actor-1"
        capabilitiesByDeliverable={{ "del-1": capabilities }}
        now="2026-09-15T10:00:00Z"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /فتح مساحة المخرج/ }));
    expect(screen.getByText(/ابدأ العمل/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));

    // Drag to "in_progress" (execution column)
    const cardDragHandle = screen.getByRole("button", { name: /سحب مخرج للتجربة/ });
    fireEvent.keyDown(cardDragHandle, { key: " ", code: "Space" });
    fireEvent.keyDown(cardDragHandle, { key: "ArrowRight", code: "ArrowRight" });
    fireEvent.keyDown(cardDragHandle, { key: " ", code: "Space" });

    // Eventually the action should fail and guidance reverts to "ابدأ العمل"
    await waitFor(() => {
      expect(screen.getByText(/تعذر حفظ الحركة/)).toBeInTheDocument();
    });

    // Guidance should revert
    fireEvent.click(screen.getByRole('button', { name: /فتح مساحة المخرج/ }));
    expect(screen.getByText(/ابدأ العمل/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'إغلاق' }));
  });
});
