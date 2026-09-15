import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InternalInvitationAcceptance } from "@/ui/invitations/internal-invitation-acceptance";
import { AssignedClients } from "@/ui/management/assigned-clients";
import {
  InternalInviteEmptyState,
  InternalInviteForm,
  InternalInviteLoadingState,
  InternalInviteSaveFailure,
} from "@/ui/management/internal-invite-form";
import { InvitationList } from "@/ui/management/invitation-list";

describe("internal invitation UI", () => {
  it("shows every invited client before accepting a multi-client invitation", () => {
    render(
      <InternalInvitationAcceptance
        invitation={{
          invitedDisplayName: "سارة محمد",
          roleKey: "designer",
          clientNames: ["هدنة", "جلس"],
          expiresAt: "2026-09-08T00:00:00.000Z",
          status: "pending",
        }}
        invitationToken="fixture-multi-client-token"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "مرحبًا سارة محمد" }).parentElement,
    ).toHaveTextContent("هدنة، جلس فقط");
    expect(
      screen.getByText(/يسجل كل إسناد في سجل التدقيق/),
    ).toBeInTheDocument();
  });

  it("renders Arabic RTL-ready invite fields", () => {
    render(
      <InternalInviteForm
        clients={[
          {
            id: "00000000-0000-4000-8000-000000000101",
            name: "هدنة",
          },
          {
            id: "00000000-0000-4000-8000-000000000102",
            name: "جلس",
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
    expect(screen.getByLabelText("الدور")).toHaveValue("");
    expect(screen.getByRole("option", { name: "اختر الدور" })).toBeDisabled();
    expect(
      screen.getByRole("group", { name: "العملاء الذين سيعمل عليهم" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "هدنة" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "جلس" })).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "إنشاء رابط الدعوة" }),
    ).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "هدنة" })).toHaveAttribute(
      "value",
      "00000000-0000-4000-8000-000000000101",
    );
    expect(screen.queryByRole("option", { name: "Client B" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "هدنة" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "جلس" }));

    expect(screen.getByRole("checkbox", { name: "هدنة" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "جلس" })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "إنشاء رابط الدعوة" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("الدور"), {
      target: { value: "designer" },
    });

    expect(
      screen.getByRole("button", { name: "إنشاء رابط الدعوة" }),
    ).toBeEnabled();
  });

  it("does not repeat accepted members in the invitation lifecycle list", () => {
    render(
      <InvitationList
        invitations={[
          {
            id: "00000000-0000-4000-8000-000000000201",
            tenantId: "00000000-0000-4000-8000-000000000001",
            invitedDisplayName: "عضو مقبول ومفعّل",
            invitedEmail: "accepted@example.test",
            roleKey: "designer",
            clientIds: ["00000000-0000-4000-8000-000000000101"],
            clientNames: ["هدنة"],
            status: "accepted",
            deliveryState: "sent",
            expiresAt: "2026-08-11T00:00:00.000Z",
            createdAt: "2026-08-04T00:00:00.000Z",
          },
          {
            id: "00000000-0000-4000-8000-000000000202",
            tenantId: "00000000-0000-4000-8000-000000000001",
            invitedDisplayName: "دعوة ملغاة",
            invitedEmail: "revoked@example.test",
            roleKey: "content_writer",
            clientIds: ["00000000-0000-4000-8000-000000000101"],
            clientNames: ["هدنة"],
            status: "revoked",
            deliveryState: "sent",
            expiresAt: "2026-08-11T00:00:00.000Z",
            createdAt: "2026-08-04T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.queryByText("عضو مقبول ومفعّل")).not.toBeInTheDocument();
    expect(
      screen.getByText("لا توجد دعوات بانتظار القبول."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("سجل الدعوات المغلقة (1)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("دعوة ملغاة")).not.toBeVisible();
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
            clientIds: ["00000000-0000-4000-8000-000000000101"],
            clientNames: ["هدنة"],
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
