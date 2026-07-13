import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClientPendingInbox } from "@/ui/client/client-pending-inbox";
import type { ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";

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
    expect(screen.getAllByRole("button", { name: "اعتماد المخرج" })).toHaveLength(2);
  });

  it("keeps a viewer read-only and gives a safe empty state", () => {
    const { rerender } = render(
      <ClientPendingInbox canApprove={false} details={[detail("d1")]} />,
    );
    expect(screen.queryByRole("button", { name: "اعتماد المخرج" })).not.toBeInTheDocument();
    expect(screen.queryByText("client_a")).not.toBeInTheDocument();

    rerender(<ClientPendingInbox canApprove={false} details={[]} />);
    expect(screen.getByText("لا توجد مخرجات بانتظار موافقتك")).toBeInTheDocument();
  });
});
