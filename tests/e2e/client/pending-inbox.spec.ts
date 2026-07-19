import { expect, test } from "@playwright/test";

test("client pending route is a real inbox and stays read-only for viewer", async ({ page }) => {
  await page.goto("/client/pending?as=client_viewer_a", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "بانتظار موافقتي" }).first()).toBeVisible();
  await expect(page.getByText("مخرج تجريبي آمن", { exact: true })).toHaveCount(1);
  await expect(page.getByText("يمكنك مشاهدة المخرج فقط.")).toBeVisible();
  await expect(page.getByRole("button", { name: "اعتماد المخرج" })).toHaveCount(0);
  await expect(page.getByText("r007_visible_version")).toHaveCount(0);
  await expect(page.getByText("client_a")).toHaveCount(0);
});

test("client approver receives the decision controls for the current version", async ({ page }) => {
  await page.goto("/client/pending?as=client_approver_a", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "بانتظار موافقتي" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "اعتماد المخرج" })).toBeVisible();
  await expect(page.getByRole("button", { name: "طلب تعديل" })).toBeVisible();
  await expect(page.locator('input[name="versionId"]').first()).toHaveValue("r007_visible_version");
});
