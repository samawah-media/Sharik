import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 90_000 });

test("tenant admin can open the internal Kanban board from deliverables", async ({
  page,
}) => {
  await page.goto("/clients/client_a/deliverables?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("link", { name: "لوحة Kanban" })).toHaveAttribute(
    "href",
    "/clients/client_a/deliverables/board",
  );
  await page.goto("/clients/client_a/deliverables/board?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لوحة Kanban الداخلية" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "لوحة Kanban الداخلية" }),
  ).toBeVisible();
  await expect(page.getByText("منشور إطلاق الحملة")).toBeVisible();
  await expect(
    page.getByRole("form", { name: "تغيير حالة منشور إطلاق الحملة" }),
  ).toBeVisible();
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("approval log")).toHaveCount(0);
});

test("client viewer cannot access the internal Kanban board", async ({ page }) => {
  await page.goto("/clients/client_a/deliverables/board?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByText("منشور إطلاق الحملة")).toHaveCount(0);
  await expect(page.getByText("لوحة Kanban الداخلية")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
});
