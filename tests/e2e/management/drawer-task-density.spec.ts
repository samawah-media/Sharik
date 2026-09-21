import { expect, test } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`D18 collapsed execution row stays compact at ${width}px`, async ({ page }, testInfo) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work?as=assigned_internal_a", { waitUntil: "domcontentloaded" });
    const openDrawer = page.getByTestId("team-work-list").getByRole("button", { name: "فتح مساحة المخرج", exact: true }).first();
    // Match visual-qa's bounded React readiness gate; this is not a prehydration click test.
    await expect.poll(
      () => openDrawer.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith("__reactProps$")),
      ).catch(() => false),
      { timeout: 30_000 },
    ).toBe(true);
    await openDrawer.click();
    const drawer = page.getByTestId("deliverable-drawer");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).click();
    const panel = drawer.getByRole("tabpanel", { name: "مهام التنفيذ" });
    const row = panel.getByRole("listitem").filter({ has: page.locator("details") });
    await expect(row).toHaveCount(1);
    const summary = row.locator("summary");
    await expect(summary).toBeVisible();
    await expect(row.getByRole("combobox", { name: /^حالة المهمة:/ })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const metrics = await row.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const summary = element.querySelector("summary")!.getBoundingClientRect();
      return { rowHeight: rect.height, rowWidth: rect.width, summaryHeight: summary.height, summaryWidth: summary.width, viewport: window.innerWidth };
    });
    await testInfo.attach("drawer-task-metrics.json", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath("drawer-task-collapsed.png"), caret: "initial" });
    expect.soft(metrics.rowHeight).toBeLessThanOrEqual(width === 375 ? 160 : 120);
    expect(metrics.rowHeight).toBeGreaterThan(0);
    expect(metrics.summaryHeight).toBeGreaterThanOrEqual(44);
    expect(metrics.summaryWidth).toBeGreaterThanOrEqual(44);
    const taskTitle = row.locator("p").first();
    await expect(taskTitle).toBeVisible();
    expect.soft(await taskTitle.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const row = element.closest("li")!.getBoundingClientRect();
      return element.scrollWidth <= element.clientWidth + 1
        && element.scrollHeight <= element.clientHeight + 1
        && rect.left >= row.left && rect.right <= row.right;
    }), "existing fixture task title must not clip").toBe(true);
    await summary.focus();
    await page.keyboard.press("Enter");
    const title = row.getByLabel("عنوان المهمة", { exact: true });
    await expect(title).toBeVisible();
    await title.fill(" ");
    await row.getByRole("button", { name: "حفظ التعديلات" }).click();
    await expect(title).toBeFocused();
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await summary.focus();
    await page.keyboard.press("Space");
    await expect(title).toBeHidden();
    await page.keyboard.press("Enter");
    await expect(title).toHaveValue(" ");
    const overflow = await drawer.evaluate((element) => ({
      drawer: element.scrollWidth > element.clientWidth + 1,
      page: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    expect(overflow).toEqual({ drawer: false, page: false });
    await summary.focus();
    await page.keyboard.press("Space");
    await expect(title).toBeHidden();
    // DOM-only layout stress: not a saved task, server fixture or persistence test.
    const stressText = {
      title: "متابعة تنفيذ الحملة الإبداعية متعددة القنوات والعملاء مع مراجعة جميع الملاحظات ".repeat(4),
      metadata: "عبدالرحمن مسؤول التنسيق والتصميم للحملات المشتركة InternationalCreativeCollaborationStudioWithoutSpaces · ١٠ سبتمبر ٢٠٢٦",
    };
    await row.evaluate((element, text) => {
      const paragraphs = element.querySelectorAll("p");
      paragraphs[0].textContent = text.title;
      paragraphs[1].textContent = text.metadata;
    }, stressText);
    const stressTitle = row.locator("p").nth(0);
    const stressMetadata = row.locator("p").nth(1);
    await expect(stressTitle).toBeVisible();
    await expect(stressMetadata).toBeVisible();
    const stress = await row.evaluate((element) => {
      const rowRect = element.getBoundingClientRect();
      const text = Array.from(element.querySelectorAll("p")).slice(0, 2).map((paragraph) => {
        const rect = paragraph.getBoundingClientRect();
        return {
          wraps: rect.height > parseFloat(getComputedStyle(paragraph).lineHeight) * 1.5,
          unclipped: paragraph.scrollWidth <= paragraph.clientWidth + 1
            && paragraph.scrollHeight <= paragraph.clientHeight + 1
            && rect.left >= rowRect.left && rect.right <= rowRect.right
            && rect.bottom <= rowRect.bottom,
        };
      });
      const status = element.querySelector("select")!.getBoundingClientRect();
      return { text, statusWidth: status.width, statusHeight: status.height, rowHeight: rowRect.height };
    });
    expect(stress.text).toEqual([{ wraps: true, unclipped: true }, { wraps: true, unclipped: true }]);
    expect(stress.statusWidth).toBeGreaterThanOrEqual(44);
    expect(stress.statusHeight).toBeGreaterThanOrEqual(44);
    await expect(row.getByRole("combobox", { name: /^حالة المهمة:/ })).toBeVisible();
    expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth + 1
      && document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await testInfo.attach("drawer-task-dom-stress.json", { body: JSON.stringify(stress, null, 2), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath("drawer-task-dom-stress.png"), caret: "initial" });
    await testInfo.attach("drawer-task-browser-errors.json", {
      body: JSON.stringify(browserErrors, null, 2), contentType: "application/json",
    });
    expect(browserErrors).toEqual([]);
  });
}
