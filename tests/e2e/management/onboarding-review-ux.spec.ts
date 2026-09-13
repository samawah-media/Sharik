import { expect, test, type Page, type TestInfo } from "@playwright/test";

// X010-B-7C-8 / S015-P2-138: the first-client wizard must keep the user on the
// failing step, move focus to the first actually-invalid field (the company
// name, never the optional phone), expose a field-bound inline error through
// aria-invalid/aria-describedby, and present an organized Arabic review with
// the full team, every provided date, and the approval settings — on desktop,
// mobile, and RTL, without unintended horizontal overflow.
//
// Fixture actor mode has no live team-directory RPC, so the review honestly
// renders the "no owner/contributors selected" states here. Human team names
// and roles in the review are covered by the component wizard tests with a
// populated directory and by the persistent onboarding journey against real
// Supabase data.

test.describe.configure({ timeout: 180_000 });

const onboardPath = "/clients/onboard";

// The Next.js dev-server indicator bubble overlaps the wizard's primary
// action on narrow viewports and intercepts Playwright pointer events. It is
// development tooling only, so hide it for deterministic clicks. Production
// builds never render this portal.
const hideNextDevIndicator = async (page: Page) => {
  await page.addStyleTag({
    content: "nextjs-portal{display:none!important}",
  });
};

const openWizard = async (page: Page) => {
  await page.goto(onboardPath, { waitUntil: "domcontentloaded" });
  await hideNextDevIndicator(page);
  return waitForHydratedWizard(page);
};

const wizardForm = (page: Page) =>
  page.getByRole("form", { name: "معالج إضافة عميل جديد" });

const waitForHydratedWizard = async (page: Page) => {
  const form = wizardForm(page);
  await expect(form).toBeVisible();
  // Dev-server compilation can be slow on constrained machines; the wizard is
  // inert until hydration attaches its step handlers, so wait generously.
  await expect(form).toHaveAttribute("data-hydrated", "true", {
    timeout: 60_000,
  });
  return form;
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);
};

const capture = async (page: Page, testInfo: TestInfo, name: string) => {
  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: testInfo.outputPath(`${name}.png`),
  });
};

const fillWizardThroughReview = async (page: Page) => {
  const form = await openWizard(page);

  await form
    .locator('input[aria-label="اسم الشركة أو الجهة"]')
    .fill("شركة المراجعة التجريبية");
  await form
    .locator('input[aria-label="اسم مسؤول التواصل"]')
    .fill("سارة المسؤولة");
  await form
    .locator('input[aria-label="رقم الهاتف / واتساب"]')
    .fill("+966 50 123 4567");
  await form
    .locator('input[aria-label="البريد الإلكتروني"]')
    .fill("sara@example.com");
  await form.getByRole("button", { name: "التالي" }).click();

  await form.locator('input[aria-label="اسم العقد"]').fill("عقد المراجعة");
  await form
    .locator('input[aria-label="تاريخ بداية العقد"]')
    .fill("2026-07-01");
  await form
    .locator('input[aria-label="تاريخ نهاية العقد"]')
    .fill("2026-08-31");
  await form
    .getByRole("button", { name: "تفاصيل إضافية (اختياري)" })
    .click();
  await form.locator('input[aria-label="مرجع العقد"]').fill("REF-REVIEW-1");
  await form.getByRole("button", { name: "التالي" }).click();

  await form.locator('input[aria-label="اسم الباقة"]').fill("باقة المراجعة");
  await form
    .locator('input[aria-label="اسم الخدمة للسطر 1"]')
    .fill("منشورات المراجعة");
  await form.getByRole("button", { name: "إضافة خدمة" }).click();
  await form
    .locator('input[aria-label="اسم الخدمة للسطر 2"]')
    .fill("ريلز المراجعة");
  await form
    .locator('input[aria-label="وحدة القياس للسطر 2"]')
    .fill("ريلز");
  await form.getByRole("button", { name: "التالي" }).click();

  // Team step: fixture mode has no directory rows; continue honestly.
  await form.getByRole("button", { name: "التالي" }).click();

  await form.locator('input[aria-label="اسم المخرج"]').fill("مخرج المراجعة");
  await form
    .locator('textarea[aria-label="وصف المخرج"]')
    .fill("وصف عربي واضح للمراجعة النهائية");
  await form.locator('select[aria-label="نوع المخرج"]').selectOption("reel");
  await form.locator('select[aria-label="الأولوية"]').selectOption("urgent");
  await form.locator('input[aria-label="تاريخ البدء"]').fill("2026-07-10");
  await form.locator('input[aria-label="الموعد الداخلي"]').fill("2026-07-15");
  await form.locator('input[aria-label="موعد العميل"]').fill("2026-07-20");
  await form.locator('input[aria-label="الموعد النهائي"]').fill("2026-07-25");
  await form.getByLabel("يتطلب تعميدًا داخليًا").uncheck();
  await form.getByRole("button", { name: "التالي" }).click();

  await expect(
    form.getByRole("button", { name: "إنشاء العميل والبدء" }),
  ).toBeVisible();

  return form;
};

test("empty submit focuses the company field with a screen-reader-reachable inline error", async ({
  page,
}) => {
  const form = await openWizard(page);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const companyInput = form.locator('input[aria-label="اسم الشركة أو الجهة"]');
  const phoneInput = form.locator('input[aria-label="رقم الهاتف / واتساب"]');

  await form.getByRole("button", { name: "التالي" }).click();

  await expect(companyInput).toBeFocused();
  await expect(phoneInput).not.toBeFocused();
  await expect(companyInput).toHaveAttribute("aria-invalid", "true");
  await expect(companyInput).toHaveAttribute(
    "aria-describedby",
    "onboarding-error-clientName",
  );

  const errorId = await companyInput.getAttribute("aria-describedby");
  const inlineError = page.locator(`#${errorId}`);
  await expect(inlineError).toBeVisible();
  await expect(inlineError).toContainText(/اسم الشركة أو الجهة مطلوب/u);

  // The optional phone never becomes the first flagged error when empty.
  await expect(phoneInput).not.toHaveAttribute("aria-invalid");

  // Keyboard flow continues from the focused invalid field.
  await page.keyboard.press("Tab");
  await expect(companyInput).not.toBeFocused();

  // The step does not advance.
  await expect(form.locator('input[aria-label="اسم العقد"]')).toHaveCount(0);
  await expect(companyInput).toHaveValue("");
});

test("correcting the field clears its error and values survive back/forward navigation", async ({
  page,
}) => {
  const form = await openWizard(page);
  const companyInput = form.locator('input[aria-label="اسم الشركة أو الجهة"]');
  const contactInput = form.locator(
    'input[aria-label="اسم مسؤول التواصل"]',
  );

  await companyInput.fill("شركة الرجوع والأمام");
  await contactInput.fill("منسق المراجعة");
  await form.getByRole("button", { name: "التالي" }).click();
  await expect(form.locator('input[aria-label="اسم العقد"]')).toBeVisible();

  await form.getByRole("button", { name: "السابق" }).click();
  await expect(companyInput).toHaveValue("شركة الرجوع والأمام");
  await expect(contactInput).toHaveValue("منسق المراجعة");

  // Break the company field again: error returns, focus returns, no data loss.
  await companyInput.fill("");
  await form.getByRole("button", { name: "التالي" }).click();
  await expect(companyInput).toBeFocused();
  await expect(companyInput).toHaveAttribute("aria-invalid", "true");
  await expect(contactInput).toHaveValue("منسق المراجعة");

  await companyInput.fill("شركة الرجوع والأمام");
  await expect(companyInput).not.toHaveAttribute("aria-invalid");
  await expect(
    page.getByText(/اسم الشركة أو الجهة مطلوب/u),
  ).toHaveCount(0);
  await form.getByRole("button", { name: "التالي" }).click();
  await expect(form.locator('input[aria-label="اسم العقد"]')).toBeVisible();
  await form.getByRole("button", { name: "السابق" }).click();
  await expect(companyInput).toHaveValue("شركة الرجوع والأمام");
});

test("full journey review presents dates, approval settings, and honest team state", async ({
  page,
}) => {
  const form = await fillWizardThroughReview(page);
  const review = form.getByRole("region", { name: "مراجعة البيانات" });
  await expect(review).toBeVisible();

  await expect(review.getByRole("heading", { name: "العميل" })).toBeVisible();
  await expect(review.getByRole("heading", { name: "العقد" })).toBeVisible();
  await expect(review.getByRole("heading", { name: "الباقة" })).toBeVisible();
  await expect(review.getByRole("heading", { name: "الفريق" })).toBeVisible();
  await expect(
    review.getByRole("heading", { name: "أول مخرج" }),
  ).toBeVisible();

  await expect(review.getByText("شركة المراجعة التجريبية")).toBeVisible();
  await expect(review.getByText("سارة المسؤولة")).toBeVisible();
  await expect(review.getByText("sara@example.com")).toBeVisible();
  await expect(review.getByText("REF-REVIEW-1")).toBeVisible();

  // Package services with quantities and units.
  await expect(
    review.getByText("منشورات المراجعة", { exact: true }),
  ).toBeVisible();
  await expect(review.getByText("1 منشور")).toBeVisible();
  await expect(
    review.getByText("ريلز المراجعة", { exact: true }),
  ).toBeVisible();

  // Honest team state in fixture mode (no directory rows available).
  await expect(
    review.getByText("لم يُحدَّد مسؤول رئيسي بعد"),
  ).toBeVisible();
  await expect(
    review.getByText("لا يوجد أعضاء مشاركون حاليًا."),
  ).toBeVisible();

  // Deliverable metadata: Arabic labels, never raw enums.
  await expect(review.getByText("ريلز", { exact: true })).toBeVisible();
  await expect(review.getByText("عاجلة")).toBeVisible();
  await expect(
    review.getByText("وصف عربي واضح للمراجعة النهائية"),
  ).toBeVisible();

  // All four provided dates in one Arabic Gregorian formatter.
  await expect(review.getByText("١٠ يوليو ٢٠٢٦")).toBeVisible();
  await expect(review.getByText("١٥ يوليو ٢٠٢٦")).toBeVisible();
  await expect(review.getByText("٢٠ يوليو ٢٠٢٦")).toBeVisible();
  await expect(review.getByText("٢٥ يوليو ٢٠٢٦")).toBeVisible();

  // Approval settings reflect the unchecked internal approval.
  await expect(
    review.getByText("يتطلب تعميدًا داخليًا:", { exact: true }),
  ).toBeVisible();
  await expect(
    review.getByText("يتطلب اعتماد العميل:", { exact: true }),
  ).toBeVisible();
  await expect(review.getByText("نعم", { exact: true })).toBeVisible();
  await expect(review.getByText("لا", { exact: true })).toBeVisible();

  // No raw identifiers or enum values leak into the review.
  const bodyHtml = await page.locator("body").innerHTML();
  expect(bodyHtml).not.toMatch(/>[^<]*(user-writer|user-designer|internalDueDate)[^<]*</);

  await expectNoHorizontalOverflow(page);
  await capture(page, test.info(), "onboarding-review-desktop");
});

test("onboarding review is mobile-safe without horizontal overflow", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile assertion runs in the mobile Playwright project");

  const form = await fillWizardThroughReview(page);
  const review = form.getByRole("region", { name: "مراجعة البيانات" });
  await expect(review).toBeVisible();
  await expect(review.getByText("١٠ يوليو ٢٠٢٦")).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await capture(page, test.info(), "onboarding-review-mobile");
});
