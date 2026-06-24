import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InvitationList } from "@/ui/management/invitation-list";
import {
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
            id: "inv_pending",
            tenantId: "tenant_a",
            invitedEmail: "pending@example.test",
            membershipType: "internal",
            roleKey: "designer",
            clientIds: ["client_a"],
            status: "pending",
            token: "redacted",
            expiresAt: "2026-07-01T00:00:00.000Z",
            createdBy: "tenant_admin_a",
            createdAt: "2026-06-24T00:00:00.000Z",
            deliveryState: "sent",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "إعادة الإرسال" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "إلغاء الدعوة" }),
    ).toBeInTheDocument();
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
});
