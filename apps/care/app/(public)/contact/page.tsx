import type { CSSProperties, ComponentType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BRAND_EMAILS, getDivisionConfig } from "@henryco/config";
import { getCareContactCopy, type CareContactCopy } from "@henryco/i18n/server";
import ContactForm from "@/components/care/ContactForm";
import CopyButton from "@/components/ui/CopyButton";
import { getCareSettings } from "@/lib/care-data";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

const care = getDivisionConfig("care");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getCareContactCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function ContactPage() {
  const locale = await getCarePublicLocale();
  const copy = getCareContactCopy(locale);
  const settings = await getCareSettings();
  const supportEmail = settings.support_email || care.supportEmail || BRAND_EMAILS.care;
  const supportPhone = settings.support_phone || care.supportPhone;
  const whatsappNumber =
    settings.payment_support_whatsapp || settings.payment_whatsapp || settings.support_phone || supportPhone;
  const pickupHours = settings.pickup_hours || copy.rail.defaultPickupHours;

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-10"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[88rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent)]">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
                {copy.hero.body}
              </p>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: Clock3,
                  label: copy.rail.serviceHoursLabel,
                  value: pickupHours,
                },
                {
                  icon: MapPin,
                  label: copy.rail.coverageLabel,
                  value: copy.rail.coverageValue,
                },
                {
                  icon: Sparkles,
                  label: copy.rail.followUpLabel,
                  value: copy.rail.followUpValue,
                },
              ].map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-3 border-b border-black/10 py-3 last:border-b-0 dark:border-white/10"
                >
                  <Icon className="h-3.5 w-3.5 text-[color:var(--accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-12 xl:grid-cols-[1.08fr,0.92fr]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
              {copy.sendMessage.eyebrow}
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-12">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {copy.channels.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                {copy.channels.title}
              </h2>
              <ul className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
                <SupportRow
                  icon={PhoneCall}
                  title={copy.channels.phoneTitle}
                  body={copy.channels.phoneBody}
                  value={supportPhone}
                  href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                  copyLabel={copy.channels.copyLabel}
                />
                <SupportRow
                  icon={Mail}
                  title={copy.channels.emailTitle}
                  body={copy.channels.emailBody}
                  value={supportEmail}
                  href={`mailto:${supportEmail}`}
                  copyLabel={copy.channels.copyLabel}
                />
                <SupportRow
                  icon={MessageSquare}
                  title={copy.channels.whatsappTitle}
                  body={copy.channels.whatsappBody}
                  value={whatsappNumber}
                  href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`}
                  copyLabel={copy.channels.copyLabel}
                />
              </ul>
            </div>

            <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                {copy.tracking.eyebrow}
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                {copy.tracking.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/track"
                  className="font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline"
                >
                  {copy.tracking.trackLink}
                </Link>
                <span className="text-zinc-400 dark:text-white/30">·</span>
                <Link
                  href="/book"
                  className="font-semibold text-zinc-700 underline-offset-4 hover:underline dark:text-white/80"
                >
                  {copy.tracking.bookLink}
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {copy.footer.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                {copy.footer.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                {copy.footer.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {copy.footer.bookCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 dark:border-white/15 dark:text-white"
              >
                {copy.footer.compareCta}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SupportRow({
  icon: Icon,
  title,
  body,
  value,
  href,
  copyLabel,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  value: string;
  href?: string;
  copyLabel: CareContactCopy["channels"]["copyLabel"];
}) {
  return (
    <li className="grid gap-3 py-5 sm:grid-cols-[auto,1fr,auto] sm:items-start sm:gap-6">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/60 text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.04]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-white/68">{body}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {href ? (
          <a
            href={href}
            target={href.startsWith("https://") ? "_blank" : undefined}
            rel={href.startsWith("https://") ? "noreferrer" : undefined}
            className="text-sm font-semibold tracking-tight text-zinc-950 transition hover:text-[color:var(--accent)] dark:text-white"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
            {value}
          </span>
        )}
        <CopyButton value={value} label={copyLabel} />
      </div>
    </li>
  );
}
