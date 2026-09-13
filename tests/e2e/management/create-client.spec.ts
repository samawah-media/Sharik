import { expect, test } from "@playwright/test";

test("shows Arabic client list with a single primary onboarding CTA and the standalone form", async ({
  page,
}) => {
  await page.goto("/clients", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "العملاء" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /فتح مساحة/ }).first(),
  ).toBeVisible();

  await page
    .getByTestId("management-client-card-client_a")
    .click({ position: { x: 12, y: 12 } });
  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible({
    timeout: 60_000,
  });
  await page.goto("/clients", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("link", { name: "إضافة عميل جديد" }),
  ).toHaveAttribute("href", "/clients/onboard");
  await expect(
    page.getByRole("link", { name: "إضافة عميل", exact: true }),
  ).toHaveCount(0);

  await page.goto("/clients/new", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "إضافة عميل" })).toBeVisible();
  await expect(page.getByLabel("اسم الشركة أو الجهة")).toBeVisible();
  await expect(page.getByLabel("رقم الهاتف / واتساب")).toBeVisible();
});
