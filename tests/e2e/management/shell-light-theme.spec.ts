import { expect, test, type Locator } from "@playwright/test";

// UI1: catches white-on-light navigation/focus regressions when adopting the
// approved light rail. Real rendered styles, not Tailwind source-string checks.
async function contrast(locator: Locator, property: "color" | "outlineColor") {
  return locator.evaluate((element, property) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const ancestors: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement)
      ancestors.unshift(node);
    let background = [255, 255, 255];
    for (const node of ancestors) {
      const [r, g, b, a] = rgba(getComputedStyle(node).backgroundColor);
      background = [r, g, b].map(
        (value, index) => value * (a / 255) + background[index] * (1 - a / 255),
      );
    }
    const luminance = (rgb: number[]) =>
      rgb
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = rgba(getComputedStyle(element)[property]);
    const a = luminance(foreground.slice(0, 3));
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, property);
}

async function expectUnclippedOutline(locator: Locator) {
  await expect
    .poll(
      () =>
        locator.evaluate((element) => {
          const style = getComputedStyle(element);
          const outlineWidth = parseFloat(style.outlineWidth);
          const extent = Math.max(
            0,
            outlineWidth + parseFloat(style.outlineOffset),
          );
          const rect = element.getBoundingClientRect();
          let left = 0;
          let right = window.innerWidth;
          let top = 0;
          let bottom = window.innerHeight;
          for (
            let parent = element.parentElement;
            parent;
            parent = parent.parentElement
          ) {
            const parentStyle = getComputedStyle(parent);
            const box = parent.getBoundingClientRect();
            // Overflow clips at the scrollport, excluding borders/scrollbars.
            const clipLeft = box.left + parent.clientLeft;
            const clipTop = box.top + parent.clientTop;
            if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowX)) {
              left = Math.max(left, clipLeft);
              right = Math.min(right, clipLeft + parent.clientWidth);
            }
            if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowY)) {
              top = Math.max(top, clipTop);
              bottom = Math.min(bottom, clipTop + parent.clientHeight);
            }
          }
          return {
            visibleOutline:
              outlineWidth >= 2 &&
              style.outlineStyle !== "none" &&
              style.outlineStyle !== "hidden",
            unclipped:
              rect.left - extent >= left - 1 &&
              rect.right + extent <= right + 1 &&
              rect.top - extent >= top - 1 &&
              rect.bottom + extent <= bottom + 1,
          };
        }),
      {
        timeout: 2_000,
        message: "Keyboard outline must be visible and fit every clipping ancestor and viewport",
      },
    )
    .toEqual({ visibleOutline: true, unclipped: true });
}

for (const surface of [
  { kind: "management", url: "/work?as=assigned_internal_a" },
  { kind: "client", url: "/client/pending?as=client_approver_a" },
]) {
  for (const width of [375, 1440]) {
    test(`${surface.kind} light shell ${width}px preserves readable navigation`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(surface.url, { waitUntil: "domcontentloaded" });
      const shell = page.locator(`[data-product-shell="${surface.kind}"]`);
      await expect(shell).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const rail = shell.locator("aside");
      await expect(rail).toHaveCSS("background-color", "rgb(255, 255, 255)");
      // Fixture management intentionally omits sidebar nav; its role routes
      // remain covered by product-shell component tests, not invented here.
      const links = rail.getByRole("link");
      for (const link of await links.all()) {
        expect(await contrast(link, "color")).toBeGreaterThanOrEqual(4.5);
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      if (surface.kind === "client") {
        const active = rail.locator('a[aria-current="page"]');
        await expect(active).toHaveAttribute("href", "/client/pending");
        await active.hover();
        expect(await contrast(active, "color")).toBeGreaterThanOrEqual(4.5);
      }
      for (const link of await links.all()) {
        await page.keyboard.press("Tab");
        await expect(link).toBeFocused();
        expect(
          await link.evaluate((node) => node.matches(":focus-visible")),
        ).toBe(true);
        await expectUnclippedOutline(link);
        expect(await contrast(link, "outlineColor")).toBeGreaterThanOrEqual(3);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width + 1);
      await page.screenshot({
        path: testInfo.outputPath("light-shell.png"),
        fullPage: false,
      });
    });
  }
}
