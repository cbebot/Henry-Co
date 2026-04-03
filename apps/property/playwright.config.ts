import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3214);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm --filter @henryco/property build && pnpm --filter @henryco/property start --port ${port}`,
    cwd: "../..",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
