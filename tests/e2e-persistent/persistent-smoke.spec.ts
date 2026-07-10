import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  seedPersistentReadOnlySmoke,
  signInViaUi,
} from "./support/s015-persistent-local";

test.describe.configure({ mode: "serial", timeout: 120_000 });

let seeded: Awaited<ReturnType<typeof seedPersistentReadOnlySmoke>>;

test.beforeAll(async () => {
  seeded = await seedPersistentReadOnlySmoke();
});

test("persistent client approval surface is RTL, mobile-safe, and keyboard reachable", async ({
  page,
  isMobile,
}) => {
  await signInViaUi(page, seeded.seed.actors.clientApprover);
  await page.goto("/client", { waitUntil: "domcontentloaded" });

  const detail = page.getByTestId("client-approval-detail");
  await expect(detail).toBeVisible();
  await expect(detail).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("S015_INTERNAL_SMOKE_SECRET")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();

  if (isMobile) {
    const box = await detail.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBeLessThanOrEqual(420);
  }
});
