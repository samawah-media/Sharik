import { expect, test } from "@playwright/test";
import { signInHostedPersona } from "./support/uat-personas";

// Opt-in only: credentials are supplied from the ignored owner handoff.
// Traces are disabled because this verifies real owner-authorized identities.
test.use({ trace: "off" });
test.describe.configure({ timeout: 180_000 });
const keys = ["ADMIN", "PROJECT_MANAGER", "CONTENT_WRITER", "DESIGNER", "CLIENT_APPROVER"] as const;

for (const key of keys) {
  test(`team pilot ${key} authenticates, retains identity and enforces route scope`, async ({ page }) => {
    test.skip(process.env.S015_TEAM_PILOT_VERIFY !== "1", "Explicit team-pilot verification required");
    const required = (suffix: string) => {
      const value = process.env[`S015_${key}_${suffix}`];
      if (!value) throw new Error(`Missing team-pilot ${key} ${suffix}`);
      return value;
    };
    const persona = { label: required("LABEL"), email: required("EMAIL"), password: required("PASSWORD") };
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.name));
    await signInHostedPersona(page, persona);
    await expect(page.getByTestId("product-shell-account-identity")).toContainText(persona.label);
    const isClient = key === "CLIENT_APPROVER";
    await page.goto(isClient ? "/client" : "/portfolio", { waitUntil: "domcontentloaded" });
    const assertLanding = async () => {
      await expect(page).toHaveURL(isClient ? /\/client$/u : /\/portfolio$/u);
      await expect(page.getByTestId("product-shell-account-identity")).toContainText(persona.label);
      if (isClient) {
        await expect(page.getByRole("heading", { name: /^مساحة الحسام/u, level: 1 })).toBeVisible();
        await expect(page.getByRole("link", { name: "فتح أعمالي", exact: true })).toBeVisible();
      } else {
        await expect(page.getByRole("heading", { name: key === "ADMIN" ? "لوحة الإدارة" : "عملائي", exact: true, level: 1 })).toBeVisible();
        await expect(page.getByRole("heading", { name: /الحسام.*تجربة الفريق/u, level: 2 })).toBeVisible();
        await expect(page.getByRole("link", { name: /فتح الحسام/u })).toBeVisible();
      }
    };
    await assertLanding();
    await expect(page.getByRole("heading", { name: "انتهت الجلسة" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "لا يمكن الوصول إلى هذه الصفحة" })).toHaveCount(0);
    await page.reload({ waitUntil: "domcontentloaded" });
    await assertLanding();
    expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(overflow, "role landing must fit the viewport").toBe(false);
    if (key !== "ADMIN") {
      await page.goto("/members", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "لا يمكن الوصول إلى هذه الصفحة" })).toBeVisible();
    }
    if (isClient) {
      await page.goto("/work", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "لا يمكن الوصول إلى هذه الصفحة" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "مهامي", exact: true })).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
