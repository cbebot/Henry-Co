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
import {
  getLogisticsSupportCopy,
  resolveLocalizedDynamicField,
} from "@henryco/i18n/server";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsSupportCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsSupportCopy(locale);
  const logistics = getDivisionConfig("logistics");
  const { settings } = await getPublicLogisticsSnapshot();

  // pickupHours is Supabase-merged free-text — wrap through DeepL.
  // operationsCity / operationsRegion are city / region names (place
  // identifiers) — skipped per the skip rule for proper-noun-like tokens.
  const pickupHoursLocalized = await resolveLocalizedDynamicField({
    record: settings as unknown as Record<string, unknown>,
    field: "pickupHours",
    locale,
    fallback: settings.pickupHours,
    machineTranslate: locale !== "en",
  });

  const helps = [
    {
      icon: ClipboardList,
      title: copy.helps.items.tracking.title,
      body: copy.helps.items.tracking.body,
    },
    {
      icon: PhoneCall,
      title: copy.helps.items.phone.title,
      body: copy.helps.items.phone.body,
    },
    {
      icon: MessageSquare,
      title: copy.helps.items.observed.title,
      body: copy.helps.items.observed.body,
    },
  ];

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
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
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={getAccountUrl("/support")}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--home-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--home-accent-ink)] transition hover:-translate-y-0.5 hover:bg-[color:var(--home-accent-strong)]"
                >
                  {copy.hero.ctas.openThread}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${logistics.supportEmail}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink-70)] transition hover:bg-[color:var(--home-surface-04)]"
                >
                  {copy.hero.ctas.emailDispatch}
                </a>
                <Link
                  href="/track"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                >
                  {copy.hero.ctas.trackFirst}
                </Link>
              </div>
            </div>

            <aside>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
                {copy.channels.eyebrow}
              </p>
              <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                <li className="flex items-baseline gap-4 py-4">
                  <Mail className="h-4 w-4 text-[color:var(--home-accent-text)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                    {copy.channels.emailLabel}
                  </span>
                  <a
                    href={`mailto:${logistics.supportEmail}`}
                    className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)] underline-offset-4 hover:underline"
                  >
                    {logistics.supportEmail}
                  </a>
                </li>
                <li className="flex items-baseline gap-4 py-4">
                  <PhoneCall className="h-4 w-4 text-[color:var(--home-accent-text)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                    {copy.channels.phoneLabel}
                  </span>
                  <a
                    href={`tel:${logistics.supportPhone}`}
                    className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)] underline-offset-4 hover:underline"
                  >
                    {logistics.supportPhone}
                  </a>
                </li>
                <li className="flex items-baseline gap-4 py-4">
                  <Clock3 className="h-4 w-4 text-[color:var(--home-accent-text)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                    {copy.channels.hoursLabel}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {pickupHoursLocalized}
                  </span>
                </li>
                <li className="flex items-baseline gap-4 py-4">
                  <ShieldCheck className="h-4 w-4 text-[color:var(--home-accent-text)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                    {copy.channels.operationsLabel}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
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
              {copy.helps.eyebrow}
            </p>
            <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
              {helps.map(({ icon: Icon, title, body }) => (
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
          </div>

          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              {copy.accountVsGuest.eyebrow}
            </p>
            <ul className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
              <li className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  {copy.accountVsGuest.account.label}
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {copy.accountVsGuest.account.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                    {copy.accountVsGuest.account.body}
                  </p>
                </div>
              </li>
              <li className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  {copy.accountVsGuest.guest.label}
                </span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {copy.accountVsGuest.guest.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                    {copy.accountVsGuest.guest.body}
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
                {copy.escalation.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.escalation.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--logistics-muted)]">
                {copy.escalation.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--home-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--home-accent-ink)] transition hover:-translate-y-0.5 hover:bg-[color:var(--home-accent-strong)]"
              >
                {copy.escalation.ctas.trackShipment}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={getAccountUrl("/support")}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink-70)] transition hover:bg-[color:var(--home-surface-04)]"
              >
                {copy.escalation.ctas.accountSupport}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
