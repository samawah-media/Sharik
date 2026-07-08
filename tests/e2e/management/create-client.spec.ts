import { expect, test } from "@playwright/test";

test("shows Arabic Hadna client list and create-client form", async ({ page }) => {
  await page.goto("/clients", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "العملاء" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "تجربة هدنة" })).toBeVisible();
  await expect(page.getByRole("link", { name: "عرض هدنة" }).first()).toBeVisible();

  await Promise.all([
    page.waitForURL("**/clients/new", { waitUntil: "domcontentloaded" }),
    page.getByRole("link", { name: "إضافة عميل" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "إضافة عميل" })).toBeVisible();
  await expect(page.getByLabel("اسم العميل")).toBeVisible();
});
