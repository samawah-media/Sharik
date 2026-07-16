import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const secureEnvPath = path.resolve(
  process.cwd(),
  process.env.S015_UAT_SECURE_ENV_FILE ?? ".env.s015-team-uat.local",
);

const parseSecureEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("Hosted UAT secure env file is required.");
  }

  const entries = fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator < 1) return undefined;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  return Object.fromEntries(entries);
};

const secureEnv = parseSecureEnvFile(secureEnvPath);

for (const [key, value] of Object.entries(secureEnv)) {
  process.env[key] ??= value;
}

const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Hosted UAT requires ${key} in the secure env file.`);
  }
  return value;
};

const baseURL = required("S015_UAT_BASE_URL");
const allowedHostname = required("S015_UAT_ALLOWED_HOSTNAME").toLowerCase();
const targetCategory = required("S015_UAT_TARGET_CATEGORY").toLowerCase();
const acceptedCategories = new Set(["preview", "uat", "preview-uat"]);
const vercelShareUrl = process.env.S015_UAT_VERCEL_SHARE_URL;
const vercelStorageStatePath = path.resolve(
  process.cwd(),
  "test-results/s015-vercel-share-state.json",
);

if (!acceptedCategories.has(targetCategory)) {
  throw new Error("Hosted UAT target category must be preview, uat, or preview-uat.");
}

if (!/^[a-z0-9.-]+$/.test(allowedHostname) || allowedHostname.includes("..")) {
  throw new Error("Hosted UAT allowed hostname is malformed.");
}

let targetUrl: URL;
try {
  targetUrl = new URL(baseURL);
} catch {
  throw new Error("Hosted UAT base URL is malformed.");
}

if (targetUrl.protocol !== "https:") {
  throw new Error("Hosted UAT requires an HTTPS target.");
}

const hostname = targetUrl.hostname.toLowerCase();
const forbiddenLocalHostnames = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);
const productionHostnames = new Set(
  (process.env.S015_PRODUCTION_HOSTNAMES ?? "sharik-platform.vercel.app")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

if (hostname !== allowedHostname) {
  throw new Error("Hosted UAT target hostname does not match the explicit allowlist.");
}

if (
  forbiddenLocalHostnames.has(hostname) ||
  hostname.endsWith(".local") ||
  targetUrl.port ||
  productionHostnames.has(hostname) ||
  targetCategory === "production"
) {
  throw new Error("Hosted UAT refuses local or Production targets.");
}

if (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Hosted UAT must not run with a service-role key in process env.");
}

export default defineConfig({
  testDir: "./tests/e2e-hosted",
  globalSetup: vercelShareUrl
    ? "./tests/e2e-hosted/support/vercel-share-global-setup.ts"
    : undefined,
  globalTeardown: vercelShareUrl
    ? "./tests/e2e-hosted/support/vercel-share-global-teardown.ts"
    : undefined,
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    storageState: vercelShareUrl ? vercelStorageStatePath : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "hosted-desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "hosted-mobile-chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "hosted-rtl-arabic",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ar-SA",
        timezoneId: "Asia/Riyadh",
      },
    },
  ],
});
