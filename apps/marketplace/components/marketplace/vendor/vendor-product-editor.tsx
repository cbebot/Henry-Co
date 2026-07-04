"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import {
  DraftWithIntelligencePanel,
  type DraftPanelCopy,
} from "@/components/marketplace/ai/DraftWithIntelligencePanel";
import {
  ProductFormFields,
  buildInitialProductFieldValues,
  type ProductFormLabels,
  type ProductOption,
} from "@/components/marketplace/vendor/product-form-fields";
import {
  applyDraftToFields,
  type ListingDraftInput,
  type ProductFieldValues,
} from "@/lib/marketplace/vendor/draft-apply";

const HIGHLIGHT_MS = 6000;

type FormConfig = Omit<ComponentProps<typeof MarketplaceActionForm>, "children" | "onSuccess">;

/** Same includes() matching the old DOM `fillCategory` used, over the passed
 *  options instead of live `<option>` elements. */
function matchCategoryOption(label: string, options: ProductOption[]): string | null {
  const needle = label.trim().toLowerCase();
  if (!needle) return null;
  const match = options.find(
    (option) =>
      option.slug.toLowerCase().includes(needle) || option.name.toLowerCase().includes(needle),
  );
  return match ? match.slug : null;
}

/**
 * The vendor product editor: ONE state owner for the whole form. The Henry
 * Onyx Intelligence panel applies its draft through the typed `onApply`
 * callback into this state — the pure `applyDraftToFields` pipeline decides
 * what changes (core copy overwrites; facts fill only when empty; nothing is
 * ever blanked). No DOM queries anywhere in the apply path.
 *
 * Server pages keep their responsibilities: they load data, gate the AI panel
 * behind its flag, translate every string, and pass it all down. The posted
 * field-name set is byte-identical to the previous uncontrolled form.
 */
export function VendorProductEditor({
  form,
  fields,
  media,
  draftPanel,
  beforeForm,
}: {
  form: FormConfig;
  fields: {
    initial?: Partial<ProductFieldValues>;
    categories: ProductOption[];
    brands: ProductOption[];
    labels: ProductFormLabels;
    descriptionRows?: number;
  };
  /** The Media section (ImageUploadField) — rendered between Essentials and Pricing & stock, as before. */
  media?: ReactNode;
  /** When set, the draft panel renders above the form and applies via state. */
  draftPanel?: { copy: DraftPanelCopy; appliedNote: string };
  /** Server-rendered content between the panel and the form (e.g. seller economics). */
  beforeForm?: ReactNode;
}) {
  const [values, setValues] = useState<ProductFieldValues>(() =>
    buildInitialProductFieldValues(fields.initial ?? {}, fields.categories),
  );
  const [appliedNote, setAppliedNote] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
    },
    [],
  );

  function onFieldChange(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Editing a field is the seller taking over — drop its applied mark.
    setHighlighted((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : prev));
  }

  function handleApply(draft: ListingDraftInput, idea: string) {
    const { next, applied } = applyDraftToFields(draft, values, idea);
    const categorySlug = matchCategoryOption(draft.category ?? "", fields.categories);
    if (categorySlug && categorySlug !== next.category_slug) {
      next.category_slug = categorySlug;
      applied.push("category_slug");
    }
    if (applied.length === 0) return;
    setValues(next);
    setAppliedNote(draftPanel?.appliedNote ?? null);
    setHighlighted(applied);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlighted([]), HIGHLIGHT_MS);
  }

  function handleSuccess() {
    if (!form.resetOnSuccess) return;
    setValues(buildInitialProductFieldValues(fields.initial ?? {}, fields.categories));
    setAppliedNote(null);
    setHighlighted([]);
  }

  return (
    <>
      {draftPanel ? (
        <DraftWithIntelligencePanel copy={draftPanel.copy} onApply={handleApply} />
      ) : null}
      {beforeForm}
      <MarketplaceActionForm {...form} onSuccess={handleSuccess}>
        <p
          role="status"
          className={
            appliedNote
              ? "rounded-[1.25rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-ink)]"
              : "sr-only"
          }
        >
          {appliedNote ?? ""}
        </p>
        <ProductFormFields
          values={values}
          onFieldChange={onFieldChange}
          categories={fields.categories}
          brands={fields.brands}
          labels={fields.labels}
          descriptionRows={fields.descriptionRows}
          highlightedFields={highlighted}
          media={media}
        />
      </MarketplaceActionForm>
    </>
  );
}
