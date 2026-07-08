import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 90_000 });

test("tenant admin can open the internal Kanban board from deliverables", async ({
  page,
}) => {
  await page.goto("/clients/client_a/deliverables?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  const main = page.getByRole("main");
  const boardLink = main.getByRole("link", { name: "لوحة العمل" });

  await expect(boardLink).toHaveAttribute(
    "href",
    "/clients/client_a/deliverables/board",
  );
  await boardLink.click();

  await expect(
    page.getByRole("heading", { name: "لوحة العمل" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "لوحة العمل" }),
  ).toBeVisible();
  const firstColumn = page.getByTestId("kanban-column").first();
  await expect(firstColumn).toBeVisible();
  await expect
    .poll(async () => {
      const box = await firstColumn.boundingBox();
      return Math.round(box?.width ?? 0);
    })
    .toBeGreaterThanOrEqual(320);
  await expect(page.getByText("ستوري هدنة 43")).toBeVisible();

  await page.getByText("تغيير الحالة").first().click();
  await expect(
    page.getByRole("form", { name: "تغيير حالة ستوري هدنة 43" }),
  ).toBeVisible();
  await page.getByLabel("الحالة").first().selectOption("in_progress");
  await expect(page.getByLabel("الحالة").first()).toHaveValue("in_progress");
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("approval log")).toHaveCount(0);
});

test("client viewer cannot access the internal Kanban board", async ({
  page,
}) => {
  await page.goto("/clients/client_a/deliverables/board?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByText("منشور إطلاق الحملة")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "لوحة العمل" }),
  ).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
});
