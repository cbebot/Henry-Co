import { type Page } from "@playwright/test";
import {
  buildSupabaseCookieOptions,
  getSharedCookieDomain,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";

/**
 * V3-01 session-persistence e2e — shared setup helpers.
 *
 * Required env (see `playwright.config.ts` for the full list):
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD — fixture user
 *   NEXT_PUBLIC_SUPABASE_URL           — derives the Supabase project ref
 *                                        used to scope cookies + the
 *                                        admin client for `henryEventCount`
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY      — anon key for the sign-in flow
 *   SUPABASE_SERVICE_ROLE_KEY          — required by `expireSession`
 *                                        (T1/T2) AND `henryEventCount`
 *                                        (post-action telemetry probes).
 *
 * These tests use Playwright's BrowserContext API for multi-tab T3.
 */

export type ExpireMode = "access" | "both";

type BrowserContext = ReturnType<Page["context"]>;
type BrowserCookie = Awaited<ReturnType<BrowserContext["cookies"]>>[number];
type BrowserCookieToSet = Parameters<BrowserContext["addCookies"]>[0][number];
type SupabaseCookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};
type ParsedSessionCookie = {
  baseName: string;
  cookies: BrowserCookie[];
  rootCookie: BrowserCookie;
  session: Record<string, unknown> | unknown[];
  encoding: "base64" | "plain";
  accessToken: string;
};

const AUTH_COOKIE_CHUNK_RE = /^(.*-auth-token)(?:\.(\d+))?$/i;
// Matches the historical @supabase/ssr default. Larger writes are
// chunked across `sb-<ref>-auth-token.0`, `.1`, … and concatenated on
// read. Keep this in sync with @supabase/ssr if a major bump changes
// the default — running T1/T2 against staging is the catch.
const SUPABASE_COOKIE_CHUNK_SIZE = 3180;

export async function signIn(page: Page): Promise<void> {
  const email = requireEnv("E2E_USER_EMAIL");
  const password = requireEnv("E2E_USER_PASSWORD");
  const { createBrowserClient } = await import("@supabase/ssr");
  const cookieOptions = buildSupabaseCookieOptions(
    getSharedCookieDomain(new URL(accountBaseURL()).hostname),
  );
  const cookieJar = new Map<string, SupabaseCookieToSet>();

  const supabase = createBrowserClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      isSingleton: false,
      cookieOptions,
      cookies: {
        getAll() {
          return [...cookieJar.values()].map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            if (cookie.value) {
              cookieJar.set(cookie.name, cookie);
            } else {
              cookieJar.delete(cookie.name);
            }
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Supabase fixture sign-in failed: ${error.message}`);
  }

  const cookies = [...cookieJar.values()]
    .filter((cookie) => isSupabaseAuthTokenCookie(cookie.name))
    .map((cookie) => toPlaywrightCookie(cookie));

  if (!cookies.length) {
    throw new Error("Supabase fixture sign-in did not produce an SSR auth cookie.");
  }

  await page.context().addCookies(cookies);
  await page.goto("/auth/resolve?next=/dashboard");
  await page.waitForURL((url) => url.pathname === "/dashboard", {
    timeout: 15_000,
  });
}

export async function signOutViaUI(page: Page): Promise<void> {
  await page.goto("/dashboard");
  // The dropdown trigger opens the menu; the signout item is only
  // visible after the menu opens. T3 is still test.fixme()'d until
  // both data-testids exist on the real AccountDropdown.
  await page.locator('[data-testid="account-dropdown-trigger"]').click();
  await page.locator('[data-testid="account-dropdown-signout"]').click();
}

/**
 * Force the active Supabase session to expire.
 *
 * Implementation:
 *   - mode="access": keep the refresh token valid, but backdate the
 *     Supabase SSR cookie's `expires_at` so the next server request
 *     exercises the transparent refresh path.
 *   - mode="both": first revoke the active refresh token via GoTrue
 *     admin sign-out, then backdate the cookie. The next refresh
 *     attempt fails and the proxy must route to `/auth/reauth`.
 *
 * Required env: SUPABASE_SERVICE_ROLE_KEY (server-side scoped — never
 * load this in client code).
 *
 * This helper never logs or returns tokens. It only reads them from
 * the test browser context long enough to drive Supabase's admin API.
 */
export async function expireSession(
  page: Page,
  mode: ExpireMode,
): Promise<void> {
  // Fail fast on missing env before we go near the cookie jar so the
  // error points at the env contract, not at a cryptic JSON parse
  // downstream.
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const parsed = await readSupabaseSessionCookie(page);

  if (mode === "both") {
    await revokeRefreshToken(parsed.accessToken);
  }

  backdateSessionExpiry(parsed.session);
  await writeSupabaseSessionCookie(page, parsed);
}

/**
 * Count `henry_events` rows for a given event name within a window.
 *
 * Used by T1/T2 to assert that the in-flight session lifecycle wrote
 * its telemetry row — the whole point of slice 5b. Reads via a
 * service-role client to bypass the `select` RLS policy (which only
 * permits service_role to read).
 *
 * Returns the integer row count (>= 0). Throws if env is missing or
 * the network call fails — telemetry probes are intentionally strict
 * because a silently-failing probe defeats the purpose of the assert.
 */
export async function henryEventCount(
  name: string,
  sinceISO: string,
  options?: { actorId?: string },
): Promise<number> {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let query = admin
    .from("henry_events")
    .select("id", { count: "exact", head: true })
    .eq("name", name)
    .gte("created_at", sinceISO);

  if (options?.actorId) {
    query = query.eq("actor_id", options.actorId);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(
      `henryEventCount(${name}) failed: ${error.message}. ` +
        `Did the slice 5b migration (20260522103000_v3_01_henry_events) apply?`,
    );
  }
  return count ?? 0;
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

function accountBaseURL(): string {
  return process.env.NEXT_PUBLIC_ACCOUNT_BASE_URL ?? "http://localhost:3003";
}

function toPlaywrightCookie(cookie: SupabaseCookieToSet): BrowserCookieToSet {
  const options = cookie.options ?? {};
  const baseURL = accountBaseURL();
  const domain = stringOption(options.domain);
  const maxAge = numberOption(options.maxAge);
  const expires = maxAge && maxAge > 0
    ? Math.floor(Date.now() / 1000) + maxAge
    : undefined;

  return {
    name: cookie.name,
    value: cookie.value,
    ...(domain ? { domain } : { url: baseURL }),
    path: stringOption(options.path) ?? "/",
    ...(expires ? { expires } : {}),
    httpOnly: booleanOption(options.httpOnly) ?? false,
    secure: booleanOption(options.secure) ?? (new URL(baseURL).protocol === "https:"),
    sameSite: sameSiteOption(options.sameSite) ?? "Lax",
  };
}

function stringOption(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberOption(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanOption(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function sameSiteOption(value: unknown): BrowserCookieToSet["sameSite"] | undefined {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "strict") return "Strict";
  if (normalized === "lax") return "Lax";
  if (normalized === "none") return "None";
  return undefined;
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

async function readSupabaseSessionCookie(page: Page): Promise<ParsedSessionCookie> {
  const projectRef = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL")).hostname.split(".")[0];
  const baseName = `sb-${projectRef}-auth-token`;
  // Filter via the canonical predicate from @henryco/config so the
  // test matches exactly the cookies the production proxy + browser
  // client read. Then narrow to *this* project's cookie family.
  const cookies = (await page.context().cookies()).filter((cookie) => {
    if (!isSupabaseAuthTokenCookie(cookie.name)) return false;
    const match = cookie.name.match(AUTH_COOKIE_CHUNK_RE);
    return match?.[1] === baseName;
  });

  if (!cookies.length) {
    throw new Error(`No Supabase SSR auth cookie found for ${baseName}. Did signIn() complete?`);
  }

  const rootCookie =
    cookies.find((cookie) => cookie.name === baseName) ??
    cookies
      .map((cookie) => ({ cookie, chunkIndex: chunkIndexFor(cookie.name) }))
      .filter((entry): entry is { cookie: BrowserCookie; chunkIndex: number } => entry.chunkIndex != null)
      .sort((a, b) => a.chunkIndex - b.chunkIndex)[0]?.cookie;

  if (!rootCookie) {
    throw new Error(`Supabase SSR auth cookie ${baseName} is missing chunk 0/root data.`);
  }

  const serialized = serializeCookieChunks(baseName, cookies);
  const { session, encoding } = decodeSessionCookieValue(serialized);
  const accessToken = getSessionAccessToken(session);
  if (!accessToken) {
    throw new Error("Supabase session cookie does not contain an access token.");
  }

  return {
    baseName,
    cookies,
    rootCookie,
    session,
    encoding,
    accessToken,
  };
}

async function writeSupabaseSessionCookie(page: Page, parsed: ParsedSessionCookie): Promise<void> {
  const context = page.context();
  const serialized = encodeSessionCookieValue(parsed.session, parsed.encoding);
  const chunks = createCookieChunks(parsed.baseName, serialized);

  for (const cookie of parsed.cookies) {
    await context.clearCookies({
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
    });
  }

  const expires =
    typeof parsed.rootCookie.expires === "number" && parsed.rootCookie.expires > 0
      ? parsed.rootCookie.expires
      : Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

  await context.addCookies(
    chunks.map((chunk) => ({
      ...chunk,
      domain: parsed.rootCookie.domain,
      path: parsed.rootCookie.path || "/",
      expires,
      httpOnly: parsed.rootCookie.httpOnly,
      secure: parsed.rootCookie.secure,
      sameSite: parsed.rootCookie.sameSite,
    })),
  );
}

async function revokeRefreshToken(accessToken: string): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { error } = await admin.auth.admin.signOut(accessToken, "global");
  if (error) {
    throw new Error(`Supabase admin signOut failed while expiring session: ${error.message}`);
  }
}

function serializeCookieChunks(baseName: string, cookies: BrowserCookie[]): string {
  const root = cookies.find((cookie) => cookie.name === baseName);
  if (root) return root.value;

  const chunks = cookies
    .map((cookie) => ({ value: cookie.value, chunkIndex: chunkIndexFor(cookie.name) }))
    .filter((entry): entry is { value: string; chunkIndex: number } => entry.chunkIndex != null)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);

  if (!chunks.length || chunks[0].chunkIndex !== 0) {
    throw new Error(`Supabase auth cookie ${baseName} has incomplete chunks.`);
  }

  return chunks.map((chunk) => chunk.value).join("");
}

function chunkIndexFor(name: string): number | null {
  const match = name.match(AUTH_COOKIE_CHUNK_RE);
  if (!match?.[2]) return null;
  return Number(match[2]);
}

function decodeSessionCookieValue(value: string): {
  session: Record<string, unknown> | unknown[];
  encoding: "base64" | "plain";
} {
  const encoding = value.startsWith("base64-") ? "base64" : "plain";
  const decoded =
    encoding === "base64"
      ? decodeBase64Url(value.slice("base64-".length))
      : decodeURIComponent(value);

  const session = JSON.parse(decoded) as unknown;
  if (!session || (typeof session !== "object" && !Array.isArray(session))) {
    throw new Error("Supabase session cookie decoded to an invalid payload.");
  }

  return {
    session: session as Record<string, unknown> | unknown[],
    encoding,
  };
}

function encodeSessionCookieValue(
  session: Record<string, unknown> | unknown[],
  encoding: "base64" | "plain",
): string {
  const json = JSON.stringify(session);
  return encoding === "base64" ? `base64-${encodeBase64Url(json)}` : encodeURIComponent(json);
}

function getSessionAccessToken(session: Record<string, unknown> | unknown[]): string | null {
  if (Array.isArray(session)) {
    return typeof session[0] === "string" ? session[0] : null;
  }

  return typeof session.access_token === "string" ? session.access_token : null;
}

function backdateSessionExpiry(session: Record<string, unknown> | unknown[]): void {
  const expiredAt = Math.floor(Date.now() / 1000) - 120;
  if (Array.isArray(session)) {
    session[4] = expiredAt;
    return;
  }

  session.expires_at = expiredAt;
  session.expires_in = 0;
}

function createCookieChunks(name: string, value: string): Array<{ name: string; value: string }> {
  if (value.length <= SUPABASE_COOKIE_CHUNK_SIZE) {
    return [{ name, value }];
  }

  const chunks: Array<{ name: string; value: string }> = [];
  for (let index = 0; index < value.length; index += SUPABASE_COOKIE_CHUNK_SIZE) {
    chunks.push({
      name: `${name}.${chunks.length}`,
      value: value.slice(index, index + SUPABASE_COOKIE_CHUNK_SIZE),
    });
  }
  return chunks;
}

function decodeBase64Url(value: string): string {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
