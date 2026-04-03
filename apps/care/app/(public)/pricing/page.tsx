import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import {
  getCareBookingCatalog,
  getCarePricing,
  getCareSettings,
  groupPricing,
} from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: `Pricing | ${care.name}`,
  description:
    "Transparent garment pricing, home cleaning packages, office cleaning packages, and service add-ons across HenryCo Care.",
};

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default async function PricingPage() {
  const [settings, items, catalog] = await Promise.all([
    getCareSettings(),
    getCarePricing(),
    getCareBookingCatalog(),
  ]);

  const groups = groupPricing(items);
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
              Pricing clarity
            </div>
            <h1 className="mt-7 care-display max-w-4xl text-white">
              Clear pricing before you commit to service.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              Review garment pricing, home and office packages, and the most common service
              add-ons before you place a request.
            </p>

            {settings.pricing_note ? (
              <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                  <BadgeCheck className="h-4 w-4" />
                  Pricing note
                </div>
                <div className="mt-3 text-sm leading-7 text-white/68">{settings.pricing_note}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-2">
          <PackageGrid title="Home cleaning packages" items={homePackages} />
          <PackageGrid title="Office cleaning packages" items={officePackages} />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-2">
          <ModifierGrid
            title="Structured add-ons"
            items={catalog.addOns.map((item) => ({
              id: item.id,
              label: item.label,
              description: item.description,
              amount: item.amount,
            }))}
          />
          <ModifierGrid
            title="Quote modifiers"
            items={catalog.priceRules
              .filter((item) => item.is_active)
              .slice(0, 8)
              .map((item) => ({
                id: item.id,
                label: item.label,
                description: item.rule_kind.replaceAll("_", " "),
                amount: item.amount || item.percent,
              }))}
          />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="space-y-14">
          {groups.map((group) => (
            <section key={group.category} className="care-card rounded-[2.2rem] p-8">
              <div className="flex flex-col gap-3 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="care-kicker">Garment category</div>
                  <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
                    {group.category}
                  </h2>
                </div>
                <div className="text-sm text-zinc-500 dark:text-white/56">
                  Current item pricing
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.rows.map((item) => (
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
                    {item.description ? (
                      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-5 flex items-baseline justify-between gap-3">
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
            </section>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-8 lg:px-10">
        <div className="care-dash-card rounded-[2.5rem] px-8 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="care-kicker">Move forward</div>
            <h2 className="mt-3 care-section-title text-white">
              Review the price structure, then book with clarity.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/66">
              Garment care stays item-based. Home and office services stay grounded in package
              scope, travel, urgency, team size, and optional extras.
            </p>
          </div>
          <Link
            href="/book"
            className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold lg:mt-0"
          >
            Plan service
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PackageGrid({
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
      <div className="care-kicker">Package pricing</div>
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

function ModifierGrid({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; label: string; description: string; amount: number }>;
}) {
  return (
    <div className="care-card care-sheen rounded-[2.2rem] p-8">
      <div className="care-kicker">Quote structure</div>
      <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">{title}</h2>
      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-zinc-950 dark:text-white">{item.label}</div>
                <p className="mt-2 text-sm capitalize leading-7 text-zinc-600 dark:text-white/68">
                  {item.description}
                </p>
              </div>
              <div className="text-right text-lg font-black tracking-[-0.03em] text-[color:var(--accent)]">
                {formatMoney(item.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
