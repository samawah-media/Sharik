import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonLink } from "@/ui/core/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/ui/core/states";
import { PageHeader } from "@/ui/layout/page-header";
import { ProductShell } from "@/ui/layout/product-shell";
import { ClientShell } from "@/ui/client/client-shell";
import userEvent from "@testing-library/user-event";

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
  it("reveals the focused client navigation link with nearest scrolling", async () => {
    const user = userEvent.setup();
    render(
      <ClientShell>
        <main>المحتوى</main>
      </ClientShell>,
    );
    const links = within(
      screen.getByRole("navigation", { name: "تنقل بوابة العميل" }),
    ).getAllByRole("link");
    // JSDOM has no scrolling implementation. Mock only this DOM boundary;
    // the real browser regression still requires full visible geometry.
    const scrolls = links.map((link) => {
      const scroll = vi.fn();
      link.scrollIntoView = scroll;
      return scroll;
    });
    await user.tab();
    expect(screen.getByRole("link", { name: /مساحة العميل/ })).toHaveFocus();
    for (const [index, link] of links.entries()) {
      await user.tab();
      expect(link).toHaveFocus();
      expect(scrolls[index]).toHaveBeenCalledExactlyOnceWith({
        block: "nearest",
        inline: "nearest",
      });
      expect(scrolls[index].mock.contexts[0]).toBe(link);
    }
  });

  it("preserves every deep breadcrumb destination when the mobile trail becomes scrollable", () => {
    render(
      <ProductShell>
        <main>المحتوى</main>
      </ProductShell>,
    );
    const trail = within(
      screen.getByRole("navigation", { name: "مسار الصفحة" }),
    );
    expect(
      trail.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual([
      "/clients",
      "/clients",
      "/clients/b0060000-0000-4000-8000-000000000301",
      "/clients/b0060000-0000-4000-8000-000000000301/deliverables",
    ]);
    expect(trail.getByText("لوحة العمل")).toBeVisible();
  });

  it.each([
    [true, "بانتظار موافقتي"],
    [false, "قيد المراجعة"],
  ])(
    "preserves client navigation and notification interaction for canApprove=%s",
    async (canApprove, pendingLabel) => {
      pathnameState.value = "/client/pending";
      const user = userEvent.setup();
      render(
        <ClientShell canApprove={canApprove}>
          <main>المحتوى</main>
        </ClientShell>,
      );
      const nav = within(
        screen.getByRole("navigation", { name: "تنقل بوابة العميل" }),
      );
      expect(
        nav.getAllByRole("link").map((link) => link.getAttribute("href")),
      ).toEqual([
        "/client",
        "/client/work",
        "/client/pending",
        "/client/files",
        "/client/commercial",
      ]);
      expect(nav.getByRole("link", { name: pendingLabel })).toHaveAttribute(
        "aria-current",
        "page",
      );
      // JSDOM has no responsive Tailwind layout; browser tests enforce one
      // visible account/sign-out and exclude the inactive copy from tab order.
      expect(screen.getAllByText("حسابي").length).toBeGreaterThan(0);
      for (const signOut of screen.getAllByRole("button", {
        name: "تسجيل الخروج",
      })) {
        expect(signOut).toBeEnabled();
      }
      const bell = screen.getByRole("button", { name: "الإشعارات" });
      await user.click(bell);
      expect(screen.getByRole("menu", { name: "آخر الإشعارات" })).toBeVisible();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(bell).toHaveFocus();
    },
  );

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

  it.each([
    ["/notifications", "الإشعارات", "notifications"],
    ["/clients/onboard", "إضافة عميل جديد", "onboard"],
  ])(
    "renders %s as an Arabic breadcrumb without leaking the route segment",
    (pathname, arabicLabel, rawSegment) => {
      pathnameState.value = pathname;

      render(
        <ProductShell
          breadcrumbRootHref="/portfolio"
          breadcrumbRootLabel="لوحة الإدارة"
        >
          <main>{arabicLabel}</main>
        </ProductShell>,
      );

      const breadcrumbs = screen.getByRole("navigation", {
        name: "مسار الصفحة",
      });
      expect(within(breadcrumbs).getByText(arabicLabel)).toBeInTheDocument();
      expect(
        within(breadcrumbs).queryByText(rawSegment),
      ).not.toBeInTheDocument();
    },
  );

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
