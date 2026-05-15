"use client";

import { useCallback, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type {
  MarketplaceProduct,
  MarketplaceProductVariant,
} from "@/lib/marketplace/types";

type VariantMatrixProps = {
  product: MarketplaceProduct;
  variants: MarketplaceProductVariant[];
  /**
   * Called when a variant becomes the active selection (all axes
   * resolved to a single match). Receives the resolved variant or
   * null when no variant matches the current axis combination.
   */
  onSelect?: (variant: MarketplaceProductVariant | null) => void;
};

/**
 * V3 PASS 21 — <VariantMatrix>
 *
 * Renders a column-per-axis selector (color, size, material, etc.)
 * derived from the variants' option keys. Selecting a value disables
 * options on other axes that have no in-stock match, mirrors the
 * resolved price + stock + image, and emits the resolved variant
 * upwards so the buy box, gallery, and JSON-LD stay coherent without
 * a page reload (M3 gate).
 *
 * Empty when the product has no variants — caller can hide the
 * surface entirely in that case.
 */
export function VariantMatrix({ product, variants, onSelect }: VariantMatrixProps) {
  const axes = useMemo(() => buildAxes(variants), [variants]);
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    // Pre-seed each axis with the first in-stock value if available, else first value.
    const seed: Record<string, string> = {};
    for (const axis of axes) {
      const inStock = axis.values.find((v) => v.someInStock);
      const value = (inStock ?? axis.values[0])?.value;
      if (value) seed[axis.key] = value;
    }
    return seed;
  });

  const resolvedVariant = useMemo(
    () => resolveVariant(variants, selection),
    [variants, selection],
  );

  const setAxis = useCallback(
    (axisKey: string, value: string) => {
      setSelection((prev) => {
        const next = { ...prev, [axisKey]: value };
        onSelect?.(resolveVariant(variants, next));
        return next;
      });
    },
    [onSelect, variants],
  );

  if (axes.length === 0) return null;

  const activePrice = resolvedVariant?.price ?? product.basePrice;
  const activeCompareAt = resolvedVariant?.compareAtPrice ?? product.compareAtPrice;
  const activeCurrency = resolvedVariant?.currency ?? product.currency;
  const activeStock = resolvedVariant?.stock ?? product.stock;
  const activeSku = resolvedVariant?.sku ?? product.sku;

  return (
    <section
      aria-label="Product variant selection"
      className="border-y border-[var(--market-line)] py-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
          Choose your variant
        </p>
        <p className="text-xs text-[var(--market-muted)]">
          SKU <span className="font-mono text-[var(--market-paper-white)]">{activeSku}</span>
        </p>
      </header>

      <div className="mt-5 space-y-5">
        {axes.map((axis) => (
          <fieldset key={axis.key} className="space-y-2">
            <legend className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {axis.label}
              <span className="ml-2 normal-case tracking-normal text-[var(--market-paper-white)]">
                {selection[axis.key] ?? "—"}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {axis.values.map((entry) => {
                const isSelected = selection[axis.key] === entry.value;
                const isReachable = isOptionReachable(
                  variants,
                  selection,
                  axis.key,
                  entry.value,
                );
                return (
                  <button
                    key={entry.value}
                    type="button"
                    aria-pressed={isSelected}
                    aria-disabled={!isReachable && !isSelected}
                    onClick={() => isReachable && setAxis(axis.key, entry.value)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      isSelected
                        ? "border-[var(--market-brass)] bg-[var(--market-brass)]/15 text-[var(--market-paper-white)]"
                        : isReachable
                          ? "border-[var(--market-line)] text-[var(--market-paper-white)] hover:border-[var(--market-brass)]"
                          : "cursor-not-allowed border-[var(--market-line)] text-[var(--market-muted)] line-through opacity-60",
                    ].join(" ")}
                  >
                    {entry.value}
                    {!entry.someInStock ? (
                      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--market-muted)]">
                        Out
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
            Price
          </dt>
          <dd className="mt-1 text-lg font-semibold text-[var(--market-paper-white)]">
            {formatCurrency(activePrice, activeCurrency)}
            {activeCompareAt && activeCompareAt > activePrice ? (
              <span className="ml-2 text-xs font-normal text-[var(--market-muted)] line-through">
                {formatCurrency(activeCompareAt, activeCurrency)}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
            Availability
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--market-paper-white)]">
            {activeStock > 0
              ? `${activeStock} in stock`
              : "Currently unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
            Match
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--market-paper-white)]">
            {resolvedVariant
              ? "Exact variant resolved"
              : "Pick a value for each axis"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

type Axis = {
  key: string;
  label: string;
  values: Array<{ value: string; someInStock: boolean }>;
};

function buildAxes(variants: MarketplaceProductVariant[]): Axis[] {
  if (!variants?.length) return [];
  const map = new Map<string, Map<string, boolean>>();
  for (const variant of variants) {
    if (variant.status === "archived" || variant.status === "draft") continue;
    for (const [key, value] of Object.entries(variant.options)) {
      if (!value) continue;
      if (!map.has(key)) map.set(key, new Map());
      const slot = map.get(key)!;
      const prev = slot.get(value) ?? false;
      slot.set(value, prev || variant.stock > 0);
    }
  }
  return Array.from(map.entries()).map(([key, values]) => ({
    key,
    label: humanizeAxisKey(key),
    values: Array.from(values.entries()).map(([value, someInStock]) => ({
      value,
      someInStock,
    })),
  }));
}

function humanizeAxisKey(key: string): string {
  return key
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveVariant(
  variants: MarketplaceProductVariant[],
  selection: Record<string, string>,
): MarketplaceProductVariant | null {
  if (!variants?.length) return null;
  const keys = Object.keys(selection);
  if (keys.length === 0) return null;
  const match = variants.find((variant) =>
    keys.every((key) => variant.options[key] === selection[key]),
  );
  return match ?? null;
}

function isOptionReachable(
  variants: MarketplaceProductVariant[],
  selection: Record<string, string>,
  axisKey: string,
  candidate: string,
): boolean {
  // Reachable if at least one variant satisfies (current selection sans axisKey) + (axisKey=candidate)
  const fixed: Record<string, string> = { ...selection, [axisKey]: candidate };
  return variants.some((variant) => {
    if (variant.stock <= 0 && variant.status !== "active") return false;
    return Object.entries(fixed).every(
      ([key, value]) => variant.options[key] === value,
    );
  });
}
