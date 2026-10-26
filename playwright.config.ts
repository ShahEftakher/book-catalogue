import { defineConfig, devices } from "@playwright/test";

// Runs against the local dev server with AUTH_DEV_LOGIN=true and the Docker DB.
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Phone viewports/touch, run in Chromium so only one browser needs installing
    { name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
