import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Radio,
  Shield,
} from "lucide-react";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { PublicProofRail, PublicSpotlight } from "@henryco/ui/public-shell";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { LOGISTICS_FAQS } from "@/lib/logistics/content";

export const dynamic = "force-dynamic";

export default async function LogisticsHomePage() {
  const logistics = getDivisionConfig("logistics");
  const snapshot = await getPublicLogisticsSnapshot();

  const heroMetrics = snapshot.metrics.map((m) => ({
    label: m.label,
    value: m.value,
    hint: m.note,
  }));

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[92rem] space-y-16">
        {/* Editorial hero — eyebrow + display + CTAs, then a separate ProofRail below */}
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.18fr,0.82fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                Pickup &middot; Dispatch &middot; Proof
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[2.9rem] md:text-[3.4rem]">
                Calm last-mile, visible end to end.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)] sm:text-lg">
                Built for people and businesses that need honest ETAs, clean handoffs,
                and a customer experience that stays premium when operations get noisy.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3.5 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.24)] transition hover:-translate-y-0.5"
                >
                  Book a delivery
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.07]"
                >
                  Request a quote
                </Link>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  Track a shipment
                </Link>
              </div>
              <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
                {snapshot.settings.pickupHours}
              </p>
            </div>

            {/* Why it's different — divided icon list, no inner panels */}
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Why teams switch
              </p>
              <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {[
                  {
                    icon: MapPin,
                    title: "Who it is for",
                    body: "Retail replenishment, founder-led brands, professional services, and HenryCo divisions that need predictable pickup and delivery at scale.",
                  },
                  {
                    icon: Radio,
                    title: "How tracking works",
                    body: snapshot.settings.trackingLookupHelp,
                  },
                  {
                    icon: Shield,
                    title: "Proof and accountability",
                    body: "Milestones write to an immutable event log. Proof-of-delivery is part of the product, not an afterthought.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4 py-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--logistics-line)] bg-white/[0.03] text-[var(--logistics-accent)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-white">
                        {title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <PublicProofRail density="default" variant="rail" items={heroMetrics} />
          </div>
        </section>

        {/* Process — single horizontal timeline with hairlines, no circle tiles */}
        <section>
          <div className="flex items-baseline gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              From request to doorstep
            </p>
            <span className="h-px flex-1 bg-[var(--logistics-line)]" />
          </div>
          <ol className="mt-7 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Submit a quote or booking with addresses, parcel profile, and lane.",
              "Receive an indicative price and promise window from governed rate cards.",
              "Dispatch assigns a rider; milestones appear on your tracking page.",
              "Delivery closes with proof and visibility inside your HenryCo account.",
            ].map((text, i) => (
              <li
                key={text}
                className="border-t border-[var(--logistics-line)] pt-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0"
              >
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-[15px] leading-[1.7] text-white/85">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Operating lanes — divided list, no card tiles */}
        <section className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Operating lanes
            </p>
            <h2 className="mt-4 max-w-md text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[2rem]">
              One operating model, four lane shapes.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--logistics-muted)]">
              Same-day, scheduled, dispatch, and inter-city readiness share the same
              dispatcher logic, the same rate card discipline, and the same proof trail.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.07]"
              >
                See all services
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
              >
                Pricing posture
              </Link>
            </div>
          </div>

          <ul className="divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
            {snapshot.services.slice(0, 4).map((service) => (
              <li key={service.slug} className="flex gap-4 py-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--logistics-accent)]" />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold tracking-tight text-white">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                    {service.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Trust narrative — Spotlight contrast band, no panel-on-panel */}
        <PublicSpotlight
          tone="contrast"
          eyebrow="The HenryCo posture"
          title="Operations stay calm because the platform makes it cheaper to do the right thing."
          body="Governed rate cards, immutable milestones, and one shared account remove the operational debt that quietly erodes premium experiences."
          aside={
            <ul className="space-y-4">
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">Honest ETAs</p>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  Promise windows come from real lane data, not optimistic guesses. Slippage gets logged and explained.
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">Proof, not promises</p>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  Every handoff writes to an immutable event log. Proof-of-delivery is a product feature, not a ticket attachment.
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">One account, one bill</p>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  Customers reuse the HenryCo account they already trust. Operators reconcile in one place across every division.
                </p>
              </li>
            </ul>
          }
        />

        {/* FAQ — kept as a list, but with hairline rule + trim panel chrome */}
        <section className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Questions before you book
            </p>
            <h2 className="mt-4 max-w-sm text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
              The honest answers, before the order.
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`mailto:${logistics.supportEmail}`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.07]"
              >
                Email {logistics.shortName}
              </a>
              <Link
                href={getAccountUrl("/logistics")}
                className="inline-flex items-center gap-2 rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/18"
              >
                Open account hub
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <dl className="divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
            {LOGISTICS_FAQS.map((faq) => (
              <div key={faq.q} className="py-5">
                <dt className="text-base font-semibold tracking-tight text-white">
                  {faq.q}
                </dt>
                <dd className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
