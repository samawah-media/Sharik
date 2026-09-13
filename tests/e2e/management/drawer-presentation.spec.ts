import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  test(`UI3 drawer tabs and empty preview remain compact and keyboard usable at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work?as=assigned_internal_a", { waitUntil: "domcontentloaded" });
    const trigger = page.getByTestId("team-work-list").getByRole("button", { name: "فتح مساحة المخرج", exact: true }).first();
    // This suite tests the hydrated drawer, not prehydration event replay.
    await expect.poll(() => trigger.evaluate((element) =>
      Object.keys(element).some((key) => key.startsWith("__reactProps$")),
    ).catch(() => false), { timeout: 30_000 }).toBe(true);
    await trigger.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    const tabs = drawer.getByRole("tab");
    await expect(tabs).toHaveCount(7);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await drawer.getByRole("tablist").evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const buttons = Array.from(element.querySelectorAll<HTMLElement>("[role=tab]"));
      const boxes = buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          top: Math.round(rect.top), height: rect.height, width: rect.width,
          unclipped: button.scrollWidth <= button.clientWidth + 1
            && button.scrollHeight <= button.clientHeight + 1
            && rect.left >= bounds.left && rect.right <= bounds.right,
        };
      });
      return { rows: new Set(boxes.map((box) => box.top)).size, boxes };
    });
    expect.soft(geometry.rows).toBe(width === 375 ? 3 : 2);
    for (const box of geometry.boxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.unclipped).toBe(true);
    }
    await testInfo.attach("tab-geometry.json", { body: JSON.stringify(geometry), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath("drawer-overview.png") });

    await tabs.first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    const content = drawer.getByRole("tabpanel", { name: "المحتوى والنسخة", exact: true });
    await expect(content).toBeVisible();
    // First fixture is delivered with a current version and no uploaded files.
    const emptyPreview = content.getByText(/لا (يوجد أصل مرئي|توجد صورة أو فيديو) في النسخة الحالية/).locator("..");
    await expect(emptyPreview).toBeVisible();
    expect.soft(await emptyPreview.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(88);
    await expect(content.getByRole("heading", { name: "المحتوى والنسخة", exact: true }).locator("..").getByText("النسخة 1", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("drawer-content.png") });
    await tabs.nth(1).focus();
    await page.keyboard.press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).click();
    const taskTitle = drawer.getByRole("tabpanel", { name: "مهام التنفيذ" }).getByRole("textbox", { name: "عنوان المهمة", exact: true });
    await taskTitle.fill("مسودة مهمة لم تُحفظ");
    await drawer.getByRole("tab", { name: /الملفات/ }).click();
    await expect(taskTitle).toBeHidden();
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).click();
    await expect(taskTitle).toHaveValue("مسودة مهمة لم تُحفظ");
    expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth + 1
      && document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await drawer.getByRole("tab", { name: /مهام التنفيذ/ }).focus();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
  });
}
