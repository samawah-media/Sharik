import { defineConfig, devices } from "@playwright/test";

const appHost = process.env.PLAYWRIGHT_APP_HOST ?? "127.0.0.1";
const appPort = process.env.PLAYWRIGHT_APP_PORT ?? "3310";
const readyPort = process.env.PLAYWRIGHT_READY_PORT ?? "3210";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${appHost}:${appPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/playwright-webserver.mjs",
    url: `http://${appHost}:${readyPort}/ready`,
    reuseExistingServer: false,
    timeout: 480_000,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "rtl-arabic",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ar-SA",
        timezoneId: "Asia/Riyadh",
      },
    },
  ],
});
