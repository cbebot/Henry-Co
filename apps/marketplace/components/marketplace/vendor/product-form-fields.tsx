"use client";

import type { ReactNode } from "react";
import type { ProductFieldValues } from "@/lib/marketplace/vendor/draft-apply";

export interface ProductOption {
  slug: string;
  name: string;
}

/**
 * Every user-facing string arrives translated from the server page (pages own
 * their `t`). Optional labels gate optional fields: `slug` renders the
 * product-handle input (create page only) and `featureRequested` renders the
 * featured-placement checkbox (create page only).
 */
export interface ProductFormLabels {
  essentials: string;
  title: string;
  slug?: string;
  summary: string;
  description: string;
  category: string;
  brand: string;
  noBrand: string;
  pricingStock: string;
  basePrice: string;
  compareAtPrice: string;
  stock: string;
  sku: string;
  leadTime: string;
  fulfillmentTrust: string;
  deliveryNote: string;
  material: string;
  warranty: string;
  codEligible: string;
  featureRequested?: string;
}

/** One record backs the whole form; `initial` overrides land on top of the
 *  empty defaults. The category defaults to the first option — the same
 *  selection the previous uncontrolled `<select>` posted. */
export function buildInitialProductFieldValues(
  initial: Partial<ProductFieldValues>,
  categories: ProductOption[],
): ProductFieldValues {
  return {
    title: "",
    slug: "",
    summary: "",
    description: "",
    category_slug: categories[0]?.slug ?? "",
    brand_slug: "",
    base_price: "",
    compare_at_price: "",
    stock: "",
    sku: "",
    lead_time: "",
    delivery_note: "",
    material: "",
    warranty: "",
    cod_eligible: false,
    feature_requested: false,
    ...initial,
  };
}

/**
 * The text/select/checkbox fields of the vendor product form as CONTROLLED
 * inputs — the form owns its values in React state, so the AI draft applies
 * through state, never through DOM pokes. Every `name` attribute is part of
 * the `vendor_product_upsert` post contract and stays exactly as before.
 * The Media section (ImageUploadField) is passed in via `media` and rendered
 * between Essentials and Pricing & stock, where it has always been.
 */
export function ProductFormFields({
  values,
  onFieldChange,
  categories,
  brands,
  labels,
  descriptionRows = 5,
  highlightedFields = [],
  media,
}: {
  values: ProductFieldValues;
  onFieldChange: (name: string, value: string | boolean) => void;
  categories: ProductOption[];
  brands: ProductOption[];
  labels: ProductFormLabels;
  descriptionRows?: number;
  /** Field names the draft just filled — briefly marked with a token ring. */
  highlightedFields?: string[];
  media?: ReactNode;
}) {
  const text = (name: string): string => {
    const value = values[name];
    return typeof value === "string" ? value : "";
  };
  const flag = (name: string): boolean => values[name] === true;
  const mark = (name: string): string =>
    highlightedFields.includes(name) ? " ring-1 ring-[var(--market-brass)]" : "";

  return (
    <>
      <section className="space-y-4">
        <p className="market-kicker">{labels.essentials}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="title"
            value={text("title")}
            onChange={(e) => onFieldChange("title", e.target.value)}
            className={`market-input rounded-2xl px-4 py-3${mark("title")}`}
            placeholder={labels.title}
            required
          />
          {labels.slug !== undefined ? (
            <input
              name="slug"
              value={text("slug")}
              onChange={(e) => onFieldChange("slug", e.target.value)}
              className="market-input rounded-2xl px-4 py-3"
              placeholder={labels.slug}
            />
          ) : null}
          <input
            name="summary"
            value={text("summary")}
            onChange={(e) => onFieldChange("summary", e.target.value)}
            className={`market-input rounded-2xl px-4 py-3 sm:col-span-2${mark("summary")}`}
            placeholder={labels.summary}
            required
          />
          <textarea
            name="description"
            value={text("description")}
            onChange={(e) => onFieldChange("description", e.target.value)}
            rows={descriptionRows}
            className={`market-textarea rounded-[1.5rem] px-4 py-3 sm:col-span-2${mark("description")}`}
            placeholder={labels.description}
            required
          />
          <select
            name="category_slug"
            value={text("category_slug")}
            onChange={(e) => onFieldChange("category_slug", e.target.value)}
            aria-label={labels.category}
            className={`market-select rounded-2xl px-4 py-3${mark("category_slug")}`}
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="brand_slug"
            value={text("brand_slug")}
            onChange={(e) => onFieldChange("brand_slug", e.target.value)}
            aria-label={labels.brand}
            className="market-select rounded-2xl px-4 py-3"
          >
            <option value="">{labels.noBrand}</option>
            {brands.map((brand) => (
              <option key={brand.slug} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </section>
      {media}
      <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
        <p className="market-kicker">{labels.pricingStock}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="base_price"
            type="number"
            value={text("base_price")}
            onChange={(e) => onFieldChange("base_price", e.target.value)}
            className="market-input rounded-2xl px-4 py-3"
            placeholder={labels.basePrice}
            required
          />
          <input
            name="compare_at_price"
            type="number"
            value={text("compare_at_price")}
            onChange={(e) => onFieldChange("compare_at_price", e.target.value)}
            className="market-input rounded-2xl px-4 py-3"
            placeholder={labels.compareAtPrice}
          />
          <input
            name="stock"
            type="number"
            value={text("stock")}
            onChange={(e) => onFieldChange("stock", e.target.value)}
            className="market-input rounded-2xl px-4 py-3"
            placeholder={labels.stock}
            required
          />
          <input
            name="sku"
            value={text("sku")}
            onChange={(e) => onFieldChange("sku", e.target.value)}
            className="market-input rounded-2xl px-4 py-3"
            placeholder={labels.sku}
            required
          />
          <input
            name="lead_time"
            value={text("lead_time")}
            onChange={(e) => onFieldChange("lead_time", e.target.value)}
            className={`market-input rounded-2xl px-4 py-3${mark("lead_time")}`}
            placeholder={labels.leadTime}
          />
        </div>
      </section>
      <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
        <p className="market-kicker">{labels.fulfillmentTrust}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="delivery_note"
            value={text("delivery_note")}
            onChange={(e) => onFieldChange("delivery_note", e.target.value)}
            className={`market-input rounded-2xl px-4 py-3 sm:col-span-2${mark("delivery_note")}`}
            placeholder={labels.deliveryNote}
          />
          <input
            name="material"
            value={text("material")}
            onChange={(e) => onFieldChange("material", e.target.value)}
            className={`market-input rounded-2xl px-4 py-3${mark("material")}`}
            placeholder={labels.material}
          />
          <input
            name="warranty"
            value={text("warranty")}
            onChange={(e) => onFieldChange("warranty", e.target.value)}
            className={`market-input rounded-2xl px-4 py-3${mark("warranty")}`}
            placeholder={labels.warranty}
          />
        </div>
        <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
          <input
            type="checkbox"
            name="cod_eligible"
            checked={flag("cod_eligible")}
            onChange={(e) => onFieldChange("cod_eligible", e.target.checked)}
          />
          <span className="text-sm text-[var(--market-ink)]">{labels.codEligible}</span>
        </label>
        {labels.featureRequested !== undefined ? (
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
            <input
              type="checkbox"
              name="feature_requested"
              checked={flag("feature_requested")}
              onChange={(e) => onFieldChange("feature_requested", e.target.checked)}
            />
            <span className="text-sm text-[var(--market-ink)]">{labels.featureRequested}</span>
          </label>
        ) : null}
      </section>
    </>
  );
}
