import type { Metadata } from "next";
import { notFound } from "next/navigation";

// V2-PAYMENT-UNIFICATION: Logistics' /pay route is a wired entrypoint
// awaiting a payment data model (business booking deposits, customer
// dispatch payments — currently the logistics quote/booking flow
// doesn't persist a payment record). The canonical surface import
// below proves the package wiring; replace the notFound() with a real
// data fetch + buildPaymentSurfaceContext call once the logistics
// billing schema lands.
import { PaymentSurface as _PaymentSurface } from "@henryco/payment-surface";
void _PaymentSurface;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Logistics · Payment workspace",
  description: "Track logistics dispatch payments once the finance pipeline goes live.",
  robots: { index: false, follow: false },
};

export default async function LogisticsPaymentWorkspace({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  await params;
  notFound();
}
