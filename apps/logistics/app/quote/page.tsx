import type { Metadata } from "next";
import BookRequestForm from "@/components/booking/BookRequestForm";
import { getLogisticsZones } from "@/lib/logistics/data";

export const metadata: Metadata = {
  title: "Request a quote | HenryCo Logistics",
  description: "Get an indicative logistics quote before you commit to a booking.",
};

export const dynamic = "force-dynamic";

export default async function QuotePage() {
  const zones = await getLogisticsZones();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Request a quote</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--logistics-muted)] sm:text-base">
          We price from your lane, service type, and parcel profile. Quotes are saved with a tracking reference so you
          can upgrade to a full booking without retyping everything.
        </p>
        <div className="mt-8">
          <BookRequestForm zones={zones} defaultMode="quote" />
        </div>
      </div>
    </main>
  );
}
