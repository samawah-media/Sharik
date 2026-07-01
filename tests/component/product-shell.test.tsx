import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonLink } from "@/ui/core/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/ui/core/states";
import { PageHeader } from "@/ui/layout/page-header";
import { ProductShell } from "@/ui/layout/product-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/clients/client_a/deliverables/board",
}));

afterEach(() => cleanup());

describe("management product shell", () => {
  it("renders an RTL shell with sidebar navigation, top context, breadcrumbs, and bounded content", () => {
    render(
      <ProductShell>
        <main>
          <PageHeader
            actions={<ButtonLink href="/clients">رجوع</ButtonLink>}
            description="Client A"
            title="لوحة Kanban الداخلية"
          />
        </main>
      </ProductShell>,
    );

    const shell = screen.getByTestId("product-shell");
    expect(shell).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("link", { name: /شريك/ })).toHaveAttribute(
      "href",
      "/clients",
    );
    expect(
      screen.getByRole("navigation", { name: "تنقل الإدارة" }),
    ).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: "مسار الصفحة" }),
    ).toBeVisible();
    expect(screen.getByText("لوحة Kanban")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "لوحة Kanban الداخلية" }),
    ).toBeVisible();
    expect(
      screen.getByText("تجربة داخلية آمنة بدون بيانات عملاء حقيقية"),
    ).toBeVisible();
  });

  it("renders shared safe states without leaking technical details", () => {
    render(
      <div>
        <EmptyState
          title="لا توجد بيانات"
          description="أضف عنصرًا داخل النطاق."
        />
        <ErrorState
          title="تعذر الوصول"
          description="لم يتم عرض بيانات خارج صلاحياتك."
        />
        <LoadingSkeleton label="تحميل الصفحة" />
      </div>,
    );

    expect(
      screen.getByRole("heading", { name: "لا توجد بيانات" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "تعذر الوصول" })).toBeVisible();
    expect(screen.getByLabelText("تحميل الصفحة")).toBeVisible();
    expect(screen.queryByText("stack trace")).not.toBeInTheDocument();
  });

  it("keeps page header actions in a dedicated action area", () => {
    render(
      <PageHeader
        actions={<ButtonLink href="/clients/new">إضافة عميل</ButtonLink>}
        description="مساحات العملاء الحالية"
        title="العملاء"
      />,
    );

    const header = screen.getByText("مساحات العملاء الحالية").closest("header");
    if (!header) {
      throw new Error("PageHeader root not found");
    }
    expect(
      within(header).getByRole("heading", { name: "العملاء" }),
    ).toBeVisible();
    expect(
      within(header).getByRole("link", { name: "إضافة عميل" }),
    ).toHaveAttribute("href", "/clients/new");
  });
});
