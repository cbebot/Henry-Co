import type { CSSProperties, ComponentType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BRAND_EMAILS, getDivisionConfig, getSupportWhatsAppHref } from "@henryco/config";
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
      <div className="mx-auto max-w-[92rem] space-y-14">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--home-accent-text)]">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)] sm:text-lg">
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
                  className="flex items-baseline gap-3 border-b border-[color:var(--home-line)] py-3 last:border-b-0"
                >
                  <Icon className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-12 xl:grid-cols-[1.08fr,0.92fr]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
              {copy.sendMessage.eyebrow}
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-12">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                {copy.channels.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.channels.title}
              </h2>
              {/* NUMBER-PURGE (owner 2026-07-08): the phone row is gone and
               * the WhatsApp row shows the brand word only — no company
               * digits ever render; the number lives solely in the wa.me
               * href. Email is the one visible address. */}
              <ul className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
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
                  value="WhatsApp"
                  href={getSupportWhatsAppHref(whatsappNumber)}
                  copyLabel={copy.channels.copyLabel}
                />
              </ul>
            </div>

            <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
                {copy.tracking.eyebrow}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-70)]">
                {copy.tracking.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/track"
                  className="font-semibold text-[color:var(--home-accent-text)] underline-offset-4 hover:underline"
                >
                  {copy.tracking.trackLink}
                </Link>
                <span className="text-[color:var(--home-ink-30)]">·</span>
                <Link
                  href="/book"
                  className="font-semibold text-[color:var(--home-ink-75)] underline-offset-4 hover:underline"
                >
                  {copy.tracking.bookLink}
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-[color:var(--home-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                {copy.footer.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.footer.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-ink-70)]">
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
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--accent)]/50"
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] text-[color:var(--home-accent-text)]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--home-ink-70)]">{body}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {href ? (
          <a
            href={href}
            target={href.startsWith("https://") ? "_blank" : undefined}
            rel={href.startsWith("https://") ? "noreferrer" : undefined}
            className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)] transition hover:text-[color:var(--home-accent-text)]"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
            {value}
          </span>
        )}
        <CopyButton value={value} label={copyLabel} />
      </div>
    </li>
  );
}
