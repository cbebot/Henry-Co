import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPaymentVerificationSnapshotForTrackingCode } from "@/lib/payments/verification";
import { isCareCardCheckoutReady } from "@/lib/payments/card-rail";
import { CareCardCheckoutLauncher } from "@/components/care/card-checkout-launcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Care · Secure card payment",
  robots: { index: false, follow: false },
};

/**
 * /pay/[trackingCode]/card — start a card charge for the booking's open payment
 * request on the proven rail. The page does NO money work (a prefetch can never start
 * a charge): it checks the gate + booking state, then hands off to the client launcher
 * that POSTs to /api/care/pay/card. The payer returns to /pay/[trackingCode], where the
 * request reconciles to paid from provider-confirmed truth.
 */
export default async function CareCardCheckoutPage({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode } = await params;
  const code = trackingCode.trim().toUpperCase();

  if (!isCareCardCheckoutReady()) notFound();

  let snapshot: Awaited<ReturnType<typeof getPaymentVerificationSnapshotForTrackingCode>> | null = null;
  try {
    snapshot = await getPaymentVerificationSnapshotForTrackingCode(code);
  } catch {
    snapshot = null;
  }
  if (!snapshot || !snapshot.requestId) notFound();
  if (snapshot.requestStatus === "paid" || snapshot.requestStatus === "cancelled") {
    redirect(`/pay/${encodeURIComponent(code)}`);
  }

  return (
    <CareCardCheckoutLauncher
      trackingCode={code}
      amountMajor={snapshot.balanceDue || snapshot.amountDue}
      currency={snapshot.currency || "NGN"}
      label={snapshot.requestNo ? `Care booking ${snapshot.requestNo}` : "Care booking"}
    />
  );
}
