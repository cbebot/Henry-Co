import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { TypedSupabaseClient } from "@henryco/data";
import { resolvePersonalizationConsent } from "@henryco/ui/public";

/**
 * V3-34 — resolve the effective personalization-profiling consent for the
 * signed-in viewer (E-D2 merge: account value wins over the device cookie).
 *
 * This governs whether behavioural SIGNALS feed the home projection — NOT the
 * first-party layout config (pin/hide/reorder), which runs on legitimate
 * interest and is always honoured. When consent is withheld the caller drops
 * signal scores and the home orders by the user's explicit config + default
 * weight only (no behavioural inference).
 */

/** Read customer_preferences.personalization_enabled for the viewer (RLS own-row). */
export async function readAccountPersonalizationFlag(
  client: TypedSupabaseClient,
  userId: string,
): Promise<boolean | null> {
  const { data, error } = await client
    .from("customer_preferences")
    .select("personalization_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  // Best-effort: a read error is treated as "not-yet-answered" (null) so a
  // transient failure never silently flips profiling on.
  if (error) return null;
  return (data?.personalization_enabled ?? null) as boolean | null;
}

/**
 * The full resolution: account-authoritative. Profiling is ON only when the
 * account holder affirmatively enabled it; not-yet-answered and read-failure
 * both resolve to FALSE (opt-in; the shared device cookie is never inherited
 * for a signed-in user — see resolvePersonalizationConsent).
 */
export async function resolvePersonalizationConsentForViewer(
  client: TypedSupabaseClient,
  viewer: UnifiedViewer,
): Promise<boolean> {
  const accountValue = await readAccountPersonalizationFlag(
    client,
    viewer.user.id,
  );
  return resolvePersonalizationConsent({ accountValue });
}
