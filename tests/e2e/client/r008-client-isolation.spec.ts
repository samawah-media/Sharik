import { expect, test } from "@playwright/test";

test("R-008 client viewer sees scoped client portal data without approval actions", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByText("INTERNAL_QA_NOTE_SHOULD_NOT_RENDER")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("tenant_b")).toHaveCount(0);
  await expect(page.locator('form button[type="submit"]')).toHaveCount(0);
});

test("R-008 client approver can access only scoped approval controls", async ({
  page,
}) => {
  await page.goto("/client?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator('form button[type="submit"]')).toHaveCount(2);
  await expect(page.getByText("INTERNAL_QA_NOTE_SHOULD_NOT_RENDER")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("tenant_b")).toHaveCount(0);
});

test("R-008 unassigned client user receives a safe empty state", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_b", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByText("client_a")).toHaveCount(0);
  await expect(page.getByText("tenant_a")).toHaveCount(0);
  await expect(page.locator('form button[type="submit"]')).toHaveCount(0);
});
