import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ClientHome,
  ClientInviteForm,
  ClientPortalDeniedState,
  ClientPortalEmptyState,
} from "@/ui/client/client-home";

describe("client onboarding UI", () => {
  it("renders client invite form with exactly one client scope field", () => {
    render(<ClientInviteForm />);

    expect(screen.getByRole("form", { name: "دعوة عضو عميل" })).toBeInTheDocument();
    expect(screen.getByLabelText("بريد عضو العميل")).toBeRequired();
    expect(screen.getByLabelText("الدور")).toBeRequired();
    expect(screen.getByLabelText("نطاق العميل")).toBeRequired();
    expect(screen.getByRole("button", { name: "إرسال الدعوة" })).toBeInTheDocument();
  });

  it("renders client portal first-entry surface without admin data", () => {
    render(
      <ClientHome
        clientName="هدنة"
        stats={{
          deliverablesCount: 52,
          packageLineCount: 5,
          waitingWorkCount: 35,
          waitingClientCount: 5,
          completedCount: 12,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "مساحة هدنة" })).toBeInTheDocument();
    expect(screen.getByText("بانتظار موافقتي")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "عرض مخرجاتي" }),
    ).toHaveAttribute("href", "/client/commercial#deliverables");
    expect(screen.getByRole("link", { name: "عرض الباقة" })).toHaveAttribute(
      "href",
      "/client/commercial#package",
    );
    expect(screen.getByText("المخرجات والباقة")).toBeInTheDocument();
    expect(screen.getByText("عدد المخرجات")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
    expect(screen.queryByText("لوحة الإدارة")).not.toBeInTheDocument();
  });

  it("renders empty and denied states without leaking other clients", () => {
    render(
      <>
        <ClientPortalEmptyState />
        <ClientPortalDeniedState />
      </>,
    );

    expect(screen.getByText("لا توجد عناصر ظاهرة بعد")).toBeInTheDocument();
    expect(screen.getByText("لا يمكنك الوصول لهذه المساحة")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });
});
