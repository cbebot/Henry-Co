import type { CSSProperties } from "react";
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
  const heroTitle = settings.about_title || "Trust. Timing. Service quality.";
  const heroBody =
    settings.about_body ||
    "HenryCo Care provides garment care, pickup and delivery, home cleaning, office cleaning, and recurring service plans through one polished customer experience — dependable execution, respectful handling, a finish clients are happy to invite back.";

  const heroFacts = [
    { icon: Clock3, label: "Service hours", value: pickupHours },
    { icon: Mail, label: "Care desk", value: supportEmail },
    {
      icon: Sparkles,
      label: "Service options",
      value: `${catalog.serviceTypes.length} lines · ${catalog.packages.length} package plans`,
    },
  ] as const;

  const lanes = [
    {
      icon: Package2,
      title: "Garment care",
      body: "From daily wardrobe essentials to delicate pieces — cleaning, stain treatment, pressing, finishing, and return delivery handled with precision.",
    },
    {
      icon: Home,
      title: "Home cleaning",
      body: "Homes are cared for with clear arrival windows, thoughtful service notes, and a finish designed to feel calm, fresh, and genuinely complete.",
    },
    {
      icon: Building2,
      title: "Office cleaning",
      body: "Workplaces receive reliable cleaning support with professional timing, organised site handling, and continuity businesses can count on.",
    },
  ] as const;

  const standards = [
    "Clear communication before pickup, before arrival, and during every important update.",
    "Professional handling for garments, homes, and workplaces with the right context for each service type.",
    "Recurring service options that make long-term care easier to manage and easier to trust.",
    "One care desk that keeps follow-up documented instead of scattered across channels.",
  ];

  const flow = [
    {
      step: "01",
      title: "Book the right service",
      body: "Choose garment care, home cleaning, or office cleaning and share the timing, address, and service notes that matter.",
    },
    {
      step: "02",
      title: "Receive clear confirmation",
      body: "You receive confirmation, booking details, payment guidance where relevant, and a tracking code for follow-up.",
    },
    {
      step: "03",
      title: "Service is carried out professionally",
      body: "Garments move through pickup and delivery. Homes and offices move through arrival, on-site work, and completion.",
    },
    {
      step: "04",
      title: "Stay informed until the end",
      body: "Tracking and email updates keep the next step clear, whether that means return delivery or a completed visit.",
    },
  ] as const;

  const reasons = [
    {
      icon: Truck,
      title: "Pickup and delivery",
      body: "Garment care includes controlled pickup, treatment, finishing, and return delivery so customers can follow the order from start to finish.",
    },
    {
      icon: ShieldCheck,
      title: "Quality standards",
      body: "Whether the service happens in a wardrobe, a home, or a workplace, the result should feel consistent, careful, and professionally finished.",
    },
    {
      icon: Sparkles,
      title: "Convenience without compromise",
      body: "Recurring plans, clear updates, and premium support make it easier to keep garments, homes, and workplaces in excellent condition.",
    },
  ] as const;

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
      <div className="mx-auto max-w-[88rem] space-y-16">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent)]">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                About HenryCo Care
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
                {heroBody}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Book a service
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 dark:border-white/15 dark:text-white"
                >
                  Contact the team
                </Link>
              </div>
              <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                {supportPhone}
              </p>
            </div>
            <ul className="grid gap-3 text-sm">
              {heroFacts.map(({ icon: Icon, label, value }) => (
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

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
            Three service lanes
          </p>
          <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
            {lanes.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[color:var(--accent)]" aria-hidden />
                  <h3 className="mt-4 text-[1.2rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="grid gap-12 xl:grid-cols-2 xl:divide-x xl:divide-black/10 dark:xl:divide-white/10">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Why clients trust HenryCo Care
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                Reliable service comes from standards clients can actually feel.
              </h2>
              <ul className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
                {standards.map((item) => (
                  <li key={item} className="flex gap-3 py-4">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                    <p className="text-sm leading-7 text-zinc-600 dark:text-white/68">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="xl:pl-12">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                How the experience works
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                Smooth for the client, disciplined behind the scenes.
              </h2>
              <ol className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
                {flow.map((item) => (
                  <li
                    key={item.step}
                    className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                      Step {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-white/68">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
            What you can expect
          </p>
          <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
            {reasons.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[color:var(--accent)]" aria-hidden />
                  <h3 className="mt-4 text-[1.2rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                Ready to experience HenryCo Care?
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                Book a premium care service with timing, clarity, and follow-through built in.
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                From garment pickup and delivery to recurring home and office cleaning, HenryCo Care
                is built to make dependable service feel easy.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Book a service
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[color:var(--accent)]/50 dark:border-white/15 dark:text-white"
              >
                Explore services
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
