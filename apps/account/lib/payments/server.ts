import "server-only";
import type { PaymentProviderKey } from "@henryco/payment-router/types";
import type { createAdminSupabase } from "@/lib/supabase";

type AdminClient = ReturnType<typeof createAdminSupabase>;

/**
 * Resolve the provider that actually charged an intent, from its single
 * `status='succeeded'` routing attempt (Q2). Failover means the winner may not
 * be the first-tried provider, so the succeeded attempt — not country
 * preference — is the only honest source of truth for refund/finalize, and the
 * G4 reconciliation anchor.
 *
 * Fails LOUD: returns null on any ambiguity (missing/duplicate succeeded
 * attempt, or a winner with no reference) so the caller refuses to act rather
 * than guess which provider holds the money. `.maybeSingle()` surfaces a second
 * succeeded row as an error — exactly the money-invariant breach we want noisy.
 */
export async function resolveProviderFromSucceededAttempt(
  admin: AdminClient,
  intentId: string,
): Promise<{ provider: PaymentProviderKey; providerReference: string } | null> {
  const res = await admin
    .from("payment_attempts")
    .select("provider, provider_reference")
    .eq("intent_id", intentId)
    .eq("status", "succeeded")
    .maybeSingle();
  const row = res.data as { provider: string; provider_reference: string | null } | null;
  if (res.error || !row || !row.provider_reference) return null;
  return {
    provider: row.provider as PaymentProviderKey,
    providerReference: row.provider_reference,
  };
}
