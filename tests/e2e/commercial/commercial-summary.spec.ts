import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 240_000 });

test("management commercial summary shows scoped cards without later workflow features", async ({
  page,
}) => {
  await page.goto("/clients/client_a/commercial?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "المتابعة التجارية" }),
  ).toBeVisible();
  const summaryRegion = page.getByRole("region", {
    name: "ملخص المتابعة للإدارة",
  });
  await expect(summaryRegion).toBeVisible();
  await expect(summaryRegion.getByText("قيد العمل:").first()).toBeVisible();
  await expect(summaryRegion.getByText("المتبقي:").first()).toBeVisible();
  await expect(page.getByText("Kanban")).toHaveCount(0);
  await expect(page.getByText("files")).toHaveCount(0);
  await expect(page.getByText("comments")).toHaveCount(0);
  await expect(page.getByText("approvals")).toHaveCount(0);
});

test("client commercial summary hides internal fields and other-client identifiers", async ({
  page,
}) => {
  await page.goto("/client/commercial?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "العقد والمتابعة" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "ملخص بوابة العميل" }),
  ).toBeVisible();
  const clientRegion = page.getByRole("region", { name: "ملخص بوابة العميل" });
  await expect(
    clientRegion.getByRole("heading", { name: "الباقة والمتبقي" }),
  ).toBeVisible();
  await expect(
    clientRegion.getByRole("heading", { name: "مخرجاتي" }),
  ).toBeVisible();
  await expect(page.getByText("tenant_a")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("internal")).toHaveCount(0);
  await expect(page.getByText("audit")).toHaveCount(0);
});

test("client URL tampering to another commercial summary is denied without enumeration", async ({
  page,
}) => {
  await page.goto("/clients/client_b/commercial?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يمكنك الوصول لهذا العميل" }),
  ).toBeVisible();
  await expect(page.getByText("Client B")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("tenant_b")).toHaveCount(0);
});
