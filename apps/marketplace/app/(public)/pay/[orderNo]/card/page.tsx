import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getOrderByNumber } from "@/lib/marketplace/data";
import { isMarketplaceCardCheckoutReady } from "@/lib/checkout/card-rail";
import { CardCheckoutLauncher } from "@/components/marketplace/card-checkout-launcher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Marketplace · Secure card payment",
  robots: { index: false, follow: false },
};

/**
 * /pay/[orderNo]/card — start a card charge for the order on the proven rail.
 *
 * The page itself does NO money work (so a prefetch can't start a charge): it
 * checks ownership + the test-mode gate, then hands off to a client launcher that
 * POSTs to /api/checkout/card and follows the opaque hosted-checkout action. The
 * buyer returns to /pay/[orderNo], where the order is reconciled to paid.
 */
export default async function MarketplaceCardCheckoutPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const { orderNo } = await params;

  // Test-mode gate — production (flag unset) or a non-operable env has no card route.
  if (!isMarketplaceCardCheckoutReady()) notFound();

  const [order, viewer] = await Promise.all([getOrderByNumber(orderNo), getMarketplaceViewer()]);
  if (!order) notFound();

  const owns =
    viewer.user?.email && order.buyerEmail
      ? viewer.user.email.toLowerCase() === order.buyerEmail.toLowerCase()
      : false;
  if (!owns) notFound();

  // Already settled, or no longer awaiting payment → send to the status page.
  if (order.paymentStatus === "verified" || order.status !== "awaiting_payment") {
    redirect(`/pay/${order.orderNo}`);
  }

  return (
    <CardCheckoutLauncher
      orderNo={order.orderNo}
      amountMajor={order.grandTotal}
      currency={order.currency || "NGN"}
    />
  );
}
