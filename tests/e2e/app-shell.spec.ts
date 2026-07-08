import { expect, test } from "@playwright/test";

test("redirects unauthenticated root visits to the Arabic sign-in shell", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "تسجيل الدخول إلى شريك" }),
  ).toBeVisible();
});
