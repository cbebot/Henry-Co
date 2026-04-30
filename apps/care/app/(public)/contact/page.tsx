import type { CSSProperties, ComponentType, ReactNode } from "react";
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
import { getDivisionConfig } from "@henryco/config";
import ContactForm from "@/components/care/ContactForm";
import CopyButton from "@/components/ui/CopyButton";
import { getCareSettings } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

const care = getDivisionConfig("care");

export default async function ContactPage() {
  const settings = await getCareSettings();
  const supportEmail = settings.support_email || care.supportEmail || "care@henrycogroup.com";
  const supportPhone = settings.support_phone || care.supportPhone || "+234 000 000 0000";
  const whatsappNumber =
    settings.payment_support_whatsapp || settings.payment_whatsapp || settings.support_phone || supportPhone;
  const pickupHours = settings.pickup_hours || "Mon - Sat • 8:00 AM to 7:00 PM";

  return (
    <main
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
                Contact and support
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
                One desk. Clear answers.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
                Booking guidance, schedule changes, billing clarity, or follow-up on an existing
                service &mdash; handled with one consistent thread from first message to final
                resolution.
              </p>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: Clock3,
                  label: "Service hours",
                  value: pickupHours,
                },
                {
                  icon: MapPin,
                  label: "Coverage",
                  value: "Garment, home, and office requests across covered zones",
                },
                {
                  icon: Sparkles,
                  label: "Follow-up",
                  value: "Logged under one reference per request",
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
              Send a message
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-12">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Direct channels
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                Choose the route that fits the moment.
              </h2>
              <ul className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
                <SupportRow
                  icon={PhoneCall}
                  title="Phone support"
                  body="Best for same-day pickup changes, access instructions, urgent service coordination, and anything timing-sensitive."
                  value={supportPhone}
                  href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                />
                <SupportRow
                  icon={Mail}
                  title="Email support"
                  body="Best for quotes, billing clarity, recurring-plan questions, and anything that benefits from a written record."
                  value={supportEmail}
                  href={`mailto:${supportEmail}`}
                />
                <SupportRow
                  icon={MessageSquare}
                  title="WhatsApp contact"
                  body="Useful when the team only needs a quick confirmation or proof-of-payment attachment after earlier guidance."
                  value={whatsappNumber}
                  href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`}
                />
              </ul>
            </div>

            <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                Already have a tracking code?
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                Track the service first. In many cases, the latest movement, arrival stage, or
                completion update will answer the question immediately.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/track"
                  className="font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline"
                >
                  Track a service
                </Link>
                <span className="text-zinc-400 dark:text-white/30">·</span>
                <Link
                  href="/book"
                  className="font-semibold text-zinc-700 underline-offset-4 hover:underline dark:text-white/80"
                >
                  Start a booking
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Built to feel calm under pressure
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                One desk, cleaner follow-up.
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                Messages are logged under one clear reference so the team can respond promptly and
                keep every update in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Start a booking
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 dark:border-white/15 dark:text-white"
              >
                Compare services
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
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  value: string;
  href?: string;
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
        <CopyButton value={value} label="Copy" />
      </div>
    </li>
  );
}
