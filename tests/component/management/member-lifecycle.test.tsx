import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
            clientId: "00000000-0000-4000-8000-000000000101",
            clientName: "هدنة",
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
    expect(screen.getByText("يعمل على: Glass")).toBeInTheDocument();
    expect(screen.queryByText(/00000000/u)).not.toBeInTheDocument();
  });
});
