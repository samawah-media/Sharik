import { expect, test, type Page, type TestInfo } from "@playwright/test";

test.describe.configure({ timeout: 180_000 });

const syntheticLeakPatterns = [
  /client_b/i,
  /tenant_b/i,
  /approval log/i,
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
];

const capture = async (
  page: Page,
  testInfo: TestInfo,
  name: string,
  options: { fullPage?: boolean } = {},
) => {
  await page.screenshot({
    caret: "initial",
    fullPage: options.fullPage ?? true,
    path: testInfo.outputPath(`${name}.png`),
  });
};

const observeBrowserErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    errors.push(message.text());
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
};

const expectNoSyntheticLeakage = async (page: Page) => {
  for (const pattern of syntheticLeakPatterns) {
    await expect(page.getByText(pattern)).toHaveCount(0);
  }
};

const expectRtlDocument = async (page: Page) => {
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
};

const expectNoUnexpectedHorizontalOverflow = async (
  page: Page,
  allowedTestId?: string,
) => {
  const overflow = await page.evaluate((allowed) => {
    const allowedElement = allowed
      ? document.querySelector(`[data-testid="${allowed}"]`)
      : null;
    const documentWidth = document.documentElement.clientWidth;
    return Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        if (allowedElement?.contains(element)) return false;
        return rect.right > documentWidth + 1 || rect.left < -1;
      })
      .map((element) => ({
        tag: element.tagName,
        text: element.textContent?.trim().slice(0, 80),
        width: Math.round(element.getBoundingClientRect().width),
      }));
  }, allowedTestId);

  expect(overflow).toEqual([]);
};

const expectMinimumTouchTargets = async (page: Page) => {
  const undersized = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([aria-hidden="true"]), a[href], input, select, textarea',
      ),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const styles = window.getComputedStyle(element);
        if (styles.visibility === "hidden" || styles.display === "none") {
          return false;
        }
        return rect.width < 43.5 || rect.height < 43.5;
      })
      .map((element) => ({
        tag: element.tagName,
        label:
          element.getAttribute("aria-label") ??
          element.textContent?.trim().slice(0, 80) ??
          element.getAttribute("name"),
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height),
      })),
  );

  expect(undersized).toEqual([]);
};

const expectReactHydrated = async (page: Page, selector: string) => {
  await expect
    .poll(async () =>
      page
        .locator(selector)
        .first()
        .evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith("__reactProps$")),
        )
        .catch(() => false),
    )
    .toBe(true);
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("management exception dashboard and team work visual states are RTL and stable", async ({
  page,
}, testInfo) => {
  const browserErrors = observeBrowserErrors(page);

  await page.goto("/clients?as=tenant_admin_a", { waitUntil: "domcontentloaded" });
  await expectRtlDocument(page);
  await expect(page.getByRole("main")).toBeVisible();
  await capture(page, testInfo, "management-exception-dashboard");

  await page.goto("/work?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "مهامي" })).toBeVisible();
  await expect(page.getByTestId("team-work-list")).toBeVisible();
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "assigned-team-my-work-list");

  await page.getByRole("button", { name: "لوحة العمل" }).click();
  await expect(page.getByTestId("kanban-board-scroll")).toBeVisible();
  await expect(page.getByTestId("kanban-column")).toHaveCount(6);
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page, "kanban-board-scroll");
  await capture(page, testInfo, "assigned-team-six-lane-board");

  expect(browserErrors).toEqual([]);
});

test("deliverable list, universal drawer, forms, files, comments, and focus return pass visual QA", async ({
  page,
}, testInfo) => {
  const browserErrors = observeBrowserErrors(page);

  await page.goto("/clients/client_a/deliverables?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: /مخرجات/ })).toBeVisible();
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await capture(page, testInfo, "management-deliverable-list");

  await page.goto("/work?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });
  const drawerButton = page
    .getByRole("button", { name: "فتح مساحة المخرج" })
    .first();
  await expectReactHydrated(page, 'button[aria-haspopup="dialog"]');
  await expect(drawerButton).toBeEnabled();
  await drawerButton.focus();
  await drawerButton.click();
  const drawer = page.getByTestId("deliverable-drawer");
  const closeButton = drawer.getByRole("button", { name: "إغلاق" });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(closeButton).toBeFocused();
  await expect(
    drawer.getByRole("heading", { name: "المحتوى والنسخة" }),
  ).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "الملفات" })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "التعليقات" })).toBeVisible();
  await expectMinimumTouchTargets(page);
  await capture(page, testInfo, "universal-drawer-content-files-comments", {
    fullPage: false,
  });

  await closeButton.click();
  await expect(drawerButton).toBeFocused();
  await expectNoSyntheticLeakage(page);
  expect(browserErrors).toEqual([]);
});

test("client pending inbox visual states distinguish viewer and approver", async ({
  page,
}, testInfo) => {
  const browserErrors = observeBrowserErrors(page);

  await page.goto("/client/pending?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });
  await expectRtlDocument(page);
  await expect(page.getByRole("heading", { name: "بانتظار موافقتي" }).first()).toBeVisible();
  await expect(page.getByText("يمكنك مشاهدة المخرج فقط.")).toBeVisible();
  await expect(page.getByRole("button", { name: "اعتماد المخرج" })).toHaveCount(0);
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "client-viewer-read-only-pending");

  await page.goto("/client/pending?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("button", { name: "اعتماد المخرج" })).toBeVisible();
  await expect(page.getByRole("button", { name: "طلب تعديل" })).toBeVisible();
  await expect(page.getByText(/تعليق داخلي|ملاحظة جودة|internal/i)).toHaveCount(0);
  await expectMinimumTouchTargets(page);
  await capture(page, testInfo, "client-approver-actions-pending");

  expect(browserErrors).toEqual([]);
});

test("empty, loading-safe, error, and denied states stay redacted and accessible", async ({
  page,
}, testInfo) => {
  const browserErrors = observeBrowserErrors(page);

  await page.goto("/clients/client_b?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("main")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expectMinimumTouchTargets(page);
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "denied-client-scope-state");

  await page.goto("/client/pending?as=client_viewer_b", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("main")).toBeVisible();
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "empty-or-denied-client-pending-state");

  await page.goto("/clients/client_a/deliverables/board?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "لوحة العمل" })).toHaveCount(0);
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "board-denied-state");

  expect(browserErrors).toEqual([]);
});
