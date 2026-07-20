import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonLink } from "@/ui/core/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/ui/core/states";
import { PageHeader } from "@/ui/layout/page-header";
import { ProductShell } from "@/ui/layout/product-shell";

const { pathnameState } = vi.hoisted(() => ({
  pathnameState: {
    value: "/clients/b0060000-0000-4000-8000-000000000301/deliverables/board",
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  pathnameState.value =
    "/clients/b0060000-0000-4000-8000-000000000301/deliverables/board";
});

describe("management product shell", () => {
  it("renders an RTL shell with sidebar navigation, top context, breadcrumbs, and bounded content", () => {
    render(
      <ProductShell>
        <main>
          <PageHeader
            actions={<ButtonLink href="/clients">رجوع</ButtonLink>}
            description="هدنة"
            title="لوحة العمل"
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
    expect(screen.getByText("العميل")).toBeInTheDocument();
    expect(
      screen.queryByText("b0060000-0000-4000-8000-000000000301"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("لوحة العمل").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "لوحة العمل" })).toBeVisible();
    expect(screen.getByText("حساب الفريق")).toBeVisible();
  });

  it("can render account-manager shell navigation without admin-only links", () => {
    render(
      <ProductShell
        breadcrumbRootHref="/portfolio"
        breadcrumbRootLabel="عملائي"
        homeHref="/portfolio"
        navigationItems={[
          { href: "/portfolio", icon: "dashboard", label: "عملائي" },
          {
            href: "/clients/b0060000-0000-4000-8000-000000000301",
            icon: "briefcase",
            label: "هدنة",
          },
          {
            href: "/clients/b0060000-0000-4000-8000-000000000301/deliverables",
            icon: "file",
            label: "مخرجات هدنة",
          },
          {
            href: "/clients/b0060000-0000-4000-8000-000000000301/commercial",
            icon: "briefcase",
            label: "ملخص المتابعة",
          },
        ]}
        navigationLabel="تنقل مساحة الفريق"
      >
        <main>account manager shell</main>
      </ProductShell>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "تنقل مساحة الفريق",
    });
    expect(
      within(navigation).getByRole("link", { name: "عملائي" }),
    ).toHaveAttribute("href", "/portfolio");
    expect(
      screen.queryByRole("link", { name: "لوحة الإدارة" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "الفريق" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "الدعوات" }),
    ).not.toBeInTheDocument();
  });

  it("renders the work route breadcrumb in Arabic", () => {
    pathnameState.value = "/work";

    render(
      <ProductShell
        breadcrumbRootHref="/portfolio"
        breadcrumbRootLabel="لوحة الإدارة"
      >
        <main>work</main>
      </ProductShell>,
    );

    const breadcrumbs = screen.getByRole("navigation", {
      name: "مسار الصفحة",
    });
    expect(within(breadcrumbs).getByText("مهامي")).toBeInTheDocument();
    expect(within(breadcrumbs).queryByText("work")).not.toBeInTheDocument();
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
