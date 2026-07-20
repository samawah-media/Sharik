import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientPendingInbox } from "@/ui/client/client-pending-inbox";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(() => cleanup());

const detail = (id: string): ClientSafeDeliverableDetail => ({
  approvalItem: {
    clientId: "client_a",
    deliverableId: id,
    versionId: `${id}_version`,
    expectedRevision: 1,
    isActionable: true,
    displayName: id === "d1" ? "فيديو الحملة" : "منشور الأسبوع",
    typeLabel: "منشور",
    statusLabel: "بانتظار موافقتك",
    versionLabel: "النسخة 2",
  },
  statusLabel: "بانتظار موافقتك",
  progressPercentage: 80,
  content: {
    caption: id === "d1" ? "نص فيديو الحملة" : "كابشن منشور الأسبوع",
    channel: "Instagram",
    format: "Post",
  },
  files: [],
  comments: [],
});

describe("client pending inbox", () => {
  it("renders every eligible item and actions only for approvers", () => {
    render(
      <ClientPendingInbox
        canApprove
        details={[detail("d1"), detail("d2")]}
        approveAction={async () => undefined}
        requestChangesAction={async () => undefined}
      />,
    );

    expect(screen.getAllByText("فيديو الحملة")).not.toHaveLength(0);
    expect(screen.getAllByText("منشور الأسبوع")).not.toHaveLength(0);
    expect(screen.getAllByText("Instagram")).not.toHaveLength(0);
    expect(document.querySelectorAll("[data-content-card]")).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "اعتماد المخرج" }),
    ).toHaveLength(2);
    expect(screen.getAllByText("منشور الأسبوع", { exact: true })).toHaveLength(
      1,
    );
    expect(
      screen.getByRole("heading", { name: "بانتظار موافقتي" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/اعتمدها أو أرسل ملاحظات التعديل/),
    ).toBeInTheDocument();
  });

  it("gives the approver an approve-oriented empty state", () => {
    render(<ClientPendingInbox canApprove details={[]} />);
    expect(
      screen.getByRole("heading", { name: "لا توجد مخرجات بانتظار موافقتك" }),
    ).toBeInTheDocument();
  });

  it("keeps a viewer read-only with role-aware copy and no approve instruction", () => {
    const { rerender } = render(
      <ClientPendingInbox canApprove={false} details={[detail("d1")]} />,
    );
    expect(
      screen.queryByRole("button", { name: "اعتماد المخرج" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("client_a")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "قيد المراجعة" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "للاطلاع" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("قرارك مطلوب")).not.toBeInTheDocument();
    expect(
      screen.getByText("قيد المراجعة", { selector: "span" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "صلاحية الحساب" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/للاطلاع فقط/)).toBeInTheDocument();
    expect(
      screen.queryByText(/اعتمدها أو أرسل ملاحظات التعديل/),
    ).not.toBeInTheDocument();

    rerender(<ClientPendingInbox canApprove={false} details={[]} />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "لا توجد مخرجات قيد المراجعة الآن",
      }),
    ).toBeInTheDocument();
  });

  it("blocks approval controls when the review payload is missing", () => {
    const complete = detail("d1");
    const incomplete: ClientSafeDeliverableDetail = {
      ...complete,
      approvalItem: {
        ...complete.approvalItem,
        isActionable: false,
        actionabilityReason: "missing_review_payload",
      },
      content: {},
    };

    render(
      <ClientPendingInbox
        canApprove
        details={[incomplete]}
        approveAction={async () => undefined}
        requestChangesAction={async () => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "نسخة غير مكتملة" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/لا يمكن اتخاذ قرار عليها/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "اعتماد المخرج" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "طلب تعديل" }),
    ).not.toBeInTheDocument();
  });
});
