import { expect, test } from "@playwright/test";

test("shows role change, disablement, and safe membership states", async ({
  page,
}) => {
  await page.goto("/members", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "إدارة العضويات والأدوار" }),
  ).toBeVisible();
  await expect(page.getByLabel("الدور").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "تحديث الدور" })).toHaveCount(
    2,
  );
  await expect(
    page.getByText("لا يمكن تعطيل العضوية قبل توثيق نقل المسؤوليات النشطة."),
  ).toBeVisible();
  await expect(page.getByText("عضوية معطلة")).toBeVisible();
  await expect(page.getByRole("button", { name: "إلغاء الدعوة" })).toBeVisible();
  await expect(page.getByText("Client B")).toHaveCount(0);
  await expect(page.getByText("tenant_b")).toHaveCount(0);
});
