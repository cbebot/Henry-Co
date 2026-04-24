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
      className="overflow-hidden bg-transparent pb-24 pt-8"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card relative overflow-hidden rounded-[2.7rem] px-8 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at top, color-mix(in srgb, var(--accent) 16%, transparent), transparent 30%)",
            }}
          />

          <div className="relative max-w-3xl">
            <div className="care-chip inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white/76">
              <ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" />
              Contact and support
            </div>
            <h1 className="mt-7 care-display max-w-3xl text-balance text-white">
              One desk. Clear answers.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/68 sm:text-lg">
              Booking guidance, schedule changes, billing clarity, or follow-up on an existing service &mdash; handled with one consistent thread from first message to final resolution.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <ContactForm />

          <div className="grid gap-6">
            <div className="care-card rounded-[2.2rem] p-8">
              <div className="care-kicker">Direct channels</div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-white">
                Choose the route that fits the moment.
              </h2>

              <div className="mt-6 grid gap-4">
                <SupportCard
                  icon={PhoneCall}
                  title="Phone support"
                  body="Best for same-day pickup changes, access instructions, urgent service coordination, and anything timing-sensitive."
                  value={supportPhone}
                  href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                />
                <SupportCard
                  icon={Mail}
                  title="Email support"
                  body="Best for quotes, billing clarity, recurring-plan questions, and anything that benefits from a written record."
                  value={supportEmail}
                  href={`mailto:${supportEmail}`}
                />
                <SupportCard
                  icon={MessageSquare}
                  title="WhatsApp contact"
                  body="Useful when the team only needs a quick confirmation or proof-of-payment attachment after earlier guidance."
                  value={whatsappNumber}
                  href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`}
                />
              </div>
            </div>

            <div className="care-card rounded-[2.2rem] p-8">
              <div className="care-kicker">Response standards</div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-white">
                Built to feel calm under pressure.
              </h2>
              <div className="mt-6 grid gap-4">
                <MiniInfo icon={Clock3} label="Service hours">
                  {pickupHours}
                </MiniInfo>
                <MiniInfo icon={MapPin} label="Coverage and logistics">
                  The team can confirm zones, travel fees, access notes, and recurring-plan scope
                  with the same support reference instead of starting over.
                </MiniInfo>
                <MiniInfo icon={Sparkles} label="One desk, cleaner follow-up">
                  Messages are logged under one clear reference so the team can respond promptly
                  and keep every update in one place.
                </MiniInfo>
              </div>
            </div>

            <div className="care-dash-card rounded-[2.2rem] p-8">
              <div className="care-kicker">Need instant clarity?</div>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-white">
                Already have a tracking code?
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/66">
                Track the service first. In many cases, the latest movement, arrival stage, or
                completion update will answer the question immediately.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/track"
                  className="care-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Track a service
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Start a booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SupportCard({
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
    <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
        <Icon className="h-5 w-5 text-[color:var(--accent)]" />
      </div>
      <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {href ? (
          <a
            href={href}
            target={href.startsWith("https://") ? "_blank" : undefined}
            rel={href.startsWith("https://") ? "noreferrer" : undefined}
            className="text-sm font-semibold text-zinc-950 transition hover:text-[color:var(--accent)] dark:text-white"
          >
            {value}
          </a>
        ) : (
          <div className="text-sm font-semibold text-zinc-950 dark:text-white">{value}</div>
        )}
        <CopyButton value={value} label="Copy" />
      </div>
    </div>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 text-sm leading-7 text-zinc-700 dark:text-white/72">{children}</div>
    </div>
  );
}
