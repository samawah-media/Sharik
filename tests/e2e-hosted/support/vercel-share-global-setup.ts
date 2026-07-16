import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const storageStatePath = path.resolve(
  process.cwd(),
  "test-results/s015-vercel-share-state.json",
);

export default async function vercelShareGlobalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  const shareUrlValue = process.env.S015_UAT_VERCEL_SHARE_URL;

  if (typeof baseURL !== "string" || !shareUrlValue) {
    throw new Error("Hosted UAT Vercel share setup is incomplete.");
  }

  const baseUrl = new URL(baseURL);
  const shareUrl = new URL(shareUrlValue);
  if (
    shareUrl.protocol !== "https:" ||
    shareUrl.origin !== baseUrl.origin ||
    !shareUrl.searchParams.has("_vercel_share")
  ) {
    throw new Error("Hosted UAT Vercel share URL does not match the approved target.");
  }

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(shareUrl.toString(), { waitUntil: "domcontentloaded" });

    if (new URL(page.url()).hostname === "vercel.com") {
      throw new Error("Hosted UAT Vercel share URL did not bypass deployment protection.");
    }

    await context.storageState({ path: storageStatePath });
  } finally {
    await browser.close();
  }
}
