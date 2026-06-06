import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";
import {
  reconcileWalletTopups,
  TOPUP_FUNDING_STATUS,
  TOPUP_LEDGER_REFERENCE_TYPE,
  type IntentRow,
  type TopupRequest,
  type WalletTopupReconcilePort,
} from "@/lib/wallet-topup";

type AdminClient = ReturnType<typeof createAdminSupabase>;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function formatNgnMajor(amountKobo: number): string {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
      Math.round(amountKobo / 100),
    );
  } catch {
    return `NGN ${Math.round(amountKobo / 100).toLocaleString()}`;
  }
}

/**
 * Supabase admin-client implementation of {@link WalletTopupReconcilePort}.
 *
 * Thin DB I/O only — all idempotency/race logic lives in the unit-tested
 * `reconcileWalletTopups`. Every status mutation is a guarded compare-and-swap
 * (`.eq(column, expectedValue)`) so the same row can never be processed twice,
 * mirroring the house wallet-mutation pattern (studio→wallet checkout).
 *
 * This port writes ONLY wallet-side rows (funding requests, the wallet balance,
 * the wallet ledger). It never writes `payment_intents.status` (D3) and never
 * touches the payments money functions — it only READS the confirmed intent.
 */
export class SupabaseWalletTopupPort implements WalletTopupReconcilePort {
  private readonly admin: AdminClient;
  private walletId: string | null = null;

  constructor(admin: AdminClient = createAdminSupabase()) {
    this.admin = admin;
  }

  async listClaimable(userId: string): Promise<TopupRequest[]> {
    const res = await this.admin
      .from("customer_wallet_funding_requests")
      .select("id, amount_kobo, currency, payment_reference, status, metadata")
      .eq("user_id", userId)
      .in("status", [TOPUP_FUNDING_STATUS.pending, TOPUP_FUNDING_STATUS.crediting])
      .order("created_at", { ascending: true });
    const rows = (res.data ?? []) as Array<{
      id: string;
      amount_kobo: number;
      currency: string | null;
      payment_reference: string;
      status: string;
      metadata: unknown;
    }>;
    return rows
      .filter((r) => asObject(r.metadata).rail_topup === true)
      .map((r) => ({
        id: String(r.id),
        amountKobo: Number(r.amount_kobo) || 0,
        currency: r.currency || "NGN",
        paymentReference: String(r.payment_reference),
        status: String(r.status),
        railTopup: true,
      }));
  }

  async findIntentByReference(userId: string, paymentReference: string): Promise<IntentRow | null> {
    const res = await this.admin
      .from("payment_intents")
      .select("id, status, amount_minor, currency")
      .eq("user_id", userId)
      .eq("idempotency_key", paymentReference)
      .maybeSingle();
    const row = (res.data ?? null) as
      | { id: string; status: string; amount_minor: number; currency: string }
      | null;
    if (!row) return null;
    return {
      id: String(row.id),
      status: String(row.status),
      amountMinor: Number(row.amount_minor) || 0,
      currency: row.currency || "NGN",
    };
  }

  async claim(requestId: string): Promise<boolean> {
    const res = await this.admin
      .from("customer_wallet_funding_requests")
      .update({ status: TOPUP_FUNDING_STATUS.crediting, updated_at: new Date().toISOString() } as never)
      .eq("id", requestId)
      .eq("status", TOPUP_FUNDING_STATUS.pending) // CAS: only the pending→crediting transition wins
      .select("id")
      .maybeSingle();
    return Boolean(res.data && (res.data as { id?: string }).id);
  }

  async revertClaim(requestId: string): Promise<void> {
    await this.admin
      .from("customer_wallet_funding_requests")
      .update({ status: TOPUP_FUNDING_STATUS.pending, updated_at: new Date().toISOString() } as never)
      .eq("id", requestId)
      .eq("status", TOPUP_FUNDING_STATUS.crediting);
  }

  async ledgerExists(requestId: string): Promise<boolean> {
    const res = await this.admin
      .from("customer_wallet_transactions")
      .select("id")
      .eq("reference_type", TOPUP_LEDGER_REFERENCE_TYPE)
      .eq("reference_id", requestId)
      .maybeSingle();
    return Boolean(res.data && (res.data as { id?: string }).id);
  }

  private async ensureWallet(userId: string): Promise<{ id: string; balanceKobo: number }> {
    const existing = await this.admin
      .from("customer_wallets")
      .select("id, balance_kobo")
      .eq("user_id", userId)
      .maybeSingle();
    let row = existing.data as { id: string; balance_kobo: number } | null;
    if (!row) {
      const inserted = await this.admin
        .from("customer_wallets")
        .insert({ user_id: userId } as never)
        .select("id, balance_kobo")
        .single();
      if (inserted.error) {
        const retry = await this.admin
          .from("customer_wallets")
          .select("id, balance_kobo")
          .eq("user_id", userId)
          .maybeSingle();
        row = retry.data as { id: string; balance_kobo: number } | null;
      } else {
        row = inserted.data as { id: string; balance_kobo: number };
      }
    }
    if (!row) throw new Error("wallet_unavailable");
    this.walletId = String(row.id);
    return { id: String(row.id), balanceKobo: Number(row.balance_kobo) || 0 };
  }

  async readBalanceKobo(userId: string): Promise<number> {
    const wallet = await this.ensureWallet(userId);
    return wallet.balanceKobo;
  }

  async casCredit(userId: string, expectedKobo: number, nextKobo: number): Promise<boolean> {
    const res = await this.admin
      .from("customer_wallets")
      .update({ balance_kobo: nextKobo, updated_at: new Date().toISOString() } as never)
      .eq("user_id", userId)
      .eq("balance_kobo", expectedKobo) // CAS: lost-update protection
      .select("id")
      .maybeSingle();
    return Boolean(res.data && (res.data as { id?: string }).id);
  }

  async insertCreditLedger(input: {
    userId: string;
    requestId: string;
    amountKobo: number;
    balanceAfterKobo: number;
    intentId: string;
  }): Promise<void> {
    const walletId = this.walletId ?? (await this.ensureWallet(input.userId)).id;
    await this.admin.from("customer_wallet_transactions").insert({
      wallet_id: walletId,
      user_id: input.userId,
      type: "credit",
      amount_kobo: input.amountKobo,
      balance_after_kobo: input.balanceAfterKobo,
      description: `Wallet top-up — ${formatNgnMajor(input.amountKobo)}`,
      status: "completed",
      reference_type: TOPUP_LEDGER_REFERENCE_TYPE,
      reference_id: input.requestId,
      metadata: {
        source: "wallet_topup_rail",
        payment_intent_id: input.intentId,
      },
    } as never);
  }

  async finalizeVerified(requestId: string, intentId: string | null): Promise<void> {
    const current = await this.admin
      .from("customer_wallet_funding_requests")
      .select("metadata")
      .eq("id", requestId)
      .maybeSingle();
    const metadata = asObject((current.data as { metadata?: unknown } | null)?.metadata);
    await this.admin
      .from("customer_wallet_funding_requests")
      .update({
        status: TOPUP_FUNDING_STATUS.verified,
        verified_at: new Date().toISOString(),
        metadata: { ...metadata, credited: true, payment_intent_id: intentId ?? metadata.payment_intent_id ?? null },
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", requestId);
  }

  async onCredited(input: { request: TopupRequest; intentId: string; balanceAfterKobo: number }): Promise<void> {
    const amountLabel = formatNgnMajor(input.request.amountKobo);
    try {
      await this.admin.from("customer_activity").insert({
        user_id: await this.resolveUserId(input.request.id),
        division: "wallet",
        activity_type: "wallet_topup_credited",
        title: `Wallet topped up — ${amountLabel}`,
        description: "Your card payment was confirmed and your wallet balance is updated.",
        amount_kobo: input.request.amountKobo,
        status: "completed",
        reference_type: TOPUP_LEDGER_REFERENCE_TYPE,
        reference_id: input.request.id,
        action_url: "/wallet",
        metadata: { payment_intent_id: input.intentId },
      } as never);
    } catch {
      /* activity feed is best-effort — never blocks the credit */
    }
  }

  /** Resolve the owning user of a funding request (for the activity row). */
  private async resolveUserId(requestId: string): Promise<string | null> {
    const res = await this.admin
      .from("customer_wallet_funding_requests")
      .select("user_id")
      .eq("id", requestId)
      .maybeSingle();
    return (res.data as { user_id?: string } | null)?.user_id ?? null;
  }
}

/**
 * Run the wallet top-up reconciler for a user with a notification side effect.
 * Returns the credited list so callers (the /wallet load + the sync route) can
 * reflect the new balance immediately.
 */
export async function reconcileWalletTopupsForUser(
  userId: string,
  userEmailDivision: { notify?: boolean } = { notify: true },
): Promise<{ creditedKobo: number; creditedCount: number }> {
  const port = new SupabaseWalletTopupPort();
  const outcome = await reconcileWalletTopups(userId, port);

  let creditedKobo = 0;
  for (const c of outcome.credited) creditedKobo += c.amountKobo;

  if (userEmailDivision.notify && outcome.credited.length > 0) {
    try {
      await publishNotification({
        userId,
        division: "account",
        eventType: "wallet.transaction.update",
        severity: "info",
        title: "Wallet topped up",
        body: `Your wallet balance is updated — ${formatNgnMajor(creditedKobo)} added.`,
        deepLink: "/wallet",
        relatedType: TOPUP_LEDGER_REFERENCE_TYPE,
        publisher: "bridge:apps/account/lib/wallet-topup-port",
      });
    } catch {
      /* notification is best-effort */
    }
  }

  return { creditedKobo, creditedCount: outcome.credited.length };
}
