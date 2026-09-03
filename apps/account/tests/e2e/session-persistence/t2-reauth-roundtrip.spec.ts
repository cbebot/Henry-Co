/**
 * V3-01 T2 — Refresh token also expired; reauth round-trip; draft restored.
 *
 * The user types into a long form. Both the access AND refresh tokens
 * have expired. The next mutation triggers a 307 to /auth/reauth.
 * The user re-authenticates. They land back on the form. The draft
 * is restored from localStorage + sessionStorage mirror.
 *
 * This is the BAD-PATH-RECOVERY scenario for V3-01's S1 + S2 contract.
 */
import { expect, test } from "@playwright/test";

import { expireSession, henryEventCount, signIn } from "./setup";

test.describe("V3-01 T2 — reauth round-trip restores draft", () => {
  test("routes through reauth and restores the support draft", async ({ page }) => {
    await signIn(page);

    await page.goto("/support/new");
    const subject = page.locator('input[name="subject"]');
    const message = page.locator('textarea[name="message"]');

    await subject.fill("V3-01 T2 — reauth round-trip");
    await message.fill(
      "This draft must survive a full reauth round-trip without data loss.",
    );

    // Capture the window BEFORE we force the expiry so probes only
    // count rows produced by THIS test.
    const since = new Date(Date.now() - 1_000).toISOString();

    // Force BOTH the access and refresh tokens to expire so the
    // refresh path also fails. proxy → verifySupabaseSession
    // returns status="reauth" → reauthRedirectFor → 307 to
    // /auth/reauth?return=/support/new&intent=form&drafts=...
    await expireSession(page, "both");

    // Trigger any server request.
    await page.reload();

    // We should land on /auth/reauth with the V3-01 query params.
    await page.waitForURL(/\/auth\/reauth/, { timeout: 15_000 });
    const url = new URL(page.url());
    expect(url.searchParams.get("return")).toContain("/support/new");
    expect(["form", "page"]).toContain(url.searchParams.get("intent"));

    // hc_session_state cookie should be reauth-required.
    const cookies = await page.context().cookies();
    const state = cookies.find((c) => c.name === "hc_session_state")?.value;
    expect(state).toBe("reauth-required");

    // Server-side: the failed refresh must have written a
    // `refresh_failed` row before redirecting. This is the source
    // event that powers the A4 rollback gate (refresh_failed /
    // (refreshed + refresh_failed)). Assert eagerly so a regression
    // in persistEvent or the migration surfaces here, not in prod.
    await expect
      .poll(() => henryEventCount("henry.auth.session.refresh_failed", since), {
        timeout: 7_500,
        message:
          "no `henry.auth.session.refresh_failed` row landed before reauth redirect",
      })
      .toBeGreaterThanOrEqual(1);

    // Re-authenticate via the password block on the ReauthScreen.
    const password = page.locator('input[type="password"]');
    await password.fill(process.env.E2E_USER_PASSWORD!);
    await page.locator('button[type="submit"]').click();

    // ReauthClient.handleSuccess() emits the reauth_succeeded
    // event + router.replace(returnPath). We should land back at
    // the support form.
    await page.waitForURL(/\/support\/new/, { timeout: 15_000 });

    // useFormDraft restores the persisted envelope on mount.
    await expect(subject).toHaveValue("V3-01 T2 — reauth round-trip");

    // Client-side: ReauthClient's handleSuccess writes the
    // `reauth_succeeded` row through the browser supabase client.
    // This row powers the "Reauths today" metric on the owner tile —
    // without it the metric stays 0 even after successful reauths.
    await expect
      .poll(() => henryEventCount("henry.auth.session.reauth_succeeded", since), {
        timeout: 7_500,
        message:
          "no `henry.auth.session.reauth_succeeded` row landed after successful reauth",
      })
      .toBeGreaterThanOrEqual(1);
  });
});
