import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
      screen.getByRole("button", { name: "راجعت النسخة والملفات" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "أضف نصًا فعليًا أو جهّز ملف النسخة الحالية للعميل قبل الإرسال.",
      ),
    ).toBeInTheDocument();
  });

  it("summarizes and confirms the exact payload before enabling send", () => {
    render(
      <DeliverableApprovalWorkflowControl
        action={vi.fn()}
        clientReviewReady
        clientName="عميل الاختبار"
        currentVersion={{
          id: "version_a",
          versionNumber: 4,
          status: "internally_approved",
          submittedAt: "2026-07-26T00:00:00.000Z",
          caption: "نص الاعتماد",
        }}
        deliverable={deliverable}
        files={[
          {
            id: "file_a",
            name: "video.mp4",
            fileType: "video/mp4",
            fileSize: 1024,
            visibility: "client_visible",
            versionId: "version_a",
            versionNumber: 4,
            isFinal: false,
            createdAt: "2026-07-26T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("عميل الاختبار")).toBeInTheDocument();
    expect(screen.getByText("النسخة 4")).toBeInTheDocument();
    expect(screen.getByText("video.mp4")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إرسال للعميل" })).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "راجعت النسخة والملفات" }),
    );
    expect(
      screen.getByRole("button", { name: "إرسال للعميل" }),
    ).toBeEnabled();
  });

  it("blocks confirmation while an upload is unsettled", () => {
    render(
      <DeliverableApprovalWorkflowControl
        action={vi.fn()}
        clientReviewReady
        deliverable={deliverable}
        uploadBlocked
      />,
    );

    expect(
      screen.getByRole("button", { name: "راجعت النسخة والملفات" }),
    ).toBeDisabled();
    expect(
      screen.getByText("لا يمكن المتابعة قبل اكتمال الرفع أو إلغاء الملف المتعثر."),
    ).toBeInTheDocument();
  });
});
