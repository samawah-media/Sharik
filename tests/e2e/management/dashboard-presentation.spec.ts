import { expect, test, type Locator, type Page } from "@playwright/test";

// Hand-counted from commercial-summary-read.ts fixtureStatusPlan. Client B has
// no fixture deliverables; overdue is overlapping, not a sixth status group.
const total = 52;
const distribution = [
  ["تم التسليم", 12],
  ["بانتظار العميل", 5],
  ["للمراجعة الداخلية", 7],
  ["داخل الفريق", 28],
  ["ملغي أو مؤرشف", 0],
] as const;

async function expectChartBounds(region: Locator) {
  const violations = await region.evaluate((section) => {
    const bounds = section.getBoundingClientRect();
    return Array.from(section.querySelectorAll("li")).flatMap((row) => {
      const rowBounds = row.getBoundingClientRect();
      return Array.from(row.querySelectorAll("span, p, [role='meter']"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          const textOutside = element.getAttribute("role") !== "meter" &&
            Array.from(range.getClientRects()).some((text) =>
              text.left < rect.left - 1 || text.right > rect.right + 1 ||
              text.top < rect.top - 1 || text.bottom > rect.bottom + 1);
          return textOutside || rect.width <= 0 || rect.height <= 0 ||
            rect.left < Math.max(0, bounds.left, rowBounds.left) - 1 ||
            rect.right > Math.min(document.documentElement.clientWidth, bounds.right, rowBounds.right) + 1 ||
            rect.top < rowBounds.top - 1 || rect.bottom > rowBounds.bottom + 1 ||
            (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) ||
            (element.clientHeight > 0 && element.scrollHeight > element.clientHeight + 1);
        })
        .map((element) => element.getAttribute("aria-label") ?? element.textContent);
    });
  });
  expect(violations, "chart labels and tracks must fit their rows and page width").toEqual([]);
}

async function tabToClientLink(page: Page, link: Locator) {
  for (let step = 0; step < 80; step += 1) {
    if (await link.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(link).toBeFocused();
  await expect.poll(() => link.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return element.matches(":focus-visible") &&
      ((parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== "none") || style.boxShadow !== "none") &&
      rect.left >= -1 && rect.right <= document.documentElement.clientWidth + 1 &&
      rect.top >= -1 && rect.bottom <= window.innerHeight + 1;
  }), { message: "keyboard navigation reveals the client link with visible focus" }).toBe(true);
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
}

for (const width of [375, 1440]) {
  test(`UI2 admin dashboard presents a complete accessible snapshot at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/portfolio?as=tenant_admin_a", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "لوحة الإدارة", exact: true })).toBeVisible();
    const dashboard = page.getByRole("region", { name: "يحتاج انتباهكم", exact: true });
    await expect(dashboard).toBeVisible();
    await expect(dashboard).toHaveAttribute("dir", "rtl");
    // Next's route announcer is an accessibility alert outside application content.
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    for (const name of ["متأخر", "معرض للتأخير", "ينتظر قرارًا داخليًا", "بانتظار العميل", "مستحق قريبًا"]) {
      await expect(dashboard.getByRole("article", { name, exact: true })).toBeVisible();
    }
    await expect(dashboard.getByRole("region", { name: "المخرجات حسب المسؤول" }).getByText("أحمد العتيبي", { exact: true })).toBeVisible();
    await expect(dashboard.getByRole("region", { name: "أحدث القرارات والتسليمات" }).getByRole("link")).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);

    const chart = dashboard.getByRole("region", { name: "وين وصل الشغل؟" });
    await expect(chart.getByText(`${total} مخرج`, { exact: true })).toBeVisible();
    await expect(chart.getByRole("meter")).toHaveCount(5);
    for (const [label, count] of distribution) {
      const meter = chart.getByRole("meter", { name: label, exact: true });
      await expect(meter).toHaveAttribute("aria-valuemin", "0");
      await expect(meter).toHaveAttribute("aria-valuemax", String(total));
      await expect(meter).toHaveAttribute("aria-valuenow", String(count));
      await expect(meter).toHaveAttribute("aria-valuetext", `${count} من ${total} مخرج`);
      const row = chart.getByRole("listitem").filter({
        has: page.getByRole("meter", { name: label, exact: true }),
      });
      await expect(row.getByText(label, { exact: true })).toBeVisible();
      await expect(row.getByText(`${count} من ${total}`, { exact: true })).toBeVisible();
      const paintedFraction = await meter.evaluate((element) => {
        const fill = element.firstElementChild;
        return fill ? fill.getBoundingClientRect().width / element.getBoundingClientRect().width : -1;
      });
      expect(paintedFraction, `${label}: rendered bar matches count, including true zero`).toBeCloseTo(count / total, 2);
    }
    const sum = await chart.getByRole("meter").evaluateAll((meters) =>
      meters.reduce((value, meter) => value + Number(meter.getAttribute("aria-valuenow")), 0));
    expect(sum).toBe(total);
    await expectChartBounds(chart);

    const clients = dashboard.getByRole("region", { name: "التسليم حسب العميل" });
    await expect(clients.getByText(/وليس استهلاك الباقة/)).toBeVisible();
    await expect(clients.getByRole("meter")).toHaveCount(1);
    await expect(clients.getByRole("meter", { name: "تسليم هدنة" })).toHaveAttribute("aria-valuetext", "12 من 52 مخرج");
    await expect(clients.getByText("0 من 0 تم تسليمه", { exact: true })).toBeVisible();
    await expect(clients.getByText("ما فيه مخرجات لهذا العميل حاليًا.", { exact: true })).toBeVisible();
    await expectChartBounds(clients);
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });

    const links = clients.getByRole("link", { name: "ملف العميل", exact: true });
    await expect(links).toHaveCount(2);
    for (const [index, clientId] of ["client_a", "client_b"].entries()) {
      const link = links.nth(index);
      await expect(link).toHaveAttribute("href", `/clients/${clientId}/commercial`);
      await tabToClientLink(page, link);
    }
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/clients\/client_b\/commercial(?:\?.*)?$/);
  });
}
