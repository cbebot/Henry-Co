import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import {
  getCarePricingCopy,
  resolveLocalizedDynamicField,
  type CarePricingCopy,
} from "@henryco/i18n/server";
import {
  getCareBookingCatalog,
  getCarePricing,
  getCareSettings,
  groupPricing,
} from "@/lib/care-data";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getCarePricingCopy(locale);
  return {
    title: `${copy.metadata.title} | ${care.name}`,
    description: copy.metadata.description,
  };
}

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default async function PricingPage() {
  const locale = await getCarePublicLocale();
  const copy = getCarePricingCopy(locale);
  const [settings, items, catalog] = await Promise.all([
    getCareSettings(),
    getCarePricing(),
    getCareBookingCatalog(),
  ]);

  const groups = groupPricing(items);
  const homePackages = catalog.packages.filter((item) => item.category_key === "home");
  const officePackages = catalog.packages.filter((item) => item.category_key === "office");

  // PASS — localize Supabase-driven names/labels in the pricing catalog.
  // List rows wrap title fields; long-form description text is TODO'd.
  const groupsLocalized = await Promise.all(
    groups.map(async (group) => ({
      category: await resolveLocalizedDynamicField({
        record: { category: group.category } as Record<string, unknown>,
        field: "category",
        locale,
        fallback: group.category,
        machineTranslate: locale !== "en",
      }),
      rows: await Promise.all(
        group.rows.map(async (row) => ({
          ...row,
          category: await resolveLocalizedDynamicField({
            record: row as unknown as Record<string, unknown>,
            field: "category",
            locale,
            fallback: row.category,
            machineTranslate: locale !== "en",
          }),
          item_name: await resolveLocalizedDynamicField({
            record: row as unknown as Record<string, unknown>,
            field: "item_name",
            locale,
            fallback: row.item_name,
            machineTranslate: locale !== "en",
          }),
          // TODO(list-row): localize `description` in detail surfaces.
        })),
      ),
    })),
  );
  const homePackagesLocalized = await Promise.all(
    homePackages.map(async (item) => ({
      ...item,
      name: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: item.name,
        machineTranslate: locale !== "en",
      }),
      // TODO(list-row): localize package `summary` in detail surfaces.
    })),
  );
  const officePackagesLocalized = await Promise.all(
    officePackages.map(async (item) => ({
      ...item,
      name: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: item.name,
        machineTranslate: locale !== "en",
      }),
      // TODO(list-row): localize package `summary` in detail surfaces.
    })),
  );
  const addonsLocalized = await Promise.all(
    catalog.addOns.map(async (item) => ({
      id: item.id,
      label: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "label",
        locale,
        fallback: item.label,
        machineTranslate: locale !== "en",
      }),
      description: item.description,
      // TODO(list-row): localize add-on `description` in detail surfaces.
      amount: item.amount,
    })),
  );
  const priceRulesLocalized = await Promise.all(
    catalog.priceRules
      .filter((item) => item.is_active)
      .slice(0, 8)
      .map(async (item) => ({
        id: item.id,
        label: await resolveLocalizedDynamicField({
          record: item as unknown as Record<string, unknown>,
          field: "label",
          locale,
          fallback: item.label,
          machineTranslate: locale !== "en",
        }),
        description: item.rule_kind.replaceAll("_", " "),
        amount: item.amount || item.percent,
      })),
  );

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
              <p className="care-kicker text-[10.5px] uppercase tracking-[0.32em] text-[color:var(--accent)]">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-zinc-950 dark:text-white">
                {copy.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-zinc-600 sm:text-lg dark:text-white/68">
                {copy.hero.body}
              </p>
            </div>
            {settings.pricing_note ? (
              <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                  <BadgeCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" /> {copy.hero.pricingNoteEyebrow}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                  {settings.pricing_note}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <div className="grid gap-12 xl:grid-cols-2 xl:divide-x xl:divide-black/10 dark:xl:divide-white/10">
            <PackageList
              title={copy.packages.homeTitle}
              eyebrow={copy.packages.eyebrow}
              staffSuffix={copy.packages.staffSuffix}
              items={homePackagesLocalized}
              layout="home"
            />
            <div className="xl:pl-12">
              <PackageList
                title={copy.packages.officeTitle}
                eyebrow={copy.packages.eyebrow}
                staffSuffix={copy.packages.staffSuffix}
                items={officePackagesLocalized}
                layout="office"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="grid gap-12 xl:grid-cols-2 xl:divide-x xl:divide-black/10 dark:xl:divide-white/10">
            <ModifierList
              title={copy.modifiers.addOnsTitle}
              eyebrow={copy.modifiers.eyebrow}
              items={addonsLocalized}
            />
            <div className="xl:pl-12">
              <ModifierList
                title={copy.modifiers.quoteModifiersTitle}
                eyebrow={copy.modifiers.eyebrow}
                items={priceRulesLocalized}
              />
            </div>
          </div>
        </section>

        <section className="space-y-14">
          {groupsLocalized.map((group) => (
            <div key={group.category}>
              <div className="flex flex-col gap-3 border-b border-black/10 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                    {copy.garment.eyebrow}
                  </p>
                  <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                    {group.category}
                  </h2>
                </div>
                <p className="text-sm text-zinc-500 dark:text-white/56">{copy.garment.currentItemPricing}</p>
              </div>
              <ul className="mt-2 divide-y divide-black/10 dark:divide-white/10">
                {group.rows.map((item) => (
                  <li
                    key={item.id}
                    className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-center sm:gap-8"
                  >
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/48">
                        {item.category}
                      </p>
                      <h3 className="mt-1 text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                        {item.item_name}
                      </h3>
                      {item.description ? (
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-semibold tracking-[-0.02em] text-[color:var(--accent)]">
                        {formatMoney(item.price)}
                      </span>
                      <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/48">
                        {copy.garment.perUnit} {item.unit}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {copy.cta.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
                {copy.cta.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/68">
                {copy.cta.body}
              </p>
            </div>
            <Link
              href="/book"
              className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {copy.cta.button}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PackageList({
  title,
  eyebrow,
  staffSuffix,
  items,
  layout,
}: {
  title: string;
  eyebrow: CarePricingCopy["packages"]["eyebrow"];
  staffSuffix: CarePricingCopy["packages"]["staffSuffix"];
  items: Array<{
    id: string;
    name: string;
    summary: string;
    base_price: number;
    staff_count: number;
    default_frequency: string;
  }>;
  layout: "home" | "office";
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
        {title}
      </h2>
      <ul className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-start sm:gap-8"
          >
            <div>
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                {item.name}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                {item.summary}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl font-semibold tracking-[-0.02em] text-[color:var(--accent)]">
                {formatMoney(item.base_price)}
              </span>
              <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/48">
                {layout === "office"
                  ? `${item.staff_count} ${staffSuffix}`
                  : item.default_frequency.replaceAll("_", " ")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModifierList({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow: CarePricingCopy["modifiers"]["eyebrow"];
  items: Array<{ id: string; label: string; description: string; amount: number }>;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-zinc-950 sm:text-[1.85rem] dark:text-white">
        {title}
      </h2>
      <ul className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-start sm:gap-8"
          >
            <div>
              <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                {item.label}
              </h3>
              <p className="mt-2 text-sm capitalize leading-7 text-zinc-600 dark:text-white/68">
                {item.description}
              </p>
            </div>
            <span className="text-left text-lg font-semibold tracking-[-0.02em] text-[color:var(--accent)] sm:text-right">
              {formatMoney(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
