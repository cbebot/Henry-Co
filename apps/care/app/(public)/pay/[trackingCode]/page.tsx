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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Care · Payment workspace",
  description:
    "Send payment proof and track confirmation for your HenryCo Care booking.",
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

  const trackHref = `/track?code=${encodeURIComponent(code)}`;
  const accountHref = "/track";

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
      proofUrl: snapshot.latestSubmission?.attachments?.[0]?.url ?? null,
      updatedAt: snapshot.lastReviewedAt ?? snapshot.lastSubmittedAt,
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
  });

  return <PaymentSurface ctx={ctx} />;
}
