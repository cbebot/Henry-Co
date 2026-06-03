import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Compass, Receipt } from "lucide-react";
import { getLogisticsQuoteCopy } from "@henryco/i18n/server";
import BookRequestForm from "@/components/booking/BookRequestForm";
import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsZones } from "@/lib/logistics/data";
import { getLogisticsViewer } from "@/lib/logistics/auth";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsQuoteCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export const dynamic = "force-dynamic";

export default async function QuotePage() {
  const [zones, viewer, locale] = await Promise.all([
    getLogisticsZones(),
    getLogisticsViewer(),
    getLogisticsPublicLocale(),
  ]);
  const copy = getLogisticsQuoteCopy(locale);
  const savedAddresses = viewer.user
    ? await loadSavedAddresses(viewer.user.id)
    : [];

  const quoteShowsItems = [
    {
      icon: Compass,
      title: copy.whatQuoteShows.items.laneTier.title,
      body: copy.whatQuoteShows.items.laneTier.body,
    },
    {
      icon: Receipt,
      title: copy.whatQuoteShows.items.itemised.title,
      body: copy.whatQuoteShows.items.itemised.body,
    },
    {
      icon: ClipboardList,
      title: copy.whatQuoteShows.items.promiseWindow.title,
      body: copy.whatQuoteShows.items.promiseWindow.body,
    },
  ];

  const afterSubmitItems = [
    {
      step: "01",
      title: copy.afterSubmit.items.returned.title,
      body: copy.afterSubmit.items.returned.body,
    },
    {
      step: "02",
      title: copy.afterSubmit.items.reference.title,
      body: copy.afterSubmit.items.reference.body,
    },
    {
      step: "03",
      title: copy.afterSubmit.items.pickup.title,
      body: copy.afterSubmit.items.pickup.body,
    },
  ];

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-start">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[color:var(--home-ink)] sm:text-[2.6rem] md:text-[3rem]">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                {copy.hero.body}
              </p>
              <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                {copy.hero.badge}
              </p>
            </div>

            <aside>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {copy.whatQuoteShows.eyebrow}
              </p>
              <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {quoteShowsItems.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--logistics-line)] bg-[color:var(--home-surface-04)] text-[color:var(--home-accent-text)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">{title}</h2>
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
              {copy.quoteDetails.eyebrow}
            </p>
            <div className="mt-6">
              <BookRequestForm zones={zones} defaultMode="quote" savedAddresses={savedAddresses} />
            </div>
          </div>

          <aside className="space-y-10 lg:pt-8">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {copy.afterSubmit.eyebrow}
              </p>
              <ol className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                {afterSubmitItems.map(({ step, title, body }) => (
                  <li key={step} className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                      {copy.afterSubmit.stepLabel} {step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">{title}</h3>
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
                {copy.volume.eyebrow}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">
                {copy.volume.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/business"
                  className="font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  {copy.volume.talkLink}
                </Link>
                <span className="text-[color:var(--home-ink-50)]">·</span>
                <Link
                  href="/services"
                  className="font-semibold text-[color:var(--home-ink-70)] underline-offset-4 hover:underline"
                >
                  {copy.volume.compareLink}
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-[var(--logistics-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {copy.conversion.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.conversion.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                {copy.conversion.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--home-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--home-accent-ink)] transition hover:-translate-y-0.5 hover:bg-[color:var(--home-accent-strong)]"
              >
                <CheckCircle2 className="h-4 w-4" /> {copy.conversion.bookCta}
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink)] transition hover:bg-[color:var(--home-surface-04)]"
              >
                {copy.conversion.trackCta}
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
