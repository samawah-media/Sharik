import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 240_000 });

test("account manager lands on a clear Hadna workspace", async ({ page }) => {
  await page.goto("/portfolio?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "مساحة العمل" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "عملائي" })).toBeVisible();
  await expect(page.getByRole("link", { name: "فتح هدنة" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "تنقل مساحة الفريق" })
      .getByRole("link", { name: "مهامي" }),
  ).toHaveAttribute("href", "/work");
  await expect(
    page.getByRole("navigation", { name: "تنقل مساحة الفريق" }),
  ).toHaveCount(1);
  await expect(page.getByText("لوحة الإدارة")).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "تنقل مساحة الفريق" })
      .getByRole("link", { name: "الفريق", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("الدعوات")).toHaveCount(0);
  await expect(page.getByText("Client B")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
});

test("admin or project manager sees the MVP control model", async ({
  page,
}) => {
  await page.goto("/portfolio?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  const teamNavigation = page.getByRole("navigation", {
    name: "تنقل مساحة الفريق",
  });
  await expect(teamNavigation).toBeVisible();
  await expect(
    teamNavigation.getByRole("link", { name: "لوحة الإدارة" }),
  ).toBeVisible();
  await expect(
    teamNavigation.getByRole("link", { name: "العملاء" }),
  ).toBeVisible();
  await expect(
    teamNavigation.getByRole("link", { name: "الفريق" }),
  ).toBeVisible();
  await expect(teamNavigation.getByRole("link")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "لوحة الإدارة" }),
  ).toBeVisible();
});

test("client viewer A sees Hadna only through the client portal", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "مراجعة ما ينتظرني" }),
  ).toHaveAttribute("href", "/client/pending");
  const clientSnapshot = page.getByRole("region", {
    name: "ملخص مساحة العميل",
  });
  await expect(clientSnapshot.getByText("عدد المخرجات")).toBeVisible();
  await expect(clientSnapshot.getByText("17", { exact: true })).toBeVisible();
  await expect(page.getByText("لوحة الإدارة")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
});

test("viewer B does not see Hadna or client data", async ({ page }) => {
  await page.goto("/client?as=client_viewer_b", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يوجد عملاء مسندون" }),
  ).toBeVisible();
  await expect(page.getByText("هدنة")).toHaveCount(0);
  await expect(page.getByText("52")).toHaveCount(0);
  await expect(page.getByText("عدد المخرجات")).toHaveCount(0);
});

test("client-only roles cannot enter the management portfolio", async ({
  page,
}) => {
  await page.goto("/portfolio?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator('a[href="/client"]')).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "تنقل مساحة الفريق" }),
  ).toHaveCount(0);
  await expect(page.getByText("عملائي")).toHaveCount(0);
});
