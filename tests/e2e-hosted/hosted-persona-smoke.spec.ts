import { expect, test } from "@playwright/test";
import {
  expectNoSensitiveLeakage,
  hostedPersona,
  signInHostedPersona,
  type HostedPersonaKey,
} from "./support/uat-personas";

test.describe.configure({ timeout: 180_000 });

async function expectEveryPendingItemHasReviewPayload(
  page: import("@playwright/test").Page,
) {
  const details = page.getByTestId("client-approval-detail");
  const detailCount = await details.count();
  expect(detailCount).toBeGreaterThan(0);

  for (let index = 0; index < detailCount; index += 1) {
    const detail = details.nth(index);
    const contentCard = detail.locator("[data-content-card]");
    await expect(contentCard).toHaveCount(1);

    const hasCaption =
      (await contentCard.getAttribute("data-has-caption")) === "true";
    const hasMedia =
      (await contentCard.locator("[data-media-fallback]").count()) === 0;
    const hasVisibleFile =
      (await detail.locator('[data-testid="client-files"] > li').count()) > 0;

    expect(
      hasCaption || hasMedia || hasVisibleFile,
      `pending detail ${index + 1} must expose a real caption, media, or visible file`,
    ).toBe(true);
  }
}

const internalPersonas: HostedPersonaKey[] = [
  "ADMIN",
  "ACCOUNT_MANAGER",
  "CONTENT_WRITER",
  "DESIGNER",
];

for (const key of internalPersonas) {
  test(`hosted ${key.toLowerCase()} reaches scoped internal workspace`, async ({
    page,
  }) => {
    await signInHostedPersona(page, hostedPersona(key));
    await page.goto("/work", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "مهامي" })).toBeVisible();
    await expect(page.getByText("work", { exact: true })).toHaveCount(0);
    await expectNoSensitiveLeakage(page);
  });
}

test("hosted unassigned internal negative user sees no unauthorized client work", async ({
  page,
}) => {
  await signInHostedPersona(page, hostedPersona("UNASSIGNED"));
  await page.goto("/work", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText(/Alpha|Beta|client_b|tenant_b/i)).toHaveCount(0);
  await expectNoSensitiveLeakage(page);
});

test("hosted client viewer is read-only in pending inbox", async ({ page }) => {
  await signInHostedPersona(page, hostedPersona("CLIENT_VIEWER"));
  await page.goto("/client/pending", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/client\/pending$/u);
  await expect(page.getByRole("link", { name: "قيد المراجعة" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(
    page.getByTestId("client-approval-detail").first(),
  ).toBeVisible();
  await expect(page.locator('[data-review-ready="false"]')).toHaveCount(0);
  await expectEveryPendingItemHasReviewPayload(page);
  await expect(
    page.getByRole("heading", { name: "للاطلاع" }).first(),
  ).toBeVisible();
  await expect(page.getByText("قرارك مطلوب", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "اعتماد المخرج" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: "طلب تعديل" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "إضافة التعليق" })).toHaveCount(
    0,
  );
  await expectNoSensitiveLeakage(page);
});

test("hosted client approver reaches pending inbox without internal leakage", async ({
  page,
}) => {
  await signInHostedPersona(page, hostedPersona("CLIENT_APPROVER"));
  await page.goto("/client/pending", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/client\/pending$/u);
  await expect(
    page.getByRole("link", { name: "بانتظار موافقتي" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(
    page.getByTestId("client-approval-detail").first(),
  ).toBeVisible();
  await expect(page.locator('[data-review-ready="false"]')).toHaveCount(0);
  await expectEveryPendingItemHasReviewPayload(page);
  await expect(
    page.getByRole("button", { name: "اعتماد المخرج" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "طلب تعديل" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/تعليق داخلي|ملاحظة جودة|internal/i)).toHaveCount(
    0,
  );
  await expectNoSensitiveLeakage(page);
});
