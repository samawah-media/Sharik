import { expect, test } from "@playwright/test";

test("role-aware navigation is RTL, labelled, and keyboard reachable", async ({
  page,
}) => {
  await page.goto("/portfolio?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("navigation", { name: "تنقل مساحة الفريق" })).toBeVisible();
  const portfolioLink = page.getByRole("link", { name: "عملائي" });
  for (let index = 0; index < 6; index += 1) {
    if (await portfolioLink.evaluate((element) => element === document.activeElement)) {
      break;
    }
    await page.keyboard.press("Tab");
  }
  await expect(portfolioLink).toBeFocused();
});

test("client portal mobile navigation keeps primary actions visible", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile assertion runs in the mobile Playwright project");

  await page.goto("/client?as=client_viewer_a", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("navigation", { name: "تنقل بوابة العميل" })).toBeVisible();
  await expect(page.getByRole("link", { name: "الرئيسية" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "مساحة Client A" })).toBeVisible();
});

test("forms and dialogs keep labels and visible focus", async ({ page }) => {
  await page.goto("/invitations/internal", { waitUntil: "domcontentloaded" });

  await expect(page.getByLabel("بريد العضو")).toBeVisible();
  await expect(page.getByLabel("الدور")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("بريد العضو")).toBeFocused();
});

test("denial states expose accessible recovery actions without leaking resources", async ({
  page,
}) => {
  await page.goto("/clients/client_b?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("main")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("link", { name: "العودة للمساحة الآمنة" })).toBeVisible();
  await expect(page.getByText("Client B")).toHaveCount(0);
  await expect(page.getByText("tenant_b")).toHaveCount(0);
});
