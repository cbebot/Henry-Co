import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Compass, Receipt } from "lucide-react";
import BookRequestForm from "@/components/booking/BookRequestForm";
import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsZones } from "@/lib/logistics/data";
import { getLogisticsViewer } from "@/lib/logistics/auth";

export const metadata: Metadata = {
  title: "Request a quote | HenryCo Logistics",
  description: "Get an indicative logistics quote before you commit to a booking.",
};

export const dynamic = "force-dynamic";

export default async function QuotePage() {
  const [zones, viewer] = await Promise.all([getLogisticsZones(), getLogisticsViewer()]);
  const savedAddresses = viewer.user
    ? await loadSavedAddresses(viewer.user.id)
    : [];

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                Lane &middot; Service &middot; Profile
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
                See the price before you book.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                Priced from your lane, service type, and parcel profile. Quotes save with a tracking
                reference so a booking is one click later — no retyping.
              </p>
              <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
                Indicative · Convertible to booking · No surprise add-ons
              </p>
            </div>

            <aside>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                What the quote shows
              </p>
              <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {[
                  {
                    icon: Compass,
                    title: "Lane and service tier",
                    body: "Standard, express, or scheduled — priced against the actual zones you’re moving between.",
                  },
                  {
                    icon: Receipt,
                    title: "Itemised total",
                    body: "Base fare, weight bands, and any handling — visible before commitment, not at the door.",
                  },
                  {
                    icon: ClipboardList,
                    title: "Promise window",
                    body: "Honest hour bands with a confidence read, not a single number we can’t hold to.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--logistics-line)] bg-white/[0.03] text-[var(--logistics-accent)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Quote details
            </p>
            <div className="mt-6">
              <BookRequestForm zones={zones} defaultMode="quote" savedAddresses={savedAddresses} />
            </div>
          </div>

          <aside className="space-y-10 lg:pt-8">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                What happens after you submit
              </p>
              <ol className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {[
                  {
                    step: "01",
                    title: "Quote returned instantly",
                    body: "Indicative total and promise window appear in line — no follow-up email needed to see the price.",
                  },
                  {
                    step: "02",
                    title: "Reference saved for later",
                    body: "Each quote stores with a tracking reference. Convert it to a booking from the same form when you’re ready.",
                  },
                  {
                    step: "03",
                    title: "Pickup scheduled cleanly",
                    body: "Booking issues a tracking code and dispatch begins routing within current operating hours.",
                  },
                ].map(({ step, title, body }) => (
                  <li key={step} className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                      Step {step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-l-2 border-[var(--logistics-accent)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                Need volume pricing?
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">
                Recurring B2B lanes, multi-stop dispatch, and contract pricing run through the
                business desk — not a quick public quote.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/business"
                  className="font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  Talk to the business desk
                </Link>
                <span className="text-white/30">·</span>
                <Link
                  href="/services"
                  className="font-semibold text-white/80 underline-offset-4 hover:underline"
                >
                  Compare service tiers
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-[var(--logistics-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Ready to ship?
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
                Convert the quote — we’ll issue a tracking code straight away.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                Pricing carries through to the booking with no resets. Milestones write live as
                pickup and dispatch progress.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Book this lane
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
              >
                Track an existing shipment
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function loadSavedAddresses(userId: string) {
  // V2-ADDR-01: canonical user_addresses (replaces customer_addresses).
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("user_addresses")
    .select("id, label, street, city, state, country, formatted_address, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label || "Saved address"),
    fullAddress:
      String(row.formatted_address || "").trim() ||
      [row.street, row.city, row.state, row.country].filter(Boolean).join(", "),
    line1: String(row.street || ""),
    city: String(row.city || ""),
    region: String(row.state || ""),
  }));
}
