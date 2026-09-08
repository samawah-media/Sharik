import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { cleanup, render } from "@testing-library/react";
import type { Browser, Locator } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ClientShell } from "@/ui/client/client-shell";
import { ProductShell } from "@/ui/layout/product-shell";

const require = createRequire(import.meta.url);
const postcss: typeof import("postcss").default = require("postcss");
const tailwind: typeof import("@tailwindcss/postcss") = require("@tailwindcss/postcss");
const { chromium }: typeof import("playwright") = require("playwright");
const { pathnameState } = vi.hoisted(() => ({ pathnameState: { value: "/clients" } }));

// Only Next's router boundary is mocked; the exported HTML is not hydrated.
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

let browser: Browser;
let compiledCss: string;

beforeAll(async () => {
  const cssPath = resolve("src/app/globals.css");
  const compiled = await postcss([tailwind({ base: process.cwd(), optimize: false })])
    .process(await readFile(cssPath, "utf8"), { from: cssPath });
  compiledCss = compiled.css;
  browser = await chromium.launch({ headless: true });
}, 60_000);

afterEach(cleanup);
afterAll(async () => { await browser?.close(); });

async function appearance(link: Locator) {
  return link.evaluate((element) => {
    const style = getComputedStyle(element);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const pixels = (colors: string[]) => {
      context.clearRect(0, 0, 1, 1);
      for (const color of colors) {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
      }
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    const backgrounds: string[] = [];
    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
      backgrounds.unshift(getComputedStyle(parent).backgroundColor);
    }
    const surface = pixels(["white", ...backgrounds]);
    const outside = pixels(["white", ...backgrounds.slice(0, -1)]);
    const luminance = (rgb: number[]) => rgb.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = (first: number[], second: number[]) => {
      const a = luminance(first);
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const rect = element.getBoundingClientRect();
    const nav = element.closest("nav")!;
    const navRect = nav.getBoundingClientRect();
    const outline = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    return {
      color: pixels([style.color]), surface,
      textContrast: contrast(pixels([style.color]), surface),
      focusContrast: contrast(pixels([style.outlineColor]), parseFloat(style.outlineOffset) < 0 ? surface : outside),
      focusVisible: element.matches(":focus-visible"),
      outlineWidth: parseFloat(style.outlineWidth),
      height: rect.height, width: rect.width,
      focusBounds: { top: rect.top, bottom: rect.bottom, navTop: navRect.top, navBottom: navRect.bottom, outline, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset },
      clippedVertically: getComputedStyle(nav).overflowY !== "visible" &&
        (rect.top - outline < navRect.top - 1 || rect.bottom + outline > navRect.bottom + 1),
    };
  });
}

describe("isolated rendered shell visual contract (not app hydration)", () => {
  it.each([
    ["management", 1440], ["management", 375],
    ["client", 1440], ["client", 375],
  ] as const)("%s at %ipx has a light rail and readable keyboard navigation", async (role, width) => {
    pathnameState.value = role === "client" ? "/client/pending" : "/clients";
    const Shell = role === "client" ? ClientShell : ProductShell;
    const { container } = render(<Shell><main>المحتوى</main></Shell>);
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    try {
      await page.route("**/*", (route) => route.abort());
      await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><style>${compiledCss}</style></head><body>${container.innerHTML}</body></html>`);
      const rail = page.locator("aside");
      if (width === 375) {
        const headerBottom = await page.locator("header").evaluate((element) => element.getBoundingClientRect().bottom);
        expect.soft(headerBottom, "Mobile shell chrome must leave room for short content").toBeLessThanOrEqual(200);
      }
      expect.soft(await rail.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");
      const links = rail.locator("nav a");
      expect(await links.count()).toBe(role === "client" ? 5 : 4);
      const current = rail.locator('nav a[aria-current="page"]');
      expect(await current.count()).toBe(1);
      expect(await current.getAttribute("href")).toBe(pathnameState.value);
      await page.keyboard.press("Tab"); // Brand link precedes navigation.
      // 2026-09-08: the compact mobile brand's outward outline crossed the viewport.
      const brand = rail.getByRole("link").first();
      expect(await brand.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
      const brandBounds = await brand.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const extent = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
        return { top: rect.top - extent, left: rect.left - extent,
          right: rect.right + extent, bottom: rect.bottom + extent,
          outlineWidth: parseFloat(style.outlineWidth) };
      });
      expect.soft(brandBounds.outlineWidth).toBeGreaterThanOrEqual(2);
      expect.soft(brandBounds.top, JSON.stringify(brandBounds)).toBeGreaterThanOrEqual(-1);
      expect.soft(brandBounds.left).toBeGreaterThanOrEqual(-1);
      expect.soft(brandBounds.right).toBeLessThanOrEqual(width + 1);
      expect.soft(brandBounds.bottom).toBeLessThanOrEqual(1001);
      for (const link of await links.all()) {
        await page.keyboard.press("Tab");
        await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
        const normal = await appearance(link);
        expect.soft(normal.focusVisible).toBe(true);
        expect.soft(normal.height).toBeGreaterThanOrEqual(44);
        expect.soft(normal.width).toBeGreaterThanOrEqual(44);
        expect.soft(normal.textContrast).toBeGreaterThanOrEqual(4.5);
        expect.soft(normal.focusContrast).toBeGreaterThanOrEqual(3);
        expect.soft(normal.outlineWidth).toBeGreaterThanOrEqual(2);
        expect.soft(normal.clippedVertically, JSON.stringify(normal.focusBounds)).toBe(false);
        const active = await link.getAttribute("aria-current") === "page";
        expect.soft(normal.color).toEqual(active ? [99, 64, 223] : [99, 95, 114]);
        if (active) expect.soft(normal.surface).toEqual([238, 233, 255]);
        await link.hover();
        expect.soft((await appearance(link)).textContrast).toBeGreaterThanOrEqual(4.5);
        await page.mouse.move(width - 1, 999);
      }
      if (process.env.UI1_CAPTURE_GREEN === "1") {
        await page.screenshot({
          path: resolve(`specs/015-persistent-mvp-pilot-completion/evidence/ui1-visual/${role}-${width}.png`),
          fullPage: true,
        });
      }
    } finally {
      await page.close();
    }
  }, 60_000);
});
