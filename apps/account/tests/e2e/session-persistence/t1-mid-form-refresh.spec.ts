/**
 * V3-01 T1 — Token expires mid-form; transparent refresh; form survives.
 *
 * The user types into a long form. The access token expires mid-flight.
 * The next mutation triggers a silent refresh via the proxy. The form
 * state is unaffected; useFormDraft persistence is incidental insurance.
 *
 * This is the HAPPY PATH for V3-01's S1 + S2 contract.
 */
import { expect, test } from "@playwright/test";

import { expireSession, henryEventCount, signIn } from "./setup";

test.describe("V3-01 T1 — mid-form silent refresh", () => {
  test("refreshes silently and preserves the support draft", async ({ page }) => {
    await signIn(page);

    await page.goto("/support/new");
    const subject = page.locator('input[name="subject"]');
    const message = page.locator('textarea[name="message"]');

    await subject.fill("V3-01 T1 — silent refresh");
    await message.fill(
      "This message must survive an access-token expiry without redirecting the user.",
    );

    // Capture the window BEFORE we force the expiry so the
    // henry_events probe only counts rows produced by THIS test
    // (concurrent CI runs on the same fixture would otherwise leak).
    const since = new Date(Date.now() - 1_000).toISOString();

    // Force the access token to expire. The refresh token remains
    // valid — the proxy's verifySupabaseSession should detect the
    // expiry, refresh transparently, and the form must not redirect.
    await expireSession(page, "access");

    // Trigger any server request — page reload is the simplest. The
    // proxy's verifySupabaseSession runs in-flight and refreshes.
    await page.reload();

    // Form re-populates from the useFormDraft localStorage entry
    // (key: account-support-thread-new). Subject + non-message
    // fields restore; message body is owned by ChatComposer's own
    // draft (V3-01 explicit out-of-scope) — we assert subject only.
    await expect(subject).toHaveValue("V3-01 T1 — silent refresh");

    // The hc_session_state cookie should be signed-in (NOT
    // reauth-required) because the refresh succeeded silently.
    const cookies = await page.context().cookies();
    const state = cookies.find((c) => c.name === "hc_session_state")?.value;
    expect(state).toBe("signed-in");

    // Slice 5b assertion: the refresh emitted a `henry_events` row.
    // Without the migration applied or persistEvent wired this assert
    // would have been the gap that left the owner tile empty-state
    // forever (per the prompt for slice 5b ship). Tight: this catches
    // a regression in *either* the table or the dual-write.
    await expect
      .poll(() => henryEventCount("henry.auth.session.refreshed", since), {
        timeout: 7_500,
        message:
          "no `henry.auth.session.refreshed` row landed during the test window",
      })
      .toBeGreaterThanOrEqual(1);
  });
});
