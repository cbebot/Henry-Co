import type { Metadata } from "next";
import BookRequestForm from "@/components/booking/BookRequestForm";
import { getLogisticsZones } from "@/lib/logistics/data";

export const metadata: Metadata = {
  title: "Book a delivery | HenryCo Logistics",
  description: "Submit a pickup and delivery request with governed pricing and live tracking.",
};

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const zones = await getLogisticsZones();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Book a delivery</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--logistics-muted)] sm:text-base">
          Tell us who is sending, who is receiving, and where we should meet both sides. You will receive a tracking
          code immediately and can follow milestones as dispatch progresses.
        </p>
        <div className="mt-8">
          <BookRequestForm zones={zones} defaultMode="book" />
        </div>
      </div>
    </main>
  );
}
