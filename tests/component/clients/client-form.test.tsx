import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ClientDeniedState,
  ClientEmptyState,
  ClientForm,
} from "@/ui/management/client-form";

afterEach(cleanup);

describe("client form and states", () => {
  it("renders Arabic RTL-ready create fields", () => {
    render(<ClientForm />);

    expect(
      screen.getByRole("form", { name: "إنشاء عميل" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("اسم العميل")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "حفظ العميل" }),
    ).toBeInTheDocument();
  });

  it("renders update values with revision guard fields", () => {
    render(
      <ClientForm
        client={{
          id: "client_a",
          tenantId: "tenant_a",
          name: "عميل قائم",
          slug: "client-a",
          status: "active",
          primaryContactName: "مسؤولة التواصل",
          primaryContactEmail: "client@example.test",
          createdBy: "tenant_admin_a",
          createdAt: "2026-06-24T00:00:00.000Z",
          updatedAt: "2026-06-24T00:00:00.000Z",
          revision: 7,
        }}
        mode="update"
      />,
    );

    expect(
      screen.getByRole("form", { name: "تعديل العميل" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("عميل قائم")).toBeInTheDocument();
    expect(screen.getByDisplayValue("مسؤولة التواصل")).toBeInTheDocument();
    expect(screen.getByDisplayValue("client@example.test")).toBeInTheDocument();
    expect(document.querySelector('input[name="clientId"]')).toHaveValue("client_a");
    expect(document.querySelector('input[name="expectedRevision"]')).toHaveValue("7");
  });

  it("renders the empty state without leaking other client names", () => {
    render(<ClientEmptyState />);

    expect(screen.getByText("لا يوجد عملاء بعد")).toBeInTheDocument();
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
  });

  it("renders a safe denied state", () => {
    render(<ClientDeniedState />);

    expect(
      screen.getByRole("heading", {
        name: "لا يمكنك الوصول إلى هذا المورد.",
      }),
    ).toBeInTheDocument();
  });
});
