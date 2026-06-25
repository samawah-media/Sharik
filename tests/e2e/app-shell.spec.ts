import { expect, test } from "@playwright/test";

test("loads the Arabic RTL application shell", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "منصة سماوة" }),
  ).toBeVisible();
});
