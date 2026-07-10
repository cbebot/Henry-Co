import "server-only";

import { createPaymentRouter } from "@henryco/payment-router";
import { callPaymentRpc } from "@/lib/payments/db";
import { isMissingPostgrestResourceError } from "@/lib/wallet-storage";
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
  // A legacy environment without the modern table is NOT a broken read — the legacy insert path
  // (customer_wallet_transactions) is about to handle this request; blocking it here would brick
  // legacy withdrawals with a false "daily limit" message. Window = 0 there.
  if (error && isMissingPostgrestResourceError(error)) return 0;
  if (error) return capKobo; // genuine read failure — fail closed, never assume headroom
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
  /** The rail took the request. `confirmed` = the transfer create was positively acknowledged;
   *  false = outcome unknown (hold kept, webhook/ops resolve) — the copy must hedge. */
  | { mode: "auto"; confirmed: boolean }
  /** Auto-payout not possible for this method/env — the request stays in the manual review flow. */
  | { mode: "manual" }
  /** The request was refused and closed (nothing moved, or the hold was safely released). */
  | { mode: "rejected"; error: string };

/**
 * Release is allowed ONLY on outcomes that PROVE the transfer was never created. Never derived
 * from `retryable` (retryability says "safe to repeat", not "never happened"): a 2xx with an
 * unreadable body or a missing id is non-retryable-looking yet the transfer may exist.
 *
 * Valid ONLY for this single-shot flow (a FRESH reference, first create attempt). A future
 * re-drive/sweep MUST NOT reuse this set: on a re-used reference, a `flutterwave_rejected`
 * envelope can mean "duplicate reference" — i.e. the transfer EXISTS — so a sweep must verify
 * by reference and never release on a rejection.
 */
const PROVEN_NOT_CREATED = new Set([
  "flutterwave_rejected", // parsed 2xx envelope error on a fresh reference (declined before creation)
  "flutterwave_transfer_missing_account", // local validation — no API call was made
  "flutterwave_unsupported_currency", // local validation — no API call was made
  "flutterwave_http_400",
  "flutterwave_http_401",
  "flutterwave_http_403",
  "flutterwave_http_404",
  "flutterwave_http_422",
]);

/** Loose holder-name check: shares at least one substantive (3+ letter) name token. Tolerates
 *  ordering/middle names ("ONAH HENRY CHUKWUEMEKA" vs "Henry Onah"); catches a total stranger. */
function namesLooselyMatch(expected: string, resolved: string): boolean {
  const tokens = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3);
  const expectedTokens = new Set(tokens(expected));
  return tokens(resolved).some((token) => expectedTokens.has(token));
}

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

  // 2b) The bank's holder name must loosely match the name on the payout method — a mistyped
  //     account number that resolves to a valid STRANGER must never be paid automatically.
  //     Mismatch → human review (the resolved name is recorded for the reviewer).
  const expectedName = String((method as { account_name?: string } | null)?.account_name || "").trim();
  if (expectedName && !namesLooselyMatch(expectedName, resolved.value.accountName)) {
    await mergeRequestMetadata(admin, requestId, {
      auto_payout: "resolve_name_mismatch",
      resolved_account_name: resolved.value.accountName,
    });
    return { mode: "manual" };
  }

  // 3) Reserve — the single-winner atomic hold (balance -= amount; DR wallet-liability /
  //    CR withdrawals_payable). The RPC is idempotent, so an RPC transport error (which can
  //    strike AFTER the commit) is retried once — a committed reserve answers `duplicate`.
  let reserved = await callPaymentRpc<{ reserved?: boolean; reason?: string }>("reserve_withdrawal", [requestId]);
  if (reserved.error) {
    reserved = await callPaymentRpc<{ reserved?: boolean; reason?: string }>("reserve_withdrawal", [requestId]);
  }
  if (reserved.error) {
    // Twice unreachable: the reserve MAY have committed (hold live, status processing) or not
    // (still pending_review). Both states are visible to ops via this marker; never assume.
    await mergeRequestMetadata(admin, requestId, { auto_payout: "reserve_unknown" });
    return { mode: "auto", confirmed: false };
  }
  if (reserved.data?.reserved !== true) {
    if (reserved.data?.reason === "insufficient_funds") {
      // Nothing moved (the SQL left it pending_review); close the request cleanly.
      await mergeRequestMetadata(admin, requestId, { auto_payout: "insufficient_funds" }, "cancelled");
      return { mode: "rejected", error: "Your available balance no longer covers this withdrawal." };
    }
    // not_reservable: the row is not in a fresh state (another actor touched it). Never rewrite
    // its status from the app layer — record the observation and leave it to review.
    await mergeRequestMetadata(admin, requestId, { auto_payout: reserved.data?.reason || "not_reservable" });
    return { mode: "manual" };
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
    return { mode: "auto", confirmed: true };
  }

  // 5) Create failed. Release the hold ONLY on an outcome that PROVES the transfer was never
  //    created (the whitelist above) — never on "not retryable", which includes created-but-
  //    unreadable responses. Anything else keeps the hold as `processing`: the transfer may
  //    have been accepted, and the webhook (or ops via the provider dashboard) is the only
  //    safe resolver. Never release on unknown.
  if (PROVEN_NOT_CREATED.has(transfer.error.code)) {
    await callPaymentRpc("release_withdrawal", [requestId, "transfer_rejected"]);
    return { mode: "rejected", error: "We couldn't start this payout. Nothing left your wallet — please try again." };
  }
  await mergeRequestMetadata(admin, requestId, { auto_payout: "transfer_unconfirmed" });
  return { mode: "auto", confirmed: false };
}
