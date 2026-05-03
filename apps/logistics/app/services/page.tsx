import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";

export const metadata: Metadata = {
  title: "Services | HenryCo Logistics",
  description: "Same-day, scheduled, dispatch, and inter-city logistics services with governed pricing.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { services, settings } = await getPublicLogisticsSnapshot();

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem] space-y-12">
        <header>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
            Services
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-[2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
            What we move.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)] sm:text-lg">
            Parcels, documents, retail replenishment, operational freight &mdash; disciplined pickup,
            milestone tracking, proof-backed delivery. {settings.pickupHours}
          </p>
        </header>

        <ol className="divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
          {services.map((s, i) => (
            <li key={s.slug} className="grid gap-6 py-8 md:grid-cols-[0.32fr,0.68fr]">
              <div>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  Service {String(i + 1).padStart(2, "0")} &middot; {s.badge}
                </p>
                <h2 className="mt-3 text-[1.4rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.6rem]">
                  {s.name}
                </h2>
              </div>
              <div>
                <p className="text-[15px] leading-7 text-[var(--logistics-muted)]">{s.summary}</p>
                <p className="mt-3 text-[15px] font-semibold leading-7 text-white/90">{s.promise}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                  {s.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-baseline gap-2 border-l border-[var(--logistics-line)] pl-3 text-xs leading-relaxed text-[var(--logistics-muted)]"
                    >
                      <span className="text-[var(--logistics-accent-soft)]">·</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3.5 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.22)] transition hover:-translate-y-0.5"
          >
            Book now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.07]"
          >
            Request quote
          </Link>
        </div>
      </div>
    </main>
  );
}
