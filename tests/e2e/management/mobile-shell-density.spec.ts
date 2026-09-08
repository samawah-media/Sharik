import {
  devices,
  expect,
  test,
  type Locator,
  type Page,
} from "@playwright/test";

const surfaces = [
  {
    name: "assigned work",
    url: "/work?as=assigned_internal_a",
    kind: "management",
    account: "حساب الفريق",
  },
  {
    name: "deep management trail",
    url: "/clients/client_a/deliverables/board?as=tenant_admin_a",
    kind: "management",
    account: "حساب الفريق",
  },
  {
    name: "client viewer",
    url: "/client/pending?as=client_viewer_a",
    kind: "client",
    account: "حسابي",
  },
  {
    name: "client approver",
    url: "/client/pending?as=client_approver_a",
    kind: "client",
    account: "حسابي",
  },
] as const;

async function openShell(page: Page, surface: (typeof surfaces)[number]) {
  await page.goto(surface.url, { waitUntil: "domcontentloaded" });
  const shell = page.locator(`[data-product-shell="${surface.kind}"]`);
  await expect(shell).toBeVisible();
  await expect(shell).toHaveAttribute("dir", "rtl");
  await page.evaluate(() => document.fonts.ready);
  return shell;
}

async function expectUtilities(shell: Locator, account: string) {
  await expect(
    shell.getByText(account, { exact: true }).filter({ visible: true }),
  ).toHaveCount(1);
  await expect(shell.getByRole("button", { name: "تسجيل الخروج" })).toHaveCount(
    1,
  );
  await expect(shell.getByRole("button", { name: /^الإشعارات/ })).toHaveCount(
    1,
  );
}

async function tabTo(page: Page, target: Locator, backwards = false) {
  for (let step = 0; step < 80; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement))
      break;
    await page.keyboard.press(backwards ? "Shift+Tab" : "Tab");
  }
  await expect(target).toBeFocused();
  // Check actual clipping ancestors, not merely DOM visibility. Keyboard focus
  // must reveal a link inside the horizontally scrolling RTL navigation/trail.
  const readGeometry = () =>
    target.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      let left = 0;
      let right = window.innerWidth;
      let top = 0;
      let bottom = window.innerHeight;
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      const style = getComputedStyle(element);
      return {
        diagnostics: {
          label: element.textContent,
          rect: {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          },
          clippingBounds: { left, right, top, bottom },
          navigationScrollLeft: element.closest("nav")?.scrollLeft ?? null,
        },
        revealed:
          rect.left >= left - 1 &&
          rect.right <= right + 1 &&
          rect.top >= top - 1 &&
          rect.bottom <= bottom + 1,
        focusVisible:
          element.matches(":focus-visible") &&
          (parseFloat(style.outlineWidth) > 0 || style.boxShadow !== "none"),
      };
    });
  let lastGeometry: Awaited<ReturnType<typeof readGeometry>> | undefined;
  try {
    await expect
      .poll(
        async () => {
          lastGeometry = await readGeometry();
          return {
            revealed: lastGeometry.revealed,
            focusVisible: lastGeometry.focusVisible,
          };
        },
        {
          timeout: 2_000,
          message:
            "Keyboard focus must become fully revealed without forced scrolling",
        },
      )
      .toEqual({ revealed: true, focusVisible: true });
  } catch (error) {
    await test.info().attach("keyboard-geometry-failure.json", {
      body: JSON.stringify(lastGeometry, null, 2),
      contentType: "application/json",
    });
    throw error;
  }
}

for (const surface of surfaces) {
  for (const viewport of [
    { width: 375, height: 812 },
    devices["Pixel 7"].viewport,
  ]) {
    test(`${surface.name}: mobile shell ${viewport.width}px is compact and keyboard reachable`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "mobile-chromium",
        "Mobile geometry runs in the existing Pixel 7 project.",
      );
      await page.setViewportSize(viewport);
      const shell = await openShell(page, surface);
      const header = shell.locator("header").first();
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      await testInfo.attach("mobile-shell-metrics.json", {
        body: JSON.stringify(
          {
            surface: surface.name,
            viewport,
            header: headerBox,
            chromeHeight: headerBox!.y + headerBox!.height,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("mobile-shell-viewport.png"),
      });
      // Soft geometry assertions keep keyboard/preservation evidence available in RED.
      expect
        .soft(headerBox!.y + headerBox!.height, "shell chrome before content")
        .toBeLessThanOrEqual(200);
      expect
        .soft(headerBox!.height, "sticky utility strip")
        .toBeLessThanOrEqual(112);
      await expectUtilities(shell, surface.account);
      const navigation = shell.locator("aside nav");
      if (surface.kind === "client") {
        expect(
          await navigation
            .getByRole("link")
            .evaluateAll((links) =>
              links.map((link) => link.getAttribute("href")),
            ),
        ).toEqual([
          "/client",
          "/client/work",
          "/client/pending",
          "/client/files",
          "/client/commercial",
        ]);
        // ClientLayout deliberately defaults canApprove=true in fixture mode;
        // the component test covers the real viewer-specific shell label.
        await expect(
          navigation.getByRole("link", { name: "بانتظار موافقتي" }),
        ).toHaveAttribute("aria-current", "page");
      } else {
        // ManagementLayout intentionally omits sidebar navigation in fixture
        // mode. This is NOT management-nav coverage; component tests preserve
        // its role-filtered links. The real client navigation is tested above.
        await expect(navigation).toHaveCount(0);
      }
      if (surface.name === "deep management trail") {
        const trail = shell.getByRole("navigation", { name: "مسار الصفحة" });
        expect(
          await trail
            .getByRole("link")
            .evaluateAll((links) =>
              links.map((link) => link.getAttribute("href")),
            ),
        ).toEqual([
          "/portfolio",
          "/clients",
          "/clients/client_a",
          "/clients/client_a/deliverables",
        ]);
        await expect(
          trail.getByText("لوحة العمل", { exact: true }),
        ).toBeVisible();
      }
      const controls = shell
        .locator("aside")
        .locator("a[href], button")
        .or(header.locator("a[href], button"))
        .filter({ visible: true });
      for (const control of await controls.all()) {
        const box = await control.boundingBox();
        expect
          .soft(box!.width, await control.innerText())
          .toBeGreaterThanOrEqual(44);
        expect
          .soft(box!.height, await control.innerText())
          .toBeGreaterThanOrEqual(44);
        await tabTo(page, control);
      }
      const bell = shell.getByRole("button", { name: /^الإشعارات/ });
      await tabTo(page, bell, true);
      await page.keyboard.press("Enter");
      await expect(
        shell.getByRole("menu", { name: "آخر الإشعارات" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(shell.getByRole("menu")).toHaveCount(0);
      await expect(bell).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBe(true);
    });
  }

  test(`${surface.name}: desktop keeps the right rail and account controls`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chromium",
      "Desktop preservation uses desktop/RTL projects.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    const shell = await openShell(page, surface);
    const rail = shell.locator("aside");
    const railBox = await rail.boundingBox();
    const headerBox = await shell.locator("header").first().boundingBox();
    await testInfo.attach("desktop-shell-metrics.json", {
      body: JSON.stringify(
        { surface: surface.name, rail: railBox, header: headerBox },
        null,
        2,
      ),
      contentType: "application/json",
    });
    await page.screenshot({
      caret: "initial",
      path: testInfo.outputPath("desktop-shell-viewport.png"),
    });
    expect(railBox!.width).toBeCloseTo(248, 0);
    expect(railBox!.x + railBox!.width).toBeCloseTo(1440, 0);
    expect(headerBox!.y).toBe(0);
    expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(railBox!.x + 1);
    await expect(
      rail.getByRole("button", { name: "تسجيل الخروج" }),
    ).toBeVisible();
    await expectUtilities(shell, surface.account);
    if (surface.kind === "management") {
      // No management sidebar links exist in these fixtures; do not report a
      // zero-iteration loop as desktop management-navigation verification.
      await expect(rail.getByRole("navigation")).toHaveCount(0);
    } else {
      const links = await rail.getByRole("navigation").getByRole("link").all();
      expect(links).toHaveLength(5);
      for (let index = 1; index < links.length; index += 1) {
        const previous = await links[index - 1].boundingBox();
        const current = await links[index].boundingBox();
        expect(current!.y).toBeGreaterThanOrEqual(
          previous!.y + previous!.height,
        );
      }
    }
  });
}
