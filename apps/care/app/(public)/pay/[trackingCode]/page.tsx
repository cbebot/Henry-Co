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

import { getPaymentVerificationSnapshotForTrackingCode } from "@/lib/payments/verification";
import {
  getCareBookingIdentityForCard,
  isCareBankTransferRetired,
  isCareCardCheckoutReady,
  reconcileCareCardPayment,
} from "@/lib/payments/card-rail";
import { signCareMediaUrl } from "@/lib/care-media-store";
import { getCarePublicLocale } from "@/lib/locale-server";
import { translateSurfaceLabel } from "@henryco/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Care · Payment workspace",
  description:
    "Send payment proof and track confirmation for your Henry Onyx Care booking.",
  robots: { index: false, follow: false },
};

const CARE_THEME: PaymentSurfaceTheme = {
  accentVar: "var(--care-accent, #6b7cff)",
  heroTone: "ink",
  rootStyle: {
    ["--payment-accent" as never]: "var(--care-accent, #6b7cff)",
    ["--payment-ink" as never]: "var(--care-text, #071226)",
    ["--payment-soft" as never]: "var(--care-muted, rgba(7,18,38,0.66))",
    ["--payment-line" as never]: "var(--care-border, rgba(16,27,70,0.1))",
    ["--payment-surface" as never]: "var(--care-bg-elevated, rgba(255,255,255,0.84))",
  } as CSSProperties,
};

/**
 * /pay/[trackingCode] — canonical care payment workspace.
 *
 * V2-PAYMENT-UNIFICATION: surfaces a care booking's payment-verification
 * snapshot through the canonical PaymentSurface. Care's existing
 * tracking-page proof flow remains the canonical proof intake — the
 * brief explicitly asked us not to fork the underlying payment data
 * model — so this surface is read-only here and links back to /track
 * for proof submission. The data adapter normalizes the care
 * verification status enum into the shared PaymentStatus space (see
 * `packages/payment-surface/src/adapter.ts`).
 */
export default async function CarePaymentWorkspace({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode } = await params;
  const code = trackingCode.trim().toUpperCase();
  let snapshot: Awaited<ReturnType<typeof getPaymentVerificationSnapshotForTrackingCode>> | null = null;
  try {
    snapshot = await getPaymentVerificationSnapshotForTrackingCode(code);
  } catch {
    snapshot = null;
  }
  if (!snapshot) notFound();

  // Card-rail reconcile on the payer's return (flag-gated; a no-op otherwise): a
  // provider-confirmed intent settles through care's guarded RPC — refresh the
  // snapshot when it lands so this render shows the paid truth.
  if (isCareCardCheckoutReady() && snapshot.requestId) {
    const booking = await getCareBookingIdentityForCard(code);
    if (booking) {
      const outcome = await reconcileCareCardPayment({
        bookingId: booking.bookingId,
        requestId: snapshot.requestId,
        requestStatus: snapshot.requestStatus ?? "",
        amountMajor: snapshot.balanceDue || snapshot.amountDue,
        currency: snapshot.currency || "NGN",
        customerId: booking.customerId,
      }).catch(() => "unchanged" as const);
      if (outcome === "paid") {
        try {
          snapshot = await getPaymentVerificationSnapshotForTrackingCode(code);
        } catch {
          /* keep the pre-reconcile snapshot; the next load shows paid */
        }
        if (!snapshot) notFound();
      }
    }
  }

  const trackHref = `/track?code=${encodeURIComponent(code)}`;
  const accountHref = "/track";

  // The receipt attachment is now a `media://private/...` reference (legacy
  // rows are absolute URLs); sign it server-side before it reaches the client.
  const proofUrl = await signCareMediaUrl(
    snapshot.latestSubmission?.attachments?.[0]?.url ?? "",
  );

  // The card option rides beside transfer (flag-dark) — only for customer-linked
  // bookings (the payment intent is user-owned); /card does the POST-only start.
  const locale = await getCarePublicLocale();
  const requestOpen =
    Boolean(snapshot.requestId) &&
    snapshot.requestStatus !== "paid" &&
    snapshot.requestStatus !== "cancelled";
  const cardIdentity = isCareCardCheckoutReady() && requestOpen ? await getCareBookingIdentityForCard(code) : null;
  const cardCta =
    cardIdentity?.customerId
      ? {
          label: translateSurfaceLabel(locale, "Pay with card"),
          href: `/pay/${encodeURIComponent(code)}/card`,
        }
      : null;

  const ctx: PaymentSurfaceContext = buildPaymentSurfaceContext({
    payment: buildPaymentRecordView({
      id: snapshot.requestId ?? code,
      label: snapshot.requestNo ? `Care booking ${snapshot.requestNo}` : "Care booking",
      amount: snapshot.balanceDue || snapshot.amountDue,
      currency: snapshot.currency || "NGN",
      status: snapshot.verificationStatus,
      statusLabel: snapshot.verificationLabel,
      dueDate: null,
      proofName: snapshot.latestSubmission?.attachments?.[0]?.fileName ?? null,
      proofUrl: proofUrl || null,
      updatedAt: snapshot.lastReviewedAt ?? snapshot.lastSubmittedAt,
      reference: snapshot.requestNo ?? code,
    }),
    record: {
      title: snapshot.customerName || "Care booking",
      subtitle:
        snapshot.serviceFamily === "garment"
          ? "Garment care"
          : snapshot.serviceFamily === "home"
            ? "Home cleaning"
            : "Office cleaning",
      back: { href: trackHref, label: "Booking timeline" },
      account: { href: accountHref, label: "Care tracking" },
      primaryCta: { href: trackHref, label: "Open booking timeline" },
    },
    platform: {
      bankName: null, // sourced from /track UI; this surface stays read-only
      accountName: null,
      accountNumber: null,
      supportEmail: snapshot.supportEmail,
      supportWhatsApp: snapshot.supportWhatsApp,
    },
    copy: {
      bodyByStatus: {
        paid: "Payment confirmed. Your booking moves to the next stage automatically.",
        processing:
          "Proof received. Care finance verifies bank transfers within one business day — this page updates automatically.",
        pending:
          "Open the booking timeline to send your transfer proof — Care's tracking flow is the canonical proof intake so all evidence stays on the booking record.",
        failed:
          "We need a corrected proof. Open the booking timeline to attach a fresh receipt and add a note about what changed.",
      },
      guideTitle: "Send your booking payment using the verified company account",
      proofHint:
        "Care's tracking page is the canonical place to submit and resubmit proofs — the verified record stays on your booking timeline.",
      receiptText:
        "Confirmed on {date}.{proof} Your booking advanced to the next service stage automatically.",
    },
    theme: CARE_THEME,
    cardCta,
    // Card-first when transfer is retired (interlocked to a ready card rail).
    cardOnly: isCareBankTransferRetired(),
  });

  return <PaymentSurface ctx={ctx} />;
}
