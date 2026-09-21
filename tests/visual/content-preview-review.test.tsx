import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { cleanup, render } from "@testing-library/react";
import type { Browser, Locator } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ClientDeliverableDetail, type ClientSafeDeliverableDetail } from "@/ui/client/client-deliverable-detail";
import { ContentPreviewCard } from "@/ui/deliverables/content-preview-card";

// Router boundary only; exported markup is intentionally not hydrated.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const require = createRequire(import.meta.url);
const postcss: typeof import("postcss").default = require("postcss");
const tailwind: typeof import("@tailwindcss/postcss") = require("@tailwindcss/postcss");
const { chromium }: typeof import("playwright") = require("playwright");

const title = "عنوان النسخة للمراجعة يتضمن تفاصيل الحملة ورسالتها كاملة ".repeat(12).trim();
const caption = "هذا نص النسخة المعروضة للعميل، ويجب قراءة جميع تفاصيل المحتوى قبل اتخاذ قرار الاعتماد. ".repeat(20).trim();
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

async function textGeometry(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    let ancestorClipsText = false;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const bounds = parent.getBoundingClientRect();
      if (["hidden", "clip", "scroll", "auto"].includes(style.overflowY) &&
        (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) {
        ancestorClipsText = true;
      }
    }
    return {
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      lineHeight: parseFloat(getComputedStyle(element).lineHeight),
      ancestorClipsText,
    };
  });
}

describe("isolated rendered content review (not app hydration)", () => {
  // UI4: decision material must be readable without changing default card density.
  it.each([375, 1440])("at %ipx full text is unclipped while default title/caption remain at two/three lines", async (width) => {
    const { container } = render(
      <main style={{ width: "100%", maxWidth: 640, marginInline: "auto" }}>
        <section aria-label="Full review">
          <ContentPreviewCard title={title} caption={caption} fullText />
        </section>
        <section aria-label="Default preview">
          <ContentPreviewCard title={title} caption={caption} />
        </section>
      </main>,
    );
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    try {
      await page.route("**/*", (route) => route.abort());
      await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><style>${compiledCss}</style></head><body>${container.innerHTML}</body></html>`);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      for (const [text, lines] of [[title, 2], [caption, 3]] as const) {
        const full = await textGeometry(page.getByRole("region", { name: "Full review" }).getByText(text, { exact: true }));
        const defaultPreview = await textGeometry(page.getByRole("region", { name: "Default preview" }).getByText(text, { exact: true }));
        expect(full.clientHeight, "Long review text must exceed the old clamp").toBeGreaterThan(full.lineHeight * lines);
        expect(full.scrollHeight, "Full review text must not be vertically clipped").toBeLessThanOrEqual(full.clientHeight + 1);
        expect(full.scrollWidth).toBeLessThanOrEqual(full.clientWidth + 1);
        expect(full.ancestorClipsText, "A card ancestor must not hide full review text").toBe(false);
        expect(defaultPreview.clientHeight).toBeGreaterThan(0);
        expect(Math.abs(defaultPreview.clientHeight - defaultPreview.lineHeight * lines), "Default line limit must stay unchanged").toBeLessThanOrEqual(1);
        expect(defaultPreview.scrollHeight, "Default mode must still clamp long text").toBeGreaterThan(defaultPreview.clientHeight + 1);
      }

      const documentWidth = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client + 1);
    } finally {
      await page.close();
    }
  }, 60_000);

  it.each([
    ["approver", 375], ["approver", 1440],
    ["viewer", 375], ["viewer", 1440],
  ] as const)("isolated %s detail at %ipx preserves review geometry and role presentation (not hydration)", async (role, width) => {
    const detail: ClientSafeDeliverableDetail = {
      approvalItem: {
        clientId: "client_a",
        deliverableId: "deliverable_a",
        versionId: "version_exact",
        expectedRevision: 7,
        isActionable: true,
        displayName: title,
        typeLabel: "منشور",
        status: "waiting_client_approval",
        statusLabel: "بانتظار موافقتك",
        versionLabel: "نسخة المراجعة النهائية",
        dueDateLabel: "2026-07-03",
      },
      statusLabel: "بانتظار موافقتك",
      progressPercentage: 80,
      content: { caption, objective: "تعريف الخدمة", kpi: "زيارات الموقع" },
      files: [],
      comments: [{
        id: "comment_a",
        body: "ملاحظة ظاهرة للعميل",
        authorName: "العميل",
        createdAt: "2026-07-03",
      }],
    };
    const { container } = render(
      <main style={{ padding: 16 }}>
        <ClientDeliverableDetail
          canApprove={role === "approver"}
          detail={detail}
          approveAction={async () => undefined}
          requestChangesAction={async () => undefined}
        />
      </main>,
    );
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    try {
      await page.route("**/*", (route) => route.abort());
      await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><style>${compiledCss}</style></head><body>${container.innerHTML}</body></html>`);
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const preview = page.locator("[data-content-card]");
      const decision = page.getByRole("region", { name: "قرار اعتماد العميل" });
      const previewBounds = await preview.boundingBox();
      const decisionBounds = await decision.boundingBox();
      expect(previewBounds).not.toBeNull();
      expect(decisionBounds).not.toBeNull();
      if (!previewBounds || !decisionBounds) throw new Error("Review panels must be rendered");
      if (width === 375) {
        expect(previewBounds.y + previewBounds.height).toBeLessThanOrEqual(decisionBounds.y);
        expect(await preview.evaluate((element) => {
          const decisionElement = document.querySelector('[aria-label="قرار اعتماد العميل"]');
          return Boolean(decisionElement &&
            (element.compareDocumentPosition(decisionElement) & Node.DOCUMENT_POSITION_FOLLOWING));
        })).toBe(true);
      } else {
        expect(decisionBounds.x + decisionBounds.width).toBeLessThanOrEqual(previewBounds.x);
        expect(Math.abs(previewBounds.y - decisionBounds.y)).toBeLessThanOrEqual(1);
      }
      expect(await decision.getByText(detail.approvalItem.versionLabel, { exact: true }).isVisible()).toBe(true);
      for (const text of [title, caption]) {
        const geometry = await textGeometry(preview.getByText(text, { exact: true }));
        expect(geometry.clientHeight).toBeGreaterThan(0);
        expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
        expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
        expect(geometry.ancestorClipsText).toBe(false);
      }
      const approve = decision.getByRole("button", { name: "اعتماد النسخة", exact: true });
      const request = decision.getByRole("button", { name: "طلب تعديل", exact: true });
      if (role === "approver") {
        expect(await approve.isVisible()).toBe(true);
        expect(await request.isVisible()).toBe(true);
        expect(await decision.getByRole("textbox", { name: "سبب التعديل" }).isVisible()).toBe(true);
        for (const control of await page.locator("button, textarea").all()) {
          const bounds = await control.boundingBox();
          expect(bounds).not.toBeNull();
          expect(bounds!.height).toBeGreaterThanOrEqual(44);
          expect(bounds!.width).toBeGreaterThanOrEqual(44);
        }
      } else {
        expect(await approve.count()).toBe(0);
        expect(await request.count()).toBe(0);
        expect(await decision.getByRole("textbox").count()).toBe(0);
        expect(await page.getByRole("heading", { name: "للاطلاع", exact: true }).isVisible()).toBe(true);
        expect(await preview.getByText("قيد المراجعة", { exact: true }).isVisible()).toBe(true);
        expect(await decision.getByText("هذا الحساب للمشاهدة فقط ولا يملك صلاحية الاعتماد أو طلب التعديل.", { exact: true }).isVisible()).toBe(true);
        for (const copy of ["بانتظار قرارك", "قرارك مطلوب", "بانتظار موافقتك"]) {
          expect(await page.getByText(copy, { exact: true }).count()).toBe(0);
        }
      }
      const documentWidth = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client + 1);
      // Lead-run fallback geometry evidence only: no app hydration/action claim.
      await page.screenshot({
        path: resolve(`specs/015-persistent-mvp-pilot-completion/evidence/ui4-visual/isolated-detail-${role}-${width}.png`),
        fullPage: true,
      });
    } finally {
      await page.close();
    }
  }, 60_000);
});
