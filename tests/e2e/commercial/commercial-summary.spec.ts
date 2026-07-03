import { expect, test } from "@playwright/test";

test("management commercial summary shows scoped cards without later workflow features", async ({
  page,
}) => {
  await page.goto("/clients/client_a/commercial?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "ملخص المتابعة" })).toBeVisible();
  const summaryRegion = page.getByRole("region", { name: "ملخص الإدارة التجاري" });
  await expect(summaryRegion).toBeVisible();
  await expect(summaryRegion.getByText("محجوز: 1").first()).toBeVisible();
  await expect(summaryRegion.getByText("متاح: 3").first()).toBeVisible();
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

  await expect(page.getByRole("heading", { name: "ملخص الباقة" })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "ملخص العميل التجاري" }),
  ).toBeVisible();
  await expect(page.getByText("المتبقي: 3")).toBeVisible();
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
