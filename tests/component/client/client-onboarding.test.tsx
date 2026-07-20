import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ClientHome,
  ClientInviteForm,
  ClientPortalDeniedState,
  ClientPortalEmptyState,
} from "@/ui/client/client-home";

afterEach(cleanup);

describe("client onboarding UI", () => {
  it("renders client invite form with exactly one client scope field", () => {
    render(<ClientInviteForm />);

    expect(
      screen.getByRole("form", { name: "دعوة عضو عميل" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("بريد عضو العميل")).toBeRequired();
    expect(screen.getByLabelText("الدور")).toBeRequired();
    expect(screen.getByLabelText("نطاق العميل")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "إرسال الدعوة" }),
    ).toBeInTheDocument();
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

    expect(
      screen.getByRole("heading", { name: "مساحة هدنة" }),
    ).toBeInTheDocument();
    expect(screen.getByText("بانتظار موافقتي")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "مراجعة ما ينتظرني" }),
    ).toHaveAttribute("href", "/client/pending");
    expect(screen.getByRole("link", { name: "فتح الملفات" })).toHaveAttribute(
      "href",
      "/client/files",
    );
    expect(screen.getByText("المخرجات والباقة")).toBeInTheDocument();
    expect(screen.getByText("عدد المخرجات")).toBeInTheDocument();
    expect(screen.getByText("52")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
    expect(screen.queryByText("لوحة الإدارة")).not.toBeInTheDocument();
  });

  it("describes pending work as read-only for a client viewer", () => {
    render(<ClientHome canApprove={false} clientName="هدنة" />);

    expect(
      screen.getByText(/هنا تتابع ما هو قيد المراجعة/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "عرض ما هو قيد المراجعة" }),
    ).toHaveAttribute("href", "/client/pending");
    expect(screen.queryByText(/هنا تجد ما يحتاج قرارك/)).not.toBeInTheDocument();
  });

  it("renders empty and denied states without leaking other clients", () => {
    render(
      <>
        <ClientPortalEmptyState />
        <ClientPortalDeniedState />
      </>,
    );

    expect(screen.getByText("لا توجد عناصر ظاهرة بعد")).toBeInTheDocument();
    expect(
      screen.getByText("لا يمكنك الوصول لهذه المساحة"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });
});
