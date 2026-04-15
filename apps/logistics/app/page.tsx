import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Radio, Shield } from "lucide-react";
import type { Metadata } from "next";
import { createDivisionMetadata, getAccountUrl, getDivisionConfig } from "@henryco/config";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { LOGISTICS_FAQS } from "@/lib/logistics/content";

export const revalidate = 300;
export const metadata: Metadata = createDivisionMetadata("logistics", {
  path: "/",
});

export default async function LogisticsHomePage() {
  const logistics = getDivisionConfig("logistics");
  const snapshot = await getPublicLogisticsSnapshot();

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-14">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] shadow-[var(--logistics-shadow)]">
          <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Pickup · dispatch · proof
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Premium last-mile logistics you can track with confidence.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--logistics-muted)]">
                HenryCo Logistics is built for people and businesses that need calm handoffs, honest ETAs, and a
                customer experience that still feels premium when operations get noisy.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.24)]"
                >
                  Book a delivery
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white/90"
                >
                  Request a quote
                </Link>
                <Link href="/track" className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--logistics-accent-soft)]">
                  Track a shipment
                </Link>
              </div>
              <p className="mt-6 text-xs text-[var(--logistics-muted)]">{snapshot.settings.pickupHours}</p>
            </div>
            <div className="grid gap-4">
              {snapshot.metrics.map((m) => (
                <article key={m.label} className="rounded-[1.5rem] border border-[var(--logistics-line)] bg-white/[0.04] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">{m.label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{m.value}</div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--logistics-muted)]">{m.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Who it is for",
              body: "Retail replenishment, founder-led brands, professional services, and HenryCo divisions that need predictable pickup and delivery without losing the plot.",
            },
            {
              icon: Radio,
              title: "How tracking works",
              body: snapshot.settings.trackingLookupHelp,
            },
            {
              icon: Shield,
              title: "Proof and accountability",
              body: "Milestones are written to an immutable-style event log. Proof-of-delivery is part of the product—not an afterthought.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-6">
              <item.icon className="h-6 w-6 text-[var(--logistics-accent)]" />
              <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--logistics-muted)]">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] px-6 py-10 sm:px-10">
          <h2 className="text-2xl font-semibold text-white">From request to doorstep</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Submit a quote or booking with addresses, parcel profile, and lane.",
              "Receive an indicative price and promise window from governed rate cards.",
              "Dispatch assigns a rider; milestones appear on your tracking page.",
              "Delivery closes with proof and visibility inside your HenryCo account.",
            ].map((text, i) => (
              <li key={text} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(215,117,57,0.15)] text-sm font-semibold text-[var(--logistics-accent-soft)]">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-[var(--logistics-muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr,1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-white">Operating lanes</h2>
            <p className="mt-3 text-sm text-[var(--logistics-muted)]">
              Same-day, scheduled, dispatch, and inter-city readiness share one operating model.
            </p>
            <ul className="mt-6 space-y-4">
              {snapshot.services.slice(0, 4).map((s) => (
                <li key={s.slug} className="flex gap-3 rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--logistics-accent)]" />
                  <div>
                    <div className="font-semibold text-white">{s.name}</div>
                    <p className="mt-1 text-sm text-[var(--logistics-muted)]">{s.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-[var(--logistics-line)] bg-black/20 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-white">Questions</h3>
            <dl className="mt-5 space-y-5">
              {LOGISTICS_FAQS.map((faq) => (
                <div key={faq.q}>
                  <dt className="text-sm font-semibold text-white">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--logistics-muted)]">{faq.a}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--logistics-line)] pt-6">
              <a
                href={`mailto:${logistics.supportEmail}`}
                className="inline-flex rounded-full border border-[var(--logistics-line)] px-5 py-2 text-sm font-semibold text-white/90"
              >
                Email {logistics.shortName}
              </a>
              <Link href={getAccountUrl("/logistics")} className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white">
                Open account hub
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
