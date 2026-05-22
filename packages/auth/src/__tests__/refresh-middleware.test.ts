/**
 * withSessionRefresh — decision-matrix tests for the V3-01 session
 * refresh middleware. Covers the four resolve outcomes (ok / refreshed
 * / anonymous / reauth) and the reauth-redirect contract (return path,
 * intent inference, drafts preservation, custom base URL, headers,
 * cookie tagging).
 *
 * Tests use a real NextRequest from `next/server`; the host-app
 * `resolve` callback is stubbed so this test exercises the wrapper's
 * own dispatch logic without needing a Supabase client.
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { reauthRedirectFor, withSessionRefresh } from "../server/refresh-middleware";

declare const __resetAuthTestState: () => void;

beforeEach(() => {
  __resetAuthTestState();
});

function makeRequest(path = "/dashboard", method = "GET"): NextRequest {
  return new NextRequest(`https://account.henrycogroup.com${path}`, { method });
}

test("withSessionRefresh: ok → calls through, cookie=signed-in", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "ok", userId: "u-1" }),
  });
  const res = await mw(makeRequest("/dashboard"));
  assert.equal(res.status, 200);
  assert.equal(res.cookies.get("hc_session_state")?.value, "signed-in");
});

test("withSessionRefresh: refreshed → cookie=signed-in (silent refresh)", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "refreshed", userId: "u-2" }),
  });
  const res = await mw(makeRequest("/account/settings"));
  assert.equal(res.cookies.get("hc_session_state")?.value, "signed-in");
});

test("withSessionRefresh: anonymous → cookie=signed-out, no redirect", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "anonymous" }),
  });
  const res = await mw(makeRequest("/public"));
  assert.notEqual(res.status, 307);
  assert.equal(res.cookies.get("hc_session_state")?.value, "signed-out");
});

test("withSessionRefresh: reauth → 307 redirect + reauth headers + reauth cookie", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "reauth", reason: "refresh_token_expired" }),
    reauthBaseUrl: "/auth/reauth",
  });
  const res = await mw(makeRequest("/support/threads/new", "POST"));

  assert.equal(res.status, 307);
  assert.equal(res.headers.get("WWW-Authenticate"), "ReauthRequired");
  assert.equal(res.headers.get("X-HenryCo-Session-State"), "reauth");
  assert.equal(res.cookies.get("hc_session_state")?.value, "reauth-required");
});

test("withSessionRefresh: reauth preserves return path + form intent on POST", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "reauth" }),
    reauthBaseUrl: "/auth/reauth",
  });
  const res = await mw(makeRequest("/support/threads/new", "POST"));
  const location = res.headers.get("location");
  assert.ok(location);
  const url = new URL(location!);
  assert.equal(url.pathname, "/auth/reauth");
  assert.equal(url.searchParams.get("return"), "/support/threads/new");
  assert.equal(url.searchParams.get("intent"), "form");
});

test("withSessionRefresh: reauth uses page intent on GET", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "reauth" }),
    reauthBaseUrl: "/auth/reauth",
  });
  const res = await mw(makeRequest("/profile", "GET"));
  const url = new URL(res.headers.get("location")!);
  assert.equal(url.searchParams.get("intent"), "page");
});

test("withSessionRefresh: reauth preserves drafts query param", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "reauth" }),
    reauthBaseUrl: "/auth/reauth",
  });
  const res = await mw(
    makeRequest("/support/threads/new?drafts=support-thread-new", "POST"),
  );
  const url = new URL(res.headers.get("location")!);
  assert.equal(url.searchParams.get("drafts"), "support-thread-new");
});

test("withSessionRefresh: reauth preserves existing query string in return path", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "reauth" }),
    reauthBaseUrl: "/auth/reauth",
  });
  const res = await mw(makeRequest("/listings?q=lagos&page=2", "GET"));
  const url = new URL(res.headers.get("location")!);
  assert.equal(url.searchParams.get("return"), "/listings?q=lagos&page=2");
});

test("withSessionRefresh: reauth honours custom reauthBaseUrl", async () => {
  const mw = withSessionRefresh(async () => undefined, {
    resolve: async () => ({ status: "reauth" }),
    reauthBaseUrl: "https://custom.example.com/auth/reauth-custom",
  });
  const res = await mw(makeRequest("/foo"));
  const url = new URL(res.headers.get("location")!);
  assert.equal(url.host, "custom.example.com");
  assert.equal(url.pathname, "/auth/reauth-custom");
});

test("withSessionRefresh: respects inner middleware response when provided", async () => {
  const { NextResponse } = await import("next/server");
  const sentinel = "X-Inner-Response";
  const mw = withSessionRefresh(
    async () => {
      const res = NextResponse.next();
      res.headers.set(sentinel, "yes");
      return res;
    },
    { resolve: async () => ({ status: "ok" }) },
  );
  const res = await mw(makeRequest("/anywhere"));
  assert.equal(res.headers.get(sentinel), "yes");
  // Cookie still tagged on the inner response.
  assert.equal(res.cookies.get("hc_session_state")?.value, "signed-in");
});

// ─── reauthRedirectFor standalone helper ───────────────────────────

test("reauthRedirectFor: produces 307 + reauth headers + cookie + return path", () => {
  const res = reauthRedirectFor(
    makeRequest("/support/threads/new", "POST"),
    { reason: "user_absent_after_verify", reauthBaseUrl: "/auth/reauth" },
  );
  assert.equal(res.status, 307);
  assert.equal(res.headers.get("WWW-Authenticate"), "ReauthRequired");
  assert.equal(res.headers.get("X-HenryCo-Session-State"), "reauth");
  assert.equal(res.cookies.get("hc_session_state")?.value, "reauth-required");

  const url = new URL(res.headers.get("location")!);
  assert.equal(url.pathname, "/auth/reauth");
  assert.equal(url.searchParams.get("return"), "/support/threads/new");
  assert.equal(url.searchParams.get("intent"), "form");
});

test("reauthRedirectFor: honours cross-domain reauthBaseUrl override", () => {
  const res = reauthRedirectFor(makeRequest("/anywhere"), {
    reauthBaseUrl: "https://account.example.com/auth/reauth",
  });
  const url = new URL(res.headers.get("location")!);
  assert.equal(url.host, "account.example.com");
  assert.equal(url.pathname, "/auth/reauth");
});

test("reauthRedirectFor: preserves drafts query param from incoming request", () => {
  const res = reauthRedirectFor(
    makeRequest("/listings?drafts=property-listing-new", "POST"),
    { reauthBaseUrl: "/auth/reauth" },
  );
  const url = new URL(res.headers.get("location")!);
  assert.equal(url.searchParams.get("drafts"), "property-listing-new");
});

test("reauthRedirectFor: carryCookiesFrom forwards Set-Cookie writes onto the redirect", async () => {
  const { NextResponse } = await import("next/server");
  const inner = NextResponse.next();
  // Simulate the malformed-cookie clearing pattern: write an expired
  // cookie on the inner response.
  inner.cookies.set("sb-cleanup-test-auth-token", "", {
    path: "/",
    expires: new Date(0),
  });

  const res = reauthRedirectFor(makeRequest("/foo", "POST"), {
    reauthBaseUrl: "/auth/reauth",
    carryCookiesFrom: inner,
  });

  // The redirect response should now also expire that cookie.
  const carried = res.cookies.get("sb-cleanup-test-auth-token");
  assert.ok(carried, "carried cookie present on redirect response");
  // Reauth cookie still set too.
  assert.equal(res.cookies.get("hc_session_state")?.value, "reauth-required");
});
