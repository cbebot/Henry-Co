// V3-MKT-TRUST-01 — the rollout switch. PURE (no "server-only") so tests can import it.
//
// MARKETPLACE_INSTANT_PUBLISH is a server-only runtime flag: it is not prefixed
// NEXT_PUBLIC_, so it is never inlined into a client bundle and is read per
// request. Strict compare — absent, empty or anything other than "1" is OFF, and
// OFF means every touched handler runs its original code path untouched.

type Env = Record<string, string | undefined>;

export function isInstantPublishEnabled(env: Env = process.env as Env): boolean {
  return env.MARKETPLACE_INSTANT_PUBLISH === "1";
}

/**
 * The optional AI signal. Dark unless instant publish is on AND this surface flag
 * is on; the gateway's own master switch is checked separately by the adapter.
 */
export function isInstantPublishAiEnabled(env: Env = process.env as Env): boolean {
  return isInstantPublishEnabled(env) && env.MARKETPLACE_INSTANT_PUBLISH_AI === "1";
}
