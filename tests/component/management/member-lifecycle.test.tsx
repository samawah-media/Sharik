import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvitationList } from "@/ui/management/invitation-list";
import {
  InternalTeamDirectory,
  MemberList,
  ResponsibilityTransferBlockedState,
  RoleSelector,
} from "@/ui/management/member-list";

describe("member lifecycle UI", () => {
  afterEach(() => cleanup());

  it("renders role selector and disabled membership state", () => {
    render(
      <MemberList
        members={[
          {
            id: "tm_disabled",
            name: "عضو معطل",
            email: "disabled@example.test",
            status: "disabled",
            roles: [],
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("الدور")).toBeInTheDocument();
    expect(screen.getByText("عضوية معطلة")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "تعطيل العضوية" }),
    ).toBeInTheDocument();
  });

  it("renders resend and revoke controls for pending invitations", () => {
    render(
      <InvitationList
        invitations={[
          {
            id: "00000000-0000-4000-8000-000000000201",
            tenantId: "00000000-0000-4000-8000-000000000001",
            invitedDisplayName: "عضو قيد الدعوة",
            invitedEmail: "pending@example.test",
            roleKey: "designer",
            clientIds: [
              "00000000-0000-4000-8000-000000000101",
              "00000000-0000-4000-8000-000000000102",
            ],
            clientNames: ["هدنة", "جلس"],
            status: "pending",
            expiresAt: "2026-07-01T00:00:00.000Z",
            createdAt: "2026-06-24T00:00:00.000Z",
            deliveryState: "sent",
          },
        ]}
      />,
    );

    expect(screen.getByText("عضو قيد الدعوة")).toBeInTheDocument();
    expect(screen.getByText("بانتظار القبول")).toBeInTheDocument();
    expect(screen.getByText("المصمم · هدنة، جلس")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("shows transfer-blocked state without implementing deliverables", () => {
    render(
      <>
        <RoleSelector />
        <ResponsibilityTransferBlockedState />
      </>,
    );

    expect(screen.getByLabelText("الدور")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "لا يمكن تعطيل العضوية قبل توثيق نقل المسؤوليات النشطة.",
    );
  });

  it("renders the persistent team directory with human roles and client scope", () => {
    render(
      <InternalTeamDirectory
        members={[
          {
            membershipId: "00000000-0000-4000-8000-000000000201",
            userId: "00000000-0000-4000-8000-000000000301",
            displayName: "سارة المصممة",
            status: "active",
            roleKeys: ["designer"],
            clientNames: ["Glass"],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "سارة المصممة" })).toBeInTheDocument();
    expect(screen.getByText("المصمم")).toBeInTheDocument();
    expect(screen.getByLabelText("عملاء العضو")).toHaveTextContent(
      "Glass",
    );
    expect(screen.queryByText(/00000000/u)).not.toBeInTheDocument();
  });

  it("preserves directory order and exposes truthful management controls for active members", () => {
    const action = vi.fn(async () => ({ status: "success" as const, message: "تم الحفظ." }));
    render(<InternalTeamDirectory members={[
      {
        membershipId: "membership-multi", userId: "user-multi", displayName: "سارة مصممة المحتوى", status: "active",
        roleKeys: ["designer", "content_writer"], clientNames: ["هدنة", "Glass Studio"],
        assignments: [
          { assignmentId: "assignment-designer", roleKey: "designer", scopeType: "client", scopeId: "client-hudna", scopeName: "هدنة", status: "active" },
          { assignmentId: "assignment-writer", roleKey: "content_writer", scopeType: "client", scopeId: "client-glass", scopeName: "Glass Studio", status: "active" },
        ],
        availableClients: [
          { clientId: "client-hudna", clientName: "هدنة" },
        ],
      },
      {
        membershipId: "membership-admin", userId: "user-admin", displayName: "مدير المساحة", status: "active",
        roleKeys: ["tenant_administrator"], clientNames: [],
        assignments: [{ assignmentId: "assignment-admin", roleKey: "tenant_administrator", scopeType: "tenant", scopeId: "tenant-a", scopeName: "مساحة سماوة", status: "active" }],
        availableClients: [],
      },
      {
        membershipId: "membership-disabled", userId: "user-disabled", displayName: "عضو معطل", status: "disabled",
        roleKeys: ["account_manager"], clientNames: ["جلس"],
        assignments: [{ assignmentId: "assignment-old", roleKey: "account_manager", scopeType: "client", scopeId: "client-jalas", scopeName: "جلس", status: "removed" }],
        availableClients: [],
      },
    ]} updateAssignmentAction={action} removeClientScopeAction={action} disableMembershipAction={action} />);
    const directory = screen.getByRole("region", { name: "أعضاء الفريق" });
    const rows = within(directory).getAllByRole("article");
    expect(rows).toHaveLength(3);
    expect(within(directory).getByText("3", { exact: true })).toBeVisible();
    expect(rows.map((row) => within(row).getByRole("heading").textContent)).toEqual([
      "سارة مصممة المحتوى", "مدير المساحة", "عضو معطل",
    ]);
    expect(within(rows[0]).getByLabelText("أدوار العضو")).toHaveTextContent("المصمم");
    expect(within(rows[0]).getByLabelText("أدوار العضو")).toHaveTextContent("كاتب المحتوى");
    expect(within(rows[0]).getByLabelText("عملاء العضو")).toHaveTextContent("هدنة");
    expect(within(rows[0]).getByLabelText("عملاء العضو")).toHaveTextContent("Glass Studio");
    expect(within(rows[0]).getByText("عضوية نشطة")).toBeVisible();
    expect(within(rows[1]).getAllByText("مدير النظام")[0]).toBeVisible();
    expect(within(rows[1]).getByText("صلاحية إدارية على مساحة سماوة.")).toBeVisible();
    expect(within(rows[2]).getByText("عضوية معطلة")).toBeVisible();
    expect(within(rows[2]).getByText("مدير الحساب")).toBeVisible();
    expect(within(rows[2]).getByLabelText("عملاء العضو")).toHaveTextContent("جلس");
    expect(within(rows[0]).getByText("إدارة العضو")).toBeVisible();
    expect(within(rows[0]).getAllByRole("combobox", { name: "الدور" })).toHaveLength(2);
    expect(within(rows[0]).getAllByRole("combobox", { name: "نطاق العميل" })).toHaveLength(2);
    expect(within(rows[0]).getByRole("option", { name: "Glass Studio (غير نشط)" })).toBeInTheDocument();
    expect(within(rows[0]).getAllByRole("button", { name: "حفظ التعديل" })).toHaveLength(2);
    expect(within(rows[0]).getAllByRole("button", { name: "إزالة نطاق العميل" })).toHaveLength(2);
    expect(within(rows[0]).getAllByLabelText(/أؤكد إزالة دور .* للعضو «سارة مصممة المحتوى» من العميل/)).toHaveLength(2);
    fireEvent.click(within(rows[0]).getByText("إدارة العضو"));
    expect(within(rows[0]).getByLabelText("اكتب «تعطيل» للتأكيد")).toBeRequired();
    expect(within(rows[0]).getByText(/سيُعطّل دخول «سارة مصممة المحتوى»/)).toBeVisible();
    expect(within(rows[0]).getByRole("button", { name: "تعطيل العضوية" })).toBeVisible();
    expect(within(rows[2]).queryByText("إدارة العضو")).not.toBeInTheDocument();
    expect(directory).not.toHaveTextContent(/membership-|user-|assignment-|client-|tenant-|content_writer|account_manager/);
  });

  it("keeps the empty directory honest without placeholder members", () => {
    render(<InternalTeamDirectory members={[]} />);
    const directory = screen.getByRole("region", { name: "أعضاء الفريق" });
    expect(within(directory).getByText("لا يوجد أعضاء فريق مفعّلون بعد.")).toBeVisible();
    expect(within(directory).queryAllByRole("article")).toHaveLength(0);
  });
});
