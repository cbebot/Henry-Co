import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Home, Package2, Sparkles } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getCareServicesCopy } from "@henryco/i18n/server";
import { getCarePublicLocale } from "@/lib/locale-server";
import { getCareBookingCatalog } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getCareServicesCopy(locale);
  return {
    title: copy.metadata.titleTemplate.replace("{division}", care.name),
    description: copy.metadata.description,
  };
}

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default async function ServicesPage() {
  const locale = await getCarePublicLocale();
  const copy = getCareServicesCopy(locale);
  const catalog = await getCareBookingCatalog();
  const homePackages = catalog.packages.filter((item) => item.category_key === "home");
  const officePackages = catalog.packages.filter((item) => item.category_key === "office");

  const lanes = [
    {
      icon: Package2,
      title: copy.threeLanes.garmentCare.title,
      body: copy.threeLanes.garmentCare.body,
    },
    {
      icon: Home,
      title: copy.threeLanes.homeCleaning.title,
      body: copy.threeLanes.homeCleaning.body,
    },
    {
      icon: Building2,
      title: copy.threeLanes.officeCleaning.title,
      body: copy.threeLanes.officeCleaning.body,
    },
  ];

  const flowSteps = [
    { title: copy.flow.scope.title, body: copy.flow.scope.body },
    { title: copy.flow.execution.title, body: copy.flow.execution.body },
    { title: copy.flow.completion.title, body: copy.flow.completion.body },
  ];

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="overflow-hidden bg-transparent pb-24 pt-8"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      {/* Editorial hero — compressed so the three-lane service grid below
       * is visible above the fold. CHROME-01A audit caught the previous
       * variant taking the full first viewport, hiding the lanes. */}
      <section className="mx-auto max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card rounded-[2.2rem] px-6 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <div className="max-w-3xl">
            <div className="care-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/76">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {copy.hero.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.025em] text-white sm:text-[2rem] md:text-[2.3rem]">
              {copy.hero.title}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-[1.65] text-white/72 sm:text-base">
              {copy.hero.body}
            </p>
          </div>
        </div>
      </section>

      {/* Three lanes — editorial 3-col with hairline dividers, no panels */}
      <section className="mx-auto mt-10 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="flex items-baseline gap-4">
          <p className="care-kicker">{copy.threeLanes.eyebrow}</p>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
          {lanes.map((item, i) => {
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
          <PackageCollection
            collectionEyebrow={copy.packages.collectionEyebrow}
            title={copy.packages.homeHeading}
            staffUnit={copy.packages.staffUnit}
            variant="home"
            items={homePackages}
          />
          <PackageCollection
            collectionEyebrow={copy.packages.collectionEyebrow}
            title={copy.packages.officeHeading}
            staffUnit={copy.packages.staffUnit}
            variant="office"
            items={officePackages}
          />
        </div>
      </section>

      {/* Three steps — horizontal numbered timeline */}
      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="flex items-baseline gap-4">
          <p className="care-kicker">{copy.flow.eyebrow}</p>
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {flowSteps.map((step, i) => (
            <li
              key={step.title}
              className={`border-t border-black/10 pt-6 dark:border-white/10 ${
                i > 0 ? "md:border-l md:border-t-0 md:pl-6 md:pt-0" : ""
              }`}
            >
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                {copy.flow.stepLabel} {String(i + 1).padStart(2, "0")}
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
            <p className="care-kicker">{copy.closing.eyebrow}</p>
            <h2 className="mt-4 care-section-title text-white">{copy.closing.title}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">{copy.closing.body}</p>
          </div>
          <Link
            href="/pricing"
            className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold lg:mt-0"
          >
            {copy.closing.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PackageCollection({
  collectionEyebrow,
  title,
  staffUnit,
  variant,
  items,
}: {
  collectionEyebrow: string;
  title: string;
  staffUnit: string;
  variant: "home" | "office";
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
      <p className="care-kicker">{collectionEyebrow}</p>
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
                {variant === "office"
                  ? `${item.staff_count} ${staffUnit}`
                  : item.default_frequency.replaceAll("_", " ")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
