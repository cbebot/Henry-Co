import type { Metadata } from "next";
import { notFound } from "next/navigation";

// V2-PAYMENT-UNIFICATION: Property's /pay route is a wired entrypoint
// awaiting a payment data model (viewing fees, listing fees, escrow
// deposits — none currently persisted in property_*  tables). The
// canonical surface is imported here so the wiring is in place; replace
// the notFound() with a real data fetch + buildPaymentSurfaceContext
// call once the property finance schema lands. The package contract
// (PaymentSurfaceContext) is the only thing the data adapter must
// produce.
import { PaymentSurface as _PaymentSurface } from "@henryco/payment-surface";
void _PaymentSurface;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Property · Payment workspace",
  description: "Track property payment workflows once the finance pipeline goes live.",
  robots: { index: false, follow: false },
};

export default async function PropertyPaymentWorkspace({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  await params; // exhaust the promise so Next doesn't warn
  notFound();
}
