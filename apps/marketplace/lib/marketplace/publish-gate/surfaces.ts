// V3-MKT-TRUST-01 — what the seller pages need to draw the gate. SERVER ONLY.
//
// One loader per page, null when MARKETPLACE_INSTANT_PUBLISH is off — the pages
// then render exactly what they rendered before. Everything a seller reads comes
// out of the typed copy; this module only joins it to the store's facts.

import "server-only";

import { getAccountUrl } from "@henryco/config";
import { getMarketplaceTrustCopy, type AppLocale, type MarketplaceTrustCopy } from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";
import { formatVendorMoney } from "../vendor/money";
import { isInstantPublishEnabled } from "./flag";
import { readStoredGate } from "./listing-row";
import { describeReasons, type DescribedReason } from "./messages";
import { payoutBlockCode, readPayoutGate } from "./payout";
import { probationProgress, type ProbationProgress, type SellerGateState } from "./seller-state";
import { readSellerGateState } from "./server";

export type ListingStatusKey = keyof MarketplaceTrustCopy["status"];

export interface ListingGateView {
  status: ListingStatusKey;
  label: string;
  /** Why it is not live (empty for a live listing or a plain draft). */
  reasons: DescribedReason[];
  /** For a listing taken down after it was live: what the seller can do. */
  hint: string | null;
}

export interface VendorGateSurface {
  copy: MarketplaceTrustCopy;
  /** Null when the gate is not installed on this database. */
  seller: SellerGateState | null;
  progress: ProbationProgress | null;
  /** Open take-downs, by product id. */
  hides: Map<string, { kind: "policy" | "reports" | "risk"; reasons: string[] }>;
  verifyHref: string;
  money: (naira: number) => string;
}

/** Null when instant publish is off. */
export async function loadVendorGateSurface(
  vendorId: string | null | undefined,
  locale: AppLocale,
): Promise<VendorGateSurface | null> {
  if (!isInstantPublishEnabled()) return null;
  const copy = getMarketplaceTrustCopy(locale);
  const base: VendorGateSurface = {
    copy,
    seller: null,
    progress: null,
    hides: new Map(),
    verifyHref: getAccountUrl("/verification"),
    money: (naira: number) => formatVendorMoney(Math.round(naira * 100), locale),
  };
  if (!vendorId) return base;

  try {
    const admin = createAdminSupabase();
    const [state, hides] = await Promise.all([
      readSellerGateState(admin, vendorId, null),
      admin
        .from("marketplace_listing_enforcement")
        .select("product_id, kind, reasons")
        .eq("vendor_id", vendorId)
        .eq("status", "active"),
    ]);
    base.seller = state.state;
    base.progress = state.state ? probationProgress(state.state) : null;
    for (const row of (hides.data ?? []) as Array<{ product_id: string; kind: string; reasons: string[] | null }>) {
      if (row.kind === "policy" || row.kind === "reports" || row.kind === "risk") {
        base.hides.set(String(row.product_id), { kind: row.kind, reasons: row.reasons ?? [] });
      }
    }
  } catch {
    // The pages still render: status falls back to what the row itself says.
  }
  return base;
}

/** How one listing stands, in the seller's words. */
export function listingGateView(
  surface: VendorGateSurface,
  product: { id: string; approvalStatus: string; filterData: unknown },
  locale: AppLocale,
): ListingGateView {
  const { copy } = surface;
  const caps = surface.seller?.probation.caps ?? null;
  const stored = readStoredGate(product.filterData);
  const hide = surface.hides.get(product.id) ?? null;

  if (product.approvalStatus === "approved") {
    return { status: "live", label: copy.status.live, reasons: [], hint: null };
  }

  if (hide) {
    // A take-down after the listing was live. A policy take-down clears itself
    // when the seller fixes the listing; the other two wait for a person.
    const reasons = describeReasons({ reasons: hide.reasons, caps, locale, copy });
    const fallback =
      hide.kind === "reports"
        ? [{ code: "enforcement_hold_active" as const, label: copy.hide.reportsReason, fix: copy.hide.reviewHint }]
        : hide.kind === "risk"
          ? [{ code: "risk_hold_active" as const, label: copy.hide.riskReason, fix: copy.hide.reviewHint }]
          : [];
    return {
      status: "hidden",
      label: copy.status.hidden,
      reasons: reasons.length > 0 ? reasons : fallback,
      hint: hide.kind === "policy" ? copy.hide.fixHint : copy.hide.reviewHint,
    };
  }

  if (product.approvalStatus === "rejected") {
    return {
      status: "rejected",
      label: copy.status.rejected,
      reasons: describeReasons({ reasons: stored.reasons, caps, locale, copy }),
      hint: null,
    };
  }

  if (product.approvalStatus === "under_review" || product.approvalStatus === "submitted") {
    return {
      status: "held",
      label: copy.status.held,
      reasons: describeReasons({ reasons: stored.reasons, caps, locale, copy }),
      hint: null,
    };
  }

  return {
    status: "draft",
    label: copy.status.draft,
    // A draft the gate handed back (a cap was reached) still says why.
    reasons: stored.outcome === "reject" ? describeReasons({ reasons: stored.reasons, caps, locale, copy }) : [],
    hint: null,
  };
}

export interface PayoutGateView {
  blocked: boolean;
  /** `identity-required` | `risk-hold` | … — the same codes the route redirects with. */
  code: string | null;
  title: string;
  body: string;
  /** Only for the identity case. */
  verifyHref: string | null;
  verifyLabel: string;
}

/** The payout wall as the seller sees it before pressing the button. Null when the flag is off. */
export async function loadPayoutGateView(
  vendorId: string | null | undefined,
  locale: AppLocale,
): Promise<PayoutGateView | null> {
  if (!isInstantPublishEnabled() || !vendorId) return null;
  const copy = getMarketplaceTrustCopy(locale).payout;
  const gate = await readPayoutGate(createAdminSupabase(), { vendorId, actorId: null, stage: "view" });
  if (!gate.available || !gate.blocked) return null;
  const code = payoutBlockCode(gate.reasons);
  return {
    blocked: true,
    code,
    title: copy.blockedTitle,
    body: payoutBlockDetail(code, locale) ?? copy.unavailableBody,
    verifyHref: code === "identity-required" ? getAccountUrl("/verification") : null,
    verifyLabel: copy.verifyCta,
  };
}

/** Seller-facing sentence for a payout refusal code the route redirected with. */
export function payoutBlockDetail(code: string, locale: AppLocale): string | undefined {
  const copy = getMarketplaceTrustCopy(locale).payout;
  switch (code) {
    case "identity-required":
      return copy.identityBody;
    case "risk-hold":
      return copy.riskHoldBody;
    case "eligibility-unavailable":
    case "request-failed":
      return copy.unavailableBody;
    default:
      return undefined;
  }
}

/** Finance-facing sentence for a blocked payout decision. */
export function financePayoutBlockDetail(code: string | null | undefined, locale: AppLocale): string | null {
  const copy = getMarketplaceTrustCopy(locale).payout;
  switch (code) {
    case "payout-identity-required":
      return copy.financeIdentityBlocked;
    case "payout-risk-hold":
      return copy.financeRiskBlocked;
    case "payout-eligibility-unavailable":
    case "payout-decision-failed":
    case "payout-missing-vendor":
      return copy.unavailableBody;
    default:
      return null;
  }
}

/** The four strings the application wizard swaps in. Null when the flag is off. */
export function sellerWizardInstantCopy(locale: AppLocale): {
  documentsOptional: string;
  optionalBadge: string;
  reviewNote: string;
  submitLabel: string;
} | null {
  if (!isInstantPublishEnabled()) return null;
  const copy = getMarketplaceTrustCopy(locale).onboarding;
  return {
    documentsOptional: copy.documentsOptional,
    optionalBadge: copy.optionalBadge,
    reviewNote: copy.reviewNote,
    submitLabel: copy.submitLabel,
  };
}
