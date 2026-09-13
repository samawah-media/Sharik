import { expect, test } from "@playwright/test";

test("shows internal invite form and assigned-client portfolio surface", async ({
  page,
}) => {
  await page.goto("/invitations/internal", { waitUntil: "domcontentloaded" });

  await expect(
    page.getByRole("heading", { name: "إضافة عضو إلى الفريق" }),
  ).toBeVisible();
  await expect(page.getByLabel("اسم العضو")).toBeVisible();
  await expect(page.getByLabel("بريد العضو")).toBeVisible();
  await expect(page.getByLabel("الدور")).toBeVisible();
  await expect(page.getByLabel("الدور")).toHaveValue("");
  await expect(
    page.getByRole("group", { name: "العملاء الذين سيعمل عليهم" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "هدنة" })).not.toBeChecked();
  await expect(
    page.getByText("اختر كل العملاء الذين سيحصل العضو على الدور نفسه ضمنهم"),
  ).toBeVisible();

  await page.goto("/portfolio", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "عملائي" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "هدنة", exact: true })).toBeVisible();
  await expect(page.getByText("Client B")).toHaveCount(0);
});
