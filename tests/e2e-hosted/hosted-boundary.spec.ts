import { expect, test } from "@playwright/test";

test("hosted UAT refuses local fixture impersonation", async ({ page }) => {
  await page.goto("/client/pending?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("مخرج تجريبي آمن")).toHaveCount(0);
  await expect(page.locator('input[name="versionId"][value="r007_visible_version"]')).toHaveCount(0);
});

test("hosted UAT public shell does not expose browser-side service credentials", async ({
  page,
}) => {
  let leakedScriptCount = 0;
  page.on("response", async (response) => {
    const request = response.request();
    if (request.resourceType() !== "script") return;
    if (!response.ok()) return;
    const body = await response.text().catch(() => "");
    if (/service[_-]?role|SUPABASE_SERVICE_ROLE_KEY/i.test(body)) {
      leakedScriptCount += 1;
    }
  });

  await page.goto("/", { waitUntil: "networkidle" });
  expect(leakedScriptCount).toBe(0);
});
