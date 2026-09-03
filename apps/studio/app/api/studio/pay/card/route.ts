import { NextResponse, type NextRequest } from "next/server";
import { resolveRequestOrigin } from "@henryco/config";

import { getStudioViewer } from "@/lib/studio/auth";
import { getPaymentWorkspace } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { isStudioCardCheckoutReady, startStudioCardCharge } from "@/lib/studio/card-rail";

export const runtime = "nodejs";

/**
 * POST /api/studio/pay/card — start a card charge for a studio payment on the proven
 * rail. A POST (never a GET) so a prefetch/crawler can never start a charge. Access is
 * EXACTLY the pay page's own gate (`getPaymentWorkspace`: authenticated owner or the
 * project access key) plus a signed-in user (the intent is user-owned); the provider is
 * never named in the response.
 */
export async function POST(request: NextRequest) {
  if (!isStudioCardCheckoutReady()) {
    return NextResponse.json({ error: "Card payment is not available." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { paymentId?: string; accessKey?: string }
    | null;
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
  const accessKey = typeof body?.accessKey === "string" && body.accessKey.trim() ? body.accessKey.trim() : null;
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment." }, { status: 400 });
  }

  const [viewer, snapshot] = await Promise.all([getStudioViewer(), getStudioSnapshot()]);
  if (!viewer.user) {
    return NextResponse.json({ error: "Sign in to pay by card." }, { status: 401 });
  }

  const workspace = await getPaymentWorkspace({ paymentId, accessKey, viewer, snapshot });
  if (!workspace) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const { payment } = workspace;
  if (payment.status === "paid") {
    return NextResponse.json({ done: true, redirectUrl: `/pay/${payment.id}` }, { status: 200 });
  }
  if (payment.status === "cancelled") {
    return NextResponse.json({ error: "This payment is closed." }, { status: 409 });
  }

  const origin = resolveRequestOrigin((name) => request.headers.get(name), request.nextUrl.origin);
  const returnTo = `${origin}/pay/${payment.id}${accessKey ? `?access=${encodeURIComponent(accessKey)}` : ""}`;

  const started = await startStudioCardCharge({
    payment: {
      id: payment.id,
      label: payment.label || "Studio payment",
      amount: payment.amount,
      currency: payment.currency || "NGN",
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
          ? "This amount can't be charged to a card."
          : "We couldn't start card payment. Please try again.";
    return NextResponse.json({ error: message }, { status: started.reason === "no_provider" ? 422 : 502 });
  }

  if (started.clientAction.type === "redirect") {
    return NextResponse.json({ redirectUrl: started.clientAction.url }, { status: 200 });
  }
  return NextResponse.json({ redirectUrl: `/pay/${payment.id}`, pending: true }, { status: 200 });
}
