import type { CSSProperties, ComponentType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  Home,
  Mail,
  Package2,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getCareBookingCatalog, getCareSettings } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: "About HenryCo Care",
  description:
    "Learn how HenryCo Care delivers premium garment care, home cleaning, office cleaning, and dependable service follow-through.",
};

export default async function AboutPage() {
  const [settings, catalog] = await Promise.all([
    getCareSettings(),
    getCareBookingCatalog(),
  ]);

  const supportEmail = settings.support_email || care.supportEmail || "care@henrycogroup.com";
  const supportPhone = settings.support_phone || care.supportPhone || "+234 000 000 0000";
  const pickupHours = settings.pickup_hours || "Mon - Sat • 8:00 AM to 7:00 PM";
  const heroTitle =
    settings.about_title ||
    "Trust. Timing. Service quality.";
  const heroBody =
    settings.about_body ||
    "HenryCo Care provides garment care, pickup and delivery, home cleaning, office cleaning, and recurring service plans through one polished customer experience \u2014 dependable execution, respectful handling, a finish clients are happy to invite back.";

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
                "radial-gradient(circle at top, color-mix(in srgb, var(--accent) 18%, transparent), transparent 30%)",
            }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="care-chip inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white/76">
                <Sparkles className="h-5 w-5 text-[color:var(--accent)]" />
                About HenryCo Care
              </div>

              <h1 className="mt-7 care-display max-w-3xl text-balance text-white">{heroTitle}</h1>

              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/68 sm:text-lg">{heroBody}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="care-button-primary inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"
                >
                  Book a service
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Contact the team
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={Clock3}
                label="Service hours"
                value={pickupHours}
                note="Booking support, pickup timing, and visit coordination"
              />
              <InfoCard
                icon={Mail}
                label="Care desk"
                value={supportEmail}
                note={supportPhone}
              />
              <MetricCard
                label="Service options"
                value={String(catalog.serviceTypes.length)}
                note="Garment, home, and office service lines"
              />
              <MetricCard
                label="Package plans"
                value={String(catalog.packages.length)}
                note="One-time and recurring service structures"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <ServiceCard
            icon={Package2}
            title="Garment care"
            body="From daily wardrobe essentials to delicate pieces, HenryCo Care handles cleaning, stain treatment, pressing, finishing, and return delivery with precision."
          />
          <ServiceCard
            icon={Home}
            title="Home cleaning"
            body="Homes are cared for with clear arrival windows, thoughtful service notes, and a finish designed to feel calm, fresh, and genuinely complete."
          />
          <ServiceCard
            icon={Building2}
            title="Office cleaning"
            body="Workplaces receive reliable cleaning support with professional timing, organized site handling, and service continuity businesses can count on."
          />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <div className="care-card rounded-[2.2rem] p-8">
            <div className="care-kicker">Why clients trust HenryCo Care</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Reliable service comes from standards clients can actually feel.
            </h2>

            <div className="mt-6 grid gap-4">
              {[
                "Clear communication before pickup, before arrival, and during every important update.",
                "Professional handling for garments, homes, and workplaces with the right context for each service type.",
                "Recurring service options that make long-term care easier to manage and easier to trust.",
                "One care desk that keeps follow-up documented instead of scattered across channels.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-5 w-5 text-[color:var(--accent)]" />
                    <p className="text-sm leading-7 text-zinc-600 dark:text-white/68">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="care-card rounded-[2.2rem] p-8">
            <div className="care-kicker">How the experience works</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Smooth for the client, disciplined behind the scenes.
            </h2>

            <div className="mt-6 grid gap-4">
              <StepCard
                title="1. Book the right service"
                body="Choose garment care, home cleaning, or office cleaning and share the timing, address, and service notes that matter."
              />
              <StepCard
                title="2. Receive clear confirmation"
                body="You receive confirmation, booking details, payment guidance where relevant, and a tracking code for follow-up."
              />
              <StepCard
                title="3. Service is carried out professionally"
                body="Garments move through pickup and delivery. Homes and offices move through arrival, on-site work, and completion."
              />
              <StepCard
                title="4. Stay informed until the end"
                body="Tracking and email updates keep the next step clear, whether that means return delivery or a completed cleaning visit."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <ServiceCard
            icon={Truck}
            title="Pickup and delivery"
            body="Garment care includes controlled pickup, treatment, finishing, and return delivery so customers can follow the order from start to finish."
          />
          <ServiceCard
            icon={ShieldCheck}
            title="Quality standards"
            body="Whether the service happens in a wardrobe, a home, or a workplace, the result should feel consistent, careful, and professionally finished."
          />
          <ServiceCard
            icon={Sparkles}
            title="Convenience without compromise"
            body="Recurring plans, clear updates, and premium support make it easier to keep garments, homes, and workplaces in excellent condition."
          />
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card relative overflow-hidden rounded-[2.6rem] px-8 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between">
          <div className="relative max-w-2xl">
            <div className="care-kicker">Ready to experience HenryCo Care?</div>
            <h2 className="mt-3 care-section-title text-white">
              Book a premium care service with timing, clarity, and follow-through built in.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/66">
              From garment pickup and delivery to recurring home and office cleaning, HenryCo Care
              is built to make dependable service feel easy.
            </p>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-0">
            <Link
              href="/book"
              className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
            >
              Book a service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Explore services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <article className="care-card care-sheen rounded-[2rem] p-7">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
        <Icon className="h-6 w-6 text-[color:var(--accent)]" />
      </div>
      <div className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">{title}</div>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">{body}</p>
    </article>
  );
}

function StepCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">{body}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-4 text-xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-7 text-white/62">{note}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[#06101a]/55 p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">{label}</div>
      <div className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/58">{note}</div>
    </div>
  );
}
