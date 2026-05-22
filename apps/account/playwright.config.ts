import { defineConfig, devices } from "@playwright/test";

/**
 * V3-01 e2e — session-persistence acceptance tests (Addendum A5).
 *
 * Test fixtures live under `tests/e2e/session-persistence/`:
 *   - T1 mid-form refresh (token expires, transparent refresh, form survives)
 *   - T2 reauth round-trip (refresh fails, user round-trips through /auth/reauth, draft restored)
 *   - T3 cross-tab logout (sign out in tab A; tab B receives soft toast, defers redirect)
 *
 * Required env (set in `apps/account/.env.test` or CI secrets):
 *   E2E_USER_EMAIL                 — fixture user already signed up
 *   E2E_USER_PASSWORD              — fixture user password
 *   NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  — anon key (login flow)
 *   SUPABASE_SERVICE_ROLE_KEY      — required for T1/T2 expireSession helper
 *   NEXT_PUBLIC_ACCOUNT_BASE_URL   — defaults to http://localhost:3003
 *
 * The session-persistence tests intentionally run with workers=1 +
 * fullyParallel=false because they mutate shared session state on
 * the fixture user. Running them concurrently would race.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ]
    : "list",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL:
      process.env.NEXT_PUBLIC_ACCOUNT_BASE_URL ?? "http://localhost:3003",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm run start -- -p 3003",
    url: process.env.NEXT_PUBLIC_ACCOUNT_BASE_URL ?? "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
