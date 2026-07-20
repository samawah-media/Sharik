import { expect, test } from "@playwright/test";

test("client approver sees controlled approval actions and no internal content", async ({
  page,
}) => {
  await page.goto("/client?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("navigation", { name: "تنقل بوابة العميل" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "مساحة هدنة" })).toBeVisible();

  const detail = page.getByRole("region", { name: "تفاصيل مخرج العميل" });
  await expect(detail).toBeVisible();
  await expect(
    detail.getByRole("region", { name: "قرار اعتماد العميل" }),
  ).toBeVisible();
  await expect(
    detail.getByRole("button", { name: "اعتماد المخرج" }),
  ).toBeVisible();
  await expect(detail.getByRole("button", { name: "طلب تعديل" })).toBeVisible();
  await expect(detail.getByText("الملفات المتاحة")).toBeVisible();
  await expect(detail.getByText("تعليق ظاهر للعميل")).toBeVisible();
  await expect(page.getByText("ملاحظات داخلية")).toHaveCount(0);
  await expect(
    page.getByText("INTERNAL_QA_NOTE_SHOULD_NOT_RENDER"),
  ).toHaveCount(0);
  await expect(page.getByText("internal_only")).toHaveCount(0);
  await expect(page.getByText("client_b")).toHaveCount(0);
});

test("client viewer can inspect allowed data but cannot submit approval", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_a", {
    waitUntil: "domcontentloaded",
  });

  const detail = page.getByRole("region", { name: "تفاصيل مخرج العميل" });
  await expect(detail).toBeVisible();
  await expect(
    detail.getByText(/لا يملك صلاحية الاعتماد أو طلب التعديل/),
  ).toBeVisible();
  await expect(
    detail.getByRole("button", { name: "اعتماد المخرج" }),
  ).toHaveCount(0);
  await expect(detail.getByRole("button", { name: "طلب تعديل" })).toHaveCount(
    0,
  );
  await expect(page.getByText("ملاحظات داخلية")).toHaveCount(0);
});

test("unassigned client user receives a safe empty state without customer data", async ({
  page,
}) => {
  await page.goto("/client?as=client_viewer_b", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", { name: "لا يوجد عملاء مسندون" }),
  ).toBeVisible();
  await expect(page.getByText("هدنة")).toHaveCount(0);
  await expect(page.getByText("client_a")).toHaveCount(0);
  await expect(page.getByText("tenant_a")).toHaveCount(0);
});

test("client portal stays within the mobile viewport", async ({
  page,
  isMobile,
}) => {
  test.skip(
    !isMobile,
    "mobile assertion runs in the mobile Playwright project",
  );

  await page.goto("/client?as=client_approver_a", {
    waitUntil: "domcontentloaded",
  });

  const overflowsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflowsViewport).toBe(false);
});
