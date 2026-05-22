import { type Page } from "@playwright/test";

/**
 * V3-01 session-persistence e2e — shared setup helpers.
 *
 * Required env (see `playwright.config.ts` for the full list):
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD — fixture user
 *   SUPABASE_SERVICE_ROLE_KEY          — required by `expireSession` for T1/T2
 *
 * These tests use Playwright's BrowserContext API for multi-tab T3.
 */

export type ExpireMode = "access" | "both";

export async function signIn(page: Page): Promise<void> {
  const email = requireEnv("E2E_USER_EMAIL");
  const password = requireEnv("E2E_USER_PASSWORD");
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // Wait for the post-auth redirect — /auth/resolve → final destination.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

export async function signOutViaUI(page: Page): Promise<void> {
  await page.goto("/dashboard");
  await page.locator('[data-testid="account-dropdown-trigger"]').click();
  await page.locator('[data-testid="account-dropdown-signout"]').click();
}

/**
 * Force the active Supabase session to expire.
 *
 * Implementation note (slice 6 — needs wiring before T1/T2 can run):
 *   The cleanest mechanism is to call GoTrue's admin endpoint to
 *   invalidate the user's refresh token via `admin.signOut(jwt,
 *   "global")`. For mode="access" we additionally truncate the access
 *   cookie's expiry by editing the browser cookie directly. For
 *   mode="both" we issue `signOut(jwt, "global")` so subsequent
 *   refresh attempts fail.
 *
 * Required env: SUPABASE_SERVICE_ROLE_KEY (server-side scoped — never
 * load this in client code).
 *
 * The helper is intentionally left as a thrown placeholder until the
 * owner wires the admin client. The test specs mark themselves
 * `test.fixme()` so they appear in the report but don't fail.
 */
export async function expireSession(
  page: Page,
  mode: ExpireMode,
): Promise<void> {
  void page;
  void mode;
  throw new Error(
    "expireSession not yet implemented — slice 6 places the helper at apps/account/tests/e2e/session-persistence/setup.ts. Owner: wire the GoTrue admin call here using SUPABASE_SERVICE_ROLE_KEY before unmarking T1/T2 fixmes.",
  );
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `V3-01 e2e env var missing: ${name}. See apps/account/playwright.config.ts for the full env contract.`,
    );
  }
  return v;
}

/**
 * Read the V3-01 `hc_session_state` cookie on the current page. Used
 * by the multi-tab test (T3) to assert the receiving tab's cookie
 * state flips to `signed-out`.
 */
export async function readSessionStateCookie(
  page: Page,
): Promise<string | undefined> {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === "hc_session_state")?.value;
}
