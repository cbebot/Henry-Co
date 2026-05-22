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

import { expireSession, signIn } from "./setup";

test.describe("V3-01 T1 — mid-form silent refresh", () => {
  test.fixme(
    "`expireSession(access)` helper requires SUPABASE_SERVICE_ROLE_KEY wiring — see setup.ts.",
    async ({ page }) => {
      await signIn(page);

      await page.goto("/support/new");
      const subject = page.locator('input[name="subject"]');
      const message = page.locator('textarea[name="message"]');

      await subject.fill("V3-01 T1 — silent refresh");
      await message.fill(
        "This message must survive an access-token expiry without redirecting the user.",
      );

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

      // henry_events row should exist for the refresh — assertable
      // via a SELECT from a service-role client (omitted here for
      // brevity; slice 6b adds the SQL probe).
    },
  );
});
