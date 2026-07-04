import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getStudioViewer } from "@/lib/studio/auth";
import { getPaymentWorkspace } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { getStudioLoginUrl } from "@/lib/studio/links";
import { isStudioCardCheckoutReady } from "@/lib/studio/card-rail";
import { StudioCardCheckoutLauncher } from "@/components/studio/card-checkout-launcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Studio · Secure card payment",
  robots: { index: false, follow: false },
};

/**
 * /pay/[paymentId]/card — start a card charge for a studio payment on the proven rail.
 *
 * The page itself does NO money work (so a prefetch can never start a charge): it
 * enforces the pay page's own access gate plus a signed-in user, then hands off to the
 * client launcher that POSTs to /api/studio/pay/card and follows the opaque
 * hosted-checkout action. The client returns to /pay/[paymentId], where the payment
 * reconciles to paid from provider-confirmed truth.
 */
export default async function StudioCardCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { paymentId } = await params;
  const { access } = await searchParams;
  const accessKey = access?.trim() || null;

  if (!isStudioCardCheckoutReady()) notFound();

  const [viewer, snapshot] = await Promise.all([getStudioViewer(), getStudioSnapshot()]);
  if (!viewer.user) {
    redirect(getStudioLoginUrl(`/pay/${paymentId}/card${accessKey ? `?access=${accessKey}` : ""}`));
  }

  const workspace = await getPaymentWorkspace({ paymentId, accessKey, viewer, snapshot });
  if (!workspace) notFound();

  const { payment } = workspace;
  if (payment.status === "paid" || payment.status === "cancelled") {
    redirect(`/pay/${payment.id}${accessKey ? `?access=${accessKey}` : ""}`);
  }

  return (
    <StudioCardCheckoutLauncher
      paymentId={payment.id}
      accessKey={accessKey}
      amountMajor={payment.amount}
      currency={payment.currency || "NGN"}
      label={payment.label || "Studio payment"}
    />
  );
}
