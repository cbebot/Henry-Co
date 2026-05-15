"use client";

import { Minus, Plus, Star, Tag } from "lucide-react";
import { useMemo } from "react";
import { TypeaheadGrid } from "@henryco/dashboard-shell";

/**
 * GarmentTypeaheadPicker — replaces the prior long-scroll garment picker
 * (anti-pattern #1, audit §B.care-7).
 *
 * V3 Wave B1 deliverable D2: composes the shared `<TypeaheadGrid>`
 * primitive with a Care-flavoured card renderer. Keyword index covers
 * category labels + descriptions so typing "shirt", "linen", "wool",
 * or "formal" all narrow the grid instantly. Quantity controls remain
 * inside each tile so the manifest is built without modal trips.
 *
 * Mobile: TypeaheadGrid collapses to two columns by default + native
 * keyboard search; the surrounding form's BottomActionBar shows the
 * running manifest count for tap-friendly progress.
 */
export type GarmentPickerItem = {
  id: string;
  category: string;
  item_name: string;
  description: string | null;
  unit: string;
  price: number;
  is_featured: boolean;
};

export type GarmentPickerSelected = {
  pricing_id: string;
  quantity: number;
};

type Props = {
  items: GarmentPickerItem[];
  selected: GarmentPickerSelected[];
  onChange: (pricingId: string, nextQuantity: number) => void;
  t: (text: string) => string;
  initialQuery?: string;
};

function formatMoney(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function GarmentTypeaheadPicker({
  items,
  selected,
  onChange,
  t,
  initialQuery,
}: Props) {
  const selectedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of selected) {
      map.set(item.pricing_id, item.quantity);
    }
    return map;
  }, [selected]);

  return (
    <div>
      <TypeaheadGrid<GarmentPickerItem>
        items={items}
        getKey={(item) => item.id}
        getLabel={(item) => item.item_name}
        getKeywords={(item) => [
          item.category,
          item.description ?? "",
          item.unit,
        ]}
        initialQuery={initialQuery}
        placeholder={t("Search garments — shirts, linen, formal wear…")}
        emptyMessage={t("No garments matched that search.")}
        columnsLg={3}
        columnsSm={2}
        onSelect={(item) => {
          const current = selectedMap.get(item.id) ?? 0;
          onChange(item.id, current === 0 ? 1 : current + 1);
        }}
        renderItem={(item) => {
          const quantity = selectedMap.get(item.id) ?? 0;
          const isSelected = quantity > 0;
          return (
            <article
              className={
                isSelected
                  ? "care-pf-pick care-pf-pick--selected"
                  : "care-pf-pick"
              }
            >
              <header className="care-pf-pick__head">
                <span className="care-pf-pick__category">
                  <Tag aria-hidden className="h-3 w-3" />
                  {item.category}
                </span>
                {item.is_featured ? (
                  <span className="care-pf-pick__featured">
                    <Star aria-hidden className="h-3 w-3" />
                    {t("Featured")}
                  </span>
                ) : null}
              </header>
              <h4 className="care-pf-pick__title">{item.item_name}</h4>
              {item.description ? (
                <p className="care-pf-pick__body">{item.description}</p>
              ) : null}
              <footer className="care-pf-pick__foot">
                <div>
                  <span className="care-pf-pick__rate-label">
                    {t("Starting rate")}
                  </span>
                  <span className="care-pf-pick__rate-value">
                    {formatMoney(item.price)}
                    <span className="care-pf-pick__unit">/{item.unit}</span>
                  </span>
                </div>
                <div
                  className="care-pf-pick__qty"
                  onClick={(e) => e.stopPropagation()}
                  role="group"
                  aria-label={t("Quantity")}
                >
                  <button
                    type="button"
                    aria-label={`${t("Reduce")} ${item.item_name}`}
                    className="care-pf-pick__qty-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(item.id, Math.max(0, quantity - 1));
                    }}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="care-pf-pick__qty-value" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`${t("Add")} ${item.item_name}`}
                    className="care-pf-pick__qty-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(item.id, quantity + 1);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </footer>
            </article>
          );
        }}
      />
    </div>
  );
}
