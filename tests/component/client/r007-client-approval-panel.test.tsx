import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientApprovalPanel } from "@/ui/client/client-approval-panel";

afterEach(() => cleanup());

const approvalItem = {
  clientId: "client_a",
  deliverableId: "r007_visible_deliverable",
  versionId: "r007_visible_version",
  expectedRevision: 3,
  displayName: "مخرج تجريبي آمن",
  typeLabel: "منشور",
  statusLabel: "بانتظار موافقتك",
  versionLabel: "النسخة المعتمدة للعميل",
  dueDateLabel: "2026-07-12",
};

describe("R-007 client approval panel", () => {
  it("renders approve and change-request controls only for client approvers", () => {
    const approveAction = vi.fn();
    const requestChangesAction = vi.fn();

    render(
      <ClientApprovalPanel
        approveAction={approveAction}
        canApprove
        item={approvalItem}
        requestChangesAction={requestChangesAction}
      />,
    );

    const panel = screen.getByRole("region", { name: "قرار اعتماد العميل" });
    expect(panel).toHaveAttribute("dir", "rtl");
    expect(within(panel).getByText("مخرج تجريبي آمن")).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "اعتماد المخرج" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "طلب تعديل" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector('input[name="versionId"]'),
    ).toHaveValue("r007_visible_version");
    expect(document.querySelector('input[name="expectedRevision"]')).toHaveValue(
      "3",
    );
    expect(within(panel).queryByText("ملاحظات داخلية")).not.toBeInTheDocument();
    expect(within(panel).queryByText("tenant_a")).not.toBeInTheDocument();
    expect(within(panel).queryByText("audit")).not.toBeInTheDocument();
  });

  it("keeps client viewers in read-only mode", () => {
    render(<ClientApprovalPanel canApprove={false} item={approvalItem} />);

    const panel = screen.getByRole("region", { name: "قرار اعتماد العميل" });
    expect(within(panel).getByText("يمكنك مشاهدة المخرج فقط.")).toBeInTheDocument();
    expect(
      within(panel).queryByRole("button", { name: "اعتماد المخرج" }),
    ).not.toBeInTheDocument();
    expect(
      within(panel).queryByRole("button", { name: "طلب تعديل" }),
    ).not.toBeInTheDocument();
    expect(within(panel).getByText("مخرج تجريبي آمن")).toBeInTheDocument();
  });
});
