import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { callPaymentRpc } from "@/lib/payments/db";
import {
  reconcileDivisionSale,
  type DivisionSaleAttempt,
  type DivisionSaleIntent,
  type DivisionSaleReconcilePort,
  type SaleReconcileOutcome,
} from "@henryco/payment-router";
import { extractTaxFromBreakdown, type PricingBreakdown } from "@henryco/pricing";

type AdminClient = ReturnType<typeof createAdminSupabase>;

/** Domain status vocabulary for a marketplace CARD payment record. */
const CARD_RECORD_STATUS = {
  /** Created, awaiting a confirmed charge — the reconciler's claimable initial phase. */
  pending: "awaiting_payment",
  /** Claimed by the single settlement winner — transient "settling in progress". */
  settling: "settling",
  /** Settled: revenue allocated, receipt minted, order moved to escrow. */
  verified: "verified",
} as const;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** FEE_LINE_CODES the receipt treats as buyer-facing fees (mirrors V3-18 split). */
const FEE_LINE_CODES = new Set(["platform_fee", "service_fee", "inspection_fee", "payout_fee"]);

/**
 * The order's money facts, in kobo, derived ONCE from the order row + its persisted
 * pricing breakdown. The breakdown amounts are MAJOR naira (marketplace feeds the
 * engine major units), so every part is ×100 into kobo here. Today the breakdown
 * carries no `tax` line (the V3-21 tax engine is not live) → outputVat 0; the path
 * is forward-correct the day a tax line appears.
 */
function deriveOrderMoney(grandTotalMajor: number, breakdown: PricingBreakdown | null): {
  grossMinor: number;
  outputVatMinor: number;
  feesMinor: number;
  subtotalMinor: number;
  lineItems: Array<{ label: string; amountMinor: number }>;
} {
  const grossMinor = Math.round(Math.max(0, grandTotalMajor) * 100);
  const tax = extractTaxFromBreakdown(breakdown);
  const outputVatMinor = tax ? Math.round(Math.max(0, tax.taxMinor) * 100) : 0;
  let feesMinor = 0;
  const lineItems: Array<{ label: string; amountMinor: number }> = [];
  if (breakdown && Array.isArray(breakdown.lines)) {
    for (const line of breakdown.lines) {
      const amountMinor = Math.round(Number(line.amount?.amount ?? 0) * 100);
      if (FEE_LINE_CODES.has(line.code)) feesMinor += Math.max(0, amountMinor);
      lineItems.push({ label: String(line.label ?? line.code), amountMinor });
    }
  }
  // The receipt reconciles to the gross BY CONSTRUCTION: subtotal = gross − fees − tax.
  const subtotalMinor = Math.max(0, grossMinor - feesMinor - outputVatMinor);
  return { grossMinor, outputVatMinor, feesMinor, subtotalMinor, lineItems };
}

interface OrderContext {
  orderId: string;
  orderNo: string;
  userId: string;
  currency: string;
  grossMinor: number;
  outputVatMinor: number;
  feesMinor: number;
  subtotalMinor: number;
  lineItems: Array<{ label: string; amountMinor: number }>;
}

/**
 * Supabase admin-client implementation of {@link DivisionSaleReconcilePort} for a
 * single marketplace order. Thin DB I/O only — all idempotency/race logic lives in
 * the unit-tested `reconcileDivisionSale`. Every status mutation is a guarded
 * compare-and-swap; this port writes ONLY marketplace order/payment rows and the
 * EXISTING guarded `post_sale_revenue` / `record_customer_receipt` money RPCs. It
 * never writes `payment_intents.status`.
 */
class SupabaseMarketplaceSalePort implements DivisionSaleReconcilePort {
  constructor(
    private readonly admin: AdminClient,
    private readonly ctx: OrderContext,
  ) {}

  async listClaimable(): Promise<DivisionSaleAttempt[]> {
    const res = await this.admin
      .from("marketplace_payment_records")
      .select("id, reference, status")
      .eq("order_no", this.ctx.orderNo)
      .eq("method", "card")
      .in("status", [CARD_RECORD_STATUS.pending, CARD_RECORD_STATUS.settling])
      .order("created_at", { ascending: false });
    const rows = (res.data ?? []) as Array<{ id: string; reference: string; status: string }>;
    return rows.map((r) => ({
      id: String(r.id),
      reference: String(r.reference),
      grossMinor: this.ctx.grossMinor,
      outputVatMinor: this.ctx.outputVatMinor,
      currency: this.ctx.currency,
      phase: r.status === CARD_RECORD_STATUS.settling ? "settling" : "pending",
    }));
  }

  async findIntentByReference(reference: string): Promise<DivisionSaleIntent | null> {
    const res = await this.admin
      .from("payment_intents")
      .select("id, status, amount_minor, currency")
      .eq("user_id", this.ctx.userId)
      .eq("idempotency_key", reference)
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

  async claim(attemptId: string): Promise<boolean> {
    const res = await this.admin
      .from("marketplace_payment_records")
      .update({ status: CARD_RECORD_STATUS.settling } as never)
      .eq("id", attemptId)
      .eq("status", CARD_RECORD_STATUS.pending) // CAS: only awaiting_payment→settling wins
      .select("id")
      .maybeSingle();
    return Boolean(res.data && (res.data as { id?: string }).id);
  }

  async revertClaim(attemptId: string): Promise<void> {
    await this.admin
      .from("marketplace_payment_records")
      .update({ status: CARD_RECORD_STATUS.pending } as never)
      .eq("id", attemptId)
      .eq("status", CARD_RECORD_STATUS.settling);
  }

  /** The sale-revenue ledger entry exists iff post_sale_revenue posted for this intent. */
  async saleEntryExists(intentId: string): Promise<boolean> {
    const res = await this.admin
      .from("journal_entries")
      .select("id")
      .eq("source", "sale_revenue")
      .eq("source_event_id", intentId)
      .maybeSingle();
    return Boolean(res.data && (res.data as { id?: string }).id);
  }

  /** The charge-settlement posting (source='payment_intent') created in the SAME txn as 'succeeded'. */
  private async settlementPostingId(intentId: string): Promise<string | null> {
    const res = await this.admin
      .from("journal_entries")
      .select("id")
      .eq("source", "payment_intent")
      .eq("source_event_id", intentId)
      .maybeSingle();
    return (res.data as { id?: string } | null)?.id ?? null;
  }

  /**
   * The money edge: allocate the received gross from clearing into revenue (+ output
   * VAT) via the guarded `payments_private.post_sale_revenue`. Idempotent by the
   * intent (UNIQUE source='sale_revenue', intent). A DB error throws so the reconciler
   * releases the claim and retries cleanly — the allocation is balanced-by-construction
   * in the DB, so a retry can never post a second or unbalanced entry.
   */
  async applySaleSettlement(input: { attempt: DivisionSaleAttempt; intentId: string }): Promise<{ settled: boolean }> {
    const { data, error } = await callPaymentRpc<{ posted?: boolean; reason?: string }>("post_sale_revenue", [
      input.intentId,
      String(this.ctx.grossMinor),
      String(this.ctx.outputVatMinor),
    ]);
    if (error) throw new Error(error.message || "sale revenue post failed");
    return { settled: (data as { posted?: boolean } | null)?.posted === true };
  }

  /**
   * Finalize: mint the ledger-tied receipt (idempotent, best-effort — a missing
   * receipt never holds the order hostage) and move the order to paid/escrow with a
   * guarded CAS. Runs on EVERY completion path (fresh settle, crash recovery,
   * defensive), so the receipt + paid-state are reached however the reconcile got here.
   */
  async finalizeSettled(input: { attempt: DivisionSaleAttempt; intentId: string }): Promise<void> {
    // (1) Ledger-tied receipt — bound to the settlement posting; total ties to its
    //     debit (= gross). Best-effort: idempotent on the posting, so a transient
    //     failure is re-minted on a later reconcile; it must never block the paid flip.
    try {
      const postingId = await this.settlementPostingId(input.intentId);
      if (postingId) {
        await callPaymentRpc("record_customer_receipt", [
          this.ctx.userId,
          "marketplace",
          input.intentId,
          postingId,
          "card",
          input.attempt.reference,
          String(this.ctx.subtotalMinor),
          String(this.ctx.feesMinor),
          String(this.ctx.outputVatMinor),
          String(this.ctx.grossMinor),
          "NGN",
          JSON.stringify(this.ctx.lineItems),
          new Date().toISOString(),
          null,
        ]);
      }
    } catch {
      /* receipt is best-effort and idempotent — never blocks the order */
    }

    // (2) Move the order to paid/escrow — guarded so a re-run is a no-op.
    await this.admin
      .from("marketplace_orders")
      .update({ status: "paid_held", payment_status: "verified" } as never)
      .eq("id", this.ctx.orderId)
      .neq("payment_status", "verified");
    await this.admin
      .from("marketplace_order_groups")
      .update({ payment_status: "verified", payout_status: "paid_held" } as never)
      .eq("order_id", this.ctx.orderId)
      .neq("payment_status", "verified");
    await this.admin
      .from("marketplace_payment_records")
      .update({ status: CARD_RECORD_STATUS.verified, verified_at: new Date().toISOString() } as never)
      .eq("id", input.attempt.id);
  }
}

/**
 * Reconcile-on-read entry point: complete any confirmed card payment for an order.
 * Idempotent and safe to call on every /pay status load — a confirmed charge settles
 * exactly once; an unconfirmed one self-heals on a later pass; a non-card or already
 * paid order is a no-op. The money truth was recorded by the webhook, so a buyer who
 * never returns is settled the moment anyone next views the order — never stranded.
 */
export async function reconcileMarketplaceOrder(orderNo: string): Promise<SaleReconcileOutcome | null> {
  const admin = createAdminSupabase();
  const orderRes = await admin
    .from("marketplace_orders")
    .select("id, user_id, currency, grand_total, payment_status, pricing_breakdown")
    .eq("order_no", orderNo)
    .maybeSingle();
  const order = (orderRes.data ?? null) as
    | {
        id: string;
        user_id: string;
        currency: string | null;
        grand_total: number | null;
        payment_status: string | null;
        pricing_breakdown: unknown;
      }
    | null;
  if (!order || !order.user_id) return null;
  if (order.payment_status === "verified") return null; // already paid — nothing to do

  const breakdown = (asObject(order.pricing_breakdown) as unknown as PricingBreakdown) || null;
  const money = deriveOrderMoney(Number(order.grand_total) || 0, breakdown);

  const ctx: OrderContext = {
    orderId: String(order.id),
    orderNo,
    userId: String(order.user_id),
    currency: (order.currency || "NGN").toUpperCase(),
    grossMinor: money.grossMinor,
    outputVatMinor: money.outputVatMinor,
    feesMinor: money.feesMinor,
    subtotalMinor: money.subtotalMinor,
    lineItems: money.lineItems,
  };
  const port = new SupabaseMarketplaceSalePort(admin, ctx);
  return reconcileDivisionSale(port);
}
