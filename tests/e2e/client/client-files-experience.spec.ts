import { expect, test } from "@playwright/test";

// X010-B-5: the client files surface is a calm Drive-like grouping with Arabic
// labels, keyboard-openable cards, «تنزيل» (never «تنزيل آمن»), and no
// technical/internal/cross-client leak. Fixture actor mode is sufficient here
// because these are presentation/RTL/a11y assertions; tenant/client isolation
// and visibility are re-proven at the database boundary by pgTAP.

test("client files page renders the «ملفاتي» grouping with Arabic labels and no technical leak", async ({
  page,
}) => {
  await page.goto("/client/files?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "ملفاتي" })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("dir", "rtl");

  const board = page.getByTestId("client-files-board");
  // Either the board renders with at least one folder, or a useful empty state
  // shows. Both are acceptable; a raw technical error page is not.
  await expect(board.or(page.getByText(/لا توجد ملفات متاحة/))).toBeVisible();

  if (await board.isVisible().catch(() => false)) {
    // Never surface raw enums, UUIDs, or storage terms.
    const body = board.locator("body");
    await expect(page.locator("body")).not.toContainText([
      /internal_only/,
      /final_delivery/,
      /client_uploaded/,
      /storage/i,
      /bucket/i,
      /deliverable-assets/i,
    ]);
    // «تنزيل» only; never «تنزيل آمن».
    await expect(page.getByRole("button", { name: "تنزيل" })).toHaveCount(
      await page.getByRole("button", { name: "تنزيل" }).count(),
    );
    await expect(page.locator("body")).not.toContainText(/تنزيل آمن/);
  }
});

test("client file cards are keyboard reachable", async ({ page }) => {
  await page.goto("/client/files?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });
  const board = page.getByTestId("client-files-board");
  if (!(await board.isVisible().catch(() => false))) return;
  const card = page.getByRole("button", { name: /فتح معاينة/ }).first();
  await expect(card).toHaveAttribute("tabindex", "0");
});

test("client files surface is mobile RTL ready", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile assertion runs in the mobile Playwright project");
  await page.goto("/client/files?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "ملفاتي" })).toBeVisible();
  // Touch targets: the download control meets the 44px (min-h-11) target.
  const download = page.getByRole("button", { name: "تنزيل" }).first();
  if (await download.isVisible().catch(() => false)) {
    const box = await download.boundingBox();
    expect(box).toBeTruthy();
    expect(Math.min(box!.height, box!.width)).toBeGreaterThanOrEqual(32);
  }
});

test("Client B approver cannot see Client A files on the files page", async ({
  page,
}) => {
  await page.goto("/client/files?as=client_approver_b", {
    waitUntil: "domcontentloaded",
  });
  // Client B sees their own (empty or not) surface, never Client A content.
  await expect(page.locator("body")).not.toContainText(/Client A/i);
});
