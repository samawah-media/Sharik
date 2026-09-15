import { defineConfig, devices } from "@playwright/test";

const appHost = process.env.PLAYWRIGHT_PERSISTENT_APP_HOST ?? "127.0.0.1";
const appPort = process.env.PLAYWRIGHT_PERSISTENT_APP_PORT ?? "3410";
const readyPort = process.env.PLAYWRIGHT_PERSISTENT_READY_PORT ?? "3411";
const baseURL =
  process.env.PLAYWRIGHT_PERSISTENT_BASE_URL ??
  `http://${appHost}:${appPort}`;

export default defineConfig({
  testDir: "./tests/e2e-persistent",
  globalSetup: "./tests/e2e-persistent/global-setup.ts",
  globalTeardown: "./tests/e2e-persistent/global-teardown.ts",
  timeout: 600_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  expect: { timeout: 15_000 },
  webServer: {
    command: "node scripts/playwright-persistent-webserver.mjs",
    url: `http://${appHost}:${readyPort}/ready`,
    reuseExistingServer: false,
    timeout: 480_000,
  },
  projects: [
    {
      name: "persistent-desktop-chromium",
      testIgnore: /persistent-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "persistent-mobile-chromium",
      testMatch: /persistent-smoke\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "persistent-rtl-arabic",
      testMatch: /persistent-smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        locale: "ar-SA",
        timezoneId: "Asia/Riyadh",
      },
    },
  ],
});
