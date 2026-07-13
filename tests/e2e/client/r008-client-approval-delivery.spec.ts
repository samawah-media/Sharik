import { expect, test } from "@playwright/test";

test("R-008 client approver sees approval controls and final files without internal content", async ({
  page,
}) => {
  await page.goto("/client?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  const detail = page.getByTestId("client-approval-detail");
  const approvalActions = detail.getByTestId("client-approval-actions");
  await expect(detail).toBeVisible();
  await expect(detail).toHaveAttribute("dir", "rtl");
  await expect(approvalActions.locator('form button[type="submit"]')).toHaveCount(2);
  await expect(detail.getByTestId("client-files")).toBeVisible();
  await expect(detail.locator('[data-file-visibility="final_delivery"]')).toHaveCount(1);
  await expect(detail.locator('[data-file-visibility="internal_only"]')).toHaveCount(0);
  await expect(page.getByText("INTERNAL_QA_NOTE_SHOULD_NOT_RENDER")).toHaveCount(0);
});

test("R-008 client viewer sees the current item but cannot approve", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  const detail = page.getByTestId("client-approval-detail");
  const approvalActions = detail.getByTestId("client-approval-actions");
  await expect(detail).toBeVisible();
  await expect(approvalActions.locator('form button[type="submit"]')).toHaveCount(0);
  await expect(detail.locator('[data-file-visibility="final_delivery"]')).toHaveCount(1);
  await expect(page.getByText("INTERNAL_QA_NOTE_SHOULD_NOT_RENDER")).toHaveCount(0);
});

test("R-008 client approval surface is mobile RTL ready", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile assertion runs in the mobile Playwright project");

  await page.goto("/client?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByTestId("client-approval-detail")).toHaveAttribute(
    "dir",
    "rtl",
  );
  const overflowsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflowsViewport).toBe(false);
});
