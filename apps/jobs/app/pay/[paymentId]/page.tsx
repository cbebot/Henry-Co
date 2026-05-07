import type { Metadata } from "next";
import { notFound } from "next/navigation";

// V2-PAYMENT-UNIFICATION: Jobs' /pay route is a wired entrypoint
// awaiting a payment data model (employer plan invoices, sponsored
// post fees — none currently persisted in jobs_*  tables). The
// canonical surface import below proves the package wiring; replace
// the notFound() with a real data fetch + buildPaymentSurfaceContext
// call once the jobs billing schema lands. The data adapter only
// needs to produce a PaymentSurfaceContext.
import { PaymentSurface as _PaymentSurface } from "@henryco/payment-surface";
void _PaymentSurface;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Jobs · Payment workspace",
  description: "Track employer plan payments once jobs billing goes live.",
  robots: { index: false, follow: false },
};

export default async function JobsPaymentWorkspace({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  await params;
  notFound();
}
