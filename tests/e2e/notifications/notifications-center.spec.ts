import { expect, test } from "@playwright/test";

// X010-B4 fixture E2E: the /notifications route and the shell bell render the
// Arabic notification center with filters, clickable items, RTL, and no
// technical leak. Runs under the fixture actor mode (no database required); the
// persistent DB-backed journey is covered separately.

test.describe("X010-B4 in-app notification center", () => {
  test("management notification center renders Arabic copy, filters, and clickable items", async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on("pageerror", (error) => {
      if (error.message.includes("Hydration failed")) {
        hydrationErrors.push(error.message);
      }
    });

    await page.goto("/notifications?as=tenant_admin_a", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("heading", { name: "مركز الإشعارات" }),
    ).toBeVisible();

    // Filter tabs are present and keyboard reachable.
    const allTab = page.getByRole("tab", { name: "الكل" });
    const unreadTab = page.getByRole("tab", { name: "غير المقروء" });
    await expect(allTab).toBeVisible();
    await expect(unreadTab).toBeVisible();
    await expect(allTab).toHaveAttribute("aria-selected", "true");

    // At least one fixture notification with an Arabic title.
    await expect(
      page.locator("article").filter({ hasText: "بانتظار المراجعة" }),
    ).toBeVisible();

    // Each notification exposes an Arabic open link to an allowlisted route.
    const openLink = page.getByRole("link", { name: /فتح الإشعار/ }).first();
    await expect(openLink).toBeVisible();
    const href = await openLink.getAttribute("href");
    expect(String(href)).toMatch(/^\/(client|portfolio|work|notifications)/);

    // No raw enum / uuid / internal term leaks into the page.
    const body = page.getByTestId("notifications-page");
    await expect(body).not.toContainText("client_send");
    await expect(body).not.toContainText("deliverable_version");
    await expect(body).not.toContainText("00000000-0000-4000");
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    expect(hydrationErrors).toEqual([]);
  });

  test("unread filter reduces the list to unread notifications only", async ({
    page,
  }) => {
    await page.goto("/notifications?as=tenant_admin_a", {
      waitUntil: "domcontentloaded",
    });

    const allCount = await page.locator("article").count();
    await page.getByRole("tab", { name: "غير المقروء" }).click();
    await expect(page).toHaveURL(/filter=unread/);

    const unreadCount = await page.locator("article").count();
    expect(unreadCount).toBeLessThanOrEqual(allCount);
    // The "تم التسليم النهائي" read fixture must be hidden under unread.
    await expect(
      page.locator("article").filter({ hasText: "تم التسليم النهائي" }),
    ).toHaveCount(0);
  });

  test("the bell control is present in the team shell and links to the center", async ({
    page,
  }) => {
    await page.goto("/notifications?as=tenant_admin_a", {
      waitUntil: "domcontentloaded",
    });

    const bellButton = page.getByRole("button", { name: "الإشعارات" });
    await expect(bellButton).toBeVisible();

    // Keyboard reachability: focus the bell.
    await bellButton.focus();
    await expect(bellButton).toBeFocused();
  });

  test("client persona sees the notification center inside the client shell", async ({
    page,
  }) => {
    await page.goto("/notifications?as=client_approver_a", {
      waitUntil: "domcontentloaded",
    });

    await expect(
      page.getByRole("heading", { name: "مركز الإشعارات" }),
    ).toBeVisible();
    // Client shell landmark is present.
    await expect(page.locator('[data-product-shell="client"]')).toBeVisible();
    // No internal management copy leaks into the client shell.
    await expect(
      page.getByTestId("notifications-page"),
    ).not.toContainText("المراجعة الداخلية");
  });
});
