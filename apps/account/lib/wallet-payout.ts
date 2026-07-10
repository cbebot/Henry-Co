import "server-only";

import { createPaymentRouter } from "@henryco/payment-router";
import { callPaymentRpc } from "@/lib/payments/db";
import type { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-MONEY-PAYOUT (W3 initiate side) — the automatic withdrawal flow: reserve the balance,
 * resolve the destination account, create the Flutterwave transfer. The transfer webhook
 * (settle/release, already wired) is the money truth; nothing here marks a withdrawal paid.
 *
 * Flag-dark: `WALLET_AUTO_PAYOUT=1` turns it on. Off (or any prerequisite missing — no bank
 * code on the payout method, no configured provider) the request simply stays in the manual
 * `pending_review` flow, byte-identical to today. Fail-closed everywhere: money only moves
 * through the guarded payments_private RPCs, and a hold is NEVER released on an UNKNOWN
 * provider outcome (the transfer may exist at the provider — releasing would let the same
 * money be spent twice while the transfer still pays out).
 */

type Admin = ReturnType<typeof createAdminSupabase>;

export function isWalletAutoPayoutEnabled(): boolean {
  return process.env.WALLET_AUTO_PAYOUT === "1";
}

/**
 * The rolling-24h sum feeding the daily cap: pending + in-flight + paid all count (a released
 * failure/cancel does not — that money came back). Best-effort: on a read error return the cap
 * itself so the limit check FAILS CLOSED rather than waving a capped user through.
 */
export async function getWindowWithdrawnKobo(admin: Admin, userId: string, capKobo: number): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("customer_wallet_withdrawal_requests")
    .select("amount_kobo, status, created_at")
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) return capKobo; // fail closed — never assume headroom on a broken read
  return (data ?? []).reduce((sum, row) => {
    const status = String((row as { status?: string }).status || "").toLowerCase();
    if (["rejected", "cancelled", "failed"].includes(status)) return sum;
    return sum + Math.max(0, Number((row as { amount_kobo?: number }).amount_kobo) || 0);
  }, 0);
}

/** Merge (never replace) the request row's metadata — a bare update would clobber the
 *  `requested_from` marker the route wrote and anything the settle/release RPCs merged. */
async function mergeRequestMetadata(
  admin: Admin,
  requestId: string,
  patch: Record<string, unknown>,
  status?: string,
): Promise<void> {
  const { data } = await admin
    .from("customer_wallet_withdrawal_requests")
    .select("metadata")
    .eq("id", requestId)
    .maybeSingle();
  const current = ((data as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<string, unknown>;
  const update: Record<string, unknown> = { metadata: { ...current, ...patch } };
  if (status) update.status = status;
  await admin.from("customer_wallet_withdrawal_requests").update(update as never).eq("id", requestId);
}

export type AutoPayoutOutcome =
  /** The transfer is on its way (or reserved and resolving) — status is `processing`. */
  | { mode: "auto" }
  /** Auto-payout not possible for this method/env — the request stays in the manual review flow. */
  | { mode: "manual" }
  /** The request was refused and closed (nothing moved, or the hold was safely released). */
  | { mode: "rejected"; error: string };

/**
 * Run the automatic payout for a just-inserted withdrawal request. Order is deliberate:
 * resolve the destination BEFORE reserving (a bad account never holds money), and after a
 * successful reserve only a DEFINITIVE provider rejection releases the hold.
 */
export async function startAutomaticPayout(input: {
  admin: Admin;
  requestId: string;
  userId: string;
  amountKobo: number;
}): Promise<AutoPayoutOutcome> {
  const { admin, requestId, amountKobo } = input;

  // 1) The destination account. The NIP bank code rides in the payout method's metadata
  //    (captured at add time); without it Flutterwave cannot address the bank → manual flow.
  const { data: reqRow } = await admin
    .from("customer_wallet_withdrawal_requests")
    .select("payout_method_id")
    .eq("id", requestId)
    .maybeSingle();
  const methodId = (reqRow as { payout_method_id?: string } | null)?.payout_method_id;
  if (!methodId) return { mode: "manual" };

  const { data: method } = await admin
    .from("customer_payout_methods")
    .select("account_number, account_name, currency, metadata")
    .eq("id", methodId)
    .maybeSingle();
  const accountNumber = String((method as { account_number?: string } | null)?.account_number || "").trim();
  const metadata = ((method as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<string, unknown>;
  const bankCode = String(metadata.bank_code || "").trim();
  const currency = String((method as { currency?: string } | null)?.currency || "NGN").toUpperCase();
  if (!accountNumber || !bankCode || currency !== "NGN") return { mode: "manual" };

  const adapter = createPaymentRouter().getAdapter("flutterwave");
  if (!adapter?.createTransfer || !adapter.resolveBankAccount) return { mode: "manual" };

  // 2) Resolve the account name BEFORE any money moves — a payout is never sent to an account
  //    the bank cannot resolve. A resolve failure is not a user error we can explain, so the
  //    request falls back to human review rather than being rejected.
  const resolved = await adapter.resolveBankAccount({ accountNumber, bankCode });
  if (!resolved.ok) {
    await mergeRequestMetadata(admin, requestId, { auto_payout: "resolve_failed" });
    return { mode: "manual" };
  }

  // 3) Reserve — the single-winner atomic hold (balance -= amount; DR wallet-liability /
  //    CR withdrawals_payable). Insufficient balance closes the request; nothing moved.
  const reserved = await callPaymentRpc<{ reserved?: boolean; reason?: string }>("reserve_withdrawal", [requestId]);
  if (reserved.error) return { mode: "manual" }; // RPC unreachable → stay manual, nothing moved
  if (reserved.data?.reserved !== true) {
    await mergeRequestMetadata(admin, requestId, { auto_payout: reserved.data?.reason || "not_reservable" }, "cancelled");
    return { mode: "rejected", error: "Your available balance no longer covers this withdrawal." };
  }

  // 4) Create the transfer. reference = the request id, so the provider dedups any retry and the
  //    webhook resolves back to this exact request. A create is never "paid" — the webhook is.
  const transfer = await adapter.createTransfer({
    reference: requestId,
    amountMinor: amountKobo,
    currency: "NGN",
    accountNumber,
    bankCode,
    narration: "Henry Onyx withdrawal",
  });

  if (transfer.ok) {
    await mergeRequestMetadata(admin, requestId, {
      auto_payout: "transfer_created",
      provider_reference: transfer.value.providerReference,
      resolved_account_name: resolved.value.accountName,
    });
    return { mode: "auto" };
  }

  // 5) Create failed. ONLY a definitive (non-retryable) rejection proves the transfer does not
  //    exist — release the hold and close the request. A retryable/unknown failure (network,
  //    5xx) keeps the hold and stays `processing`: the transfer may have been accepted, and the
  //    webhook (or a verify sweep) is the only safe resolver. Never release on unknown.
  if (!transfer.error.retryable) {
    await callPaymentRpc("release_withdrawal", [requestId, "transfer_rejected"]);
    return { mode: "rejected", error: "We couldn't start this payout. Nothing left your wallet — please try again." };
  }
  await mergeRequestMetadata(admin, requestId, { auto_payout: "transfer_unconfirmed" });
  return { mode: "auto" };
}
