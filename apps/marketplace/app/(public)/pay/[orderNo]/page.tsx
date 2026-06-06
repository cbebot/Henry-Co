import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PaymentSurface,
  buildPaymentRecordView,
  buildPaymentSurfaceContext,
} from "@henryco/payment-surface";
import type {
  PaymentSurfaceContext,
  PaymentSurfaceTheme,
} from "@henryco/payment-surface";
import { translateSurfaceLabel } from "@henryco/i18n/server";

import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getOrderByNumber } from "@/lib/marketplace/data";
import { getMarketplacePaymentRail } from "@/lib/marketplace/payment";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Marketplace · Payment workspace",
  description:
    "Track and verify the bank-transfer payment for your Henry Onyx Marketplace order.",
  robots: { index: false, follow: false },
};

const MARKETPLACE_THEME: PaymentSurfaceTheme = {
  accentVar: "var(--market-brass, var(--home-accent))",
  heroTone: "spotlight",
  rootStyle: {
    ["--payment-accent" as never]: "var(--market-brass, var(--home-accent))",
    ["--payment-ink" as never]: "var(--market-ink, var(--home-ink))",
    ["--payment-soft" as never]: "var(--market-muted, var(--home-ink-70))",
    ["--payment-line" as never]: "var(--market-line-strong, var(--home-line-15))",
    ["--payment-surface" as never]: "var(--home-surface-04)",
  } as CSSProperties,
};

/**
 * /pay/[orderNo] — canonical marketplace payment workspace.
 *
 * V2-PAYMENT-UNIFICATION: status-first surface for an existing
 * marketplace order. Reads the order's payment record (created during
 * checkout) and renders the canonical PaymentSurface with the
 * appropriate state — pending/processing/paid/failed. The marketplace
 * checkout flow is the canonical proof intake (POST /api/marketplace
 * with intent=cart_submit), so this surface omits the upload form to
 * avoid forking the verification pipeline. Customers needing a
 * re-upload after rejection are routed to support via the bottom rail.
 */
export default async function MarketplacePaymentWorkspace({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;
  const [order, viewer, rail, locale] = await Promise.all([
    getOrderByNumber(orderNo),
    getMarketplaceViewer(),
    getMarketplacePaymentRail(),
    getMarketplacePublicLocale(),
  ]);
  if (!order) notFound();

  const isOwner =
    viewer.user?.email && order.buyerEmail
      ? viewer.user.email.toLowerCase() === order.buyerEmail.toLowerCase()
      : false;
  if (!isOwner) {
    notFound();
  }

  const proof = order.paymentRecord;
  const paymentLabel = `Order ${order.orderNo}`;
  const trackHref = `/track/${order.orderNo}`;

  // V3-13 provider-router seam. Gated on MOCK_PAYMENT so production — where the
  // flag is never set — ships no card CTA and therefore no dead link to the
  // not-yet-built card route. The live card page + provider arrive in
  // V3-14/15/16; this is the reference wire the other five pay surfaces copy.
  const cardCta =
    process.env.MOCK_PAYMENT === "1"
      ? { label: translateSurfaceLabel(locale, "Pay with card"), href: `/pay/${order.orderNo}/card` }
      : null;

  const ctx: PaymentSurfaceContext = buildPaymentSurfaceContext({
    payment: buildPaymentRecordView({
      id: proof?.id ?? order.id,
      label: paymentLabel,
      amount: order.grandTotal,
      currency: order.currency || "NGN",
      status: order.paymentStatus,
      dueDate: null,
      proofName: proof?.proofName ?? null,
      proofUrl: proof?.proofUrl ?? null,
      updatedAt: proof?.verifiedAt ?? proof?.submittedAt ?? order.placedAt,
      reference: order.orderNo,
    }),
    record: {
      title: paymentLabel,
      subtitle: order.shippingCity ? `Shipping to ${order.shippingCity}` : undefined,
      back: { href: trackHref, label: "Order tracking" },
      account: { href: "/account/orders", label: "All orders" },
      primaryCta: { href: trackHref, label: "Open tracking" },
    },
    platform: {
      bankName: rail.bankName,
      accountName: rail.accountName,
      accountNumber: rail.accountNumber,
      supportEmail: rail.supportEmail,
      supportWhatsApp: rail.supportWhatsApp,
    },
    copy: {
      bodyByStatus: {
        paid: "Payment confirmed. Your order is in escrow until fulfillment lands.",
        processing:
          "Payment proof is in review. Finance verifies bank transfers within one business day — this page updates automatically.",
        pending:
          "Send the order total to the verified company account below. After transfer, contact support so the proof can be re-attached.",
        failed:
          "We couldn't match the previous transfer. Open a support thread so finance can re-verify or accept a fresh proof.",
      },
      guideTitle: "Send the order total using the verified company account",
      proofHint:
        "If you need to re-attach a receipt after rejection, open a support thread from the bottom rail — keeping all proofs on the same record helps finance verify quickly.",
      receiptText:
        "Confirmed on {date}.{proof} Your order moved to escrow and the seller is preparing dispatch.",
    },
    theme: MARKETPLACE_THEME,
    cardCta,
  });

  return <PaymentSurface ctx={ctx} />;
}
