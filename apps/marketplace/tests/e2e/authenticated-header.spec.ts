import { expect, test } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MARKETPLACE_TEST_BASE_URL =
  process.env.MARKETPLACE_E2E_BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3016";

async function supabaseAdminFetch(pathname: string, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase admin environment variables for authenticated marketplace test.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("apikey", SUPABASE_SERVICE_ROLE_KEY);
  headers.set("authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...options,
    headers,
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body?.msg || body?.message || `${pathname} returned ${response.status}`);
  }

  return body;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCookieChunks(name: string, value: string, chunkSize = 3180) {
  if (value.length <= chunkSize) {
    return [{ name, value }];
  }

  const chunks: Array<{ name: string; value: string }> = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push({
      name: `${name}.${chunks.length}`,
      value: value.slice(index, index + chunkSize),
    });
  }
  return chunks;
}

async function buildSharedSessionCookie() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables for authenticated marketplace test.");
  }

  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const users = await supabaseAdminFetch("/auth/v1/admin/users?page=1&per_page=100", {
    method: "GET",
  });
  const email = (users?.users || [])
    .map((user: { email?: string | null }) => String(user.email || "").trim())
    .find(Boolean);

  if (!email) {
    throw new Error("Could not find an auth user with an email address for the authenticated marketplace test.");
  }

  const generated = await supabaseAdminFetch("/auth/v1/admin/generate_link", {
    method: "POST",
    body: JSON.stringify({
      type: "magiclink",
      email,
    }),
  });

  const verifyResponse = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email,
      token: generated.email_otp,
    }),
  });

  const verified = await verifyResponse.json();
  if (!verifyResponse.ok || !verified?.access_token || !verified?.refresh_token) {
    throw new Error(`Could not mint an authenticated marketplace session for ${email}.`);
  }

  const session = {
    access_token: verified.access_token,
    refresh_token: verified.refresh_token,
    expires_in: verified.expires_in,
    expires_at: verified.expires_at,
    token_type: verified.token_type,
    user: verified.user,
  };

  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = `base64-${toBase64Url(JSON.stringify(session))}`;
  const cookieTarget = new URL(MARKETPLACE_TEST_BASE_URL);
  const cookies = createCookieChunks(cookieName, cookieValue).map((chunk) => ({
    ...chunk,
    url: cookieTarget.origin,
    httpOnly: false,
    secure: cookieTarget.protocol === "https:",
    sameSite: "Lax" as const,
  }));

  return {
    email,
    cookies,
  };
}

test("signed-in header exposes account menu shortcuts", async ({ context, page }) => {
  const { cookies, email } = await buildSharedSessionCookie();
  await context.addCookies(cookies);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('header[data-marketplace-interactive="true"]')).toBeVisible();

  const accountMenuButton = page.getByRole("button", { name: /account menu for/i });
  await expect(accountMenuButton).toBeVisible({ timeout: 30000 });
  await accountMenuButton.click();

  await expect(page.getByRole("menu", { name: /account menu/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Profile & account/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Saved items/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Orders/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /^Settings$/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Sign out/i })).toBeVisible();
});
