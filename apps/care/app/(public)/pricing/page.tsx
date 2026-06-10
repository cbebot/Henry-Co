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
      <div className="mx-auto max-w-[92rem] space-y-16">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="care-kicker text-[10.5px] uppercase tracking-[0.32em] text-[color:var(--home-accent-text)]">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
                {copy.hero.title}
              </h1>
              {/* READING-02: hero body in the editorial serif reading face. */}
              <p className="hc-font-reading mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)] sm:text-lg">
                {copy.hero.body}
              </p>
            </div>
            {settings.pricing_note ? (
              <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
                  <BadgeCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" /> {copy.hero.pricingNoteEyebrow}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-70)]">
                  {settings.pricing_note}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <div className="grid gap-12 xl:grid-cols-2 xl:divide-x xl:divide-[color:var(--home-line)]">
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
          <div className="grid gap-12 xl:grid-cols-2 xl:divide-x xl:divide-[color:var(--home-line)]">
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
              <div className="flex flex-col gap-3 border-b border-[color:var(--home-line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                    {copy.garment.eyebrow}
                  </p>
                  <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                    {group.category}
                  </h2>
                </div>
                <p className="text-sm text-[color:var(--home-ink-50)]">{copy.garment.currentItemPricing}</p>
              </div>
              <ul className="mt-2 divide-y divide-[color:var(--home-line)]">
                {group.rows.map((item) => (
                  <li
                    key={item.id}
                    className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-center sm:gap-8"
                  >
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                        {item.category}
                      </p>
                      <h3 className="mt-1 text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
                        {item.item_name}
                      </h3>
                      {item.description ? (
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--home-ink-70)]">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-semibold tracking-[-0.02em] text-[color:var(--home-accent-text)]">
                        {formatMoney(item.price)}
                      </span>
                      <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)]">
                        {copy.garment.perUnit} {item.unit}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="border-t border-[color:var(--home-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                {copy.cta.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.cta.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-ink-70)]">
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
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
        {title}
      </h2>
      <ul className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-start sm:gap-8"
          >
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
                {item.name}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[color:var(--home-ink-70)]">
                {item.summary}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl font-semibold tracking-[-0.02em] text-[color:var(--home-accent-text)]">
                {formatMoney(item.base_price)}
              </span>
              <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)]">
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
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
        {title}
      </h2>
      <ul className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid gap-3 py-5 sm:grid-cols-[1fr,auto] sm:items-start sm:gap-8"
          >
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
                {item.label}
              </h3>
              <p className="mt-2 text-sm capitalize leading-7 text-[color:var(--home-ink-70)]">
                {item.description}
              </p>
            </div>
            <span className="text-left text-lg font-semibold tracking-[-0.02em] text-[color:var(--home-accent-text)] sm:text-right">
              {formatMoney(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
