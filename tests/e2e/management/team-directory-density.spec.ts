import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
  test(`real directory stays compact and readable at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/members?directoryFixture=compact", { waitUntil: "domcontentloaded" });
    const directory = page.getByRole("region", { name: "أعضاء الفريق" });
    const rows = directory.getByRole("article");
    await expect(rows).toHaveCount(4);
    await expect(directory.getByRole("heading", { level: 3 })).toHaveText([
      "سارة المصممة", "مدير المساحة", "عضو معطل",
      "عبدالرحمن مسؤول التنسيق والتصميم للحملات المشتركة متعددة العملاء Samawah Studio",
    ]);
    await expect(directory.getByText("4", { exact: true })).toBeVisible();
    await expect(rows.nth(0).getByLabel("أدوار العضو")).toContainText("كاتب المحتوى");
    await expect(rows.nth(0).getByLabel("عملاء العضو")).toContainText("Glass Studio");
    await expect(rows.nth(1)).toContainText("صلاحية إدارية على مساحة سماوة.");
    await expect(rows.nth(2)).toContainText("عضوية معطلة");
    for (const index of [0, 1, 3]) {
      const row = rows.nth(index);
      const management = row.getByText("إدارة العضو", { exact: true });
      const disable = row.getByRole("button", { name: "تعطيل العضوية", exact: true });
      await expect(row.getByText("عضوية نشطة", { exact: true })).toBeVisible();
      await expect(management).toBeVisible();
      await expect(disable).toBeHidden();
      await management.click();
      await expect(disable).toBeVisible();
      await expect(disable).toBeEnabled();
      await expect(row.getByLabel("سبب تعطيل العضوية", { exact: true })).toBeVisible();
      await expect(row.getByLabel("سبب تعطيل العضوية", { exact: true })).toBeRequired();
      await expect(row.getByLabel("اكتب «تعطيل» للتأكيد", { exact: true })).toBeVisible();
      await expect(row.getByLabel("اكتب «تعطيل» للتأكيد", { exact: true })).toBeRequired();
      // This compact fixture has no assignments, so it must not invent role/scope editors.
      await expect(row.getByRole("combobox", { includeHidden: true })).toHaveCount(0);
      await expect(row.getByRole("button", {
        name: /حفظ التعديل|إزالة نطاق العميل/, includeHidden: true,
      })).toHaveCount(0);
      // Measure the same collapsed directory density after exercising the disclosure.
      await management.click();
      await expect(disable).toBeHidden();
    }
    const disabledRow = rows.nth(2);
    await expect(disabledRow.getByText("إدارة العضو", { exact: true })).toHaveCount(0);
    await expect(disabledRow.getByRole("button", { includeHidden: true })).toHaveCount(0);
    await expect(disabledRow.getByRole("combobox", { includeHidden: true })).toHaveCount(0);
    await expect(disabledRow.getByText(
      "السجل محفوظ للرجوع إليه. إعادة التفعيل غير متاحة في هذه الدفعة.", { exact: true },
    )).toBeVisible();
    await expect(directory).not.toContainText(/directory-member-|directory-user-/);
    await page.evaluate(() => document.fonts.ready);

    const metrics = await rows.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom };
    }));
    await testInfo.attach("team-directory-metrics.json", {
      body: JSON.stringify({ viewport, rows: metrics }, null, 2), contentType: "application/json",
    });
    await page.screenshot({ path: testInfo.outputPath("team-directory-full.png"), fullPage: true });
    await directory.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("team-directory-viewport.png") });

    for (const [index, rect] of metrics.entries()) {
      expect(Number.isFinite(rect.height)).toBe(true);
      expect(rect.height).toBeGreaterThan(0);
      if (index < 3) expect.soft(rect.height).toBeLessThanOrEqual(viewport.width === 375 ? 200 : 120);
      if (index > 0) {
        expect.soft(rect.y, "each member must occupy a separate row").toBeGreaterThanOrEqual(metrics[index - 1].bottom);
        expect.soft(Math.abs(rect.x - metrics[0].x)).toBeLessThanOrEqual(1);
        expect.soft(Math.abs(rect.width - metrics[0].width)).toBeLessThanOrEqual(1);
      }
    }

    const longRow = rows.nth(3);
    const longLabels = [
      longRow.getByRole("heading", { name: "عبدالرحمن مسؤول التنسيق والتصميم للحملات المشتركة متعددة العملاء Samawah Studio" }),
      longRow.getByText("مؤسسة المشاريع الإبداعية والتسويق والتواصل متعددة الفروع", { exact: true }),
      longRow.getByText("InternationalCreativeCollaborationStudioWithoutSpaces", { exact: true }),
    ];
    for (const label of longLabels) {
      await expect(label).toBeVisible();
      expect(await label.evaluate((element) => {
        for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
          if (Number(getComputedStyle(ancestor).opacity) === 0) return false;
        }
        return true;
      }), "long labels must not be transparent").toBe(true);
    }
    await expect(longRow.getByLabel("عملاء العضو")).toContainText("مؤسسة المشاريع الإبداعية والتسويق والتواصل متعددة الفروع");
    await expect(longRow.getByLabel("عملاء العضو")).toContainText("InternationalCreativeCollaborationStudioWithoutSpaces");
    const clipping = await longRow.evaluate((row) => {
      const rowRect = row.getBoundingClientRect();
      return Array.from(row.querySelectorAll("h3, span, p")).filter((element) => {
        const rect = element.getBoundingClientRect();
        return (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1)
          || (element.clientHeight > 0 && element.scrollHeight > element.clientHeight + 1)
          || rect.left < rowRect.left - 1 || rect.right > rowRect.right + 1
          || rect.top < rowRect.top - 1 || rect.bottom > rowRect.bottom + 1;
      }).map((element) => element.textContent);
    });
    expect.soft(clipping, "long identity and scope must wrap without clipping").toEqual([]);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

for (const actor of ["client_viewer_a", "disabled_member_a"]) {
  test(`${actor} cannot select the directory fixture through the query`, async ({ page }) => {
    await page.goto(`/members?directoryFixture=compact&as=${actor}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", {
      name: actor === "disabled_member_a" ? "تم تعطيل العضوية" : "لا يمكن الوصول إلى هذه الصفحة",
      exact: true,
    })).toBeVisible();
    await expect(page.getByRole("region", { name: "أعضاء الفريق", includeHidden: true })).toHaveCount(0);
    for (const name of ["سارة المصممة", "مدير المساحة", "عضو معطل", "عبدالرحمن مسؤول التنسيق والتصميم للحملات المشتركة متعددة العملاء Samawah Studio"]) {
      await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    }
  });
}
