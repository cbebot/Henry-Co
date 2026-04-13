import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const appDir = __dirname;
const workspaceRoot = resolve(appDir, "../..");

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(resolve(workspaceRoot, ".env.local"));
loadEnvFile(resolve(workspaceRoot, ".env.production.vercel"));

const port = Number(process.env.ACCOUNT_E2E_PORT || 3013);
const baseURL = process.env.ACCOUNT_E2E_BASE_URL || `http://127.0.0.1:${port}`;
const useWebServer = !process.env.ACCOUNT_E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: useWebServer
    ? {
        command: `pnpm build && pnpm exec next start -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 240000,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
