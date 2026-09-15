import { expect, test, type Page, type TestInfo } from "@playwright/test";

test.describe.configure({ timeout: 180_000 });

const syntheticLeakPatterns = [
  /client_b/i,
  /tenant_b/i,
  /tenant_administrator/i,
  /account_manager/i,
  /@[a-z0-9.-]+\.[a-z]{2,}/i,
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
    if (scrollWidth <= documentWidth + 1) return [];

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
    .poll(
      async () =>
        page
          .locator(selector)
          .first()
          .evaluate((element) =>
            Object.keys(element).some((key) => key.startsWith("__reactProps$")),
          )
          .catch(() => false),
      { timeout: 30_000 },
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

  await page.goto("/clients?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });
  await expectRtlDocument(page);
  await expect(page.getByRole("main")).toBeVisible();
  await capture(page, testInfo, "management-exception-dashboard");

  await page.goto("/work?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });
  await expectRtlDocument(page);
  await expect(page.getByRole("heading", { name: "مهامي" })).toBeVisible();
  const workList = page.getByTestId("team-work-list");
  const rows = workList.locator(":scope > article");
  const firstRow = rows.first();
  await expect(workList).toBeVisible();
  await expect(firstRow).toBeVisible();
  const originalRowCount = await rows.count();
  expect(originalRowCount).toBeGreaterThan(1);
  await expectReactHydrated(page, 'button[aria-haspopup="dialog"]');

  // Measure the regular fixture row, not the full list or an open drawer.
  // This catches reintroducing a full content-preview card in the scan view.
  const rowMetrics = await firstRow.evaluate((row) => {
    const rect = row.getBoundingClientRect();
    return {
      rowHeight: rect.height,
      width: rect.width,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
  await testInfo.attach("compact-row-metrics.json", {
    body: JSON.stringify(rowMetrics, null, 2),
    contentType: "application/json",
  });
  const { rowHeight } = rowMetrics;
  const mobileViewport = rowMetrics.viewport.width < 640;
  const filters = page.getByRole("group", { name: "فلاتر مهامي" });
  const filterMetrics = await filters.evaluate((group) => {
    const search = group.querySelector('input[type="search"]')!;
    const selects = group.querySelectorAll("select");
    const rect = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      group: rect(group),
      search: rect(search),
      priority: rect(selects[0]),
      sla: rect(selects[1]),
    };
  });
  for (const control of [
    filterMetrics.search,
    filterMetrics.priority,
    filterMetrics.sla,
  ]) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
  if (mobileViewport) {
    expect(filterMetrics.group.height).toBeLessThanOrEqual(190);
    expect(filterMetrics.search.width).toBeGreaterThanOrEqual(
      filterMetrics.group.width - 34,
    );
    expect(
      Math.abs(filterMetrics.priority.y - filterMetrics.sla.y),
    ).toBeLessThanOrEqual(1);
    expect(filterMetrics.priority.y).toBeGreaterThan(filterMetrics.search.y);
    expect(filterMetrics.priority.x).toBeGreaterThan(filterMetrics.sla.x);
    expect(filterMetrics.sla.x + filterMetrics.sla.width).toBeLessThanOrEqual(
      filterMetrics.priority.x,
    );
  }
  expect(Number.isFinite(rowHeight)).toBe(true);
  expect(rowHeight).toBeGreaterThanOrEqual(44);
  expect(rowHeight).toBeLessThanOrEqual(mobileViewport ? 400 : 220);
  const thumbnail = firstRow.getByTestId("team-work-thumbnail");
  await expect(thumbnail).toHaveCount(1);
  await expect(thumbnail).toBeVisible();
  const size = await thumbnail.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  for (const dimension of [size.width, size.height]) {
    expect(Number.isFinite(dimension)).toBe(true);
    expect(dimension).toBeGreaterThan(0);
    expect(dimension).toBeLessThanOrEqual(96);
  }
  await expect(
    workList.locator("dd").filter({ hasText: /^\d{4}-\d{2}-\d{2}/ }),
  ).toHaveCount(0);
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "assigned-team-my-work-list");
  await firstRow.scrollIntoViewIfNeeded();
  await capture(page, testInfo, "assigned-team-my-work-list-viewport", {
    fullPage: false,
  });

  // The same native button owns the row hit area and keyboard focus stop.
  const drawerButton = firstRow.getByRole("button", {
    name: "فتح مساحة المخرج",
    exact: true,
  });
  const drawer = page.getByTestId("deliverable-drawer");
  await expect(firstRow.getByRole("button")).toHaveCount(1);
  await expect(
    firstRow.locator(
      'button, a[href], input, select, textarea, [tabindex="0"]',
    ),
  ).toHaveCount(1);
  const rowBox = await firstRow.boundingBox();
  const buttonBox = await drawerButton.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  const hit = { x: rowBox!.x + rowBox!.width / 2, y: rowBox!.y + 8 };
  expect(
    hit.x >= buttonBox!.x &&
      hit.x <= buttonBox!.x + buttonBox!.width &&
      hit.y >= buttonBox!.y &&
      hit.y <= buttonBox!.y + buttonBox!.height,
  ).toBe(false);
  await page.mouse.click(hit.x, hit.y);
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(drawerButton).toBeFocused();
  await drawerButton.focus();
  await expect(drawerButton).toBeFocused();
  await page.keyboard.press("Space");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "إغلاق", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(drawerButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(drawer).toBeVisible();
  const closeButton = drawer.getByRole("button", {
    name: "إغلاق",
    exact: true,
  });
  await expect(closeButton).toBeFocused();
  await closeButton.press("Enter");
  await expect(drawer).toHaveCount(0);
  await expect(drawerButton).toBeFocused();

  const search = page.getByRole("searchbox", { name: "بحث", exact: true });
  await search.fill("عبارة لا تطابق أي عمل للاختبار");
  await expect(rows).toHaveCount(0);
  await expect(search).toHaveValue("عبارة لا تطابق أي عمل للاختبار");
  await search.fill("");
  await expect(rows).toHaveCount(originalRowCount);
  const priority = page.getByRole("combobox", {
    name: "الأولوية",
    exact: true,
  });
  await priority.selectOption("high");
  await expect(priority).toHaveValue("high");
  await expect.poll(() => rows.count()).toBeLessThan(originalRowCount);
  expect(await rows.count()).toBeGreaterThan(0);
  await priority.selectOption("all");
  await expect(rows).toHaveCount(originalRowCount);
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);

  await page.getByRole("button", { name: "لوحة العمل" }).click();
  await expect(page.getByTestId("kanban-board-scroll")).toBeVisible();
  await expect(page.getByTestId("kanban-column")).toHaveCount(7);
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page, "kanban-board-scroll");
  await capture(page, testInfo, "assigned-team-seven-lane-board");

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
  await expect(
    page
      .getByRole("main")
      .locator("dd")
      .filter({ hasText: /^\d{4}-\d{2}-\d{2}/ }),
  ).toHaveCount(0);
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
  await expect(drawer.getByRole("tab", { name: /نظرة عامة/ })).toBeVisible();
  expect(
    await drawer
      .getByRole("tablist", { name: "أقسام مساحة المخرج" })
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  await expect(
    drawer.getByRole("heading", { name: "نظرة عامة" }),
  ).toBeVisible();
  await drawer.getByRole("tab", { name: /المحتوى والنسخ/ }).click();
  await expect(
    drawer.getByRole("heading", { name: "المحتوى والنسخة" }),
  ).toBeVisible();
  await drawer.getByRole("tab", { name: /الملفات/ }).click();
  await expect(drawer.getByRole("heading", { name: "الملفات" })).toBeVisible();
  await drawer.getByRole("tab", { name: /الجودة الداخلية/ }).click();
  await expect(
    drawer.getByRole("heading", { name: "مراجعة الجودة الداخلية" }),
  ).toBeVisible();
  await expect(drawer.getByText(/لا يراها العميل/)).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(drawer.getByRole("tab", { name: /النشاط/ })).toBeFocused();
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await capture(page, testInfo, "universal-drawer-content-files-comments", {
    fullPage: false,
  });

  await closeButton.click();
  await expect(drawerButton).toBeFocused();
  await expectNoSyntheticLeakage(page);
  expect(browserErrors).toEqual([]);
});

test("X010-B-7C-12 task validation is visible and focused inside the RTL drawer", async ({
  page,
}, testInfo) => {
  const browserErrors = observeBrowserErrors(page);
  await page.goto("/clients/client_a/deliverables?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });
  await expectReactHydrated(page, 'button[aria-haspopup="dialog"]');
  await page
    .getByRole("button", { name: "فتح العمل", exact: true })
    .first()
    .click();
  const drawer = page.getByTestId("deliverable-drawer");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).click();
  const createButton = drawer.getByRole("button", {
    name: "إضافة مهمة",
    exact: true,
  });
  const form = drawer.locator("form").filter({
    has: page.getByRole("button", { name: "إضافة مهمة", exact: true }),
  });
  const title = form.getByLabel("عنوان المهمة", { exact: true });
  await title.fill("س");
  await createButton.click();
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(title).toHaveAccessibleDescription(
    "أدخل عنوان المهمة من حرفين إلى ٢٠٠ حرف.",
  );
  await expect(title).toBeFocused();
  await expect(
    form.getByText("أدخل عنوان المهمة من حرفين إلى ٢٠٠ حرف."),
  ).toBeVisible();
  await expect(title).toHaveValue("س");
  await expectRtlDocument(page);
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await capture(page, testInfo, "task-form-arabic-validation", {
    fullPage: false,
  });
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
  await expect(
    page.getByRole("heading", { name: "قيد المراجعة" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/للاطلاع فقط/)).toBeVisible();
  await expect(
    page.getByText(/لا يملك صلاحية الاعتماد أو طلب التعديل/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "اعتماد النسخة" })).toHaveCount(
    0,
  );
  await expectMinimumTouchTargets(page);
  await expectNoUnexpectedHorizontalOverflow(page);
  await expectNoSyntheticLeakage(page);
  await capture(page, testInfo, "client-viewer-read-only-pending");

  await page.goto("/client/pending?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("button", { name: "اعتماد النسخة" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "طلب تعديل" })).toBeVisible();
  await expect(page.getByText(/تعليق داخلي|ملاحظة جودة|internal/i)).toHaveCount(
    0,
  );
  await expect(
    page.getByText(/مراجعة الجودة الداخلية|لا يراها العميل/),
  ).toHaveCount(0);
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
