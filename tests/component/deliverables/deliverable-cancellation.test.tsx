import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import {
  DeliverableCancellationControl,
  DeliverableCancellationDeniedState,
} from "@/ui/management/deliverable-actions";

afterEach(() => cleanup());

const deliverableSummary: DeliverableSafeSummary = {
  id: "deliverable_a",
  tenantId: "tenant_a",
  clientId: "client_a",
  contractId: "contract_a",
  packageId: "package_a",
  packageLineId: "package_line_posts_a",
  name: "منشور إطلاق الحملة",
  description: "مخرج متفق عليه ضمن الباقة.",
  type: "post",
  priority: "normal",
  ownerUserId: "assigned_internal_a",
  contributorUserIds: [],
  status: "not_started",
  progressPercentage: 0,
  requiresInternalApproval: true,
  requiresClientApproval: true,
  approvedExtra: false,
  revision: 1,
  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
  reservation: {
    packageLineId: "package_line_posts_a",
    reservedQuantity: 1,
  },
};

describe("deliverable cancellation controls", () => {
  it("renders Arabic RTL cancellation form only for eligible not-started reserved deliverables", () => {
    render(
      <DeliverableCancellationControl
        deliverable={deliverableSummary}
        idempotencyKey="f002d-cancel-deliverable-a"
      />,
    );

    const form = screen.getByRole("form", { name: "إلغاء المخرج" });
    expect(form).toHaveAttribute("dir", "rtl");
    expect(within(form).getByText("إلغاء المخرج")).toBeInTheDocument();
    expect(within(form).getByLabelText("سبب الإلغاء")).toBeRequired();
    expect(
      within(form).getByRole("button", { name: "إلغاء وإرجاع السعة" }),
    ).toBeInTheDocument();
    expect(document.querySelector('input[name="deliverableId"]')).toHaveValue(
      "deliverable_a",
    );
    expect(document.querySelector('input[name="expectedStatus"]')).toHaveValue(
      "not_started",
    );
    expect(document.querySelector('input[name="idempotencyKey"]')).toHaveValue(
      "f002d-cancel-deliverable-a",
    );
    expect(screen.queryByText("internal")).not.toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("does not render cancellation action for progressed, cancelled, or unreserved deliverables", () => {
    const { rerender } = render(
      <DeliverableCancellationControl
        deliverable={{
          ...deliverableSummary,
          status: "in_progress",
          progressPercentage: 30,
        }}
        idempotencyKey="f002d-cancel-progressed"
      />,
    );

    expect(screen.queryByRole("form", { name: "إلغاء المخرج" })).not.toBeInTheDocument();

    rerender(
      <DeliverableCancellationControl
        deliverable={{ ...deliverableSummary, status: "cancelled" }}
        idempotencyKey="f002d-cancel-cancelled"
      />,
    );
    expect(screen.queryByRole("form", { name: "إلغاء المخرج" })).not.toBeInTheDocument();

    rerender(
      <DeliverableCancellationControl
        deliverable={{ ...deliverableSummary, reservation: undefined }}
        idempotencyKey="f002d-cancel-unreserved"
      />,
    );
    expect(screen.queryByRole("form", { name: "إلغاء المخرج" })).not.toBeInTheDocument();
  });

  it("renders safe Arabic denial copy without identifiers", () => {
    render(<DeliverableCancellationDeniedState />);

    expect(
      screen.getByRole("heading", {
        name: "لا يمكن إلغاء هذا المخرج من هذه المرحلة.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("استخدم مسار تغيير لاحق عند بدء التنفيذ.")).toBeInTheDocument();
    expect(screen.queryByText("package_line_posts_a")).not.toBeInTheDocument();
    expect(screen.queryByText("tenant_a")).not.toBeInTheDocument();
  });
});
