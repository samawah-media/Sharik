import { expect, test } from "@playwright/test";

test("denies assigned internal direct URL access to unassigned same-tenant clients", async ({
  page,
}) => {
  await page.goto("/clients/client_c?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يمكن الوصول إلى هذه الصفحة" }),
  ).toBeVisible();
  await expect(page.getByText("Client C")).toHaveCount(0);
  await expect(page.getByText("client_c")).toHaveCount(0);
});

test("denies cross-tenant and Client B URL tampering without enumeration leakage", async ({
  page,
}) => {
  await page.goto("/clients/client_b?as=assigned_internal_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يمكنك الوصول لهذا العميل" }),
  ).toBeVisible();
  await expect(page.getByText("Client B")).toHaveCount(0);
  await expect(page.getByText("tenant_b")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
});

test("denies client viewer admin navigation and actions server-side", async ({
  page,
}) => {
  await page.goto("/members?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يمكن الوصول إلى هذه الصفحة" }),
  ).toBeVisible();
  await expect(page.getByText("إدارة العضويات والأدوار")).toHaveCount(0);
  await expect(page.getByText("pending@example.test")).toHaveCount(0);
});

test("shows a safe no-client state for users without assigned clients", async ({
  page,
}) => {
  await page.goto("/portfolio?as=tenant_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يوجد عملاء مسندون" }),
  ).toBeVisible();
  await expect(page.getByText("Client A")).toHaveCount(0);
  await expect(page.getByText("Client B")).toHaveCount(0);
});
