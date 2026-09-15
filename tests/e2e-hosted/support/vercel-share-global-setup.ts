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
  const cookieJarPath = process.env.S015_UAT_VERCEL_COOKIE_JAR;

  if (typeof baseURL !== "string" || (!shareUrlValue && !cookieJarPath)) {
    throw new Error("Hosted UAT Vercel share setup is incomplete.");
  }

  const baseUrl = new URL(baseURL);

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      if (cookieJarPath) {
        const cookies = parseNetscapeCookieJar(cookieJarPath, baseUrl.hostname);
        await context.addCookies(cookies);
      }

      const targetUrl = shareUrlValue
        ? validatedShareUrl(shareUrlValue, baseUrl)
        : baseUrl.toString();
      await page.goto(targetUrl, {
        waitUntil: "commit",
        timeout: 60_000,
      });
      await page.waitForURL(
        (url) => url.origin === baseUrl.origin,
        { timeout: 60_000 },
      );
      await page.waitForLoadState("domcontentloaded", { timeout: 60_000 });
    } catch {
      throw new Error(
        "Hosted UAT shareable-link navigation failed before protection bypass could be verified.",
      );
    }

    if (new URL(page.url()).hostname === "vercel.com") {
      throw new Error("Hosted UAT Vercel share URL did not bypass deployment protection.");
    }

    await context.storageState({ path: storageStatePath });
  } finally {
    await browser.close();
  }
}

function validatedShareUrl(value: string, baseUrl: URL) {
  const shareUrl = new URL(value);
  if (
    shareUrl.protocol !== "https:" ||
    shareUrl.origin !== baseUrl.origin ||
    !shareUrl.searchParams.has("_vercel_share")
  ) {
    throw new Error("Hosted UAT Vercel share URL does not match the approved target.");
  }
  return shareUrl.toString();
}

function parseNetscapeCookieJar(filePath: string, hostname: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error("Hosted UAT Vercel cookie jar is missing.");
  }

  const cookies = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/u)
    .filter(
      (line) => line && (!line.startsWith("#") || line.startsWith("#HttpOnly_")),
    )
    .map((line) => line.replace(/^#HttpOnly_/u, "").split("\t"))
    .filter((parts) => parts.length === 7)
    .map(([domain, , cookiePath, secure, expires, name, value]) => ({
      name,
      value,
      domain: domain.replace(/^\./u, ""),
      path: cookiePath,
      expires: Number(expires) || -1,
      httpOnly: true,
      secure: secure === "TRUE",
      sameSite: "Lax" as const,
    }))
    .filter(
      (cookie) =>
        hostname === cookie.domain || hostname.endsWith(`.${cookie.domain}`),
    );

  if (cookies.length === 0) {
    throw new Error("Hosted UAT Vercel cookie jar has no cookie for the approved target.");
  }
  return cookies;
}
