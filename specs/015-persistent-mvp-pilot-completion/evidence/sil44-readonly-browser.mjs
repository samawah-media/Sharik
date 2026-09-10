// Lead-inspected, opt-in runner; never starts a server or changes business data.
// node specs/015-persistent-mvp-pilot-completion/evidence/sil44-readonly-browser.mjs --base http://127.0.0.1:3377
import { chromium, expect } from "@playwright/test";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = "http://127.0.0.1:3377";
const geometryOnly = process.argv[4] === "--geometry-only";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const output = path.join(root, "test-results", "sil44-readonly-browser", geometryOnly ? "geometry-only" : "full");
const routes = [
  "/client",
  "/client/work",
  "/client/pending",
  "/client/files",
  "/client/commercial",
];
const workspaces = [
  { alias: "Jidei", pattern: /jidei|جديع|جدي/iu },
  { alias: "Madar", pattern: /madar|مدار/iu },
];
const report = {
  scope: "SIL44 readonly UI; login and authorized workspace selection only",
  status: "not-run",
  mode: geometryOnly ? "geometry-only-no-switch-or-route-acceptance" : "full",
  stage: "preflight",
  productionAndHostedUat:
    "Lead must verify server mode and backing UAT before running; UI cannot prove these.",
  profiles: [],
  errors: {
    console: 0,
    page: 0,
    http: 0,
    network: 0,
    blockedRequest: 0,
    download: 0,
  },
};
let browser;
let deadline;
let credentials;

class QaFailure extends Error {}

function requireCheck(condition, code) {
  if (!condition) throw new QaFailure(code);
}

async function readCredentials() {
  const selected = {};
  const input = createReadStream(path.join(root, ".env.s015-team-uat.local"), {
    encoding: "utf8",
  });
  const lines = createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      const match = line.match(
        /^\s*(?:export\s+)?(S015_CLIENT_APPROVER_EMAIL|S015_CLIENT_APPROVER_PASSWORD)\s*=\s*(.*)$/u,
      );
      if (!match) continue;
      requireCheck(!(match[1] in selected), "duplicate-credential-key");
      let value = match[2].trim();
      if (value.startsWith('"') || value.startsWith("'")) {
        const quote = value[0];
        const end = value.lastIndexOf(quote);
        requireCheck(
          end > 0 && /^\s*(?:#.*)?$/u.test(value.slice(end + 1)),
          "invalid-credential-format",
        );
        value = value.slice(1, end);
      } else {
        value = value.replace(/\s+#.*$/u, "").trim();
      }
      requireCheck(value.length > 0, "empty-credential");
      selected[match[1]] = value;
    }
  } finally {
    lines.close();
    input.destroy();
  }
  requireCheck(
    selected.S015_CLIENT_APPROVER_EMAIL &&
      selected.S015_CLIENT_APPROVER_PASSWORD,
    "missing-credentials",
  );
  return {
    email: selected.S015_CLIENT_APPROVER_EMAIL,
    password: selected.S015_CLIENT_APPROVER_PASSWORD,
  };
}

function assertNoErrors() {
  requireCheck(
    Object.values(report.errors).every((count) => count === 0),
    "browser-error-detected",
  );
}

async function guardRequests(context, permission) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const local = url.origin === BASE;
    const read = method === "GET" || method === "HEAD";
    const knownPage =
      routes.includes(url.pathname) ||
      url.pathname === "/sign-in" ||
      url.pathname === "/";
    const staticAsset =
      url.pathname.startsWith("/_next/") ||
      /^\/(?:favicon\.ico|icon\.svg|apple-icon\.png)$/u.test(url.pathname);
    const fixtureFlag = ["as", "persona", "fixture", "bypassguard"].some(
      (key) => url.searchParams.has(key),
    );
    const authHost =
      url.protocol === "https:" &&
      url.hostname === "jnvuccapgsabrwwkxnbh.supabase.co";
    const token =
      authHost &&
      url.pathname === "/auth/v1/token" &&
      method === "POST" &&
      (url.searchParams.get("grant_type") === "refresh_token" ||
        (permission.login &&
          url.searchParams.get("grant_type") === "password"));
    const authRead = authHost && read && url.pathname === "/auth/v1/user";
    const authPreflight =
      authHost &&
      method === "OPTIONS" &&
      ((url.pathname === "/auth/v1/token" &&
        (permission.login ||
          url.searchParams.get("grant_type") === "refresh_token") &&
        request.headers()["access-control-request-method"] === "POST") ||
        (url.pathname === "/auth/v1/user" &&
          request.headers()["access-control-request-method"] === "GET"));
    const selection =
      local &&
      method === "POST" &&
      routes.includes(url.pathname) &&
      permission.selection &&
      Boolean(request.headers()["next-action"]);
    if (
      !fixtureFlag &&
      ((local && read && (knownPage || staticAsset)) ||
        token ||
        authRead ||
        authPreflight ||
        selection)
    ) {
      // One native form submission permits one server-action request, not arbitrary mutations.
      if (selection) permission.selection = false;
      await route.continue();
    } else {
      report.errors.blockedRequest += 1;
      await route.abort("blockedbyclient");
    }
  });
}

function selector(page) {
  return page.getByRole("combobox", { name: "اختر المساحة", exact: true });
}

async function revealNavigation(page, profile) {
  const navigation = page.getByRole("navigation", {
    name: "تنقل بوابة العميل",
    exact: true,
  });
  if (await navigation.isVisible()) {
    profile.mobileMenu =
      profile.width === 375
        ? "inline-navigation-no-menu-required"
        : "desktop-sidebar";
    return navigation;
  }
  // Current ClientShell has inline navigation. If the served shell has a menu,
  // observe its actual relationship rather than guessing an Arabic button name.
  const controls = await page
    .locator("button[aria-controls][aria-expanded='false']")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => {
          const panel = document.getElementById(
            button.getAttribute("aria-controls"),
          );
          return (
            panel?.matches('nav[aria-label="تنقل بوابة العميل"]') ||
            Boolean(panel?.querySelector('nav[aria-label="تنقل بوابة العميل"]'))
          );
        })
        .map((button) => button.getAttribute("aria-controls")),
    );
  requireCheck(controls.length === 1, "mobile-menu-control-not-observed");
  const buttons = page.locator("button[aria-controls][aria-expanded='false']");
  let target;
  for (const button of await buttons.all()) {
    if ((await button.getAttribute("aria-controls")) === controls[0])
      target = button;
  }
  requireCheck(target, "mobile-menu-control-missing");
  await target.click();
  await expect(navigation).toBeVisible();
  profile.mobileMenu = "opened-observed-aria-controls";
  return navigation;
}

async function assertWorkspace(page, profile, id) {
  await revealNavigation(page, profile);
  await expect(selector(page)).toBeVisible();
  await expect(selector(page)).toHaveValue(id);
  await expect(selector(page)).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "فتح المساحة", exact: true }),
  ).toBeEnabled();
  await expect(page.locator('[role="alert"]:visible')).toHaveCount(0);
  assertNoErrors();
}

async function switchWorkspace(page, profile, id, permission) {
  await revealNavigation(page, profile);
  const before = page.url();
  const origin = await page.evaluate(() => performance.timeOrigin);
  await selector(page).selectOption(id);
  requireCheck(page.url() === before, "selection-navigated-before-submit");
  permission.selection = true;
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.getByRole("button", { name: "فتح المساحة", exact: true }).click(),
    ]);
  } finally {
    permission.selection = false;
  }
  await expect(page).toHaveURL(`${BASE}/client`);
  await assertWorkspace(page, profile, id);
  requireCheck(
    (await page.evaluate(() => performance.timeOrigin)) !== origin,
    "switch-was-not-full-navigation",
  );
}

async function captureGeometry(page, profile, alias, suffix) {
  report.stage = `${profile.name}:geometry:${alias}:${suffix}`;
  await revealNavigation(page, profile);
  const sidebar = page.locator('[data-product-shell="client"] aside');
  const form = sidebar.locator("form").filter({ has: selector(page) });
  const button = page.getByRole("button", { name: "فتح المساحة", exact: true });
  await expect(sidebar).toBeVisible();
  const boxes = {};
  for (const [name, locator] of Object.entries({
    sidebar,
    selector: selector(page),
    submit: button,
  })) {
    const box = await locator.boundingBox();
    requireCheck(box && box.width > 0 && box.height > 0, "missing-geometry");
    requireCheck(
      box.x >= -1 && box.x + box.width <= profile.width + 1,
      "horizontal-overflow",
    );
    if (name !== "sidebar")
      requireCheck(box.height >= 43.5, "touch-target-under-44px");
    boxes[name] = Object.fromEntries(
      Object.entries(box).map(([key, number]) => [
        key,
        Math.round(number * 100) / 100,
      ]),
    );
  }
  requireCheck(
    boxes.submit.y >= boxes.selector.y + boxes.selector.height - 1,
    "selector-button-overlap",
  );
  const documentGeometry = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    direction: getComputedStyle(
      document.querySelector('[data-product-shell="client"]'),
    ).direction,
  }));
  requireCheck(
    documentGeometry.scrollWidth <= documentGeometry.width + 1,
    "document-horizontal-overflow",
  );
  requireCheck(documentGeometry.direction === "rtl", "rtl-missing");
  // Crop to reviewed shell markup: no login page, work cards, approval data, or body dump.
  // Other workspace options stay collapsed and are never serialized to the report.
  const stem = `${profile.name}-${alias.toLowerCase()}-${suffix}`;
  await sidebar.screenshot({
    path: path.join(output, `${stem}-sidebar.png`),
    animations: "disabled",
  });
  await form.screenshot({
    path: path.join(output, `${stem}-selector.png`),
    animations: "disabled",
  });
  profile.geometry.push({
    workspace: alias,
    suffix,
    boxes,
    document: documentGeometry,
    screenshots: [`${stem}-sidebar.png`, `${stem}-selector.png`],
  });
}

async function verifyRoutes(page, profile, workspace) {
  for (const routePath of routes) {
    report.stage = `${profile.name}:route:${workspace.alias}:${routePath}`;
    const navigation = await revealNavigation(page, profile);
    report.stage += ":click";
    await navigation.locator(`a[href="${routePath}"]`).click();
    report.stage += ":url";
    await expect(page).toHaveURL(`${BASE}${routePath}`);
    report.stage += ":selection";
    await assertWorkspace(page, profile, workspace.id);
    report.stage += ":reload";
    await page.reload({ waitUntil: "domcontentloaded" });
    report.stage += ":reloaded";
    await expect(page).toHaveURL(`${BASE}${routePath}`);
    await assertWorkspace(page, profile, workspace.id);
    profile.routeChecks.push({
      workspace: workspace.alias,
      route: routePath,
      retainedAfterNavigationAndReload: true,
    });
  }
}

async function runProfile(viewport) {
  const profile = {
    name: viewport.width === 375 ? "mobile375" : "desktop1440",
    width: viewport.width,
    height: viewport.height,
    status: "running",
    mobileMenu: "not-observed",
    geometry: [],
    routeChecks: [],
    switches: [],
  };
  report.profiles.push(profile);
  const context = await browser.newContext({
    viewport,
    locale: "ar-SA",
    acceptDownloads: false,
    serviceWorkers: "block",
  });
  const permission = { login: false, selection: false };
  try {
    context.setDefaultTimeout(20_000);
    context.setDefaultNavigationTimeout(45_000);
    await guardRequests(context, permission);
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.console += 1;
    });
    page.on("pageerror", () => {
      report.errors.page += 1;
    });
    page.on("response", (response) => {
      if (response.status() >= 400) report.errors.http += 1;
    });
    page.on("requestfailed", (request) => {
      // Next may cancel read-only prefetches during a full navigation.
      if (request.failure()?.errorText !== "net::ERR_ABORTED")
        report.errors.network += 1;
    });
    page.on("download", (download) => {
      report.errors.download += 1;
      void download.cancel().catch(() => {});
    });
    report.stage = `${profile.name}:login`;
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await page
      .getByLabel("البريد الإلكتروني", { exact: true })
      .fill(credentials.email);
    await page
      .getByLabel("كلمة المرور", { exact: true })
      .fill(credentials.password);
    permission.login = true;
    await page
      .getByRole("button", { name: "تسجيل الدخول", exact: true })
      .click();
    await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/u, { timeout: 45_000 });
    permission.login = false;
    await page.goto(`${BASE}/client`, { waitUntil: "domcontentloaded" });
    await revealNavigation(page, profile);
    await expect(selector(page)).toBeVisible();
    const options = await selector(page)
      .locator("option")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({ id: node.value, name: node.textContent ?? "" })),
      );
    const targets = workspaces.map(({ alias, pattern }) => {
      const matches = options.filter((option) => pattern.test(option.name));
      requireCheck(matches.length === 1, "workspace-name-missing-or-ambiguous");
      return { alias, id: matches[0].id };
    });
    requireCheck(
      targets[0].id !== targets[1].id,
      "workspace-targets-not-distinct",
    );
    if (geometryOnly) {
      const selectedId = await selector(page).inputValue();
      const selected = targets.find((target) => target.id === selectedId);
      requireCheck(selected, "initial-workspace-not-found");
      await captureGeometry(page, profile, selected.alias, "initial");
      assertNoErrors();
      profile.status = "passed-geometry-only";
      return;
    }
    for (const workspace of targets) {
      report.stage = `${profile.name}:switch:${workspace.alias}`;
      await switchWorkspace(page, profile, workspace.id, permission);
      profile.switches.push({ to: workspace.alias, fullNavigationHome: true });
      await captureGeometry(page, profile, workspace.alias, "selected");
      await verifyRoutes(page, profile, workspace);
    }
    await switchWorkspace(page, profile, targets[0].id, permission);
    profile.switches.push({ to: "Jidei", fullNavigationHome: true });
    await captureGeometry(page, profile, "Jidei", "return");
    assertNoErrors();
    profile.status = "passed";
  } finally {
    await context.close();
  }
}

async function main() {
  requireCheck(
    (process.argv.length === 4 || (process.argv.length === 5 && geometryOnly)) &&
      process.argv[2] === "--base" &&
      process.argv[3] === BASE,
    "explicit-loopback-base-required",
  );
  await mkdir(output, { recursive: true });
  try {
    report.stage = "credentials";
    credentials = await readCredentials();
    report.stage = "browser-launch";
    browser = await chromium.launch({ channel: "chrome", headless: true });
    deadline = setTimeout(() => {
      report.stage = "bounded-run-timeout";
      void browser.close().catch(() => {});
    }, 7 * 60_000);
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 375, height: 812 },
    ]) {
      await runProfile(viewport);
    }
    assertNoErrors();
    report.status = "passed";
    report.stage = "complete";
  } catch (error) {
    // Never serialize Playwright exceptions: they can contain input values and page text.
    report.status = "failed";
    report.failure =
      error instanceof QaFailure
        ? error.message
        : "browser-or-assertion-failure";
    // Fixed diagnostic categories only; never serialize exception text or page data.
    if (!(error instanceof QaFailure)) {
      report.failureCategory = /strict mode violation/u.test(error.message ?? "")
        ? "ambiguous-locator"
        : /Timeout|timed out/u.test(error.message ?? "")
          ? "timeout"
          : /toBeEnabled/u.test(error.message ?? "")
            ? "control-disabled"
            : /toHaveURL/u.test(error.message ?? "")
              ? "unexpected-url"
              : "other-assertion";
    }
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
    if (credentials) {
      credentials.email = "";
      credentials.password = "";
    }
    try {
      await browser?.close();
    } catch {
      report.status = "failed";
      process.exitCode = 1;
    }
    await writeFile(
      path.join(output, "results.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    console.log(
      JSON.stringify({
        status: report.status,
        stage: report.stage,
        results: `test-results/sil44-readonly-browser/${geometryOnly ? "geometry-only" : "full"}/results.json`,
      }),
    );
  }
}

main().catch(() => {
  // Includes invalid invocation / filesystem errors, without raw paths or exception text.
  console.error(
    "SIL44 runner refused or could not complete; use explicit approved loopback base.",
  );
  process.exitCode = 1;
});
