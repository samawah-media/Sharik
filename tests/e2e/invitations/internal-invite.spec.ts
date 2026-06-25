import { expect, test } from "@playwright/test";

test("shows internal invite form and assigned-client portfolio surface", async ({
  page,
}) => {
  await page.goto("/invitations/internal", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "دعوة عضو داخلي" }),
  ).toBeVisible();
  await expect(page.getByLabel("بريد العضو")).toBeVisible();
  await expect(page.getByLabel("الدور")).toBeVisible();
  await expect(page.getByLabel("نطاق العميل")).toBeVisible();

  await page.goto("/portfolio", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "عملائي" })).toBeVisible();
  await expect(page.getByText("Client A")).toBeVisible();
  await expect(page.getByText("Client B")).toHaveCount(0);
});
