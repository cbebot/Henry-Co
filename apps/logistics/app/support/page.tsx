import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ClipboardList,
  Clock3,
  Mail,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";

export const metadata: Metadata = {
  title: "Support | HenryCo Logistics",
  description: "Contact HenryCo Logistics support or continue a conversation from your HenryCo account.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const logistics = getDivisionConfig("logistics");
  const { settings } = await getPublicLogisticsSnapshot();

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                One desk &middot; One thread
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
                Logistics support, kept on one thread.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                Shipment exceptions, billing questions, routing changes — reach the dispatch desk
                directly. Account holders should open a logistics-tagged thread so history stays in
                one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={getAccountUrl("/support")}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
                >
                  Open a tagged thread
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${logistics.supportEmail}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
                >
                  Email dispatch
                </a>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  Track first
                </Link>
              </div>
            </div>

            <aside>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Direct channels
              </p>
              <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                <li className="flex items-baseline gap-4 py-4">
                  <Mail className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Email
                  </span>
                  <a
                    href={`mailto:${logistics.supportEmail}`}
                    className="ml-auto text-right text-sm font-semibold tracking-tight text-white underline-offset-4 hover:underline"
                  >
                    {logistics.supportEmail}
                  </a>
                </li>
                <li className="flex items-baseline gap-4 py-4">
                  <PhoneCall className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Phone
                  </span>
                  <a
                    href={`tel:${logistics.supportPhone}`}
                    className="ml-auto text-right text-sm font-semibold tracking-tight text-white underline-offset-4 hover:underline"
                  >
                    {logistics.supportPhone}
                  </a>
                </li>
                <li className="flex items-baseline gap-4 py-4">
                  <Clock3 className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Hours
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                    {settings.pickupHours}
                  </span>
                </li>
                <li className="flex items-baseline gap-4 py-4">
                  <ShieldCheck className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Operations
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                    {settings.operationsCity}, {settings.operationsRegion}
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              What helps us help you faster
            </p>
            <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
              {[
                {
                  icon: ClipboardList,
                  title: "Tracking code first",
                  body: "Every dispatched shipment carries a code (HCL-XXXXXX). Open with the code and the rest of the context is one lookup away.",
                },
                {
                  icon: PhoneCall,
                  title: "Sender or recipient phone",
                  body: "Used to verify you and authorise the read on the lane — same as the public track page.",
                },
                {
                  icon: MessageSquare,
                  title: "What you observed",
                  body: "Lane, last status you saw, and the outcome you’re asking for. Skip the apology — just the facts.",
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
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              Account vs guest
            </p>
            <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
              <li className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  Account
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">
                    Threaded history
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                    Tickets land in the HenryCo support center with full lane and milestone context.
                    Replies show up the same way emails would, but with the right shipments
                    attached.
                  </p>
                </div>
              </li>
              <li className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  Guest
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">
                    Email or phone direct
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                    Reach dispatch on the channels above. Include the tracking code so we can verify
                    the shipment without asking you to repeat yourself.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-[var(--logistics-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                Before you message
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.85rem]">
                Most timing questions resolve from the track page.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                If the milestone you’re looking for is already there, no thread needed. If it isn’t,
                this page gets you to the right desk fast.
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
                href={getAccountUrl("/support")}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
              >
                Account support center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
