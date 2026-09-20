import { expect, test } from "@playwright/test";

test("assigned writer sees clients first in the 400px portfolio viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto("/portfolio?as=assigned_writer_a", {
    waitUntil: "domcontentloaded",
  });

  const heading = page.getByRole("heading", { name: "عملائي", level: 1 });
  const firstClient = page.getByTestId("assigned-client-card-client_a");
  await expect(heading).toBeVisible({ timeout: 60_000 });
  await expect(firstClient).toBeVisible();
  await expect(page.getByText("يحتاج انتباهكم")).toHaveCount(0);
  await expect(page.getByText("لوحة الإدارة", { exact: true })).toHaveCount(0);
  // Next.js owns a global route announcer with role=alert. Scope the product
  // assertion so framework accessibility infrastructure is not a false leak.
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

  const geometry = await page.evaluate(() => {
    const heading = document.querySelector("h1");
    const firstClient = document.querySelector(
      '[data-testid="assigned-client-card-client_a"]',
    );
    const box = (element: Element | null) => {
      const rect = element?.getBoundingClientRect();
      return rect
        ? { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
        : null;
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      heading: box(heading),
      firstClient: box(firstClient),
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  await testInfo.attach("assigned-team-portfolio-400x844.json", {
    body: JSON.stringify(geometry, null, 2),
    contentType: "application/json",
  });
  expect(geometry.viewport).toEqual({ width: 400, height: 844 });
  expect(geometry.heading?.top).toBeGreaterThanOrEqual(0);
  expect(geometry.heading?.bottom).toBeLessThanOrEqual(844);
  expect(geometry.firstClient?.top).toBeGreaterThanOrEqual(0);
  expect(geometry.firstClient?.top).toBeLessThan(844);
  expect(geometry.documentWidth).toBeLessThanOrEqual(400);

  await firstClient.getByRole("link", { name: "فتح هدنة" }).click();
  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible({
    timeout: 60_000,
  });
});

test("assigned writer sees scoped work without receiving commercial access", async ({
  page,
}) => {
  await page.goto("/portfolio?as=assigned_writer_a", {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByTestId("assigned-client-card-client_a")
    .click({ position: { x: 12, y: 12 } });
  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible({
    timeout: 60_000,
  });

  await page.goto("/clients/client_a?as=assigned_writer_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible();
  await expect(page.getByText("عدد الأعمال")).toBeVisible();
  await expect(page.getByText("52", { exact: true })).toBeVisible();
  await expect(page.getByText("المكتمل")).toBeVisible();
  await expect(page.getByText("الباقة", { exact: true })).toHaveCount(0);
  const deliverablesPath = page.getByRole("link", {
    name: /المخرجات.*قائمة المخرجات المتفق عليها/,
  });
  await expect(deliverablesPath).toBeVisible();
  await expect(page.getByRole("link", { name: "العقد والباقة" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: "المتابعة / SLA" })).toHaveCount(
    0,
  );

  await expect(deliverablesPath).toHaveAttribute(
    "href",
    "/clients/client_a/deliverables",
  );
  await deliverablesPath.click({ position: { x: 12, y: 12 } });
  await expect(
    page.getByRole("heading", { name: "مخرجات هدنة" }),
  ).toBeVisible({ timeout: 60_000 });
  await page.goto("/clients/client_a/deliverables?as=assigned_writer_a", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "مخرجات هدنة" }),
  ).toBeVisible();
  await expect(page.getByText("لا يمكنك الوصول إلى المخرجات")).toHaveCount(0);
});
