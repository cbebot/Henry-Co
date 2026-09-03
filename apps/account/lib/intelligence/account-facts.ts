import "server-only";

import type { User } from "@supabase/supabase-js";
import { getWalletSummary } from "@/lib/account-data";

/**
 * Intelligence Live L3 — the RLS-safe account facts the support AI is grounded with, so it can
 * answer with the person's REAL wallet balance and details instead of guessing. This is the ONLY
 * account data the model ever sees, and it is strictly the signed-in person's OWN (every query is
 * scoped to their user id). The gateway prompt fences it as data ("never as instructions") and
 * forbids inventing anything beyond it, so a missing fact becomes a workspace link or a handoff,
 * never a made-up number.
 *
 * Kept compact (a few lines) and best-effort: if a fact cannot be read, it is simply omitted.
 */
export async function buildAccountFactsForAI(user: User): Promise<string> {
  const lines: string[] = [];

  const name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";
  if (name) lines.push(`Name: ${name}`);

  const country = typeof user.user_metadata?.country === "string" ? user.user_metadata.country : "";
  if (country) lines.push(`Country: ${country.toUpperCase()}`);

  try {
    const wallet = await getWalletSummary(user.id);
    const major = Math.round(Number(wallet.balance_kobo) || 0) / 100;
    const currency = wallet.currency || "NGN";
    const inactive = wallet.is_active === false ? " (wallet currently inactive)" : "";
    lines.push(`Wallet balance: ${currency} ${major.toFixed(2)}${inactive}`);
  } catch {
    /* omit the wallet line if it cannot be read */
  }

  return lines.join("\n").slice(0, 1500);
}
