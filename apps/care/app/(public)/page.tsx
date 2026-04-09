import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  PhoneCall,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { getDivisionConfig } from "@henryco/config";

import CareFlow from "@/components/care/CareFlow";
import {
  getApprovedReviews,
  getCareBookingCatalog,
  getCarePricing,
  getCareSettings,
} from "@/lib/care-data";
import { getCarePublicChipUser } from "@/lib/care-public-viewer";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: care.name,
  description:
    "Premium garment care, home cleaning, office cleaning, pickup, delivery, and recurring service from HenryCo Care.",
};

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatMoney(value: number | string) {
  return nairaFormatter.format(Number(value || 0));
}

function stars(count: number) {
  return Array.from({ length: Math.max(0, Math.min(5, Number(count) || 0)) });
}

export default async function CareHomePage() {
  const [settings, pricing, reviews, catalog, chipUser] = await Promise.all([
    getCareSettings(),
    getCarePricing(),
    getApprovedReviews(6),
    getCareBookingCatalog(),
    getCarePublicChipUser(),
  ]);

  const careHeroFirstName = chipUser
    ? chipUser.displayName.trim().split(/\s+/)[0] || null
    : null;

  const featuredPricing = pricing.filter((item) => item.is_featured).slice(0, 4);
  const garmentPreview = featuredPricing.length > 0 ? featuredPricing : pricing.slice(0, 4);
  const homePackages = catalog.packages.filter((item) => item.category_key === "home").slice(0, 2);
  const officePackages = catalog.packages.filter((item) => item.category_key === "office").slice(0, 2);
  const supportEmail = settings.support_email || care.supportEmail;
  const supportPhone = settings.support_phone || care.supportPhone;
  const heroImageUrl = settings.hero_image_url?.trim() || null;

  const clientProfiles = [
    {
      icon: CheckCircle2,
      title: "Private households",
      body: "Recurring home care, one-off intensive cleans, and wardrobe support from one calmer account experience.",
    },
    {
      icon: Repeat,
      title: "Managed estates",
      body: "Saved schedules, property notes, and steady follow-through for estates, apartments, and multi-unit residences.",
    },
    {
      icon: Building2,
      title: "Commercial operators",
      body: "Routine office cleaning with dependable scheduling, clear communication, and accountability from visit to sign-off.",
    },
  ] as const;

  const serviceJourneys = [
    {
      title: "Garments end in delivery",
      body: "Garment care moves through pickup, treatment, finishing, packing, and return delivery back to you.",
    },
    {
      title: "Homes end in completion quality",
      body: "Home cleaning is centred on arrival timing, on-site work, final checks, and a result you can walk back into confidently.",
    },
    {
      title: "Offices end in sign-off",
      body: "Office cleaning is built around schedule readiness, site access, completed tasks, and a confident final handover.",
    },
  ] as const;

  const heroTitle =
    settings.hero_title || "Care for garments, homes, and workplaces with one trusted service team.";

  return (
    <main
      className="overflow-hidden bg-transparent pb-24"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <section className="mx-auto max-w-[88rem] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="care-dash-card relative overflow-hidden rounded-[2.8rem] px-7 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at top, color-mix(in srgb, var(--accent) 18%, transparent), transparent 30%)",
            }}
          />
          <div className="pointer-events-none absolute right-[-8rem] top-[-5rem] h-80 w-80 rounded-full bg-[color:var(--accent-secondary)]/12 blur-3xl" />
          <div className="pointer-events-none absolute left-[-6rem] bottom-[-6rem] h-80 w-80 rounded-full bg-[color:var(--accent)]/12 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="care-chip inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white/76">
                <ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" />
                {settings.hero_badge || "Garment care, home cleaning, and office cleaning"}
              </div>

              {chipUser ? (
                <p className="mt-6 text-sm font-semibold tracking-tight text-white/72">
                  Welcome back{careHeroFirstName ? `, ${careHeroFirstName}` : ""}.
                </p>
              ) : null}

              <h1
                className={`max-w-4xl text-balance care-display text-white ${chipUser ? "mt-5" : "mt-7"}`}
              >
                {heroTitle}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
                {settings.hero_subtitle ||
                  "Book garment pickup and return delivery, recurring home cleaning, or office cleaning through one calmer service flow with clear timing, payment follow-up, and live updates."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="care-button-primary inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"
                >
                  Plan service
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Explore services
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  "Garments return in delivery",
                  "Homes and offices finish on-site",
                  "Clear tracking and payment follow-up",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/62"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {heroImageUrl ? (
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111f] p-4">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.08),rgba(7,17,31,0.74))]" />

                  <div className="relative flex min-h-[18rem] flex-col justify-end rounded-[1.6rem] border border-white/10 bg-black/10 p-5 backdrop-blur-[2px]">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/74">
                      <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                      Signature service image
                    </div>
                    <div className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
                      The latest Care imagery is reflected here automatically.
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-white/68">
                      Every update keeps the public experience aligned with the current HenryCo Care
                      brand, so the service always feels polished and up to date.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoPanel
                  icon={Clock3}
                  label="Service hours"
                  value={settings.pickup_hours || "Mon - Sat • 8:00 AM to 7:00 PM"}
                  note="Pickup windows, visit timing, and support handoff held under one service desk"
                />
                <InfoPanel
                  icon={PhoneCall}
                  label="Support"
                  value={supportPhone || "Support line on request"}
                  note={supportEmail || "care@henrycogroup.com"}
                />
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Service clarity
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Garments</p>
                    <p className="mt-1 text-sm leading-6 text-white/64">
                      Pickup, treatment, finishing, and return delivery.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Homes</p>
                    <p className="mt-1 text-sm leading-6 text-white/64">
                      Scheduled arrival, on-site work, and completion checks.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Offices</p>
                    <p className="mt-1 text-sm leading-6 text-white/64">
                      Site access, service delivery, and final sign-off.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <CareFlow />
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
          <div className="care-card rounded-[2.2rem] p-8">
            <div className="care-kicker">Service journeys</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Service timelines that match the work being done.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              A garment order should feel different from a home clean or an office visit. HenryCo
              Care keeps each service clear so customers always understand what stage comes next.
            </p>

            <div className="mt-6 grid gap-4">
              {serviceJourneys.map((item) => (
                <div
                  key={item.title}
                  className="care-sheen rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
          {clientProfiles.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="care-card rounded-[2.1rem] p-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                  <Icon className="h-6 w-6 text-[color:var(--accent)]" />
                </div>
                <div className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {item.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                  {item.body}
                </p>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <section id="pickup" className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <div className="care-card rounded-[2.3rem] p-8">
            <div className="care-kicker">Residential care</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Home care planned around your property and your schedule.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              Move from a one-time clean into recurring home care without losing clarity around
              scope, timing, staffing, or access notes.
            </p>

            <div className="mt-6 grid gap-4">
              {homePackages.map((item) => (
                <PackageCard
                  key={item.id}
                  title={item.name}
                  body={item.summary}
                  value={formatMoney(item.base_price)}
                  meta={item.default_frequency.replaceAll("_", " ")}
                />
              ))}
            </div>
          </div>

          <div className="care-card rounded-[2.3rem] p-8">
            <div className="care-kicker">Commercial coverage</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Office cleaning built for reliable business continuity.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              After-hours cleaning, site access coordination, and recurring workplace care are
              handled with the same reliability clients expect from any serious service partner.
            </p>

            <div className="mt-6 grid gap-4">
              {officePackages.map((item) => (
                <PackageCard
                  key={item.id}
                  title={item.name}
                  body={item.summary}
                  value={formatMoney(item.base_price)}
                  meta={`${item.staff_count} staff`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="care-card rounded-[2.3rem] p-8">
            <div className="care-kicker">Current garment pricing</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Garment pricing stays transparent and current.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              Dry cleaning, laundry, pressing, and treatment prices stay clear before you book, so
              the estimate you review feels grounded and believable.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {garmentPreview.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/48">
                    {item.category}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-zinc-950 dark:text-white">
                    {item.item_name}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <div className="text-3xl font-black tracking-[-0.04em] text-[color:var(--accent)]">
                      {formatMoney(item.price)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/48">
                      /{item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="care-card rounded-[2.3rem] p-8">
            <div className="care-kicker">Client reviews</div>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              Real feedback from clients who have experienced the service.
            </h2>

            <div className="mt-6 grid gap-4">
              {reviews.length > 0 ? (
                reviews.slice(0, 3).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-1 text-[color:var(--accent)]">
                      {stars(review.rating).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-white/72">
                      “{review.review_text}”
                    </p>
                    {review.photo_url ? (
                      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/10 bg-white/75 dark:border-white/10 dark:bg-white/[0.05]">
                        <Image
                          src={review.photo_url}
                          alt={`Review image from ${review.customer_name}`}
                          width={960}
                          height={704}
                          unoptimized
                          className="h-44 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="mt-4 text-sm font-semibold text-zinc-950 dark:text-white">
                      {review.customer_name}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xl font-semibold text-zinc-950 dark:text-white">
                    Client reviews will appear here
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                    Recent feedback is added here once it has been checked for accuracy and quality.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card relative overflow-hidden rounded-[2.6rem] px-8 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at right, color-mix(in srgb, var(--accent-secondary) 18%, transparent), transparent 32%)",
            }}
          />
          <div className="relative max-w-2xl">
            <div className="care-kicker">Ready when you are</div>
            <h2 className="mt-3 care-section-title text-white">
              Book with clarity, then follow the service with confidence.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/66">
              From pickup windows to on-site visits and return delivery, HenryCo Care keeps every
              service update visible enough that you are not left guessing.
            </p>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-0">
            <Link
              href="/book"
              className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold"
            >
              Plan service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Explore service families
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoPanel({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
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

function PackageCard({
  title,
  body,
  value,
  meta,
}: {
  title: string;
  body: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</div>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">{body}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black tracking-[-0.04em] text-[color:var(--accent)]">{value}</div>
          <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/48">
            {meta}
          </div>
        </div>
      </div>
    </div>
  );
}
