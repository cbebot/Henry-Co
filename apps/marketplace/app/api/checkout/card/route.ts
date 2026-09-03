import { NextResponse, type NextRequest } from "next/server";
import { resolveRequestOrigin } from "@henryco/config";

import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getOrderByNumber } from "@/lib/marketplace/data";
import {
  isMarketplaceCardCheckoutReady,
  startMarketplaceCardCheckout,
} from "@/lib/checkout/card-rail";

export const runtime = "nodejs";

/**
 * POST /api/checkout/card — start a card charge for an existing marketplace order
 * on the proven payment rail (V3-DIVISION-CHECKOUT-01). A POST (never a GET) so a
 * Link prefetch / crawler can never start a charge; the buyer's card launcher calls
 * it once and follows the returned opaque action to hosted checkout. The provider
 * is never named in the response (Principle 9).
 */
export async function POST(request: NextRequest) {
  // TEST-MODE gate (+ the pooled money path must be configured to settle the result).
  if (!isMarketplaceCardCheckoutReady()) {
    return NextResponse.json({ error: "Card payment is not available." }, { status: 404 });
  }

  const viewer = await getMarketplaceViewer();
  if (!viewer.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { orderNo?: string } | null;
  const orderNo = typeof body?.orderNo === "string" ? body.orderNo.trim() : "";
  if (!orderNo) {
    return NextResponse.json({ error: "Missing order." }, { status: 400 });
  }

  const order = await getOrderByNumber(orderNo);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Ownership: only the buyer may start their order's payment.
  const owns =
    viewer.user.email && order.buyerEmail
      ? viewer.user.email.toLowerCase() === order.buyerEmail.toLowerCase()
      : false;
  if (!owns) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Already settled, or no longer awaiting payment → nothing to start.
  if (order.paymentStatus === "verified") {
    return NextResponse.json({ done: true, redirectUrl: `/pay/${order.orderNo}` }, { status: 200 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: "This order is not awaiting payment." }, { status: 409 });
  }

  // Bring the buyer back to THIS order's status page after hosted checkout. Absolute
  // + trusted (the account callback re-validates it before redirecting cross-app).
  const origin = resolveRequestOrigin((name) => request.headers.get(name), request.nextUrl.origin);
  const returnTo = `${origin}/pay/${order.orderNo}`;

  const started = await startMarketplaceCardCheckout({
    order: {
      id: order.id,
      orderNo: order.orderNo,
      grandTotalMajor: order.grandTotal,
      currency: order.currency || "NGN",
    },
    userId: viewer.user.id,
    customerEmail: viewer.user.email,
    returnTo,
  });

  if (!started.ok) {
    const message =
      started.reason === "no_provider"
        ? "No card payment method is available right now."
        : started.reason === "amount"
          ? "This order total can't be charged to a card."
          : "We couldn't start card payment. Please try again.";
    return NextResponse.json({ error: message }, { status: started.reason === "no_provider" ? 422 : 502 });
  }

  // Opaque client action: a hosted-checkout redirect, or 'none' (no hosted page —
  // the buyer waits on the status page while the charge confirms out of band).
  if (started.clientAction.type === "redirect") {
    return NextResponse.json({ redirectUrl: started.clientAction.url }, { status: 200 });
  }
  return NextResponse.json({ redirectUrl: `/pay/${order.orderNo}`, pending: true }, { status: 200 });
}
