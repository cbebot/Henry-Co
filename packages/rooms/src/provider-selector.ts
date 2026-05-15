/**
 * @henryco/rooms/provider-selector — env-driven driver selection.
 *
 * The single decision point for "which provider does this server action
 * speak to?" Reads env once at server-action invocation, returns either a
 * `ProviderDriver` instance or `null` (signalling rooms-unavailable to
 * the caller, which then returns `{ error: "rooms_unavailable" }`).
 *
 * Decision matrix (per audit §4.2 + §6.1.14):
 *
 *   ROOMS_PROVIDER   | DAILY_*    | NEXT_PUBLIC_JITSI_DOMAIN | Result
 *   ─────────────────┼────────────┼──────────────────────────┼────────
 *   "daily"          | present    | (any)                    | daily
 *   "daily"          | absent     | (any)                    | null
 *   "jitsi"          | (any)      | present OR fallback ok   | jitsi
 *   unset (default)  | present    | (any)                    | daily
 *   unset (default)  | absent     | present                  | jitsi
 *   unset (default)  | absent     | absent                   | jitsi (meet.jit.si)
 *
 * Note: Jitsi's "absent" branch falls back to `meet.jit.si`, so the rooms
 * surface degrades to a working Jitsi instance even with zero
 * configuration. The owner can ROOMS_PROVIDER=daily to fail-closed if
 * Daily is the only acceptable provider.
 *
 * `UNVERIFIED — REQUIRES OWNER CONFIRMATION`: default provider order is
 * "Daily.co primary, Jitsi fallback" per
 * `docs/rebuild-prompts/README.md:194-196`. The owner can flip the
 * default at spawn time by setting `ROOMS_PROVIDER=jitsi`.
 */

import "server-only";

import { createDailyDriver } from "./providers/daily";
import { createJitsiDriver } from "./providers/jitsi";
import type { ProviderDriver, RoomProvider } from "./types";

/**
 * The default public Jitsi instance — used when the owner has neither
 * `DAILY_*` env nor `NEXT_PUBLIC_JITSI_DOMAIN` set. Documented behaviour:
 * rooms degrade to a working public Jitsi room instead of 500.
 */
const DEFAULT_JITSI_DOMAIN = "meet.jit.si";

/**
 * Override seam — host apps + tests can call this to install a stubbed
 * driver. Set back to `null` to restore the default env-driven path.
 */
let testOverride: ProviderDriver | null = null;

/**
 * For tests + the consumer test page. Production code paths never call
 * this — they rely on env.
 */
export function __setProviderForTests(driver: ProviderDriver | null): void {
  testOverride = driver;
}

export type ProviderSelectorEnv = {
  ROOMS_PROVIDER?: string | null;
  DAILY_API_KEY?: string | null;
  DAILY_DOMAIN?: string | null;
  NEXT_PUBLIC_JITSI_DOMAIN?: string | null;
  JITSI_APP_ID?: string | null;
  JITSI_APP_SECRET?: string | null;
};

/**
 * Resolve the provider driver for this request. Returns `null` when the
 * caller's environment is unsuitable (e.g. ROOMS_PROVIDER=daily but no
 * DAILY_API_KEY). Pure: takes env as input so tests can sweep all
 * permutations without touching `process.env`.
 *
 * The test override takes precedence — if a test has installed a stub
 * driver, this returns it regardless of env.
 */
export function selectProvider(
  env: ProviderSelectorEnv = process.env as ProviderSelectorEnv,
): ProviderDriver | null {
  if (testOverride) return testOverride;

  const requested = normalizeRequested(env.ROOMS_PROVIDER);
  const hasDaily = Boolean(env.DAILY_API_KEY) && Boolean(env.DAILY_DOMAIN);

  // Explicit `daily` — succeed only with full env.
  if (requested === "daily") {
    if (!hasDaily) return null;
    return createDailyDriver({
      apiKey: env.DAILY_API_KEY as string,
      domain: env.DAILY_DOMAIN as string,
    });
  }

  // Explicit `jitsi` — always succeeds because Jitsi degrades to the
  // public instance.
  if (requested === "jitsi") {
    return createJitsiDriver({
      domain: env.NEXT_PUBLIC_JITSI_DOMAIN || DEFAULT_JITSI_DOMAIN,
      appId: env.JITSI_APP_ID ?? null,
      appSecret: env.JITSI_APP_SECRET ?? null,
    });
  }

  // Default: Daily if creds present, else Jitsi.
  if (hasDaily) {
    return createDailyDriver({
      apiKey: env.DAILY_API_KEY as string,
      domain: env.DAILY_DOMAIN as string,
    });
  }
  return createJitsiDriver({
    domain: env.NEXT_PUBLIC_JITSI_DOMAIN || DEFAULT_JITSI_DOMAIN,
    appId: env.JITSI_APP_ID ?? null,
    appSecret: env.JITSI_APP_SECRET ?? null,
  });
}

/**
 * Pure variant — returns the resolved provider NAME without instantiating
 * a driver. Used by the UI to brand the room (Daily vs Jitsi may have
 * visual differences) and by the lifecycle hook to set its `provider`
 * field eagerly without a roundtrip.
 */
export function selectProviderName(
  env: ProviderSelectorEnv = process.env as ProviderSelectorEnv,
): RoomProvider | null {
  if (testOverride) return testOverride.provider;
  const requested = normalizeRequested(env.ROOMS_PROVIDER);
  const hasDaily = Boolean(env.DAILY_API_KEY) && Boolean(env.DAILY_DOMAIN);
  if (requested === "daily") return hasDaily ? "daily" : null;
  if (requested === "jitsi") return "jitsi";
  return hasDaily ? "daily" : "jitsi";
}

function normalizeRequested(value: unknown): RoomProvider | null {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "daily" || s === "jitsi") return s;
  return null;
}
