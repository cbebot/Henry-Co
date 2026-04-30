import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ClipboardList,
  Receipt,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { getAccountUrl } from "@henryco/config";

export const metadata: Metadata = {
  title: "Business logistics | HenryCo Logistics",
  description: "Repeat routes, governed pricing, and account-level visibility for business shippers.",
};

export default function BusinessPage() {
  const standards = [
    {
      icon: Repeat2,
      title: "Repeat lanes without rebuilding paperwork",
      body: "Saved pickup and delivery pairs, common contacts, and parcel profiles carry forward — drivers see the same instructions across every booking.",
    },
    {
      icon: Workflow,
      title: "Escalations with audit-friendly history",
      body: "Issues become structured records: who reported, what changed, when dispatch acted. Finance and operations read from the same trail.",
    },
    {
      icon: ShieldCheck,
      title: "Premium experience under operational stress",
      body: "Difficult lanes, partial deliveries, and rerouting still surface clean milestones to the recipient — quality holds even when routing gets noisy.",
    },
  ] as const;

  const path = [
    {
      step: "01",
      title: "Quote a representative lane",
      body: "Use the public quote to get a real number for your most common origin–destination pair, then we calibrate from there.",
    },
    {
      step: "02",
      title: "Open the account hub",
      body: "Inside your HenryCo account, the logistics workspace stores receipts, milestone history, and notification routing for finance/ops.",
    },
    {
      step: "03",
      title: "Run the volume",
      body: "Repeat bookings reuse saved profiles. Tracking codes are issued instantly; proof-of-delivery records attach to the right invoice.",
    },
    {
      step: "04",
      title: "Reconcile cleanly",
      body: "Each shipment carries to one statement with the lane, service tier, and any handling line items — no “misc” surprises.",
    },
  ] as const;

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                For operators
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
                Built for operators.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                Public booking and tracking run on the same shipment model used internally. Business
                shippers get predictable pricing, milestone visibility, proof-of-delivery
                discipline, and the shared HenryCo account for receipts, notifications, and support
                history.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
                >
                  Quote a real lane
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={getAccountUrl("/logistics")}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
                >
                  Open logistics in account
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  Compare service tiers
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: Receipt,
                  label: "Pricing",
                  value: "Governed, traceable per lane",
                },
                {
                  icon: ClipboardList,
                  label: "Visibility",
                  value: "Milestones + POD per shipment",
                },
                {
                  icon: Sparkles,
                  label: "Continuity",
                  value: "Saved lanes, contacts, profiles",
                },
              ].map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-3 border-b border-[var(--logistics-line)] py-3 last:border-b-0"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--logistics-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            Three operating standards
          </p>
          <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--logistics-line)]">
            {standards.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[var(--logistics-accent)]" aria-hidden />
                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            How it scales after the first lane
          </p>
          <ol className="mt-6 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
            {path.map((item) => (
              <li
                key={item.step}
                className="grid gap-3 py-5 sm:grid-cols-[auto,1fr] sm:gap-6"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  Step {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--logistics-muted)]">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-[var(--logistics-line)]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Best for
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--logistics-muted)]">
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>
                  Retail and DTC brands replenishing stock or fulfilling repeat orders across the
                  same metro lanes.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>
                  Professional services moving documents, samples, or kit on a predictable rhythm.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>
                  HenryCo divisions and partners coordinating internal handoffs without ad-hoc
                  paperwork.
                </span>
              </li>
            </ul>
          </div>
          <div className="lg:pl-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Not a fit yet
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--logistics-muted)]">
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>
                  Cold-chain or temperature-controlled freight requiring specialised containers — let
                  us know in advance and we’ll route accordingly.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>
                  International cross-border movements — domestic lanes are the published service
                  surface today.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--logistics-accent)]" />
                <span>
                  Hazardous-materials shipments — handled separately under direct ops contact, not
                  via public booking.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--logistics-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Ready to talk volume?
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
                Send a representative quote — we’ll respond with a realistic operating picture.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                Quote → confirm the lanes → open the account hub. No sales theatre, no paperwork
                wall.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
              >
                Quote a lane
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
              >
                Talk to dispatch
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
