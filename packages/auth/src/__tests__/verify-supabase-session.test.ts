/**
 * verifySupabaseSession decision-matrix tests.
 *
 * The @supabase/ssr `createServerClient` import is replaced via
 * `__setSupabaseClientFactoryForTests`, so these tests exercise the
 * helper's branching without needing a real Supabase project. The
 * @henryco/config cookie helpers are used for real — they don't talk
 * to any external systems, just inspect cookie shapes.
 */

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { NextRequest, NextResponse } from "next/server";

import {
  verifySupabaseSession,
  sessionStateFor,
  __setSupabaseClientFactoryForTests,
} from "../server/verify-supabase-session";
import {
  decodeReauthContextCookieValue,
  HC_REAUTH_CONTEXT_COOKIE,
} from "../server/reauth-context";

declare const __resetAuthTestState: () => void;

const ORIGINAL_ENV = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

beforeEach(() => {
  __resetAuthTestState();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://stub.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "stub-anon-key";
});

afterEach(() => {
  if (ORIGINAL_ENV.url) process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_ENV.url;
  else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (ORIGINAL_ENV.anon) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_ENV.anon;
  else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  __setSupabaseClientFactoryForTests(null);
});

function makeReq(cookieHeader = ""): NextRequest {
  const init: { headers?: Record<string, string> } = {};
  if (cookieHeader) init.headers = { Cookie: cookieHeader };
  return new NextRequest("https://account.henrycogroup.com/dashboard", init);
}

function freshRes(): NextResponse {
  return NextResponse.next();
}

/**
 * A well-formed Supabase session cookie value: JSON parseable.
 * @henryco/config's `findMalformedSupabaseSessionCookieNames` rejects
 * anything that doesn't decode to an object.
 */
function validSessionCookieHeader(): string {
  const payload = JSON.stringify({
    access_token: "stub-access",
    refresh_token: "stub-refresh",
    expires_at: Date.now() / 1000 + 3600,
  });
  return `sb-stub-auth-token=${encodeURIComponent(payload)}`;
}

function validSessionCookieHeaderWithUser(): string {
  const payload = JSON.stringify({
    access_token: "stub-access",
    refresh_token: "stub-refresh",
    expires_at: Date.now() / 1000 + 3600,
    user: {
      email: "fixture@example.com",
      app_metadata: { provider: "email", role: "ignored" },
      user_metadata: {
        full_name: "Fixture User",
        avatar_url: "https://example.com/avatar.png",
        secret_note: "ignored",
      },
    },
  });
  return `sb-stub-auth-token=${encodeURIComponent(payload)}`;
}

function malformedSessionCookieHeader(): string {
  // Truncated JSON — fails the well-formed check.
  return "sb-stub-auth-token=not-json";
}

type StubOpts = {
  /** Simulate Supabase auto-refreshing the access token (setAll fires). */
  autoRefresh?: boolean;
  /**
   * Simulate the failure modes the helper distinguishes:
   *   "error"           → getUser resolves with { user: null, error: { recoverable } }
   *   "refresh-token-invalid" → getUser resolves with Supabase's 400 refresh-token failure
   *   "throw-recoverable" → getUser throws a recoverable error
   *   "throw-fatal"     → getUser throws a non-recoverable error (should propagate)
   */
  throwOn?: "error" | "refresh-token-invalid" | "throw-recoverable" | "throw-fatal";
};

function stubSupabase(userId: string | null, opts: StubOpts = {}): void {
  __setSupabaseClientFactoryForTests(((url: string, _anon: string, options: {
    cookies: { setAll: (c: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void };
  }) => {
    if (opts.autoRefresh) {
      options.cookies.setAll([
        { name: "sb-stub-auth-token", value: "refreshed-value", options: {} },
      ]);
    }
    return {
      auth: {
        async getUser() {
          if (opts.throwOn === "throw-fatal") {
            const err = new Error("network down") as Error & { name: string };
            err.name = "NetworkError";
            throw err;
          }
          if (opts.throwOn === "throw-recoverable") {
            const err = new Error("session expired") as Error & { name: string };
            err.name = "AuthSessionMissingError";
            throw err;
          }
          if (opts.throwOn === "error") {
            return {
              data: { user: null },
              error: { name: "AuthSessionMissingError", message: "session missing", status: 401 },
            };
          }
          if (opts.throwOn === "refresh-token-invalid") {
            return {
              data: { user: null },
              error: {
                name: "AuthApiError",
                message: "Refresh token is not valid",
                code: "validation_failed",
                status: 400,
              },
            };
          }
          if (userId === null) {
            return { data: { user: null }, error: null };
          }
          return { data: { user: { id: userId } }, error: null };
        },
      },
    };
    // The supabase factory type is wide; we satisfy the structural
    // shape used by verifySupabaseSession only.
  }) as never);
}

// ─── env / config branch ────────────────────────────────────────────

test("verifySupabaseSession: missing NEXT_PUBLIC_SUPABASE_URL → no-config", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  const result = await verifySupabaseSession(makeReq(), freshRes());
  assert.equal(result.status, "no-config");
});

test("verifySupabaseSession: missing NEXT_PUBLIC_SUPABASE_ANON_KEY → no-config", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const result = await verifySupabaseSession(makeReq(), freshRes());
  assert.equal(result.status, "no-config");
});

// ─── anonymous branch ───────────────────────────────────────────────

test("verifySupabaseSession: no auth cookies → anonymous (short-circuits Supabase)", async () => {
  let createdClient = false;
  __setSupabaseClientFactoryForTests(((..._args: unknown[]) => {
    createdClient = true;
    return { auth: { getUser: async () => ({ data: { user: null }, error: null }) } };
  }) as never);
  const result = await verifySupabaseSession(makeReq(), freshRes());
  assert.equal(result.status, "anonymous");
  assert.equal(createdClient, false, "must not hit Supabase when no auth cookies");
});

// ─── ok branch ──────────────────────────────────────────────────────

test("verifySupabaseSession: valid cookie + user → ok with userId, refreshed=false", async () => {
  stubSupabase("user-42");
  const result = await verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes());
  if (result.status !== "ok") {
    assert.fail(`expected ok, got ${result.status}`);
  }
  assert.equal(result.userId, "user-42");
  assert.equal(result.refreshed, false);
});

test("verifySupabaseSession: setAll called during getUser → ok with refreshed=true", async () => {
  stubSupabase("user-99", { autoRefresh: true });
  const result = await verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes());
  if (result.status !== "ok") {
    assert.fail(`expected ok, got ${result.status}`);
  }
  assert.equal(result.refreshed, true);
});

// ─── reauth branch ──────────────────────────────────────────────────

test("verifySupabaseSession: cookies present, recoverable error → reauth", async () => {
  stubSupabase(null, { throwOn: "error" });
  const result = await verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes());
  if (result.status !== "reauth") {
    assert.fail(`expected reauth, got ${result.status}`);
  }
  assert.equal(result.reason, "supabase_auth_error");
});

test("verifySupabaseSession: invalid refresh token API error → reauth", async () => {
  stubSupabase(null, { throwOn: "refresh-token-invalid" });
  const result = await verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes());
  if (result.status !== "reauth") {
    assert.fail(`expected reauth, got ${result.status}`);
  }
  assert.equal(result.reason, "supabase_auth_error");
});

test("verifySupabaseSession: recoverable error writes short-lived reauth context", async () => {
  stubSupabase(null, { throwOn: "error" });
  const res = freshRes();
  const result = await verifySupabaseSession(
    makeReq(validSessionCookieHeaderWithUser()),
    res,
  );
  if (result.status !== "reauth") {
    assert.fail(`expected reauth, got ${result.status}`);
  }

  const cookie = res.cookies.get(HC_REAUTH_CONTEXT_COOKIE);
  assert.ok(cookie, "reauth context cookie should be set before auth cookies are cleared");
  assert.equal(cookie.path, "/auth/reauth");
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.maxAge, 300);

  const context = decodeReauthContextCookieValue(cookie.value);
  assert.equal(context?.email, "fixture@example.com");
  assert.deepEqual(context?.app_metadata, { provider: "email" });
  assert.deepEqual(context?.user_metadata, {
    full_name: "Fixture User",
    avatar_url: "https://example.com/avatar.png",
  });
  assert.equal(context?.displayName, "Fixture User");
});

test("verifySupabaseSession: cookies present, getUser throws recoverable → reauth", async () => {
  stubSupabase(null, { throwOn: "throw-recoverable" });
  const result = await verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes());
  if (result.status !== "reauth") {
    assert.fail(`expected reauth, got ${result.status}`);
  }
  assert.equal(result.reason, "supabase_auth_exception");
});

test("verifySupabaseSession: cookies present, no user but no error → reauth", async () => {
  stubSupabase(null);
  const result = await verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes());
  if (result.status !== "reauth") {
    assert.fail(`expected reauth, got ${result.status}`);
  }
  assert.equal(result.reason, "user_absent_after_verify");
});

test("verifySupabaseSession: malformed-only cookies → reauth (after clearing)", async () => {
  stubSupabase(null);
  const result = await verifySupabaseSession(
    makeReq(malformedSessionCookieHeader()),
    freshRes(),
  );
  if (result.status !== "reauth") {
    assert.fail(`expected reauth, got ${result.status}`);
  }
  assert.equal(result.reason, "malformed_session_cookies");
});

// ─── error propagation ─────────────────────────────────────────────

test("verifySupabaseSession: non-recoverable error propagates", async () => {
  stubSupabase(null, { throwOn: "throw-fatal" });
  await assert.rejects(
    () => verifySupabaseSession(makeReq(validSessionCookieHeader()), freshRes()),
    (e: unknown) => (e as Error).name === "NetworkError",
  );
});

// ─── sessionStateFor helper ─────────────────────────────────────────

test("sessionStateFor: ok → signed-in", () => {
  assert.equal(sessionStateFor({ status: "ok", userId: "u", refreshed: false }), "signed-in");
});

test("sessionStateFor: anonymous → signed-out", () => {
  assert.equal(sessionStateFor({ status: "anonymous" }), "signed-out");
});

test("sessionStateFor: reauth → reauth-required", () => {
  assert.equal(
    sessionStateFor({ status: "reauth", reason: "test" }),
    "reauth-required",
  );
});

test("sessionStateFor: no-config → null (callers should skip cookie tag)", () => {
  assert.equal(sessionStateFor({ status: "no-config" }), null);
});
