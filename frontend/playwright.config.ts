import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/website",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/website-results.json" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Do NOT start a web server — we verify manually if it's running first
});
