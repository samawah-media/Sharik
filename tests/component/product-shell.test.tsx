import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonLink } from "@/ui/core/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/ui/core/states";
import { PageHeader } from "@/ui/layout/page-header";
import { ProductShell } from "@/ui/layout/product-shell";
import { ClientShell } from "@/ui/client/client-shell";
import userEvent from "@testing-library/user-event";

const { pathnameState, authListeners } = vi.hoisted(() => ({
  pathnameState: {
    value: "/clients/b0060000-0000-4000-8000-000000000301/deliverables/board",
  },
  authListeners: [] as Array<
    (
      event: string,
      session: { user?: { id: string } | null } | null,
    ) => void
  >,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

// The shell now mounts the stale-tab session notice; mock only the external
// Supabase browser auth boundary so its listener can be driven on demand.
vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
        authListeners.push(listener as never);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  }),
}));

const emitAuthEvent = async (
  event: string,
  session: { user?: { id: string } | null } | null,
) => {
  await act(async () => {
    for (const listener of [...authListeners]) {
      listener(event, session);
    }
  });
};

afterEach(() => {
  cleanup();
  authListeners.length = 0;
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

  it("shows the team member's safe display name and Arabic role labels instead of the generic account label", () => {
    const displayName =
      "نورةالشمرينورةالشمرينورةالشمرينورةالشمرينورةالشمري";
    render(
      <ProductShell
        accountIdentity={{
          displayName,
          roleLabels: ["مدير الحساب", "المصمم"],
        }}
      >
        <main>المحتوى</main>
      </ProductShell>,
    );

    const identity = screen.getByTestId("product-shell-account-identity");
    const name = within(identity).getByText(displayName);
    const controls = identity.parentElement;
    expect(controls).not.toBeNull();
    expect(controls).toHaveClass("min-w-0", "max-w-full");
    expect(identity).toHaveClass("min-w-0", "max-w-full");
    expect(name).toHaveClass("break-words", "[overflow-wrap:anywhere]");
    expect(name).toHaveTextContent(displayName);
    expect(within(identity).getByText("مدير الحساب · المصمم")).toBeVisible();
    expect(
      within(controls as HTMLElement).getByRole("button", {
        name: "الإشعارات",
      }),
    ).toBeVisible();
    expect(
      within(controls as HTMLElement).getByRole("button", {
        name: "تسجيل الخروج",
      }),
    ).toBeVisible();
    expect(screen.queryByText("حساب الفريق")).not.toBeInTheDocument();
  });

  it("keeps a safe generic account fallback without raw values when identity data is absent", () => {
    render(
      <ProductShell>
        <main>المحتوى</main>
      </ProductShell>,
    );

    expect(screen.getByText("حساب الفريق")).toBeVisible();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it("surfaces the stale-tab session change notice inside the management shell", async () => {
    render(
      <ProductShell>
        <main>المحتوى</main>
      </ProductShell>,
    );

    await emitAuthEvent("INITIAL_SESSION", { user: { id: "auth-user-initial" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await emitAuthEvent("SIGNED_IN", { user: { id: "auth-user-second" } });
    const shell = screen.getByTestId("product-shell");
    const alert = within(shell).getByRole("alert");
    expect(alert).toHaveTextContent(
      "تغيّر الحساب في تبويب ثاني. حدّث الصفحة عشان تكمل بالحساب الصحيح.",
    );
    expect(
      within(shell).getByRole("button", { name: "تحديث الصفحة" }),
    ).toBeVisible();
    expect(shell.innerHTML).not.toContain("auth-user-initial");
    expect(shell.innerHTML).not.toContain("auth-user-second");
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

  it("labels a non-root portfolio breadcrumb as team clients while preserving the management root override", () => {
    pathnameState.value = "/portfolio";

    const { rerender } = render(
      <ProductShell
        breadcrumbRootHref="/work"
        breadcrumbRootLabel="مهامي"
      >
        <main>team portfolio</main>
      </ProductShell>,
    );

    let breadcrumbs = screen.getByRole("navigation", { name: "مسار الصفحة" });
    expect(
      within(breadcrumbs)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["مهامي", "عملائي"]);

    rerender(
      <ProductShell
        breadcrumbRootHref="/portfolio"
        breadcrumbRootLabel="لوحة الإدارة"
      >
        <main>management portfolio</main>
      </ProductShell>,
    );

    breadcrumbs = screen.getByRole("navigation", { name: "مسار الصفحة" });
    expect(within(breadcrumbs).queryByText("عملائي")).not.toBeInTheDocument();
    expect(within(breadcrumbs).getAllByText("لوحة الإدارة")).toHaveLength(2);
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

  it("keeps the mobile management header from containing the viewport-fixed notification menu", () => {
    render(
      <ProductShell>
        <main>المحتوى</main>
      </ProductShell>,
    );

    const header = screen.getByTestId("product-shell").querySelector("header");
    expect(header).not.toBeNull();
    expect(header).not.toHaveClass("backdrop-blur");
    expect(header).toHaveClass("lg:backdrop-blur");
  });

  describe("client portal mobile shell", () => {
    it("keeps five scroll-snapped destinations with the Saudi overflow hint and edge affordance", () => {
      pathnameState.value = "/client";
      render(
        <ClientShell>
          <main>المحتوى</main>
        </ClientShell>,
      );
      const nav = screen.getByRole("navigation", {
        name: "تنقل بوابة العميل",
      });
      expect(nav.getAttribute("aria-describedby")).toBe(
        "client-nav-scroll-hint",
      );
      const hint = document.getElementById("client-nav-scroll-hint");
      expect(hint).not.toBeNull();
      expect(hint).toHaveTextContent("مرّر عشان تشوف باقي الأقسام");
      const affordance = screen.getByTestId("client-nav-overflow-affordance");
      expect(affordance).toHaveAttribute("aria-hidden", "true");
      expect(nav.className).toContain("overflow-x-auto");
      expect(nav.className).toContain("snap-x");
      const links = within(nav).getAllByRole("link");
      expect(links.map((link) => link.getAttribute("href"))).toEqual([
        "/client",
        "/client/work",
        "/client/pending",
        "/client/files",
        "/client/commercial",
      ]);
      for (const link of links) {
        expect(link.className).toContain("snap-start");
        expect(link.className).toContain("min-h-11");
      }
    });

    it("marks only the current client destination with aria-current", () => {
      pathnameState.value = "/client/files";
      render(
        <ClientShell>
          <main>المحتوى</main>
        </ClientShell>,
      );
      const nav = screen.getByRole("navigation", {
        name: "تنقل بوابة العميل",
      });
      const current = within(nav).getAllByRole("link", { current: "page" });
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAttribute("href", "/client/files");
      expect(current[0]).toHaveTextContent("الملفات");
    });

    it("hides a cookie-selected workspace label on a bookmarked work detail", () => {
      pathnameState.value =
        "/client/work/b0060000-0000-4000-8000-000000000399";
      const { rerender } = render(
        <ClientShell workspaceSelector={<p>مساحة عميل مختلف</p>}>
          <main>المخرج المصرح</main>
        </ClientShell>,
      );

      expect(screen.queryByText("مساحة عميل مختلف")).not.toBeInTheDocument();

      pathnameState.value = "/client/work";
      rerender(
        <ClientShell workspaceSelector={<p>مساحة عميل مختلف</p>}>
          <main>قائمة الأعمال</main>
        </ClientShell>,
      );
      expect(screen.getByText("مساحة عميل مختلف")).toBeVisible();
    });

    it("keeps the mobile header from containing the viewport-fixed notification menu", () => {
      pathnameState.value = "/client";
      render(
        <ClientShell>
          <main>المحتوى</main>
        </ClientShell>,
      );

      const shell = document.querySelector('[data-product-shell="client"]');
      const header = shell?.querySelector("header");
      expect(header).not.toBeNull();
      expect(header).not.toHaveClass("backdrop-blur");
      expect(header).toHaveClass("lg:backdrop-blur");
    });

    it("reveals the active client destination on first render without moving keyboard focus", () => {
      pathnameState.value = "/client/commercial";
      // JSDOM has no scrolling implementation; mock the DOM boundary so the
      // initial-reveal effect can be observed without real layout.
      const originalScrollIntoView =
        window.HTMLElement.prototype.scrollIntoView;
      const scrollIntoView = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
      try {
        render(
          <ClientShell>
            <main>المحتوى</main>
          </ClientShell>,
        );
        const nav = screen.getByRole("navigation", {
          name: "تنقل بوابة العميل",
        });
        const active = within(nav).getByRole("link", { current: "page" });
        expect(
          scrollIntoView,
        ).toHaveBeenCalledExactlyOnceWith({
          block: "nearest",
          inline: "nearest",
        });
        expect(scrollIntoView.mock.contexts[0]).toBe(active);
        expect(document.activeElement).toBe(document.body);
      } finally {
        window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      }
    });

    it("surfaces the stale-tab session change notice inside the client shell", async () => {
      pathnameState.value = "/client";
      render(
        <ClientShell>
          <main>المحتوى</main>
        </ClientShell>,
      );

      await emitAuthEvent("INITIAL_SESSION", { user: { id: "auth-user-initial" } });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      await emitAuthEvent("SIGNED_IN", { user: { id: "auth-user-second" } });
      const shell = document.querySelector('[data-product-shell="client"]');
      expect(shell).not.toBeNull();
      const alert = within(shell as HTMLElement).getByRole("alert");
      expect(alert).toHaveTextContent(
        "تغيّر الحساب في تبويب ثاني. حدّث الصفحة عشان تكمل بالحساب الصحيح.",
      );
      expect(
        within(shell as HTMLElement).getByRole("button", {
          name: "تحديث الصفحة",
        }),
      ).toBeVisible();
      expect(shell?.innerHTML).not.toContain("auth-user-initial");
      expect(shell?.innerHTML).not.toContain("auth-user-second");
    });
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
