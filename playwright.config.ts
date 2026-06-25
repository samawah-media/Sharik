import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/playwright-webserver.mjs",
    url: "http://127.0.0.1:3210/ready",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
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
