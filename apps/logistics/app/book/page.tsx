import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, MapPin, Radio, ShieldCheck } from "lucide-react";
import BookRequestForm from "@/components/booking/BookRequestForm";
import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsZones } from "@/lib/logistics/data";
import { getLogisticsViewer } from "@/lib/logistics/auth";

export const metadata: Metadata = {
  title: "Book a delivery | HenryCo Logistics",
  description: "Submit a pickup and delivery request with governed pricing and live tracking.",
};

export const dynamic = "force-dynamic";

export default async function BookPage() {
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
                Pickup &middot; Dispatch &middot; Proof
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
                Book a delivery.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                Sender, recipient, and where to meet both sides. Tracking code is issued immediately;
                milestones update as dispatch progresses.
              </p>
              <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
                Governed pricing · Live milestones · Proof at delivery
              </p>
            </div>

            <aside>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                What we’ll need from you
              </p>
              <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {[
                  {
                    icon: MapPin,
                    title: "Pickup and dropoff",
                    body: "Two clean addresses with the right contact name and phone for each end.",
                  },
                  {
                    icon: ClipboardCheck,
                    title: "Parcel profile",
                    body: "Weight band, dimensions if oversized, and any handling notes (fragile, cold, document).",
                  },
                  {
                    icon: Radio,
                    title: "Service tier",
                    body: "Standard, express, or scheduled — pick the timing both sides can hold to.",
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
              Booking details
            </p>
            <div className="mt-6">
              <BookRequestForm zones={zones} defaultMode="book" savedAddresses={savedAddresses} />
            </div>
          </div>

          <aside className="space-y-10 lg:pt-8">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                After you submit
              </p>
              <ol className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {[
                  {
                    step: "01",
                    title: "Tracking code on screen",
                    body: "You see it the moment the booking is recorded — no email wait. Save it or share with the recipient.",
                  },
                  {
                    step: "02",
                    title: "Dispatch picks it up",
                    body: "Routing assigns within the operating window; pickup milestone writes live to the timeline.",
                  },
                  {
                    step: "03",
                    title: "Both sides stay informed",
                    body: "Sender and recipient see the same milestones. Updates land via SMS or in your HenryCo account thread.",
                  },
                  {
                    step: "04",
                    title: "Proof of delivery on arrival",
                    body: "Recipient name, time, and capture method save to the shipment record — visible immediately on the track page.",
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
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" /> Recipient privacy
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">
                Phone numbers are used to authorise tracking lookups and surface milestones — not
                shared with third parties. Both sides can revoke updates from their thread.
              </p>
            </div>
          </aside>
        </section>

        <section className="border-t border-[var(--logistics-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Already have a tracking code?
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
                Pick up where the last shipment left off.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                Status, proof of delivery, and any active exception live on the track page. Account
                holders also see logistics activity inside their HenryCo support thread.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
              >
                Track a shipment
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
              >
                Get a quote first
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

async function loadSavedAddresses(userId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("customer_addresses")
    .select("id, label, line1, city, state, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    label: String(row.label || row.line1 || "Saved address"),
    fullAddress: [row.line1, row.city, row.state].filter(Boolean).join(", "),
    line1: String(row.line1 || ""),
    city: String(row.city || ""),
    region: String(row.state || ""),
  }));
}
