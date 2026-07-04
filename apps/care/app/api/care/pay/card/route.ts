import { NextResponse, type NextRequest } from "next/server";
import { resolveRequestOrigin } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { isCareCardCheckoutReady, startCareCardCharge } from "@/lib/payments/card-rail";

export const runtime = "nodejs";

/**
 * POST /api/care/pay/card — start a card charge for a care booking's open payment
 * request. A POST (never a GET) so a prefetch can never start a charge. Access mirrors
 * the pay page's own model (the tracking code IS the capability); the card option
 * requires the booking to be linked to a customer account (`payment_intents.user_id`
 * is NOT NULL — guests keep the transfer path). Provider never named in the response.
 */
export async function POST(request: NextRequest) {
  if (!isCareCardCheckoutReady()) {
    return NextResponse.json({ error: "Card payment is not available." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { trackingCode?: string } | null;
  const code = typeof body?.trackingCode === "string" ? body.trackingCode.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ error: "Missing booking." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: booking } = await admin
    .from("care_bookings")
    .select("id, customer_id, email, tracking_code")
    .eq("tracking_code", code)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  const bookingRow = booking as { id: string; customer_id: string | null; email: string | null };
  if (!bookingRow.customer_id) {
    // Guest booking — the intent is user-owned, so card needs a linked account.
    return NextResponse.json(
      { error: "Card payment needs a Henry Onyx account. Use the transfer details, or sign up with your booking email." },
      { status: 409 },
    );
  }

  const { data: paymentRequest } = await admin
    .from("care_payment_requests")
    .select("id, status, amount_due, currency")
    .eq("booking_id", bookingRow.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const requestRow = paymentRequest as { id: string; status: string; amount_due: number; currency: string | null } | null;
  if (!requestRow) {
    return NextResponse.json({ error: "No payment is due on this booking." }, { status: 404 });
  }
  if (requestRow.status === "paid") {
    return NextResponse.json({ done: true, redirectUrl: `/pay/${code}` }, { status: 200 });
  }
  if (requestRow.status === "cancelled") {
    return NextResponse.json({ error: "This payment is closed." }, { status: 409 });
  }

  const origin = resolveRequestOrigin((name) => request.headers.get(name), request.nextUrl.origin);
  const returnTo = `${origin}/pay/${encodeURIComponent(code)}`;

  const started = await startCareCardCharge(
    {
      bookingId: bookingRow.id,
      customerId: bookingRow.customer_id,
      trackingCode: code,
      requestId: requestRow.id,
      amountMajor: Number(requestRow.amount_due || 0),
      currency: requestRow.currency || "NGN",
      customerEmail: bookingRow.email,
    },
    returnTo,
  );

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
  return NextResponse.json({ redirectUrl: `/pay/${code}`, pending: true }, { status: 200 });
}
