import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { DEFAULT_RATE_CARDS } from "@/lib/logistics/pricing";
import { formatCurrency } from "@/lib/env";

export const metadata: Metadata = {
  title: "Pricing | HenryCo Logistics",
  description: "Zone-based logistics pricing with indicative rate cards and promise windows.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { zones, rateCards } = await getPublicLogisticsSnapshot();
  const cards = rateCards.length > 0 ? rateCards : DEFAULT_RATE_CARDS;

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <header>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
            Pricing
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-[2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
            Honest from base to final.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)] sm:text-lg">
            Base fee combines your zone with a service rate card; weight, size, urgency, and
            fragile handling layer on predictably. Dispatch may confirm final numbers only on
            genuine edge cases.
          </p>
        </header>

        <section>
          <div className="flex items-baseline gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Zones
            </p>
            <span className="h-px flex-1 bg-[var(--logistics-line)]" />
          </div>
          <ul className="mt-6 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
            {zones.map((z) => (
              <li key={z.id} className="grid gap-5 py-6 md:grid-cols-[0.4fr,1fr,0.4fr,0.4fr]">
                <div>
                  <h3 className="text-[1.05rem] font-semibold tracking-tight text-white">
                    {z.name}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--logistics-muted)]">
                  {z.summary}
                </p>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Base from
                  </p>
                  <p className="mt-1 text-base font-semibold tracking-tight text-white">
                    {formatCurrency(z.baseFee)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Typical window
                  </p>
                  <p className="mt-1 text-base font-semibold tracking-tight text-white">
                    {z.etaHoursMin}–{z.etaHoursMax}h
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-baseline gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Indicative rate cards
            </p>
            <span className="h-px flex-1 bg-[var(--logistics-line)]" />
          </div>
          <p className="mt-4 max-w-2xl text-sm text-[var(--logistics-muted)]">
            Amounts are combined with zone base fees during booking. Values shown in NGN.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--logistics-line)] text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-muted)]">
                  <th className="pb-3 pr-4 font-semibold">Service</th>
                  <th className="pb-3 pr-4 font-semibold">Urgency</th>
                  <th className="pb-3 pr-4 font-semibold">Base add-on</th>
                  <th className="pb-3 pr-4 font-semibold">Per kg</th>
                  <th className="pb-3 font-semibold">Fragile</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--logistics-line)]/60 transition hover:bg-white/[0.02]"
                  >
                    <td className="py-4 pr-4 font-semibold capitalize text-white">
                      {c.serviceType.replaceAll("_", " ")}
                    </td>
                    <td className="py-4 pr-4 capitalize text-[var(--logistics-muted)]">
                      {c.urgency}
                    </td>
                    <td className="py-4 pr-4 text-white">{formatCurrency(c.baseAmount)}</td>
                    <td className="py-4 pr-4 text-[var(--logistics-muted)]">
                      {formatCurrency(c.weightFeePerKg)}
                    </td>
                    <td className="py-4 text-[var(--logistics-muted)]">
                      {formatCurrency(c.fragileFee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Link
          href="/book"
          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3.5 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.22)] transition hover:-translate-y-0.5"
        >
          Start a booking
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
