import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 240_000 });

test("tenant admin can open the internal Kanban board from deliverables", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.goto("/clients/client_a/deliverables?as=tenant_admin_a", {
    waitUntil: "domcontentloaded",
  });

  const main = page.getByRole("main");
  const boardLink = main.getByRole("link", { name: "لوحة العمل" });

  await expect(boardLink).toHaveAttribute(
    "href",
    "/clients/client_a/deliverables/board",
  );
  await Promise.all([
    page.waitForURL("**/clients/client_a/deliverables/board"),
    boardLink.click(),
  ]);

  await expect(
    page.getByRole("heading", { name: "لوحة العمل" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "لوحة العمل" }),
  ).toBeVisible();
  const firstColumn = page.getByTestId("kanban-column").first();
  const board = page.getByTestId("kanban-board-scroll");
  await expect(firstColumn).toBeVisible();
  await expect.poll(async () => {
    const box = await board.boundingBox();
    return box ? box.y + box.height <= (await page.evaluate(() => innerHeight)) : false;
  }).toBe(true);
  await expect
    .poll(async () => {
      const box = await firstColumn.boundingBox();
      return Math.round(box?.width ?? 0);
    })
    .toBeGreaterThanOrEqual(320);
  await expect(
    page
      .getByRole("region", { name: "لوحة العمل" })
      .getByText("ستوري هدنة 43", { exact: true }),
  ).toBeVisible({ timeout: 30_000 });

  const boardBox = await board.boundingBox();
  if (boardBox) {
    const nestedScrollProbe = board.locator('[data-testid="nested-scroll-probe"]');
    await board.evaluate((element) => {
      const probe = document.createElement("div");
      probe.dataset.testid = "nested-scroll-probe";
      probe.style.cssText = "position:absolute;inset:8px auto auto 8px;width:80px;height:60px;overflow:auto;z-index:50;background:white";
      probe.innerHTML = '<div style="height:240px">اختبار تمرير داخلي</div>';
      element.append(probe);
    });
    const probeBox = await nestedScrollProbe.boundingBox();
    if (probeBox) {
      const initialBoardLeft = await board.evaluate((element) => element.scrollLeft);
      await page.mouse.move(probeBox.x + probeBox.width / 2, probeBox.y + 20);
      await page.mouse.wheel(0, 120);
      await expect.poll(() => nestedScrollProbe.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => board.evaluate((element) => element.scrollLeft)).toBe(initialBoardLeft);

      await nestedScrollProbe.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await page.mouse.wheel(0, 120);
      await expect.poll(() => board.evaluate((element) => element.scrollLeft)).not.toBe(initialBoardLeft);
    }
    await nestedScrollProbe.evaluate((element) => element.remove());

    await board.evaluate((element) => {
      element.scrollTop = 0;
      element.scrollLeft = 0;
    });
    await page.mouse.move(boardBox.x + boardBox.width / 2, boardBox.y + boardBox.height / 2);
    await page.mouse.wheel(0, 180);
    await expect.poll(() => board.evaluate((element) => ({
      left: element.scrollLeft,
      top: element.scrollTop,
      verticallyScrollable: element.scrollHeight > element.clientHeight,
    }))).toMatchObject({ left: 0, top: expect.any(Number) });
    const scroll = await board.evaluate((element) => ({
      top: element.scrollTop,
      verticallyScrollable: element.scrollHeight > element.clientHeight,
    }));
    if (scroll.verticallyScrollable) expect(scroll.top).toBeGreaterThan(0);
  }

  await page
    .getByRole("button", { name: "تغيير الحالة ستوري هدنة 43" })
    .click();
  await expect(
    page.getByRole("form", { name: "تغيير حالة ستوري هدنة 43" }),
  ).toBeVisible();
  await page.getByLabel("الحالة").first().selectOption("in_progress");
  await expect(page.getByLabel("الحالة").first()).toHaveValue("in_progress");
  await expect(page.getByText("client_b")).toHaveCount(0);
  await expect(page.getByText("approval log")).toHaveCount(0);
  expect(browserErrors).toEqual([]);
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
