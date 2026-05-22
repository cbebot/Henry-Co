/**
 * detectAuthMethod unit tests — the decision matrix for which reauth
 * flow renders on /auth/reauth (Addendum A1).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  authMethodOAuthProvider,
  authMethodProviderName,
  detectAuthMethod,
  isOAuthMethod,
} from "../auth-method";

test("detectAuthMethod: null subject → unknown", () => {
  assert.equal(detectAuthMethod(null), "unknown");
  assert.equal(detectAuthMethod(undefined), "unknown");
});

test("detectAuthMethod: provider=email → email", () => {
  assert.equal(detectAuthMethod({ app_metadata: { provider: "email" } }), "email");
});

test("detectAuthMethod: provider=google → oauth_google", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { provider: "google" } }),
    "oauth_google",
  );
});

test("detectAuthMethod: provider=apple → oauth_apple", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { provider: "apple" } }),
    "oauth_apple",
  );
});

test("detectAuthMethod: provider=github → oauth_github", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { provider: "github" } }),
    "oauth_github",
  );
});

test("detectAuthMethod: provider=facebook → oauth_facebook", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { provider: "facebook" } }),
    "oauth_facebook",
  );
});

test("detectAuthMethod: unknown provider → oauth_other", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { provider: "saml" } }),
    "oauth_other",
  );
});

test("detectAuthMethod: provider case-insensitive", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { provider: "GOOGLE" } }),
    "oauth_google",
  );
});

test("detectAuthMethod: falls back to providers[] array when no provider claim", () => {
  assert.equal(
    detectAuthMethod({ app_metadata: { providers: ["google"] } }),
    "oauth_google",
  );
  assert.equal(
    detectAuthMethod({ app_metadata: { providers: ["email"] } }),
    "email",
  );
});

test("detectAuthMethod: empty app_metadata but email present → email", () => {
  assert.equal(detectAuthMethod({ app_metadata: {}, email: "a@b.co" }), "email");
});

test("detectAuthMethod: empty app_metadata + no email → unknown", () => {
  assert.equal(detectAuthMethod({ app_metadata: {} }), "unknown");
});

test("authMethodProviderName: returns user-facing label for OAuth methods", () => {
  assert.equal(authMethodProviderName("oauth_google"), "Google");
  assert.equal(authMethodProviderName("oauth_apple"), "Apple");
  assert.equal(authMethodProviderName("oauth_github"), "GitHub");
  assert.equal(authMethodProviderName("oauth_facebook"), "Facebook");
  assert.equal(authMethodProviderName("oauth_other"), "your provider");
});

test("authMethodProviderName: returns null for non-OAuth methods", () => {
  assert.equal(authMethodProviderName("email"), null);
  assert.equal(authMethodProviderName("unknown"), null);
});

test("authMethodOAuthProvider: returns Supabase OAuth slug for known providers", () => {
  assert.equal(authMethodOAuthProvider("oauth_google"), "google");
  assert.equal(authMethodOAuthProvider("oauth_apple"), "apple");
  assert.equal(authMethodOAuthProvider("oauth_github"), "github");
  assert.equal(authMethodOAuthProvider("oauth_facebook"), "facebook");
});

test("authMethodOAuthProvider: returns null for non-OAuth methods", () => {
  assert.equal(authMethodOAuthProvider("email"), null);
  assert.equal(authMethodOAuthProvider("oauth_other"), null);
  assert.equal(authMethodOAuthProvider("unknown"), null);
});

test("isOAuthMethod: distinguishes oauth_* from email/unknown", () => {
  assert.equal(isOAuthMethod("oauth_google"), true);
  assert.equal(isOAuthMethod("oauth_apple"), true);
  assert.equal(isOAuthMethod("oauth_other"), true);
  assert.equal(isOAuthMethod("email"), false);
  assert.equal(isOAuthMethod("unknown"), false);
});
