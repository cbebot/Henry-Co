import Link from "next/link";
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
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What we move</h1>
          <p className="mt-3 text-[var(--logistics-muted)]">
            Parcels, documents, retail replenishment, and operational freight that needs disciplined pickup, milestone
            tracking, and proof-backed delivery. {settings.pickupHours}
          </p>
        </div>
        <div className="grid gap-5">
          {services.map((s) => (
            <article key={s.slug} className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--logistics-line-strong)] bg-[rgba(215,117,57,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--logistics-accent-soft)]">
                  {s.badge}
                </span>
                <h2 className="text-xl font-semibold text-white">{s.name}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--logistics-muted)]">{s.summary}</p>
              <p className="mt-2 text-sm font-medium text-white/90">{s.promise}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {s.highlights.map((h) => (
                  <li key={h} className="rounded-xl border border-[var(--logistics-line)] bg-white/[0.03] px-3 py-2 text-xs text-[var(--logistics-muted)]">
                    {h}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/book" className="rounded-full bg-[var(--logistics-accent)] px-6 py-2.5 text-sm font-semibold text-[#170f12]">
            Book now
          </Link>
          <Link href="/quote" className="rounded-full border border-[var(--logistics-line)] px-6 py-2.5 text-sm font-semibold text-white/90">
            Request quote
          </Link>
        </div>
      </div>
    </main>
  );
}
