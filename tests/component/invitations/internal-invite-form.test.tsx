import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignedClients } from "@/ui/management/assigned-clients";
import {
  InternalInviteEmptyState,
  InternalInviteForm,
  InternalInviteLoadingState,
  InternalInviteSaveFailure,
} from "@/ui/management/internal-invite-form";
import { InvitationList } from "@/ui/management/invitation-list";

describe("internal invitation UI", () => {
  it("renders Arabic RTL-ready invite fields", () => {
    render(
      <InternalInviteForm
        clients={[
          {
            id: "00000000-0000-4000-8000-000000000101",
            name: "هدنة",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("form", { name: "دعوة عضو داخلي" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم العضو")).toBeRequired();
    expect(screen.getByLabelText("بريد العضو")).toBeRequired();
    expect(screen.getByLabelText("الدور")).toBeRequired();
    expect(screen.getByLabelText("العميل الذي سيعمل عليه")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "إنشاء رابط الدعوة" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "هدنة" })).toHaveAttribute(
      "value",
      "00000000-0000-4000-8000-000000000101",
    );
    expect(screen.queryByRole("option", { name: "Client B" })).not.toBeInTheDocument();
  });

  it("renders pending invitation resend and revoke controls inside scope", () => {
    render(
      <InvitationList
        invitations={[
          {
            id: "00000000-0000-4000-8000-000000000201",
            tenantId: "00000000-0000-4000-8000-000000000001",
            invitedDisplayName: "سارة محمد",
            invitedEmail: "member@example.test",
            roleKey: "designer",
            clientId: "00000000-0000-4000-8000-000000000101",
            clientName: "هدنة",
            status: "pending",
            deliveryState: "queued",
            expiresAt: "2026-08-11T00:00:00.000Z",
            createdAt: "2026-08-04T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("سارة محمد")).toBeInTheDocument();
    expect(screen.getByText("member@example.test")).toBeInTheDocument();
    expect(screen.getByText("المصمم · هدنة")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "إنشاء رابط جديد" })).not.toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("renders empty, loading, and save failure states without client leakage", () => {
    render(
      <>
        <InternalInviteEmptyState />
        <InternalInviteLoadingState />
        <InternalInviteSaveFailure />
      </>,
    );

    expect(screen.getByText("لا توجد دعوات داخلية بعد")).toBeInTheDocument();
    expect(screen.getByText("جارٍ تجهيز الدعوة...")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });
});

describe("assigned clients UI", () => {
  it("shows assigned client portfolio only", () => {
    cleanup();
    render(<AssignedClients clients={[{ id: "client_a", name: "هدنة" }]} />);

    expect(screen.getByText("هدنة")).toBeInTheDocument();
    expect(screen.getByText(/عميل داخل نطاق صلاحياتك/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح هدنة" })).toHaveAttribute(
      "href",
      "/clients/client_a",
    );
    expect(screen.getByRole("link", { name: "المخرجات" })).toHaveAttribute(
      "href",
      "/clients/client_a/deliverables",
    );
    expect(
      screen.getByRole("link", { name: "المتابعة / SLA" }),
    ).toHaveAttribute("href", "/clients/client_a/commercial");
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("renders no-assigned-client state", () => {
    render(<AssignedClients clients={[]} />);

    expect(screen.getByText("لا يوجد عملاء مسندون")).toBeInTheDocument();
  });
});
