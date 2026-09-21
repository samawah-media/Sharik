import { expect, test } from "@playwright/test";
import { hostedPersona, signInHostedPersona } from "./support/uat-personas";

test.use({ trace: "off" });
test("owner-requested empty pilot opens first client creation without seeding data", async ({ page }) => {
  test.skip(process.env.S015_TEAM_PILOT_VERIFY !== "1", "Explicit pilot verification required");
  await signInHostedPersona(page, hostedPersona("ADMIN"));
  await page.goto("/clients");
  await expect(page.getByRole("heading", { name: "العملاء", exact: true })).toBeVisible();
  await expect(page.getByText("الحسام — تجربة الفريق (بيانات تدريبية)", { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-testid^="management-client-card-"]')).toHaveCount(0);
  const create = page.getByRole("link", { name: "إضافة عميل جديد", exact: true }).first();
  await expect(create).toBeVisible();
  await create.click();
  await expect(page).toHaveURL(/\/clients\/onboard$/u);
  await expect(page.locator('[data-wizard-field="clientName"]')).toBeVisible();
  await expect(page.locator('[data-wizard-field="clientName"]')).toHaveValue("");
  await page.reload();
  await expect(page.locator('[data-wizard-field="clientName"]')).toHaveValue("");
  await page.goto("/members");
  for (const name of ["مدير المشروع", "أثير", "يوسف"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: /فحص آلي/u })).toHaveCount(0);
});
