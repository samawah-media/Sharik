import { expect, test } from "@playwright/test";

test("keeps team invitation scope explicit, compact, and overflow-free", async ({
  page,
}, testInfo) => {
  await page.goto("/invitations/internal", { waitUntil: "domcontentloaded" });

  const role = page.getByLabel("الدور");
  const hadna = page.getByRole("checkbox", { name: "هدنة" });
  const secondClient = page.getByRole("checkbox", { name: "عميل تجريبي ب" });
  const submit = page.getByRole("button", { name: "إنشاء رابط الدعوة" });

  await expect(role).toHaveValue("");
  await expect(hadna).not.toBeChecked();
  await expect(secondClient).not.toBeChecked();
  await expect(submit).toBeDisabled();

  await hadna.check();
  await secondClient.check();
  await expect(submit).toBeDisabled();

  await role.selectOption("designer");
  await expect(submit).toBeEnabled();

  await expect(page.getByText("عضو مقبول يظهر في الفريق")).toHaveCount(0);
  await expect(page.getByText("دعوات بانتظار القبول")).toBeVisible();
  await expect(page.getByText("سجل الدعوات المغلقة (1)")).toBeVisible();
  await expect(page.getByText("دعوة ملغاة سابقة")).toBeHidden();

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("team-invitation-viewport.png"),
  });
  await page.screenshot({
    path: testInfo.outputPath("team-invitation.png"),
    fullPage: true,
  });
});

test("exposes the closed invitation history by keyboard without accepted duplication", async ({
  page,
}) => {
  await page.goto("/invitations/internal", { waitUntil: "domcontentloaded" });

  const history = page.getByText("سجل الدعوات المغلقة (1)");
  await expect(history).toBeEnabled();
  await history.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText("دعوة ملغاة سابقة")).toBeVisible();
  await expect(page.getByText("عضو مقبول يظهر في الفريق")).toHaveCount(0);
});
