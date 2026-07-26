import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import { DeliverableApprovalWorkflowControl } from "@/ui/management/deliverable-actions";

const deliverable: DeliverableSafeSummary = {
  id: "deliverable_a",
  tenantId: "tenant_a",
  clientId: "client_a",
  name: "منشور مصوّر",
  type: "post",
  status: "internally_approved",
  priority: "normal",
  contributorUserIds: [],
  requiresInternalApproval: true,
  requiresClientApproval: true,
  progressPercentage: 70,
  approvedExtra: false,
  revision: 3,
  currentVersionId: "version_a",
  createdAt: "2026-07-26T00:00:00.000Z",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

afterEach(cleanup);

describe("deliverable client-review readiness", () => {
  it("disables send and explains the missing client payload", () => {
    render(
      <DeliverableApprovalWorkflowControl
        action={vi.fn()}
        clientReviewReady={false}
        deliverable={deliverable}
      />,
    );

    expect(
      screen.getByRole("button", { name: "إرسال للعميل" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "أضف نصًا فعليًا أو جهّز ملف النسخة الحالية للعميل قبل الإرسال.",
      ),
    ).toBeInTheDocument();
  });

  it("enables send after the exact client-review payload is ready", () => {
    render(
      <DeliverableApprovalWorkflowControl
        action={vi.fn()}
        clientReviewReady
        deliverable={deliverable}
      />,
    );

    expect(
      screen.getByRole("button", { name: "إرسال للعميل" }),
    ).toBeEnabled();
  });
});
