import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Home, Package2, Sparkles } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getCareBookingCatalog } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: `Services | ${care.name}`,
  description:
    "Explore garment care, home cleaning, office cleaning, pickup, delivery, and recurring services from HenryCo Care.",
};

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default async function ServicesPage() {
  const catalog = await getCareBookingCatalog();
  const homePackages = catalog.packages.filter((item) => item.category_key === "home");
  const officePackages = catalog.packages.filter((item) => item.category_key === "office");

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
      {/* Editorial hero */}
      <section className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card rounded-[2.6rem] px-8 py-12 sm:px-10 lg:px-14 lg:py-14">
          <div className="max-w-3xl">
            <div className="care-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/76">
              <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
              Service collection
            </div>
            <h1 className="mt-7 care-display max-w-3xl text-balance text-white">
              Wardrobes, homes, workplaces &mdash; one operating standard.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-[1.7] text-white/72 sm:text-lg">
              Garment care, home cleaning, and office cleaning held on one standard of timing,
              communication, and quality.
            </p>
          </div>
        </div>
      </section>

      {/* Three lanes — editorial 3-col with hairline dividers, no panels */}
      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="flex items-baseline gap-4">
          <p className="care-kicker">Three lanes</p>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
          {[
            {
              icon: Package2,
              title: "Garment care",
              body: "Dry cleaning, laundry, pressing, stain treatment, delicate handling, urgent turnaround, and return delivery support.",
            },
            {
              icon: Home,
              title: "Home cleaning",
              body: "One-time and recurring home cleaning, deep cleaning, move-in or move-out support, and carefully planned visit windows.",
            },
            {
              icon: Building2,
              title: "Office cleaning",
              body: "Office suite cleaning, common-area care, after-hours execution, and recurring commercial coverage shaped around your site.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[color:var(--accent)]" aria-hidden />
                <h3 className="mt-4 text-[1.25rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Package collections — 2 column editorial split */}
      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-2">
          <PackageCollection title="Home cleaning packages" items={homePackages} />
          <PackageCollection title="Office cleaning packages" items={officePackages} />
        </div>
      </section>

      {/* Three steps — horizontal numbered timeline */}
      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="flex items-baseline gap-4">
          <p className="care-kicker">Service flow</p>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Scope confirmation",
              body: "We confirm what is being handled, where the service starts, and what completion looks like.",
            },
            {
              title: "Controlled execution",
              body: "Wardrobe, home, and office lanes follow tailored execution standards instead of one generic checklist.",
            },
            {
              title: "Verified completion",
              body: "Each request ends with a clear completion state, support follow-up path, and a traceable service record.",
            },
          ].map((step, i) => (
            <li
              key={step.title}
              className={`border-t border-black/10 pt-6 dark:border-white/10 ${
                i > 0 ? "md:border-l md:border-t-0 md:pl-6 md:pt-0" : ""
              }`}
            >
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                Step {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-[1.05rem] font-semibold leading-snug tracking-tight text-zinc-950 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Closing band — kept as care-dash-card since it's the brand voice */}
      <section className="mx-auto mt-24 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card rounded-[2.5rem] px-8 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="care-kicker">Next step</p>
            <h2 className="mt-4 care-section-title text-white">
              Choose the right service, then book with confidence.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
              Review the service model here, then use the pricing page for exact rates and fee
              rules before you submit your booking.
            </p>
          </div>
          <Link
            href="/pricing"
            className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold lg:mt-0"
          >
            Review pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PackageCollection({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    name: string;
    summary: string;
    base_price: number;
    staff_count: number;
    default_frequency: string;
  }>;
}) {
  return (
    <div>
      <p className="care-kicker">Package collection</p>
      <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">{title}</h2>
      <ul className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
        {items.map((item) => (
          <li key={item.id} className="grid items-baseline gap-5 py-5 sm:grid-cols-[1fr,auto]">
            <div className="min-w-0">
              <h3 className="text-[1.1rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
                {item.name}
              </h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                {item.summary}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[1.45rem] font-semibold leading-tight tracking-tight text-[color:var(--accent)]">
                {formatMoney(item.base_price)}
              </p>
              <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/48">
                {title.includes("Office")
                  ? `${item.staff_count} staff`
                  : item.default_frequency.replaceAll("_", " ")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
