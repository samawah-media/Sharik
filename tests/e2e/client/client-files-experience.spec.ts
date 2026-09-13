import { expect, test } from "@playwright/test";

// X010-B-5: the client files surface is a calm Drive-like grouping with Arabic
// labels, keyboard-openable cards (previewable files only), «تنزيل» (never
// «تنزيل آمن»), and no technical/internal/cross-client leak.
//
// Fixture actor mode does not seed file_assets rows for the direct /client/files
// read, so the page legitimately renders its honest ErrorState here (the read
// must NOT be converted into a silent empty list — X010-B-5 corrective item 2).
// These fixture tests therefore cover the page shell, RTL, state handling, and
// the no-leak invariant across all render states. The board internals
// (folders/counts/cards/«تنزيل»/keyboard) are covered by the client-files-board
// component test, and the real-data board is covered by the persistent E2E.

test("client files page renders «ملفاتي», RTL, and a known state with no technical leak", async ({
  page,
}) => {
  await page.goto("/client/files?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "ملفاتي" })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("dir", "rtl");

  // A known state (board / empty / honest error) must render — never a crash.
  const board = page.getByTestId("client-files-board");
  const empty = page.getByTestId("client-files-empty");
  const errorState = page.getByRole("heading", {
    name: "تعذّر تحميل ملفاتك الآن",
  });
  await expect(board.or(empty).or(errorState)).toBeVisible();

  // No raw enums / UUIDs / storage terms anywhere in the rendered HTML.
  const html = await page.locator("body").innerHTML();
  expect(html).not.toMatch(
    /internal_only|final_delivery|client_uploaded|contract_file|report_file|brand_asset/,
  );
  expect(html).not.toMatch(/storage|bucket|deliverable-assets/i);
  expect(html).not.toMatch(/data-file-visibility/);
  expect(html).not.toMatch(/تنزيل آمن/);

  // If the board rendered with real data, «تنزيل» is present.
  if (await board.isVisible().catch(() => false)) {
    await expect(
      page.getByRole("button", { name: "تنزيل" }).first(),
    ).toBeVisible();
  }
});

test("client file cards are keyboard reachable only when previewable", async ({
  page,
}) => {
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
  await expect(page.locator("body")).not.toContainText(/Client A/i);
});
