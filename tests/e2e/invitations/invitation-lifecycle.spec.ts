import { expect, test } from "@playwright/test";

const states = [
  ["expired", "انتهت صلاحية الدعوة"],
  ["revoked", "الدعوة غير متاحة"],
  ["superseded", "يوجد رابط أحدث"],
  ["used", "تم استخدام الدعوة"],
  ["mismatch", "البريد غير مطابق"],
] as const;

for (const [token, heading] of states) {
  test(`shows safe ${token} invitation lifecycle state`, async ({ page }) => {
    await page.goto(`/invite/${token}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.getByText("Client B")).toHaveCount(0);
    await expect(page.getByText("tenant_b")).toHaveCount(0);
  });
}
