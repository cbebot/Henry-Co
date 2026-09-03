/**
 * V3-ACTIONS-01 — the two flagship property flows complete IN PLACE:
 * save-property and request-viewing ride fetch (no document navigation),
 * show pending state on the triggering control, acknowledge through the
 * V3-FEEDBACK-01 toast, and soft-refresh data.
 *
 * Requires repo-root `.env.local` (Supabase URL + anon + service-role) —
 * skipped when absent so CI without secrets stays green.
 */
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const envPath = resolve(repoRoot, ".env.local");
const hasEnv = existsSync(envPath);

const OWNER_EMAIL = "introvert7519@gmail.com";
const LISTING_SLUG = "harbour-crest-penthouse-ikoyi";

function parseEnvFile(filepath) {
  return Object.fromEntries(
    readFileSync(filepath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.trim().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        let value = line.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [line.slice(0, separator).trim(), value.replace(/\r/g, "")];
      })
  );
}

const env = hasEnv ? parseEnvFile(envPath) : {};
const authStorageKey = hasEnv
  ? `sb-${new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token`
  : "";

async function signInAsOwner(page) {
  const baseURL = test.info().project.use.baseURL;
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicAuth = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: OWNER_EMAIL,
    options: { redirectTo: `${baseURL}/auth/callback?next=/` },
  });
  if (error) throw error;

  const { data: verified, error: verifyError } = await publicAuth.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: data.properties.verification_type || "magiclink",
  });
  if (verifyError || !verified?.session) {
    throw verifyError || new Error("Owner session could not be established.");
  }

  const cookieValue = `base64-${Buffer.from(JSON.stringify(verified.session)).toString("base64url")}`;
  const CHUNK = 3180; // @supabase/ssr chunking threshold
  const cookies = [];
  if (cookieValue.length <= CHUNK) {
    cookies.push({ name: authStorageKey, value: cookieValue });
  } else {
    for (let i = 0; i * CHUNK < cookieValue.length; i += 1) {
      cookies.push({
        name: `${authStorageKey}.${i}`,
        value: cookieValue.slice(i * CHUNK, (i + 1) * CHUNK),
      });
    }
  }
  await page
    .context()
    .addCookies(cookies.map(({ name, value }) => ({ name, value, url: baseURL, sameSite: "Lax" })));
}

function formByIntent(page, intent) {
  return page.locator("form").filter({
    has: page.locator(`input[name="intent"][value="${intent}"]`),
  });
}

test.describe("V3-ACTIONS-01 — property actions complete in place", () => {
  test.skip(!hasEnv, "repo-root .env.local with Supabase credentials is required");
  test.describe.configure({ mode: "serial" });
  test.setTimeout(420_000);

  test("save-property fires fetch, keeps the document alive, and toasts", async ({ page }) => {
    await signInAsOwner(page);

    let documentLoads = 0;
    page.on("load", () => {
      documentLoads += 1;
    });

    await page.goto(`/property/${LISTING_SLUG}`, { waitUntil: "domcontentloaded" });
    const loadsAfterArrival = documentLoads;
    await page.evaluate(() => {
      window.__hcRealm = "alive";
    });

    const saveButton = formByIntent(page, "wishlist_toggle").getByRole("button");
    await expect(saveButton).toHaveCount(1);
    const wasSaved = (await saveButton.innerText()).includes("Remove from saved");

    await saveButton.click();
    await expect(saveButton).toBeDisabled(); // pending on the triggering control

    await expect(
      page.locator(".hc-fb-toast-title").filter({ hasText: /saved|removed/i }).first()
    ).toBeVisible({ timeout: 240_000 });

    // The JS realm survived — no document reload acknowledged this action.
    expect(await page.evaluate(() => window.__hcRealm)).toBe("alive");
    expect(documentLoads).toBe(loadsAfterArrival);

    // Label flipped in place.
    await expect(saveButton).toContainText(wasSaved ? "Save property" : "Remove from saved", {
      timeout: 60_000,
    });

    // Toggle back so the fixture account's saved list stays unchanged.
    await saveButton.click();
    await expect(
      page.locator(".hc-fb-toast-title").filter({ hasText: /saved|removed/i }).first()
    ).toBeVisible({ timeout: 240_000 });
  });

  test("request-viewing submits in place with the toast acknowledgment", async ({ page }) => {
    await signInAsOwner(page);

    await page.goto(`/property/${LISTING_SLUG}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.__hcRealm = "alive";
    });

    const viewingForm = formByIntent(page, "viewing_request");
    await viewingForm.scrollIntoViewIfNeeded();
    await viewingForm.getByLabel("Preferred time").fill("2026-08-08T11:00");
    await viewingForm
      .getByLabel("Notes")
      .fill("V3-ACTIONS-01 spec viewing — automated check, disregard.");

    await viewingForm.getByRole("button", { name: /Request viewing/i }).click();

    await expect(
      page.locator(".hc-fb-toast-title").filter({ hasText: /Viewing request submitted/i }).first()
    ).toBeVisible({ timeout: 240_000 });

    expect(await page.evaluate(() => window.__hcRealm)).toBe("alive");

    // Draft discarded after success — the typed fields reset.
    await expect(viewingForm.getByLabel("Notes")).toHaveValue("", { timeout: 60_000 });
  });
});
