import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientDeliverableDetail, type ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);

function snapshot(): ClientSafeDeliverableDetail & { canComment: boolean } {
  return {
    canComment: false,
    approvalItem: {
      clientId: "client", deliverableId: "work", versionId: "v2", expectedRevision: 4,
      isActionable: false, displayName: "العمل المنشور", typeLabel: "منشور",
      status: "client_changes_requested", statusLabel: "قيد التعديل لدى فريق سماوة",
      versionLabel: "النسخة 2",
    },
    status: "client_changes_requested", statusLabel: "قيد التعديل لدى فريق سماوة",
    progressPercentage: 65, content: { body: "النص المرسل في النسخة الثانية" },
    files: [{
      id: "file-v2", label: "مرفق النسخة الثانية", visibility: "client_visible",
      fileType: "application/pdf", fileSize: 123, versionNumber: 2, isFinal: false,
      createdAt: "2026-09-10T00:00:00Z",
    }],
    comments: [{
      id: "comment-v2", body: "تعليق النسخة الثانية", authorName: "العميل",
      createdAt: "2026-09-10T00:00:00Z",
    }],
  };
}

describe("SIL-52 retained client snapshot", () => {
  it.each([true, false])("shows sent content without mutation controls (approver=%s)", (canApprove) => {
    render(<ClientDeliverableDetail
      canApprove={canApprove} detail={snapshot()}
      approveAction={async () => undefined} requestChangesAction={async () => undefined}
    />);
    expect(screen.getByText("النص المرسل في النسخة الثانية")).toBeVisible();
    expect(screen.getByText("مرفق النسخة الثانية")).toBeVisible();
    expect(screen.getByText("تعليق النسخة الثانية")).toBeVisible();
    expect(screen.getByText("65%")).toBeVisible();
    expect(screen.getAllByText("قيد التعديل لدى فريق سماوة").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "اعتماد النسخة" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إضافة التعليق" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "نص التعليق" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /سبب|تعديل/ })).not.toBeInTheDocument();
  });

  it("restores current-version decision and comment controls after explicit resend", () => {
    const current = snapshot();
    current.canComment = true;
    current.approvalItem = { ...current.approvalItem,
      versionId: "v3", versionLabel: "النسخة 3", status: "waiting_client_approval",
      statusLabel: "بانتظار قرارك", isActionable: true,
    };
    current.status = "waiting_client_approval";
    current.progressPercentage = 80;
    render(<ClientDeliverableDetail canApprove detail={current}
      approveAction={async () => undefined} requestChangesAction={async () => undefined} />);
    expect(screen.getByRole("button", { name: "اعتماد النسخة" })).toBeVisible();
    expect(screen.getByRole("button", { name: "إضافة التعليق" })).toBeVisible();
  });
});
