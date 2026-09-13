import { expect, test } from "@playwright/test";

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
