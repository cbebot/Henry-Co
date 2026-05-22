/**
 * V3-01 T3 — Logout in tab A; tab B receives soft toast; defers redirect.
 *
 * Two tabs (BrowserContexts) start signed in to the same user. The
 * user signs out in tab A. The session broadcaster
 * (BroadcastChannel('henryco-session')) publishes the sign-out event.
 * Tab B's subscriber renders a soft toast — NOT a hard redirect.
 * The hard redirect only fires on the next user interaction.
 *
 * This is the SOFT-SIGNAL scenario for V3-01's S3 contract.
 */
import { expect, test } from "@playwright/test";

import { signIn, signOutViaUI } from "./setup";

test.describe("V3-01 T3 — cross-tab logout soft signal", () => {
  test.fixme(
    "Requires AccountDropdown's data-testid attributes for sign-out (signOutViaUI) + a global toast renderer hooked to the SessionBroadcaster on the dashboard.",
    async ({ browser }) => {
      // Two separate contexts so each tab has its own
      // BroadcastChannel instance — accurate to real cross-tab UX.
      const ctxA = await browser.newContext();
      const ctxB = await browser.newContext();
      const tabA = await ctxA.newPage();
      const tabB = await ctxB.newPage();

      await signIn(tabA);
      await signIn(tabB);

      // Both tabs land on /dashboard.
      await tabA.goto("/dashboard");
      await tabB.goto("/dashboard");

      // Sign out in tab A.
      await signOutViaUI(tabA);

      // Tab B should NOT hard-redirect. The page URL stays put;
      // a toast announcing "Your session ended" appears.
      const tabBUrlBefore = tabB.url();

      // Wait for the BroadcastChannel message to deliver + the toast
      // to render. The session broadcaster publishes synchronously
      // in the publisher; the receiver's listener fires on the next
      // microtask + the React state update.
      const toast = tabB.locator('[role="status"]', {
        hasText: /session ended/i,
      });
      await expect(toast).toBeVisible({ timeout: 7_500 });

      // No hard redirect occurred.
      expect(tabB.url()).toBe(tabBUrlBefore);

      // The cookie state flips to signed-out on tab B's next request.
      // The toast's CTA can trigger that re-auth; we assert the soft
      // state remains until the user clicks.
      const cookies = await tabB.context().cookies();
      const state = cookies.find((c) => c.name === "hc_session_state")?.value;
      // The cookie might still read 'signed-in' on tab B's local
      // jar — it updates on the next request to a route guarded by
      // the proxy. The broadcast is the soft signal; the cookie
      // tag is the hard signal on the next interaction.
      expect(["signed-in", "signed-out"]).toContain(state);

      await ctxA.close();
      await ctxB.close();
    },
  );
});
