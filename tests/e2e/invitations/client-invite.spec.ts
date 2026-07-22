import { expect, test } from "@playwright/test";

test("shows client portal entry without management or other-client leakage", async ({
  page,
}) => {
  await page.goto("/client", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "بانتظار موافقتي" }),
  ).toHaveAttribute("href", "/client/pending");
  await expect(page.getByText("Client B")).toHaveCount(0);
  await expect(page.getByText("لوحة الإدارة")).toHaveCount(0);
});
