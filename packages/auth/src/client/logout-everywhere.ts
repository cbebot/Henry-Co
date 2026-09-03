/**
 * V3-02 S2 — single-entry logout orchestrator.
 *
 * Every "Sign out" button across the 10 web apps lands here. The
 * sequence is deliberate:
 *
 *   1. POST /api/auth/logout — server clears Supabase session +
 *      `hc_dash_pref` cookie. Spec S7 broadcast (A7) is handled by
 *      a separate sign-out-everywhere endpoint so OTHER tabs/devices
 *      receive a soft signal before token invalidation. THIS
 *      orchestrator covers single-device logout; sign-out-everywhere
 *      composes it.
 *   2. supabase.auth.signOut() (client) — drops the in-memory client
 *      reference + httpOnly cookies the server route missed. Safe
 *      even when the server route already cleared them (idempotent).
 *   3. clearHenryCoStorage() — scoped storage tear-down per A5/A8.
 *   4. Broadcast `sign-out` on the henryco-session channel — peer
 *      tabs receive the signal and run their own clean-up.
 *   5. Emit `henry.auth.logout.everywhere` for analytics.
 *   6. Navigate to the chooser URL with `signed_out=true`.
 *
 * The orchestrator deliberately does NOT block on individual step
 * failures. A failing storage clear should still finish the logout —
 * the next sign-in will recover and the failure surfaces in
 * telemetry rather than stranding the user.
 */

import { emitEvent } from "@henryco/observability/events";

import { clearHenryCoStorage } from "./clear-henryco-storage";
import { createSessionBroadcaster } from "./session-broadcast";

type SignOutCapableClient = {
  auth: {
    signOut: (params?: { scope?: "global" | "local" | "others" }) => Promise<
      { error: { message: string } | null } | { error: null }
    >;
  };
};

export type LogoutEverywhereOptions = {
  /**
   * Supabase browser client to invoke `signOut` on. Caller-provided
   * so this helper stays decoupled from any one app's Supabase
   * factory.
   */
  supabase: SignOutCapableClient;
  /**
   * Optional override for the server logout endpoint. Defaults to
   * `/api/auth/logout` on the current origin — every app currently
   * proxies the account app's logout via that path, so the default
   * is correct cross-app.
   *
   * Set to `null` to skip the server round-trip entirely (rare —
   * primarily for tests).
   */
  serverLogoutUrl?: string | null;
  /**
   * Where to land after logout. Defaults to `/auth/choose?signed_out=true`.
   */
  redirectTo?: string;
  /**
   * Override `window.location.assign` for tests.
   */
  navigate?: (url: string) => void;
  /**
   * Why the user logged out — emitted with the telemetry event.
   * Defaults to "user".
   */
  reason?: "user" | "session-expired" | "force";
  /**
   * If true, skip the broadcast on `henryco-session`. Used by the
   * sign-out-everywhere endpoint where Supabase Realtime already
   * carries the signal cross-device.
   */
  suppressBroadcast?: boolean;
};

export type LogoutEverywhereResult = {
  ok: boolean;
  serverLogoutStatus: number | null;
  storage: Awaited<ReturnType<typeof clearHenryCoStorage>>;
  errors: ReadonlyArray<{ stage: string; message: string }>;
};

const DEFAULT_REDIRECT = "/auth/choose?signed_out=true";

export async function logoutEverywhere(
  options: LogoutEverywhereOptions,
): Promise<LogoutEverywhereResult> {
  const errors: { stage: string; message: string }[] = [];
  const reason = options.reason ?? "user";

  let serverLogoutStatus: number | null = null;
  if (options.serverLogoutUrl !== null) {
    const url = options.serverLogoutUrl ?? "/api/auth/logout";
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      serverLogoutStatus = response.status;
    } catch (e) {
      errors.push({
        stage: "fetch:/api/auth/logout",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  try {
    const { error } = await options.supabase.auth.signOut({ scope: "local" });
    if (error) {
      errors.push({ stage: "supabase.auth.signOut", message: error.message });
    }
  } catch (e) {
    errors.push({
      stage: "supabase.auth.signOut",
      message: e instanceof Error ? e.message : String(e),
    });
  }

  const storage = await clearHenryCoStorage();
  for (const err of storage.errors) errors.push(err);

  if (!options.suppressBroadcast) {
    try {
      const broadcaster = createSessionBroadcaster();
      broadcaster.publish({ type: "sign-out", reason: "user" });
      broadcaster.close();
    } catch (e) {
      errors.push({
        stage: "session-broadcast",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  emitEvent({
    name: "henry.auth.logout.everywhere",
    classification: "user_action",
    outcome: "completed",
    payload: {
      reason,
      serverLogoutStatus,
      storageCleared: {
        localStorageKeys: storage.localStorageKeysRemoved,
        sessionStorageKeys: storage.sessionStorageKeysRemoved,
        indexedDbDatabases: storage.indexedDbDatabasesDeleted,
        caches: storage.cachesDeleted,
      },
      errorCount: errors.length,
    },
  });

  const redirect = options.redirectTo ?? DEFAULT_REDIRECT;
  if (typeof window !== "undefined") {
    const navigate = options.navigate ?? ((u: string) => window.location.assign(u));
    try {
      navigate(redirect);
    } catch (e) {
      errors.push({
        stage: "navigate",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    ok: errors.length === 0,
    serverLogoutStatus,
    storage,
    errors,
  };
}
