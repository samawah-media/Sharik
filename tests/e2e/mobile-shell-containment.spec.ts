import { expect, test, type Page, type TestInfo } from "@playwright/test";

const clientDestinations = [
  { href: "/client", label: "الرئيسية" },
  { href: "/client/work", label: "أعمالي" },
  { href: "/client/pending", label: "بانتظار موافقتي" },
  { href: "/client/files", label: "الملفات" },
  { href: "/client/commercial", label: "العقد والمتابعة" },
];

const measure = (element: Element) => {
  const { left, right, top, bottom, width, height } =
    element.getBoundingClientRect();
  return {
    left,
    right,
    top,
    bottom,
    width,
    height,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
};

const isFullyVisible = (element: Element) => {
  const { left, right, top, bottom } = element.getBoundingClientRect();
  return (
    left >= -0.5 &&
    right <= window.innerWidth + 0.5 &&
    top >= -0.5 &&
    bottom <= window.innerHeight + 0.5
  );
};

const expectFullyVisible = (metrics: {
  left: number;
  right: number;
  top: number;
  bottom: number;
  viewport: { width: number; height: number };
}) => {
  expect(metrics.left).toBeGreaterThanOrEqual(-0.5);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewport.width + 0.5);
  expect(metrics.top).toBeGreaterThanOrEqual(-0.5);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewport.height + 0.5);
};

const expectNoDocumentOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth,
      window.visualViewport?.width ?? 0,
    );
    const scrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      document.scrollingElement?.scrollWidth ?? 0,
    );
    return { documentWidth, scrollWidth };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.documentWidth + 1);
  return overflow;
};

const getClientNav = (page: Page) =>
  page.getByRole("navigation", { name: "تنقل بوابة العميل" });

const capture = async (page: Page, testInfo: TestInfo, name: string) => {
  await page.screenshot({
    caret: "initial",
    fullPage: false,
    path: testInfo.outputPath(`${name}.png`),
  });
};

for (const [name, viewport] of [
  ["390x844", { width: 390, height: 844 }],
  ["400px", { width: 400, height: 844 }],
] as const) {
  test.describe(`mobile client shell containment at ${name}`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
    });

    test("keeps the document inside the viewport and reveals the active destination on first render", async ({
      page,
    }, testInfo) => {
      await page.goto("/client/commercial?as=client_approver_a", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      const nav = getClientNav(page);
      await expect(nav).toBeVisible();

      const overflow = await expectNoDocumentOverflow(page);

      const active = nav.locator('a[aria-current="page"]');
      await expect(active).toHaveText("العقد والمتابعة");
      await expect.poll(() => active.evaluate(isFullyVisible), {
        timeout: 20_000,
      }).toBe(true);
      const activeMetrics = await active.evaluate(measure);
      expectFullyVisible(activeMetrics);
      expect(activeMetrics.height).toBeGreaterThanOrEqual(44);
      expect(activeMetrics.width).toBeGreaterThanOrEqual(44);

      // The initial reveal scrolls the strip without stealing keyboard focus.
      expect(
        await page.evaluate(() => document.activeElement === document.body),
      ).toBe(true);

      await expect(
        page.getByText("مرّر عشان تشوف باقي الأقسام"),
      ).toBeVisible();

      await testInfo.attach("active-link-metrics.json", {
        body: JSON.stringify({ overflow, activeMetrics }, null, 2),
        contentType: "application/json",
      });
      await capture(page, testInfo, `active-reveal-${name}`);
    });

    test("keeps every destination reachable by scroll and focus with 44px targets", async ({
      page,
    }, testInfo) => {
      await page.goto("/client?as=client_approver_a", {
        waitUntil: "domcontentloaded",
      });
      const nav = getClientNav(page);
      await expect(nav).toBeVisible();

      const measured: Record<string, unknown> = {};
      for (const destination of clientDestinations) {
        const link = nav.getByRole("link", {
          name: destination.label,
          exact: true,
        });
        await link.scrollIntoViewIfNeeded();
        await expect(link).toBeVisible();
        await link.focus();
        await expect.poll(() => link.evaluate(isFullyVisible), {
          timeout: 10_000,
        }).toBe(true);
        const metrics = await link.evaluate(measure);
        expectFullyVisible(metrics);
        expect(metrics.height).toBeGreaterThanOrEqual(44);
        expect(metrics.width).toBeGreaterThanOrEqual(44);
        expect(await link.getAttribute("href")).toBe(destination.href);
        measured[destination.label] = metrics;
      }

      await expectNoDocumentOverflow(page);
      await testInfo.attach("destination-metrics.json", {
        body: JSON.stringify(measured, null, 2),
        contentType: "application/json",
      });
      await capture(page, testInfo, `destinations-${name}`);
    });

    test("contains the notification quick menu inside the viewport and scrolls long content internally", async ({
      page,
    }, testInfo) => {
      await page.goto("/client?as=client_approver_a", {
        waitUntil: "domcontentloaded",
      });
      const bell = page.getByRole("button", { name: "الإشعارات", exact: true });
      await expect(bell).toBeVisible();
      await bell.click();

      const menu = page.getByRole("menu", { name: "آخر الإشعارات" });
      await expect(menu).toBeVisible();
      const header = page
        .locator('[data-product-shell="client"] header')
        .first();
      const initialHeaderTop = await header.evaluate(
        (element) => element.getBoundingClientRect().top,
      );
      expect(initialHeaderTop).toBeGreaterThan(0);

      const menuMetrics = await menu.evaluate(measure);
      expect(menuMetrics.left).toBeGreaterThanOrEqual(16);
      expect(menuMetrics.right).toBeLessThanOrEqual(
        menuMetrics.viewport.width - 16,
      );
      expect(menuMetrics.top).toBeGreaterThanOrEqual(0);
      expect(menuMetrics.bottom).toBeLessThanOrEqual(
        menuMetrics.viewport.height,
      );
      await expectNoDocumentOverflow(page);

      const scrollProbe = await menu.evaluate((element) => {
        // The fixture bell is empty; add temporary tall content to prove the
        // menu scrolls internally instead of pushing the document.
        const filler = document.createElement("div");
        filler.setAttribute("data-testid", "menu-scroll-filler");
        filler.style.height = "1200px";
        element.appendChild(filler);
        element.scrollTop = 400;
        const scrollingElement = document.scrollingElement;
        return {
          scrollsInternally: element.scrollTop > 0,
          pageScrolled: (scrollingElement?.scrollTop ?? 0) > 0,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          overflowY: window.getComputedStyle(element).overflowY,
          position: window.getComputedStyle(element).position,
        };
      });
      expect(scrollProbe.scrollHeight).toBeGreaterThan(scrollProbe.clientHeight);
      expect(scrollProbe.scrollsInternally).toBe(true);
      expect(scrollProbe.pageScrolled).toBe(false);
      expect(scrollProbe.overflowY).toBe("auto");
      expect(scrollProbe.position).toBe("fixed");

      const expandedMenuMetrics = await menu.evaluate(measure);
      expect(expandedMenuMetrics.left).toBeGreaterThanOrEqual(16);
      expect(expandedMenuMetrics.right).toBeLessThanOrEqual(
        expandedMenuMetrics.viewport.width - 16,
      );
      expect(expandedMenuMetrics.top).toBeGreaterThanOrEqual(0);
      expect(expandedMenuMetrics.bottom).toBeLessThanOrEqual(
        expandedMenuMetrics.viewport.height,
      );

      await page.evaluate(() => {
        const main = document.querySelector(
          '[data-product-shell="client"] main',
        );
        const filler = document.createElement("div");
        filler.setAttribute("data-testid", "page-scroll-filler");
        filler.style.height = "1200px";
        main?.appendChild(filler);
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await expect
        .poll(() =>
          header.evaluate((element) => element.getBoundingClientRect().top),
        )
        .toBeLessThanOrEqual(0.5);

      const stickyMenuMetrics = await menu.evaluate(measure);
      expect(stickyMenuMetrics.left).toBeGreaterThanOrEqual(16);
      expect(stickyMenuMetrics.right).toBeLessThanOrEqual(
        stickyMenuMetrics.viewport.width - 16,
      );
      expect(stickyMenuMetrics.top).toBeGreaterThanOrEqual(0);
      expect(stickyMenuMetrics.bottom).toBeLessThanOrEqual(
        stickyMenuMetrics.viewport.height,
      );
      await expectNoDocumentOverflow(page);

      await testInfo.attach("menu-metrics.json", {
        body: JSON.stringify(
          {
            expandedMenuMetrics,
            initialHeaderTop,
            menuMetrics,
            scrollProbe,
            stickyMenuMetrics,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await capture(page, testInfo, `notification-menu-${name}`);

      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(bell).toBeFocused();
    });
  });
}
