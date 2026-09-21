import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 375, height: 812 },
  { width: 412, height: 915 },
]) {
  test(`approval panel uses natural compact controls at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chromium"
        ? viewport.width === 1440
        : viewport.width !== 1440,
      "Mobile sizes use the mobile project; desktop also runs in the Arabic RTL project.",
    );
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    await page.setViewportSize(viewport);
    await page.goto("/client/pending?as=client_approver_a", {
      waitUntil: "domcontentloaded",
    });
    const panel = page.getByRole("region", { name: "قرار اعتماد العميل" });
    await expect(panel).toHaveAttribute("dir", "rtl");
    await expect(
      panel.getByRole("heading", { name: "قرار الاعتماد" }),
    ).toBeVisible();
    const approve = panel.getByRole("button", { name: "اعتماد النسخة" });
    const changes = panel.getByRole("button", { name: "طلب تعديل" });
    const reason = panel.getByRole("textbox", { name: "سبب التعديل" });
    await expect(reason).toBeVisible();
    await expect(reason).toHaveAttribute("required", "");
    await expect(reason).toHaveAttribute("maxlength", "500");
    await page.evaluate(() => document.fonts.ready);
    const preview = page.getByTestId("client-approval-detail").locator("[data-content-card]");
    const previewBox = (await preview.boundingBox())!;
    const decisionBox = (await panel.boundingBox())!;
    if (viewport.width < 1024) {
      expect(decisionBox.y).toBeGreaterThanOrEqual(previewBox.y + previewBox.height);
    } else {
      expect(Math.abs(decisionBox.y - previewBox.y)).toBeLessThanOrEqual(1);
      expect(previewBox.x).toBeGreaterThanOrEqual(decisionBox.x + decisionBox.width);
    }
    await expect(panel.getByText("النسخة المعتمدة للعميل", { exact: true })).toBeVisible();
    await expect(reason).toHaveAttribute("placeholder", "وش التعديل المطلوب على النسخة؟");
    await panel.scrollIntoViewIfNeeded();
    const metrics = {
      panel: await panel.boundingBox(),
      approve: await approve.boundingBox(),
      changes: await changes.boundingBox(),
      reason: await reason.boundingBox(),
    };
    await testInfo.attach("approval-panel-metrics.json", {
      body: JSON.stringify({ viewport, ...metrics }, null, 2),
      contentType: "application/json",
    });
    await page.screenshot({
      caret: "initial",
      path: testInfo.outputPath("approval-panel-viewport.png"),
    });
    await page.screenshot({
      caret: "initial",
      fullPage: true,
      path: testInfo.outputPath("approval-panel-full.png"),
    });
    for (const name of ["approve", "changes"] as const) {
      expect
        .soft(
          metrics[name]!.height,
          `${name} must not stretch to the reason form`,
        )
        .toBeGreaterThanOrEqual(44);
      expect
        .soft(
          metrics[name]!.height,
          `${name} must not stretch to the reason form`,
        )
        .toBeLessThanOrEqual(56);
      expect.soft(metrics[name]!.width).toBeGreaterThanOrEqual(44);
    }
    expect
      .soft(metrics.panel!.height)
      .toBeLessThanOrEqual(viewport.width === 1440 ? 210 : 270);
    expect(metrics.reason!.height).toBeGreaterThanOrEqual(44);
    if (viewport.width < 640) {
      expect(metrics.reason!.y).toBeGreaterThanOrEqual(
        metrics.approve!.y + metrics.approve!.height,
      );
      expect(metrics.changes!.y).toBeGreaterThanOrEqual(
        metrics.reason!.y + metrics.reason!.height,
      );
    } else {
      const formTop = await reason.evaluate(
        (element) => element.closest("form")!.getBoundingClientRect().top,
      );
      expect
        .soft(
          Math.abs(metrics.approve!.y - formTop),
          "approve stays naturally top-aligned",
        )
        .toBeLessThanOrEqual(1);
    }
    await approve.focus();
    await page.keyboard.press("Tab");
    await expect(reason).toBeFocused();
    const longReason =
      "يرجى تعديل النص مع الحفاظ على هوية النسخة LongUnbrokenReviewInstruction".repeat(
        5,
      );
    await reason.fill(longReason);
    await page.keyboard.press("Tab");
    await expect(changes).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.setViewportSize({
      width: viewport.width === 1440 ? 375 : 1440,
      height: 1000,
    });
    await expect(reason).toBeVisible();
    await expect(reason).toHaveValue(longReason);
    // DOM-only text stress, not a saved review version or persistence test.
    const previewText = preview.getByText("مخرج تجريبي آمن", { exact: true });
    expect(await previewText.evaluate((element) => {
      element.textContent = "عنوان مراجعة طويل يجب قراءته كاملًا قبل اتخاذ قرار على النسخة ".repeat(8);
      const style = getComputedStyle(element);
      return element.scrollHeight <= element.clientHeight + 1
        && element.scrollWidth <= element.clientWidth + 1
        && style.webkitLineClamp === "none";
    })).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await testInfo.attach("approval-panel-browser-errors.json", {
      body: JSON.stringify(browserErrors, null, 2),
      contentType: "application/json",
    });
    expect(browserErrors).toEqual([]);
    // Fixture actions are no-ops: submission/persistence is intentionally not claimed.
  });
}
