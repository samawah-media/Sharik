import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignedClients } from "@/ui/management/assigned-clients";
import {
  InternalInviteEmptyState,
  InternalInviteForm,
  InternalInviteLoadingState,
  InternalInviteSaveFailure,
} from "@/ui/management/internal-invite-form";

describe("internal invitation UI", () => {
  it("renders Arabic RTL-ready invite fields", () => {
    render(<InternalInviteForm />);

    expect(
      screen.getByRole("form", { name: "دعوة عضو داخلي" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("بريد العضو")).toBeRequired();
    expect(screen.getByLabelText("الدور")).toBeRequired();
    expect(screen.getByLabelText("نطاق العميل")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "إرسال الدعوة" }),
    ).toBeInTheDocument();
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
    expect(screen.getByText("جاري تجهيز الدعوة...")).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: "عرض هدنة" })).toHaveAttribute(
      "href",
      "/clients/client_a",
    );
    expect(screen.getByRole("link", { name: "مخرجات هدنة" })).toHaveAttribute(
      "href",
      "/clients/client_a/deliverables",
    );
    expect(screen.getByRole("link", { name: "المتابعة / SLA" })).toHaveAttribute(
      "href",
      "/clients/client_a/commercial",
    );
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("renders no-assigned-client state", () => {
    render(<AssignedClients clients={[]} />);

    expect(screen.getByText("لا يوجد عملاء مسندون")).toBeInTheDocument();
  });
});
