import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { formatCurrency } from "@/lib/utils";
import { getPropertyPublicLocale } from "@/lib/locale-server";
import type { PropertyListing } from "@/lib/property/types";

/**
 * V3 PASS 21 — ComparablePricingRail.
 *
 * Renders 3-5 similar listings as an editorial price-comparison strip.
 * Each row shows the comparable listing's price, beds, sqm, area, and
 * an up/down indicator vs the target listing's price.
 *
 * Layout: hairline-divided rows, no card chrome. Sticks with the
 * editorial composition used elsewhere in the property detail page.
 */

export type ComparableListingInput = Pick<
  PropertyListing,
  | "id"
  | "slug"
  | "title"
  | "locationLabel"
  | "kind"
  | "price"
  | "currency"
  | "priceInterval"
  | "bedrooms"
  | "bathrooms"
  | "sizeSqm"
>;

function deltaPct(target: number, comparable: number) {
  if (!target) return 0;
  return Math.round(((comparable - target) / target) * 100);
}

export function selectComparableListings(
  target: ComparableListingInput,
  pool: ComparableListingInput[],
  limit = 4
): ComparableListingInput[] {
  return pool
    .filter((row) => row.id !== target.id)
    .filter((row) => row.kind === target.kind)
    .map((row) => ({
      row,
      score:
        (row.locationLabel === target.locationLabel ? 4 : 0) +
        (row.bedrooms === target.bedrooms ? 2 : 0) +
        (Math.abs((row.sizeSqm ?? 0) - (target.sizeSqm ?? 0)) <= 25 ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.row);
}

export async function ComparablePricingRail({
  target,
  comparables,
}: {
  target: ComparableListingInput;
  comparables: ComparableListingInput[];
}) {
  if (comparables.length === 0) return null;

  // Wrap comparable listing titles — 4-row max, detail page is single-row.
  const locale = await getPropertyPublicLocale();
  const localizedComparables = await Promise.all(
    comparables.map(async (row) => {
      const title = await resolveLocalizedDynamicField({
        record: row as unknown as Record<string, unknown>,
        field: "title",
        locale,
        fallback: row.title ?? "",
        machineTranslate: locale !== "en",
      });
      return { ...row, title };
    }),
  );

  return (
    <section>
      <div className="flex items-baseline gap-4">
        <p className="property-kicker">Comparable pricing</p>
        <span className="h-px flex-1 bg-[var(--property-line)]" />
      </div>
      <p className="mt-4 max-w-md text-[13.5px] leading-7 text-[var(--property-ink-soft)]">
        Similar listings in the same category and area, ranked by closeness on
        beds, size, and location. Use the delta column to gauge market posture.
      </p>

      <ul className="mt-6 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
        {localizedComparables.map((row) => {
          const delta = deltaPct(target.price, row.price);
          const direction =
            delta > 1 ? "up" : delta < -1 ? "down" : "flat";
          const DeltaIcon =
            direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
          const deltaLabel =
            direction === "up"
              ? `+${delta}%`
              : direction === "down"
                ? `${delta}%`
                : "≈ same";
          const deltaTone =
            direction === "up"
              ? "text-[var(--property-accent-strong)]"
              : direction === "down"
                ? "text-[var(--property-sage-soft)]"
                : "text-[var(--property-ink-muted)]";

          return (
            <li key={row.id} className="py-4">
              <Link
                href={`/property/${row.slug}`}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-baseline sm:gap-x-6"
              >
                <div className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold tracking-[-0.005em] text-[var(--property-ink)]">
                    {row.title}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-[var(--property-ink-soft)]">
                    {row.locationLabel}
                    {row.bedrooms ? ` · ${row.bedrooms} bed` : ""}
                    {row.sizeSqm ? ` · ${row.sizeSqm} sqm` : ""}
                  </span>
                </div>
                <span className="text-[13.5px] font-semibold tracking-tight tabular-nums text-[var(--property-ink)] sm:text-right">
                  {formatCurrency(row.price, row.currency)}
                </span>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)] sm:text-right">
                  {row.priceInterval}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[12.5px] font-semibold tabular-nums ${deltaTone} sm:justify-self-end`}
                >
                  <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
                  {deltaLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
