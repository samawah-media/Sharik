import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 90_000 });

test("account manager lands on a clear Hadna workspace", async ({ page }) => {
  await page.goto("/portfolio?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "تجربة هدنة" })).toBeVisible();
  await expect(page.getByText("مدير الحساب")).toBeVisible();
  const mvpSnapshot = page.getByRole("region", { name: "ملخص تجربة هدنة" });
  await expect(mvpSnapshot.getByText("عدد المخرجات")).toBeVisible();
  await expect(mvpSnapshot.getByText("52", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "تنقل مساحة الفريق" })
      .getByRole("link", { name: "مخرجات هدنة" }),
  ).toHaveAttribute("href", "/clients/client_a/deliverables");
  await expect(page.getByText("لوحة الإدارة")).toHaveCount(0);
  await expect(page.getByText("الفريق")).toHaveCount(0);
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
    teamNavigation.getByRole("link", { name: "هدنة" }),
  ).toBeVisible();
  await expect(
    teamNavigation.getByRole("link", { name: "المخرجات" }),
  ).toBeVisible();
  await expect(
    teamNavigation.getByRole("link", { name: "المتابعة / SLA" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "تجربة هدنة" })).toBeVisible();
});

test("client viewer A sees Hadna only through the client portal", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible();
  await expect(page.getByRole("link", { name: "عرض مخرجاتي" })).toHaveAttribute(
    "href",
    "/client/commercial#deliverables",
  );
  const clientSnapshot = page.getByRole("region", { name: "ملخص تجربة هدنة" });
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
