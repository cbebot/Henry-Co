import Link from "next/link";
import type { Metadata } from "next";
import { createDivisionMetadata } from "@henryco/config";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { DEFAULT_RATE_CARDS } from "@/lib/logistics/pricing";
import { formatCurrency } from "@/lib/env";

export const metadata: Metadata = createDivisionMetadata("logistics", {
  title: "Pricing | HenryCo Logistics",
  description: "Zone-based logistics pricing with indicative rate cards and promise windows.",
  path: "/pricing",
});

export const revalidate = 300;

export default async function PricingPage() {
  const { zones, rateCards } = await getPublicLogisticsSnapshot();
  const cards = rateCards.length > 0 ? rateCards : DEFAULT_RATE_CARDS;

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Pricing that stays honest</h1>
          <p className="mt-3 max-w-2xl text-[var(--logistics-muted)]">
            Base fees combine your zone with a service rate card, then weight, size, urgency, and fragile handling layer
            in predictably. Final quotes may still be confirmed by dispatch for edge cases.
          </p>
        </div>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Zones</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {zones.map((z) => (
              <article key={z.id} className="rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] p-5">
                <h3 className="text-lg font-semibold text-white">{z.name}</h3>
                <p className="mt-2 text-sm text-[var(--logistics-muted)]">{z.summary}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-white/45">Base from</dt>
                    <dd className="font-medium text-white">{formatCurrency(z.baseFee)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/45">Typical window</dt>
                    <dd className="font-medium text-white">
                      {z.etaHoursMin}–{z.etaHoursMax}h
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">Indicative rate cards</h2>
          <p className="mt-2 text-sm text-[var(--logistics-muted)]">
            Amounts are combined with zone base fees during booking. Values shown in NGN.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--logistics-line)] text-[var(--logistics-muted)]">
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium">Urgency</th>
                  <th className="pb-3 pr-4 font-medium">Base add-on</th>
                  <th className="pb-3 pr-4 font-medium">Per kg</th>
                  <th className="pb-3 font-medium">Fragile</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--logistics-line)]/60">
                    <td className="py-3 pr-4 capitalize text-white">{c.serviceType.replaceAll("_", " ")}</td>
                    <td className="py-3 pr-4 capitalize text-[var(--logistics-muted)]">{c.urgency}</td>
                    <td className="py-3 pr-4 text-white">{formatCurrency(c.baseAmount)}</td>
                    <td className="py-3 pr-4 text-[var(--logistics-muted)]">{formatCurrency(c.weightFeePerKg)}</td>
                    <td className="py-3 text-[var(--logistics-muted)]">{formatCurrency(c.fragileFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Link href="/book" className="inline-flex rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white">
          Start a booking
        </Link>
      </div>
    </main>
  );
}
