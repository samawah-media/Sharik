import { expect, test } from "@playwright/test";

test("shows Arabic empty client list and create-client form", async ({ page }) => {
  await page.goto("/clients", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "العملاء" })).toBeVisible();
  await expect(page.getByText("لا يوجد عملاء بعد")).toBeVisible();

  await Promise.all([
    page.waitForURL("**/clients/new", { waitUntil: "domcontentloaded" }),
    page.getByRole("link", { name: "إضافة عميل" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "إضافة عميل" })).toBeVisible();
  await expect(page.getByLabel("اسم العميل")).toBeVisible();
});
