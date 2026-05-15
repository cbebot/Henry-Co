/**
 * Provider selector unit test — env-permutation matrix.
 *
 * Verifies the decision matrix in `provider-selector.ts`:
 *
 *   ROOMS_PROVIDER  | DAILY_*  | NEXT_PUBLIC_JITSI_DOMAIN | Result
 *   ────────────────┼──────────┼──────────────────────────┼────────
 *   "daily"         | present  | (any)                    | daily
 *   "daily"         | absent   | (any)                    | null
 *   "jitsi"         | (any)    | present                  | jitsi
 *   "jitsi"         | (any)    | absent                   | jitsi (meet.jit.si fallback)
 *   unset           | present  | (any)                    | daily
 *   unset           | absent   | present                  | jitsi
 *   unset           | absent   | absent                   | jitsi (meet.jit.si fallback)
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  selectProvider,
  selectProviderName,
  __setProviderForTests,
} from "../provider-selector";

test("provider-selector: explicit daily + creds → daily", () => {
  const driver = selectProvider({
    ROOMS_PROVIDER: "daily",
    DAILY_API_KEY: "k",
    DAILY_DOMAIN: "henrycotest",
  });
  assert.ok(driver, "driver should be created");
  assert.equal(driver?.provider, "daily");
});

test("provider-selector: explicit daily + no creds → null (rooms_unavailable)", () => {
  const driver = selectProvider({
    ROOMS_PROVIDER: "daily",
  });
  assert.equal(driver, null);
});

test("provider-selector: explicit jitsi with custom domain", () => {
  const driver = selectProvider({
    ROOMS_PROVIDER: "jitsi",
    NEXT_PUBLIC_JITSI_DOMAIN: "jitsi.henrycogroup.com",
  });
  assert.ok(driver);
  assert.equal(driver?.provider, "jitsi");
});

test("provider-selector: explicit jitsi without domain → public fallback", () => {
  const driver = selectProvider({
    ROOMS_PROVIDER: "jitsi",
  });
  assert.ok(driver);
  assert.equal(driver?.provider, "jitsi");
});

test("provider-selector: unset + daily creds → daily", () => {
  const driver = selectProvider({
    DAILY_API_KEY: "k",
    DAILY_DOMAIN: "henrycotest",
  });
  assert.ok(driver);
  assert.equal(driver?.provider, "daily");
});

test("provider-selector: unset + no daily creds + jitsi domain → jitsi", () => {
  const driver = selectProvider({
    NEXT_PUBLIC_JITSI_DOMAIN: "jitsi.henrycogroup.com",
  });
  assert.ok(driver);
  assert.equal(driver?.provider, "jitsi");
});

test("provider-selector: unset + no env → jitsi (meet.jit.si fallback)", () => {
  const driver = selectProvider({});
  assert.ok(driver);
  assert.equal(driver?.provider, "jitsi");
});

test("provider-selector: bad ROOMS_PROVIDER falls back to default path", () => {
  const driver = selectProvider({
    ROOMS_PROVIDER: "garbage",
    DAILY_API_KEY: "k",
    DAILY_DOMAIN: "henrycotest",
  });
  assert.ok(driver);
  // bad value is normalized to null requested, default path picks Daily.
  assert.equal(driver?.provider, "daily");
});

test("selectProviderName: env permutations", () => {
  assert.equal(selectProviderName({ ROOMS_PROVIDER: "daily" }), null);
  assert.equal(
    selectProviderName({
      ROOMS_PROVIDER: "daily",
      DAILY_API_KEY: "k",
      DAILY_DOMAIN: "h",
    }),
    "daily",
  );
  assert.equal(selectProviderName({ ROOMS_PROVIDER: "jitsi" }), "jitsi");
  assert.equal(selectProviderName({}), "jitsi");
  assert.equal(
    selectProviderName({ DAILY_API_KEY: "k", DAILY_DOMAIN: "h" }),
    "daily",
  );
});

test("provider-selector: __setProviderForTests overrides env", () => {
  const stub = {
    provider: "daily" as const,
    createRoom: async () => ({ providerRoomId: "stub", joinUrl: "https://x" }),
    issueJoinToken: async () => ({
      joinToken: "tok",
      expiresAt: new Date().toISOString(),
    }),
  };
  __setProviderForTests(stub);
  const driver = selectProvider({});
  assert.equal(driver, stub);
  __setProviderForTests(null);
});
