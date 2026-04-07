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
      <section className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card rounded-[2.6rem] px-8 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="max-w-4xl">
            <div className="care-chip inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white/76">
              <Sparkles className="h-5 w-5 text-[color:var(--accent)]" />
              Service collection
            </div>
            <h1 className="mt-7 care-display max-w-4xl text-white">
              Premium service for wardrobes, homes, and workplaces.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              HenryCo Care brings garment care, home cleaning, and office cleaning together under
              one clear standard of timing, communication, and quality.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
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
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="care-card care-sheen rounded-[2rem] p-7">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/12">
                  <Icon className="h-6 w-6 text-[color:var(--accent)]" />
                </div>
                <div className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">{item.title}</div>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-2">
          <PackageCollection title="Home cleaning packages" items={homePackages} />
          <PackageCollection title="Office cleaning packages" items={officePackages} />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Step 1: Scope confirmation",
              body: "We confirm what is being handled, where the service starts, and what completion looks like.",
            },
            {
              title: "Step 2: Controlled execution",
              body: "Wardrobe, home, and office lanes follow tailored execution standards instead of one generic checklist.",
            },
            {
              title: "Step 3: Verified completion",
              body: "Each request ends with a clear completion state, support follow-up path, and a traceable service record.",
            },
          ].map((step) => (
            <div key={step.title} className="care-card rounded-[2rem] p-7">
              <h3 className="text-xl font-semibold text-zinc-950 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card rounded-[2.5rem] px-8 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="care-kicker">Next step</div>
            <h2 className="mt-3 care-section-title text-white">
              Choose the right service, then book with confidence.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/66">
              Review the service model here, then use the pricing page for exact rates and fee rules
              before you submit your booking.
            </p>
          </div>

          <Link
            href="/pricing"
            className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold lg:mt-0"
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
    <div className="care-card care-sheen rounded-[2.2rem] p-8">
      <div className="care-kicker">Package collection</div>
      <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">{title}</h2>
      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-zinc-950 dark:text-white">{item.name}</div>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">{item.summary}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black tracking-[-0.04em] text-[color:var(--accent)]">
                  {formatMoney(item.base_price)}
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/48">
                  {title.includes("Office")
                    ? `${item.staff_count} staff`
                    : item.default_frequency.replaceAll("_", " ")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
