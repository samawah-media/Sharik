import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ClientDeniedState,
  ClientEmptyState,
  ClientForm,
} from "@/ui/management/client-form";

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
