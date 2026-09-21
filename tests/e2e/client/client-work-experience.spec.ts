import { expect, test } from "@playwright/test";

const clientApprover = "client_approver_a";
const clientViewer = "client_viewer_a";

test.describe("X010-B3 client work experience", () => {
  test("أعمالي page groups work by Arabic status with clickable keyboard cards", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByRole("heading", { name: "أعمالي" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "بانتظار قرارك" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "قيد التعديل لدى فريق سماوة" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "تم التسليم" }),
    ).toBeVisible();

    const firstCard = page.locator('[data-testid="client-work-card"]').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveAttribute(
      "href",
      /\/client\/work\/.+/,
    );

    await firstCard.focus();
    await expect(firstCard).toBeFocused();
  });

  test("each card opens its own deliverable detail page", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    const firstCard = page.locator('[data-testid="client-work-card"]').first();
    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/\/client\/work\/.+/);
    const deliverableId = String(href).split("/client/work/")[1];

    await firstCard.click();
    // The local dev server compiles this dynamic route on its first navigation.
    await expect(page).toHaveURL(`/client/work/${deliverableId}`, { timeout: 30_000 });
    await expect(
      page.getByRole("link", { name: "العودة إلى أعمالي" }),
    ).toBeVisible();
    const main = page.locator("main");
    await expect(main).not.toContainText(deliverableId);
    await expect(main).not.toContainText("waiting_client_approval");
    await expect(main).not.toContainText("internal_only");
  });

  test("change-requested work stays visible and its detail stays openable", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    const editing = page.getByRole("region", {
      name: "قيد التعديل لدى فريق سماوة",
    });
    await expect(editing).toBeVisible();
    await expect(
      editing.getByTestId("client-change-request-note"),
    ).toContainText("استلم فريق سماوة ملاحظاتك");
    const changeCard = editing.locator('[data-testid="client-work-card"]').first();
    const href = await changeCard.getAttribute("href");
    expect(String(href)).toMatch(/\/client\/work\/.+/);

    await changeCard.click();
    await expect(page).toHaveURL(/\/client\/work\/.+/);
    await expect(
      page.getByRole("link", { name: "العودة إلى أعمالي" }),
    ).toBeVisible();
  });

  test("change-requested work does not appear in the pending decision inbox", async ({
    page,
  }) => {
    await page.goto(`/client/pending?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "بانتظار موافقتي" }).first(),
    ).toBeVisible();
    await expect(page.getByText("قيد التعديل لدى فريق سماوة")).toHaveCount(0);
  });

  test("client viewer sees viewer copy and no decision controls in أعمالي", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=${clientViewer}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("region", { name: "قيد المراجعة" }),
    ).toBeVisible();
    await expect(page.getByText("بانتظار قرارك")).toHaveCount(0);
    expect(
      await page.getByText(/والقرار لدى المسؤول عن الاعتماد/).count(),
    ).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "اعتماد النسخة" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: "طلب تعديل" })).toHaveCount(0);
  });

  test("viewer detail page stays read-only with no decision buttons", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=${clientViewer}`, {
      waitUntil: "domcontentloaded",
    });
    const firstCard = page.locator('[data-testid="client-work-card"]').first();
    const href = await firstCard.getAttribute("href");
    const detailUrl = `${href}?as=${clientViewer}`;

    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "اعتماد النسخة" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "طلب تعديل" })).toHaveCount(0);
    await expect(page.getByText(/للاطلاع فقط|لا يملك صلاحية/)).toBeVisible();
  });

  test("Client B cannot open Client A work detail", async ({ page }) => {
    await page.goto(
      `/client/work/hadna_deliverable_34?as=client_approver_b`,
      { waitUntil: "domcontentloaded" },
    );

    await expect(
      page.getByRole("heading", { name: "لا يمكنك الوصول لهذا المورد" }),
    ).toBeVisible();
    await expect(page.getByText("هدنة")).toHaveCount(0);
    await expect(page.getByText("hadna_deliverable_34")).toHaveCount(0);
    await expect(page.getByText("منشورات هدنة")).toHaveCount(0);
  });

  test("Client B sees no Client A data on its own work list", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=client_approver_b`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText("هدنة")).toHaveCount(0);
    await expect(page.getByText("hadna_deliverable")).toHaveCount(0);
    await expect(page.getByText("منشورات هدنة")).toHaveCount(0);
  });

  test("no raw enums, UUIDs, or internal terms leak across the work page", async ({
    page,
  }) => {
    await page.goto(`/client/work?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    const main = page.locator("main");
    await expect(main).not.toContainText("waiting_client_approval");
    await expect(main).not.toContainText("client_changes_requested");
    await expect(main).not.toContainText("ready_for_delivery");
    await expect(main).not.toContainText("التعميد الداخلي");
    await expect(main).not.toContainText("internal_only");
    await expect(main).not.toContainText("00000000");
  });

  test("client home exposes clickable sections for pending, work, and package", async ({
    page,
  }) => {
    await page.goto(`/client?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("link", { name: /مراجعة ما ينتظرني/ }),
    ).toHaveAttribute("href", "/client/pending");
    await expect(
      page.getByRole("link", { name: "فتح أعمالي" }),
    ).toHaveAttribute("href", "/client/work");
    await expect(
      page.getByRole("link", { name: /عرض الباقة/ }),
    ).toHaveAttribute("href", "/client/commercial");
  });

  test("client portal stays within the mobile viewport on the work page", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      !isMobile,
      "mobile assertion runs in the mobile Playwright project",
    );

    await page.goto(`/client/work?as=${clientApprover}`, {
      waitUntil: "domcontentloaded",
    });

    const overflowsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowsViewport).toBe(false);
  });
});
